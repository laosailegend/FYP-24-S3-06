// adminController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../dbConfig');
const logger = require('../utils/logger');
const SECRET_KEY = process.env.JWT_SECRET;

exports.apiWorks = (req, res) => {
    res.send("i am working");
};

// log IP addr
exports.logIP = (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    // console.log(ip);
    console.log(req.headers);
    next();
}

// login POST
exports.login = (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        logger.error(`Failed login attempt with missing credentials from ${ip}`);
        return res.status(400).json({ error: "Email and password are required" });
    }

    const q = "SELECT * FROM users WHERE email = ?";

    db.query(q, [email], async (err, data) => {
        if (err) {
            logger.error(`Database error during login from ${ip}: ${err.message}`);
            return res.status(500).json({ error: "Database error" });
        }

        // If no user is found with the provided email
        if (data.length === 0) {
            logger.error(`Unsuccessful login attempt for non-existent user: ${ip}, ${email}`);
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = data[0];

        // Compare the provided password with the hashed password in the database
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            logger.error(`Unsuccessful login attempt for: ${ip}, ${user.email}`);
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.userid, email: user.email, role: user.roleid, fname: user.fname, lname: user.lname, company: user.compid },
            SECRET_KEY,
            { expiresIn: '1d' } // Token expires in 1 day
        );

        logger.info(`Successful login for: ${ip}, ${user.email}`);
        return res.json({ message: "Login successful", token });
    });
};

// #21 admin create user accounts POST
exports.createUser = (req, res) => {
    const q = "INSERT INTO users (`roleid`, `nric`, `fname`, `lname`, `contact`, `email`, `password`, `availability`, `compid`, `posid`, `leave_balance`) VALUES (?)";
    const saltRounds = 10;
    const password = req.body.password;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const token = req.headers['authorization']?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);   

    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) return;

        const values = [req.body.roleid, req.body.nric, req.body.fname, req.body.lname, 
            req.body.contact, req.body.email, hash, null, req.body.compid, req.body.posid, null];

        db.query(q, [values], (err, data) => {
            if (err) {
                console.log(err);
                logger.error(`Failed to create user by ${decoded.email}: ${req.body.email} at ${ip}`);
                return res.json(err)
            };
            return res.json("User created successfully");
        });

        logger.info(`User created by ${decoded.email}: ${req.body.email} at ${ip}`);
    });
};

// get user info and their role type GET 
exports.getUsers = (req, res) => {
    // inner join to also get their role type as well
    const q = `SELECT users.*, roles.role, company.company FROM users 
    INNER JOIN roles ON users.roleid = roles.roleid 
    INNER JOIN company ON users.compid = company.compid`;
    db.query(q, (err, data) => {
        if (err) {
            console.log(err);
            return res.json(err)
        }
        return res.json(data);
    })
};

// filtering system for user search GET
exports.searchUser = (req, res) => {
    const { company, role, search } = req.query;
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

    // Apply company filter if provided
    if (company) {
        q += " AND users.compid = ?";
        filters.push(company);
    }

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
            company.company LIKE ? OR
            positions.position LIKE ?
        )`;

        // Adding the search term multiple times for each LIKE condition
        const searchPattern = `%${search}%`;
        filters.push(
            searchPattern, searchPattern, searchPattern,
            searchPattern, searchPattern, searchPattern,
            searchPattern, searchPattern, searchPattern, searchPattern // Added the last `searchPattern` here
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

// retrive role details GET
exports.getRoles = (req, res) => {
    const q = "SELECT * FROM roles"
    db.query(q, (err, data) => {
        if (err) {
            return res.json(err)
        }
        return res.json(data);
    })
};

// #44 PUT update user details - modified so that those empty fields are removed -> /user/:id
exports.updateUser = (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const saltRounds = 10;
    const userid = req.params.id;
    const updates = [];
    const values = [];

    // Check if password is being updated
    if (req.body.password) {
        bcrypt.hash(req.body.password, saltRounds, (err, hashedPassword) => {
            if (err) return res.status(500).json("Error hashing password");

            // Add password update to the query
            updates.push('password = ?');
            values.push(hashedPassword);

            // Process other fields
            for (const [key, value] of Object.entries(req.body)) {
                if (value && key !== 'password') { // Skip the password field as it’s handled separately
                    updates.push(`${key} = ?`);
                    values.push(value);
                }
            }

            // Add the user id as the last value for the WHERE clause
            values.push(userid);

            // Construct the SQL query
            const q = `UPDATE users SET ${updates.join(', ')} WHERE userid = ?`;

            // Execute the query
            db.query(q, values, (err, data) => {
                if (err) {
                    logger.error(`Failed to update user password by ${decoded.email} at userid: ${userid}`);
                    return res.json(err)
                };
                logger.info(`Updated user password by ${decoded.email} at userid: ${userid}`);
                return res.json("User password has been updated successfully");
            });
        });
    } else {
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
        values.push(userid);

        // Construct the SQL query
        const q = `UPDATE users SET ${updates.join(', ')} WHERE userid = ?`;

        // Execute the query
        db.query(q, values, (err, data) => {
            if (err) {
                // console.log(err);
                logger.error(`Failed to update user info at userid: ${userid}`);
                return res.json(err)
            };
            logger.info(`Updated user info at userid: ${userid}`);
            return res.json("User info has been updated successfully");
        });
    }
};


// #45 DELETE delete user account /user/:id
exports.deleteUser = (req, res) => {
    const userid = req.params.id;

    // First, fetch the user to get their email
    const fetchUserQuery = "SELECT email FROM users WHERE userid = ?";

    db.query(fetchUserQuery, [userid], (err, results) => {
        if (err) {
            logger.error(`Failed to retrieve user at userid: ${userid}`);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Check if a user was found
        if (results.length === 0) {
            logger.error(`No user found with userid: ${userid}`);
            return res.status(404).json({ error: 'User not found' });
        }

        // Get the user's email from the results
        const userEmail = results[0].email;

        // Now, proceed to delete the user
        const deleteUserQuery = "DELETE FROM users WHERE userid = ?";

        db.query(deleteUserQuery, [userid], (err, data) => {
            if (err) {
                logger.error(`Failed to delete user at userid: ${userid}, email: ${userEmail}`);
                return res.status(500).json({ error: 'Failed to delete user' });
            }

            logger.info(`Deleted user at userid: ${userid}, email: ${userEmail}`);
            return res.json({ message: "User has been deleted successfully." });
        });
    });
};

// GET Fetch the user's own profile details
exports.getProfile = (req, res) => {
    const userId = req.params.id;
    // console.log("id: " + userId);

    // Join the users and roles tables to get the role name
    const query = `
        SELECT *
        FROM users
        LEFT JOIN roles ON users.roleid = roles.roleid
        WHERE users.userid = ?`;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user details:', err);
            return res.status(500).send({ error: 'Failed to retrieve profile details' });
        }
        if (results.length === 0) {
            return res.status(404).send({ error: 'User not found' });
        }
        // console.log(results[0]);
        res.send(results[0]); // Return user profile with role name
    });
};

// PUT update user profile 
exports.updateProfile = (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const saltRounds = 10;
    const userid = decoded.id;
    const updates = [];
    const values = [];

    // Check if password is being updated
    if (req.body.password) {
        bcrypt.hash(req.body.password, saltRounds, (err, hashedPassword) => {
            if (err) return res.status(500).json("Error hashing password");

            // Add password update to the query
            updates.push('password = ?');
            values.push(hashedPassword);

            // Process other fields
            for (const [key, value] of Object.entries(req.body)) {
                if (value && key !== 'password' && key !== 'role') { // Skip the password field as it’s handled separately
                    updates.push(`${key} = ?`);
                    values.push(value);
                }
            }

            // Add the user id as the last value for the WHERE clause
            values.push(userid);
            // Construct the SQL query
            const q = `UPDATE users SET ${updates.join(', ')} WHERE userid = ?`;

            // Execute the query
            db.query(q, values, (err, data) => {
                if (err) {
                    logger.error(`Failed to update own user password by ${decoded.email} at userid: ${userid}`);
                    console.log(err);
                    return res.json(err)
                };
                logger.info(`Updated own user password by ${decoded.email} at userid: ${userid}`);
                return res.json("User password has been updated successfully");
            });
        });
    } else {
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
        values.push(userid);

        // Construct the SQL query
        const q = `UPDATE users SET ${updates.join(', ')} WHERE userid = ?`;

        // Execute the query
        db.query(q, values, (err, data) => {
            if (err) {
                // console.log(err);
                logger.error(`Failed to update user info at userid: ${userid}`);
                return res.json(err)
            };
            logger.info(`Updated own user info at userid: ${userid}`);
            return res.json("User info has been updated successfully");
        });
    }
};

