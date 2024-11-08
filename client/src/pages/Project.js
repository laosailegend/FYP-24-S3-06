import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style.css';

const Project = () => {
  // Parse token from localStorage and retrieve userId
  const tokenObj = localStorage.getItem("token") ? JSON.parse(atob(localStorage.getItem("token").split('.')[1])) : null;
  const userId = tokenObj ? tokenObj.id : null;
  
  const navigate = useNavigate();
  const server = process.env.REACT_APP_SERVER; // Retrieve server URL from environment variables

  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);

  // Fetch tasks from backend on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`${server}tasks`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }

        const data = await response.json();
        setTasks(data.tasks);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks');
      }
    };

    fetchTasks();
  }, [server]);

  // Redirect if userId is not available
  useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  return (
    <div>
      <h1>Project Tasks</h1>
      {error && <p className="error">{error}</p>}
      <ul>
        {tasks.map(task => (
          <li key={task.taskid}>
            <h2>{task.taskname}</h2>
            <p>{task.description}</p>
            <p>Manpower Required: {task.manpower_required}</p>
            <p>Task Date: {task.task_date}</p>
            <p>Start Time: {task.start_time}</p>
            <p>End Time: {task.end_time}</p>
            {/* Add additional task details as needed */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Project;
