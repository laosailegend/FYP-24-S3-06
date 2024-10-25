import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Skill = () => {
  const tokenObj = localStorage.getItem("token") ? JSON.parse(atob(localStorage.getItem("token").split('.')[1])) : null;
  const navigate = useNavigate();

  const skillOptions = [
    "Programming", "Java", "JavaScript", "C++", "SQL", 
    "MySQL", "PostgreSQL", "MongoDB", "AWS", "Azure"
  ];

  const academicOptions = [
    "Doctoral degree", "Master's degree", "Bachelor's degree", 
    "Diploma", "A level", "O level"
  ];

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedAcademic, setSelectedAcademic] = useState('');
  const [skillsList, setSkillsList] = useState([]); // State to store fetched skills
  const [isLoading, setIsLoading] = useState(true); // Loading state

  useEffect(() => {
    // Check authorization
    if (!tokenObj || (tokenObj.role !== 1 && tokenObj.role !== 3)) {
      window.alert("You are not authorized to view this page");
      navigate("/", { replace: true });
      return;
    }

    // Fetch user skills
    fetchUserSkills();

    // Set loading state to false
    setIsLoading(false);
  }, []);

  // Fetch user skills from the backend
  const fetchUserSkills = () => {
    const user_id = tokenObj ? tokenObj.id : null;

    if (!user_id) {
      console.error('User ID is not available');
      return;
    }

    fetch(`http://localhost:8800/userSkills/${user_id}`) // Adjust URL as needed
      .then((res) => res.json())
      .then((data) => {
        console.log('Fetched user skills:', data);
        setSkillsList(data); // Store fetched skills
      })
      .catch((err) => {
        console.error('Error fetching user skills:', err);
      });
  };

  // Handle skill selection
  const handleSkillChange = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // Handle academic qualification selection
  const handleAcademicChange = (event) => {
    setSelectedAcademic(event.target.value);
  };

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();

    // Extract user ID from the token
    const user_id = tokenObj ? tokenObj.id : null;

    // Ensure user_id and selected skills are valid
    if (!user_id || selectedSkills.length === 0 || !selectedAcademic) {
      alert('Please ensure all fields are filled out correctly.');
      return;
    }

    const data = {
      user_id, // Include user_id in the submission data
      skills: selectedSkills,
      qualification: selectedAcademic
    };

    console.log('Submitted data:', data);
    // Submit data to backend
    fetch('http://localhost:8800/submit-skills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
      // Handle success response (e.g., show message or redirect)
      alert('Skills submitted successfully!');
      // Optionally, reset form or navigate
      setSelectedSkills([]);
      setSelectedAcademic('');
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('Error submitting skills.');
    });
  };

  if (isLoading) {
    return <div>Loading...</div>; // Show loading state while fetching data
  }

  return (
    <div className="skill-container">
      <h2>Select Your Skills and Qualification</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <h3>Select Skills:</h3>
          {skillOptions.map((skill, index) => (
            <div key={index}>
              <label>
                <input
                  type="checkbox"
                  value={skill}
                  checked={selectedSkills.includes(skill)}
                  onChange={() => handleSkillChange(skill)}
                />
                {skill}
              </label>
            </div>
          ))}
        </div>

        <div>
          <label htmlFor="academic">Select Academic Qualification:</label>
          <select 
            id="academic" 
            value={selectedAcademic} 
            onChange={handleAcademicChange}
          >
            <option value="" disabled>Select your option</option>
            {academicOptions.map((academic, index) => (
              <option key={index} value={academic}>
                {academic}
              </option>
            ))}
          </select>
        </div>

        <button type="submit">Submit</button>
      </form>

      {/* Display fetched user skills */}
      <div className="user-skills">
        <h3>Your Skills:</h3>
        {skillsList.length > 0 ? (
          <ul>
            {skillsList.map((skill, index) => (
              <li key={index}>{skill.skill_name}</li> // Display the skill name
            ))}
          </ul>
        ) : (
          <p>No skills found.</p>
        )}
      </div>
    </div>
  );
};

export default Skill;
