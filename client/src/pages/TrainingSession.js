import React, { useState, useEffect } from 'react';
import '../style.css';; // Import your CSS for styling

function TrainingSession() {
    const [sessions, setSessions] = useState([]);
    const [skills, setSkills] = useState([]);
    const [skillId, setSkillId] = useState('');
    const [description, setDescription] = useState('');
    const [trainer, setTrainer] = useState('');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [loadingSkills, setLoadingSkills] = useState(true);
    const [loadingSessions, setLoadingSessions] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            await fetchSessions();
            await fetchSkills();
        };
        fetchData();
    }, []);

    // Fetch training sessions
    const fetchSessions = async () => {
        try {
            const response = await fetch('http://localhost:8800/getTraining');
            const data = await response.json();
            setSessions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoadingSessions(false);
        }
    };

    const fetchSkills = async () => {
        try {
            const response = await fetch('http://localhost:8800/getSkills');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setSkills(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch skills:', error);
        } finally {
            setLoadingSkills(false);
        }
    };

    const handleCreateOrUpdateSession = async (e) => {
        e.preventDefault();
        const endpoint = editingSessionId ? `http://localhost:8800/updateTraining/${editingSessionId}` : 'http://localhost:8800/training';
        const method = editingSessionId ? 'PUT' : 'POST';

        try {
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skill_id: skillId,
                    description,
                    trainer,
                    start_date: startDate,
                    start_time: startTime,
                    end_date: endDate,
                    end_time: endTime,
                }),
            });

            const data = await response.json();
            alert(data.message);
            fetchSessions(); 
            resetForm(); 
        } catch (error) {
            console.error('Failed to create/update session:', error);
            alert('Error creating/updating session.');
        }
    };

    const handleDeleteSession = async (id) => {
        try {
            const response = await fetch(`http://localhost:8800/deleteTraining/${id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            alert(data.message);
            fetchSessions();
        } catch (error) {
            console.error('Failed to delete session:', error);
            alert('Error deleting session.');
        }
    };

    const handleEditSession = (session) => {
        setEditingSessionId(session.session_id);
        setSkillId(session.skill_id);
        setDescription(session.description);
        setTrainer(session.trainer);
        const startDateObj = new Date(session.start_date);
        setStartDate(startDateObj.toLocaleDateString('en-CA')); 
        setStartTime(session.start_time); 
        const endDateObj = new Date(session.end_date);
        setEndDate(endDateObj.toLocaleDateString('en-CA'));
        setEndTime(session.end_time);
    };

    const resetForm = () => {
        setEditingSessionId(null);
        setSkillId('');
        setDescription('');
        setTrainer('');
        setStartDate('');
        setStartTime('');
        setEndDate('');
        setEndTime('');
    };

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-CA');
    }

    return (
        <div className="training-session-container">
            <h2>{editingSessionId ? 'Edit Training Session' : 'Create Training Session'}</h2>

            <form onSubmit={handleCreateOrUpdateSession} className="training-session-form">
                <select value={skillId} onChange={(e) => setSkillId(e.target.value)} required>
                    <option value="">Select a Skill</option>
                    {loadingSkills ? (
                        <option value="">Loading skills...</option>
                    ) : Array.isArray(skills) && skills.length > 0 ? (
                        skills.map((skill) => (
                            <option key={skill.skill_id} value={skill.skill_id}>
                                {skill.skill_name}
                            </option>
                        ))
                    ) : (
                        <option value="">No skills available</option>
                    )}
                </select>

                <textarea
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />

                <input
                    type="text"
                    placeholder="Trainer"
                    value={trainer}
                    onChange={(e) => setTrainer(e.target.value)}
                    required
                />

                <div className="date-time-container">
                    <div>
                        <label>Start Date:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />
                        <label>Start Time:</label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label>End Date:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                        />
                        <label>End Time:</label>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <button type="submit" className="submit-button">{editingSessionId ? 'Update Session' : 'Create Session'}</button>
            </form>

            <h2>Training Sessions</h2>
            <ul className="sessions-list">
                {sessions.length > 0 ? (
                    sessions.map((session) => (
                        <li key={session.session_id} className="session-item">
                            <strong>(Skill: {session.skill_name}) </strong> by {session.trainer} 
                            (Start Date: {formatDate(session.start_date)}) (Start Time: {session.start_time})  
                            (End Date: {formatDate(session.end_date)}) (End Time: {session.end_time})
                            <div className="action-buttons">
                                <button onClick={() => handleEditSession(session)} className="edit-button">Edit</button>
                                <button onClick={() => handleDeleteSession(session.session_id)} className="delete-button">Delete</button>
                            </div>
                        </li>
                    ))
                ) : (
                    <li>No training sessions available.</li>
                )}
            </ul>
        </div>
    );
}

export default TrainingSession;
