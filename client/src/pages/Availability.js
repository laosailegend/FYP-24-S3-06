import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import '../style.css';

function Availability() {
  const [date, setDate] = useState(new Date());
  const [availability, setAvailability] = useState('Available');
  const [availabilityList, setAvailabilityList] = useState([]);
  const [tasks, setTasks] = useState([]); // State to store tasks

  useEffect(() => {
    // Fetch availability data
    fetch('http://localhost:8800/availability')  // Update to include correct port
      .then((res) => res.json())
      .then((data) => setAvailabilityList(data));

    // Fetch tasks data
    fetch('http://localhost:8800/tasks')  // Update to include correct port
      .then((res) => res.json())
      .then((data) => {
        console.log('Fetched tasks:', data);
        setTasks(data);
      })
      .catch((err) => {
        console.error('Error fetching tasks:', err);
      });
}, []);

  const onChange = (date) => {
    setDate(date);
  };

  const handleInputChange = (e) => {
    setAvailability(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedDate = moment(date).format('YYYY-MM-DD');

    fetch('/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date: formattedDate, availability }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert('Availability updated successfully');
        setAvailabilityList([...availabilityList, { date: formattedDate, availability }]);
      })
      .catch((err) => {
        console.error('Error:', err);
        alert('Failed to update availability');
      });
  };

  // Convert date to dd/mm/yyyy format for display
  const formatDate = (date) => moment(date).format('DD/MM/YYYY');

  // Filter tasks for the selected date
    const getTasksForDate = (date) => {
    const filteredTasks = tasks.filter((task) => moment(task.timeslot).isSame(date, 'day'));
    console.log('Tasks for selected date:', filteredTasks); // <-- Add this line
    return filteredTasks;
  };

  return (
    <div className="availability-container">
      <h2>Set Your Availability</h2>
      <Calendar onChange={onChange} value={date} />

      <div className="availability-details">
        <h3>Availability for {formatDate(date)}</h3>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Availability:</label>
            <select
              name="availability"
              value={availability}
              onChange={handleInputChange}
              required
            >
              <option value="Available">Available</option>
              <option value="Not Available">Not Available</option>
            </select>
          </div>
          <button type="submit">Submit Availability</button>
        </form>

        <div className="availability-list">
          <h3>Your Availability History</h3>
          <ul>
            {availabilityList.map((item, index) => (
              <li key={index}>
                Date: {moment(item.date).format('DD/MM/YYYY')} - Status: {item.availability}
              </li>
            ))}
          </ul>
        </div>

        <div className="tasks-list">
          <h3>Tasks for {formatDate(date)}</h3>
          <ul>
            {getTasksForDate(date).map((task, index) => (
              <li key={index}>
                <strong>Job Scope:</strong> {task.taskname} <br />
                <strong>Description:</strong> {task.description} <br />
                <strong>Manpower Required:</strong> {task.manpower_required}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Availability;
