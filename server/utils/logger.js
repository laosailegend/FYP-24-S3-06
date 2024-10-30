const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json, colorize } = format;

// Custom format for console logging with colors
const consoleLogFormat = format.combine(
    format.colorize(),
    format.printf(({ level, message, timestamp }) => {
        return `${level}: ${message}`;
    })
);

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
    ],
});

module.exports = logger;