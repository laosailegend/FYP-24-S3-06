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
        // console.log(hash);
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
            return res.json(err)
        }
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
    const userid = req.params.id;
    const updates = [];
    const values = [];

    // Dynamically build the update query and values array
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

    const q = `UPDATE users SET ${updates.join(', ')} WHERE userid = ?`;

    db.query(q, values, (err, data) => {
        if (err) return res.json(err);
        return res.json("User info has been updated successfully");
    });
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
  const { taskname, description, manpower_required, timeslot, requirements } = req.body;

  const reqStr = Array.isArray(requirements) ? requirements.join(', ') : '';

  const q = "INSERT INTO tasks (taskname, description, manpower_required, timeslot, requirements) VALUES (?, ?, ?, ?, ?)";
  const values = [taskname, description, manpower_required, timeslot, reqStr];

  db.query(q, values, (err, data) => {
    if (err) {
      console.error(err); // Add this to log errors to the server console
      return res.status(500).json(err);
    }
    return res.status(201).json("Task created successfully with requirements");
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

//10 As a employee, I want to be able to view the schedule of the timesheet so that I know who I will be working with on that shift
app.get('/schedules', (req, res) => {
    const shiftDate = req.query.shift_date;

    if (!shiftDate) {
        return res.status(400).send({ error: 'shift_date is required' });
    }

    const query = `
        SELECT schedules.schedule_id, schedules.start_time, schedules.end_time, 
            COALESCE(users.fname, 'NULL') AS fname, 
            COALESCE(users.lname, '') AS lname
        FROM schedules
        LEFT JOIN users ON schedules.userid = users.userid
        WHERE schedules.shift_date = ?
    `;

    db.query(query, [shiftDate], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send(err);
        }
        res.json(results);
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
