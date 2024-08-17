// Contact.js
import React from 'react';
import '../style.css'; // Ensure you have appropriate styles for your components

function Contact() {
  return (
    <section className="contact">
      <h2 style={{ color: '#006eff93',fontSize: '3em', fontWeight: 'bold'}}>Contact Us</h2>

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
        <textarea placeholder="Enter your feedback here..." rows="4" cols="50"></textarea>
        <br />
        <button>Submit</button>
      </div>

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
