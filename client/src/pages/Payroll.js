import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import '../style.css';

function Payroll() {
  const tokenObj = localStorage.getItem("token") ? JSON.parse(atob(localStorage.getItem("token").split('.')[1])) : null;
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [workDays, setWorkDays] = useState([]);
  const [shiftDetails, setShiftDetails] = useState({
    start_time: '',
    end_time: '',
  });

  // Sample employee data with hourly rates
  const [employees] = useState([
    { id: 1, name: 'Alice', hourly_rate: 20 },
    { id: 2, name: 'Bob', hourly_rate: 25 },
    { id: 3, name: 'Charlie', hourly_rate: 30 }
  ]);

  const handleEmployeeChange = (e) => {
    const employeeId = parseInt(e.target.value);
    const employee = employees.find(emp => emp.id === employeeId);
    setSelectedEmployee(employee);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShiftDetails({ ...shiftDetails, [name]: value });
  };

  const handleDateSelect = () => {
    if (!selectedEmployee || !shiftDetails.start_time || !shiftDetails.end_time) {
      alert('Please fill out all fields and select an employee.');
      return;
    }

    const { start_time, end_time } = shiftDetails;
    const start = moment(start_time, 'HH:mm');
    const end = moment(end_time, 'HH:mm');
    const hoursWorked = end.diff(start, 'hours', true); // Calculate hours worked

    if (hoursWorked < 0) {
      alert('End time must be after start time.');
      return;
    }

    const workDay = {
      date: moment(date).format('DD-MM-YYYY'),
      hours: hoursWorked,
      pay: hoursWorked * selectedEmployee.hourly_rate
    };

    setWorkDays([...workDays, workDay]);
    setShiftDetails({ start_time: '', end_time: '' }); // Clear inputs
  };

  const calculateMonthlyTotal = () => {
    const total = workDays.reduce((acc, workDay) => acc + workDay.pay, 0);
    return total.toFixed(2);
  };

  useEffect(() => {
    // prevents non-admin users from viewing the page
    if (!tokenObj || (tokenObj.role !== 1 && tokenObj.role !== 4)) {
      window.alert("You are not authorized to view this page");
      navigate("/", { replace: true });
      return () => { };
    }
  });

  return (
    <div className="calendar-payroll-container">
      <h2>Employee Payroll Calculation</h2>

      <div className="select-employee">
        <label>Select Employee:</label>
        <select onChange={handleEmployeeChange} defaultValue="">
          <option value="" disabled>Select an employee</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>
      </div>

      {selectedEmployee && (
        <div>
          <Calendar
            onChange={setDate}
            value={date}
            minDetail="month"
            formatDay={(locale, date) => moment(date).format('DD')}
          />

          <div className="shift-details">
            <h3>Add Shift for {selectedEmployee.name}</h3>

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

            <button onClick={handleDateSelect}>Add Shift</button>

            <div className="work-days-list">
              <h3>Work Days</h3>
              <ul>
                {workDays.map((workDay, index) => (
                  <li key={index}>
                    Date: {workDay.date}, Hours Worked: {workDay.hours.toFixed(2)}, Pay: ${workDay.pay.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="monthly-total">
              <h3>Monthly Total: ${calculateMonthlyTotal()}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payroll;
