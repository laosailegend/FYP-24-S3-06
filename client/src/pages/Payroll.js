import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import '../style.css';

function Payroll() {
  const tokenObj = localStorage.getItem("token")
    ? JSON.parse(atob(localStorage.getItem("token").split('.')[1]))
    : null;
  const navigate = useNavigate();

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalHoursWorked, setTotalHoursWorked] = useState(0);
  const [regularHours, setRegularHours] = useState(0);
  const [weekendHours, setWeekendHours] = useState(0);
  const [publicHolidayHours, setPublicHolidayHours] = useState(0);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(moment().month());

  const fetchEmployees = async () => {
    try {
      const response = await fetch("http://localhost:8800/users");
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setEmployees(data.sort((a, b) => a.userid - b.userid));
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Failed to fetch employees. Please try again later.");
    }
  };

  const fetchSchedules = async (employeeId) => {
    const payPeriodStart = moment().startOf('month').format('YYYY-MM-DD');
    const payPeriodEnd = moment().endOf('month').format('YYYY-MM-DD');

    try {
      const response = await fetch(
        `http://localhost:8800/schedules?userid=${employeeId}&start=${payPeriodStart}&end=${payPeriodEnd}`
      );
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      alert("Failed to fetch schedules. Please try again later.");
    }
  };

  const handleEmployeeChange = (e) => {
    const employeeId = parseInt(e.target.value);
    const employee = employees.find((emp) => emp.userid === employeeId);
    setSelectedEmployee(employee);
    setSchedules([]);
    setTotalEarnings(0);
    setTotalHoursWorked(0);
    fetchSchedules(employeeId);
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value));
  };

  const handleOvertimeChange = (e) => {
    setOvertimeHours(parseFloat(e.target.value));
  };

  const calculatePayroll = useCallback(() => {
    if (!selectedEmployee) return;

    let totalHours = 0;
    let totalPay = 0;
    let regular = 0;
    let weekend = 0;
    let publicHoliday = 0;

    const filteredSchedules = schedules.filter(schedule =>
      moment(schedule.shift_date).month() === selectedMonth
    );

    filteredSchedules.forEach((schedule) => {
      const start = moment(schedule.start_time, "HH:mm:ss");
      const end = moment(schedule.end_time, "HH:mm:ss");

      if (end.isBefore(start)) end.add(1, 'days');

      const hoursWorked = end.diff(start, "hours", true);

      if (hoursWorked > 0) {
        totalHours += hoursWorked;
        let payRate = schedule.salary;

        if (schedule.is_weekend) {
          payRate *= 1.5;
          weekend += hoursWorked;
        } else if (schedule.is_public_holiday) {
          payRate *= 2;
          publicHoliday += hoursWorked;
        } else {
          regular += hoursWorked;
        }

        totalPay += hoursWorked * payRate;
      }
    });

    const overtimePay = overtimeHours * 1.5 * filteredSchedules[0]?.salary || 0;

    setTotalEarnings(totalPay + overtimePay);
    setTotalHoursWorked(totalHours);
    setRegularHours(regular);
    setWeekendHours(weekend);
    setPublicHolidayHours(publicHoliday);
  }, [schedules, selectedEmployee, selectedMonth, overtimeHours]);

  const recordPayroll = async () => {
    if (!selectedEmployee) return;

    const payPeriodStart = moment().month(selectedMonth).startOf('month').format('YYYY-MM-DD');
    const payPeriodEnd = moment().month(selectedMonth).endOf('month').format('YYYY-MM-DD');

    try {
      const response = await fetch("http://localhost:8800/payroll", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userid: selectedEmployee.userid,
          pay_period_start: payPeriodStart,
          pay_period_end: payPeriodEnd,
          total_hours_worked: totalHoursWorked,
          regular_hours: regularHours,
          weekend_hours: weekendHours,
          public_holiday_hours: publicHolidayHours,
          overtime_hours: overtimeHours,
          total_earnings: totalEarnings,
        }),
      });

      if (!response.ok) throw new Error('Failed to record payroll');
      const result = await response.json();
      alert(`Payroll recorded successfully! Payroll ID: ${result.payroll_id}`);
    } catch (error) {
      console.error('Error recording payroll:', error);
      alert("Failed to record payroll. Please try again later.");
    }
  };

  useEffect(() => {
    if (!tokenObj || (tokenObj.role !== 1 && tokenObj.role !== 4)) {
      alert("You are not authorized to view this page");
      navigate("/", { replace: true });
    } else {
      fetchEmployees();
    }
  }, [navigate, tokenObj]);

  useEffect(() => {
    if (selectedEmployee) calculatePayroll();
  }, [schedules, selectedEmployee, selectedMonth, calculatePayroll]);

  const monthOptions = moment.months().map((month, index) => ({
    value: index,
    label: month,
  }));

  return (
    <div className="calendar-payroll-container">
      <h2>Employee Payroll Calculation</h2>

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
          <div className="month-selector">
            <label>Select Month:</label>
            <select onChange={handleMonthChange} value={selectedMonth}>
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="overtime-input">
            <label>Overtime Hours:</label>
            <input
              type="number"
              value={overtimeHours}
              onChange={handleOvertimeChange}
              min="0"
              step="0.1"
            />
          </div>

          <div className="monthly-total">
            <h3>Total Hours Worked: {totalHoursWorked.toFixed(2)}</h3>
            <h3>Regular Hours: {regularHours.toFixed(2)}</h3>
            <h3>Weekend Hours: {weekendHours.toFixed(2)}</h3>
            <h3>Public Holiday Hours: {publicHolidayHours.toFixed(2)}</h3>
            <h3>Total Earnings: ${totalEarnings.toFixed(2)}</h3>
            <button onClick={recordPayroll}>Record Payroll</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payroll;
