import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import '../style.css';

function Schedule() {
  const [date, setDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState([]); // State for tasks
  const [employees, setEmployees] = useState([]);
  const [shiftDetails, setShiftDetails] = useState({
    shift_date: '',
    start_time: '',
    end_time: '',
    salary_per_hour: '',
    employee_id: '',
  });

  useEffect(() => {
    fetch('/schedules')
      .then((res) => res.json())
      .then((data) => setSchedules(data));

    fetch('/employees')
      .then((res) => res.json())
      .then((data) => setEmployees(data));

    // Load tasks from local storage
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    setTasks(savedTasks);
  }, []);

  const onChange = (date) => {
    setDate(date);
    setShiftDetails({
      ...shiftDetails,
      shift_date: moment(date).format('DD/MM/YYYY'),
    });
  };

  const renderSchedulesAndTasks = (date) => {
    const daySchedules = schedules.filter(
      (schedule) => moment(schedule.shift_date).isSame(date, 'day')
    );

    const dayTasks = tasks.filter(
      (task) => moment(task.task_date).isSame(date, 'day')
    );

    return (
      <div>
        <div className="schedules">
          <h4>Shifts:</h4>
          {daySchedules.length > 0 ? (
            <ul>
              {daySchedules.map((schedule) => (
                <li key={schedule.schedule_id}>
                  Shift: {schedule.start_time} - {schedule.end_time} | Salary: {schedule.salary_per_hour} | Employee: {employees.find(emp => emp.id === schedule.employee_id)?.name}
                </li>
              ))}
            </ul>
          ) : (
            <p>No shifts for this day.</p>
          )}
        </div>
        <div className="tasks">
          <h4>Tasks:</h4>
          {dayTasks.length > 0 ? (
            <ul>
              {dayTasks.map((task, index) => (
                <li key={index}>
                  Task: {task.job_scope} | Description: {task.description} | Manpower Required: {task.manpower_required}
                </li>
              ))}
            </ul>
          ) : (
            <p>No tasks for this day.</p>
          )}
        </div>
      </div>
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShiftDetails({ ...shiftDetails, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { shift_date, start_time, end_time, salary_per_hour, employee_id } = shiftDetails;

    const formattedShiftDate = moment(shift_date, 'DD/MM/YYYY').format('YYYY-MM-DD');

    fetch('/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ shift_date: formattedShiftDate, start_time, end_time, salary_per_hour, employee_id }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert('Shift added successfully');
        setSchedules([...schedules, { schedule_id: data.id, shift_date: formattedShiftDate, start_time, end_time, salary_per_hour, employee_id }]);
      })
      .catch((err) => {
        console.error('Error:', err);
        alert('Failed to add shift');
      });
  };

  const formatDate = (date) => moment(date).format('DD/MM/YYYY');

  return (
    <div className="schedule-container">
      <h2>Employee Schedule</h2>
      <Calendar onChange={onChange} value={date} />
      <div className="schedule-details">
        <h3>Details for {formatDate(date)}</h3>
        {renderSchedulesAndTasks(date)}
      </div>

      <div className="add-shift-form">
        <h3>Add a Shift</h3>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Shift Date:</label>
            <input
              type="text"
              name="shift_date"
              value={shiftDetails.shift_date}
              onChange={handleInputChange}
              placeholder="dd/mm/yyyy"
              required
            />
          </div>
          <div>
            <label>Start Time:</label>
            <input
              type="time"
              name="start_time"
              value={shiftDetails.start_time}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label>End Time:</label>
            <input
              type="time"
              name="end_time"
              value={shiftDetails.end_time}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label>Salary per Hour:</label>
            <input
              type="number"
              name="salary_per_hour"
              value={shiftDetails.salary_per_hour}
              onChange={handleInputChange}
              placeholder="Enter salary"
              required
            />
          </div>
          <div>
            <label>Employee:</label>
            <select
              name="employee_id"
              value={shiftDetails.employee_id}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit">Add Shift</button>
        </form>
      </div>
    </div>
  );
}

export default Schedule;