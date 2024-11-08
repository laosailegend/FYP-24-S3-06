import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import '../style.css';

// EMPLOYEE
function Availability() {
  const tokenObj = localStorage.getItem("token") ? JSON.parse(atob(localStorage.getItem("token").split('.')[1])) : null;
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date());  
  const [availabilityList, setAvailabilityList] = useState([]);
  const [filteredAvailability, setFilteredAvailability] = useState([]); // Filtered availability for selected date
  const [tasks, setTasks] = useState([]); // State to store tasks

  useEffect(() => {
    if (!tokenObj || (tokenObj.role !== 1 && tokenObj.role !== 3)) {
      window.alert("You are not authorized to view this page");
      navigate("/", { replace: true });
      return () => {};
    }

    if (tokenObj === null) {
      return null;
    }

    // Fetch availability data from the backend
    fetchAvailability();

    // Fetch tasks data
    fetch('http://localhost:8800/tasks')  // Adjust the URL if necessary
      .then((res) => res.json())
      .then((data) => {
        console.log('Fetched tasks:', data);
        setTasks(data); // Set tasks list
      })
      .catch((err) => {
        console.error('Error fetching tasks:', err);
      });
  }, []);

  // Fetch availability data from the backend
  const fetchAvailability = () => {
    fetch('http://localhost:8800/getAvailable')
      .then((res) => res.json())
      .then((data) => {
        console.log('Fetched availability:', data);
        setAvailabilityList(data); // Set availability list
        filterAvailability(data, date); // Filter availability for the selected date
      })
      .catch((err) => {
        console.error('Error fetching availability data:', err);
      });
  };

  // Filter availability when a new date is selected
  const onChange = (newDate) => {
    setDate(newDate);
    filterAvailability(availabilityList, newDate);
  };

  // Filter availability based on selected date
  const filterAvailability = (availabilityList, selectedDate) => {
    const filtered = availabilityList.filter((item) =>
      moment(item.available_date).isSame(selectedDate, 'day')
    );
    setFilteredAvailability(filtered); // Set filtered availability for selected date
  };

  // Convert date to dd/mm/yyyy format for display
  const formatDate = (date) => moment(date).format('DD/MM/YYYY');

  // Filter tasks for the selected date
  const getTasksForDate = (date) => {
    const filteredTasks = tasks.filter((task) => moment(task.timeslot).isSame(date, 'day'));
    return filteredTasks;
  };

  // Handle status change
  const handleStatusChange = (availability_id, newStatus) => {
    const userid = tokenObj.id; // Get the user ID from the token
  
    fetch(`http://localhost:8800/updateAvailability/${availability_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: newStatus,
        userid, // Pass the userid along with the status update
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data.message);
        // Re-fetch the availability list after updating status
        fetchAvailability();
      })
      .catch((err) => {
        console.error('Error updating availability status and userid:', err);
      });
  };

  return (
    <div className="availability-container">
      <h2>Select a Date to View Availability</h2>
      <Calendar onChange={onChange} value={date} />

      <div className="availability-details">
        <h3>Availability for {formatDate(date)}</h3>

        <div className="availability-list">
          {filteredAvailability.length === 0 ? (
            <p>No availability data for this date.</p>
          ) : (
            <ul>
              {filteredAvailability.map((item, index) => (
                <li key={index}>
                  <strong>Date:</strong> {moment(item.available_date).format('DD/MM/YYYY')} <br />
                  <strong>Start Time:</strong> {moment(item.start_time, 'HH:mm:ss').format('hh:mm A')} <br />
                  <strong>End Time:</strong> {moment(item.end_time, 'HH:mm:ss').format('hh:mm A')} <br />
                  
                  {/* Display the current status */}
                  <strong>Status:</strong> {item.status === 'pending' ? 'Pending' : item.status === 'available' ? 'Available' : 'Unavailable'}
                  
                  {/* Buttons to change the status */}
                  <div>
                    <button
                      type="button"
                      className={`status-button ${item.status === 'available' ? 'active' : ''}`}
                      onClick={() => handleStatusChange(item.availability_id, 'available')}
                    >
                      Available
                    </button>
                    
                  </div>
                  <br />
                  <strong>Assigned To:</strong> {item.fname} {item.lname}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="tasks-list">
          <h3>Tasks for {formatDate(date)}</h3>
          <ul>
            {getTasksForDate(date).map((task, index) => (
              <li key={index}>
                <strong>Job Scope:</strong> {task.taskname} <br /> 
                <strong>Description:</strong> {task.description} <br /> 
                <strong>Manpower Required:</strong> {task.manpower_required} 
              </li> 
            ))} 
          </ul> 
        </div> 
      </div> 
    </div>
  );
}

export default Availability;
