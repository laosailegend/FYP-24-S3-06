// import cors from "cors";

const express = require('express');
const cors = require('cors');
const app = express();
const mysql = require('mysql');

const db = mysql.createConnection({
    //change your configurations accordingly
    host:"localhost",
    user:"root",
    password:"root",
    database:"emproster",
});

//if auth problem, copy statement into mysql and execute it
// ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Hello world!");
})

app.get("/books", (req, res) => {
    const q = "SELECT * FROM books"
    db.query(q, (err, data) => {
        if (err) {
            return res.json(err)
        }
        return res.json(data);
    })
});

// question mark is used to prevent SQL injection
// #21 admin create user accounts
app.post("/createUser", (req, res) => {
    const q = "INSERT INTO users (`roleid`, `nric`, `fname`, `lname`, `contact`, `email`) VALUES (?)"
    const values = [req.body.roleid, req.body.nric, req.body.fname, req.body.lname, req.body.contact, req.body.email]

    // console.log(values);

    db.query(q, [values], (err, data) => {
        if (err) return res.json(err);
        return res.json("user created successfully");
    })
});


// ----------------------------------- these will no longer work if you change the database to emproster---------------------------

//endpoint to create book
app.post("/books", (req, res) =>{
    const q = "INSERT INTO books (`title`, `desc`, `price`, `cover`) VALUES (?)"
    const values = [req.body.title, req.body.desc, req.body.price, req.body.cover]

    db.query(q, [values], (err, data) => {
        if (err) return res.json(err);
        return res.json("Book created successfully");
    })
})

// delete book
app.delete("/books/:id", (req, res) => {
    const bookId = req.params.id;
    const q = "DELETE FROM books WHERE id = ?"

    db.query(q, [bookId], (err, data) => {
        if (err) return res.json(err);
        return res.json("book has been deleted succ.");
    })
})

// update a book's information
app.put("/books/:id", (req, res) => {
    const bookId = req.params.id;
    const q = "update books set `title` = ?, `desc` = ?, `price` = ?, `cover` = ? where id = ?"

    const values = [req.body.title, req.body.desc, req.body.price, req.body.cover];

    db.query(q, [...values, bookId], (err, data) => {
        if (err) return res.json(err);
        return res.json("book has been updated succ.");
    })
})

app.listen(8800, console.log("server started on port 8800"));