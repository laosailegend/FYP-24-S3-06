import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import '../style.css';
import axios from 'axios';

const server = process.env.REACT_APP_SERVER;

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
  const [publicHolidays, setPublicHolidays] = useState({}); // State for public holidays

  const apiKey = '8WUuhRGlcWlVOlJoTJOYApvnaiVzmQsO'; // Calendarific API key

  useEffect(() => {
    if (!tokenObj || (tokenObj.role !== 1 && tokenObj.role !== 4)) {
      window.alert("You are not authorized to view this page");
      navigate("/", { replace: true });
      return;
    }

    fetchSchedules();
    fetchTasks(); // Fetch tasks on component mount
    fetchAllPublicHolidays(); // Fetch holidays for all defined years
  }, []);

  useEffect(() => {
    fetchSchedulesByDate(date);
  }, [date]);

  const fetchAllPublicHolidays = async () => {
    const yearsToFetch = [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034];
    const holidays = {};

    for (let year = yearsToFetch[0]; year <= yearsToFetch[1]; year++) {
      try {
        const response = await axios.get(`https://calendarific.com/api/v2/holidays?&api_key=${apiKey}&country=SG&year=${year}`);
        const holidaysData = response.data.response.holidays;
        holidaysData.forEach((holiday) => {
          const dateString = moment(holiday.date.iso).format('YYYY-MM-DD');
          holidays[dateString] = holiday.name; // Add holiday name to date
        });
      } catch (error) {
        console.error(`Error fetching public holidays for year ${year}:`, error);
      }
    }

    setPublicHolidays(holidays); // Set state with all fetched holidays
  };

  const fetchSchedules = async () => {
    try {
      const response = await fetch(`${server}schedules`);
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${server}tasks`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setTasks(data); // Ensure that tasks is set to an array
      } else {
        console.error('Expected tasks to be an array but got:', data);
        setTasks([]); // Default to empty array if data is not an array
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]); // In case of error, set empty array
    }
  };

  const fetchSchedulesByDate = async (selectedDate) => {
    const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
    try {
      const response = await fetch(`${server}schedules?shift_date=${formattedDate}`);
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
      <label>No schedules for this day</label>
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
      const response = await fetch(`${server}$deleteSchedules/${schedule_id}`, {
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
    const url = isEditing ? `${server}$updateSchedules/${editingId}` : `${server}addSchedules`;
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

  const getHolidayName = (date) => {
    const formattedDate = moment(date).format('YYYY-MM-DD');
    return publicHolidays[formattedDate] || '';
  };

  const tileClassName = ({ date }) => {
    const formattedDate = moment(date).format('YYYY-MM-DD');
    return publicHolidays[formattedDate] ? 'holiday' : '';
  };

  const tileContent = ({ date }) => {
    const holidayName = getHolidayName(date);
    return holidayName ? <div className="holiday-name">{holidayName}</div> : null;
  };

  return (
    <div className="schedule-container">
      <h2>Employee Schedule</h2>

      <div className="schedule-details-container">
        <div className="schedule-calendar">
          <Calendar
            onChange={onChange}
            value={date}
            tileClassName={tileClassName}
            tileContent={tileContent}
          />
        </div>

        <div className="schedule-details">
          <h3>Schedules for {moment(date).format('DD/MM/YYYY')}</h3>
          {renderSchedules()}

          <h3>Tasks for {moment(date).format('DD/MM/YYYY')}</h3>
          <ul>
            {getTasksForDate(date).map((task, index) => (
              <li key={index}>{task.name} - {moment(task.timeslot).format('HH:mm')}</li>
            ))}
          </ul>

          <button onClick={handleAddClick}>Add Shift</button>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal">
          <form onSubmit={handleSubmit}>
            <h3>{isEditing ? 'Edit Shift' : 'Add Shift'}</h3>
            <input
              type="text"
              name="userid"
              value={shiftDetails.userid}
              onChange={handleInputChange}
              placeholder="Employee ID"
              required
            />
            <input
              type="date"
              name="shift_date"
              value={shiftDetails.shift_date}
              onChange={handleInputChange}
              required
            />
            <input
              type="time"
              name="start_time"
              value={shiftDetails.start_time}
              onChange={handleInputChange}
              required
            />
            <input
              type="time"
              name="end_time"
              value={shiftDetails.end_time}
              onChange={handleInputChange}
              required
            />
            <input
              type="number"
              name="salary"
              value={shiftDetails.salary}
              onChange={handleInputChange}
              placeholder="Salary"
              required
            />
            <button type="submit">Save</button>
            <button type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
          </form>
        </div>
      )}
    </div>

  );
}

export default Schedule;
