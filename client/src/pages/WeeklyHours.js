import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import '../style.css';

function WeeklyHours() {
  const tokenObj = localStorage.getItem("token")
    ? JSON.parse(atob(localStorage.getItem("token").split('.')[1]))
    : null;
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [weeklySchedules, setWeeklySchedules] = useState({});

  const fetchEmployees = async () => {
    try {
      const response = await fetch("http://localhost:8800/users");
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setEmployees(data.sort((a, b) => a.userid - b.userid));
    } catch (error) {
      console.error("Error fetching employees:", error);
      alert("Failed to fetch employees.");
    }
  };

  const fetchWeeklySchedules = async (employeeId) => {
    try {
      const response = await fetch(`http://localhost:8800/user/schedules/${employeeId}`);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();
      const groupedAndSorted = groupAndSortSchedulesByWeek(data);
      setWeeklySchedules(groupedAndSorted);
    } catch (error) {
      console.error("Error fetching weekly schedules:", error);
      alert("Failed to fetch weekly schedules.");
    }
  };

  // Group schedules by month and week, and sort within each week
  const groupAndSortSchedulesByWeek = (schedules) => {
    const grouped = schedules.reduce((acc, schedule) => {
      const shiftMoment = moment(schedule.shiftDate);
      const month = shiftMoment.format('MMMM'); // e.g., "September"
      const weekOfMonth = Math.ceil(shiftMoment.date() / 7); // Week 1, 2, etc.
      const key = `${month} - Week ${weekOfMonth}`;

      if (!acc[key]) acc[key] = [];
      acc[key].push(schedule);

      return acc;
    }, {});

    // Sort each week's schedules by date in ascending order
    Object.keys(grouped).forEach((key) => {
      grouped[key] = grouped[key].sort((a, b) =>
        moment(a.shiftDate).diff(moment(b.shiftDate))
      );
    });

    return grouped;
  };

  const handleEmployeeChange = (e) => {
    const employeeId = parseInt(e.target.value);
    setSelectedEmployee(employees.find(emp => emp.userid === employeeId));
    fetchWeeklySchedules(employeeId);
  };

  const calculateWeeklyHours = useCallback((schedules) => {
    let total = 0;
    let overtime = 0;
  
    schedules.forEach((schedule) => {
      // Parse clock-in and clock-out times
      const clockInTime = schedule.clockInTime
        ? moment(schedule.clockInTime, "HH:mm:ss")
        : null;
      const clockOutTime = schedule.clockOutTime
        ? moment(schedule.clockOutTime, "HH:mm:ss")
        : null;
  
      let actualHours = 0;
  
      // Calculate actual hours only if both times are valid
      if (clockInTime && clockOutTime) {
        if (clockOutTime.isBefore(clockInTime)) {
          clockOutTime.add(1, 'days'); // Adjust for overnight shifts
        }
        actualHours = clockOutTime.diff(clockInTime, 'hours', true);
        total += actualHours;
      }
  
      // Parse scheduled start and end times
      const startTime = moment(schedule.startTime, "HH:mm:ss");
      const endTime = moment(schedule.endTime, "HH:mm:ss");
  
      // Adjust endTime if the shift goes past midnight
      if (endTime.isBefore(startTime)) {
        endTime.add(1, 'days');
      }
  
      const scheduledHours = endTime.diff(startTime, 'hours', true);
  
      // Calculate overtime only if actual hours exceed scheduled hours
      if (actualHours > scheduledHours) {
        overtime += actualHours - scheduledHours;
      }
    });
  
    // Set total and overtime hours (ensure no NaN values)
    return {
      totalHours: total || 0,
      overtime: overtime || 0,
    };
  }, []);
  
  useEffect(() => {
    if (!tokenObj || (tokenObj.role !== 1 && tokenObj.role !== 4)) {
      alert("You are not authorized to view this page.");
      navigate("/", { replace: true });
    } else {
      fetchEmployees();
    }
  }, [navigate, tokenObj]);

  return (
    <div className="weekly-hours-container">
      <h2>Weekly Hours Tracker</h2>

      <div className="select-employee">
        <label>Select Employee:</label>
        <select onChange={handleEmployeeChange} defaultValue="">
          <option value="" disabled>Select an employee</option>
          {employees.map((emp) => (
            <option key={emp.userid} value={emp.userid}>
              {emp.fname} {emp.lname}
            </option>
          ))}
        </select>
      </div>

      {selectedEmployee && (
        <div>
          <h3>Schedules for {selectedEmployee.fname} {selectedEmployee.lname}</h3>

          {Object.entries(weeklySchedules).map(([key, schedules]) => {
            const { totalHours, overtime } = calculateWeeklyHours(schedules);

            return (
              <div key={key} className="weekly-section">
                <h4>{key}</h4>
                <ul>
                  {schedules.map((schedule) => (
                    <li key={schedule.scheduleId}>
                      {moment(schedule.shiftDate).format('DD-MM-YYYY')}: 
                      {schedule.startTime} - {schedule.endTime}
                      <div>
                        <p>Clock In: {schedule.clockInTime || "Not clocked in"}</p>
                        <p>Clock Out: {schedule.clockOutTime || "Not clocked out"}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p>
                  Total Hours: <span style={{ color: totalHours > 44 ? 'red' : 'black' }}>
                    {totalHours.toFixed(2)}
                  </span>
                </p>
                <p>
                  Overtime: <span style={{ color: overtime > 0 ? 'red' : 'black' }}>
                    {overtime.toFixed(2)}
                  </span>
                </p>
                {totalHours > 44 && <p style={{ color: 'red' }}>Overtime limit exceeded!</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WeeklyHours;
