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
        console.log(values);
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

// retrieve user details without password/NRIC for managers only
app.get("/managerGetUsers", (req, res) => {
    // inner join to also get their role type as well
    const q = "SELECT fname, lname, contact, email FROM users";
    db.query(q, (err, data) => {
        if (err) {
            console.log(err);
            return res.json(err)
        }
        return res.json(data);
    })
})

// retrieve user details for employees only, no NRIC no password
app.get("/employeeGetUser", (req, res) => {
    // inner join to also get their role type as well
    const q = "SELECT fname, lname, contact, email FROM users INNER JOIN roles ON users.roleid = roles.roleid WHERE userid = ?"
    db.query(q, (err, data) => {
        if (err) {
            console.log(err);
            return res.json(err)
        }
        return res.json(data);
    })
})

// retrieve user details w/o password for HR only + role
app.get("/HRGetUser", (req, res) => {
    // inner join to also get their role type as well
    const q = "SELECT userid, nric, fname, lname, contact, email, role FROM users INNER JOIN roles ON users.roleid = roles.roleid"
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

// delete individual task
app.delete('/task/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    const query = 'DELETE FROM tasks WHERE taskid = ?';
    db.query(query, [taskId], (error, results) => {
        if (error) {
            console.error('SQL error:', error);
            return res.status(500).json({ message: 'Error deleting task' });
        }
        res.status(200).json({ message: 'Task deleted successfully' });
    });
});

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

// #81 Manager create task
app.post("/createTask", (req, res) => {
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
});

// #82 Get all tasks
app.get("/tasks", (req, res) => {
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
});



// #3 Manager retrieve employee particulars
app.get("/employees", (req, res) => {
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
});


// #17 Manager delete task
app.delete('/task/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    const query = 'DELETE FROM tasks WHERE taskid = ?';
    connection.query(query, [taskId], (error, results) => {
      if (error) {
        console.error('SQL error:', error);
        return res.status(500).json({ message: 'Error deleting task' });
      }
      res.status(200).json({ message: 'Task deleted successfully' });
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

//13 As a employee, I want to be able to update my availability so that my manager knows my availability
app.put('/updateAvailability/:id', (req, res) => {
    const availabilityId = req.params.id;
    const { status, userid } = req.body; // Extract status and userid from the request body

    const sql = `
        UPDATE availability 
        SET status = ?, userid = ? 
        WHERE availability_id = ?`;

    db.query(sql, [status, userid, availabilityId], (err, result) => {
        if (err) {
            console.error('Error updating availability status and userid:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(200).json({ message: 'Availability status and userid updated successfully' });
    });
});



//overview of schedules
app.get('/schedules', (req, res) => {
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
});

// Fetch the user's own profile details
app.get('/profile/:id', (req, res) => {
    const userId = req.params.id;
    // console.log("id: " + userId);

    // Join the users and roles tables to get the role name
    const query = `
        SELECT users.userid, users.fname, users.lname, users.email, users.contact, roles.role
        FROM users
        LEFT JOIN roles ON users.roleid = roles.roleid
        WHERE users.userid = ?`;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user details:', err);
            return res.status(500).send({ error: 'Failed to retrieve profile details' });
        }
        if (results.length === 0) {
            return res.status(404).send({ error: 'User not found' });
        }
        // console.log(results[0]);
        res.send(results[0]); // Return user profile with role name
    });
});

//update user profile 
app.put('/profile/:id', (req, res) => {
    const userId = req.params.id;
    const { fname, lname, email, contact } = req.body; // Make sure the request body contains these fields

    const query = `
        UPDATE users
        SET fname = ?, lname = ?, email = ?, contact = ?
        WHERE userid = ?
    `;

    db.query(query, [fname, lname, email, contact, userId], (err, results) => {
        if (err) {
            console.error('Error updating profile:', err);
            return res.status(500).send({ error: 'Failed to update profile' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).send({ error: 'User not found' });
        }

        res.send({ success: true, message: 'Profile updated successfully' });
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

app.put('/updateSchedules/:id', (req, res) => {
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

//all pending time-off requests
app.get('/timeoff', (req, res) => {
    // Define the status to filter by (in this case, 'pending')
    const status = 'pending';
    const query = `
        SELECT r.request_id, u.fname, u.lname, r.request_date, r.start_date, r.end_date, r.reason, r.status
        FROM requestleave r
        JOIN users u ON r.userid = u.userid
        WHERE r.status = ?
    `;
    db.query(query, [status], (err, results) => {
        if (err) {
            console.error('Error fetching time-off requests:', err);
            return res.status(500).json({ error: 'Failed to fetch requests' });
        }
        res.json(results);
    });
});

//update time-off request status
app.put('/timeoff/:request_id', (req, res) => {
    const { request_id } = req.params;
    const { status } = req.body;

    const query = 'UPDATE requestleave SET status = ? WHERE request_id = ?';

    db.query(query, [status, request_id], (err, results) => {
        if (err) {
            console.error('Error updating request status:', err);
            return res.status(500).json({ error: 'Failed to update request status' });
        }
        res.status(200).json({ message: 'Request status updated successfully' });
    });
});

//view all available status
app.get('/available', (req, res) => {
    const query = `
        SELECT a.availability_id, a.available_date, a.start_time, a.end_time, a.status, u.fname, u.lname
        FROM availability a
        JOIN users u ON a.userid = u.userid
        WHERE status = 'available'
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching availability:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.status(200).json(results);
    });
});


//create availability form
app.post('/available', (req, res) => {
    console.log('Request body:', req.body);

    const { userid, available_date, start_time, end_time, status } = req.body;

    // Ensure required fields are present (but allow userid to be null)
    if (!available_date || !start_time || !end_time) {
        return res.status(400).send({ error: 'All fields (available_date, start_time, end_time) are required' });
    }

    const query = `
        INSERT INTO availability (userid, available_date, start_time, end_time, status)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(query, [userid || null, available_date, start_time, end_time, status || 'pending'], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send({ error: 'Failed to add availability' });
        }
        res.send({ message: 'Availability added successfully', id: results.insertId });
    });
});

//delete availability form
app.delete('/available/:id', (req, res) => {
    const { id } = req.params;
    const deleteQuery = 'DELETE FROM availability WHERE availability_id = ?';

    db.query(deleteQuery, [id], (err, result) => {
        if (err) {
            console.error('Error deleting availability:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Availability not found' });
        }

        return res.status(200).json({ message: 'Availability deleted successfully' });
    });
});


app.get('/getAvailable', (req, res) => {
    const query = `
        SELECT availability_id, available_date, start_time, end_time, status
        FROM availability 
        WHERE status = 'pending'
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching availability:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.status(200).json(results);
    });
});

//9 As a employee, I want to be able to create time off request so that I can get approval for my leave of absence from work
app.post('/requestLeave', (req, res) => {
    const { userid, request_date, start_date, end_date, reason } = req.body;

    if (!userid || !request_date || !start_date || !end_date || !reason) {
        return res.status(400).send({ error: 'All fields are required' });
    }

    const query = `
        INSERT INTO requestleave (userid, request_date, start_date, end_date, reason) 
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(query, [userid, request_date, start_date, end_date, reason], (err, result) => {
        if (err) {
            console.error('Error inserting into requestLeave table:', err.sqlMessage);
            return res.status(500).json({ error: 'Error creating leave request' });
        }

        // Return 200 OK and JSON message
        return res.status(200).json({ message: 'Leave request created successfully' });
    });
});

app.get('/getRequestLeave/:id', (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT request_date, start_date, end_date, reason, status FROM requestleave WHERE userid = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching leave requests:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.status(200).json(results);
    });
});

//11 As a employee, I want to be able to view my annual leave/MC balances so I know how many leaves/MCs I'm left with
app.get('/leaveBalance/:userid', (req, res) => {
    const { userid } = req.params;

    if (!userid) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    const query = 'SELECT annual_leave_balance FROM leaveBalances WHERE userid = ?';
    db.query(query, [userid], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Leave balance not found for this user' });
        }

        res.json({ userid, annual_leave_balance: results[0].annual_leave_balance });
    });
});
//retrieve own schedule employee
app.get('/schedules/:userid', (req, res) => {
    const { userid } = req.params;

    // Check if the user ID is provided
    if (!userid) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    // Define the query to fetch schedules for the given user ID
    const query = 'SELECT * FROM schedules WHERE userid = ?';

    // Execute the query
    db.query(query, [userid], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }

        // Check if the query returned any results
        if (results.length === 0) {
            return res.status(404).json({ error: 'No schedules found for this user' });
        }

        // Return the results to the client
        res.json({ schedules: results });
    });
});

// clockin and out
app.post('/clock-in', (req, res) => {
    const { user_id, schedule_id } = req.body; // Extract user_id and schedule_id from request body
    const clock_in_time = new Date(); // Get the current time

    const query = 'INSERT INTO clock_times (user_id, schedule_id, clock_in_time) VALUES (?, ?, ?)';
    db.query(query, [user_id, schedule_id, clock_in_time], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Clock-in time recorded successfully', id: results.insertId });
    });
});

// Clock Out API
app.post('/clock-out', (req, res) => {
    const { user_id, schedule_id } = req.body; // Extract user_id and schedule_id from request body
    const clock_out_time = new Date(); // Get the current time

    const query = 'UPDATE clock_times SET clock_out_time = ? WHERE user_id = ? AND schedule_id = ? AND clock_out_time IS NULL';
    db.query(query, [clock_out_time, user_id, schedule_id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'No clock-in record found for this user and schedule' });
        }
        res.status(200).json({ message: 'Clock-out time recorded successfully' });
    });
});


app.get('/clock-times/:user_id/:schedule_id', (req, res) => {
  const { user_id, schedule_id } = req.params;

  const sql = 'SELECT clock_in_time, clock_out_time FROM clock_times WHERE user_id = ? AND schedule_id = ?';
  db.query(sql, [user_id, schedule_id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results[0] || {}); // Return an empty object if no clock times are found
  });
});

  

app.listen(8800, console.log("server started on port 8800"));