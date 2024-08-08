const express = require('express')
const cors = require('cors')
const app = express()
const mysql = require('mysql')

const db = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"1234",
    database:"emproster",
})


app.use(express.json())
app.use(cors())

//Create account
app.post("/register", (req, res) => {
    const q = "INSERT INTO managers (`username`, `password`, `email`, `firstName`, `lastName`) VALUES (?)"
    const values = [
       req.body.username,
       req.body.password,
       req.body.email,
       req.body.firstName,
       req.body.lastName,
    ]

    db.query(q, [values], (err, data) => {
        if (err) return res.json(err)
        return res.json("User has been created successfully.")
    })
})

//Login to account
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const q = "SELECT * FROM managers WHERE username = ?";

    db.query(q, [username], (err, data) => {
        if (err) return res.json(err)
        if (data.length === 0) return res.status(401).json("Invalid credentials");

        const user = data[0];
        // Verify password
        if (password !== user.password) {
            return res.status(401).json("Invalid credentials");
        }

        return res.json("Login successful");
    });
})

//Retrieve personal information
app.get("/profile/:id", (req, res) => {
    const managerId = req.params.id;
    const q = "SELECT * FROM managers WHERE id = ?";

    db.query(q, [managerId], (err, data) => {
        if (err) return res.json(err)
        return res.json(data[0])
    })
})

//Update personal details
app.put("/profile/:id", (req, res) => {
    const managerId = req.params.id;
    const q = "UPDATE managers SET `username` = ?, `password` = ?, `email` = ?, `firstName` = ?, `lastName` = ? WHERE id = ?";

    const values = [
        req.body.username,
        req.body.password,
        req.body.email,
        req.body.firstName,
        req.body.lastName,
    ]

    db.query(q, [...values, managerId], (err, data) => {
        if (err) return res.json(err)
        return res.json("Profile has been updated successfully.")
    })
})

//Delete personal details
app.delete("/profile/:id", (req, res) => {
    const managerId = req.params.id;
    const q = "DELETE FROM managers WHERE id = ?";

    db.query(q, [managerId], (err, data) => {
        if (err) return res.json(err)
        return res.json("Profile has been deleted successfully.")
    })
})

app.listen(8800, () =>{
    console.log("Connected to backend!")
})
