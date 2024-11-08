import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../style.css';
const server = process.env.REACT_APP_SERVER;

const Profile = () => {
    // to stop http requests from spamming use this usestate to store the token
    const [tokenObj, setTokenObj] = useState(() => {
        const token = localStorage.getItem("token");
        return token ? JSON.parse(atob(token.split('.')[1])) : null;
    });

    // init usestate for fetching data
    const [roles, setRoles] = useState([]);

    const [profile, setProfile] = useState({
        fname: '',
        lname: '',
        email: '',
        contact: '',
        roleid: null,
        password: '',
    });
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchProfile = async (userId) => {
        try {
            const res = await axios.get(`${server}profile/${userId}`);
            setProfile(res.data);
        } catch (e) {
            setError("Failed to fetch profile details");
            console.error(e);
        }
    }

    useEffect(() => {
        if (!tokenObj) {
            window.alert("Invalid");
            navigate("/", { replace: true });
            return () => {
            }
        }

        const fetchData = async () => {
            await fetchProfile(tokenObj.id);
        }

        fetchData();
    }, [tokenObj, navigate]);

    const handleChange = (e) => {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${server}profile`, profile);
            alert("Profile updated successfully!");
        } catch (e) {
            setError("Failed to update profile");
            console.error(e);
        }
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!profile) {
        return <div>Loading...</div>;
    }
    console.log(profile);
    return (
        <div>
            <h2>Edit Profile</h2>
            <form onSubmit={handleSubmit}>
                <label>
                    First Name:
                    <input
                        type="text"
                        name="fname"
                        value={profile.fname}
                        onChange={handleChange}
                    />
                </label>
                <br />
                <label>
                    Last Name:
                    <input
                        type="text"
                        name="lname"
                        value={profile.lname}
                        onChange={handleChange}
                    />
                </label>
                <br />
                <label>
                    Email:
                    <input
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleChange}
                    />
                </label>
                <br />
                <label>
                    Contact:
                    <input
                        type="text"
                        name="contact"
                        value={profile.contact}
                        onChange={handleChange}
                        maxLength={8}
                    />
                </label>
                <br />
                <label>
                    Role:
                    <input disabled
                        type="text"
                        name="role"
                        value={profile.role}
                        onChange={handleChange}
                    />
                </label>
                <br />
                <label>
                    New Password <br/> (min 8 characters, at least 1 letter and 1 number):
                    <input 
                        type="password" 
                        name="password"
                        onChange={handleChange} 
                        pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}"
                    />
                </label>
                <br />
                <button type="submit">Update Profile</button>
            </form>
        </div>
    );
};

export default Profile;
