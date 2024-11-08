import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const server = process.env.REACT_APP_SERVER;

const Home = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const response = await axios.post(`${server}login`, { email, password });

            // If login is successful, store the token and navigate to another page
            if (response.data.token) {
                localStorage.setItem("token", response.data.token); // Store token in localStorage
                window.alert("Login successful");
                navigate("/user"); // Redirect to the dashboard or any protected route
            }
        } catch (error) {
            setError("Invalid email or password");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.alert("You have logged out");
    };

    return (
        <>
            <div className="home-banner">
                <h1>EmpRoster</h1>
            </div>

            <div className="form">
                <input
                    type="text"
                    placeholder="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="main-content">
                <button className="login" onClick={handleLogin}>Login</button>
                <button className="logout" onClick={handleLogout}>Logout</button>
            </div>

        </>
    )
}

export default Home;