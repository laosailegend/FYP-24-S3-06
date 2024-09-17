import React from 'react'
import {useEffect} from 'react'
import {useState} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

const Update = () => {
    const [user,setUser] = useState({
        nric:"",
        fname:"",
        lname:"",
        contact:"",
        email:""
    });

    const navigate = useNavigate()
    const location = useLocation()
    const userId = location.pathname.split("/")[2]

    // Fetch the current user details 
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(`http://localhost:8800/users/${userId}`);
                setUser(res.data); 
            } catch (err) {
                console.log(err);
            }
        };
        fetchUser();
    }, [userId]);

    const handleChange = (e) =>{
        setUser(prev=>({...prev, [e.target.name]: e.target.value}))
    };

    const handleClick = async e => {
        e.preventDefault();
    
        // Check if any field is empty
        if (!user.nric || !user.fname || !user.lname || !user.contact || !user.email) {
            alert("All fields must be filled before updating");
            return;
        }
    
        try {
            await axios.put(`http://localhost:8800/users/${userId}`, user);
            navigate("/");
        } catch (err) {
            console.log(err);
        }
    }

    console.log(user)

    return (
        <div className='form'>
            <h1>Update the user</h1>
            <input
                type="text"
                placeholder='nric'
                onChange={handleChange}
                name="nric"
                value={user.nric} // Pre-fill the input with current nric
            />
            <input
                type="text"
                placeholder='fname'
                onChange={handleChange}
                name="fname"
                value={user.fname} // Pre-fill the input with current fname
            />
            <input
                type="text"
                placeholder='lname'
                onChange={handleChange}
                name="lname"
                value={user.lname} // Pre-fill the input with current lname
            />
            <input
                type="text"
                placeholder='contact'
                onChange={handleChange}
                name="contact"
                value={user.contact} // Pre-fill the input with current contact
            />
            <input
                type="text"
                placeholder='email'
                onChange={handleChange}
                name="email"
                value={user.email} // Pre-fill the input with current email
            />
            <button className="formButton" onClick={handleClick}>Update</button>
        </div>
    )
}

export default Update
