import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const UpdateUser = () => {
    const [user, setUser] = useState({
        roleid: null,
        nric: "",
        fname: "",
        lname: "",
        contact: "",
        email: "",
        password: ""
    })

    // const navigate = useNavigate();
    const location = useLocation();
    console.log(location);
    const userid = location.pathname.split('/')[2]
    console.log("user id: " + userid)

    const handleChange = (e) => {
        setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleClick = async (e) => {
        e.preventDefault()
        try {
            await axios.put(`http://localhost:8800/user/${userid}`, user)
            window.alert("User updated successfully");
            // navigate("/")
        } catch (error) {
            console.log(error);
        }
    };
    console.log(user);
    return (
        <div className="form">
            <h1>update user</h1>
            <select name="roleid" onChange={handleChange}>
                <option value="" disabled selected>Select one</option>
                <option value="1">admin</option>
                <option value="2">manager</option>
                <option value="3">employee</option>
                <option value="4">HR</option>
            </select>
            <input type="text" placeholder='nric' onChange={handleChange} name="nric" maxLength={10} />
            <input type="text" placeholder='first name' onChange={handleChange} name="fname" />
            <input type="text" placeholder='last name' onChange={handleChange} name='lname' />
            <input type="text" placeholder='contact' onChange={handleChange} name='contact' maxLength={8}/>
            <input type="email" placeholder='email' onChange={handleChange} name='email' />
            <input type="password" placeholder='password' onChange={handleChange} name='password'/>

            <button onClick={handleClick}>update</button>
        </div>
    )
}

export default UpdateUser;