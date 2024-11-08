import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style.css';

const Leave = () => {
  // Parse token from localStorage and retrieve userId
  const [tokenObj, setTokenObj] = useState(() => {
    const token = localStorage.getItem("token");
    return token ? JSON.parse(atob(token.split('.')[1])) : null;
  });;
  const userId = tokenObj ? tokenObj.id : null;

  const navigate = useNavigate();
  const server = process.env.REACT_APP_SERVER;

  const [leaveBalance, setLeaveBalance] = useState(null);
  const [error, setError] = useState(null);

  // Fetch user's leave balance on component mount
  useEffect(() => {
    const fetchLeaveBalance = async () => {
      try {
        const response = await fetch(`${server}users/${userId}/leave_balance`);

        if (!response.ok) {
          throw new Error('Failed to fetch leave balance');
        }

        const data = await response.json();
        setLeaveBalance(data.leave_balance);
      } catch (err) {
        console.error('Error fetching leave balance:', err);
        setError('Failed to load leave balance');
      }
    };

    if (userId) {
      fetchLeaveBalance();
    } else {
      navigate('/login');
    }
  }, [userId, server, navigate]);

  return (
    <div>
      <h1>Your Leave Balance</h1>
      {error && <p className="error">{error}</p>}
      {leaveBalance !== null ? (
        <p>Your current leave balance: {leaveBalance} days</p>
      ) : (
        <p>Loading your leave balance...</p>
      )}
    </div>
  );
};

export default Leave;
