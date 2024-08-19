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
            <Link to="/schedule">Schedule</Link>
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
            <Route path="/features" element={<Features />} /> 
            <Route path="/pricing" element={<Pricing />} /> 
            <Route path="/contact" element={<Contact />} /> 
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin/>}/>
            <Route path="/schedule" element={<Schedule />} /> 
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
