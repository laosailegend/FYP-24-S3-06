import React, { useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateUser = () => {
    const [user, createUser] = useState({
        roleid: null,
        nric: "",
        fname: "",
        lname: "",
        contact: "",
        email: ""
    })

    // const navigate = useNavigate();

    const handleChange = (e) => {
        createUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleClick = async (e) => {
        e.preventDefault()
        try {
            await axios.post("http://localhost:8800/createUser", user)
            // navigate("/")
            window.alert("user added!");
        } catch (error) {
            console.log(error);
        }
    };
    console.log(user);

    // get user data from db
    const [users, getUsers] = useState([]);

    useEffect(()=> {
        const fetchAllUsers = async() => {
            try {
                const res = await axios.get("http://localhost:8800/users")
                getUsers(res.data);
                console.log(res.data);
            } catch (e) {
                console.log(e);
            }
        }
        fetchAllUsers();
    }, []);

    return (
        <>
            <div className="form">
                <h1>add new user</h1>
                <select name="roleid" onChange={handleChange}>
                    <option value="1">admin</option>
                    <option value="2">manager</option>
                    <option value="3">employee</option>
                    <option value="4">HR</option>
                </select>
                <input type="text" placeholder='nric' onChange={handleChange} name='nric' maxLength={9} />
                <input type="text" placeholder='first name' onChange={handleChange} name='fname' />
                <input type="text" placeholder='last name' onChange={handleChange} name='lname' />
                <input type="text" placeholder='contact' onChange={handleChange} name='contact' maxLength={8} />
                <input type="email" placeholder="email" onChange={handleChange} name='email' />

                <button onClick={handleClick}>add</button>
            </div>

            <div className="user-list">
                <h1>user list</h1>
                <div className="users">
                    {users.map(user => (
                        <div className="book" key={user.userid}>
                            <h2>{user.fname} {user.lname}</h2>
                            <p>{user.role}</p>
                            <p>{user.nric}</p>
                            <p>{user.email}</p>
                            <p>{user.contact}</p>
                            {/* <button className="delete" onClick={() => handleDelete(user.id)}>delete</button> */}
                            {/* <button className="update"><Link to={`/update/${user.id}`}>update</Link></button> */}
                        </div>
                    ))}
                </div>
                {/* <button><Link to="/add">add new book</Link></button> */}
            </div>
        </>

    )
}

export default CreateUser;