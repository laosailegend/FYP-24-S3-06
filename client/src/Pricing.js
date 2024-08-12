//Pricing.js
import React from 'react';
import './style.css';

const Pricing = () => {
  return (
    <div className="pricing">
            <h2 style={{ color: '#006eff93',fontSize: '3em', fontWeight: 'bold' }}>Pricing</h2>
      <table className="features-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th>Included</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>User Friendly Interface</td>
            <td>✔️</td>
          </tr>
          <tr>
            <td>Automated Scheduling</td>
            <td>✔️</td>
          </tr>
          <tr>
            <td>Shift Swapping</td>
            <td>✔️</td>
          </tr>
          <tr>
            <td>Clocking In/Out</td>
            <td>✔️</td>
          </tr>
          <tr>
            <td>Budgeting Tools</td>
            <td>✔️</td>
          </tr>
          <tr>
            <td>Real-Time Notifications</td>
            <td>✔️</td>
          </tr>
          <tr>
            <td>Availability Management</td>
            <td>✔️</td>
          </tr>
          <tr>
            <td>Labour Law Compliance</td>
            <td>✔️</td>
          </tr>
          <tr>
            <td>Payroll Integration</td>
            <td>✔️</td>
          </tr>
          <tr>
            <td>Role-Based Access Control</td>
            <td>✔️</td>
          </tr>
        </tbody>
      </table>
      <button className="request-pricing-button">Request for Pricing</button>
    </div>
  );
}

export default Pricing;
