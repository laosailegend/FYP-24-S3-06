// import cors from "cors";

const express = require('express');
const cors = require('cors');
const app = express();
const mysql = require('mysql');

const db = mysql.createConnection({
    //change your configurations accordingly
    host:"localhost",
    user:"root",
    password:"tuckyew",
    database:"emproster",
});



app.use(express.json());
app.use(cors());

db.connect((err) => {
    if (err) {
        console.error("Error connecting to the database:", err);
        process.exit(1);
    } else {
        console.log("Connected to the database");
    }
});

// Endpoint to view a user by userid
app.get('/users/:userid', (req, res) => {
    const { userid } = req.params;
    const query = "SELECT * FROM users WHERE userid = ?";

    db.query(query, [userid], (err, results) => {
        if (err) {
            console.error("Error fetching data from users table:", err);
            return res.status(500).json({ error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json(results[0]);
    });
});

//create user account
app.post('/users', (req, res) => {
    const { roleid, nric, fname, lname, contact, email } = req.body;
    const query = "INSERT INTO users (roleid, nric, fname, lname, contact, email) VALUES (?, ?, ?, ?, ?, ?)";
    const values = [roleid, nric, fname, lname, contact, email];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error("Error inserting data into users table:", err);
            return res.status(500).json({ error: err });
        }
        return res.status(201).json({ message: "User created successfully", userId: result.insertId });
    });
});

// Endpoint to update a user by userid
app.put('/users/:userid', (req, res) => {
    const { userid } = req.params;
    const { roleid, nric, fname, lname, contact, email } = req.body;
    const query = "UPDATE users SET roleid = ?, nric = ?, fname = ?, lname = ?, contact = ?, email = ? WHERE userid = ?";
    const values = [roleid, nric, fname, lname, contact, email, userid];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error("Error updating data in users table:", err);
            return res.status(500).json({ error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ message: "User updated successfully" });
    });
});

// Endpoint to delete a user by userid
app.delete('/users/:userid', (req, res) => {
    const { userid } = req.params;
    const query = "DELETE FROM users WHERE userid = ?";

    db.query(query, [userid], (err, result) => {
        if (err) {
            console.error("Error deleting data from users table:", err);
            return res.status(500).json({ error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ message: "User deleted successfully" });
    });
});



app.listen(8800, console.log("server started on port 8800"));