import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../auth/AuthContext';

const server = process.env.REACT_APP_SERVER;

function Login() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const { isLoggedIn, login, logout } = useContext(AuthContext); // Use the context
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    try {
      const response = await axios.post(`${server}login`, credentials);

      // If login is successful, store the token and navigate to another page
      if (response.data.token) {
        login(response.data.token); // Call the login function from context
        window.alert("Login successful");
        navigate("/"); // Redirect to the dashboard or any protected route
      }
    } catch (error) {
      setError("Invalid email or password");
      window.alert("Invalid email or password");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="login-form">
      <h2>{isLoggedIn ? "Welcome Back!" : "Login"}</h2>
      {!isLoggedIn ? (
        <>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={credentials.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={credentials.password}
              onChange={handleChange}
              required
            />
            <button className="formButton" type="submit">Login</button>
          </form>
        </>
      ) : (
        <button className="formButton" onClick={logout}>Logout</button>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default Login;
