const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../dbConfig');
const logger = require('./logger');
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
    const { taskname, description, manpower_required, timeslot } = req.body;

    const q = "INSERT INTO tasks (taskname, description, manpower_required, timeslot) VALUES (?, ?, ?, ?)";
    const values = [taskname, description, manpower_required, timeslot];
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

// update task details /task/:id
exports.updateTask = (req, res) => {
    const taskid = req.params.id;
    const updates = [];
    const values = [];

    // Dynamically build the update query and values array
    for (const [key, value] of Object.entries(req.body)) {
        if (key === 'requirements' && Array.isArray(value)) {
            // Convert array to comma-separated string for 'requirements'
            values.push(value.join(', '));
            updates.push(`${key} = ?`);
        } else if (value) { // Only add non-empty fields
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
