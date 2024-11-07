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
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded)
    const compid = decoded.company;

    const q = `SELECT users.*, roles.role, company.company FROM users 
    INNER JOIN roles ON users.roleid = roles.roleid 
    INNER JOIN company ON users.compid = company.compid 
    WHERE users.compid = ?`;

    db.query(q, [compid], (err, data) => {
        if (err) {
            console.log(err);
            return res.json(err);
        }
        return res.json(data);
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

exports.getPosition = (req, res) => {
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