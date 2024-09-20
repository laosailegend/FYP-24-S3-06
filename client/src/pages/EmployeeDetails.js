import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EmployeeDetails = () => {
    const tokenObj = localStorage.getItem("token") ? JSON.parse(atob(localStorage.getItem("token").split('.')[1])) : null;
    const navigate = useNavigate();

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // prevents non-admin users from viewing the page
        if (!tokenObj || (tokenObj.role !== 1 && tokenObj.role !== 4)) {
            window.alert("You are not authorized to view this page");
            navigate("/", { replace: true });
            return () => { };
        }
        
        const fetchEmployees = async () => {
            try {
                const res = await axios.get('http://localhost:8800/HRGetUser');
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

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    const filteredEmployees = employees.filter((employee) => {
        const fullName = `${employee.fname} ${employee.lname}`.toLowerCase();
        return (
            employee.nric.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fullName.includes(searchTerm.toLowerCase()) ||
            employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.role.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h1>All Employees</h1>

            {/* Search input */}
            <input
                type="text"
                placeholder="Search by NRIC, name, email, or role"
                value={searchTerm}
                onChange={handleSearch}
                style={{
                    padding: '10px',
                    marginBottom: '20px',
                    width: '300px',
                    fontSize: '16px',
                }}
            />

            <table>
                <thead>
                    <tr>
                        <th>Employee ID</th>
                        <th>NRIC</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Contact Number</th>
                        <th>Email</th>
                        <th>Role</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredEmployees.map((employee) => (
                        <tr key={employee.userid}>
                            <td>{employee.userid}</td> {/* Displaying Employee ID */}
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

            {filteredEmployees.length === 0 && <p>No employees found</p>}
        </div>
    );
};

export default EmployeeDetails;
