import React, { useState, useEffect } from 'react';
import '../style.css';

function Skill() {
  // Get the user's ID from the token in localStorage
  const tokenObj = localStorage.getItem("token") 
    ? JSON.parse(atob(localStorage.getItem("token").split('.')[1])) 
    : null; 
  const userId = tokenObj ? tokenObj.id : null;

  const [skill, setSkill] = useState('');
  const [qualification, setQualification] = useState('');
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false); // Track if the user is updating

  // Fetch the existing skill and qualification when the component loads
  useEffect(() => {
    const fetchSkillData = async () => {
      if (!userId) {
        setMessage('User ID not found. Please log in.');
        return;
      }

      try {
        const response = await fetch(`http://localhost:8800/get-skill/${userId}`);
        const data = await response.json();
        
        if (response.ok && data) {
          setSkill(data.skill || '');
          setQualification(data.qualification || '');
          setIsEditing(true); // If data exists, set to editing mode
        }
      } catch (error) {
        console.error('Error fetching skill data:', error);
        setMessage('Error fetching data.');
      }
    };

    fetchSkillData();
  }, [userId]);

  // Handle form submission (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      setMessage('User ID not found. Please log in.');
      return;
    }

    if (!skill || !qualification) {
      setMessage('Please fill in both fields.');
      return;
    }

    try {
      const endpoint = isEditing ? 'update-skill' : 'submit-skill'; // Decide whether to create or update
      const response = await fetch(`http://localhost:8800/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          skill: skill,
          qualification: qualification,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(isEditing ? 'Skill and qualification updated successfully!' : 'Skill and qualification submitted successfully!');
      } else {
        setMessage(data.error || 'Error submitting data.');
      }
    } catch (error) {
      console.error('Error submitting data:', error);
      setMessage('Error submitting data.');
    }
  };

  return (
    <div className="skill-container">
      <h2>{isEditing ? 'Update Your Skills and Academic Qualifications' : 'Enter Your Skills and Academic Qualifications'}</h2>

      <form onSubmit={handleSubmit}>
        {/* Skill Dropdown */}
        <div className="form-group">
          <label htmlFor="skill">Skill:</label>
          <select
            id="skill"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            required
          >
            <option value="">Select a skill</option>
            <option value="Programming">Programming</option>
            <option value="Java">Java</option>
            <option value="JavaScript">JavaScript</option>
            <option value="C++">C++</option>
            <option value="SQL">SQL</option>
            <option value="MySQL">MySQL</option>
            <option value="PostgreSQL">PostgreSQL</option>
            <option value="MongoDB">MongoDB</option>
            <option value="AWS">AWS</option>
            <option value="Azure">Azure</option>
          </select>
        </div>

        {/* Qualification Dropdown */}
        <div className="form-group">
          <label htmlFor="qualification">Academic Qualification:</label>
          <select
            id="qualification"
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
            required
          >
            <option value="">Select a qualification</option>
            <option value="Doctoral degree">Doctoral degree</option>
            <option value="Master's degree">Master's degree</option>
            <option value="Bachelor's degree">Bachelor's degree</option>
            <option value="Diploma">Diploma</option>
            <option value="A level">A level</option>
            <option value="O level">O level</option>
          </select>
        </div>

        <button type="submit" className="submit-button">
          {isEditing ? 'Update' : 'Submit'}
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default Skill;
