const db = require('../dbConfig');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

// get company info
exports.getCompany = (req, res) => {
    const q = `SELECT * FROM company`;

    db.query(q, (err, data) => {
        if (err) {
            console.log(err);
            return res.json(err)
        }
        return res.json(data);
    })
};

// get user info based on which company you are in
exports.getCompUsers = (req, res) => {
    // get compadmin's compid from token
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const compid = decoded.company;
    // console.log(decoded);

    const q = `SELECT users.*, roles.role, company.company, positions.position FROM users 
    INNER JOIN roles ON users.roleid = roles.roleid 
    INNER JOIN company ON users.compid = company.compid 
    LEFT JOIN positions ON users.posid = positions.posid

    WHERE users.compid = ?`;

    db.query(q, [compid], (err, data) => {
        if (err) {
            console.log(err);
            return res.json(err);
        }
        return res.json(data);
    });
};

// filtering system for user search GET
exports.searchCompUser = (req, res) => {
    // get compadmin's compid from token
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const compid = decoded.company;
    const { role, search } = req.query;
    const filters = [];

    // Base query with joins
    let q = `
    SELECT users.*, roles.role, company.company, positions.position 
    FROM users 
    INNER JOIN roles ON users.roleid = roles.roleid 
    INNER JOIN company ON users.compid = company.compid
    LEFT JOIN positions ON users.posid = positions.posid 
    WHERE 1=1
    `;

    // just use the compadmin's compid
    q += " AND users.compid = ?";
    filters.push(compid);

    // Apply role filter if provided
    if (role) {
        q += " AND users.roleid = ?";
        filters.push(role);
    }

    // Apply search term across multiple fields if provided
    if (search) {
        q += ` AND (
            users.userid LIKE ? OR 
            roles.role LIKE ? OR 
            users.nric LIKE ? OR 
            users.fname LIKE ? OR 
            users.lname LIKE ? OR 
            users.contact LIKE ? OR 
            users.email LIKE ? OR 
            positions.position LIKE ?
        )`;

        // Adding the search term multiple times for each LIKE condition
        const searchPattern = `%${search}%`;
        filters.push(
            searchPattern, searchPattern, searchPattern,
            searchPattern, searchPattern, searchPattern,
            searchPattern, searchPattern, searchPattern // Added the last `searchPattern` here
        );
    }

    // Execute the query with filters
    db.query(q, filters, (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: "Database query failed." });
        }
        res.json(results);
    });
};

// get industry info
exports.getIndustry = (req, res) => {
    const q = `SELECT * FROM industry`;

    db.query(q, (err, data) => {
        if (err) {
            console.log(err);
            return res.json(err)
        }
        return res.json(data);
    }
    )
}

exports.getPositions = (req, res) => {
    const q = `SELECT * FROM positions`;

    db.query(q, (err, data
    ) => {
        if (err) {
            console.log(err);
            return res.json(err)
        }
        return res.json(data);
    }
    )
}

// add a company
exports.addCompany = (req, res) => {
    const { company, address, contact, email, website, industryid, size, statusid, est_date } = req.body;

    const q = `INSERT INTO company (company, address, contact_num, email, website, industryid, size, statusid, est_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(q, [company, address, contact, email, website, industryid, size, statusid, est_date], (err, data) => {
        if (err) {
            console.log(err);
            // make logger and use token to check which user is adding company here
            return res.json(err)
        }
        return res.json(data);
    })
};

// update company info
exports.updateCompany = (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { company, address, contact, email, website, industryid, size, statusid, est_date } = req.body;
    const compid = req.params.id;

    const updates = [];
    const values = [];

    const q = `UPDATE company SET company = ?, address = ?, contact_num = ?, email = ?, website = ?, industryid = ?, size = ?, statusid = ?, est_date = ? WHERE compid = ?`;

    db.query(q, [company, address, contact, email, website, industryid, size, statusid, est_date, compid], (err, data) => {
        if (err) {
            console.log(err);
            return res.json(err)
        }
        return res.json(data);
    })
};