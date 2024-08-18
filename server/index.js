require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./dbConfig');

app.use(express.json());
app.use(cors());

const SECRET_KEY = process.env.JWT_SECRET;

app.get("/", (req, res) => {
    res.send("Hello world!");
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
            { id: user.userid, email: user.email, role: user.roleid },
            SECRET_KEY,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

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
        return res.json(data);
    })
});

//10 As a employee, I want to be able to view the schedule of the timesheet so that I know who I will be working with on that shift
app.get("/schedules", (req, res) => {
    const q = "SELECT * FROM schedules"
    db.query(q, (err, data) => {
        if (err) {
            return res.json(err)
        }
        return res.json(data);
    })
});

//13
app.put('/update-availability/:id', (req, res) => {
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

app.listen(8800, console.log("server started on port 8800"));