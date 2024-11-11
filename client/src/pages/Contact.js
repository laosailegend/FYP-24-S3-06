import React, { useState } from 'react';
import '../style.css'; // Ensure you have appropriate styles for your components

function Contact() {
  const [feedback, setFeedback] = useState('');
  const [showNotification, setShowNotification] = useState(false); // State to control notification visibility

  const handleFeedbackSubmit = () => {
    if (feedback) {
      // Show notification
      setShowNotification(true);
      // Optionally, send feedback to your backend here
      setFeedback(''); // Clear the feedback textarea

      // Hide the notification after 3 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 8000);
    } else {
      alert('Please enter your feedback before submitting.');
    }
  };

  return (
    <section className="contact">
      <h2 style={{ color: '#006eff93', fontSize: '3em', fontWeight: 'bold', font: 'Oswald' }}>Contact Us</h2>

      <div className="contact-section">
        <h3>General Inquiry</h3>
        <p>If you have any questions or need more information, please reach out to us:</p>
        <p>Email: info@emproster.com</p>
        <p>Phone: +65 9184 8261</p>
      </div>

      <div className="contact-section">
        <h3>General Contact</h3>
        <p>You can contact us through the following channels:</p>
        <p>Email: support@emproster.com</p>
        <p>Phone: +65 8472 9182</p>
      </div>

      <div className="contact-section">
        <h3>Leave Feedback</h3>
        <p>We value your feedback. Please leave your comments and suggestions below:</p>
        <textarea
          placeholder="Enter your feedback here..."
          rows="4"
          cols="50"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)} // Update feedback state
        ></textarea>
        <br />
        <button onClick={handleFeedbackSubmit}>Submit</button>
      </div>

      {/* Notification Popup */}
      {showNotification && (
        <div className="notification-overlay">
          <div className="notification">
            <p>Thanks for your feedback and suggestions!</p>
          </div>
        </div>
      )}

      <div className="contact-section">
        <h3>FAQ</h3>
        <div className="faq-item">
          <h4>1. What is a smart employee roster?</h4>
          <p>A smart employee roster is a digital scheduling tool that uses advanced algorithms to create, manage, and optimize employee work schedules automatically.</p>
        </div>
        <div className="faq-item">
          <h4>2. How does automated scheduling work?</h4>
          <p>Automated scheduling uses algorithms that consider factors such as employee availability, skills, preferences, and business needs to generate the most efficient work schedules.</p>
        </div>
      </div>
    </section>
  );
}

export default Contact;
