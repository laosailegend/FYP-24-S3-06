import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
import axios from 'axios';

const Admin = () => {
    const { tokenObj } = useContext(AuthContext);
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


    useEffect(() => {
        if (tokenObj === null) {
            return;
        }

        if (!tokenObj || tokenObj.role !== 1) {
            window.alert("You are not authorized to view this page");
            navigate("/", { replace: true });
        }

        const fetchRoles = async () => {
            try {
                const res = await axios.get("http://localhost:8800/roles");
                setRoles(res.data);
            } catch (e) {
                console.log(e);
            }
        };
        const fetchPerms = async () => {
            try {
                const res = await axios.get("http://localhost:8800/permissions");
                setPerms(res.data);
            } catch (e) {
                console.log(e);
            }
        };
        fetchRoles();
        fetchPerms();
    }, [tokenObj, navigate]);

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
            await axios.put(`http://localhost:8800/updatePerms/${permId}`, permToUpdate);
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
            const response = await axios.post(`http://localhost:8800/createPerms`, {
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
            await axios.delete(`http://localhost:8800/deletePerms/${permId}`);
            window.alert('Permission deleted successfully');
            window.location.reload();
        } catch (e) {
            console.log(e);
            window.alert('Failed to delete permission');
        }
    };

    // If tokenObj is still null, don't render the content yet
    if (tokenObj === null) {
        return null;  // You can replace this with a loading indicator if you prefer
    }

    // Render the admin content if authorized
    return (
        <>
            <h1>Admin Content</h1>

            <div className="form">
                <h1>Add New Permission</h1>
                <select name="roleid" onChange={handleChange} defaultValue="">
                    <option disabled value="">Select one</option>
                    {roles.map(role => (
                        <option key={role.roleid} value={role.roleid}>{role.role}</option>
                    ))}
                </select>
                <input type="text" placeholder='Resource' onChange={handleChange} name='resource' />
                <label>
                    Can Create:
                    <input type="checkbox" name="can_create" onChange={handleCheckboxChangeForNewPerm} />
                </label>
                <label>
                    Can Read:
                    <input type="checkbox" name="can_read" onChange={handleCheckboxChangeForNewPerm} />
                </label>
                <label>
                    Can Update:
                    <input type="checkbox" name="can_update" onChange={handleCheckboxChangeForNewPerm} />
                </label>
                <label>
                    Can Delete:
                    <input type="checkbox" name="can_delete" onChange={handleCheckboxChangeForNewPerm} />
                </label>

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
        </>
    );
};

export default Admin;
