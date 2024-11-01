// adminController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../dbConfig');
const logger = require('../utils/logger');
const SECRET_KEY = process.env.JWT_SECRET;


// log IP addr
exports.logIP = (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    // console.log(ip);
    next();
}

// login POST
exports.login = (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        // logger.userLogger.log('error', `Failed login from ${ip}`)
        return res.status(400).json({ error: "Email and password are required" });
    }

    const q = "SELECT * FROM users WHERE email = ?";

    db.query(q, [email], async (err, data) => {
        if (err) return res.status(500).json({ error: "Database error" });

        // If no user is found with the provided email
        if (data.length === 0) {
            return res.status(401).json({ error: "Invalid email or password, no user found" });
        }

        const user = data[0];

        // Compare the provided password with the hashed password in the database
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            logger.error(`Unsuccessful login attempt for : ${ip}, ${user.email}`);
            return res.status(401).json({ error: "Invalid email or password" });
        }

        //gen jwt token
        const token = jwt.sign(
            { id: user.userid, email: user.email, role: user.roleid, fname: user.fname, lname: user.lname },
            SECRET_KEY,
            { expiresIn: '1d' } // Token expires in 1 day or 5s/10s or 5m for 5minutes: https://github.com/vercel/ms
        );
        // console.log(JSON.parse(atob(token.split('.')[1])));
        logger.info(`Successful login for : ${ip}, ${user.email}`);

        return res.json({ message: "Login successful", token });
    });
};


// #21 admin create user accounts POST
exports.createUser = (req, res) => {
    const q = "INSERT INTO users (`roleid`, `nric`, `fname`, `lname`, `contact`, `email`, `password`, `availability`, `skill_id`) VALUES (?)";
    const saltRounds = 10;
    const password = req.body.password;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) return;

        const values = [req.body.roleid, req.body.nric, req.body.fname, req.body.lname, req.body.contact, req.body.email, hash, null, null];
        db.query(q, [values], (err, data) => {
            if (err) {
                console.log(err);
                logger.error(`Failed to create user in admin: ${req.body.email} at ${ip}`);
                return res.json(err)
            };
            return res.json("User created successfully");
        });

        logger.info(`User created in admin: ${req.body.email} at ${ip}`);
    });
};

// get user info and their role type GET 
exports.getUsers = (req, res) => {
    // inner join to also get their role type as well
    const q = "SELECT * FROM users INNER JOIN roles ON users.roleid = roles.roleid"
    db.query(q, (err, data) => {
        if (err) {
            console.log(err);
            return res.json(err)
        }
        return res.json(data);
    })
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
                if (err) return res.json(err);
                return res.json("User info has been updated successfully");
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
                logger.error(`Failed to update user at userid: ${userid}`);
                return res.json(err)
            };
            logger.info(`Updated user info at userid: ${userid}`);
            return res.json("User info has been updated successfully");
        });
    }
};

// #45 DELETE delete user account /user/:id
// exports.deleteUser = (req, res) => {
//     const userid = req.params.id;
//     const q = "DELETE FROM users WHERE userid = ?"

//     db.query(q, [userid], (err, data) => {
//         if (err) {
//             logger.error(`Failed to delete user at userid: ${userid}`);
//             return res.json(err)
//         };
//         logger.info(`Deleted user at userid: ${userid}`);
//         return res.json("book has been deleted succ.");
//     })
    
// };

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


// POST create permissions
exports.createPerms = (req, res) => {
    const { roleid, resource, can_create, can_read, can_update, can_delete } = req.body;

    if (!roleid || !resource || can_create === undefined || can_read === undefined || can_update === undefined || can_delete === undefined) {
        return res.status(400).json({ error: "Invalid data format. Missing permission fields." });
    }

    const query = `
        INSERT INTO permissions (roleid, resource, can_create, can_read, can_update, can_delete) 
        VALUES (?, ?, ?, ?, ?, ?);
    `;
    const values = [roleid, resource, can_create, can_read, can_update, can_delete];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "An error occurred while creating the permission." });
        }

        res.json({ message: "Permission created successfully." });
    });
};

// POST get all permissions to display on the admin page
exports.getPerms = (req, res) => {
    const q = "SELECT permissions.*, roles.role FROM roles INNER JOIN permissions ON `roles`.roleid = permissions.roleid;";
    db.query(q, (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
};

// PUT update permissions
exports.updatePerms = (req, res) => {
    const permission_id = req.params.id; // Extract the permission_id from the URL
    const { can_create, can_read, can_update, can_delete } = req.body; // Extract the permission fields from the request body

    // Validate the required fields
    if (can_create === undefined || can_read === undefined || can_update === undefined || can_delete === undefined) {
        return res.status(400).json({ error: "Invalid data format. Missing permission fields." });
    }

    // SQL query to update the permission based on permission_id
    const query = `
        UPDATE permissions 
        SET can_create = ?, can_read = ?, can_update = ?, can_delete = ? 
        WHERE permission_id = ?
    `;
    const values = [can_create, can_read, can_update, can_delete, permission_id];

    // Execute the query
    db.query(query, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "An error occurred while updating the permission." });
        }
        res.json({ message: "Permission updated successfully." });
    });
};

// DELETE delete permissions
exports.deletePerms = (req, res) => {
    const permission_id = req.params.id; // Extract the permission_id from the URL
    const query = `DELETE FROM permissions WHERE permission_id = ?`;
    const values = [permission_id];

    // Execute the query
    db.query(query, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: "An error occurred while deleting the permission." });
        }
        res.json({ message: "Permission deleted successfully." });
    });
};

// GET Fetch the user's own profile details
exports.getProfile = (req, res) => {
    const userId = req.params.id;
    // console.log("id: " + userId);

    // Join the users and roles tables to get the role name
    const query = `
        SELECT users.userid, users.fname, users.lname, users.email, users.contact, roles.role
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
    const userId = req.params.id;
    const { fname, lname, email, contact } = req.body; // Make sure the request body contains these fields

    const query = `
        UPDATE users
        SET fname = ?, lname = ?, email = ?, contact = ?
        WHERE userid = ?
    `;

    db.query(query, [fname, lname, email, contact, userId], (err, results) => {
        if (err) {
            console.error('Error updating profile:', err);
            return res.status(500).send({ error: 'Failed to update profile' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).send({ error: 'User not found' });
        }

        res.send({ success: true, message: 'Profile updated successfully' });
    });
};

