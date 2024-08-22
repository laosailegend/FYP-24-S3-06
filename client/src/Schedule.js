import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import './style.css';

function Schedule() {
  const [date, setDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [shiftDetails, setShiftDetails] = useState({
    shift_date: '',
    start_time: '',
    end_time: '',
    salary_per_hour: '', // New state for salary
  });

  useEffect(() => {
    fetch('/schedules')
      .then((res) => res.json())
      .then((data) => setSchedules(data));
  }, []);

  const onChange = (date) => {
    setDate(date);
    // Update the shift date to the selected date
    setShiftDetails({
      ...shiftDetails,
      shift_date: moment(date).format('DD/MM/YYYY'),
    });
  };

  const renderSchedules = (date) => {
    const daySchedules = schedules.filter(
      (schedule) => moment(schedule.shift_date).isSame(date, 'day')
    );

    return daySchedules.length > 0 ? (
      <ul>
        {daySchedules.map((schedule) => (
          <li key={schedule.schedule_id}>
            Shift: {schedule.start_time} - {schedule.end_time}
          </li>
        ))}
      </ul>
    ) : (
      <p>No schedules for this day.</p>
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'shift_date') {
      // Convert date from dd/mm/yyyy to yyyy-mm-dd for backend
      const formattedDate = moment(value, 'DD/MM/YYYY').isValid()
        ? value
        : moment(value, 'YYYY-MM-DD').format('DD/MM/YYYY');
      setShiftDetails({ ...shiftDetails, [name]: formattedDate });
    } else {
      setShiftDetails({ ...shiftDetails, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { shift_date, start_time, end_time, salary_per_hour } = shiftDetails;

    // Convert shift_date from dd/mm/yyyy to yyyy-mm-dd for backend
    const formattedShiftDate = moment(shift_date, 'DD/MM/YYYY').format('YYYY-MM-DD');

    fetch('/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ shift_date: formattedShiftDate, start_time, end_time, salary_per_hour }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert('Shift added successfully');
        setSchedules([...schedules, { schedule_id: data.id, shift_date: formattedShiftDate, start_time, end_time, salary_per_hour }]);
      })
      .catch((err) => {
        console.error('Error:', err);
        alert('Failed to add shift');
      });
  };

  // Convert date to dd/mm/yyyy format for display
  const formatDate = (date) => moment(date).format('DD/MM/YYYY');

  // Ensure input value is in yyyy-mm-dd format
  const formatInputDate = (date) => moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD');

  return (
    <div className="schedule-container">
      <h2>Employee Schedule</h2>
      <Calendar onChange={onChange} value={date} />
      <div className="schedule-details">
        <h3>Schedules for {formatDate(date)}</h3>
        {renderSchedules(date)}
      </div>

      <div className="add-shift-form">
        <h3>Add a Shift</h3>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Shift Date:</label>
            <input
              type="text" // Changed from date to text to handle custom format
              name="shift_date"
              value={shiftDetails.shift_date}
              onChange={handleInputChange}
              placeholder="dd/mm/yyyy"
              required
            />
          </div>
          <div>
            <label>Start Time:</label>
            <input
              type="time"
              name="start_time"
              value={shiftDetails.start_time}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label>End Time:</label>
            <input
              type="time"
              name="end_time"
              value={shiftDetails.end_time}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label>Salary per Hour:</label>
            <input
              type="number"
              name="salary_per_hour"
              value={shiftDetails.salary_per_hour}
              onChange={handleInputChange}
              placeholder="Enter salary"
              required
            />
          </div>
          <button type="submit">Add Shift</button>
        </form>
      </div>
    </div>
  );
}

export default Schedule;
