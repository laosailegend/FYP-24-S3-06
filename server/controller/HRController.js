const db = require('../dbConfig');

// retrieve user details w/o password for HR only + role /HRGetUser
exports.HRGetUser = (req, res) => {
    // inner join to also get their role type as well
    const q = "SELECT userid, nric, fname, lname, contact, email, role FROM users INNER JOIN roles ON users.roleid = roles.roleid"
    db.query(q, (err, data) => {
        if (err) {
            console.log(err);
            return res.json(err)
        }
        return res.json(data);
    })
};

// add payroll information /payroll
exports.createPayroll = async (req, res) => {
    const {
        userid,
        pay_period_start,
        pay_period_end,
        total_hours_worked,
        regular_hours,
        weekend_hours,
        public_holiday_hours,
        overtime_hours,
        base_pay,
        overtime_pay,
        total_pay
    } = req.body;

    // Validate incoming data
    if (!userid || total_hours_worked < 0 || base_pay < 0 || total_pay < 0) {
        return res.status(400).json({ message: 'Invalid input data' });
    }

    try {
        // Prepare the SQL insert query
        const query = `
            INSERT INTO payroll 
            (userid, pay_period_start, pay_period_end, total_hours_worked, 
            regular_hours, weekend_hours, public_holiday_hours, overtime_hours,
            base_pay, overtime_pay, total_pay) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Execute the query with the provided values
        const result = db.query(query, [
            userid,
            pay_period_start,
            pay_period_end,
            total_hours_worked,
            regular_hours,
            weekend_hours,
            public_holiday_hours,
            overtime_hours,
            base_pay,
            overtime_pay,
            total_pay
        ]);
        res.status(201).json({ message: 'Payroll recorded successfully', payroll_id: result.insertId });
    } catch (error) {
        console.error('Error inserting payroll:', error);
        res.status(500).json({ message: 'Failed to record payroll', error: error.message });
    }
};





// Calculating payroll for a specific user based on hours worked and conditions
exports.calculatePayroll = (req, res) => {
    const userid = req.params.userid;

    const query = `
        SELECT 
            u.userid,
            p.position,
            a.assigned_date,
            -- Calculate hourly rate for FT and PT employees
            ROUND(CASE 
                WHEN p.type = 'FT' THEN p.pay / 160  -- Monthly pay converted to hourly for FT employees
                ELSE p.pay  -- Part-time pay is already hourly
            END, 2) AS hourly_rate,
            a.public_holiday,
            a.weekends,
            -- Calculate hours worked
            ROUND(CASE
                WHEN TIME_TO_SEC(c.clock_out_time) < TIME_TO_SEC(c.clock_in_time)
                THEN (TIME_TO_SEC(c.clock_out_time) + 86400 - TIME_TO_SEC(c.clock_in_time)) / 3600
                ELSE (TIME_TO_SEC(c.clock_out_time) - TIME_TO_SEC(c.clock_in_time)) / 3600
            END, 2) AS hours_worked,
            -- Separate weekend hours calculation
            ROUND(CASE 
                WHEN a.weekends = 'yes' THEN
                    CASE
                        WHEN TIME_TO_SEC(c.clock_out_time) < TIME_TO_SEC(c.clock_in_time)
                        THEN (TIME_TO_SEC(c.clock_out_time) + 86400 - TIME_TO_SEC(c.clock_in_time)) / 3600
                        ELSE (TIME_TO_SEC(c.clock_out_time) - TIME_TO_SEC(c.clock_in_time)) / 3600
                    END
                ELSE 0
            END, 2) AS weekend_hours,
            -- Calculate public holiday hours
            ROUND(CASE 
                WHEN a.public_holiday = 'yes' THEN
                    CASE
                        WHEN TIME_TO_SEC(c.clock_out_time) < TIME_TO_SEC(c.clock_in_time)
                        THEN (TIME_TO_SEC(c.clock_out_time) + 86400 - TIME_TO_SEC(c.clock_in_time)) / 3600
                        ELSE (TIME_TO_SEC(c.clock_out_time) - TIME_TO_SEC(c.clock_in_time)) / 3600
                    END
                ELSE 0
            END, 2) AS public_holiday_hours,
            -- Calculate regular hours excluding weekends and public holidays
            ROUND(CASE 
                WHEN a.weekends = 'no' AND a.public_holiday = 'no' THEN
                    CASE
                        WHEN TIME_TO_SEC(c.clock_out_time) < TIME_TO_SEC(c.clock_in_time)
                        THEN (TIME_TO_SEC(c.clock_out_time) + 86400 - TIME_TO_SEC(c.clock_in_time)) / 3600
                        ELSE (TIME_TO_SEC(c.clock_out_time) - TIME_TO_SEC(c.clock_in_time)) / 3600
                    END
                ELSE 0
            END, 2) AS regular_hours,
            -- Calculate overtime hours
            ROUND(CASE
                WHEN (TIME_TO_SEC(c.clock_out_time) - TIME_TO_SEC(c.clock_in_time)) / 3600 > (TIME_TO_SEC(a.end_time) - TIME_TO_SEC(a.start_time)) / 3600
                THEN ((TIME_TO_SEC(c.clock_out_time) - TIME_TO_SEC(c.clock_in_time)) / 3600 - (TIME_TO_SEC(a.end_time) - TIME_TO_SEC(a.start_time)) / 3600)
                ELSE 0
            END, 2) AS overtime_hours,
            -- Calculate base pay with multipliers for public holidays and weekends
            ROUND(CASE 
                WHEN a.public_holiday = 'yes' THEN 
                    (CASE 
                        WHEN p.type = 'FT' THEN p.pay / 160
                        ELSE p.pay 
                    END * 
                    CASE
                        WHEN TIME_TO_SEC(c.clock_out_time) < TIME_TO_SEC(c.clock_in_time)
                        THEN (TIME_TO_SEC(c.clock_out_time) + 86400 - TIME_TO_SEC(c.clock_in_time)) / 3600
                        ELSE (TIME_TO_SEC(c.clock_out_time) - TIME_TO_SEC(c.clock_in_time)) / 3600
                    END) * 2
                WHEN a.weekends = 'yes' THEN 
                    (CASE 
                        WHEN p.type = 'FT' THEN p.pay / 160
                        ELSE p.pay 
                    END * 
                    CASE
                        WHEN TIME_TO_SEC(c.clock_out_time) < TIME_TO_SEC(c.clock_in_time)
                        THEN (TIME_TO_SEC(c.clock_out_time) + 86400 - TIME_TO_SEC(c.clock_in_time)) / 3600
                        ELSE (TIME_TO_SEC(c.clock_out_time) - TIME_TO_SEC(c.clock_in_time)) / 3600
                    END) * 1.5
                ELSE 
                    (CASE 
                        WHEN p.type = 'FT' THEN p.pay / 160
                        ELSE p.pay 
                    END * 
                    CASE
                        WHEN TIME_TO_SEC(c.clock_out_time) < TIME_TO_SEC(c.clock_in_time)
                        THEN (TIME_TO_SEC(c.clock_out_time) + 86400 - TIME_TO_SEC(c.clock_in_time)) / 3600
                        ELSE (TIME_TO_SEC(c.clock_out_time) - TIME_TO_SEC(c.clock_in_time)) / 3600
                    END)
            END, 2) AS base_pay,
            -- Calculate overtime pay
            ROUND(CASE 
                WHEN (TIME_TO_SEC(c.clock_out_time) - TIME_TO_SEC(c.clock_in_time)) / 3600 > (TIME_TO_SEC(a.end_time) - TIME_TO_SEC(a.start_time)) / 3600
                THEN ((TIME_TO_SEC(c.clock_out_time) - TIME_TO_SEC(c.clock_in_time)) / 3600 - (TIME_TO_SEC(a.end_time) - TIME_TO_SEC(a.start_time)) / 3600) * 
                    (CASE 
                        WHEN p.type = 'FT' THEN p.pay / 160
                        ELSE p.pay
                     END) * 1.5
                ELSE 0 
            END, 2) AS overtime_pay
        FROM 
            users u
        JOIN 
            positions p ON u.posid = p.posid
        JOIN 
            assignments a ON u.userid = a.userid
        JOIN 
            clock_times c ON a.assignment_id = c.assignment_id
        WHERE 
            u.userid = ?`;

    db.query(query, [userid], (err, results) => {
        if (err) {
            console.error('Error calculating payroll:', err);
            return res.status(500).json({ error: 'Failed to calculate payroll' });
        }

        // Calculate total pay by adding base and overtime pay
        const payrollResults = results.map(result => {
            // Log the base and overtime pay before calculation
            console.log('Base Pay:', result.base_pay);
            console.log('Overtime Pay:', result.overtime_pay);

            // Ensure base and overtime pay are numbers, and handle NaN cases
            const totalPay = (isNaN(result.base_pay) ? 0 : parseFloat(result.base_pay)) + (isNaN(result.overtime_pay) ? 0 : parseFloat(result.overtime_pay));

            console.log('Total Pay:', totalPay);

            return {
                ...result,
                totalPay,
                overtime_hours: result.overtime_hours, // Add overtime hours to the result
            };
        });

        // Send the payroll calculation result
        res.status(200).json({ payroll: payrollResults });
    });
};


exports.getPayrollQueries = (req, res) => {
    const query_id = req.params.query_id;  // Extract query_id from the URL

    // Correct the SQL query to join payroll_queries with users and filter by query_id
    const query = `
      SELECT pq.query_id, pq.query_date, pq.description, pq.status, pq.response, u.fname, u.lname 
      FROM payroll_queries pq
      LEFT JOIN users u ON pq.user_id = u.userid;`;

    db.query(query, [query_id], (error, results) => {
        if (error) {
            console.error('Error fetching queries:', error);
            return res.status(500).json({ error: 'Database query error' });
        }

        // If no results are found, return an empty array
        if (results.length === 0) {
            return res.json([]);
        }

        // Send the results back as a response
        res.json(results);
    });
};


// Assuming this route handles a PUT request with file upload
exports.updatePayrollQueries = async (req, res) => {
    const { query_id } = req.params;
    const { response, status } = req.body;
    let receiptUrl = null;

    if (req.file) {
        // Normalize the file path to use forward slashes
        receiptUrl = req.file.path.replace(/\\/g, '/');  // Replaces backslashes with forward slashes
    }

    console.log('Update request for payroll query:', { query_id, response, status, receiptUrl });

    // SQL query for updating the payroll query
    const query = `
        UPDATE payroll_queries
        SET response = ?, status = ?, receipt_url = ?
        WHERE query_id = ?
    `;

    try {
        // Execute the SQL query
        const result = db.query(query, [response, status, receiptUrl, query_id]);

        // If no rows are updated, return a 404 error
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Payroll query not found.' });
        }

        // Successfully updated the payroll query
        res.status(200).json({ message: 'Payroll query updated successfully.' });
    } catch (error) {
        console.error('Error updating payroll query:', error);
        res.status(500).json({ error: `Failed to update payroll query: ${error}` });
    }
};






// Assuming you have a positions table in your database
exports.getPosition = (req, res) => {
    const posid = req.params.posid;

    // Adjust the SQL query to match your database structure
    const query = `
      SELECT posid, position, type, pay, industryid 
      FROM positions `;
    db.query(query, [posid], (error, results) => {
        if (error) {
            console.error('Error fetching position:', error);
            return res.status(500).json({ error: 'Database query error' });
        }

        // If no positions found, return an empty array
        if (results.length === 0) {
            return res.json([]);
        }

        // Send the results back as a response
        res.json(results);
    });
};

exports.getclockTime = (req, res) => {
    const userid = req.params.userid;

    // Adjust the SQL query to match your database structure
    const query = `
      SELECT id, user_id, assignment_id, clock_in_time, clock_out_time, status 
      FROM clock_times `;
    db.query(query, [userid], (error, results) => {
        if (error) {
            console.error('Error fetching position:', error);
            return res.status(500).json({ error: 'Database query error' });
        }

        // If no clocktime found, return an empty array
        if (results.length === 0) {
            return res.json([]);
        }

        // Send the results back as a response
        res.json(results);
    });
};


// get user schedule /user/assignments/:userid
exports.getUserAssignment = (req, res) => {
    const userId = req.params.userid;

    const query = `
        SELECT 
            a.assignment_id,
            a.taskid,
            a.userid,
            t.task_date,        -- Select task_date from the task table
            a.assigned_date,
            a.start_time,
            a.end_time,
            ct.clock_in_time,
            ct.clock_out_time
        FROM 
            assignments a
        LEFT JOIN 
            clock_times ct ON a.assignment_id = ct.assignment_id
        LEFT JOIN
            tasks t ON a.taskid = t.taskid  -- Join with task table on taskid
        WHERE 
            a.userid = ?
    `;

    db.query(query, [userId], (error, results) => {
        if (error) {
            console.error('Error retrieving schedules:', error);
            return res.status(500).json({ error: 'Database error' });
        }

        // Format the output to include taskDate
        const formattedResults = results.map(row => ({
            assignmentId: row.assignment_id,
            userId: row.userid,
            taskDate: row.task_date,         // Add taskDate to formatted results
            assignedDate: row.assigned_date,
            startTime: row.start_time,
            endTime: row.end_time,
            clockInTime: row.clock_in_time,
            clockOutTime: row.clock_out_time
        }));

        res.json(formattedResults);
    });
};



// insert a new training session
exports.createTrainingSession = async (req, res) => {
    const { skill_id, description, trainer, start_date, start_time, end_date, end_time } = req.body;

    try {
        const query = `
        INSERT INTO training_sessions (skill_id, description, trainer, start_date, start_time, end_date, end_time)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

        db.query(query, [skill_id, description, trainer, start_date, start_time, end_date, end_time]);

        res.status(201).json({ message: 'Training session created successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create training session.' });
    }
};

// retrieve all training sessions
exports.getTrainingSessions = async (req, res) => {
    const query = `
            SELECT ts.session_id, ts.skill_id, ts.description, ts.trainer, 
                   ts.start_date, ts.start_time, ts.end_date, ts.end_time, 
                   s.skill_name
            FROM training_sessions ts
            JOIN skills s ON ts.skill_id = s.skill_id
        `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching time-off requests:', err);
            return res.status(500).json({ error: 'Failed to fetch requests' });
        }
        res.json(results);
    });
};


// update a training session by ID
exports.updateTrainingSession = async (req, res) => {
    const { session_id } = req.params;
    const { skill_id, description, trainer, start_date, start_time, end_date, end_time } = req.body;

    console.log('Update request for session:', {
        session_id,
        skill_id,
        description,
        trainer,
        start_date,
        start_time,
        end_date,
        end_time
    });

    try {
        const query = `
            UPDATE training_sessions 
            SET skill_id = ?, description = ?, trainer = ?, 
                start_date = ?, start_time = ?, end_date = ?, end_time = ? 
            WHERE session_id = ?
        `;
        const result = db.query(query, [skill_id, description, trainer, start_date, start_time, end_date, end_time, session_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Training session not found.' });
        }

        res.status(200).json({ message: 'Training session updated successfully.' });
    } catch (error) {
        console.error('Error updating training session:', error);
        res.status(500).json({ error: 'Failed to update session.' });
    }
};


// delete a training session by ID
exports.deleteTraining = (req, res) => {
    const { id } = req.params;
    const deleteQuery = 'DELETE FROM training_sessions WHERE session_id = ?';

    db.query(deleteQuery, [id], (err, result) => {
        if (err) {
            console.error('Error deleting session:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        return res.status(200).json({ message: 'Session deleted successfully' });
    });
};

exports.getSkills = (req, res) => {
    const userId = req.params.user_id;

    // Adjust the SQL query to match your database structure
    const query = `
        SELECT skills.skill_id, skills.skill_name 
        FROM skills `;
    db.query(query, [userId], (error, results) => {
        if (error) {
            console.error('Error fetching skills:', error);
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

//updating the user interest status to 'completed'
exports.postTraining = (req, res) => {
    const { interest_id } = req.params;
    db.query(
        `UPDATE user_interest SET status = 'completed' WHERE interest_id = ?`,
        [interest_id],
        (err, results) => {
            if (err) {
                console.error('Error updating training status:', err);
                return res.status(500).json({ error: 'Failed to update training status' });
            }

            // Step 2: Send a success response
            res.status(200).json({ message: 'Training status updated to completed!' });
        }
    );
};




//retireve all sessions that user are interested in
exports.getAllSessions = async (req, res) => {
    const query = `
        SELECT ui.interest_id, ui.userid, ui.session_id, ui.status,
               ts.skill_id, ts.description, ts.trainer, 
               ts.start_date, ts.start_time, ts.end_date, ts.end_time, s.skill_name, u.fname, u.lname
        FROM user_interest ui
        JOIN training_sessions ts ON ui.session_id = ts.session_id
        JOIN skills s ON ts.skill_id = s.skill_id
        JOIN users u ON ui.userid = u.userid`;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching sessions:', error);
            return res.status(500).json({ error: 'Database query error' });
        }

        // Log results to check what is being returned
        console.log('Database results:', results);

        // If no sessions found, return an empty array
        if (results.length === 0) {
            return res.json([]);
        }

        // Send the results back as a response
        res.json(results);
    });
};

//retrieve all the feedbacks
exports.getFeedback = (req, res) => {
    const query = `
        SELECT f.feedback_id, f.user_id, f.feedback_date, f.comments, f.rating, u.fname, u.lname
        FROM feedback f
        JOIN users u ON f.user_id = u.userid
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching feedback:', err);
            return res.status(500).json({ error: 'Failed to fetch feedback' });
        }
        res.status(200).json(results);
    });
};


//shift swap request
exports.handleShiftSwapRequest = (req, res) => {
    const { swap_id, status } = req.body;

    // Validate input
    if (!swap_id || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    // Retrieve the shift swap request details
    db.query(
        `SELECT requestor_assignment_id, target_assignment_id FROM shift_swap_requests WHERE swap_id = ? AND status = 'pending'`,
        [swap_id],
        (err, swapRequests) => {
            if (err) {
                console.error('Error fetching swap request:', err);
                return res.status(500).json({ error: 'Server error', details: err.message });
            }

            const swapRequest = swapRequests[0];
            if (!swapRequest) {
                return res.status(404).json({ error: 'Shift swap request not found or already processed' });
            }

            const { requestor_assignment_id, target_assignment_id } = swapRequest;

            if (status === 'approved') {
                // Retrieve user IDs for the requestor and target assignments
                db.query(`SELECT userid FROM assignments WHERE assignment_id = ?`, [requestor_assignment_id], (err, requestorAssignment) => {
                    if (err || !requestorAssignment.length) {
                        return res.status(404).json({ error: 'Requestor assignment not found' });
                    }

                    db.query(`SELECT userid FROM assignments WHERE assignment_id = ?`, [target_assignment_id], (err, targetAssignment) => {
                        if (err || !targetAssignment.length) {
                            return res.status(404).json({ error: 'Target assignment not found' });
                        }

                        // Swap user IDs between the requestor and target assignments
                        db.query(`UPDATE assignments SET userid = ? WHERE assignment_id = ?`, [targetAssignment[0].userid, requestor_assignment_id], (err) => {
                            if (err) return res.status(500).json({ error: 'Server error', details: err.message });

                            db.query(`UPDATE assignments SET userid = ? WHERE assignment_id = ?`, [requestorAssignment[0].userid, target_assignment_id], (err) => {
                                if (err) return res.status(500).json({ error: 'Server error', details: err.message });

                                // Update the status of the swap request to 'approved'
                                db.query(`UPDATE shift_swap_requests SET status = 'approved' WHERE swap_id = ?`, [swap_id], (err) => {
                                    if (err) return res.status(500).json({ error: 'Server error', details: err.message });

                                    return res.json({ message: 'Shift swap approved' });
                                });
                            });
                        });
                    });
                });
            } else if (status === 'rejected') {
                // Update the status of the swap request to 'rejected'
                db.query(`UPDATE shift_swap_requests SET status = 'rejected' WHERE swap_id = ?`, [swap_id], (err) => {
                    if (err) {
                        console.error('Error rejecting shift swap request:', err);
                        return res.status(500).json({ error: 'Server error', details: err.message });
                    }

                    return res.json({ message: 'Shift swap rejected' });
                });
            }
        }
    );
};


// Fetch all pending shift swap requests with user names and user IDs
exports.getPendingShiftSwapRequests = async (req, res) => {
    const query = `
        SELECT ssr.swap_id, ssr.userid, ssr.requestor_assignment_id, ssr.target_assignment_id, ssr.status, 
        u.fname AS requestor_fname, u.lname AS requestor_lname
        FROM shift_swap_requests ssr
        JOIN users u ON ssr.userid = u.userid
        WHERE ssr.status = 'pending'
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(200).json({ swapRequests: results });
    });
};





