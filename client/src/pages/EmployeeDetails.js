import React, { useEffect, useState } from 'react';
import axios from 'axios';

const EmployeeDetails = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await axios.get('http://localhost:8800/employees');
                setEmployees(res.data);
            } catch (err) {
                setError('Failed to fetch employee details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h1>All Employees</h1>
            <table>
                <thead>
                    <tr>
                        <th>NRIC</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Contact Number</th>
                        <th>Email</th>
                        <th>Role</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map(employee => (
                        <tr key={employee.userid}>
                            <td>{employee.nric}</td>
                            <td>{employee.fname}</td>
                            <td>{employee.lname}</td>
                            <td>{employee.contact}</td>
                            <td>{employee.email}</td>
                            <td>{employee.role}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default EmployeeDetails;
