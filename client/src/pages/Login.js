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

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // Ensure all fields are filled
      if (!credentials.nric || !credentials.fname || !credentials.lname || !credentials.contact || !credentials.email || !credentials.password) {
        setError("All fields are required for signup");
        return;
      }
      await axios.post(`${server}createUser`, credentials);
      window.alert("User added!");
    } catch (error) {
      setError("Error creating user, please try again");
    }
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

          <div className="add-form">
            <h1>Sign Up</h1>
            <br />
            <select name="roleid" onChange={handleChange} defaultValue="">
              <option disabled>Select one</option>
              <option value="1">admin</option>
              <option value="2">manager</option>
              <option value="3">employee</option>
              <option value="4">HR</option>
            </select>

            <ul>
              <li>
                <input type="text" placeholder='nric' onChange={handleChange} name='nric' maxLength={9} />
              </li>
              <li>
                <input type="text" placeholder='first name' onChange={handleChange} name='fname' />
              </li>
              <li>
                <input type="text" placeholder='last name' onChange={handleChange} name='lname' />
              </li>
              <li>
                <input type="text" placeholder='contact' onChange={handleChange} name='contact' maxLength={8} />
              </li>
              <li>
                <input type="email" placeholder="email" onChange={handleChange} name='email' />
              </li>
              <li>
                <input type="password" placeholder="password" onChange={handleChange} name='password' />
              </li>
            </ul>
            <button onClick={handleSignup}>Sign Up</button>
          </div>
        </>
      ) : (
        <button className="formButton" onClick={logout}>Logout</button>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default Login;
