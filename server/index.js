require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./dbConfig');

// parse every request as json
app.use(express.json());

// enable cors
app.use(cors());

const SECRET_KEY = process.env.JWT_SECRET;

app.get("/", (req, res) => {
    res.send("Homepage");
})

// login
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    const q = "SELECT * FROM users WHERE email = ?";

    db.query(q, [email], async (err, data) => {
        if (err) return res.status(500).json({ error: "Database error" });

        // If no user is found with the provided email
        if (data.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = data[0];


        // Compare the provided password with the hashed password in the database
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        //gen jwt token
        const token = jwt.sign(
            { id: user.userid, email: user.email, role: user.roleid, fname: user.fname, lname: user.lname },
            SECRET_KEY,
            { expiresIn: '1d' } // Token expires in 1 day
        );
        // console.log(JSON.parse(atob(token.split('.')[1])));

        return res.json({ message: "Login successful", token });
    });
})

// question mark is used to prevent SQL injection
// #21 admin create user accounts
app.post("/createUser", (req, res) => {
    const q = "INSERT INTO users (`roleid`, `nric`, `fname`, `lname`, `contact`, `email`, `password`) VALUES (?)"

    // password hashing, then store the hash in the db
    const saltRounds = 10;
    const password = req.body.password;

    // hash + salt 
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) return;

        const values = [req.body.roleid, req.body.nric, req.body.fname, req.body.lname, req.body.contact, req.body.email, hash]

        db.query(q, [values], (err, data) => {
            if (err) return res.json(err);
            return res.json("user created successfully");
        })
    })
});

// #43 retrieve user details (actually its only admin details but ill just do retrieve a list of deets lol)
app.get("/users", (req, res) => {
    // inner join to also get their role type as well
    const q = "SELECT * FROM users INNER JOIN roles ON users.roleid = roles.roleid"
    db.query(q, (err, data) => {
        if (err) {
            console.log(err);
            return res.json(err)
        }
        return res.json(data);
    })
})

// retrive role details
app.get("/roles", (req, res) => {
    const q = "SELECT * FROM roles"
    db.query(q, (err, data) => {
        if (err) {
            return res.json(err)
        }
        return res.json(data);
    })
});

// #44 update user details - modified so that those empty fields are removed
app.put("/user/:id", (req, res) => {
    const saltRounds = 10;

    const userid = req.params.id;
    const updates = [];
    const values = [];

    // Check if password is being updated
    if (req.body.password) {
        bcrypt.hash(req.body.password, saltRounds, (err, hashedPassword) => {
            if (err) return res.status(500).json("Error hashing password");

            // Add password update to the query
            updates.push('password = ?');
            values.push(hashedPassword);

            // Process other fields
            for (const [key, value] of Object.entries(req.body)) {
                if (value && key !== 'password') { // Skip the password field as it’s handled separately
                    updates.push(`${key} = ?`);
                    values.push(value);
                }
            }

            // Add the user id as the last value for the WHERE clause
            values.push(userid);

            // Construct the SQL query
            const q = `UPDATE users SET ${updates.join(', ')} WHERE userid = ?`;

            // Execute the query
            db.query(q, values, (err, data) => {
                if (err) return res.json(err);
                return res.json("User info has been updated successfully");
            });
        });
    } else {
        // No password update, handle as usual
        for (const [key, value] of Object.entries(req.body)) {
            if (value) { // Only add non-empty fields
                updates.push(`${key} = ?`);
                values.push(value);
            }
        }

        // If there are no updates, return early
        if (updates.length === 0) {
            return res.json("No updates provided");
        }

        // Add the user id as the last value for the WHERE clause
        values.push(userid);

        // Construct the SQL query
        const q = `UPDATE users SET ${updates.join(', ')} WHERE userid = ?`;

        // Execute the query
        db.query(q, values, (err, data) => {
            if (err) return res.json(err);
            return res.json("User info has been updated successfully");
        });
    }
})

// #45 delete user account
app.delete("/user/:id", (req, res) => {
    const userid = req.params.id;
    const q = "DELETE FROM users WHERE userid = ?"

    db.query(q, [userid], (err, data) => {
        if (err) return res.json(err);
        return res.json("book has been deleted succ.");
    })
})

// get all permissions to display on the admin page
app.get("/permissions", (req, res) => {
    const q = "SELECT permissions.*, roles.role FROM roles INNER JOIN permissions ON `roles`.roleid = permissions.roleid;";
    db.query(q, (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
})

// update permissions
app.put("/updatePerms/:id", (req, res) => {
    const permission_id = req.params.id; // Extract the permission_id from the URL
    const { can_create, can_read, can_update, can_delete } = req.body; // Extract the permission fields from the request body

    // Validate the required fields
    if (can_create === undefined || can_read === undefined || can_update === undefined || can_delete === undefined) {
        return res.status(400).json({ error: "Invalid data format. Missing permission fields." });
    }

    // SQL query to update the permission based on permission_id
    const query = `
        UPDATE permissions 
        SET can_create = ?, can_read = ?, can_update = ?, can_delete = ? 
        WHERE permission_id = ?
    `;
    const values = [can_create, can_read, can_update, can_delete, permission_id];

    // Execute the query
    db.query(query, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "An error occurred while updating the permission." });
        }
        res.json({ message: "Permission updated successfully." });
    });
});

// create permissions
app.post("/createPerms", (req, res) => {
    const { roleid, resource, can_create, can_read, can_update, can_delete } = req.body;

    if (!roleid || !resource || can_create === undefined || can_read === undefined || can_update === undefined || can_delete === undefined) {
        return res.status(400).json({ error: "Invalid data format. Missing permission fields." });
    }

    const query = `
        INSERT INTO permissions (roleid, resource, can_create, can_read, can_update, can_delete) 
        VALUES (?, ?, ?, ?, ?, ?);
    `;
    const values = [roleid, resource, can_create, can_read, can_update, can_delete];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "An error occurred while creating the permission." });
        }

        res.json({ message: "Permission created successfully." });
    });
});


// delete permissions
app.delete("/deletePerms/:id", (req, res) => {
    const permission_id = req.params.id; // Extract the permission_id from the URL
    const query = `DELETE FROM permissions WHERE permission_id = ?`;
    const values = [permission_id];

    // Execute the query
    db.query(query, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "An error occurred while deleting the permission." });
        }
        res.json({ message: "Permission deleted successfully." });
    });
});

// #81 Manager create a task
app.post("/createTask", (req, res) => {
    const q = "INSERT INTO tasks (`taskname`, `description`, `manpower_required`, `timeslot`) VALUES (?, ?, ?, ?)";
    const values = [req.body.taskname, req.body.description, req.body.manpower_required, req.body.timeslot];

    db.query(q, values, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.status(201).json("Task created successfully");
    });
});

// #3 Manager retrieve employee particulars
app.get("/employees", (req, res) => {
    // Extract query parameters
    const { userid, fname, lname, email, contact, roleid } = req.query;

    // Base query
    let q = "SELECT userid, fname, lname, email, contact FROM users";
    const values = [];

    // Add conditions based on provided parameters
    if (roleid) {
        q += " WHERE roleid = ?";
        values.push(roleid);
    } else {
        q += " WHERE 1=1"; // Ensures that WHERE clause is valid if no roleid is provided
    }

    if (userid) {
        q += " AND userid = ?";
        values.push(userid);
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
});

// #42 Manager update timeslot
app.put("/task/:id/timeslot", (req, res) => {
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
});

// #15 Manager update task details
app.put("/task/:id", (req, res) => {
    const taskid = req.params.id;
    const updates = [];
    const values = [];

    // Dynamically build the update query and values array
    for (const [key, value] of Object.entries(req.body)) {
        if (value) { // Only add non-empty fields
            updates.push(`${key} = ?`);
            values.push(value);
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
});


// #17 Manager delete task
app.delete("/task/:id", (req, res) => {
    const taskid = req.params.id;
    const q = "DELETE FROM tasks WHERE taskid = ?";

    db.query(q, [taskid], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json("Task deleted successfully");
    });
});

// #16 Manager delete timeslot
app.delete("/task/:id/timeslot", (req, res) => {
    const taskid = req.params.id;
    const q = "UPDATE tasks SET timeslot = NULL WHERE taskid = ?"; // Assuming we set it to null to remove the timeslot

    db.query(q, [taskid], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json("Timeslot removed successfully");
    });
});

//overview of the schedules
app.get('/schedules', (req, res) => {
    const shiftDate = req.query.shift_date;

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
            users ON schedules.userid = users.userid;
    `;

    // Add date filter if shift_date is provided
    if (shiftDate) {
        query += ' WHERE schedules.shift_date = ?';
    }

    db.query(query, shiftDate ? [shiftDate] : [], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Failed to retrieve schedules' });
        }
        res.json(results);
    });
});

//add schedule
app.post('/addSchedules', (req, res) => {
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
});

// Update schedule
app.put('/updateSchedules/:id', (req, res) => {
    const { shift_date, start_time, end_time, salary, userid } = req.body;
    const { id } = req.params; // Get the schedule ID from the URL params

    // Extract the date part (YYYY-MM-DD) from shift_date
    const formattedShiftDate = shift_date.split('T')[0]; // '2024-08-22'

    const query = `
        UPDATE schedules
        SET shift_date = ?, start_time = ?, end_time = ?, salary = ?, userid = ?
        WHERE schedule_id = ?
    `;

    // Ensure the values are in the correct order
    const values = [formattedShiftDate, start_time, end_time, userid, salary, id];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send({ error: 'Failed to update schedule' });
        }

        // If no rows were affected, it means the schedule ID was not found
        if (results.affectedRows === 0) {
            return res.status(404).send({ error: 'Schedule not found' });
        }

        res.send({ success: true, results });
    });
});


// Delete schedule
app.delete('/deleteSchedules/:id', (req, res) => {
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
});


//13 As a employee, I want to be able to update my availability so that my manager knows my availability
app.put('/updateAvailability/:id', (req, res) => {
    const availabilityId = req.params.id;
    const values = [
        req.body.available_date,
        req.body.start_time,
        req.body.end_time,
        req.body.status
    ];

    const sql = `
        UPDATE availability 
        SET available_date = ?, 
            start_time = ?, 
            end_time = ?, 
            status = ? 
        WHERE availability_id = ?`;

    db.query(sql, [...values, availabilityId], (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.status(200).json("Availability updated successfully");
    });
});

app.listen(8800, console.log("server started on port 8800"));
