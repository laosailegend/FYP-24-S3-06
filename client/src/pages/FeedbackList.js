import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../style.css';; // Import your CSS for styling

const server = process.env.REACT_APP_SERVER;

const FeedbackList = () => {
    const [feedbacks, setFeedbacks] = useState([]);

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const response = await axios.get(`${server}feedback`);
                setFeedbacks(response.data);
            } catch (error) {
                console.error('Error fetching feedback:', error);
            }
        };

        fetchFeedback();
    }, []);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="feedback-list">
            <h2>User Feedback</h2>
            {feedbacks.length > 0 ? (
                feedbacks.map(feedback => (
                    <div key={feedback.feedback_id} className="feedback-card">
                        <div className="feedback-header">
                            <h5>{feedback.fname} {feedback.lname}</h5>
                            <span className="feedback-date">{formatDate(feedback.feedback_date)}</span>
                        </div>
                        <p className="feedback-comments">{feedback.comments}</p>
                        <div className="feedback-rating">
                            <strong>Rating:</strong> {Array(feedback.rating).fill('⭐')}
                        </div>
                    </div>
                ))
            ) : (
                <p>No feedback available.</p>
            )}
        </div>
    );
};

export default FeedbackList;
