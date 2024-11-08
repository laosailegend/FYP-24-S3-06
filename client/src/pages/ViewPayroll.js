import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style.css';

const ViewPayroll = () => {
  // Parse token from localStorage to get the userId
  const tokenObj = localStorage.getItem("token") ? JSON.parse(atob(localStorage.getItem("token").split('.')[1])) : null;
  const userId = tokenObj ? tokenObj.id : null;
  
  const navigate = useNavigate();
  const server = process.env.REACT_APP_SERVER;

  const [payrolls, setPayrolls] = useState([]);
  const [error, setError] = useState(null);
  const [queries, setQueries] = useState([]);
  const [queryDescription, setQueryDescription] = useState('');
  const [queryError, setQueryError] = useState(null);
  const [querySuccess, setQuerySuccess] = useState(null);

  // Fetch payroll data on component mount
  useEffect(() => {
    const fetchPayrolls = async () => {
      try {
        const response = await fetch(`${server}payrolls/user/${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch payroll data');
        }

        const data = await response.json();
        setPayrolls(data.payrolls);
      } catch (err) {
        console.error('Error fetching payroll data:', err);
        setError('Failed to load payroll data');
      }
    };

    const fetchQueries = async () => {
      try {
        const response = await fetch(`${server}payrollQueries/user/${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch payroll queries');
        }

        const data = await response.json();
        setQueries(data.payrollQueries);
      } catch (err) {
        console.error('Error fetching payroll queries:', err);
        setQueryError('Failed to load payroll queries');
      }
    };

    if (userId) {
      fetchPayrolls();
      fetchQueries();
    } else {
      navigate('/login');
    }
  }, [userId, server, navigate]);

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    setQueryError(null);
    setQuerySuccess(null);
  
    try {
      const response = await fetch(`${server}payrollQueries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId, description: queryDescription })
      });
  
      if (!response.ok) {
        throw new Error('Failed to submit query');
      }
  
      const data = await response.json();
      setQuerySuccess(data.message); // Show the success message
      setQueryDescription('');
    } catch (err) {
      console.error('Error submitting query:', err);
      setQueryError('Failed to submit query');
    }
  };
  

  return (
    <div>
      <h1>Your Payroll History</h1>
      {error && <p className="error">{error}</p>}
      {payrolls.length === 0 ? (
        <p>No payroll records found</p>
      ) : (
        <ul>
          {payrolls.map(payroll => (
            <li key={payroll.payroll_id}>
              <h2>Payroll ID: {payroll.payroll_id}</h2>
              <p>Pay Period Start: {new Date(payroll.pay_period_start).toLocaleDateString('en-US')}</p>
              <p>Pay Period End: {new Date(payroll.pay_period_end).toLocaleDateString('en-US')}</p>
              <p>Total Hours Worked: {payroll.total_hours_worked}</p>
              <p>Regular Hours: {payroll.regular_hours}</p>
              <p>Weekend Hours: {payroll.weekend_hours}</p>
              <p>Public Holiday Hours: {payroll.public_holiday_hours}</p>
              <p>Overtime Hours: {payroll.overtime_hours}</p>
              <p>Base Pay: ${payroll.base_pay}</p>
              <p>Overtime Pay: ${payroll.overtime_pay}</p>
              <p>Total Pay: ${payroll.total_pay}</p>
            </li>
          ))}
        </ul>
      )}

      <h2>Submit a Payroll Query</h2>
      {queryError && <p className="error">{queryError}</p>}
      {querySuccess && <p className="success">{querySuccess}</p>}
      <form onSubmit={handleQuerySubmit}>
        <textarea
          value={queryDescription}
          onChange={(e) => setQueryDescription(e.target.value)}
          placeholder="Describe your issue or question"
          required
        />
        <button type="submit">Submit Query</button>
      </form>

      <h2>Your Payroll Queries</h2>
      {queries.length === 0 ? (
  <p>No payroll queries found</p>
) : (
  <ul>
    {queries.map(query => (
        // Only render the query if status is not 'Resolved'
        <li key={query.query_id}>
          <p><strong>Date:</strong> {new Date(query.query_date).toLocaleDateString('en-US')}</p>
          <p><strong>Description:</strong> {query.description}</p>
          <p><strong>Status:</strong> {query.status}</p>
          {query.response && <p><strong>Response:</strong> {query.response}</p>}
        </li>
    ))}
  </ul>
)}

    </div>
  );
};

export default ViewPayroll;
