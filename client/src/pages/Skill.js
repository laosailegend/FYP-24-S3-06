import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Skill = () => {
  const tokenObj = localStorage.getItem("token") ? JSON.parse(atob(localStorage.getItem("token").split('.')[1])) : null;
  const userId = tokenObj ? tokenObj.id : null;
  const navigate = useNavigate();
  const server = process.env.REACT_APP_SERVER;

  // Mapping skill names to their IDs
  const skillsMapping = {
    "Programming": 1,
    "Java": 2,
    "JavaScript": 3,
    "C++": 4,
    "SQL": 5,
    "MySQL": 6,
    "PostgreSQL": 7,
    "MongoDB": 8,
    "AWS": 9,
    "Azure": 10
  };

  const skillOptions = Object.keys(skillsMapping); // Extracting skill names for the checkboxes

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  useEffect(() => {
    // Check authorization
    if (!tokenObj || (tokenObj.role !== 1 && tokenObj.role !== 3)) {
      window.alert("You are not authorized to view this page");
      navigate("/", { replace: true });
      return;
    }
    setIsLoading(false); // Set loading to false after authorization
  }, [navigate, tokenObj]);

  const handleSkillChange = (event) => {
    const { value, checked } = event.target;
    if (checked) {
      setSelectedSkills((prev) => [...prev, value]);
    } else {
      setSelectedSkills((prev) => prev.filter(skill => skill !== value));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (selectedSkills.length === 0) {
      window.alert("Please select at least one skill.");
      return;
    }

    // Map selected skill names to their IDs
    const skillIds = selectedSkills.map(skill => skillsMapping[skill]);
    
    // Convert skillIds to a JSON string
    const payload = { skill_id: JSON.stringify(skillIds) }; // Prepare the payload
    try {
      const response = await fetch(`${server}submitSkill/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload) // Send the payload
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit skills");
      }

      const data = await response.json();
      window.alert("Skills submitted successfully!");
    } catch (error) {
      console.error("Submission error: ", error);
      window.alert(`Error submitting skills: ${error.message}`);
    }
  };

  return (
    <div>
      <h1>Select Your Skills</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            {skillOptions.map((skill) => (
              <label key={skill} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  value={skill}
                  onChange={handleSkillChange}
                  checked={selectedSkills.includes(skill)}
                />
                {skill}
              </label>
            ))}
          </div>
          <button type="submit">Submit</button>
        </form>
      )}
    </div>
  );
};

export default Skill;
