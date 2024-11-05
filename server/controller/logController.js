const db = require('../dbConfig');
// const logger = require('../utils/logger');

// get logs
exports.getLogs = (req, res) => {
    let minSize, maxSize;
    const { level, request, ip, user, status, size, referrer, user_agent, start, end, search } = req.query;
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
    if (start && end) {
        q += " AND timestamp BETWEEN ? AND ?";
        filters.push(start, end);
    }

    // Add search term (if present) to check across multiple columns
    if (search) {
        q += " AND (logid LIKE ? OR level LIKE ? OR message LIKE ? OR address LIKE ? OR user LIKE ? OR request LIKE ? OR status LIKE ? OR size LIKE ? OR referrer LIKE ? OR user_agent LIKE ? OR timestamp LIKE ?)";
        filters.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    db.query(q, filters, (err, data) => {
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
    db.query(q, (err, data ) => {
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
    db.query(q, (err, data ) => {
        if (err) return res.json(err);

        return res.json(data);
    })
}

// select distinct user_agent from the logs
// exports.getLogsUA = (req, res) => {
//     const q = "SELECT DISTINCT user_agent FROM logs WHERE user_agent IS NOT NULL";
//     db.query(q, (err, data ) => {
//         if (err) return res.json(err);

//         return res.json(data);
//     })
// }

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