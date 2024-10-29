//Login.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../auth/AuthContext';

const server = process.env.REACT_APP_SERVER;

function Login() {
  // console.log(server);
  // demo purposes
  const [user, createUser] = useState({
    roleid: null,
    nric: "",
    fname: "",
    lname: "",
    contact: "",
    email: "",
    password: ""
  })

  // uncomment the following lines for proper usage
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const { isLoggedIn, login, logout } = useContext(AuthContext); // Use the context
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${server}login`, { email, password });

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

  // used for demo purposes, remove when done
  const handleUserChange = (e) => {
    createUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${server}createUser`, user)
      // navigate("/")
      window.alert("user added!");
      console.log(user);
    } catch (error) {
      window.alert("Error, please try again");
      console.log(error);
    }
  };


  return (
    <>
      <div className="login-form">
        <h2>{isLoggedIn ? "Welcome Back!" : "Login"}</h2>
        {!isLoggedIn ? (
          <>
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

            <div className="add-form">
              <h1>Sign Up</h1>
              <br />
              <select name="roleid" onChange={handleUserChange} defaultValue="">
                <option disabled selected>Select one</option>
                <option value="1">admin</option>
                <option value="2">manager</option>
                <option value="3">employee</option>
                <option value="4">HR</option>
              </select>

              <ul>
                <li>
                  <input type="text" placeholder='nric' onChange={handleUserChange} name='nric' maxLength={9} />
                </li>
                <li>
                  <input type="text" placeholder='first name' onChange={handleUserChange} name='fname' />
                </li>
                <li>
                  <input type="text" placeholder='last name' onChange={handleUserChange} name='lname' />
                </li>
                <li>
                  <input type="text" placeholder='contact' onChange={handleUserChange} name='contact' maxLength={8} />
                </li>
                <li>
                  <input type="email" placeholder="email" onChange={handleUserChange} name='email' />
                </li>
                <li>
                  <input type="password" placeholder="password" onChange={handleUserChange} name='password' />
                </li>
              </ul>
              <button onClick={handleSignup}>Sign Up</button>
            </div>
          </>

        ) : (
          <button className="formButton" onClick={logout}>Logout</button> // Use the logout function from context
        )}

        {error && <div className="error-message">{error}</div>}
      </div>


    </>

  );
}

export default Login;
