import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
const server = process.env.REACT_APP_SERVER;

const Admin = () => {
    // console.log(server);
    const [selectedMenu, setSelectedMenu] = useState('permissions'); // Default to 'permissions'

    // Function to toggle menus
    const handleMenuChange = (menu) => {
        setSelectedMenu(menu);
    };

    const [tokenObj, setTokenObj] = useState(() => {
        const token = localStorage.getItem("token");
        return token ? JSON.parse(atob(token.split('.')[1])) : null;
    });
    // console.log(tokenObj);
    const navigate = useNavigate();

    const [roles, setRoles] = useState([]);
    const [newPerm, setNewPerm] = useState({
        roleid: '',
        resource: '',
        can_create: 0,
        can_read: 0,
        can_update: 0,
        can_delete: 0
    });

    const [perms, setPerms] = useState([]); // Initialize perms as an empty array

    const [user, createUser] = useState({
        roleid: null,
        nric: "",
        fname: "",
        lname: "",
        contact: "",
        email: ""
    })

    // get user data from db
    const [users, getUsers] = useState([]);

    // get logs from db, and other log related functions for filtering
    const [logs, getLogs] = useState([]);
    const [logLevel, getLogLevel] = useState([]);
    const [logIP, getLogIP] = useState([]);
    const [logUser, getLogUser] = useState([]);
    const [logStatus, getLogStatus] = useState([]);
    const [logReferrer, getLogReferrer] = useState([]);

    const handleChange = (e) => {
        setNewPerm((prev) => {
            const updatedPerm = { ...prev, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value };

            return updatedPerm;
        });
    };

    const handleCheckboxChangeForNewPerm = (e) => {
        setNewPerm((prev) => ({
            ...prev,
            [e.target.name]: e.target.checked ? 1 : 0, // Ensure value is 0 if unchecked
        }));
    };

    const handleUserChange = (e) => {
        createUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleUserDelete = async (id) => {
        try {
            await axios.delete(`${server}user/${id}`);
            window.location.reload();
        } catch (error) {
            console.log(error);
        }
    }

    const validateForm = () => {
        // Check each required field
        const fields = ['roleid', 'nric', 'fname', 'lname', 'contact', 'email', 'password']; // List all the keys that must be checked
        for (const field of fields) {
            if (!user[field]) { // Checks if the field is null, undefined, or an empty string
                // debugging
                // window.alert(`Please fill in the ${field} field.`);
                return false;
            }
        }
        return true;
    }

    const handleClick = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                await axios.post(`${server}createUser`, user);
                window.alert("User added!");
                // navigate("/");
            } catch (error) {
                console.log(error);
                window.alert("Failed to add user!");
            }
        } else {
            window.alert("Please fill all the fields.");
        }
    };

    // fetching data functions
    const fetchRoles = async () => {
        try {
            const res = await axios.get(`${server}roles`);
            setRoles(res.data);
        } catch (e) {
            console.log(e);
        }
    };
    const fetchPerms = async () => {
        try {
            const res = await axios.get(`${server}permissions`);
            setPerms(res.data);
        } catch (e) {
            console.log(e);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const res = await axios.get(`${server}users`)
            getUsers(res.data);
        } catch (e) {
            console.log(e);
        }
    }

    const fetchLogs = async (filters = {}) => {
        try {
            // Create a query string from the filters
            const queryString = new URLSearchParams(filters).toString();
            const res = await axios.get(`${server}logs?${queryString}`);
            getLogs(res.data);
        } catch (e) {
            console.log(e);
        }
    };

    // fetch level, IP, user, request, status, referer, user agent, timestamp
    const fetchLogsLevel = async () => {
        try {
            const res = await axios.get(`${server}logsLevel`);
            getLogLevel(res.data);
        } catch (e) {
            console.log(e);
        }
    };

    const fetchLogsIPs = async () => {
        try {
            const res = await axios.get(`${server}logsIP`);
            getLogIP(res.data);
        } catch (e) {
            console.log(e);
        }
    };

    const fetchLogsUsers = async () => {
        try {
            const res = await axios.get(`${server}logsUser`);
            getLogUser(res.data);
        } catch (e) {
            console.log(e);
        }
    };

    const fetchLogsStatus = async () => {
        try {
            const res = await axios.get(`${server}logsStatus`);
            getLogStatus(res.data);
        } catch (e) {
            console.log(e);
        }
    };

    const fetchLogsReferrer = async () => {
        try {
            const res = await axios.get(`${server}logsReferrer`);
            getLogReferrer(res.data);
        } catch (e) {
            console.log(e);
        }
    };

    useEffect(() => {
        // prevents non-admin users from viewing the page
        if (!tokenObj || tokenObj.role !== 1) {
            window.alert("You are not authorized to view this page");
            navigate("/", { replace: true });
            return () => { };
        }

        // If tokenObj is still null, don't render the content yet
        if (tokenObj === null) {
            return null;  // You can replace this with a loading indicator if you prefer
        }

        const fetchData = async () => {
            await fetchAllUsers();
            await fetchRoles();
            await fetchPerms();
            await fetchLogs();
            await fetchLogsLevel();
            await fetchLogsIPs();
            await fetchLogsUsers();
            await fetchLogsStatus();
            await fetchLogsReferrer();
        };
        fetchData();

    }, [navigate, tokenObj]);

    // Handle checkbox change
    const handleCheckboxChange = (permId, permissionType) => {
        setPerms(perms.map(perm =>
            perm.permission_id === permId ?
                { ...perm, [permissionType]: perm[permissionType] ? 0 : 1 } : perm
        ));
    };

    // Function to submit the updated permissions
    const handleSave = async (permId) => {
        const permToUpdate = perms.find(perm => perm.permission_id === permId);
        try {
            await axios.put(`${server}updatePerms/${permId}`, permToUpdate);
            window.alert('Permission updated successfully');
        } catch (e) {
            console.log(e);
            window.alert('Failed to update permission');
        }
    };

    // Function to create a new permission
    const handleCreate = async () => {
        const { roleid, resource, can_create, can_read, can_update, can_delete } = newPerm;

        // Check if at least one checkbox is checked
        if (!can_create && !can_read && !can_update && !can_delete) {
            return window.alert('Please select at least one permission.');
        }

        // Check if required fields are filled
        if (!roleid || !resource) {
            return window.alert('Please fill out all fields.');
        }

        // Debugging: Log the newPerm object before submission
        console.log('Creating permission with:', {
            roleid,
            resource,
            can_create,
            can_read,
            can_update,
            can_delete,
        });

        try {
            const response = await axios.post(`${server}createPerms`, {
                roleid,
                resource,
                can_create: can_create ? 1 : 0,
                can_read: can_read ? 1 : 0,
                can_update: can_update ? 1 : 0,
                can_delete: can_delete ? 1 : 0,
            });

            // Debugging: Log the response from the backend
            console.log('Response from server:', response.data);

            window.alert('Permission created successfully');
        } catch (e) {
            // Debugging: Log the error if the request fails
            console.log('Error creating permission:', e);

            window.alert('Failed to create permission');
        }
    };

    // Function to delete a permission
    const handleDelete = async (permId) => {
        try {
            await axios.delete(`${server}deletePerms/${permId}`);
            window.alert('Permission deleted successfully');
            window.location.reload();
        } catch (e) {
            console.log(e);
            window.alert('Failed to delete permission');
        }
    };

    // log filtering functions
    // Log filtering function
    const applyFilters = async () => {
        // Get values from input fields
        const searchTerm = document.getElementById('search').value.trim().toLowerCase();
        const levelFilter = document.getElementById('filterLevel').value;
        const ipFilter = document.getElementById('filterIP').value;
        const userFilter = document.getElementById('filterUser').value;
        const requestFilter = document.getElementById('filterRequest').value;
        const statusFilter = document.getElementById('filterStatus').value;
        const sizeFilter = document.getElementById('filterSize').value;
        const referrerFilter = document.getElementById('filterReferrer').value;
        const startDate = document.getElementById("startDate").value;
        const startTime = document.getElementById("startTime").value;
        const endDate = document.getElementById("endDate").value;
        const endTime = document.getElementById("endTime").value;

        // Combine date and time based on availability
        const startTimestamp = startDate ? `${startDate}T${startTime || "00:00:00"}` : null;
        const endTimestamp = endDate ? `${endDate}T${endTime || "23:59:59"}` : null;

        console.log('Start Timestamp:', startTimestamp);
        console.log('End Timestamp:', endTimestamp);

        // Build the query parameters object
        const params = {
            ...(searchTerm && { search: searchTerm }),
            ...(levelFilter && { level: levelFilter }),
            ...(ipFilter && { ip: ipFilter }),
            ...(userFilter && { user: userFilter }),
            ...(requestFilter && { request: requestFilter }),
            ...(statusFilter && { status: statusFilter }),
            ...(sizeFilter && { size: sizeFilter }),
            ...(referrerFilter && { referrer: referrerFilter }),
            ...(startTimestamp && { startTime: startTimestamp }),
            ...(endTimestamp && { endTime: endTimestamp }),
        };

        // Fetch logs with applied filters
        await fetchLogs(params);
    };



    // Render the admin content if authorized
    return (
        <>
            <h1>Admin Content</h1>

            {/* Menu buttons */}
            <div className="menu-buttons">
                <button onClick={() => handleMenuChange('permissions')}>Manage Permissions</button>
                <button onClick={() => handleMenuChange('users')}>Manage Users</button>
                <button onClick={() => handleMenuChange('logs')}>Logs</button>
            </div>

            {/* Conditionally render Permissions or Users or logs based on selectedMenu */}
            {selectedMenu === 'permissions' && (
                <div className="admin-form">
                    <div className="add-form">
                        <h1>Add New Permission</h1>
                        <select name="roleid" onChange={handleChange} defaultValue="">
                            <option disabled value="">Select one</option>
                            {roles.map(role => (
                                <option key={role.roleid} value={role.roleid}>{role.role}</option>
                            ))}
                        </select>
                        <input type="text" placeholder='Resource' onChange={handleChange} name='resource' />
                        <ul>
                            <li>
                                <label>
                                    Can Create:
                                    <input type="checkbox" name="can_create" onChange={handleCheckboxChangeForNewPerm} />
                                </label>
                            </li>
                            <li>
                                <label>
                                    Can Read:
                                    <input type="checkbox" name="can_read" onChange={handleCheckboxChangeForNewPerm} />
                                </label>
                            </li>
                            <li>
                                <label>
                                    Can Update:
                                    <input type="checkbox" name="can_update" onChange={handleCheckboxChangeForNewPerm} />
                                </label>
                            </li>
                            <li>
                                <label>
                                    Can Delete:
                                    <input type="checkbox" name="can_delete" onChange={handleCheckboxChangeForNewPerm} />
                                </label>
                            </li>
                        </ul>
                        <button onClick={handleCreate}>Add</button>
                    </div>

                    <div className="perms-list">
                        {perms.map(perm => (
                            <div className="perm-card" key={perm.permission_id}>
                                <h2>Perm ID: {perm.permission_id}</h2>
                                <p>Given to: {perm.role}</p>
                                <p>Affects: {perm.resource}</p>
                                <h3>Permissions</h3>
                                <ul>
                                    <li>
                                        Can create:
                                        <input
                                            type="checkbox"
                                            checked={perm.can_create === 1}
                                            onChange={() => handleCheckboxChange(perm.permission_id, 'can_create')}
                                        />
                                    </li>
                                    <li>
                                        Can read:
                                        <input
                                            type="checkbox"
                                            checked={perm.can_read === 1}
                                            onChange={() => handleCheckboxChange(perm.permission_id, 'can_read')}
                                        />
                                    </li>
                                    <li>
                                        Can update:
                                        <input
                                            type="checkbox"
                                            checked={perm.can_update === 1}
                                            onChange={() => handleCheckboxChange(perm.permission_id, 'can_update')}
                                        />
                                    </li>
                                    <li>
                                        Can delete:
                                        <input
                                            type="checkbox"
                                            checked={perm.can_delete === 1}
                                            onChange={() => handleCheckboxChange(perm.permission_id, 'can_delete')}
                                        />
                                    </li>
                                </ul>
                                <button onClick={() => handleSave(perm.permission_id)}>Save Changes</button>
                                <button onClick={() => handleDelete(perm.permission_id)}>Delete</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedMenu === 'users' && (
                <>
                    <div className="add-form">
                        <h1>Add new user</h1>
                        <br />
                        <select name="roleid" onChange={handleUserChange} defaultValue="">
                            <option disabled value="">Select one</option>
                            {roles.map(role => (
                                <option key={role.roleid} value={role.roleid}>{role.role}</option>
                            ))}
                        </select>
                        <ul>
                            <li>
                                <input type="text" placeholder='nric' onChange={handleUserChange} name='nric' maxLength={9} />
                            </li>
                            <li>
                                <input type="text" placeholder='first name' onChange={handleUserChange} name='fname' />
                            </li>
                            <li>
                                <input type="text" placeholder='last name' onChange={handleUserChange} name='lname' />
                            </li>
                            <li>
                                <input type="text" placeholder='contact' onChange={handleUserChange} name='contact' maxLength={8} />
                            </li>
                            <li>
                                <input type="email" placeholder="email" onChange={handleUserChange} name='email' />
                            </li>
                            <li>
                                <input type="password" placeholder="password" onChange={handleUserChange} name='password' />
                            </li>
                        </ul>
                        <button onClick={handleClick}>Add</button>
                    </div>
                    <div className="">
                        <h1>User List</h1>
                        <div className="user-list">
                            {/* style this into an actual list form later on */}
                            {users.map(user => (
                                <div className="user-card" key={user.userid}>
                                    <ul>
                                        <li><h2>First Name: {user.fname}</h2></li>
                                        <li><h2>Last Name: {user.lname}</h2></li>
                                        <li><p><b>Role: </b>{user.role}</p></li>
                                        <li><p><b>NRIC:</b> {user.nric}</p></li>
                                        <li><p><b>Email:</b> {user.email}</p></li>
                                        <li><p><b>Contact:</b> {user.contact}</p></li>
                                        <li><p><b>Password:</b> {user.password}</p></li>
                                    </ul>
                                    <button className="update"><Link to={`/update/${user.userid}`}>update</Link></button>
                                    <button className="delete" onClick={() => handleUserDelete(user.userid)}>delete</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {selectedMenu === 'logs' && (
                <>
                    <div>
                        <h1>Logs</h1>
                        {/* <!-- Search and Filter Section --> */}
                        <div className="filter-container">
                            {/* <!-- Search Bar --> */}
                            <div className="filter-item">
                                <label for="search">Search Logs:</label>
                                <input type="text" id="search" placeholder="Search logs..." />
                            </div>

                            {/* <!-- Filter by Level --> */}
                            <div className="filter-item">
                                <label for="filterLevel">Filter by Level:</label>
                                <select id="filterLevel">
                                    <option value="">All Levels</option>
                                    {logLevel.map((level) => (
                                        <option key={level.level} value={level.level}>
                                            {level.level}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* <!-- Filter by IP --> */}
                            <div className="filter-item">
                                <label for="filterIP">Filter by IP:</label>
                                <select id="filterIP">
                                    <option value="">All IPs</option>
                                    {logIP.map((ip) => (
                                        <option key={ip.address} value={ip.address}>
                                            {ip.address}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* <!-- Filter by User --> */}
                            <div className="filter-item">
                                <label for="filterUser">Filter by User:</label>
                                <select id="filterUser">
                                    <option value="">All Users</option>
                                    {logUser.map((user) => (
                                        <option key={user.user} value={user.user}>
                                            {user.user}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* <!-- Filter by Request --> */}
                            <div className="filter-item">
                                <label for="filterRequest">Filter by Request:</label>
                                <select id="filterRequest">
                                    <option value="">All Requests</option>
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                    <option value="PATCH">PATCH</option>
                                    <option value="DELETE">DELETE</option>
                                </select>
                            </div>

                            {/* <!-- Filter by Status --> */}
                            <div className="filter-item">
                                <label for="filterStatus">Filter by Status:</label>
                                <select id="filterStatus">
                                    <option value="">All Statuses</option>
                                    {logStatus.map((status) => (
                                        <option key={status.status} value={status.status}>
                                            {status.status}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Filter by size range */}
                            <div className="filter-item">
                                <label for="filterSize">Filter by Size:</label>
                                <select id="filterSize">
                                    <option value="">All Sizes</option>
                                    <option value="0-100">0-100</option>
                                    <option value="101-500">101-500</option>
                                    <option value="501-1000">501-1000</option>
                                    <option value="1001-5000">1001-5000</option>
                                    <option value="5001-10000">5001-10000</option>
                                </select>
                            </div>

                            {/* Filter by referrer */}
                            <div className="filter-item">
                                <label for="filterReferrer">Filter by Referrer:</label>
                                <select id="filterReferrer">
                                    <option value="">All Referrers</option>
                                    {logReferrer.map((referrer) => (
                                        <option key={referrer.referrer} value={referrer.referrer}>
                                            {referrer.referrer}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Filter by timestamp range */}
                            <div class="filter-item">
                                <label for="startDate">Start Date:</label>
                                <input type="date" id="startDate" name="startDate" />
                            </div>
                            <div class="filter-item">
                                <label for="startTime">Start Time:</label>
                                <input type="time" id="startTime" name="startTime" />
                            </div>
                            <div class="filter-item">
                                <label for="endDate">End Date:</label>
                                <input type="date" id="endDate" name="endDate" />
                            </div>
                            <div class="filter-item">
                                <label for="endTime">End Time:</label>
                                <input type="time" id="endTime" name="endTime" />
                            </div>


                            {/* <!-- Apply Filters Button --> */}
                            <button onClick={() => applyFilters()} className="filter-button">Apply Filters</button>
                        </div>

                        {/* <!-- Logs Table --> */}
                        <table className="logs-table">
                            <thead>
                                <tr>
                                    <th>Log ID</th>
                                    <th>Level</th>
                                    <th>Message</th>
                                    <th>Address</th>
                                    <th>User</th>
                                    <th>Request</th>
                                    <th>Status</th>
                                    <th>Size</th>
                                    <th>Referrer</th>
                                    <th>User Agent</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody id="logsTableBody">
                                {logs && logs.length > 0 ? (
                                    logs.map((log) => (
                                        <tr key={log.logid}>
                                            <td>{log.logid}</td>
                                            <td>{log.level}</td>
                                            <td>{log.message}</td>
                                            <td>{log.address}</td>
                                            <td>{log.user}</td>
                                            <td>{log.request}</td>
                                            <td>{log.status}</td>
                                            <td>{log.size}</td>
                                            <td>{log.referrer}</td>
                                            <td>{log.user_agent}</td>
                                            <td>{log.timestamp}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="11" style={{ textAlign: "center", padding: "8px" }}>
                                            No logs available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

        </>
    );
};

export default Admin;
