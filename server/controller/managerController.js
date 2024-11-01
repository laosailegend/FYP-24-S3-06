const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../dbConfig');
const logger = require('../utils/logger');
const SECRET_KEY = process.env.JWT_SECRET;

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

// #81 Manager create task /createTask
exports.createTask = (req, res) => {
    const { taskname, description, manpower_required, task_date, start_time, end_time } = req.body; 

    const q = "INSERT INTO tasks (taskname, description, manpower_required, task_date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)";
    const values = [taskname, description, manpower_required, task_date, start_time, end_time];

    db.query(q, values, (err, data) => {
        if (err) {
            console.error("Database error:", err);  // Log detailed error
            return res.status(500).json({
                message: "Failed to create task",
                error: err.message || "An unknown error occurred" // Provide clear message
            });
        }
        return res.status(201).json("Task created successfully");
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
        return res.status(200).json("Task details updated successfully");
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

//Manager auto schedule
async function autoSchedule(tasks, users) {
    const schedule = [];
    const dayMap = {
        'M': '1',
        'Tu': '2',
        'W': '3',
        'Th': '4',
        'F': '5',
        'Sa': '6',
        'Su': '0'
    };

    // Sort tasks by manpower required (greedy approach)
    tasks.sort((a, b) => b.manpower_required - a.manpower_required);

    // Loop through each task and assign it to available employees
    for (const task of tasks) {
        const requiredManpower = parseInt(task.manpower_required, 10);
        let assignedEmployees = 0;

        // Convert task date to day of the week (numerical)
        const taskDate = new Date(task.task_date);
        const dayOfWeek = taskDate.getDay(); // 0-6 (Sunday-Saturday)

        // Find available employees for the task
        for (const emp of users) {
            // Check if employee is available on the corresponding day and has the required skillset
            const availableDays = emp.availability ? emp.availability.split(',').map(day => dayMap[day.trim()]) : [];

            console.log(`Checking emp ${emp.userid} with skill_id ${emp.skill_id} against task skill_id ${task.skill_id}`);

            if (availableDays.includes(dayOfWeek.toString()) && emp.skill_id === task.skill_id && assignedEmployees < requiredManpower) {
                // Check if the assignment already exists
                const checkAssignmentQuery = `
                    SELECT * FROM assignments 
                    WHERE taskid = ? AND userid = ?`;
                
                const results = await new Promise((resolve, reject) => {
                    db.query(checkAssignmentQuery, [task.taskid, emp.userid], (err, results) => {
                        if (err) {
                            console.error("Error checking existing assignment:", err);
                            return reject(err);
                        }
                        resolve(results);
                    });
                });

                // If no existing assignment, add to the schedule
                if (results.length === 0) {
                    schedule.push({
                        taskid: task.taskid,
                        userid: emp.userid,
                        taskname: task.taskname,
                        timeslot: task.task_date, // Adjust timeslot if needed
                        skill_id: emp.skill_id // Use the correct skill_id
                    });
                    assignedEmployees++;
                }

                if (assignedEmployees === requiredManpower) {
                    break; // Stop checking for more employees if required manpower is met
                }
            }
        }

        // Handle tasks that couldn't be fully assigned
        if (assignedEmployees < requiredManpower) {
            console.log(`Task ${task.taskname} could not be fully assigned. Required: ${requiredManpower}, Assigned: ${assignedEmployees}`);
        }
    }

    // Finalize assignments and insert them into the database
    await finalizeAssignments(schedule, tasks);
}

// Finalize assignments function
async function finalizeAssignments(schedule, tasks) {
    // Prepare the insert query
    const insertQuery = `INSERT INTO assignments (taskid, userid, assigned_date, skill_id, start_time, end_time) VALUES ?`;
    const values = schedule.map((assignment) => {
        const task = tasks.find(t => t.taskid === assignment.taskid); // Find the task to get the times
        return [
            assignment.taskid,
            assignment.userid,
            new Date(), // Current date
            assignment.skill_id,
            task.start_time, // Use the task's start_time
            task.end_time    // Use the task's end_time
        ];
    });

    // Execute the insert if values are not empty
    if (values.length > 0) {
        await new Promise((resolve, reject) => {
            db.query(insertQuery, [values], (err) => {
                if (err) {
                    console.error("Error inserting assignments:", err);
                    return reject(err);
                } else {
                    console.log("Assignments inserted successfully");
                    resolve();
                }
            });
        });
    } else {
        console.log("No assignments to insert.");
    }
}

// initiate auto scheduling /autoSchedule
exports.autoScheduling = async (req, res) => {
    try {
        // Check if the database connection is working by logging the connection status
        if (!db) {
            console.error("Database connection is not established.");
            return res.status(500).json({ message: "Database connection not available" });
        }

        // Test the current date retrieval
        console.log("Attempting to fetch current date from the database...");

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

        console.log("Current date from database:", todayDate); // Log the current date

        // Log the date being used to fetch tasks
        console.log("Fetching tasks for date:", todayDate);

        // Now fetch tasks based on today's date
        const tasks = await new Promise((resolve, reject) => {
            const getTasksQuery = `SELECT * FROM tasks WHERE task_date = ?`; // Use parameterized query
            db.query(getTasksQuery, [todayDate], (err, tasks) => {
                if (err) {
                    console.error("Error fetching tasks:", err);
                    return reject(err);
                }
                resolve(tasks);
            });
        });

        console.log("Fetched tasks:", tasks); // Log the tasks array

        if (!Array.isArray(tasks)) {
            console.error("Tasks is not an array:", tasks);
            return res.status(500).json({ message: "Tasks data format is invalid" });
        }

        // Fetch users directly from the users table for availability
        const users = await new Promise((resolve, reject) => {
            const getUsersQuery = "SELECT * FROM users"; // Fetch from the `users` table
            db.query(getUsersQuery, (err, users) => {
                if (err) {
                    console.error("Error fetching users:", err);
                    return reject(err);
                }
                resolve(users);
            });
        });

        // Call the scheduling function
        const schedule = await autoSchedule(tasks, users);
        return res.status(200).json(schedule);
    } catch (error) {
        console.error("Error in /autoSchedule:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};