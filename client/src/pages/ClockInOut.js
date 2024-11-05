import React, { useState, useEffect } from 'react';
import '../style.css';

function ClockInOut() {
  const tokenObj = localStorage.getItem("token") ? JSON.parse(atob(localStorage.getItem("token").split('.')[1])) : null;
  const userId = tokenObj ? tokenObj.id : null;
  const [assignmentData, setAssignmentData] = useState([]);
  const [clockInTimes, setClockInTimes] = useState({});
  const [clockOutTimes, setClockOutTimes] = useState({});
  const server = process.env.REACT_APP_SERVER;

  useEffect(() => {
    const fetchAssignmentData = () => {
      fetch(`${server}assignments/${userId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log('Fetched assignment data:', data);
          setAssignmentData(data.assignments);
          fetchClockTimes(data.assignments);
        })
        .catch((error) => {
          console.error('Error fetching assignment data:', error);
        });
    };

    if (userId) {
      fetchAssignmentData();
    }
  }, [userId]);

  const fetchClockTimes = (assignments) => {
    assignments.forEach(assignment => {
      fetch(`${server}clock-times/${userId}/${assignment.assignment_id}`)
        .then(response => response.json())
        .then(data => {
          if (data) {
            if (data.clock_in_time) {
              setClockInTimes(prev => ({
                ...prev,
                [assignment.assignment_id]: data.clock_in_time
              }));
            }
            if (data.clock_out_time) {
              setClockOutTimes(prev => ({
                ...prev,
                [assignment.assignment_id]: data.clock_out_time
              }));
            }
          }
        })
        .catch(error => console.error('Error fetching clock times:', error));
    });
  };

  const handleClockIn = async (assignmentId) => {
    try {
      const response = await fetch(`${server}clock-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          assignment_id: assignmentId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error clocking in: ${response.status}`);
      }

      const currentTime = new Date().toLocaleTimeString();
      setClockInTimes(prev => ({
        ...prev,
        [assignmentId]: currentTime
      }));
    } catch (error) {
      console.error('Error clocking in:', error);
    }
  };

  const handleClockOut = async (assignmentId) => {
    try {
      const response = await fetch(`${server}clock-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          assignment_id: assignmentId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error clocking out: ${response.status}`);
      }

      const currentTime = new Date().toLocaleTimeString();
      setClockOutTimes(prev => ({
        ...prev,
        [assignmentId]: currentTime
      }));

      // Reset clock-in time upon clocking out
      setClockInTimes(prev => ({
        ...prev,
        [assignmentId]: null
      }));

      // Optionally refresh clock times for the assignment
      fetchClockTimes(assignmentData);
    } catch (error) {
      console.error('Error clocking out:', error);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      const response = await fetch(`${server}update-clock-time`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          assignment_id: assignmentId,
          status: 'done'
        }),
      });

      if (!response.ok) {
        throw new Error(`Error updating status: ${response.status}`);
      }

      // Update local state to remove the assignment immediately from the UI
      setAssignmentData(prevAssignments => 
        prevAssignments.filter(assignment => assignment.assignment_id !== assignmentId) // Filter out the deleted assignment
      );
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  return (
    <div className="clock-in-out-container">
      <h2>Clock In/Clock Out</h2>

      {assignmentData.length > 0 ? (
        <div>
          <h3>Your Assignments:</h3>
          {assignmentData.map((assignment) => (
            assignment.status !== 'done' && ( // Only display active assignments
              <div key={assignment.assignment_id} className="assignment-item">
                <button
                  onClick={() => handleDeleteAssignment(assignment.assignment_id)}
                  className="delete-button"
                >
                  X
                </button>
                <p><strong>Assigned Date:</strong> {new Date(assignment.assigned_date).toLocaleDateString()}</p>
                <p><strong>Start Time:</strong> {assignment.start_time}</p>
                <p><strong>End Time:</strong> {assignment.end_time}</p>
                <p><strong>Task Name:</strong> {assignment.taskname}</p>

                {clockInTimes[assignment.assignment_id] ? (
                  <div>
                    <p>You clocked in at: {clockInTimes[assignment.assignment_id]}</p>
                    {clockOutTimes[assignment.assignment_id] ? (
                      <p>You clocked out at: {clockOutTimes[assignment.assignment_id]}</p>
                    ) : (
                      <button onClick={() => handleClockOut(assignment.assignment_id)} className="clock-out-button">Clock Out</button>
                    )}
                  </div>
                ) : (
                  <button onClick={() => handleClockIn(assignment.assignment_id)} className="clock-in-button">Clock In</button>
                )}
              </div>
            )
          ))}
        </div>
      ) : (
        <p>No assignments found.</p>
      )}
    </div>
  );
}

export default ClockInOut;
