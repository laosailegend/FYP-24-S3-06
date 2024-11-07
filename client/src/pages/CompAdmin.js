import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
const server = process.env.REACT_APP_SERVER;


const CompAdmin = () => {
    const [tokenObj, setTokenObj] = useState(() => {
        const token = localStorage.getItem("token");
        return token ? JSON.parse(atob(token.split('.')[1])) : null;
    });

    const navigate = useNavigate();

    // filter stuff
    const [search, setSearch] = useState("");
    const [typingTimeout, setTypingTimeout] = useState(null);
    const [roleFilter, setRoleFilter] = useState("");

    const [roles, setRoles] = useState([]);
    const [users, getUsers] = useState([]);
    const [user, createUser] = useState({
        roleid: null,
        nric: "",
        fname: "",
        lname: "",
        contact: "",
        email: "",
        compid: tokenObj ? tokenObj.company : null,
    });

    const handleUserChange = (e) => {
        createUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        console.log(user);
    };

    const handleUserDelete = async (id) => {
        try {
            await axios.delete(`${server}user/${id}`);
            window.location.reload();
        } catch (error) {
            console.log(error);
        }
    };

    const validateForm = () => {
        const fields = ['roleid', 'nric', 'fname', 'lname', 'contact', 'email', 'password'];
        for (const field of fields) {
            if (!user[field]) {
                return false;
            }
        }
        return true;
    };

    const handleClick = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                await axios.post(`${server}createUser`, user);
                window.alert("User added!");
            } catch (error) {
                console.log(error);
                window.alert("Failed to add user!");
            }
        } else {
            window.alert("Please fill all the fields.");
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await axios.get(`${server}roles`);
            setRoles(res.data);
        } catch (e) {
            console.log(e);
        }
    };

    const fetchCompUsers = async (filters = {}) => {
        try {
            const queryString = new URLSearchParams(filters).toString();
            const res = await axios.get(`${server}searchCompUser?${queryString}`);
            // const res = await axios.get(`${server}compUsers`);
            getUsers(res.data);
        } catch (e) {
            console.log(e);
        }
    };

    console.log(users)
    useEffect(() => {
        if (!tokenObj || (tokenObj.role !== 5 && tokenObj.role !== 1)) {
            window.alert("You are not authorized to view this page");
            navigate("/", { replace: true });
            return () => { };
        }

        if (tokenObj === null) {
            return null;
        }

        const fetchData = async () => {
            await fetchCompUsers();
            await fetchRoles();
        };

        fetchData();

    }, [navigate, tokenObj]);

    useEffect(() => {
        const filters = {
            ...(search.trim() && { search: search.trim() }),
            ...(roleFilter && { role: roleFilter }),
        };

        // Debounce search functionality
        if (typingTimeout) clearTimeout(typingTimeout);
        const timeoutId = setTimeout(() => fetchCompUsers(filters), 120);
        setTypingTimeout(timeoutId);

    }, [search, roleFilter]);

    return (
        <>
            <h1>Company Management</h1>
            <div className="admin-form">
                <div className="add-form">
                    <h1>Add new user</h1>
                    <br />
                    <select name="roleid" onChange={handleUserChange} defaultValue="" required>
                        <option disabled value="">Select role</option>
                        {roles.filter(role => role.roleid !== 1).map(role => (
                            <option key={role.roleid} value={role.roleid}>{role.role}</option>
                        ))}
                    </select>
                    <br />
                    <ul>
                        <li>
                            <input type="text" placeholder='nric' onChange={handleUserChange} name='nric' maxLength={9} required />
                        </li>
                        <li>
                            <input type="text" placeholder='first name' onChange={handleUserChange} name='fname' required />
                        </li>
                        <li>
                            <input type="text" placeholder='last name' onChange={handleUserChange} name='lname' required />
                        </li>
                        <li>
                            <input type="text" placeholder='contact' onChange={handleUserChange} name='contact' maxLength={8} required />
                        </li>
                        <li>
                            <input type="email" placeholder="email" onChange={handleUserChange} name='email' required />
                        </li>
                        <li>
                            <input type="password" placeholder="password" onChange={handleUserChange} name='password' required />
                        </li>
                    </ul>

                    <button onClick={handleClick}>Add</button>
                </div>
            </div>
            <div className="">
                <h1>User List</h1>
                <div className="user-list">
                    <div className="filter-container">
                        {/* filters by company, role*/}
                        <div className="filter-item">
                            <label htmlFor="search">Search Users:</label>
                            <input
                                type="text"
                                id="search-user"
                                placeholder="Search users..."
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="filter-item">
                            <label htmlFor="filterRole">Filter by Role:</label>
                            <select id="filterRole" onChange={(e) => setRoleFilter(e.target.value)}>
                                <option value="">All Roles</option>
                                {roles.map((role) => (
                                    <option key={role.roleid} value={role.roleid}>
                                        {role.role}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>User ID</th>
                                <th>NRIC</th>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Company</th>
                                <th>Role</th>
                                <th>Position</th>
                                <th>Email</th>
                                <th>Contact</th>
                                <th>Password</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.userid}>
                                    <td>{user.userid}</td>
                                    <td>{user.nric}</td>
                                    <td>{user.fname}</td>
                                    <td>{user.lname}</td>
                                    <td>{user.company}</td>
                                    <td>{user.role}</td>
                                    <td>{user.position}</td>
                                    <td>{user.email}</td>
                                    <td>{user.contact}</td>
                                    <td>{user.password}</td>
                                    <td>
                                        <button className="update">
                                            <Link to={`/update/${user.userid}`}>Update</Link>
                                        </button>
                                        <button className="delete" onClick={() => handleUserDelete(user.userid)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default CompAdmin;