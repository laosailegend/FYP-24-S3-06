import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import './style.css';
import Login from './pages/Login';
import Features from './pages/Features'; // Import the Features component
import Contact from './pages/Contact'; // Import the Contact component
import TimeOffRequest from './pages/TimeOffRequest'; // Import the Contact component
import Tasks from './pages/Tasks'; // Import the Tasks component
import Payroll from './pages/Payroll'; // Import the Payroll component
import Pricing from './pages/Pricing'; // Import the Pricing component
import Schedule from './pages/Schedule'; // Import the Schedule component
import scheduleImage from './images/Schedule.png'; // Schedule Image
import Admin from './pages/Admin'; // Import the Admin component
import CompAdmin from './pages/CompAdmin';
import UpdateUser from './pages/UpdateUser'; // Import the UpdateUser component
import TimeOff from './pages/TimeOff';
import EmployeeDetails from './pages/EmployeeDetails';
import WeeklyHours from './pages/WeeklyHours';
import TrainingSession from './pages/TrainingSession';
import TrainingCalendar from './pages/TrainingCalendar';
import FeedbackList from './pages/FeedbackList';
import ReviewShiftSwapping from './pages/ReviewShiftSwapping';
import PayrollQueriesPage from './pages/PayrollQueriesPage';
import Profile from './pages/Profile';
import CompAdmin from './pages/CompAdmin';
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
  const { isLoggedIn, logout, tokenObj, tokenExp } = useContext(AuthContext);

  return (
    <Router>
      <div className="App">
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
              <>
                <Link to="/admin">Admin Menu</Link>
                <Link to="/compAdmin">Company Menu</Link>
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
              <>
                <Link to="/Tasks">Tasks(Manager)</Link>
                <Link to="/timeoff">TimeOff(HR)</Link>
              </>
            ) : (
              <></>
            )}

            {/* only employee can see */}
            {isLoggedIn && tokenObj.role === 3 ? (
              <>
                <Link to="/Project">Project</Link>
                {/*<Link to="/Availability">Availability(Employee)</Link>*/}
                <Link to="/ClockInOut">Clock In/Clock Out</Link>
                <Link to="/Shiftswapping">Shift Swapping</Link>
                <Link to="/Skill">Skill</Link>
                <Link to="/TrainingSession">Training session</Link>
                <Link to="/TimeOffRequest">Request Time Off</Link>
                <Link to="/Leave">Leave Balance</Link>
                <Link to="/ViewPayroll">Payroll</Link>
                <Link to="/Feedback">Feedback</Link>
                
              </>
            ) : (
              <></>
            )}

            {/* only HR can see */}
            {isLoggedIn && tokenObj.role === 4 ? (
              <>
                <Link to="/Payroll">Payroll</Link> {/* Add Payroll link */}
                <Link to="/PayrollQueriesPage">Payroll Queries</Link>  {/* Add Payroll Queries link */}
                <Link to="/employees">View Employees</Link>  {/* Add Employee link */}
                <Link to="/weeklyhours">Employee Tracker</Link>  {/* Add WeeklyHours link */}
                <Link to="/TrainingSession">Training</Link>  {/* Add TrainingSession link */}
                <Link to= "/TrainingCalendar">Training Calendar</Link> {/* Add Training Calendar link */}
                <Link to="/ReviewShiftSwapping">Review shift swap</Link>  {/* Add Review Shif Swap link */}
                <Link to= "/feedback">Feedback</Link> {/* Add Feedback link */}
              </>
            ) : (
              <></>
            )}

            {/* only compadmin can see */}
            {isLoggedIn && tokenObj.role === 5 ? (
              <>
                <Link to="/compAdmin">Company Menu</Link>
              </>
            ) : (
              <></>
            )}

            {isLoggedIn ? (
              <>
                <Link to="/profile">Profile</Link>
                <button className="logout" onClick={logout}>Logout</button>
              </>

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
            <Route path="/PayrollQueriesPage"element={<PayrollQueriesPage />} />  {/* Add Payroll Queries route */}
            <Route path="/weeklyhours" element={<WeeklyHours />} /> {/* Add WeeklyHours route*/} 
            <Route path="/weeklyhours" element={<WeeklyHours />} /> {/* Add WeeklyHours route*/} 
            <Route path="/TrainingSession" element={<TrainingSession />} /> {/* Add TrainingSession route*/}
            <Route path="/TrainingCalendar" element={<TrainingCalendar />} /> {/* Add Training Calendar route*/}
            <Route path="/feedback" element={<FeedbackList/>} /> {/* Add FeedbackList route*/}
            <Route path="/schedule" element={<Schedule />} /> {/* Add Schedule route */}
            <Route path="/TimeOffRequest" element={<TimeOffRequest />} /> {/* Add Request Time Off route */}
            <Route path="/timeoff" element={<TimeOff />} />
            <Route path="/employees" element={<EmployeeDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/ReviewShiftSwapping" element={<ReviewShiftSwapping />} />
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
            
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
