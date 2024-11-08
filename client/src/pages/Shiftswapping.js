import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style.css';

const Shiftswapping = () => {
  const tokenObj = localStorage.getItem("token") ? JSON.parse(atob(localStorage.getItem("token").split('.')[1])) : null;
  const userId = tokenObj ? tokenObj.id : null;
  
  const navigate = useNavigate();
  const server = process.env.REACT_APP_SERVER;

  const [assignments, setAssignments] = useState([]);
  const [otherAssignments, setOtherAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [error, setError] = useState(null);
  const [swapError, setSwapError] = useState(null);

  useEffect(() => {
    const fetchUserAssignments = async () => {
      try {
        const response = await fetch(`${server}assignments/user/${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch your assignments');
        }

        const data = await response.json();
        setAssignments(data.assignments);
      } catch (err) {
        console.error('Error fetching assignments:', err);
        setError('Failed to load your assignments');
      }
    };

    if (userId) {
      fetchUserAssignments();
    } else {
      navigate('/login');
    }
  }, [userId, server, navigate]);

  const fetchOtherAssignments = async (assignmentId) => {
    try {
      const response = await fetch(`${server}assignments/other/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch other assignments');
      }

      const data = await response.json();
      setOtherAssignments(data.assignments);
    } catch (err) {
      console.error('Error fetching other assignments:', err);
      setError('Failed to load other assignments');
    }
  };

  const handleAssignmentSelect = (assignmentId) => {
    setSelectedAssignment(assignmentId);
    fetchOtherAssignments(assignmentId);
  };

  const submitSwapRequest = async (targetAssignmentId) => {
    try {
      const response = await fetch(`${server}shiftSwapRequests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userid: userId,
          requestor_assignment_id: selectedAssignment,
          target_assignment_id: targetAssignmentId,
          status: 'pending'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit swap request');
      }

      alert('Swap request submitted successfully');
      setSelectedAssignment(null);
      setOtherAssignments([]);
    } catch (err) {
      console.error('Error submitting swap request:', err);
      setSwapError('Failed to submit swap request');
    }
  };

  return (
    <div>
      <h1>Your Assignments</h1>
      {error && <p className="error">{error}</p>}
      <ul>
        {assignments.map(assignment => (
          <li key={assignment.assignment_id}>
            <h2>Assignment ID: {assignment.assignment_id}</h2>
            <p>Task Name: {assignment.taskname}</p>
            <p>Assigned Date: {new Date(assignment.assigned_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p>Start Time: {assignment.start_time}</p>
            <p>End Time: {assignment.end_time}</p>
            <button onClick={() => handleAssignmentSelect(assignment.assignment_id)}>
              Select for Swap
            </button>
          </li>
        ))}
      </ul>

      {selectedAssignment && (
        <div className="swap-window">
          <h2>Available Assignments to Swap With</h2>
          {swapError && <p className="error">{swapError}</p>}
          <ul>
            {otherAssignments.map(assignment => (
              <li key={assignment.assignment_id}>
                <h3>Assignment ID: {assignment.assignment_id}</h3>
                <p>Task Name: {assignment.taskname}</p>
                <p>Assigned Date: {new Date(assignment.assigned_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p>Start Time: {assignment.start_time}</p>
                <p>End Time: {assignment.end_time}</p>
                <button onClick={() => submitSwapRequest(assignment.assignment_id)}>
                  Request Swap
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => setSelectedAssignment(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default Shiftswapping;
