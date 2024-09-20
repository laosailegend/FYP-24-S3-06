import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import '../style.css';
import { AuthContext } from '../auth/AuthContext';

function Schedule() {
  const tokenObj = localStorage.getItem("token") ? JSON.parse(atob(localStorage.getItem("token").split('.')[1])) : null;
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState([]); // State to store tasks
  const [shiftDetails, setShiftDetails] = useState({
    userid: '',
    shift_date: moment(new Date()).format('YYYY-MM-DD'),
    start_time: '',
    end_time: '',
    salary: ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!tokenObj || (tokenObj.role !== 1 && tokenObj.role !== 4)) {
      window.alert("You are not authorized to view this page");
      navigate("/", { replace: true });
      return () => {
      }
    }

    fetchSchedules();
    fetchTasks(); // Fetch tasks on component mount
  }, []);

  useEffect(() => {
    fetchSchedulesByDate(date);
  }, [date]);

  const fetchSchedules = async () => {
    try {
      const response = await fetch("http://localhost:8800/schedules");
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:8800/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchSchedulesByDate = async (selectedDate) => {
    const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
    try {
      const response = await fetch(`http://localhost:8800/schedules?shift_date=${formattedDate}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const onChange = (date) => {
    setDate(date);
    const formattedDate = moment(date).format('YYYY-MM-DD');
    setShiftDetails({
      ...shiftDetails,
      shift_date: formattedDate,
    });
  };

  const renderSchedules = () => {
    return schedules.length > 0 ? (
      <ul>
        {schedules.map((schedule) => (
          <li key={schedule.schedule_id}>
            {schedule.fname} {schedule.lname} - Shift: {schedule.start_time} - {schedule.end_time}
            <button onClick={() => handleEditClick(schedule)}>Edit</button>
            <button onClick={() => handleDeleteClick(schedule.schedule_id)}>Delete</button>
          </li>
        ))}
      </ul>
    ) : (
      <p>No schedules for this day.</p>
    );
  };

  const getTasksForDate = (date) => {
    const formattedDate = moment(date).format('YYYY-MM-DD');
    const filteredTasks = tasks.filter((task) => moment(task.timeslot).isSame(formattedDate, 'day'));
    return filteredTasks;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShiftDetails({ ...shiftDetails, [name]: value });
  };

  const handleAddClick = () => {
    setShiftDetails({
      userid: '',
      shift_date: moment(new Date()).format('YYYY-MM-DD'),
      start_time: '',
      end_time: '',
      salary: ''
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEditClick = (schedule) => {
    setEditingId(schedule.schedule_id);
    setShiftDetails({
      userid: schedule.userid || '',
      shift_date: moment(schedule.shift_date).format('YYYY-MM-DD') || '',
      start_time: schedule.start_time || '',
      end_time: schedule.end_time || '',
      salary: schedule.salary || ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (schedule_id) => {
    try {
      const response = await fetch(`http://localhost:8800/deleteSchedules/${schedule_id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      setSchedules(schedules.filter((sched) => sched.schedule_id !== schedule_id));
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { userid, shift_date, start_time, end_time, salary } = shiftDetails;
    const url = isEditing ? `http://localhost:8800/updateSchedules/${editingId}` : 'http://localhost:8800/addSchedules';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userid, shift_date, start_time, end_time, salary }),
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (isEditing) {
        setSchedules(schedules.map((sched) =>
          sched.schedule_id === editingId
            ? { ...sched, userid, shift_date, start_time, end_time, salary }
            : sched
        ));
      } else {
        setSchedules([...schedules, { userid, schedule_id: data.id, shift_date, start_time, end_time, salary }]);
      }
      setIsModalOpen(false);
      setIsEditing(false);
      setEditingId(null);
      alert('Shift saved successfully');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save shift');
    }
  };

  return (
    <div className="schedule-container">
      <h2>Employee Schedule</h2>
      <Calendar onChange={onChange} value={date} />
      <div className="schedule-details">
        <h3>Schedules for {moment(date).format('DD/MM/YYYY')}</h3>
        {renderSchedules()}

        <h3>Tasks for {moment(date).format('DD/MM/YYYY')}</h3>
        <ul>
          {getTasksForDate(date).map((task, index) => (
            <li key={index}>
              <strong>Job Scope:</strong> {task.taskname} <br />
              <strong>Description:</strong> {task.description} <br />
              <strong>Manpower Required:</strong> {task.manpower_required}
            </li>
          ))}
          {getTasksForDate(date).length === 0 && <p>No tasks for this day.</p>}
        </ul>
      </div>

      <button onClick={handleAddClick}>Add Shift</button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditing ? 'Edit Shift' : 'Add Shift'}</h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label>Employee ID:</label>
                <input
                  type="number"
                  name="userid"
                  value={shiftDetails.userid || ''}
                  onChange={handleInputChange}
                  placeholder="Enter Employee ID"
                  required
                />
              </div>
              <div>
                <label>Shift Date:</label>
                <input
                  type="date"
                  name="shift_date"
                  value={shiftDetails.shift_date || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label>Start Time:</label>
                <input
                  type="time"
                  name="start_time"
                  value={shiftDetails.start_time || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label>End Time:</label>
                <input
                  type="time"
                  name="end_time"
                  value={shiftDetails.end_time || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label>Salary per Hour:</label>
                <input
                  type="number"
                  name="salary"
                  value={shiftDetails.salary || ''}
                  onChange={handleInputChange}
                  placeholder="Enter salary"
                  required
                />
              </div>
              <button type="submit">{isEditing ? 'Update Shift' : 'Add Shift'}</button>
              <button type="button" onClick={() => { setIsModalOpen(false); setIsEditing(false); setEditingId(null); }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Schedule;