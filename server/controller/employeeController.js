const jwt = require('jsonwebtoken');
const db = require('../dbConfig');
const logger = require('../utils/logger');
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
        SELECT request_id,request_date, start_date, end_date, reason, status FROM requestleave WHERE userid = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching leave requests:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.status(200).json(results);
    });
};
// Endpoint to delete a specific leave request
exports.deleteRequestLeave= (req, res) => {
    const requestId = req.params.id;
  
    const query = 'DELETE FROM requestleave WHERE request_id = ?';
    db.query(query, [requestId], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to delete the request' });
      }
      res.json({ message: 'Request deleted successfully' });
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

// Get Assignments by User ID
exports.getAssignmentId = (req, res) => {
    const { userid } = req.params;

    // Check if the user ID is provided
    if (!userid) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    // Define the query to fetch assignments for the given user ID, including status and task name
    const query = `
        SELECT a.*, ct.status, t.taskname 
        FROM assignments a 
        LEFT JOIN clock_times ct ON a.assignment_id = ct.assignment_id AND ct.user_id = ? 
        LEFT JOIN tasks t ON a.taskid = t.taskid 
        WHERE a.userid = ?
    `;

    // Execute the query
    db.query(query, [userid, userid], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }

        // Check if the query returned any results
        if (results.length === 0) {
            return res.status(404).json({ error: 'No assignments found for this user' });
        }

        // Return the results to the client
        res.json({ assignments: results });
    });
};



// Clock In API /clock-in
exports.clockIn = (req, res) => {
    const { user_id, assignment_id } = req.body; // Extract user_id and assignment_id from request body
    const clock_in_time = new Date(); // Get the current time

    const query = 'INSERT INTO clock_times (user_id, assignment_id, clock_in_time) VALUES (?, ?, ?)';
    db.query(query, [user_id, assignment_id, clock_in_time], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Clock-in time recorded successfully', id: results.insertId });
    });
};

// Clock Out API /clock-out
exports.clockOut = (req, res) => {
    const { user_id, assignment_id } = req.body; // Extract user_id and assignment_id from request body
    const clock_out_time = new Date(); // Get the current time

    const query = 'UPDATE clock_times SET clock_out_time = ? WHERE user_id = ? AND assignment_id = ? AND clock_out_time IS NULL';
    db.query(query, [clock_out_time, user_id, assignment_id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'No clock-in record found for this user and assignment' });
        }
        res.status(200).json({ message: 'Clock-out time recorded successfully' });
    });
};

// Get Employee Clock In and Out Times /clock-times/:user_id/:assignment_id
exports.getClockTimes = (req, res) => {
    const { user_id, assignment_id } = req.params;

    const sql = 'SELECT clock_in_time, clock_out_time, status FROM clock_times WHERE user_id = ? AND assignment_id = ?';
    db.query(sql, [user_id, assignment_id], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json(results[0] || {}); // Return an empty object if no clock times are found
    });
};

exports.updatedClocktime= async (req, res) => {
    const { user_id, assignment_id, status } = req.body;
  
    try {
      const result = await db.query(
        'UPDATE clock_times SET status = ? WHERE user_id = ? AND assignment_id = ?',
        [status, user_id, assignment_id]
      );
      res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
      console.error('Error updating clock time status:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  };
  

// Endpoint to submit skills and qualifications
exports.submitSkill = (req, res) => {
    const { skill_id } = req.body; // Extract skill_id from the request body
    const userId = req.params.userid; // Get the user ID from the URL parameter

    // Ensure skill_id is a valid JSON string and parse it
    let skillIdsArray;
    try {
        skillIdsArray = JSON.parse(skill_id); // Convert string to array
    } catch (error) {
        return res.status(400).json({ message: "Invalid skill_id format" });
    }

    // Optionally: Check if skillIdsArray is an array
    if (!Array.isArray(skillIdsArray)) {
        return res.status(400).json({ message: "skill_id must be an array" });
    }

    const query = `
      UPDATE users 
      SET skill_id = ? 
      WHERE userid = ?
    `;

    // Convert the array back to a JSON string if you're storing it as such
    const values = [JSON.stringify(skillIdsArray), userId]; // Store as a JSON string
    console.log("Inserting skill_ids:", values);

    db.query(query, values, (error, results) => {
        if (error) {
            console.error("Error updating skills: ", error);
            return res.status(500).json({ message: "Failed to update user skills" });
        }

        res.status(200).json({ message: "User skills updated successfully" });
    });
};


exports.userSkill = (req, res) => {
    const userId = req.params.userid;
  
    // SQL query to get skill_ids from the user
    const getSkillsQuery = `
      SELECT skill_id 
      FROM users 
      WHERE userid = ?
    `;
  
    db.query(getSkillsQuery, [userId], (error, userResults) => {
      if (error) {
        console.error("Error fetching user skills: ", error);
        return res.status(500).json({ message: "Failed to fetch user skills" });
      }
  
      if (userResults.length === 0) {
        return res.status(404).json({ message: "User not found or no skills assigned" });
      }
  
      // Extract skill_ids from the user result
      const skillIdString = userResults[0].skill_id; // This should be '[5, 6]' in string format
  
      // Log the raw skill_id to verify its format
      console.log("Raw skill_id:", skillIdString);
  
      let skillIds;
      try {
        skillIds = JSON.parse(skillIdString); // Parse the JSON string to an array
      } catch (parseError) {
        console.error("Error parsing skill_ids: ", parseError);
        return res.status(500).json({ message: "Error processing skill IDs", error: parseError.message });
      }
  
      // Respond with the skill IDs array
      res.status(200).json({ skill_ids: skillIds }); // Respond with the skill IDs as an array
    });
  };
  
  
  
// Endpoint to retrieve all training sessions
exports.getAllTrainingSessions = (req, res) => {
    const query = 'SELECT * FROM training_sessions';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(200).json({ error: 'No training sessions found',training_sessions:[] });
        }

        res.json({ training_sessions: results });
    });
};
// Endpoint to express interest in a training session
exports.expressInterest = (req, res) => {
    const { user_id, session_id } = req.body;

    if (!user_id || !session_id) {
        return res.status(400).json({ error: 'User ID and Session ID are required' });
    }

    const query = 'INSERT INTO user_interest (userid, session_id) VALUES (?, ?)';

    db.query(query, [user_id, session_id], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Interest already expressed in this session' });
            }
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({ message: 'Interest expressed successfully' });
    });
};


// Retrieve sessions the user has expressed interest in
exports.retriveUserInterest = (req, res) => {
    const { userId } = req.params;
  
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
  
    const query = `
      SELECT session_id 
      FROM user_interest 
      WHERE userid = ?
    `;
  
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Database error');
      }
  
      // Return the session IDs that the user is interested in
      const interestedSessions = results.map(result => result.session_id);
      res.json({ interestedSessions });
    });
  };
  
// Endpoint to submit feedback
exports.submitFeedback = async (req, res) => {
    const { user_id, comments, rating } = req.body;
    const feedbackDate = new Date().toISOString().slice(0, 10);  // Format current date as YYYY-MM-DD

    // Validate input
    if (!user_id || !comments || rating === undefined) {
        return res.status(400).json({ error: 'User ID, comments, and rating are required' });
    }

    const query = `INSERT INTO feedback (user_id, feedback_date, comments, rating) VALUES (?, ?, ?, ?)`;

    db.query(query, [user_id, feedbackDate, comments, rating], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Return success response with feedback ID
        return res.status(201).json({ message: 'Feedback submitted successfully', feedback_id: results.insertId });
    });
};


// Endpoint to retrieve feedback for a user
exports.getFeedback = async (req, res) => {
    const { userId } = req.params;

    // Validate input
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    const query = `SELECT * FROM feedback WHERE user_id = ? ORDER BY feedback_date DESC`;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(200).json({ error: 'No feedback found',feedback:[] });
        }

        // Return the feedback results
        res.json({ feedback: results });
    });
};

// Endpoint to fetch all tasks
// Endpoint to retrieve all tasks
exports.getTask = async (req, res) => {
    // Step 1: Define SQL query
    const query = `SELECT * FROM tasks`;

    // Step 2: Execute the query
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            // Step 3: Handle query errors
            return res.status(500).json({ error: 'Database error' });
        }

        // Step 4: Check if tasks are found
        if (results.length === 0) {
            return res.status(200).json({ error: 'No tasks found',tasks:[] });
        }

        // Step 5: Return all tasks in JSON format
        res.json({ tasks: results });
    });
};

exports.getUserAssignments = async (req, res) => {
    const { userId } = req.params;

    // Validate input
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    // Join with tasks table to retrieve taskname
    const query = `
        SELECT a.assignment_id, a.assigned_date, a.start_time, a.end_time, 
               a.public_holiday, a.weekends, t.taskname
        FROM assignments AS a
        JOIN tasks AS t ON a.taskid = t.taskid
        WHERE a.userid = ?
        ORDER BY a.assigned_date DESC
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(200).json({ error: 'No assignments found',assignments:[] });
        }

        // Return the user's assignments with taskname
        res.json({ assignments: results });
    });
};


exports.getOtherUsersAssignments = async (req, res) => {
    const { userId } = req.params;

    // Validate input
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    // Join with tasks table to retrieve taskname
    const query = `
        SELECT a.assignment_id, a.assigned_date, a.start_time, a.end_time, 
               a.public_holiday, a.weekends, t.taskname
        FROM assignments AS a
        JOIN tasks AS t ON a.taskid = t.taskid
        WHERE a.userid != ?
        ORDER BY a.assigned_date DESC
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(200).json({ error: 'No assignments found for other users',assignments:[] });
        }

        // Return the other users' assignments with taskname
        res.json({ assignments: results });
    });
};


//swapping store in shift_swap_requests table
exports.submitSwapRequest = async (req, res) => {
    const { userid, requestor_assignment_id, target_assignment_id, status } = req.body;

    // Validate input
    if (!userid || !requestor_assignment_id || !target_assignment_id || !status) {
        return res.status(400).json({ error: 'All fields are required: userid, requestor_assignment_id, target_assignment_id, status' });
    }

    const query = `
        INSERT INTO shift_swap_requests (userid, requestor_assignment_id, target_assignment_id, status, request_date)
        VALUES (?, ?, ?, ?, NOW())
    `;

    db.query(query, [userid, requestor_assignment_id, target_assignment_id, status], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Return success message and inserted swap request ID
        res.json({ message: 'Swap request submitted successfully', swapRequestId: results.insertId });
    });
};

// Fetch user's leave balance
exports.getUserLeaveBalance = async (req, res) => {
    const { userId } = req.params;
  
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
  
    const query = `SELECT leave_balance FROM users WHERE userid = ?`;
  
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Return the user's leave balance
      res.json({ leave_balance: results[0].leave_balance });
    });
  };
  
  // Fetch payroll records for a user
  exports.getUserPayrolls = async (req, res) => {
    const { userId } = req.params;
  
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
  
    const query = `SELECT * FROM payroll WHERE userid = ? ORDER BY pay_period_start DESC`;
  
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
  
      if (results.length === 0) {
        // No records found for this user, but the request was successful
        return res.status(200).json({ message: 'No payroll records found', payrolls: [] });
      }
  
      // Return the user's payroll records
      res.json({ payrolls: results });
    });
  };
  
  // In your Express backend
exports.submitPayrollQuery = async (req, res) => {
    const { user_id, description } = req.body;
    
    if (!user_id || !description) {
      return res.status(400).json({ error: 'User ID and description are required' });
    }
  
    const query = `INSERT INTO payroll_queries (user_id, query_date, description, status) VALUES (?, NOW(), ?, 'Pending')`;
  
    db.query(query, [user_id, description], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ message: 'Query submitted successfully' });
    });
  };
  
  // In your backend routes file, e.g., payrollQueriesRoutes.js
  exports.getPayrollQueries = async (req, res) => {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const query = `SELECT * FROM payroll_queries WHERE user_id = ? ORDER BY query_date DESC`;

    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (results.length === 0) {
        return res.status(200).json({ message: 'No payrollQuery records found', payrollQueries: [] });
      }

      res.json({ payrollQueries: results });
    });
};

exports.submitAvailability = async (req, res) => {
    const { userid, availability } = req.body;
  
    if (!userid || !availability) {
      return res.status(400).json({ error: 'User ID and availability are required' });
    }
  
    const query = `UPDATE users SET availability = ? WHERE userid = ?`;
  
    db.query(query, [availability, userid], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ message: 'Availability submitted successfully' });
    });
  };
  
  exports.getAvailability = async (req, res) => {
    const { userId } = req.params;  // Access userId from URL parameter
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
  
    const query = `SELECT availability FROM users WHERE userid = ?`;
  
    db.query(query, [userId], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json({ availability: result[0].availability ? result[0].availability.split(',') : [] });
    });
  };
  

  

