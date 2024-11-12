import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import '../style.css'; // Import your CSS for styling
const server = process.env.REACT_APP_SERVER; // Retrieve server URL from environment variables

const TrainingCalendar = ({ userid }) => {
    const [sessions, setSessions] = useState([]);

    // Fetch training sessions from the backend
    const fetchSessions = useCallback(async () => {
        try {
            const response = await fetch(`${server}getAllSessions`);
            const data = await response.json();
            console.log('Fetched sessions:', data); // Log fetched sessions
            setSessions(data || []); // Set sessions directly from fetched data
        } catch (error) {
            console.error('Error fetching training sessions:', error);
        }
    }, []);

    useEffect(() => {
        fetchSessions(); // Fetch sessions on component mount
    }, [fetchSessions]);

    // Handle training completion
    const handleCompleteTraining = async (interest_id) => {
        try {
            const response = await fetch(`${server}postTraining/${interest_id}`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            alert(data.message);
            fetchSessions(); // Refresh sessions to update the calendar after marking complete
        } catch (error) {
            console.error("Error completing training:", error);
            alert("Could not complete training. Try again.");
        }
    };

    // Map each session to an event for the calendar
    const calendarEvents = sessions.map((session) => ({
        id: `${session.session_id}_${session.userid}`,
        title: `Training: ${session.skill_name}`, // Title based on skill name
        user: `User: ${session.fname} ${session.lname}`,
        start: `${session.start_date}`, // Ensure this format is correct
        end: `${session.end_date}`, // Ensure this format is correct
        extendedProps: {
            session_id: session.session_id,
            userid: session.userid,
            status: session.status, // Include status for conditional rendering
            interest_id: session.interest_id, // Pass interest_id here
        },
    }));

    console.log('Calendar Events:', calendarEvents); // Log calendar events for debugging

    return (
        <div>
            <h2>Training Session Calendar</h2>
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={calendarEvents} // Array of event objects
                eventContent={(eventInfo) => (
                    <div style={{ display: 'block', textAlign: 'left' }}>
                        <b>{eventInfo.event.title}</b>
                        <div>{eventInfo.event.extendedProps.user}</div> {/* Displaying the user name */}
                        {/* Conditionally render the Complete button */}
                        {eventInfo.event.extendedProps.status !== 'completed' && (
                            <button
                                style={{
                                    marginLeft: '5px',
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                }}
                                onClick={() => handleCompleteTraining(eventInfo.event.extendedProps.interest_id)} // Use interest_id here
                            >
                                Complete
                            </button>
                        )}
                    </div>
                )}
            />
        </div>
    );
};

export default TrainingCalendar;
