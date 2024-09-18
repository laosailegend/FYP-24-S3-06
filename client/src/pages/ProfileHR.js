import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../auth/AuthContext';
import '../style.css';

const ProfileHR = () => {
    const [profile, setProfile] = useState({
        fname: '',
        lname: '',
        email: '',
        contact: '',
        role: ''
    });
    const [error, setError] = useState(null);
    const { tokenObj } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!tokenObj || tokenObj.role !== 4) {
            window.alert("You are not authorized to view this page");
            navigate("/", { replace: true });
            return() => {

            }
        }
    
        if (tokenObj === null) {
            return null;
        }
        
        const fetchProfile = async (userId) => {
            try {
                const res = await axios.get(`http://localhost:8800/profile/${userId}`);
                setProfile(res.data);
            } catch (e) {
                setError("Failed to fetch profile details");
                console.error(e);
            }
        }

        fetchProfile(tokenObj.id);
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
            await axios.put(`http://localhost:8800/profile/${tokenObj.id}`, profile);
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
                    />
                </label>
                <br />
                <label>
                    Role:
                    <input 
                        type="text" 
                        name="role" 
                        value={profile.role} 
                        onChange={handleChange} 
                        readOnly // Optional if role cannot be changed by the user
                    />
                </label>
                <br />
                <button type="submit">Update Profile</button>
            </form>
        </div>
    );
};

export default ProfileHR;
