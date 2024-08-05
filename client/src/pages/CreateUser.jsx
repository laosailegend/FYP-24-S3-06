import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
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

    const navigate = useNavigate();

    const handleChange = (e) => {
        createUser((prev) => ({...prev, [e.target.name]: e.target.value }));
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
    return (
        <div className="form">
            <h1>add new user</h1>
            <select name="roleid" onChange={handleChange}>
                <option value="1">admin</option>
                <option value="2">manager</option>
                <option value="3">employee</option>
                <option value="4">HR</option>
            </select>
            <input type="text" placeholder='nric' onChange={handleChange} name='nric' maxLength={9}/>
            <input type="text" placeholder='first name' onChange={handleChange} name='fname'/>
            <input type="text" placeholder='last name' onChange={handleChange} name='lname'/>
            <input type="text" placeholder='contact' onChange={handleChange} name='contact' maxLength={8}/>
            <input type="email" placeholder="email" onChange={handleChange} name='email'/>

            <button onClick={handleClick}>add</button>
        </div>
    )
}

export default CreateUser;