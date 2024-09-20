import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import '../style.css';

function TimeOffRequest() {
  const tokenObj = localStorage.getItem("token") ? JSON.parse(atob(localStorage.getItem("token").split('.')[1])) : null;
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [requests, setRequests] = useState([]);

  const handleDateChange = (date, isStartDate) => {
    if (isStartDate) {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
  };

  const handleInputChange = (e) => {
    setReason(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Dummy user ID
    const userid = tokenObj.id; // Replace with actual userid if needed

    const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
    const formattedEndDate = moment(endDate).format('YYYY-MM-DD');
    const reasonText = reason.trim();
    const requestDate = moment().format('YYYY-MM-DD'); // Current date for request_date

    fetch('http://localhost:8800/requestLeave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid, // Dummy userid
        request_date: requestDate, // Current date
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        reason: reasonText
      }),
    })
      .then((res) => res.json())
      .then(() => {
        alert('Time off request submitted successfully');
      })
      .catch((err) => {
        console.error('Error:', err);
        alert('Failed to submit time off request');
      });
  };

  // Convert date to dd/mm/yyyy format for display
  const formatDate = (date) => moment(date).format('DD/MM/YYYY');

  useEffect(() => {
    if (!tokenObj || (tokenObj.role !== 1 && tokenObj.role !== 3)) {
      window.alert("You are not authorized to view this page");
      navigate("/", { replace: true });
      return () => { }
    }

    if (tokenObj === null) {
      return null;
    }

    const fetchLeave = async () => {
      try {
        const res = await axios.get(`http://localhost:8800/getRequestLeave/${tokenObj.id}`);
        setRequests(res.data);
      } catch (e) {
        console.log(e);
      }
    };

    fetchLeave();
  });

  return (
    <div className="time-off-request-container">
      <h2>Request Time Off</h2>
      <div className="calendar-container">
        <Calendar
          onChange={(date) => handleDateChange(date, true)}
          value={startDate}
          className="calendar"
        />
        <Calendar
          onChange={(date) => handleDateChange(date, false)}
          value={endDate}
          className="calendar"
        />
      </div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Start Date:</label>
          <input
            type="text"
            value={formatDate(startDate)}
            readOnly
            placeholder="dd/mm/yyyy"
          />
        </div>
        <div>
          <label>End Date:</label>
          <input
            type="text"
            value={formatDate(endDate)}
            readOnly
            placeholder="dd/mm/yyyy"
          />
        </div>
        <div>
          <label>Reason:</label>
          <textarea
            name="reason"
            value={reason}
            onChange={handleInputChange}
            placeholder="Enter the reason for your time off request"
            required
          />
        </div>
        <button type="submit">Submit Request</button>
      </form>

      <div className="request-history">
        <h3>Request History</h3>
        <ul>
          {requests.map((request, index) => (
            <li key={index}>
              From: {moment(request.start_date).format('DD/MM/YYYY')} - To: {moment(request.end_date).format('DD/MM/YYYY')} - Reason: {request.reason} - Status: {request.status}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default TimeOffRequest;
