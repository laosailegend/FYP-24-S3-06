import React, { useState, useEffect } from 'react';
import '../style.css';

function ClockInOut() {
  const tokenObj = localStorage.getItem("token") ? JSON.parse(atob(localStorage.getItem("token").split('.')[1])) : null; // Get the user's ID from the AuthContext
  const userId = tokenObj ? tokenObj.id : null; // Use the logged-in user's ID
  const [scheduleData, setScheduleData] = useState([]);
  const [clockInTimes, setClockInTimes] = useState({}); // Track clock in times for each schedule
  const [clockOutTimes, setClockOutTimes] = useState({}); // Track clock out times for each schedule
  const server=process.env.REACT_APP_SERVER;

  // Fetch schedule data for the logged-in user
  useEffect(() => {
    const fetchScheduleData = () => {
      fetch(`${server}schedules/${userId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log('Fetched schedule data:', data); // Debugging: log the fetched data
          setScheduleData(data.schedules); // Update this line to extract the schedules array
          // Fetch clock-in/out times after fetching schedules
          fetchClockTimes(data.schedules);
        })
        .catch((error) => {
          console.error('Error fetching schedule data:', error);
        });
    };

    if (userId) { // Ensure userId is available before fetching
      fetchScheduleData();
    }
  }, [userId]);

  const fetchClockTimes = (schedules) => {
    schedules.forEach(schedule => {
      fetch(`${server}clock-times/${userId}/${schedule.schedule_id}`)
        .then(response => response.json())
        .then(data => {
          if (data) {
            // Assuming data returns { clock_in_time: ..., clock_out_time: ... }
            if (data.clock_in_time) {
              setClockInTimes(prev => ({
                ...prev,
                [schedule.schedule_id]: new Date(data.clock_in_time).toLocaleTimeString()
              }));
            }
            if (data.clock_out_time) {
              setClockOutTimes(prev => ({
                ...prev,
                [schedule.schedule_id]: new Date(data.clock_out_time).toLocaleTimeString()
              }));
            }
          }
        })
        .catch(error => console.error('Error fetching clock times:', error));
    });
  };

  const handleClockIn = async (scheduleId) => {
    try {
      const response = await fetch(`${server}clock-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId, // logged-in user's ID
          schedule_id: scheduleId, // ID of the schedule being clocked in
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error clocking in: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(data); // Log the response for debugging
      
      const currentTime = new Date().toLocaleTimeString();
      setClockInTimes(prev => ({
        ...prev,
        [scheduleId]: currentTime // Record the clock in time for the specific schedule ID
      }));
    } catch (error) {
      console.error('Error clocking in:', error);
    }
  };

  const handleClockOut = async (scheduleId) => {
    try {
      const response = await fetch(`${server}clock-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId, // logged-in user's ID
          schedule_id: scheduleId, // ID of the schedule being clocked out
        }),
      });

      if (!response.ok) {
        throw new Error(`Error clocking out: ${response.status}`);
      }

      const data = await response.json();
      console.log(data); // Log the response for debugging
      
      const currentTime = new Date().toLocaleTimeString();
      setClockOutTimes(prev => ({
        ...prev,
        [scheduleId]: currentTime // Store the clock out time
      }));

      // Optionally reset the clock in time or handle it as per your requirements
      setClockInTimes(prev => ({
        ...prev,
        [scheduleId]: null // Reset the clock in time for this schedule if needed
      }));
      // Fetch the updated clock times after clocking out
    fetchClockTimes(scheduleData);
    } catch (error) {
      console.error('Error clocking out:', error);
    }
  };

  return (
    <div className="clock-in-out-container">
      <h2>Clock In/Clock Out</h2>

      {scheduleData.length > 0 ? (
        <div>
          <h3>Your Schedule:</h3>
          {scheduleData.map((schedule) => (
            <div key={schedule.schedule_id} className="schedule-item">
              <p><strong>Shift Date:</strong> {new Date(schedule.shift_date).toLocaleDateString()}</p>
              <p><strong>Start Time:</strong> {schedule.start_time}</p>
              <p><strong>End Time:</strong> {schedule.end_time}</p>
              <p><strong>Salary:</strong> ${schedule.salary}</p>

              {/* Change button based on clocked in/out status */}
              {clockInTimes[schedule.schedule_id] ? (
                <div>
                  <p>You clocked in at: {clockInTimes[schedule.schedule_id]}</p>
                  {clockOutTimes[schedule.schedule_id] ? ( // Check if the user has clocked out
                    <p>You clocked out at: {clockOutTimes[schedule.schedule_id]}</p> // Display clock-out time
                  ) : (
                    <button onClick={() => handleClockOut(schedule.schedule_id)} className="clock-out-button">Clock Out</button>
                  )}
                </div>
              ) : (
                <button onClick={() => handleClockIn(schedule.schedule_id)} className="clock-in-button">Clock In</button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No scheduled shifts found.</p>
      )}
    </div>
  );
}

export default ClockInOut;
