import React, { useState, useEffect } from 'react';
import '../style.css';

function TrainingSession() {
  const tokenObj = localStorage.getItem("token") ? JSON.parse(atob(localStorage.getItem("token").split('.')[1])) : null;
  const userId = tokenObj ? tokenObj.id : null;
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [interest, setInterest] = useState({});

  const server=process.env.REACT_APP_SERVER;
  // Fetch training session data
  useEffect(() => {
    const fetchTrainingSessions = async () => {
      try {
        const response = await fetch(`${server}trainingSessions`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setTrainingSessions(data.training_sessions);

        // Fetch interest status for this user
        const interestResponse = await fetch(`${server}trainingSessions/interest/${userId}`);
        if (!interestResponse.ok) throw new Error(`HTTP error! Status: ${interestResponse.status}`);
        const interestData = await interestResponse.json();
        
        // Convert interest array to an object for easy lookup
        const interestObject = {};
        interestData.interestedSessions.forEach(sessionId => {
          interestObject[sessionId] = true;
        });
        setInterest(interestObject);
      } catch (error) {
        console.error('Error fetching training sessions or interest:', error);
      }
    };

    if (userId) fetchTrainingSessions();
  }, [userId]);

  const handleInterest = async (sessionId) => {
    try {
      const response = await fetch(`${server}expressInterest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, session_id: sessionId }),
      });
      if (!response.ok) throw new Error(`Error expressing interest: ${response.status}`);

      setInterest(prev => ({ ...prev, [sessionId]: true }));
    } catch (error) {
      console.error('Error expressing interest:', error);
    }
  };

  return (
    <div className="training-session-container">
      <h2>Available Training Sessions</h2>

      {trainingSessions.length > 0 ? (
        <div className="sessions-list">
          {trainingSessions.map((session) => (
            <div key={session.session_id} className="session-card">
              <div className="session-header">
                <h3>{session.description}</h3>
              </div>
              <div className="session-details">
                <p><strong>Trainer:</strong> {session.trainer}</p>
                <p><strong>Start Date:</strong> {new Date(session.start_date).toLocaleDateString()}</p>
                <p><strong>Start Time:</strong> {session.start_time}</p>
                <p><strong>End Date:</strong> {new Date(session.end_date).toLocaleDateString()}</p>
                <p><strong>End Time:</strong> {session.end_time}</p>
              </div>
              <div className="session-footer">
                {interest[session.session_id] ? (
                  <p className="interest-confirmation">You have expressed interest in this session.</p>
                ) : (
                  <button onClick={() => handleInterest(session.session_id)} className="interest-button">
                    Express Interest
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No training sessions available.</p>
      )}
    </div>
  );
}

export default TrainingSession;
