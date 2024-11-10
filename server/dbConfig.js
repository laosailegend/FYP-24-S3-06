const mysql = require('mysql2');

// Create a connection pool for better performance
const db = mysql.createPool({
    host: process.env.DB_HOST,            // RDS or database host
    user: process.env.DB_USER,            // Database username
    password: process.env.DB_PASSWORD,    // Database password
    database: process.env.DB_NAME,        // Database name
    connectionLimit: 10,                  // Pool size (adjust if needed)
    waitForConnections: true,             // Wait for a connection if pool is full
    queueLimit: 0,                        // Unlimited queue length (adjust if necessary)
    debug: false                          // Set to true for debugging SQL queries (optional)
});

// Check the database connection immediately when this file is required
db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database.');
    connection.release(); // Always release the connection back to the pool
});

module.exports = db;

// run to fix auth issues: 
// ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';

