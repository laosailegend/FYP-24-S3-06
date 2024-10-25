const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../dbConfig');
const logger = require('./logger');
const SECRET_KEY = process.env.JWT_SECRET;

// retrieve user details for employees only, no NRIC no password /employeeGetUser
exports.employeeGetUser = (req, res) => {
    // inner join to also get their role type as well
    const q = "SELECT fname, lname, contact, email FROM users INNER JOIN roles ON users.roleid = roles.roleid WHERE userid = ?"
    db.query(q, (err, data) => {
        if (err) {
            console.log(err);
            return res.json(err)
        }
        return res.json(data);
    })
};

//13 As a employee, I want to be able to update my availability so that my manager knows my availability /updateAvailability/:id
exports.updateAvailability = (req, res) => {
    const availabilityId = req.params.id;
    const { status } = req.body; // Extract only the status from the request body

    const sql = `
        UPDATE availability 
        SET status = ? 
        WHERE availability_id = ?`;

    db.query(sql, [status, availabilityId], (err, result) => {
        if (err) {
            console.error('Error updating availability status:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(200).json("Availability status updated successfully");
    });
};

//9 As a employee, I want to be able to create time off request so that I can get approval for my leave of absence from work /requestLeave
exports.requestLeave = (req, res) => {
    const { userid, request_date, start_date, end_date, reason } = req.body;

    if (!userid || !request_date || !start_date || !end_date || !reason) {
        return res.status(400).send({ error: 'All fields are required' });
    }

    const query = `
        INSERT INTO requestleave (userid, request_date, start_date, end_date, reason) 
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(query, [userid, request_date, start_date, end_date, reason], (err, result) => {
        if (err) {
            console.error('Error inserting into requestLeave table:', err.sqlMessage);
            return res.status(500).json({ error: 'Error creating leave request' });
        }

        // Return 200 OK and JSON message
        return res.status(200).json({ message: 'Leave request created successfully' });
    });
};

// /getRequestLeave/:id
exports.getRequestLeaveByID = (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT request_date, start_date, end_date, reason, status FROM requestleave WHERE userid = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching leave requests:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.status(200).json(results);
    });
};

//11 As a employee, I want to be able to view my annual leave/MC balances so I know how many leaves/MCs I'm left with /leaveBalance/:userid
exports.getLeaveBalance = (req, res) => {
    const { userid } = req.params;

    if (!userid) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    const query = 'SELECT annual_leave_balance FROM leaveBalances WHERE userid = ?';
    db.query(query, [userid], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Leave balance not found for this user' });
        }

        res.json({ userid, annual_leave_balance: results[0].annual_leave_balance });
    });
};

//retrieve own schedule employee
exports.getScheduleId= (req, res) => {
    const { userid } = req.params;

    // Check if the user ID is provided
    if (!userid) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    // Define the query to fetch schedules for the given user ID
    const query = 'SELECT * FROM schedules WHERE userid = ?';

    // Execute the query
    db.query(query, [userid], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }

        // Check if the query returned any results
        if (results.length === 0) {
            return res.status(404).json({ error: 'No schedules found for this user' });
        }

        // Return the results to the client
        res.json({ schedules: results });
    });
};

// clockin and out /clock-in
exports.clockIn = (req, res) => {
    const { user_id, schedule_id } = req.body; // Extract user_id and schedule_id from request body
    const clock_in_time = new Date(); // Get the current time

    const query = 'INSERT INTO clock_times (user_id, schedule_id, clock_in_time) VALUES (?, ?, ?)';
    db.query(query, [user_id, schedule_id, clock_in_time], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Clock-in time recorded successfully', id: results.insertId });
    });
};

// Clock Out API /clock-out
exports.clockOut = (req, res) => {
    const { user_id, schedule_id } = req.body; // Extract user_id and schedule_id from request body
    const clock_out_time = new Date(); // Get the current time

    const query = 'UPDATE clock_times SET clock_out_time = ? WHERE user_id = ? AND schedule_id = ? AND clock_out_time IS NULL';
    db.query(query, [clock_out_time, user_id, schedule_id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'No clock-in record found for this user and schedule' });
        }
        res.status(200).json({ message: 'Clock-out time recorded successfully' });
    });
};

// get employee clock in and out time /clock-times/:user_id/:schedule_id
exports.getClockTimes = (req, res) => {
    const { user_id, schedule_id } = req.params;

    const sql = 'SELECT clock_in_time, clock_out_time FROM clock_times WHERE user_id = ? AND schedule_id = ?';
    db.query(sql, [user_id, schedule_id], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json(results[0] || {}); // Return an empty object if no clock times are found
    });
};

// Endpoint to submit skills and qualifications
exports.submitSkill= (req, res) => {
    const { user_id, skills, qualification } = req.body;

    if (!user_id || !Array.isArray(skills) || skills.length === 0 || !qualification) {
        return res.status(400).json({ message: 'Invalid input data' });
    }

    // Iterate over the skills to insert them into the database
    const insertPromises = skills.map(skill => {
        return new Promise((resolve, reject) => {
            // Check if the skill already exists for the user
            db.query(
                `SELECT * FROM skillAcademic WHERE user_id = ? AND skill_id = (SELECT skill_id FROM skills WHERE skill_name = ?)`,
                [user_id, skill],
                (err, results) => {
                    if (err) return reject(err);
                    if (results.length > 0) {
                        // Skill already exists for this user
                        return resolve(null); // Skip this skill
                    } else {
                        // Skill does not exist, insert it
                        db.query(
                            `INSERT INTO skillAcademic (user_id, skill_id, qualification) VALUES (?, (SELECT skill_id FROM skills WHERE skill_name = ?), ?)`,
                            [user_id, skill, qualification],
                            (err, result) => {
                                if (err) return reject(err);
                                resolve(result);
                            }
                        );
                    }
                }
            );
        });
    });

    // Wait for all insertions to complete
    Promise.all(insertPromises)
        .then(results => {
            // Filter out null values (skills that were already submitted)
            const insertedSkills = results.filter(result => result !== null);
            res.status(201).json({ message: 'Skills submitted successfully', insertedSkills });
        })
        .catch(err => {
            console.error('Error inserting skills:', err);
            res.status(500).json({ message: 'Internal server error' });
        });
};

exports.userSkill=(req,res) => {
    const userId = req.params.user_id;
  
    // Adjust the SQL query to match your database structure
    const query = `
      SELECT skills.skill_name 
      FROM skillAcademic 
      JOIN skills ON skillAcademic.skill_id = skills.skill_id 
      WHERE skillAcademic.user_id = ?`;
  
    db.query(query, [userId], (error, results) => {
      if (error) {
        console.error('Error fetching user skills:', error);
        return res.status(500).json({ error: 'Database query error' });
      }
      
      // If no skills found, return an empty array
      if (results.length === 0) {
        return res.json([]);
      }
  
      // Send the results back as a response
      res.json(results);
    });
  };
  



