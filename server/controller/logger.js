const { createLogger, transports, format } = require('winston');

// logging functions
// decide and create loggers for different modules?

const userLogger = createLogger({
    transports: [
        new transports.File({
            filename: 'logs/customer.log',
            level: 'info',
            format: format.combine(format.timestamp(), format.json())
        }),
        new transports.File({
            filename: 'logs/error-customer.log',
            level: 'error',
            format: format.combine(format.timestamp(), format.json())
        })
    ]
})

module.exports = {userLogger}