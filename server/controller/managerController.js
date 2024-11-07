const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../dbConfig');
const logger = require('../utils/logger');
const SECRET_KEY = process.env.JWT_SECRET;
const cron = require('node-cron');
const mysql = require('mysql'); // Keep using the mysql package
const axios = require('axios'); // For making API calls
const moment = require('moment'); // For date handling

// retrieve user details without password/NRIC for managers only
exports.managerGetUsers = (req, res) => {
    // inner join to also get their role type as well
    const q = "SELECT fname, lname, contact, email FROM users";
    db.query(q, (err, data) => {
        if (err) {
            console.log(err);
            return res.json(err)
        }
        return res.json(data);
    })
};

exports.createTask = (req, res) => {
    const { taskname, description, manpower_required, task_date, start_time, end_time, country_code, industryid } = req.body;

    // Function to check if a date is a weekend (Saturday or Sunday)
    const isWeekend = (date) => {
        const day = new Date(date).getDay(); // 0: Sunday, 6: Saturday
        return day === 0 || day === 6 ? 'yes' : 'no';
    };

    // Check if the task date is a public holiday
    const checkHoliday = async (task_date, country_code) => {
        try {
            const response = await axios.get(`https://date.nager.at/api/v3/publicholidays/${task_date.split('-')[0]}/${country_code}`);
            const holidays = response.data;
            const isHoliday = holidays.some(holiday => holiday.date === task_date) ? 'yes' : 'no';
            return isHoliday;
        } catch (error) {
            console.error("Error checking holidays:", error);
            return 'no'; // Default to 'no' if the API call fails
        }
    };

    // Determine if the task date is a public holiday or weekend
    const isWeekendStatus = isWeekend(task_date);
    checkHoliday(task_date, country_code).then(isHolidayStatus => {
        // Insert the new task into the tasks table
        const q = "INSERT INTO tasks (taskname, description, manpower_required, task_date, start_time, end_time, country_code, isWeekend, isHoliday, industryid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const values = [taskname, description, manpower_required, task_date, start_time, end_time, country_code, isWeekendStatus, isHolidayStatus, industryid];

        db.query(q, values, (err, data) => {
            if (err) {
                console.error("Database error:", err);  // Log detailed error
                return res.status(500).json({
                    message: "Failed to create task",
                    error: err.message || "An unknown error occurred" // Provide clear message
                });
            }

            const taskid = data.insertId;  // Assuming taskid is generated and returned

            // Now update the corresponding assignments with isWeekend and isHoliday status
            const updateAssignmentsQuery = `
                UPDATE assignments
                SET weekends = ?, public_holiday = ?
                WHERE assigned_date = ?`;
            const assignmentValues = [isWeekendStatus, isHolidayStatus, task_date]; // Update all assignments with matching task date

            db.query(updateAssignmentsQuery, assignmentValues, (err) => {
                if (err) {
                    console.error("Error updating assignments:", err);
                    return res.status(500).json({
                        message: "Failed to update assignments",
                        error: err.message || "An unknown error occurred"
                    });
                }

                return res.status(201).json("Task created and assignments updated successfully");
            });
        });
    }).catch(err => {
        console.error("Error checking public holiday:", err);
        return res.status(500).json({
            message: "Failed to check public holiday status",
            error: err.message || "An unknown error occurred"
        });
    });
};

// #82 Get all tasks /tasks
exports.getTasks = (req, res) => {
    const q = "SELECT * FROM tasks";
    db.query(q, (err, data) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({
                message: "Failed to fetch tasks",
                error: err.message || "An unknown error occurred"
            });
        }
        console.log('Tasks fetched:', data); // Log tasks data
        return res.status(200).json(data);
    });
};

// #15 Manager update task details /task/:id
exports.updateTask = (req, res) => {
    const taskid = req.params.id;
    const updates = [];
    const values = [];

    // Function to check if a date is a weekend (Saturday or Sunday)
    const isWeekend = (date) => {
        const day = new Date(date).getDay(); // 0: Sunday, 6: Saturday
        return day === 0 || day === 6 ? 'yes' : 'no';
    };

    // Check if the task date is a public holiday
    const checkHoliday = async (task_date, country_code) => {
        try {
            const response = await axios.get(`https://date.nager.at/api/v3/publicholidays/${task_date.split('-')[0]}/${country_code}`);
            const holidays = response.data;
            const isHoliday = holidays.some(holiday => holiday.date === task_date) ? 'yes' : 'no';
            return isHoliday;
        } catch (error) {
            console.error("Error checking holidays:", error);
            return 'no'; // Default to 'no' if the API call fails
        }
    };

    // Dynamically build the update query and values array
    for (const [key, value] of Object.entries(req.body)) {
        // Only include specified fields
        if (key === 'taskname' || key === 'description' || key === 'manpower_required' || key === 'task_date' || key === 'start_time' || key === 'end_time') {
            values.push(value);
            updates.push(`${key} = ?`);
        }
    }

    if (updates.length === 0) {
        return res.status(400).json("No updates provided");
    }

    values.push(taskid);
    const q = `UPDATE tasks SET ${updates.join(', ')} WHERE taskid = ?`;

    db.query(q, values, (err, data) => {
        if (err) return res.status(500).json(err);

        // If task date has been updated, check if the weekend or holiday status needs to be updated
        const task_date = req.body.task_date || data.task_date;  // New task date, if updated
        const isWeekendStatus = isWeekend(task_date);

        checkHoliday(task_date, req.body.country_code).then(isHolidayStatus => {
            // Now update the corresponding assignments with isWeekend and isHoliday status
            const updateAssignmentsQuery = `
                UPDATE assignments
                SET weekends = ?, public_holiday = ?
                WHERE assigned_date = ?`;
            const assignmentValues = [isWeekendStatus, isHolidayStatus, task_date]; // Update all assignments with matching task date

            db.query(updateAssignmentsQuery, assignmentValues, (err) => {
                if (err) {
                    console.error("Error updating assignments:", err);
                    return res.status(500).json({
                        message: "Failed to update assignments",
                        error: err.message || "An unknown error occurred"
                    });
                }

                return res.status(200).json("Task updated and assignments updated successfully");
            });
        }).catch(err => {
            console.error("Error checking public holiday:", err);
            return res.status(500).json({
                message: "Failed to check public holiday status",
                error: err.message || "An unknown error occurred"
            });
        });
    });
};

// delete individual task /task/:taskId
exports.deleteTask = (req, res) => {
    const taskId = req.params.taskId;
    const query = 'DELETE FROM tasks WHERE taskid = ?';
    db.query(query, [taskId], (error, results) => {
        if (error) {
            console.error('SQL error:', error);
            return res.status(500).json({ message: 'Error deleting task' });
        }
        res.status(200).json({ message: 'Task deleted successfully' });
    });
};

// #3 Manager retrieve employee particulars /employees
exports.getEmployees = (req, res) => {
    // Extract query parameters
    const { userid, fname, lname, email, contact, roleid } = req.query;

    // Base query
    let q = "SELECT fname, lname, email, contact FROM users";
    const values = [];

    // Add conditions based on provided parameters
    if (roleid) {
        q += " WHERE roleid = ?";
        values.push(roleid);
    } else {
        q += " WHERE 1=1"; // Ensures that WHERE clause is valid if no roleid is provided
    }


    if (fname) {
        q += " AND fname LIKE ?";
        values.push(`%${fname}%`);
    }
    if (lname) {
        q += " AND lname LIKE ?";
        values.push(`%${lname}%`);
    }
    if (email) {
        q += " AND email LIKE ?";
        values.push(`%${email}%`);
    }
    if (contact) {
        q += " AND contact LIKE ?";
        values.push(`%${contact}%`);
    }

    // Execute query
    db.query(q, values, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json(data);
    });
};

// #42 Manager update timeslot /task/:id/timeslot
exports.updateTimeslot = (req, res) => {
    const taskid = req.params.id;
    const q = "UPDATE tasks SET timeslot = ? WHERE taskid = ?";
    const values = [req.body.timeslot, taskid];

    db.query(q, values, (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to update timeslot" });
        }
        return res.json("Timeslot updated successfully");
    });
};

// #16 Manager delete timeslot /task/:id/timeslot
exports.deleteTimeslot = (req, res) => {
    const taskid = req.params.id;
    const q = "UPDATE tasks SET timeslot = NULL WHERE taskid = ?"; // Assuming we set it to null to remove the timeslot

    db.query(q, [taskid], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json("Timeslot removed successfully");
    });
};

//overview of schedules '/schedules
exports.getSchedules = (req, res) => {
    const shiftDate = req.query.shift_date;

    // Base SQL query
    let query = `
        SELECT 
        schedules.schedule_id, 
        schedules.shift_date, 
        schedules.start_time, 
        schedules.end_time, 
        schedules.salary, 
        COALESCE(users.fname, 'NULL') AS fname, 
        COALESCE(users.lname, '') AS lname 
        FROM 
        schedules 
        LEFT JOIN 
        users ON schedules.userid = users.userid
    `;

    // Add condition for shift_date if provided
    if (shiftDate) {
        query += ' WHERE schedules.shift_date = ?';
    }

    // Execute the query
    db.query(query, shiftDate ? [shiftDate] : [], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.message);
            return res.status(500).json({ error: 'Failed to retrieve schedules', details: err.message });
        }
        console.log('Query Results:', results); // Log the results for debugging
        res.json(results);
    });
};

//add schedule /addSchedules
exports.addSchedules = (req, res) => {
    const { shift_date, start_time, end_time, salary, userid } = req.body;

    if (!shift_date || !start_time || !end_time || !salary) {
        return res.status(400).send({ error: 'All fields (shift_date, start_time, end_time, salary) are required' });
    }

    const query = `
        INSERT INTO schedules (shift_date, start_time, end_time, salary, userid)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(query, [shift_date, start_time, end_time, salary, userid || null], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send(err);
        }
        res.status(201).json({ id: results.insertId });
    });
};

// /updateSchedules/:id
exports.updateSchedule = (req, res) => {
    const { shift_date, start_time, end_time, salary, userid } = req.body;
    const { id } = req.params; // Get the schedule ID from the URL params

    // Validate input values
    if (!shift_date || !start_time || !end_time || !salary || !userid || !id) {
        return res.status(400).send({ error: 'Missing required fields' });
    }

    // Extract the date part (YYYY-MM-DD) from shift_date
    const formattedShiftDate = shift_date.split('T')[0]; // '2024-08-22'

    const query = `
        UPDATE schedules
        SET shift_date = ?, start_time = ?, end_time = ?, salary = ?, userid = ?
        WHERE schedule_id = ?
    `;

    // Ensure the values are in the correct order
    const values = [formattedShiftDate, start_time, end_time, salary, userid, id];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error executing query:', err.message);
            return res.status(500).send({ error: 'Failed to update schedule', details: err.message });
        }

        // If no rows were affected, it means the schedule ID was not found
        if (results.affectedRows === 0) {
            return res.status(404).send({ error: 'Schedule not found' });
        }

        res.send({ success: true, results });
    });
};


// Delete schedule /deleteSchedules/:id
exports.deleteSchedule = (req, res) => {
    const { id } = req.params;

    const query = `
        DELETE FROM schedules
        WHERE schedule_id = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send({ error: 'Failed to delete shift' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).send({ error: 'Shift not found' });
        }
        res.send({ message: 'Shift deleted successfully' });
    });
};

// Schedule the autoScheduling function to run every 15 seconds
cron.schedule('*/15 * * * * *', async () => {
    console.log("Running auto-scheduling job...");
    try {
        await autoScheduling();
    } catch (error) {
        console.error("Error during auto-scheduling:", error);
    }
});

const autoScheduling = async () => {
    try {
        const todayDate = new Date(); // Get current date from the system

        // Fetch all future open tasks
        const tasks = await new Promise((resolve, reject) => {
            db.query("SELECT * FROM tasks WHERE task_date >= CURDATE() AND task_status = 'open'", (err, tasks) => {
                if (err) return reject(err);
                resolve(tasks);
            });
        });

        const users = await new Promise((resolve, reject) => {
            db.query("SELECT * FROM users", (err, users) => {
                if (err) return reject(err);
                resolve(users);
            });
        });

        await autoSchedule(tasks, users);
    } catch (error) {
        console.error("Error in autoScheduling:", error);
    }
};

async function autoSchedule(tasks, users) {
    const schedule = [];
    const dayMap = { 'M': '1', 'Tu': '2', 'W': '3', 'Th': '4', 'F': '5', 'Sa': '6', 'Su': '0' };

    const assignedUsers = new Set(); // Track users who are already assigned to a task

    for (const task of tasks) {
        const requiredManpower = parseInt(task.manpower_required, 10);
        let assignedEmployees = 0;

        console.log("Required Manpower for Task:", requiredManpower); // Log required manpower

        const taskDate = new Date(task.task_date); // Convert task_date to Date object
        taskDate.setUTCHours(0, 0, 0, 0); // Set the time of taskDate to midnight in UTC (to prevent time zone issues)

        // Convert to local timezone using toLocaleString
        const localTaskDateStr = taskDate.toLocaleString('en-US', { timeZone: 'Asia/Singapore' });
        const localTaskDate = new Date(localTaskDateStr);

        console.log("Local Task Date:", localTaskDate); // Log the corrected task date

        const dayOfWeek = localTaskDate.getDay();
        console.log("Local Task Day of Week:", dayOfWeek); // Log the task day of the week

        const usersAvailableOnTask = await new Promise((resolve, reject) => {
            const getUsersQuery = `
                SELECT u.userid, u.fname, u.lname, u.availability, u.posid, p.industryid
                FROM users u
                JOIN positions p ON u.posid = p.posid
                WHERE FIND_IN_SET(
                    CASE
                        WHEN DAYOFWEEK(?) = 1 THEN 'M'
                        WHEN DAYOFWEEK(?) = 2 THEN 'Tu'
                        WHEN DAYOFWEEK(?) = 3 THEN 'W'
                        WHEN DAYOFWEEK(?) = 4 THEN 'Th'
                        WHEN DAYOFWEEK(?) = 5 THEN 'F'
                        WHEN DAYOFWEEK(?) = 6 THEN 'Sa'
                        WHEN DAYOFWEEK(?) = 0 THEN 'Su'
                    END,
                    u.availability
                ) > 0 AND u.roleid = 3`;

            db.query(getUsersQuery, [taskDate, taskDate, taskDate, taskDate, taskDate, taskDate, taskDate], (err, users) => {
                if (err) {
                    console.error("Error fetching users:", err);
                    return reject(err);
                }
                resolve(users);
            });
        });

        // Function to map posid ranges to industryid
        function getIndustryForPosid(posid) {
            if (posid >= 1 && posid <= 5) return 2;  // Sales jobs linked to industryid 2
            if (posid >= 6 && posid <= 8) return 7;  // Education jobs linked to industryid 7
            if (posid >= 9 && posid <= 11) return 9; // Restaurant jobs linked to industryid 9
            if (posid >= 12 && posid <= 14) return 1; // Healthcare jobs linked to industryid 1
            if (posid >= 15 && posid <= 17) return 3; // IT jobs linked to industryid 3
            if (posid >= 18 && posid <= 20) return 10; // Transportation jobs linked to industryid 10
            return null; // If posid doesn't fall into any of the specified ranges
        }

        // **Skip task if industryid is null**
        if (task.industryid === null) {
            console.log("Task industryid is null. Skipping task:", task.taskid);
            continue; // Skip this task if industryid is null
        }

        console.log("Task industryid:", task.industryid); // Log the task's industryid for debugging

        for (const emp of usersAvailableOnTask) {
            const userIndustryid = getIndustryForPosid(emp.posid); // Get the industryid for the user based on posid

            if (userIndustryid === null) {
                console.log("Skipping user, posid does not have a valid industry mapping:", emp.posid);
                continue; // Skip the user if no valid industry mapping exists
            }

            console.log("Task industryid:", task.industryid); // Log the task's industryid
            console.log("User industryid from mapping:", userIndustryid); // Log the user's industryid for comparison

            // Compare user's industryid with task's industryid
            if (userIndustryid !== task.industryid) {
                console.log("Skipping user due to mismatch: posid doesn't match industryid");
                continue; // Skip the user if their industry doesn't match the task's industry
            }

            const availableDays = emp.availability ? emp.availability.split(',').map(day => dayMap[day.trim()]) : [];
            console.log("Employee Availability:", availableDays); // Log employee availability
            console.log("Task Day of Week:", dayOfWeek); // Log task day of the week

            if (availableDays.includes(dayOfWeek.toString()) && assignedEmployees < requiredManpower && !assignedUsers.has(emp.userid)) {
                const clashQuery = `
                    SELECT * FROM assignments 
                    WHERE userid = ? 
                    AND assigned_date = ? 
                    AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?))`;

                const clashResults = await new Promise((resolve, reject) => {
                    db.query(clashQuery, [emp.userid, task.task_date, task.end_time, task.start_time, task.start_time, task.end_time], (err, results) => {
                        if (err) return reject(err);
                        resolve(results);
                    });
                });

                if (clashResults.length === 0) {
                    console.log("Assigning Task to User:", {
                        taskid: task.taskid,
                        userid: emp.userid,
                        taskname: task.taskname,
                        assigned_date: task.task_date,
                        start_time: task.start_time,
                        end_time: task.end_time,
                    }); // Log task assignment details

                    schedule.push({
                        taskid: task.taskid,
                        userid: emp.userid,
                        taskname: task.taskname,
                        assigned_date: task.task_date,
                        start_time: task.start_time,
                        end_time: task.end_time,
                    });
                    assignedEmployees++;
                    assignedUsers.add(emp.userid); // Mark user as assigned for this task

                    if (assignedEmployees === requiredManpower) {
                        // Update task status to closed if manpower requirement is met
                        await new Promise((resolve, reject) => {
                            db.query("UPDATE tasks SET task_status = 'closed' WHERE taskid = ?", [task.taskid], (err) => {
                                if (err) return reject(err);
                                resolve();
                            });
                        });
                        break;
                    }
                }
            }
        }
    }

    console.log("Final Schedule Assignments:", schedule); // Log final assignments after loop

    await finalizeAssignments(schedule);
}


async function finalizeAssignments(schedule) {
    const insertQuery = `
        INSERT INTO assignments (taskid, userid, assigned_date, start_time, end_time) 
        VALUES ?`;

    const values = schedule.map(assignment => [
        assignment.taskid,
        assignment.userid,
        assignment.assigned_date,
        assignment.start_time,
        assignment.end_time
    ]);

    if (values.length > 0) {
        await new Promise((resolve, reject) => {
            db.query(insertQuery, [values], (err) => {
                if (err) return reject(err);
                console.log("Assignments inserted successfully");
                resolve();
            });
        });
    } else {
        console.log("No assignments to insert.");
    }
}

// Initiate auto scheduling through an API endpoint
exports.autoScheduling = async (req, res) => {
    try {
        if (!db) {
            console.error("Database connection is not established.");
            return res.status(500).json({ message: "Database connection not available" });
        }

        const todayDate = await new Promise((resolve, reject) => {
            db.query("SELECT CURDATE() AS today", (err, result) => {
                if (err) {
                    console.error("Error fetching current date:", err);
                    return reject(err);
                }
                if (!result || result.length === 0) {
                    console.error("No result returned for current date.");
                    return reject(new Error("No current date returned"));
                }
                resolve(result[0].today);
            });
        });

        console.log("Current date from database:", todayDate);

        const tasks = await new Promise((resolve, reject) => {
            const getTasksQuery = `SELECT * FROM tasks WHERE task_date >= CURDATE()`;
            db.query(getTasksQuery, (err, tasks) => {
                if (err) {
                    console.error("Error fetching tasks:", err);
                    return reject(err);
                }
                resolve(tasks);
            });
        });

        console.log("Fetched tasks:", tasks);

        if (!Array.isArray(tasks)) {
            console.error("Tasks is not an array:", tasks);
            return res.status(500).json({ message: "Tasks data format is invalid" });
        }

        // Fetch users with roleid 3 from the users table for availability
        const users = await new Promise((resolve, reject) => {
            const getUsersQuery = "SELECT * FROM users WHERE roleid = 3"; // Filter by roleid
            db.query(getUsersQuery, (err, users) => {
                if (err) {
                    console.error("Error fetching users:", err);
                    return reject(err);
                }
                resolve(users);
            });
        });

        const schedule = await autoSchedule(tasks, users);
        return res.status(200).json(schedule);
    } catch (error) {
        console.error("Error in /autoSchedule:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// API endpoint to fetch assignments
exports.Assignments = (req, res) => {
    const q = "SELECT * FROM assignments";
    db.query(q, (err, results) => {
        if (err) {
            console.error("Error fetching assignments:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
        console.log("Fetched assignments:", results);
        return res.status(200).json(results);
    });
};