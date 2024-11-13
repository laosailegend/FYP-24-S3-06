import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import './style.css';
import Login from './pages/Login';
import Features from './pages/Features'; // Import the Features component
import Contact from './pages/Contact'; // Import the Contact component
import TimeOffRequest from './pages/TimeOffRequest'; // Import the Contact component
import Tasks from './pages/Tasks'; // Import the Tasks component
import Payroll from './pages/Payroll'; // Import the Payroll component
import Pricing from './pages/Pricing'; // Import the Pricing component
import scheduleImage from './images/Schedule.png'; // Schedule Image
import Admin from './pages/Admin'; // Import the Admin component
import CompAdmin from './pages/CompAdmin';
import UpdateUser from './pages/UpdateUser'; // Import the UpdateUser component
import TimeOff from './pages/TimeOff';
import loginImage from './images/Login.png';
import EmployeeDetails from './pages/EmployeeDetails';
import Profile from './pages/Profile';
import ClockInOut from './pages/ClockInOut';
import Skill from './pages/Skill';
import TrainingSession from './pages/TrainingSession';
import Feedback from './pages/Feedback';
import Project from './pages/Project';
import Shiftswapping from './pages/Shiftswapping';
import Leave from './pages/Leave';
import ViewPayroll from './pages/ViewPayroll';
import WeeklyHours from './pages/WeeklyHours';
import EmployeeTrainingSession from './pages/EmployeeTrainingSession';
import PayrollQueriesPage from './pages/PayrollQueriesPage';
import ReviewShiftSwapping from './pages/ReviewShiftSwapping';
import TrainingCalendar from './pages/TrainingCalendar';
import FeedbackList from './pages/FeedbackList';
import Assignments from './pages/Assignments';

import { AuthContext } from './auth/AuthContext';
function Home() {
  return (
    <>
      <section className="intro">
        <h2 style={{ color: '#006eff93', fontSize: '3em', fontWeight: 'bold', font: 'Oswald' }}>Smart Employee Roster</h2>
        <p>Streamline Your Scheduling with Our Smart Employee Roster System</p>
        <blockquote>
          "Smart, efficient, and hassle-free roster management for modern businesses”
        </blockquote>
        <img src={scheduleImage} alt="Schedule" /> {/* Use the imported image */}
      </section>
      <section className="testimonials">
        <h2 style={{ color: '#006eff93', fontSize: '2em', fontWeight: 'bold', font: 'Oswald' }}>Testimonials</h2>
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
  const { isLoggedIn, logout, tokenObj, tokenExp } = useContext(AuthContext);

  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => setDarkMode(prevMode => !prevMode);

  return (
    <Router>
      <div className={`App ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        {/* probably should paste tokenexp after every click on the page */}
        {
          useEffect(() => {
            tokenExp();
          }, [tokenExp])
        }

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

            {/* only admin can see */}
            {isLoggedIn && tokenObj.role === 1 ? (
              <div className="dropdown">
                <button className="dropbtn">Admin</button>
                <div className="dropdown-content">

                  <Link to="/admin">Admin Menu</Link>
                  <Link to="/compAdmin">Company Menu</Link>
                  <Link to="/Tasks">Tasks</Link>
                  <Link to="/TimeOffRequest">Request Time Off</Link>
                  <Link to="/Payroll">Payroll</Link> {/* Add Payroll link */}
                  <Link to="/timeoff">TimeOff</Link>
                  <Link to="/employees">View Employees</Link>
                </div>
              </div>
            ) : (
              <></>
            )}

            {/* Dropdown for Manager functions */}
            {isLoggedIn && tokenObj.role === 2 ? (
              <div className="dropdown">
                <button className="dropbtn">Manager</button>
                <div className="dropdown-content">
                  <Link to="/Tasks">Tasks</Link>
                  <Link to="/timeoff">TimeOff</Link>
                  <Link to="/Assignments">Assignments</Link>
                </div>
              </div>
            ) : (
              <></>
            )}

            {/* Dropdown for Employee functions */}
            {isLoggedIn && tokenObj.role === 3 ? (
              <div className="dropdown">
                <button className="dropbtn">Employee</button>
                <div className="dropdown-content">
                  <Link to="/Project">Project</Link>
                  <Link to="/ClockInOut">Clock In/Clock Out</Link>
                  <Link to="/Shiftswapping">Shift Swapping</Link>
                  <Link to="/TimeOffRequest">Request Time Off</Link>
                  <Link to="/Leave">Leave Balance</Link>
                  <Link to="/ViewPayroll">Payroll</Link>
                  <Link to="/Feedback">Feedback</Link>
                  <Link to="/EmployeeTrainingSession">Employee Training</Link>
                </div>
              </div>
            ) : (
              <></>
            )}

            {/* Dropdown for HR functions */}
            {isLoggedIn && tokenObj.role === 4 ? (
              <div className="dropdown">
                <button className="dropbtn">HR</button>
                <div className="dropdown-content">
                  <Link to="/Payroll">Payroll(HR)</Link> {/* Add Payroll link */}
                  <Link to="/PayrollQueriesPage">Payroll Queries</Link>  {/* Add Payroll Queries link */}
                  <Link to="/employees">View Employees(HR)</Link>
                  <Link to="/weeklyhours">Employee Tracker</Link>
                  <Link to="/TrainingSession">Training</Link>  {/* Add TrainingSession link */}
                  <Link to="/TrainingCalendar">Training Calendar</Link> {/* Add Training Calendar link */}
                  <Link to="/ReviewShiftSwapping">Review shift swap</Link>  {/* Add Review Shif Swap link */}
                  <Link to="/FeedbackList">Feedback List</Link> {/* Add Feedback link */}
                  <Link to="/Project">Project</Link>
                </div>
              </div>
            ) : (
              <></>
            )}

            {/* Dropdown for compadmin functions */}
            {isLoggedIn && tokenObj.role === 5 ? (
              <div className="dropdown">
                <button className="dropbtn">Company Admin</button>
                <div className="dropdown-content">
                  <Link to="/compAdmin">Company Menu</Link>
                </div>
              </div>
            ) : (
              <></>
            )}

            {isLoggedIn ? (
              <>
                <Link to="/profile">Profile</Link>
                <button className="logout" onClick={logout}>Logout</button>
              </>

            ) : (
              <Link to="/login" className="login" style={{ display: 'flex', alignItems: 'center' }}>
                Login
                <img
                  src={loginImage}
                  alt="Login"
                  style={{ width: '20px', height: '20px', marginLeft: '15px' }}
                />
              </Link>
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
            <Route path="/weeklyhours" element={<WeeklyHours />} /> {/* Add WeeklyHours route*/}
            <Route path="/TimeOffRequest" element={<TimeOffRequest />} /> {/* Add Request Time Off route */}
            <Route path="/timeoff" element={<TimeOff />} />
            <Route path="/employees" element={<EmployeeDetails />} />
            <Route path="/profile" element={<Profile />} />
            {/* <Route path="/login" element={<Login onLogin={handleLogin} />} /> Add Login route */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
            <Route path='/compAdmin' element={<CompAdmin />} />
            <Route path='/update/:id' element={<UpdateUser />} />
            <Route path="/ClockInOut" element={<ClockInOut />} />
            <Route path="/Skill" element={<Skill />} />
            <Route path="/TrainingSession" element={<TrainingSession />} />
            <Route path="/Feedback" element={<Feedback />} />
            <Route path="/Project" element={<Project />} />
            <Route path="/Shiftswapping" element={<Shiftswapping />} />
            <Route path="/ViewPayroll" element={<ViewPayroll />} />
            <Route path="/Leave" element={<Leave />} />
            <Route path="/EmployeeTrainingSession" element={<EmployeeTrainingSession />} />
            <Route path="/PayrollQueriesPage" element={<PayrollQueriesPage />} />
            <Route path="/ReviewShiftSwapping" element={<ReviewShiftSwapping />} />
            <Route path="/TrainingCalendar" element={<TrainingCalendar />} />
            <Route path="/FeedbackList" element={<FeedbackList />} />
            <Route path="/Assignments" element={<Assignments/>} />
          </Routes>
          <div className="theme-toggle-container">
            <button onClick={toggleTheme} className="theme-toggle">
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
