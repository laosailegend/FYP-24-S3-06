import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import '../style.css';
import axios from 'axios';

export const tasks = []; // Ensure tasks is a named export

function Tasks() {
  const [date, setDate] = useState(new Date());
  const [taskDetails, setTaskDetails] = useState({
    taskname: '',
    description: '',
    manpower_required: '',
  });

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

    console.log("Submitting task:", newTask);
    
    try {
      const response = await axios.post('http://localhost:8800/createTask', newTask);
      if (response.status === 201) {
        alert('Task added successfully');
        setTaskDetails({ taskname: '', description: '', manpower_required: '' });
      } else {
        alert('Failed to add task');
        console.error("Response Status:", response.status);
      }
    } catch (error) {
      console.error('Error adding task:', error.response ? error.response.data : error.message);
      alert('Error adding task');
    }
  };

  return (
    <div className="tasks-container">
      <h2>Add Task</h2>
      <Calendar onChange={onChange} value={date} />
      <form onSubmit={handleSubmit}>
        <div>
          <label>Task Name:</label> {/* Updated to match backend */}
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
    </div>
  );
}

export default Tasks;
