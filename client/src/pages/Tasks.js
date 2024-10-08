import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import '../style.css';
import axios from 'axios';

function Tasks() {
  const tokenObj = localStorage.getItem("token") ? JSON.parse(atob(localStorage.getItem("token").split('.')[1])) : null;
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date());
  const [taskDetails, setTaskDetails] = useState({
    taskname: '',
    description: '',
    manpower_required: '',
  });
  const [tasks, setTasks] = useState([]);
  const [editTaskId, setEditTaskId] = useState(null); // State to track which task is being edited

  useEffect(() => {
    // prevents non-admin users from viewing the page
    if (!tokenObj || (tokenObj.role !== 1 && tokenObj.role !== 2)) {
      window.alert("You are not authorized to view this page");
      navigate("/", { replace: true });
      return () => { };
    }

    // If tokenObj is still null, don't render the content yet
    if (tokenObj === null) {
      return null;  // You can replace this with a loading indicator if you prefer
    }
    fetchTasks();
  }, []);

  useEffect(() => {
    console.log('Tasks state updated:', tasks);
  }, [tasks]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:8800/tasks');
      console.log('Fetched tasks:', response.data);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const onChange = (date) => {
    setDate(date);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskDetails({ ...taskDetails, [name]: value });
  };

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
        setTaskDetails({ taskname: '', description: '', manpower_required: '' });
        fetchTasks();
      } else {
        alert('Failed to add task');
        console.error("Response Status:", response.status);
      }
    } catch (error) {
      console.error('Error adding task:', error.response ? error.response.data : error.message);
      alert('Error adding task');
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`http://localhost:8800/task/${id}`);
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      alert('Error deleting task');
    }
  };

  const startEditTask = (task) => {
    setTaskDetails({
      taskname: task.taskname,
      description: task.description,
      manpower_required: task.manpower_required,
    });
    setEditTaskId(task.taskid);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const formattedDate = moment(date).format('YYYY-MM-DD');
    const updatedTask = {
      taskname: taskDetails.taskname,
      description: taskDetails.description,
      manpower_required: taskDetails.manpower_required,
      timeslot: formattedDate,
    };

    try {
      const response = await axios.put(`http://localhost:8800/task/${editTaskId}`, updatedTask);
      if (response.status === 200) {
        alert('Task updated successfully');
        setTaskDetails({ taskname: '', description: '', manpower_required: '' });
        setEditTaskId(null); // Reset edit state
        fetchTasks();
      } else {
        alert('Failed to update task');
        console.error("Response Status:", response.status);
      }
    } catch (error) {
      console.error('Error updating task:', error.response ? error.response.data : error.message);
      alert('Error updating task');
    }
  };

  return (
    <div className="tasks-container">
      <h2>{editTaskId ? 'Update Task' : 'Add Task'}</h2>
      <Calendar onChange={onChange} value={date} />
      <form onSubmit={editTaskId ? handleUpdate : handleSubmit}>
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
        <button type="submit">{editTaskId ? 'Update Task' : 'Add Task'}</button>
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
                <button onClick={() => startEditTask(task)}>Edit</button>
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
