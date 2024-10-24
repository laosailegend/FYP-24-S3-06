const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../dbConfig');
const logger = require('./logger');
const SECRET_KEY = process.env.JWT_SECRET;

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

//all pending time-off requests /timeoff
exports.getTimeoffRequests = (req, res) => {
    // Define the status to filter by (in this case, 'pending')
    const status = 'pending';
    const query = `
        SELECT r.request_id, u.fname, u.lname, r.request_date, r.start_date, r.end_date, r.reason, r.status
        FROM requestleave r
        JOIN users u ON r.userid = u.userid
        WHERE r.status = ?
    `;
    db.query(query, [status], (err, results) => {
        if (err) {
            console.error('Error fetching time-off requests:', err);
            return res.status(500).json({ error: 'Failed to fetch requests' });
        }
        res.json(results);
    });
};

//update time-off request status /timeoff/:request_id
exports.updateTimeoffStatus = (req, res) => {
    const { request_id } = req.params;
    const { status } = req.body;

    const query = 'UPDATE requestleave SET status = ? WHERE request_id = ?';

    db.query(query, [status, request_id], (err, results) => {
        if (err) {
            console.error('Error updating request status:', err);
            return res.status(500).json({ error: 'Failed to update request status' });
        }
        res.status(200).json({ message: 'Request status updated successfully' });
    });
};

//view all available status /available
exports.getAvailStatus = (req, res) => {
    const query = `
        SELECT a.availability_id, a.available_date, a.start_time, a.end_time, a.status, u.fname, u.lname
        FROM availability a
        JOIN users u ON a.userid = u.userid
        WHERE status = 'available'
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching availability:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.status(200).json(results);
    });
};


//create availability form /available
exports.createAvailabilityForm = (req, res) => {
    console.log('Request body:', req.body);

    const { userid, available_date, start_time, end_time, status } = req.body;

    // Ensure required fields are present (but allow userid to be null)
    if (!available_date || !start_time || !end_time) {
        return res.status(400).send({ error: 'All fields (available_date, start_time, end_time) are required' });
    }

    const query = `
        INSERT INTO availability (userid, available_date, start_time, end_time, status)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(query, [userid || null, available_date, start_time, end_time, status || 'pending'], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send({ error: 'Failed to add availability' });
        }
        res.send({ message: 'Availability added successfully', id: results.insertId });
    });
};

//delete availability form /available/:id
exports.deleteAvailabilityForm = (req, res) => {
    const { id } = req.params;
    const deleteQuery = 'DELETE FROM availability WHERE availability_id = ?';

    db.query(deleteQuery, [id], (err, result) => {
        if (err) {
            console.error('Error deleting availability:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Availability not found' });
        }

        return res.status(200).json({ message: 'Availability deleted successfully' });
    });
};

// /getAvailable
exports.getAvailable = (req, res) => {
    const query = `
        SELECT availability_id, available_date, start_time, end_time, status
        FROM availability 
        WHERE status = 'pending'
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching availability:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.status(200).json(results);
    });
};