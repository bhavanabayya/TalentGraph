/**
 * Candidate Card Component - Dating-style card for swiping
 */

import React from 'react';
import { CandidateCard as CandidateCardType } from '../api/client';
import '../styles/CandidateCard.css';

interface Props {
  candidate: CandidateCardType;
  onLike: () => void;
  onPass: () => void;
}

const CandidateCard: React.FC<Props> = ({ candidate, onLike, onPass }) => {
  return (
    <div className="candidate-card">
      <div className="card-header">
        <h2>{candidate.name}</h2>
        <div className="match-score">
          <span className={`score score-${Math.round(candidate.match_score / 20)}`}>
            {Math.round(candidate.match_score)}%
          </span>
          <span className="label">Match</span>
        </div>
      </div>

      <div className="card-details">
        <div className="detail-row">
          <span className="label">Location:</span>
          <span>{candidate.location || 'Not specified'}</span>
        </div>
        <div className="detail-row">
          <span className="label">Experience:</span>
          <span>{candidate.years_experience} years</span>
        </div>
        <div className="detail-row">
          <span className="label">Product:</span>
          <span>{candidate.product_author} / {candidate.product || 'N/A'}</span>
        </div>
        <div className="detail-row">
          <span className="label">Role:</span>
          <span>{candidate.primary_role || 'Not specified'}</span>
        </div>
        <div className="detail-row">
          <span className="label">Rate:</span>
          <span>${candidate.rate_min}k - ${candidate.rate_max}k</span>
        </div>
        <div className="detail-row">
          <span className="label">Availability:</span>
          <span>{candidate.availability || 'Not specified'}</span>
        </div>
      </div>

      <div className="card-skills">
        <h3>Skills ({candidate.skills.length})</h3>
        <div className="skills-list">
          {candidate.skills.slice(0, 5).map((skill, idx) => (
            <span key={idx} className="skill-tag">
              {skill}
            </span>
          ))}
          {candidate.skills.length > 5 && (
            <span className="skill-tag">+{candidate.skills.length - 5}</span>
          )}
        </div>
      </div>

      <div className="card-match">
        <h3>Match Analysis</h3>
        <div className="match-row">
          <span>Matched Skills:</span>
          <span className="match-good">
            {candidate.match_explanation.matched_skills.join(', ') || 'None'}
          </span>
        </div>
        <div className="match-row">
          <span>Missing Skills:</span>
          <span className="match-bad">
            {candidate.match_explanation.missing_skills.join(', ') || 'None'}
          </span>
        </div>
        <div className="match-row">
          <span>Rate Fit:</span>
          <span className={candidate.match_explanation.rate_fit ? 'match-good' : 'match-bad'}>
            {candidate.match_explanation.rate_fit ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="match-row">
          <span>Location Fit:</span>
          <span className={candidate.match_explanation.location_fit ? 'match-good' : 'match-bad'}>
            {candidate.match_explanation.location_fit ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      <div className="card-actions">
        <button className="btn btn-pass" onClick={onPass}>
          ✕ Pass
        </button>
        <button className="btn btn-like" onClick={onLike}>
          ♥ Like
        </button>
      </div>
    </div>
  );
};

export default CandidateCard;
