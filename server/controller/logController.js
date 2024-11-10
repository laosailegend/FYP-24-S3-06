const db = require('../dbConfig');
// const logger = require('../utils/logger');
const { generatePreSignedUrl } = require('../utils/s3-utils');
const { listLogFiles } = require('../utils/uploadFiles');
const bucket = process.env.AWS_S3_BUCKET;

// get logs
exports.getLogs = (req, res) => {
    let minSize, maxSize;
    const { level, request, ip, user, status, size, referrer, user_agent, startTime, endTime, search } = req.query;
    let q = "SELECT * FROM logs WHERE 1=1";  // Start with a base query that always returns true
    const filters = [];

    // Add filters based on query parameters
    if (level) {
        q += " AND level = ?";
        filters.push(level);
    }
    if (request) {
        q += " AND request LIKE ?";
        filters.push(`${request}%`);
    }
    if (ip) {
        q += " AND address = ?";
        filters.push(ip);
    }
    if (user) {
        q += " AND user = ?";
        filters.push(user);
    }
    if (status) {
        q += " AND status = ?";
        filters.push(status);
    }
    if (referrer) {
        q += " AND referrer = ?";
        filters.push(referrer);
    }

    if (size) {
        minSize = parseInt(size.split('-')[0]);
        maxSize = parseInt(size.split('-')[1]);

        q += " AND size BETWEEN ? AND ?";
        filters.push(minSize, maxSize);
    }

    if (user_agent) {
        q += " AND user_agent = ?";
        filters.push(user_agent);
    }

    // Handle timestamp filtering
    if (startTime) {
        const startTimestamp = startTime.includes("T") ? startTime.replace("T", " ") : `${startTime} 00:00:00.000`;
        q += " AND timestamp >= ?";
        filters.push(startTimestamp);
    }
    
    if (endTime) {
        const endTimestamp = endTime.includes("T") ? endTime.replace("T", " ") : `${endTime} 23:59:59.999`;
        q += " AND timestamp <= ?";
        filters.push(endTimestamp);
    }

    // Add search term (if present) to check across multiple columns
    if (search) {
        q += " AND (logid LIKE ? OR level LIKE ? OR message LIKE ? OR address LIKE ? OR user LIKE ? OR request LIKE ? OR status LIKE ? OR size LIKE ? OR referrer LIKE ? OR user_agent LIKE ? OR timestamp LIKE ?)";
        filters.push(`%${search}%`, `%${search}%`, `%${search}%`, 
            `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, 
            `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    db.query(q, filters, (err, data) => {
        console.log('Generated Query:', q, filters);

        if (err) return res.status(500).json(err);
        return res.json(data);
    });
};

// ALL BELOW ARE LOG FILTERING OPTIONS PURPOSES

// get logs by level
exports.getLogsLevel = (req, res) => {
    const q = "SELECT DISTINCT level FROM logs WHERE level IS NOT NULL";

    db.query(q, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    })
};

// get logs by request - if logs.request contains GET/PUT/POST/DELETE
exports.getLogsRequest = (req, res) => {
    const request = `%${req.params.request}%`;
    const q = "SELECT * FROM logs WHERE request LIKE ? and request IS NOT NULL";

    db.query(q, (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
};

// get IP addresses and eliminate duplicates for the logs
exports.getLogsIPs = (req, res) => {
    const q = "SELECT DISTINCT address FROM logs WHERE address IS NOT NULL";
    db.query(q, (err, data
    ) => {
        if (err) return res.json(err);

        return res.json(data);
    })
}

// select distinct user from the logs
exports.getLogsUsers = (req, res) => {
    const q = "SELECT DISTINCT user FROM logs WHERE user IS NOT NULL";
    db.query(q, (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
}

// get logs by status
exports.getLogsStatus = (req, res) => {
    const q = "SELECT DISTINCT status FROM logs WHERE status IS NOT NULL";

    db.query(q, (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
};

// select distinct referrer from the logs
exports.getLogsReferrers = (req, res) => {
    const q = "SELECT DISTINCT referrer FROM logs WHERE referrer IS NOT NULL";
    db.query(q, (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
}

// get logs by timestamp but use a date range
exports.getLogsTimestamp = (req, res) => {
    const start = req.query.start;
    const end = req.query.end;

    const q = "SELECT * FROM logs WHERE timestamp BETWEEN ? AND ?";
    db.query(q, [start, end], (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
};

exports.getLatestLogs = async (req, res) => {
    try {
        // List all log files in the 'logs/' directory of your bucket
        const logs = await listLogFiles(bucket);

        if (logs.length === 0) {
            return res.status(404).json({ error: 'No log files found' });
        }

        // Find the most recent log file by sorting the logs by LastModified
        const latestLog = logs.reduce((latest, log) => {
            return (new Date(log.LastModified) > new Date(latest.LastModified)) ? log : latest;
        });

        const fileKey = latestLog.Key;  // Use the key of the most recent log

        // Generate pre-signed URL for the most recent log file
        const url = await generatePreSignedUrl(bucket, fileKey);
        
        res.json({ downloadUrl: url });
    } catch (error) {
        console.error('Error in getLatestLogs:', error); // Improved error logging
        res.status(500).json({ error: 'Error generating download URL' });
    }
};


