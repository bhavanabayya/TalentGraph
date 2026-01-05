/**
 * Welcome page: choose Candidate or Company signup
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Welcome.css';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <div className="welcome-hero">
        <h1>TalentGraph</h1>
        <p>Enterprise Hiring Dating App</p>
      </div>

      <div className="welcome-options">
        <div className="option-card candidate">
          <h2>Looking for Opportunities?</h2>
          <p>Build your profile, upload your resume, and match with amazing companies.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/signup?type=candidate')}
          >
            Sign Up as Candidate
          </button>
          <p className="small-text">
            Already have an account?{' '}
            <a href="/signin">Sign in</a>
          </p>
        </div>

        <div className="option-card company">
          <h2>Hiring Top Talent?</h2>
          <p>Create job posts, swipe through candidates, and build your dream team.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/signup?type=company')}
          >
            Sign Up as Company
          </button>
          <p className="small-text">
            Already have an account?{' '}
            <a href="/signin">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
