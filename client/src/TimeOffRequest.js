import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import './style.css';

function TimeOffRequest() {
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
    const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
    const formattedEndDate = moment(endDate).format('YYYY-MM-DD');
    const reasonText = reason.trim();

    fetch('/time-off-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ start_date: formattedStartDate, end_date: formattedEndDate, reason: reasonText }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert('Time off request submitted successfully');
        setRequests([...requests, { start_date: formattedStartDate, end_date: formattedEndDate, reason: reasonText }]);
      })
      .catch((err) => {
        console.error('Error:', err);
        alert('Failed to submit time off request');
      });
  };

  // Convert date to dd/mm/yyyy format for display
  const formatDate = (date) => moment(date).format('DD/MM/YYYY');

  return (
    <div className="time-off-request-container">
      <h2>Request Time Off</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Start Date:</label>
          <Calendar
            onChange={(date) => handleDateChange(date, true)}
            value={startDate}
            className="calendar"
          />
          <input
            type="text"
            value={formatDate(startDate)}
            readOnly
            placeholder="dd/mm/yyyy"
          />
        </div>
        <div>
          <label>End Date:</label>
          <Calendar
            onChange={(date) => handleDateChange(date, false)}
            value={endDate}
            className="calendar"
          />
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
              From: {moment(request.start_date).format('DD/MM/YYYY')} - To: {moment(request.end_date).format('DD/MM/YYYY')} - Reason: {request.reason}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default TimeOffRequest;
