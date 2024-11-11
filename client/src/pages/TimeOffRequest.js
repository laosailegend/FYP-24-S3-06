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
  const server = process.env.REACT_APP_SERVER;

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [requests, setRequests] = useState([]);
  const [publicHolidays, setPublicHolidays] = useState({});

  const apiKey = '8WUuhRGlcWlVOlJoTJOYApvnaiVzmQsO';  // Calendarific API key

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
    const userid = tokenObj.id;

    const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
    const formattedEndDate = moment(endDate).format('YYYY-MM-DD');
    const reasonText = reason.trim();
    const requestDate = moment().format('YYYY-MM-DD');

    fetch(`${server}requestLeave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userid,
        request_date: requestDate,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        reason: reasonText,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        alert('Time off request submitted successfully');
        setReason('');
        fetchLeave(); // Refresh the request list after submission
      })
      .catch((err) => {
        console.error('Error:', err);
        alert('Failed to submit time off request');
      });
  };

  const handleDelete = async (requestId) => {
    try {
      await axios.delete(`${server}deleteRequestLeave/${requestId}`);
      alert('Request deleted successfully');
      setRequests(requests.filter((request) => request.request_id !== requestId)); // Update the UI
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request');
    }
  };

  const formatDate = (date) => moment(date).format('DD/MM/YYYY');

  const fetchLeave = async () => {
    try {
      const res = await axios.get(`${server}getRequestLeave/${tokenObj.id}`);
      setRequests(res.data);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (!tokenObj || (tokenObj.role !== 1 && tokenObj.role !== 3)) {
      window.alert("You are not authorized to view this page");
      navigate("/", { replace: true });
      return () => { };
    }

    fetchLeave();
    // Fetch Public Holidays from Calendarific API
    const fetchPublicHolidays = async () => {
      const yearsToFetch = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]; // Fetch public holidays for these years
      const holidays = {};

      for (let year of yearsToFetch) {
        try {
          const response = await axios.get(`https://calendarific.com/api/v2/holidays?&api_key=${apiKey}&country=SG&year=${year}`);
          response.data.response.holidays.forEach((holiday) => {
            const dateString = moment(holiday.date.iso).format('YYYY-MM-DD');
            holidays[dateString] = holiday.name;
          });
        } catch (error) {
          console.error(`Error fetching public holidays for year ${year}:`, error);
        }
      }

      setPublicHolidays(holidays);  // Store the holidays in state
    };

    fetchPublicHolidays();
  }, []);


  return (
    <div className="time-off-request-container">
      <h2>Request Time Off</h2>
      <div className="calendar-container">
        <div className="calendar-side-by-side" style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
          <Calendar
            onChange={(date) => handleDateChange(date, true)}
            value={startDate}
            className="calendar"
            tileContent={({ date }) => {
              const dateString = moment(date).format('YYYY-MM-DD');
              return publicHolidays[dateString] ? <p className="holiday">{publicHolidays[dateString]}</p> : null;
            }}
            tileClassName={({ date }) => {
              const dateString = moment(date).format('YYYY-MM-DD');
              return publicHolidays[dateString] ? 'holiday-tile' : null;
            }}
          />
          <Calendar
            onChange={(date) => handleDateChange(date, false)}
            value={endDate}
            className="calendar"
            tileContent={({ date }) => {
              const dateString = moment(date).format('YYYY-MM-DD');
              return publicHolidays[dateString] ? <p className="holiday">{publicHolidays[dateString]}</p> : null;
            }}
            tileClassName={({ date }) => {
              const dateString = moment(date).format('YYYY-MM-DD');
              return publicHolidays[dateString] ? 'holiday-tile' : null;
            }}
          />
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Start Date:</label>
          <input type="text" value={formatDate(startDate)} readOnly placeholder="dd/mm/yyyy" />
        </div>
        <div>
          <label>End Date:</label>
          <input type="text" value={formatDate(endDate)} readOnly placeholder="dd/mm/yyyy" />
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
        <h3>Your Request History</h3>
        <ul>
          {requests.length > 0 ? (
            requests.map((request) => (
              <li key={request.request_id}>
                From: {formatDate(request.start_date)} - To: {formatDate(request.end_date)} -
                Reason: {request.reason} - Status: {request.status}
                <button onClick={() => handleDelete(request.request_id)} className="delete-button">
                  Delete
                </button>
              </li>
            ))
          ) : (
            <p>No requests found.</p>
          )}
        </ul>
      </div>
    </div>
  );
}

export default TimeOffRequest;
