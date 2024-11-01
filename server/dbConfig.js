// dbConfig.js
const mysql = require('mysql2');

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10, // Increase if necessary
    waitForConnections: true,
    queueLimit: 0, // Unlimited queue
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database.');
    connection.release(); // Release the connection back to the pool
});

module.exports = db;

//if auth problem, copy statement into mysql and execute it
// ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';