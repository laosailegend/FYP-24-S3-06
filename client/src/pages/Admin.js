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

    // const tokenObj = localStorage.getItem("token") ? JSON.parse(atob(localStorage.getItem("token").split('.')[1])) : null;
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

    const [user, createUser] = useState({
        roleid: null,
        nric: "",
        fname: "",
        lname: "",
        contact: "",
        email: ""
    })

    const handleUserChange = (e) => {
        createUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

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

    // get user data from db
    const [users, getUsers] = useState([]);

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

    const handleUserDelete = async (id) => {
        try {
            await axios.delete(`${server}user/${id}`);
            window.location.reload();
        } catch (error) {
            console.log(error);
        }
    }

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

    // Render the admin content if authorized
    return (
        <>
            <h1>Admin Content</h1>

            {/* Menu buttons */}
            <div className="menu-buttons">
                <button onClick={() => handleMenuChange('permissions')}>Manage Permissions</button>
                <button onClick={() => handleMenuChange('users')}>Manage Users</button>
            </div>

            {/* Conditionally render Permissions or Users based on selectedMenu */}
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
        </>
    );
};

export default Admin;
