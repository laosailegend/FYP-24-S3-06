<<<<<<< HEAD
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import './style.css';
import Login from './Login';
import Features from './Features'; // Import the Features component
import Contact from './Contact'; // Import the Contact component
import TimeOffRequest from './TimeOffRequest'; // Import the Contact component
import Availability from './Availability'; // Import the Availability component
import Tasks from './Tasks'; // Import the Tasks component
import Payroll from './Payroll'; // Import the Payroll component
import Pricing from './Pricing'; // Import the Pricing component
import Schedule from './Schedule'; // Import the Schedule component
import scheduleImage from './Schedule.png'; // Schedule Image


import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import './style.css';
import Login from './pages/Login';
import Features from './pages/Features'; // Import the Features component
import Contact from './pages/Contact'; // Import the Contact component
import Pricing from './pages/Pricing'; // Import the Pricing component
import scheduleImage from './images/Schedule.png'; // Schedule Image
import { AuthContext } from './auth/AuthContext';

import Admin from './pages/Admin';
import Schedule from './pages/Schedule'; // Import the Schedule component
>>>>>>> b39d72f3930b78a1bea31562dcdd5e32870d0452

function Home() {
  return (
    <>
      <section className="intro">
<<<<<<< HEAD
      <h2 style={{ color: '#006eff93',fontSize: '3em', fontWeight: 'bold' }}>Smart Employee Roster</h2>
=======
        <h2 style={{ color: '#006eff93', fontSize: '3em', fontWeight: 'bold' }}>Smart Employee Roster</h2>
>>>>>>> b39d72f3930b78a1bea31562dcdd5e32870d0452
        <p>Streamline Your Scheduling with Our Smart Employee Roster System</p>
        <blockquote>
          "Smart, efficient, and hassle-free roster management for modern businesses”
        </blockquote>
        <img src={scheduleImage} alt="Schedule" /> {/* Use the imported image */}
      </section>
      <section className="testimonials">
<<<<<<< HEAD
      <h2 style={{ color: '#006eff93',fontSize: '2em', fontWeight: 'bold' }}>Testimonials</h2>
=======
        <h2 style={{ color: '#006eff93', fontSize: '2em', fontWeight: 'bold' }}>Testimonials</h2>
>>>>>>> b39d72f3930b78a1bea31562dcdd5e32870d0452
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
<<<<<<< HEAD
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (status) => {
    setIsLoggedIn(status);
  };

  return (
    <Router>
      <div className="App">
=======
  const { isLoggedIn, logout, tokenObj } = useContext(AuthContext);
  
  return (
    <Router>
      <div className="App">
        {isLoggedIn ? (
          <span>Welcome, {tokenObj.fname} {tokenObj.lname}!</span>
        ) : (
          <></>
        )}
>>>>>>> b39d72f3930b78a1bea31562dcdd5e32870d0452
        <header>
          <div className="logo">
            <h1>EmpRoster</h1>
          </div>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/features">Features</Link> {/* Add Feautres link */}
            <Link to="/pricing">Pricing</Link> {/* Add Pricing link */}
            <Link to="/contact">Contact</Link> {/* Add Contact link */}
<<<<<<< HEAD
            <Link to="/Availability">Availability(Employee)</Link> {/* Add Features link */}
            <Link to="/Tasks">Tasks(Manager)</Link> {/* Add Features link */}
            <Link to="/Payroll">Payroll(HR)</Link> {/* Add Payroll link */}
            <Link to="/schedule">Create Schedule(Manager)</Link> {/* Add Schedule link */}
            <Link to="/TimeOffRequest">Request Time Off(Employee)</Link> {/* Add Request time off link */}
            <Link to="/login" className="login">Login</Link> {/* Add Login link */}
=======
            <Link to="/schedule">Schedule</Link>
            {isLoggedIn ? (
              <button className="logout" onClick={logout}>Logout</button>
            ) : (
              <Link to="/login" className="login">Login</Link>
            )}
>>>>>>> b39d72f3930b78a1bea31562dcdd5e32870d0452
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
<<<<<<< HEAD
            <Route path="/features" element={<Features />} /> {/* Add Features route */}
            <Route path="/pricing" element={<Pricing />} /> {/* Add Pricing route */}
            <Route path="/contact" element={<Contact />} /> {/* Add Contact route */}
            <Route path="/Tasks" element={<Tasks />} /> {/* Add Contact route */}
            <Route path="/Payroll" element={<Payroll />} /> {/* Add Payroll route */}
            <Route path="/Availability" element={<Availability />} /> {/* Add Availability route */}
            <Route path="/schedule" element={<Schedule />} /> {/* Add Schedule route */}
            <Route path="/TimeOffRequest" element={<TimeOffRequest />} /> {/* Add Request Time Off route */}
            <Route path="/login" element={<Login onLogin={handleLogin} />} /> {/* Add Login route */}
=======
            <Route path="/features" element={<Features />} /> 
            <Route path="/pricing" element={<Pricing />} /> 
            <Route path="/contact" element={<Contact />} /> 
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin/>}/>
            <Route path="/schedule" element={<Schedule />} /> 
>>>>>>> b39d72f3930b78a1bea31562dcdd5e32870d0452
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
