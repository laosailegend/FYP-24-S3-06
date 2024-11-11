import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import '../style.css';
import axios from 'axios';
const server = process.env.REACT_APP_SERVER;

const Tasks = () => {
  // Use state with a function to derive the initial tokenObj value
  const [tokenObj] = useState(() => {
    const token = localStorage.getItem("token");
    return token ? JSON.parse(atob(token.split('.')[1])) : null;
  });
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(''); // Added state for start time
  const [selectedCompany, setSelectedCompany] = useState('');
  const companyOptions = [
    { compid: 0, name: 'EmpRoster' },
    { compid: 1, name: 'Hello World PTE LTD' },
    { compid: 5, name: 'Acme Corp' },
    { compid: 6, name: 'Stellar Widgets' },
    { compid: 7, name: 'Green Innovations' },
    { compid: 9, name: 'Fake Company' },
    // Add more companies as needed
  ];

  // Handle company change
  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value); // Store the selected company ID in the state
  };

  const [endTime, setEndTime] = useState(''); // Added state for end time
  const [holidays, setHolidays] = useState([]);
  const [publicHolidays, setPublicHolidays] = useState({}); // State for public holidays
  const apiKey = '8WUuhRGlcWlVOlJoTJOYApvnaiVzmQsO'; // Calendarific API key

  const fetchAllPublicHolidays = async () => {
    const yearsToFetch = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];
    const holidays = {};  // You were defining a new object here, but you're not setting it directly.
    
    for (let year of yearsToFetch) {
      try {
        const response = await axios.get(`https://calendarific.com/api/v2/holidays?&api_key=${apiKey}&country=SG&year=${year}`);
        response.data.response.holidays.forEach((holiday) => {
          const dateString = moment(holiday.date.iso).format('YYYY-MM-DD');
          holidays[dateString] = holiday.name;  // Set the holiday name by date
        });
      } catch (error) {
        console.error(`Error fetching public holidays for year ${year}:`, error);
      }
    }
  
    setPublicHolidays(holidays); // Update the state after loop finishes
  };
  
  useEffect(() => {
    fetchAllPublicHolidays();
  }, []);
  
  useEffect(() => {
    if (!tokenObj || (tokenObj.role !== 1 && tokenObj.role !== 2)) {
      window.alert("You are not authorized to view this page");
      navigate("/", { replace: true });
      return;
    }

    if (tokenObj === null) {
      return null;  // You can replace this with a loading indicator if you prefer
    }
    
    fetchTasks();
  }, [navigate, tokenObj]);

  const [taskDetails, setTaskDetails] = useState({
    taskname: '',
    description: '',
    manpower_required: '',
    start_time: '',
    end_time: '',
    compid: null,

  });
  const [tasks, setTasks] = useState([]);
  const [editTaskId, setEditTaskId] = useState(null); // State to track which task is being edited

  useEffect(() => {
    fetchTasks();
  }, [navigate, tokenObj]);

  useEffect(() => {
    console.log('Tasks state updated:', tasks);
  }, [tasks]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${server}tasks`);
      console.log('Fetched tasks:', response.data);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const onChange = (newDate) => {
    setDate(newDate);
  };

  // Adjust tileContent to show holiday label
  const tileContent = ({ date }) => {
    const formattedDate = moment(date).format('YYYY-MM-DD');
    const holidayName = publicHolidays[formattedDate];
    if (holidayName) {
      return <p className="holiday">{holidayName}</p>;
    }
    return null;
  };
  
  
  const tileClassName = ({ date }) => {
    const formattedDate = moment(date).format('YYYY-MM-DD');
    return publicHolidays[formattedDate] ? 'holiday-tile' : null; // Apply holiday class
  };
  useEffect(() => {
    console.log("Fetched public holidays:", publicHolidays); // Log the state to ensure it's populated
  }, [publicHolidays]);
  



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskDetails({ ...taskDetails, [name]: value });
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formattedDate = formatDate(date); // Use the new formatDate utility

    const newTask = { 
        taskname: taskDetails.taskname, 
        description: taskDetails.description, 
        manpower_required: taskDetails.manpower_required, 
        task_date: formattedDate, 
        start_time: startTime, 
        end_time: endTime, 
        compid: selectedCompany,
    };

    try {
      const response = await axios.post(`${server}createTasks`, newTask);
      if (response.status === 201) {
        alert('Task added successfully');
        setTaskDetails({ taskname: '', description: '', manpower_required: '' });
        setStartTime(''); // Reset start time
        setEndTime(''); // Reset end time
        fetchTasks();
        setSelectedCompany('');  // Reset the company dropdown
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
      await axios.delete(`${server}task/${id}`);
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
      selectedCompany: task.compid
    });
    setStartTime(task.start_time); // Set start time for editing
    setEndTime(task.end_time); // Set end time for editing
    setSelectedCompany(task.selectedCompany);
    setEditTaskId(task.taskid);
  };
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    const formattedDate = formatDate(date); // Use the new formatDate utility
    const updatedTask = { 
      taskname: taskDetails.taskname, 
      description: taskDetails.description, 
      manpower_required: taskDetails.manpower_required, 
      task_date: formattedDate, // Correctly formatted
      start_time: startTime, 
      end_time: endTime,
      compid: selectedCompany,
    };

    try {
      const response = await axios.put(`${server}task${editTaskId}`, updatedTask);
      if (response.status === 200) {
        alert('Task updated successfully');
        setTaskDetails({ taskname: '', description: '', manpower_required: '' });
        setStartTime(''); // Reset start time
        setEndTime(''); // Reset end time
        fetchTasks();
        setSelectedCompany(''); // Reset the company dropdown
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
    <h1>Tasks</h1>
  
    {/* Create a container to hold both calendar and task form side by side */}
    <div className="calendar-and-task-form">
      {/* Calendar Component */}
      <div className="calendar-container">
        <Calendar
          onChange={onChange}
          value={date}
          tileContent={tileContent}
          tileClassName={tileClassName}
        />
      </div>
  
      {/* Task Form */}
      <div className="task-form-container">
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
  
          {/* Company Dropdown */}
          <div>
            <label>Select Company:</label>
            <select value={selectedCompany} onChange={handleCompanyChange}>
              <option value="">--Select Company--</option>
              {companyOptions.map((company) => (
                <option key={company.compid} value={company.compid}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
  
          <div>
            <label>Start Time:</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div>
            <label>End Time:</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
          <button type="submit">{editTaskId ? 'Update Task' : 'Add Task'}</button>
        </form>
      </div>
    </div>
  
    {/* Task List */}
    <div className="tasks-list">
        <h3>Tasks</h3>
        <ul>
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <li key={task.taskid}>
                  <strong>Job Scope:</strong> {task.taskname || 'No Name'} <br />
                  <strong>Description:</strong> {task.description || 'No Description'} <br />
                  <strong>Manpower Required:</strong> {task.manpower_required || 'No Manpower Info'} <br />
                  <strong>Task Date:</strong> {moment(task.task_date).format('YYYY-MM-DD') || 'No Date Info'} <br />
                  <strong>Weekend:</strong> {task.isWeekend || 'No'} <br />
                  <strong>Public Holiday:</strong> {task.isHoliday || 'No'} <br />
                  <strong>Start Time:</strong> {task.start_time || 'No Start Time Info'} <br />
                  <strong>End Time:</strong> {task.end_time || 'No End Time Info'} <br />
                  <strong>Company:</strong> {companyOptions.find(company => company.compid === task.compid)?.name || 'No Company Info'}
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
