import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import '../style.css';

const server = process.env.REACT_APP_SERVER;

function WeeklyHours() {
  const tokenObj = localStorage.getItem("token")
    ? JSON.parse(atob(localStorage.getItem("token").split('.')[1]))
    : null;
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [weeklySchedules, setWeeklySchedules] = useState({});
  const [selectedWeek, setSelectedWeek] = useState('');

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${server}users`);
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      setEmployees(data.sort((a, b) => a.userid - b.userid));
    } catch (error) {
      console.error("Error fetching employees:", error);
      alert("Failed to fetch employees.");
    }
  };

  const fetchWeeklySchedules = async (employeeId) => {
    try {
      const response = await fetch(`${server}user/assignments/${employeeId}`);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();
      const groupedAndSorted = groupAndSortSchedulesByWeek(data);
      setWeeklySchedules(groupedAndSorted);
      // Set the selected week to the first one available
      const firstWeek = Object.keys(groupedAndSorted)[0] || '';
      setSelectedWeek(firstWeek);
    } catch (error) {
      console.error("Error fetching weekly schedules:", error);
      alert("Failed to fetch weekly schedules.");
    }
  };

  const groupAndSortSchedulesByWeek = (schedules) => {
    const grouped = schedules.reduce((acc, schedule) => {
        if (schedule.taskDate) {
            const shiftMoment = moment(schedule.taskDate);
            const weekOfMonth = Math.ceil(shiftMoment.date() / 7);
            const month = shiftMoment.format('MMMM');
            const key = `${month} - Week ${weekOfMonth}`;

            if (!acc[key]) acc[key] = [];
            acc[key].push(schedule);
        } else {
            console.warn('Task date is missing for schedule:', schedule);
        }
        return acc;
    }, {});

    const sortedGrouped = Object.keys(grouped)
        .sort((a, b) => {
            const [monthA, weekA] = a.split(' - Week ');
            const [monthB, weekB] = b.split(' - Week ');

            const dateA = moment().month(monthA).date(1);
            const dateB = moment().month(monthB).date(1);
            return dateA.diff(dateB) || parseInt(weekA) - parseInt(weekB);
        })
        .reduce((sortedAcc, key) => {
            sortedAcc[key] = grouped[key].sort((a, b) => moment(a.taskDate).diff(moment(b.taskDate)));
            return sortedAcc;
        }, {});

    return sortedGrouped;
};

  const handleEmployeeChange = (e) => {
    const employeeId = parseInt(e.target.value);
    setSelectedEmployee(employees.find(emp => emp.userid === employeeId));
    fetchWeeklySchedules(employeeId);
  };

  const handleWeekChange = (e) => {
    setSelectedWeek(e.target.value);
  };

  const calculateWeeklyHours = useCallback((assignments) => {
    let totalHours = 0;
    let overtimeHours = 0;
    const weeklyThreshold = 44;

    assignments.forEach((assignment) => {
      const clockInTime = assignment.clockInTime ? moment(assignment.clockInTime, "HH:mm:ss") : null;
      const clockOutTime = assignment.clockOutTime ? moment(assignment.clockOutTime, "HH:mm:ss") : null;

      let actualHours = 0;

      if (clockInTime && clockOutTime) {
        if (clockOutTime.isBefore(clockInTime)) {
          clockOutTime.add(1, 'days');
        }
        actualHours = clockOutTime.diff(clockInTime, 'hours', true);
        totalHours += actualHours;
      } else {
        console.warn('Missing clock times for assignment:', assignment);
      }

      const startTime = moment(assignment.startTime, "HH:mm:ss");
      const endTime = moment(assignment.endTime, "HH:mm:ss");

      if (endTime.isBefore(startTime)) {
        endTime.add(1, 'days');
      }

      const scheduledHours = endTime.diff(startTime, 'hours', true);

      if (actualHours > scheduledHours) {
        overtimeHours += actualHours - scheduledHours;
      }
    });

    if (totalHours > weeklyThreshold) {
      overtimeHours += totalHours - weeklyThreshold;
    }

    return {
      totalHours: totalHours || 0,
      overtimeHours: overtimeHours || 0,
    };
  }, []);

  useEffect(() => {
    if (!tokenObj || (tokenObj.role !== 1 && tokenObj.role !== 4)) {
      alert("You are not authorized to view this page.");
      navigate("/", { replace: true });
    } else {
      fetchEmployees();
    }
  }, []);

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
          <div className="select-week">
            <label>Select Week:</label>
            <select onChange={handleWeekChange} value={selectedWeek}>
              {Object.keys(weeklySchedules).map((weekKey) => (
                <option key={weekKey} value={weekKey}>
                  {weekKey}
                </option>
              ))}
            </select>
          </div>

          {selectedWeek && weeklySchedules[selectedWeek] && (
            <div className="weekly-section">
              <h4>{selectedWeek}</h4>
              <ul>
                {weeklySchedules[selectedWeek].map((schedule) => (
                  <li key={schedule.assignmentId} className="task-entry">
                    <h5>{moment(schedule.taskDate).format('DD-MM-YYYY')}</h5>
                    <div className="schedule-details">
                      <p>Scheduled: {schedule.startTime} - {schedule.endTime}</p>
                      <p>Clock In: {schedule.clockInTime || "Not clocked in"}</p>
                      <p>Clock Out: {schedule.clockOutTime || "Not clocked out"}</p>
                    </div>
                  </li>
                ))}
              </ul>
              {calculateWeeklyHours(weeklySchedules[selectedWeek]) && (
                <div>
                  <p>Total Hours: {calculateWeeklyHours(weeklySchedules[selectedWeek]).totalHours.toFixed(2)}</p>
                  <p>Overtime Hours: {calculateWeeklyHours(weeklySchedules[selectedWeek]).overtimeHours.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WeeklyHours;
