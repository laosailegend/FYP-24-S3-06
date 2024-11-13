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

exports.getCompByID = (req, res) => {
    const compid = req.params.id;
    const q = `SELECT * FROM company WHERE compid = ?`;

    db.query(q, [compid], (err, data) => {
        if (err) {
            
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

exports.getStatus = (req, res) => {
    const q = `SELECT * FROM status`;

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
    // decoded is for winston logging purposes
    const token = req.headers['authorization']?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const compid = req.params.id;
    const updates = [];
    const values = [];

    // No password update, handle as usual
    for (const [key, value] of Object.entries(req.body)) {
        if (value) { // Only add non-empty fields
            updates.push(`${key} = ?`);
            values.push(value);
        }
    }

    // If there are no updates, return early
    if (updates.length === 0) {
        return res.json("No updates provided");
    }

    // Add the user id as the last value for the WHERE clause
    values.push(compid);

    // Construct the SQL query
    const q = `UPDATE company SET ${updates.join(', ')} WHERE compid = ?`;

    // Execute the query
    db.query(q, values, (err, data) => {
        if (err) {
            // console.log(err);
            logger.error(`Failed to update company info at userid: ${compid}`);
            return res.json(err)
        };
        logger.info(`Updated company info at userid: ${compid}`);
        return res.json("Company info has been updated successfully");
    });
}

// delete company
exports.deleteCompany = (req, res) => {
    const compid = req.params.id;

    // First, fetch the user to get their email
    const fetchCompanyQuery = "SELECT company FROM company WHERE compid = ?";

    db.query(fetchCompanyQuery, [compid], (err, results) => {
        if (err) {
            logger.error(`Failed to retrieve company at compid: ${compid}`);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Check if a user was found
        if (results.length === 0) {
            logger.error(`No company found with compid: ${compid}`);
            return res.status(404).json({ error: 'User not found' });
        }

        // Get the company from the results
        const company = results[0].company;

        // Now, proceed to delete the user
        const deleteCompanyQuery = "DELETE FROM company WHERE compid = ?";

        db.query(deleteCompanyQuery, [compid], (err, data) => {
            if (err) {
                logger.error(`Failed to delete company at compid: ${compid}, company: ${company}`);
                return res.status(500).json({ error: 'Failed to delete user' });
            }

            logger.info(`Deleted company at compid: ${compid}, company: ${company}`);
            return res.json({ message: "Company has been deleted successfully." });
        });
    });
};

// filtering system for company search GET
exports.searchCompany = (req, res) => {
    const { industry, size, status, startDate, endDate, search } = req.query;
    const filters = [];

    // Base query with joins
    let q = `
    SELECT company.*, industry.industry, status.status 
    FROM company
    INNER JOIN industry ON company.industryid = industry.industryid 
    INNER JOIN status ON company.statusid = status.statusid
    WHERE 1=1
    `;

    // Apply company filter if provided
    if (industry) {
        q += " AND company.industryid = ?";
        filters.push(industry);
    }

    if (size) {
        q += " AND company.size = ?";
        filters.push(size);
    }

    if (startDate) {
        q += " AND company.est_date >= ?";
        filters.push(startDate);
    }

    if (endDate) {
        q += " AND company.est_date <= ?";
        filters.push(endDate);
    }

    // Apply role filter if provided
    if (status) {
        q += " AND company.statusid = ?";
        filters.push(status);
    }

    // Apply search term across multiple fields if provided
    if (search) {
        q += ` AND (
            company.compid LIKE ? OR
            company.company LIKE ? OR 
            company.address LIKE ? OR 
            company.contact_num LIKE ? OR 
            company.email LIKE ? OR 
            company.website LIKE ? OR 
            company.est_date LIKE ? 
        )`;

        // Adding the search term multiple times for each LIKE condition
        const searchPattern = `%${search}%`;
        filters.push(
            searchPattern, searchPattern, searchPattern,
            searchPattern, searchPattern, searchPattern,
            searchPattern
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