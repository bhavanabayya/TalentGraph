import React from 'react';
import '../styles/Dashboard.css';

interface MainProfileFlashcardProps {
  profile: any;
}

const renderStars = (level: number) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={i <= level ? 'star filled' : 'star'}>
        ★
      </span>
    );
  }
  return stars;
};

export const MainProfileFlashcard: React.FC<MainProfileFlashcardProps> = ({
  profile,
}) => {
  const parseSkills = (skillsData: any) => {
    try {
      if (typeof skillsData === 'string') {
        return JSON.parse(skillsData);
      }
      return Array.isArray(skillsData) ? skillsData : [];
    } catch {
      return [];
    }
  };

  const profileSkills = parseSkills(profile.skills);

  return (
    <div className="main-profile-flashcard">
      <div className="flashcard-header main-flashcard-header">
        <div className="flashcard-badge main-badge">
          {profile.product ? `${profile.product} Expert` : 'Candidate Profile'}
        </div>
        <div className="header-meta">
          <span className="header-status">{profile.name || 'Candidate'}</span>
        </div>
      </div>

      <div className="flashcard-content main-flashcard-content">
        <h3 className="flashcard-title">{profile.name || 'Your Name'}</h3>
        <p className="flashcard-role main-role">
          {profile.primary_role || 'No role specified'} • {profile.product || 'Oracle'}
        </p>

        {profile.summary && (
          <div className="flashcard-summary">
            <p className="summary-label">Professional Summary</p>
            <p className="summary-text">"{profile.summary}"</p>
          </div>
        )}

        <div className="flashcard-grid main-flashcard-grid">
          {profile.years_experience && (
            <div className="flashcard-stat">
              <span className="stat-label">Experience</span>
              <span className="stat-value">{profile.years_experience} years</span>
            </div>
          )}
          
          {(profile.rate_min || profile.rate_max) && (
            <div className="flashcard-stat">
              <span className="stat-label">Rate</span>
              <span className="stat-value">
                ${profile.rate_min || '0'}
                {profile.rate_max && `–$${profile.rate_max}`}/hr
              </span>
            </div>
          )}
          
          {profile.location && (
            <div className="flashcard-stat">
              <span className="stat-label">Location</span>
              <span className="stat-value">{profile.location}</span>
            </div>
          )}
          
          {profile.work_type && (
            <div className="flashcard-stat">
              <span className="stat-label">Work Type</span>
              <span className="stat-value">{profile.work_type}</span>
            </div>
          )}
          
          {profile.availability && (
            <div className="flashcard-stat">
              <span className="stat-label">Available</span>
              <span className="stat-value">{profile.availability}</span>
            </div>
          )}
          
          {profile.product && (
            <div className="flashcard-stat">
              <span className="stat-label">Product</span>
              <span className="stat-value">{profile.product}</span>
            </div>
          )}
        </div>

        {profileSkills.length > 0 && (
          <div className="flashcard-skills main-profile-skills">
            <p className="skills-label">Core Skills & Proficiency</p>
            <div className="skills-container main-skills-container">
              {profileSkills.map((skill: any, idx: number) => (
                <div key={idx} className="skill-item main-skill-item">
                  <span className="skill-name">{skill.name || skill}</span>
                  <div className="skill-rating">
                    {renderStars(skill.level || 0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flashcard-footer main-profile-footer">
        <span className="profile-badge">Main Profile</span>
      </div>
    </div>
  );
};
