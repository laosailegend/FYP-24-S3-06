import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Availability() {
  const [selectedDays, setSelectedDays] = useState([]);
  const [availabilityHistory, setAvailabilityHistory] = useState([]);
  const server = process.env.REACT_APP_SERVER;

  const userId = JSON.parse(atob(localStorage.getItem("token").split('.')[1])).id;

  // Options for days of the week
  const daysOfWeek = [
    { label: 'Monday', value: 'M' },
    { label: 'Tuesday', value: 'Tu' },
    { label: 'Wednesday', value: 'W' },
    { label: 'Thursday', value: 'Th' },
    { label: 'Friday', value: 'F' },
    { label: 'Saturday', value: 'Sa' },
    { label: 'Sunday', value: 'Su' },
  ];

  const handleDaySelect = (day) => {
    setSelectedDays((prevSelected) =>
      prevSelected.includes(day)
        ? prevSelected.filter((d) => d !== day) // Deselect if already selected
        : [...prevSelected, day] // Add if not already selected
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${server}submitAvailability`, {
        userid: userId,
        availability: selectedDays.join(','), // Join selected days as a comma-separated string
      });
      alert('Availability submitted successfully');
      fetchAvailability(); // Refresh availability history after submitting
      setSelectedDays([]);
    } catch (error) {
      console.error('Error submitting availability:', error);
      alert('Failed to submit availability');
    }
  };

  const fetchAvailability = async () => {
    try {
      const res = await axios.get(`${server}getAvailability/${userId}`);
      setAvailabilityHistory(res.data.availability || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  return (
    <div className="availability-container">
      <h2>Select Your Availability</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Select Days:</label>
          <div className="days-of-week">
            {daysOfWeek.map((day) => (
              <label key={day.value}>
                <input
                  type="checkbox"
                  value={day.value}
                  checked={selectedDays.includes(day.value)}
                  onChange={() => handleDaySelect(day.value)}
                />
                {day.label}
              </label>
            ))}
          </div>
        </div>
        <button type="submit">Submit Availability</button>
      </form>

      <h3>Your Availability History</h3>
      <ul>
        {availabilityHistory.length > 0 ? (
          availabilityHistory.map((entry, index) => (
            <li key={index}>Availability: {entry}</li>
          ))
        ) : (
          <p>No availability history found.</p>
        )}
      </ul>
    </div>
  );
}

export default Availability;
