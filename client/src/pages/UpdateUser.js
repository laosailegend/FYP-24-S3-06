import React, { useState, useContext, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
const server = process.env.REACT_APP_SERVER;

const UpdateUser = () => {
    // if all else fails try useEffect again
    const [tokenObj, setTokenObj] = useState(() => {
        const token = localStorage.getItem("token");
        return token ? JSON.parse(atob(token.split('.')[1])) : null;
    });

    // init usestates - userInfo is just to load user Info, user is to update user
    const [userInfo, setInfo] = useState([]);
    const [user, setUser] = useState({
        roleid: null,
        nric: "",
        fname: "",
        lname: "",
        contact: "",
        email: "",
        password: ""
    })

    // init usestate for fetching data
    const [roles, setRoles] = useState([]);
    const [positions, setPositions] = useState([]);

    const navigate = useNavigate();
    const location = useLocation();
    console.log(location);
    const userid = location.pathname.split('/')[2]

    const fetchUser = async () => {
        try {
            const response = await axios.get(`${server}profile/${userid}`);
            setInfo(response.data);
        } catch (error) {
            console.log(error);
        }
    }

    // fetch data
    const fetchRoles = async () => {
        try {
            const response = await axios.get(`${server}roles`);
            setRoles(response.data);
            console.log(roles);
        } catch (error) {
            console.log(error);
        }
    };

    const fetchPositions = async () => {
        try {
            const response = await axios.get(`${server}positions`);
            setPositions(response.data);
        } catch (error) {
            console.log(error);
        }
    };

    const handleChange = (e) => {
        setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleClick = async (e) => {
        e.preventDefault()
        const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (userInfo[e.target.name] === e.target.value && userInfo[e.target.name] !== "password") {
            window.alert(`${e.target.placeholder} is the same as the current user's info`);
            return;
        }
        if (!passwordPattern.test(user.password) && user.password !== "") {
            window.alert("Password must be at least 8 characters long and contain both letters and numbers.");
            return;
        }
        try {
            await axios.put(`${server}user/${userid}`, user);
            window.alert("User updated successfully");

            tokenObj.role === 1 ? navigate("/admin") : navigate("/compAdmin");

        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (!tokenObj || (tokenObj.role !== 1 && tokenObj.role !== 5)) {
            window.alert("You are not authorized to view this page");
            navigate("/", { replace: true });
        }

        // If tokenObj is still null, don't render the content yet
        if (tokenObj === null) {
            return null;  // You can replace this with a loading indicator if you prefer
        }
        const fetchData = async () => {
            await fetchUser();
            await fetchRoles();
            await fetchPositions();
        };
        fetchData();
    }, [navigate, tokenObj])

    console.log(userInfo);

    return (
        <div className="update-form">
            <h1>Update user at:</h1>
            <h2>UID {userInfo.userid}, {userInfo.fname} {userInfo.lname}, {userInfo.email}</h2>
            <select name="roleid" onChange={handleChange}>
                <option value="" disabled selected>Select role</option>
                {roles.filter(role => role.roleid !== 1 && role.roleid !== 5).map((role) => (
                    <option key={role.roleid} value={role.roleid}>{role.role}</option>
                ))}
            </select>
            <select name="posid" onChange={handleChange}>
                <option value="" disabled selected>Select position</option>
                {positions.map((position) => (
                    <option key={position.posid} value={position.posid}>{position.position}</option>
                ))}
            </select>
            <input type="text" placeholder='nric' onChange={handleChange} name="nric" maxLength={10} />
            <input type="text" placeholder='first name' onChange={handleChange} name="fname" />
            <input type="text" placeholder='last name' onChange={handleChange} name='lname' />
            <input type="text" placeholder='contact' onChange={handleChange} name='contact' maxLength={8} />
            <input type="email" placeholder='email' onChange={handleChange} name='email' />
            <input type="password"  placeholder="password" onChange={handleChange} name="password" pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}"/>

            <button onClick={handleClick}>Update</button>
        </div>
    )
}

export default UpdateUser;