import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import '../style.css';

function Schedule() {
  const [date, setDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [shiftDetails, setShiftDetails] = useState({
    shift_date: '',
    start_time: '',
    end_time: '',
  });

  useEffect(() => {
    fetchSchedulesByDate(date);
  }, [date]);

  const onChange = (date) => {
    setDate(date);
  };

  const fetchSchedulesByDate = (selectedDate) => {
    const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
    fetch(`http://localhost:8800/schedules?shift_date=${formattedDate}`)
      .then((res) => res.json())
      .then((data) => setSchedules(data))
      .catch((err) => console.error('Error fetching schedules:', err));
  };

  const renderSchedules = () => {
    return schedules.length > 0 ? (
      <ul>
        {schedules.map((schedule) => (
          <li key={schedule.schedule_id}>
            {schedule.fname === 'NULL' ? 'NULL' : `${schedule.fname} ${schedule.lname}`} - 
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
    setShiftDetails({ ...shiftDetails, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { shift_date, start_time, end_time } = shiftDetails;

    fetch('/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ shift_date, start_time, end_time }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert('Shift added successfully');
        setSchedules([...schedules, { schedule_id: data.id, shift_date, start_time, end_time }]);
      })
      .catch((err) => {
        console.error('Error:', err);
        alert('Failed to add shift');
      });
  };

  // Convert date to dd/mm/yyyy format for display
  const formatDate = (date) => moment(date).format('DD/MM/YYYY');

  // Ensure input value is in yyyy-mm-dd format
  const formatInputDate = (date) => moment(date).format('YYYY-MM-DD');

  return (
    <div className="schedule-container">
      <h2>Employee Schedule</h2>
      <Calendar onChange={onChange} value={date} />
      <div className="schedule-details">
        <h3>Schedules for {formatDate(date)}</h3>
        {renderSchedules()}
      </div>

      <div className="add-shift-form">
        <h3>Add a Shift</h3>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Shift Date:</label>
            <input
              type="date"
              name="shift_date"
              value={formatInputDate(shiftDetails.shift_date)}
              onChange={handleInputChange}
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
          <button type="submit">Add Shift</button>
        </form>
      </div>
    </div>
  );
}

export default Schedule;
