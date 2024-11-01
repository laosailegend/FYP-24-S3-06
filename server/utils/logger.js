// logger.js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json, colorize, printf } = format;
const mysql = require('mysql2/promise');
const db = require('../dbConfig');
const Transport = require('winston-transport'); // Import base Transport class

// Custom format for console logging with colors
const consoleLogFormat = format.combine(
    format.colorize(),
    format.printf(({ level, message, timestamp }) => {
        return `${level}: ${message}`;
    })
);

// const pool = mysql.createPool(db);
const pool = mysql.createPool({
    ...db,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Optional: set a timeout for idle connections
    connectTimeout: 10000, // 10 seconds
    acquireTimeout: 10000 // 10 seconds
});

// regex for logging
const logRegex = /"level":"(info|error|warn)","message":"(([^'"]*)"|'ADDR':'([^']*)' 'USER':'([^']*)' 'REQ':'([^']*)' 'STATUS':'([^']*)' 'SIZE':'([^']*)' 'REF':'([^']*)' 'UA':'([^']*)'"),"timestamp":"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?"/gm;

// Custom transport for logging to MySQL
class MySQLTransport extends Transport {
    async log(info, callback) {
        const message = info[Symbol.for('message')]; // Using Symbol to access the message
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
                address: match[4],
                user: match[5],
                request: match[6],
                status: parseInt(match[7], 10),
                size: match[8] === '-' ? null : parseInt(match[8], 10),
                referrer: match[9],
                user_agent: match[10],
                timestamp: match[11],
            } : {
                level: match[1],
                message: match[3],
                timestamp: match[11],
            };

            console.log("log: ", logEntry);
            const query = match[4] ? 
                `INSERT INTO logs (level, address, user, request, status, size, referrer, user_agent, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)` :
                `INSERT INTO logs (level, message, timestamp)
                VALUES (?, ?, ?)`;

            const values = match[4] ? [
                logEntry.level, logEntry.address, logEntry.user,
                logEntry.request, logEntry.status, logEntry.size,
                logEntry.referrer, logEntry.user_agent, logEntry.timestamp
            ] : [
                logEntry.level, logEntry.message, logEntry.timestamp
            ];

            db.execute(query, values, (err) => {
                if (err) {
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
    format: combine(timestamp(), json()), // Log in JSON format for files
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