import React from 'react';
import SchedulingIcon from './Feature1.png';
import ResumeIcon from './Feature2.png';
import SwapIcon from './Feature3.png';
import TimeOffIcon from './Feature4.png';
import TrackIcon from './Feature5.png';
import RoleIcon from './Feature6.png';
import UpdateIcon from './Feature7.png';

function EmpRosterFeatures() {
  return (
    <section className="emp-roster-features">
      <h2 style={{ color: '#006eff93',fontSize: '3em', fontWeight: 'bold' }}>Key Features</h2>
      <div className="feature-item">
        <img src={SchedulingIcon} alt="Feature1" /> {/* Use the imported image */}
        <p style={{ fontSize: '2.5em', fontWeight: 'bold' }}>Make Scheduling easy and efficient</p>
        <p>Easily create rosters for your company with us! 
           Streamline and optimize employee scheduling with a smart, efficient roster app that simplifies the process for managers and staff alike.</p>
      </div>
      <div className="feature-item">
        <img src={ResumeIcon} alt="Feature2" /> {/* Use the imported image */}
        <p style={{ fontSize: '2.5em', fontWeight: 'bold' }}>View all your employees' resources with a click</p>
        <p>Effortlessly access and review all your employees' resumes with just a single click.</p>
      </div>
      <div className="feature-item">
        <img src={SwapIcon} alt="Feature3" /> {/* Use the imported image */}
        <p style={{ fontSize: '2.5em', fontWeight: 'bold' }}>Swap Shifts</p>
        <p>Shift Swap allows employees to easily exchange shifts with their colleagues, ensuring flexibility and coverage.</p>
      </div>
      <div className="feature-item">
        <img src={TimeOffIcon} alt="Feature4" /> {/* Use the imported image */}
        <p style={{ fontSize: '2.5em', fontWeight: 'bold' }}>Request for Time-Off</p>
        <p>Employees can easily submit their requests for time off through the app, ensuring a streamlined approval process and up-to-date scheduling.</p>
      </div>
      <div className="feature-item">
        <img src={TrackIcon} alt="Feature5" /> {/* Use the imported image */}
        <p style={{ fontSize: '2.5em', fontWeight: 'bold' }}>Track Employees attendance</p>
        <p>Efficiently monitor and record employee attendance to ensure accurate timekeeping and productivity management.</p>
      </div>
      <div className="feature-item">
        <img src={RoleIcon} alt="Feature6" /> {/* Use the imported image */}
        <p style={{ fontSize: '2.5em', fontWeight: 'bold' }}>Role-Based Access Rights</p>
        <p>Role-Based Access Rights ensure that users have access to resources and permissions based on their specific roles within an organization, enhancing security and operational efficiency.</p>
      </div>
      <div className="feature-item">
        <img src={UpdateIcon} alt="Feature7" /> {/* Use the imported image */}
        <p style={{ fontSize: '2.5em', fontWeight: 'bold' }}>Employee editing & updating of information</p>
        <p>Enable employees to effortlessly edit and update their personal and professional information within the system.</p>
      </div>
    </section>
  );
}

export default EmpRosterFeatures;
