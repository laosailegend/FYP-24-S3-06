import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom';

const server = process.env.REACT_APP_SERVER;

const HR = () => {
    const [users, setUsers] = useState([])

    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                const res = await axios.get(`${server}users`)
                const hrUsers = res.data.filter(user => user.roleid == 4);
                setUsers(hrUsers);
            } catch (err) {
                console.log(err)
            }
        }
        fetchAllUsers();
    }, []);

    const handleDelete = async (userid) => {
        try {
            await axios.delete(`${server}users/` + userid)
            window.location.reload()
        } catch (err) {
            console.log(err)
        }
    }

    return <div>
        <h1>Personal Particulars</h1>
        <div className="users">
            {users.map(user => (
                <div className="user" key={user.userid}>
                    <p><strong>NRIC:</strong> {user.nric}</p>
                    <p><strong>First Name:</strong> {user.fname}</p>
                    <p><strong>Last Name:</strong> {user.lname}</p>
                    <p><strong>Contact Number:</strong> {user.contact}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <button className="delete" onClick={() => handleDelete(user.userid)}>Delete</button>
                    <button className="update"><Link to={`/update/${user.userid}`}>Update</Link></button>
                </div>
            ))}
        </div>
        <button>
            <Link to="/add">Add User</Link>
        </button>
    </div>;
};

export default HR
