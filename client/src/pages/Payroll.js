import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../style.css';

const Payroll = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get('http://localhost:8800/users');
        setEmployees(response.data);
      } catch (err) {
        setError('Failed to fetch employees');
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      const fetchPayrollData = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`http://localhost:8800/calculatePayroll/${selectedUser}`);
          setPayrollData(response.data.payroll);
        } catch (err) {
          setError('Failed to fetch payroll data');
        } finally {
          setLoading(false);
        }
      };
      fetchPayrollData();
    }
  }, [selectedUser]);

  const filteredPayrollData = payrollData?.filter(data => {
    const date = new Date(data.assigned_date);
    return date.getFullYear() === parseInt(selectedYear) && date.getMonth() + 1 === parseInt(selectedMonth);
  });

  // Function to handle payroll record creation
  const handleRecordPayroll = async () => {
    if (!filteredPayrollData || filteredPayrollData.length === 0) return;

    // Calculate totals for payroll
    const totalHoursWorked = filteredPayrollData.reduce((sum, data) =>
      sum + data.regular_hours + data.weekend_hours + data.public_holiday_hours + data.overtime_hours, 0);
    const regularHours = filteredPayrollData.reduce((sum, data) => sum + data.regular_hours, 0);
    const weekendHours = filteredPayrollData.reduce((sum, data) => sum + data.weekend_hours, 0);
    const publicHolidayHours = filteredPayrollData.reduce((sum, data) => sum + data.public_holiday_hours, 0);
    const overtimeHours = filteredPayrollData.reduce((sum, data) => sum + data.overtime_hours, 0);
    const basePay = filteredPayrollData.reduce((sum, data) => sum + data.base_pay, 0);
    const overtimePay = filteredPayrollData.reduce((sum, data) => sum + data.overtime_pay, 0);
    const totalPay = filteredPayrollData.reduce((sum, data) => sum + data.totalPay, 0);

    // Send the calculated payroll data to the backend
    try {
      const response = await axios.post('http://localhost:8800/payroll', {
        userid: selectedUser,
        pay_period_start: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`,
        pay_period_end: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate()}`,
        total_hours_worked: totalHoursWorked,
        regular_hours: regularHours,
        weekend_hours: weekendHours,
        public_holiday_hours: publicHolidayHours,
        overtime_hours: overtimeHours,
        base_pay: basePay,
        overtime_pay: overtimePay,
        total_pay: totalPay
      });
      alert(response.data.message || 'Payroll recorded successfully');
    } catch (error) {
      console.error('Failed to record payroll:', error);
      alert('Failed to record payroll');
    }
  };

  return (
    <div>
      <h2>Select Employee to View Payroll</h2>
      <select onChange={(e) => setSelectedUser(e.target.value)} value={selectedUser || ''}>
        <option value="" disabled>Select Employee</option>
        {employees.map((employee) => (
          <option key={employee.userid} value={employee.userid}>
            {employee.fname} {employee.lname}
          </option>
        ))}
      </select>

      <div>
        <label>Year: </label>
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
          {[2024, 2023, 2022, 2021].map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        <label>Month: </label>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>
      </div>

      {filteredPayrollData && (
        <div className="payroll-table-container">
          <h3>Payroll Details for {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Hourly Rate</th>
                <th>Regular Hours</th>
                <th>Weekend Hours</th>
                <th>Public Day Hours</th>
                <th>Overtime Hours</th>
                <th>Base Pay</th>
                <th>Overtime Pay</th>
                <th>Total Pay</th>
              </tr>
            </thead>
            <tbody>
          {filteredPayrollData.map((data, index) => (
            <tr key={index}>
              <td>{data.position}</td>
              <td>{data.hourly_rate ? parseFloat(data.hourly_rate).toFixed(2) : 'N/A'}</td>
              <td>{data.regular_hours ? parseFloat(data.regular_hours).toFixed(2) : 'N/A'}</td>
              <td>{data.weekend_hours ? parseFloat(data.weekend_hours).toFixed(2) : 'N/A'}</td>
              <td>{data.public_holiday_hours ? parseFloat(data.public_holiday_hours).toFixed(2) : 'N/A'}</td>
              <td>{data.overtime_hours ? parseFloat(data.overtime_hours).toFixed(2) : 'N/A'}</td>
              <td>{data.base_pay ? parseFloat(data.base_pay).toFixed(2) : 'N/A'}</td>
              <td>{data.overtime_pay ? parseFloat(data.overtime_pay).toFixed(2) : 'N/A'}</td>
              <td>{data.totalPay ? parseFloat(data.totalPay).toFixed(2) : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
          </table>
          <button onClick={handleRecordPayroll}>Record Payroll</button>
        </div>
      )}
    </div>
  );
};

export default Payroll;
