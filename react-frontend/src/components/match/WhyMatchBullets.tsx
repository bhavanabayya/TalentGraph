import React from 'react';
import '../../styles/EnterpriseDashboard.css';

interface WhyMatchBulletsProps {
  reasons?: string[];
  explanation?: {
    role_match?: number;
    skill_overlap_count?: number;
    availability_match?: number;
    location_match?: number;
    rate_match?: number;
    [key: string]: any;
  };
}

const WhyMatchBullets: React.FC<WhyMatchBulletsProps> = ({ reasons, explanation }) => {
  let bullets: string[] = [];

  // Use match_reasons from backend if available (preferred)
  if (reasons && reasons.length > 0) {
    bullets = reasons;
  } else if (explanation) {
    // Fallback to old explanation format for backward compatibility
    if (explanation.role_match && explanation.role_match >= 80) {
      bullets.push(`Strong role alignment (${explanation.role_match}%)`);
    }

    if (explanation.skill_overlap_count) {
      bullets.push(`${explanation.skill_overlap_count} matching skills`);
    }

    if (explanation.availability_match && explanation.availability_match >= 70) {
      bullets.push('Availability aligns with job start date');
    }

    if (explanation.location_match && explanation.location_match === 100) {
      bullets.push('Location match');
    }

    if (explanation.rate_match && explanation.rate_match >= 80) {
      bullets.push('Salary expectations align');
    }
  }

  // Fallback if no specific criteria
  if (bullets.length === 0) {
    bullets.push('Profile matches requirements');
  }

  return (
    <div className="enterprise-match-reasons">
      <h4 className="enterprise-match-reasons__title">Why This Match?</h4>
      <ul className="enterprise-match-reasons__list">
        {bullets.map((bullet, idx) => (
          <li key={idx} className="enterprise-match-reasons__item">
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WhyMatchBullets;
