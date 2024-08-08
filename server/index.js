import express from "express"
import mysql from "mysql"
import cors from "cors"

const app = express()

const db = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"1234",
    database:"emproster"
})

app.use(express.json())
app.use(cors())

app.get("/users/:userid", (req, res) => {
    const userId = req.params.userid;
    const q = "SELECT nric, fname, lname, contact, email FROM users WHERE userid = ?";
    db.query(q, [userId], (err, data) => {
        if (err) return res.json(err);
        return res.json(data[0]); 
    });
});

app.get("/users", (req,res)=>{
    const q = "SELECT * FROM users"
    db.query(q,(err,data)=>{
        if(err) return res.json(err)
        return res.json(data)
    })
})

// create account
app.post("/users", (req,res)=>{
    const q = "INSERT INTO users (roleid, nric, fname, lname, contact, email) VALUES (?)"
    const values = [
        req.body.roleid,
        req.body.nric,
        req.body.fname,
        req.body.lname,
        req.body.contact,
        req.body.email
    ]

    db.query(q,[values], (err,data)=>{
        if(err) return res.json(err);
        return res.json("User has been created successfully");
    });
});

//delete account
app.delete("/users/:userid", (req,res)=>{
    const userId = req.params.userid
    const q = "DELETE FROM users WHERE userid = ?"

    db.query(q, [userId], (err,data)=>{
        if(err) return res.json(err);
        return res.json("User has been deleted successfully");
    })
})

//update account
app.put("/users/:userid", (req, res) => {
    const userId = req.params.userid;
    const { nric, fname, lname, contact, email } = req.body;

    // Define the SQL query
    const q = "UPDATE users SET nric = ?, fname = ?, lname = ?, contact = ?, email = ? WHERE userid = ?";

    // Define the values array
    const values = [nric, fname, lname, contact, email, userId];

    // Execute the SQL query
    db.query(q, values, (err, result) => {
        if (err) {
            console.error("Database error:", err); // Log the error to the console
            return res.status(500).json(err); // Return a 500 status code for server error
        }
        return res.json("User has been updated successfully");
    });
});


app.listen(8800, ()=>{
    console.log("Connected to backend!")
})
