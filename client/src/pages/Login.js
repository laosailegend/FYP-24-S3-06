//Login.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../auth/AuthContext';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { isLoggedIn, login, logout } = useContext(AuthContext); // Use the context
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:8800/login", { email, password });

      // If login is successful, store the token and navigate to another page
      if (response.data.token) {
        login(response.data.token); // Call the login function from context
        window.alert("Login successful");
        navigate("/"); // Redirect to the dashboard or any protected route
      }
    } catch (error) {
      setError("Invalid email or password");
    }
  };

  return (
    <>
      <div className="login-form">
        <h2>{isLoggedIn ? "Welcome Back!" : "Login"}</h2>
        {!isLoggedIn ? (
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="formButton" type="submit">Login</button>
          </form>
        ) : (
          <button className="formButton" onClick={logout}>Logout</button> // Use the logout function from context
        )}

        {error && <div className="error-message">{error}</div>}
      </div>
    </>

  );
}

export default Login;
