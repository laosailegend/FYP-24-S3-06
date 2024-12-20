// logger.js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json, colorize, printf } = format;
const mysql = require('mysql2/promise');
const db = require('../dbConfig');
const Transport = require('winston-transport'); // Import base Transport class
const cron = require('node-cron');

// Custom format for console logging with colors
const consoleLogFormat = format.combine(
    format.colorize(),
    format.printf(({ level, message, timestamp }) => {
        return `${level}: ${message}`;
    })
);

// Function to format date to MySQL DATETIME format
const formatDateToMySQL = (date) => {
    const pad = (n) => n < 10 ? '0' + n : n;
    return date.getFullYear() + '-' +
        pad(date.getMonth() + 1) + '-' +
        pad(date.getDate()) + ' ' +
        pad(date.getHours()) + ':' +
        pad(date.getMinutes()) + ':' +
        pad(date.getSeconds());
};

// Custom timestamp format to convert to local time zone
const localTimestamp = format((info) => {
    const date = new Date();
    info.timestamp = formatDateToMySQL(date);
    return info;
});

const pool = mysql.createPool({
    ...db,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Optional: set a timeout for idle connections
    connectTimeout: 10000, // 10 seconds
    acquireTimeout: 10000 // 10 seconds
});

// Function to clear logs from db older than 2 days
function clearOldLogs() {
    const deleteQuery = `DELETE FROM logs WHERE timestamp < CONVERT_TZ(NOW(), '+00:00', '+08:00') - INTERVAL 2 DAY;`;

    return new Promise((resolve, reject) => {
        db.query(deleteQuery, (error, result) => {
            if (error) {
                console.error('Error clearing old logs:', error);
                return reject(error); // Reject if there is an error
            } else {
                console.log(`Deleted ${result.affectedRows} old log entries.`);
                resolve(result); // Resolve on success
            }
        });
    });
}

// Schedule the task to run every day at midnight
cron.schedule('0 0 * * *', () => {
    console.log('Running scheduled task to clear old MySQL logs...');
    clearOldLogs()
        .then(() => console.log('Old MySQL logs cleared successfully.'))
        .catch((error) => console.error('Scheduled MySQL log clearing failed:', error));
});


// regex for logging
// const logRegex = /"level":"(info|error|warn)","message":"(([^'"]*)"|(HTTP REQUEST) 'ADDR':'([^']*)' 'USER':'([^']*)' 'REQ':'([^']*)' 'STATUS':'([^']*)' 'SIZE':'([^']*)' 'REF':'([^']*)' 'UA':'([^']*)'"),"timestamp":"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?"/gm;
const logRegex = /"level":"(info|error|warn)","message":"(([^'"]*)"|(HTTP REQUEST) 'ADDR':'([^']*)' 'USER':'([^']*)' 'REQ':'([^']*)' 'STATUS':'([^']*)' 'SIZE':'([^']*)' 'REF':'([^']*)' 'UA':'([^']*)'"),"timestamp":"(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})?"/gm;

// Custom transport for logging to MySQL
class MySQLTransport extends Transport {
    async log(info, callback) {
        const message = info[Symbol.for('message')]; // Using Symbol to access the message
        // console.log("message: ", message);  
        logRegex.lastIndex = 0; // Reset regex lastIndex

        let match = logRegex.exec(message); // Try to match the log format

        if (match) {
            try {
                await this.logToDatabase(match);

            } catch (error) {
                console.error('Error logging to MySQL:', error);

                // Reconnection logic
                if (error.code === 'ETIMEDOUT' || error.code === 'PROTOCOL_CONNECTION_LOST') {
                    console.log('Attempting to reconnect to MySQL...');
                    setTimeout(() => this.log(info, callback), 5000); // Retry after 5 seconds
                    return;
                }
            }
        }

        // Ensure the callback is called
        callback();
    }

    logToDatabase(match) {
        return new Promise((resolve, reject) => {
            const logEntry = match[4] ? {
                level: match[1],
                message: match[4], // This is already a string, don't stringify again
                address: match[5],
                user: match[6],
                request: match[7],
                status: parseInt(match[8], 10),
                size: match[9] === '-' ? null : parseInt(match[9], 10),
                referrer: match[10],
                user_agent: match[11],
                timestamp: match[12],
            } : {
                level: match[1],
                message: match[3], // This is also already a string
                timestamp: match[12],
            };
            

            // Create the query and values based on whether we have a complete log entry or not
            const query = match[4] ? 
                `INSERT INTO logs (level, message, address, user, request, status, size, referrer, user_agent, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` :
                `INSERT INTO logs (level, message, timestamp)
                VALUES (?, ?, ?)`;
    
            const values = match[4] ? [
                logEntry.level, logEntry.message, logEntry.address, logEntry.user,
                logEntry.request, logEntry.status, logEntry.size,
                logEntry.referrer, logEntry.user_agent, logEntry.timestamp
            ] : [
                logEntry.level, logEntry.message, logEntry.timestamp
            ];
    
            // Log the clean log entry
            // console.log("log: ", logEntry);
    
            // Execute the database insert
            db.execute(query, values, (err) => {
                if (err) {
                    console.log("err: ", err);
                    return reject(err);
                }
                resolve();
            });
        });
    }
    
}

// Create a Winston logger
const logger = createLogger({
    level: "info",
    format: combine(localTimestamp(), json()), // Log in JSON format for files
    transports: [
        new transports.Console({
            format: consoleLogFormat, // Colorized console output
        }),
        new transports.File({ filename: "./logs/app.log" }),
        new transports.File({ filename: './logs/error.log', level: 'error' }),
        new MySQLTransport(), // Add MySQL transport to the logger
    ],
});

module.exports = logger;