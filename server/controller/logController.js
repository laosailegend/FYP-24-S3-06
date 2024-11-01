const db = require('../dbConfig');
// const logger = require('../utils/logger');

// get logs
exports.getLogs = (req, res) => {
    const q = "SELECT * FROM logs";
    db.query(q, (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
};

// get logs by level
exports.getLogsByLevel = (req, res) => {
    const q = "SELECT * FROM logs WHERE level = ?";
    db.query(q, req.params.level, (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
};

// get logs by request - if logs.request contains GET/PUT/POST/DELETE
exports.getLogsByRequest = (req, res) => {
    const q = "SELECT * FROM logs WHERE request LIKE ?";
    db.query(q, `%${req.params.request}%`, (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
};

// get IP addresses and eliminate duplicates for the logs
exports.getDistIPs = (req, res) => {
    const q = "SELECT DISTINCT address FROM logs";
    db.query(q, (err, data
    ) => {
        if (err) return res.json(err);

        return res.json(data);
    })
}

// get logs by IP address
exports.getLogsByIP = (req, res) => {
    const q = "SELECT * FROM logs WHERE address = ?";
    db.query(q, req.params.ip, (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
};

// select distinct user from the logs
exports.getDistUsers = (req, res) => {
    const q = "SELECT DISTINCT user FROM logs";
    db.query(q, (err, data ) => {
        if (err) return res.json(err);

        return res.json(data);
    })
}

// get logs by user
exports.getLogsByUser = (req, res) => {
    const q = "SELECT * FROM logs WHERE user = ?";
    db.query(q, req.params.user, (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
};

// get logs by status
exports.getLogsByStatus = (req, res) => {
    const q = "SELECT * FROM logs WHERE status = ?";
    db.query(q, req.params.status, (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
};

// select distinct referrer from the logs
exports.getDistReferrers = (req, res) => {
    const q = "SELECT DISTINCT referrer FROM logs";
    db.query(q, (err, data ) => {
        if (err) return res.json(err);

        return res.json(data);
    })
}

// get logs by referrer
exports.getLogsByReferrer = (req, res) => {
    const q = "SELECT * FROM logs WHERE referrer = ?";
    db.query(q, req.params.referrer, (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
};

// select distinct user_agent from the logs
exports.getDistUserAgents = (req, res) => {
    const q = "SELECT DISTINCT user_agent FROM logs";
    db.query(q, (err, data ) => {
        if (err) return res.json(err);

        return res.json(data);
    })
}

// get logs by user_agent
exports.getLogsByUserAgent = (req, res) => {
    const q = "SELECT * FROM logs WHERE user_agent = ?";
    db.query(q, req.params.user_agent, (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
};

// get logs by timestamp but use a date range
exports.getLogsByTimestamp = (req, res) => {
    const q = "SELECT * FROM logs WHERE timestamp BETWEEN ? AND ?";
    db.query(q, [req.params.start, req.params.end], (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
};