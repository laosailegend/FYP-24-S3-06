import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import '../style.css';
import axios from 'axios';

function Tasks() {
  const [date, setDate] = useState(new Date());
  const [taskDetails, setTaskDetails] = useState({
    taskname: '',
    description: '',
    manpower_required: '',
  });
  const [tasks, setTasks] = useState([]); // State to store tasks

  // Fetch tasks when the component mounts
  useEffect(() => {
    fetchTasks();
  }, []);

  // Log the tasks state to check for updates
  useEffect(() => {
    console.log('Tasks state updated:', tasks);
  }, [tasks]);

  // Function to fetch tasks from the API
  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:8800/tasks');
      console.log('Fetched tasks:', response.data); // Log response data
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Function to handle calendar date change
  const onChange = (date) => {
    setDate(date);
  };

  // Function to handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskDetails({ ...taskDetails, [name]: value });
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formattedDate = moment(date).format('YYYY-MM-DD');
    const newTask = { 
      taskname: taskDetails.taskname, 
      description: taskDetails.description, 
      manpower_required: taskDetails.manpower_required, 
      timeslot: formattedDate,
    };

    try {
      const response = await axios.post('http://localhost:8800/createTask', newTask);
      if (response.status === 201) {
        alert('Task added successfully');
        setTaskDetails({ taskname: '', description: '', manpower_required: '' }); // Clear form fields
        fetchTasks(); // Refresh the task list
      } else {
        alert('Failed to add task');
        console.error("Response Status:", response.status);
      }
    } catch (error) {
      console.error('Error adding task:', error.response ? error.response.data : error.message);
      alert('Error adding task');
    }
  };

  // Function to handle task deletion
  const deleteTask = async (id) => {
    try {
      await axios.delete(`http://localhost:8800/task/${id}`);
      fetchTasks(); // Re-fetch the updated list of tasks
    } catch (error) {
      console.error("Error deleting task:", error);
      alert('Error deleting task');
    }
  };

  return (
    <div className="tasks-container">
      <h2>Add Task</h2>
      <Calendar onChange={onChange} value={date} />
      <form onSubmit={handleSubmit}>
        <div>
          <label>Task Name:</label>
          <input
            type="text"
            name="taskname"
            value={taskDetails.taskname}
            onChange={handleInputChange}
            placeholder="Enter task name"
            required
          />
        </div>
        <div>
          <label>Description:</label>
          <input
            type="text"
            name="description"
            value={taskDetails.description}
            onChange={handleInputChange}
            placeholder="Enter description"
            required
          />
        </div>
        <div>
          <label>Manpower Required:</label>
          <input
            type="number"
            name="manpower_required"
            value={taskDetails.manpower_required}
            onChange={handleInputChange}
            placeholder="Enter manpower required"
            required
          />
        </div>
        <button type="submit">Add Task</button>
      </form>
      <div className="tasks-list">
        <h3>Tasks</h3>
        <ul>
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <li key={task.taskid}>
                <strong>Job Scope:</strong> {task.taskname || 'No Name'} <br />
                <strong>Description:</strong> {task.description || 'No Description'} <br />
                <strong>Manpower Required:</strong> {task.manpower_required || 'No Manpower Info'}
                <button onClick={() => deleteTask(task.taskid)}>Delete</button>
              </li>
            ))
          ) : (
            <p>No tasks available.</p>
          )}
        </ul>
      </div>
    </div>
  );
}

export default Tasks;
