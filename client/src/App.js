import React, { useState, useContext } from 'react';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import './style.css';
import Login from './pages/Login';
import Features from './pages/Features'; // Import the Features component
import Contact from './pages/Contact'; // Import the Contact component
import TimeOffRequest from './pages/TimeOffRequest'; // Import the Contact component
import Availability from './pages/Availability'; // Import the Availability component
import Tasks from './pages/Tasks'; // Import the Tasks component
import Payroll from './pages/Payroll'; // Import the Payroll component
import Pricing from './pages/Pricing'; // Import the Pricing component
import Schedule from './pages/Schedule'; // Import the Schedule component
import scheduleImage from './images/Schedule.png'; // Schedule Image
import Admin from './pages/Admin'; // Import the Admin component
import UpdateUser from './pages/UpdateUser'; // Import the UpdateUser component
import TimeOff from './pages/TimeOff';
import AvailabilityForm from './pages/AvailabilityForm';
import EmployeeDetails from './pages/EmployeeDetails';
import ProfileHR from './pages/ProfileHR';

import { AuthContext } from './auth/AuthContext';

function Home() {
  return (
    <>
      <section className="intro">
        <h2 style={{ color: '#006eff93', fontSize: '3em', fontWeight: 'bold' }}>Smart Employee Roster</h2>
        <p>Streamline Your Scheduling with Our Smart Employee Roster System</p>
        <blockquote>
          "Smart, efficient, and hassle-free roster management for modern businesses”
        </blockquote>
        <img src={scheduleImage} alt="Schedule" /> {/* Use the imported image */}
      </section>
      <section className="testimonials">
        <h2 style={{ color: '#006eff93', fontSize: '2em', fontWeight: 'bold' }}>Testimonials</h2>
        <p>Customer Reviews: Discover how our solution has transformed their scheduling.</p>
        <div className="review">
          <div className="stars">★★★★★</div>
          <p>
            “A Game-Changer for Our Business!”<br />
            <p>
              “We’ve been using this smart employee roster system for the past six months,
              and it’s truly transformed the way we handle scheduling. The automated scheduling feature is incredibly intuitive and has drastically reduced the time we used to spend creating rosters.”
            </p> <br />
            — Jordan M., Operations Manager
          </p>
        </div>
        <div className="review">
          <div className="stars">★★★★★</div>
          <p>
            “Fantastic Scheduling Tool!”<br />
            <p>
              “This app has made scheduling so much easier and more efficient. Automated rosters, real-time updates, and seamless integration with our payroll system have been game-changers.
              Highly recommend it for any business!”
            </p> <br />
            — Ethan, HR Manager
          </p>
        </div>
      </section>
    </>
  );
}

function App() {
  const { isLoggedIn, logout, tokenObj } = useContext(AuthContext);

  return (
    <Router>
      <div className="App">
        {isLoggedIn ? (
          <span>Welcome, {tokenObj.fname} {tokenObj.lname}!</span>
        ) : (
          <></>
        )}
        <header>
          <div className="logo">
            <h1>EmpRoster</h1>
          </div>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/features">Features</Link> {/* Add Feautres link */}
            <Link to="/pricing">Pricing</Link> {/* Add Pricing link */}
            <Link to="/contact">Contact</Link> {/* Add Contact link */}
            <Link to="/profile/:id">Profile(HR)</Link>

            {/* only admin can see */}
            {isLoggedIn && tokenObj.role === 1 ? (
              <>
                <Link to="/admin">Admin Menu</Link>
                <Link to="/Tasks">Tasks(Manager)</Link>
                <Link to="/Availability">Availability(Employee)</Link>
                <Link to="/TimeOffRequest">Request Time Off(Employee)</Link>
                <Link to="/Payroll">Payroll(HR)</Link> {/* Add Payroll link */}
                <Link to="/schedule">Create Schedule(HR)</Link> {/* Add Schedule link */}
                <Link to="/timeoff">TimeOff(HR)</Link>
                <Link to="/available">Availability(HR)</Link>
                <Link to="/employees">View Employees(HR)</Link>
              </>
            ) : (
              <></>
            )}

            {/* only manager can see */}
            {isLoggedIn && tokenObj.role === 2 ? (
              <Link to="/Tasks">Tasks(Manager)</Link>
            ) : (
              <></>
            )}

            {/* only employee can see */}
            {isLoggedIn && tokenObj.role === 3 ? (
              <>
                <Link to="/Availability">Availability(Employee)</Link>
                <Link to="/TimeOffRequest">Request Time Off(Employee)</Link>
              </>
            ) : (
              <></>
            )}

            {/* only HR can see */}
            {isLoggedIn && tokenObj.role === 4 ? (
              <>
                <Link to="/Payroll">Payroll(HR)</Link> {/* Add Payroll link */}
                <Link to="/schedule">Create Schedule(HR)</Link> {/* Add Schedule link */}
                <Link to="/timeoff">TimeOff(HR)</Link>
                <Link to="/available">Availability(HR)</Link>
                <Link to="/employees">View Employees(HR)</Link>
              </>
            ) : (
              <></>
            )}

            {isLoggedIn ? (
              <button className="logout" onClick={logout}>Logout</button>
            ) : (
              <Link to="/login" className="login">Login</Link>
            )}
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} /> {/* Add Features route */}
            <Route path="/pricing" element={<Pricing />} /> {/* Add Pricing route */}
            <Route path="/contact" element={<Contact />} /> {/* Add Contact route */}
            <Route path="/Tasks" element={<Tasks />} /> {/* Add Contact route */}
            <Route path="/Payroll" element={<Payroll />} /> {/* Add Payroll route */}
            <Route path="/Availability" element={<Availability />} /> {/* Add Availability route */}
            <Route path="/schedule" element={<Schedule />} /> {/* Add Schedule route */}
            <Route path="/TimeOffRequest" element={<TimeOffRequest />} /> {/* Add Request Time Off route */}
            <Route path="/timeoff" element={<TimeOff />} />
            <Route path="/available" element={<AvailabilityForm />} />
            <Route path="/employees" element={<EmployeeDetails />} />
            <Route path="/profile/:id" element={<ProfileHR />} />
            {/* <Route path="/login" element={<Login onLogin={handleLogin} />} /> Add Login route */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
            <Route path='/update/:id' element={<UpdateUser />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
