import React from 'react'
import {useEffect} from 'react'
import {useState} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom';

const Add = () => {
    const [user,setUser] = useState({
        roleid:"",
        nric:"",
        fname:"",
        lname:"",
        contact:"",
        email:""
    });

    const navigate = useNavigate()

    const handleChange = (e) =>{
        setUser(prev=>({...prev, [e.target.name]: e.target.value}))
    };

    const handleClick = async e => {
        e.preventDefault()
        try{
            await axios.post("http://localhost:8800/users", user)
            navigate("/")
        }catch(err){
            console.log(err)
        }
    }

    console.log(user)

    return (
        <div className='form'>
            <h1>Particulars</h1>
            <input type="text" placeholder='roleid' onChange={handleChange} name="roleid" />
            <input type="text" placeholder='nric' onChange={handleChange} name="nric" />
            <input type="text" placeholder='first name' onChange={handleChange} name="fname" />
            <input type="text" placeholder='last name' onChange={handleChange} name="lname" />
            <input type="text" placeholder='contact number' onChange={handleChange} name="contact" />
            <input type="text" placeholder='email' onChange={handleChange} name="email" />
            <button className="formButton" onClick={handleClick}>Add</button>
        </div>
    )
}

export default Add
