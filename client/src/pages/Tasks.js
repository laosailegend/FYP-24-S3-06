import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import '../style.css';

export const tasks = []; // Ensure tasks is a named export

function Tasks() {
  const [date, setDate] = useState(new Date());
  const [taskDetails, setTaskDetails] = useState({
    job_scope: '',
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedDate = moment(date).format('YYYY-MM-DD');
    const newTask = { task_date: formattedDate, ...taskDetails };

    tasks.push(newTask); // Update the global tasks array
    localStorage.setItem('tasks', JSON.stringify(tasks)); // Ensure to sync with local storage

    setTaskDetails({ job_scope: '', description: '', manpower_required: '' });
    alert('Task added successfully');
  };

  return (
    <div className="tasks-container">
      <h2>Add Task</h2>
      <Calendar onChange={onChange} value={date} />
      <form onSubmit={handleSubmit}>
        <div>
          <label>Job Scope:</label>
          <input
            type="text"
            name="job_scope"
            value={taskDetails.job_scope}
            onChange={handleInputChange}
            placeholder="Enter job scope"
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
