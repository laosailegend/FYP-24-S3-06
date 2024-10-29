const { createLogger, transports, format } = require('winston');

// logging functions
// decide and create loggers for different modules

const userLogger = createLogger({
    transports: [
        new transports.File({
            filename: 'logs/userLogin.log',
            level: 'info',
            format: format.combine(format.timestamp(), format.json())
        }),
        new transports.File({
            filename: 'logs/error-userLogin.log',
            level: 'error',
            format: format.combine(format.timestamp(), format.json())
        })
    ]
})

const adminLogger = createLogger({
    transports: [
        new transports.File({
            filename: 'logs/adminLog.log',
            level: 'info',
            format: format.combine(format.timestamp(), format.json())
        }),
        new transports.File({
            filename: 'logs/error-adminLog.log',
            level: 'error',
            format: format.combine(format.timestamp(), format.json())
        })
    ]
})

module.exports = {userLogger, adminLogger}