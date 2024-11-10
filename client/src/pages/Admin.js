import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
const server = process.env.REACT_APP_SERVER;

const Admin = () => {
    const [tokenObj, setTokenObj] = useState(() => {
        const token = localStorage.getItem("token");
        return token ? JSON.parse(atob(token.split('.')[1])) : null;
    });

    // console.log(server);
    const [selectedMenu, setSelectedMenu] = useState('users'); // Default to 'permissions'

    // filter stuff
    const [search, setSearch] = useState("");
    const [typingTimeout, setTypingTimeout] = useState(null);
    const [companyFilter, setCompanyFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");

    // Function to toggle menus
    const handleMenuChange = (menu) => {
        setSelectedMenu(menu);
    };
    // console.log(tokenObj);
    const navigate = useNavigate();

    // get roles, company info
    const [roles, setRoles] = useState([]);
    const [company, setCompany] = useState([]);
    const [industry, setIndustry] = useState([]);

    // init company usestate
    const [newCompany, addCompany] = useState({
        company: "",
        address: "",
        contact: "",
        email: "",
        website: "",
        industryid: null,
        size: "",
        statusid: null,
        est_date: ""
    });

    // get user data from db
    const [users, getUsers] = useState([]);

    const [user, createUser] = useState({
        roleid: null,
        nric: "",
        fname: "",
        lname: "",
        contact: "",
        email: "",
        compid: null,
    })

    // get logs from db, and other log related functions for filtering
    const [logs, getLogs] = useState([]);
    const [logLevel, getLogLevel] = useState([]);
    const [logIP, getLogIP] = useState([]);
    const [logUser, getLogUser] = useState([]);
    const [logStatus, getLogStatus] = useState([]);
    const [logReferrer, getLogReferrer] = useState([]);

    // download logs
    const [downloadUrl, setDownloadUrl] = useState(null);

    const handleUserChange = (e) => {
        createUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCompanyChange = (e) => {
        addCompany((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
        const fields = ['roleid', 'nric', 'fname', 'lname', 'contact', 'email', 'password', 'compid']; // List all the keys that must be checked
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
        const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordPattern.test(user.password) && user.password !== "") {
            window.alert("Password must be at least 8 characters long and contain both letters and numbers.");
            return;
        }
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

    const validateCompanyForm = () => {
        // Check each required field
        const fields = ['company', 'address', 'contact', 'email', 'website', 'industryid', 'size', 'statusid', 'est_date']; // List all the keys that must be checked
        for (const field of fields) {
            if (!newCompany[field]) { // Checks if the field is null, undefined, or an empty string
                // debugging
                window.alert(`Please fill in the ${field} field.`);
                return false;
            } else if (newCompany.size <= 0) {
                window.alert(`Please fill in the ${field} field.`);
                return false;
            }
        }
        return true;
    }

    const handleCompanyClick = async (e) => {
        e.preventDefault();
        if (validateCompanyForm()) {
            try {
                await axios.post(`${server}addCompany`, newCompany);
                window.alert("Company added!");
                // navigate("/");
            } catch (error) {
                console.log(error);
                window.alert("Failed to add company!");
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

    const fetchAllUsers = async (filters = {}) => {
        try {
            // const res = await axios.get(`${server}users`)
            const queryString = new URLSearchParams(filters).toString();
            const res = await axios.get(`${server}searchUser?${queryString}`);
            // console.log("QSTRING: ", queryString)
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

            // change the timestamp to UTC+8 with format YYYY-MM-DD HH:MM:SS
            res.data.forEach((log) => {
                const date = new Date(log.timestamp);
                log.timestamp = date.toLocaleString('en-SG', { timeZone: 'Asia/Singapore' });
            });

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

    const fetchCompany = async () => {
        try {
            const res = await axios.get(`${server}company`);
            setCompany(res.data);
        } catch (e) {
            console.log(e);
        }
    }

    const fetchIndustry = async () => {
        try {
            const res = await axios.get(`${server}industry`);
            setIndustry(res.data);
        } catch (e) {
            console.log(e);
        }
    }

    const fetchDownloadUrl = async () => { 
        try {
            const response = await fetch(`${server}logs/latest`);
            
            if (!response.ok) {
                // If response status is not in the 200 range, throw an error
                throw new Error(`Server error: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            setDownloadUrl(data.downloadUrl);
            console.log(downloadUrl);
        } catch (error) {
            console.error('Error fetching download URL:', error);
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
            await fetchLogs();
            await fetchLogsLevel();
            await fetchLogsIPs();
            await fetchLogsUsers();
            await fetchLogsStatus();
            await fetchLogsReferrer();
            await fetchCompany();
            await fetchIndustry();

            // Fetch the latest log download URL
            await fetchDownloadUrl(); // Insert the fetchDownloadUrl here
        };
        fetchData();
        const intervalId = setInterval(fetchDownloadUrl, 30000); // Update every 30 seconds
        // Clean up the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, [navigate, tokenObj, downloadUrl]);

    // Fetch users based on company and role filters

    useEffect(() => {
        const filters = {
            ...(search.trim() && { search: search.trim() }),
            ...(companyFilter && { company: companyFilter }),
            ...(roleFilter && { role: roleFilter }),
        };

        // Debounce search functionality
        if (typingTimeout) clearTimeout(typingTimeout);
        const timeoutId = setTimeout(() => fetchAllUsers(filters), 120);
        setTypingTimeout(timeoutId);

    }, [search, companyFilter, roleFilter]);

    // log filtering functions
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
                <button onClick={() => handleMenuChange('users')}>Manage Users</button>
                <button onClick={() => handleMenuChange('logs')}>Logs</button>
            </div>

            {selectedMenu === 'users' && (
                <>
                    <div className="admin-form">
                        <div className="add-form">
                            <h1>Add new user</h1>
                            <br />
                            <select name="roleid" onChange={handleUserChange} defaultValue="">
                                <option disabled value="">Select role</option>
                                {roles.map(role => (
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
                            <select name="compid" onChange={handleUserChange} defaultValue="" required>
                                <option disabled value="">Select company</option>
                                {company.map(comp => (
                                    <option key={comp.compid} value={comp.compid}>{comp.company}</option>
                                ))}
                            </select>
                            <button onClick={handleClick}>Add</button>
                        </div>

                        {/* fields: company, addr, contact, emaill, website, industry[dynamic], est_size, status[static], est. date*/}
                        <div className="add-form">
                            <h1>Add new company</h1>
                            <br />
                            <ul>
                                <li>
                                    <input type="text" placeholder='company' onChange={handleCompanyChange} name='company' />
                                </li>
                                <li>
                                    <input type="text" placeholder='address' onChange={handleCompanyChange} name='address' />
                                </li>
                                <li>
                                    <input type="text" placeholder='contact' onChange={handleCompanyChange} name='contact' maxLength={8} />
                                </li>
                                <li>
                                    <input type="email" placeholder='email' onChange={handleCompanyChange} name='email' />
                                </li>
                                <li>
                                    <input type="text" placeholder="website" onChange={handleCompanyChange} name='website' />
                                </li>
                                {/* add industry, size, status */}
                                <li>
                                    <select name="industryid" onChange={handleCompanyChange} defaultValue="">
                                        <option disabled value="">Select industry</option>
                                        {industry.map(ind => (
                                            <option key={ind.industryid} value={ind.industryid}>{ind.industry}</option>
                                        ))}
                                    </select>
                                </li>
                                <li>
                                    {/* cannot be negative */}
                                    <li>Estimated size</li>
                                    <input type="number" placeholder="size" onChange={handleCompanyChange} name='size' min={1} />
                                </li>
                                <li>
                                    <select name="statusid" onChange={handleCompanyChange} defaultValue="">
                                        <option disabled value="">Select status</option>
                                        <option value="1">Active</option>
                                        <option value="2">Inactive</option>
                                    </select>
                                </li>
                                <li>
                                    <li>Established date</li>
                                    <input type="date" placeholder="established date" onChange={handleCompanyChange} name='est_date' />
                                </li>
                            </ul>
                            <button onClick={handleCompanyClick}>Add</button>
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
                                    <label htmlFor="filterCompany">Filter by Company:</label>
                                    <select id="filterCompany" onChange={(e) => setCompanyFilter(e.target.value)}>
                                        <option value="" >All Companies</option>
                                        {company.map((comp) => (
                                            <option key={comp.compid} value={comp.compid}>
                                                {comp.company}
                                            </option>
                                        ))}
                                    </select>
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

                            {downloadUrl ? (
                                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                                    Download Logs
                                </a>
                            ) : (
                                <p>No logs available for download</p>
                            )}
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
