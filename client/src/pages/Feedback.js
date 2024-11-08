import React, { useState, useEffect } from 'react';
import axios from 'axios';


function Feedback() {
  const [comments, setComments] = useState('');
  const [rating, setRating] = useState(5);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const server=process.env.REACT_APP_SERVER;

  const userId = JSON.parse(atob(localStorage.getItem("token").split('.')[1])).id;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${server}submitFeedback`, {
        user_id: userId,
        comments,
        rating,
      });
      alert('Feedback submitted successfully');
      fetchFeedback(); // Refresh feedback history after submitting
      setComments('');
      setRating(5);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback');
    }
  };

  const fetchFeedback = async () => {
    try {
      const res = await axios.get(`${server}getFeedback/${userId}`);
      setFeedbackHistory(res.data.feedback);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  // Helper function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="feedback-container">
      <h2>Submit Feedback</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Comments:</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Enter your feedback"
            required
          />
        </div>
        <div>
          <label>Rating:</label>
          <input
            type="number"
            value={rating}
            min="1"
            max="5"
            onChange={(e) => setRating(e.target.value)}
          />
        </div>
        <button type="submit">Submit Feedback</button>
      </form>

      <h3>Your Feedback History</h3>
      <ul>
        {feedbackHistory.length > 0 ? (
          feedbackHistory.map((feedback) => (
            <li key={feedback.feedback_id}>
              Date: {formatDate(feedback.feedback_date)} - Rating: {feedback.rating} - Comments: {feedback.comments}
            </li>
          ))
        ) : (
          <p>No feedback history found.</p>
        )}
      </ul>
    </div>
  );
}

export default Feedback;
