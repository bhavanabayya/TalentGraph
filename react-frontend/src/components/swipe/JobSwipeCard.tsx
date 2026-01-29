import React from 'react';
import MatchScoreBadge from '../match/MatchScoreBadge';
import WhyMatchBullets from '../match/WhyMatchBullets';
import '../../styles/EnterpriseDashboard.css';

interface JobSwipeCardProps {
  job: {
    id: number;
    title: string;
    company_name?: string;
    location?: string;
    employment_type?: string;
    rate_min?: number;
    rate_max?: number;
    start_date?: string;
    description?: string;
    requirements?: string;
    benefits?: string;
  };
  matchScore: number;
  matchExplanation?: any;
  matchReasons?: string[];
  onViewFullJob?: () => void;
}

const JobSwipeCard: React.FC<JobSwipeCardProps> = ({
  job,
  matchScore,
  matchExplanation,
  matchReasons,
  onViewFullJob
}) => {
  return (
    <div className="enterprise-card">
      {/* Header Section */}
      <div className="enterprise-card__header">
        <div className="enterprise-card__title-group">
          <h2 className="enterprise-card__title">{job.title}</h2>
          {job.company_name && (
            <p className="enterprise-card__company">{job.company_name}</p>
          )}
        </div>
        <MatchScoreBadge score={matchScore} />
      </div>

      {/* Metadata Row */}
      <div className="enterprise-card__metadata">
        {job.location && (
          <div className="enterprise-metadata-item">
            <svg className="enterprise-metadata-item__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="enterprise-metadata-item__value">{job.location}</span>
          </div>
        )}
        {job.employment_type && (
          <div className="enterprise-metadata-item">
            <svg className="enterprise-metadata-item__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="enterprise-metadata-item__value">{job.employment_type}</span>
          </div>
        )}
        {job.rate_min && job.rate_max && (
          <div className="enterprise-metadata-item">
            <svg className="enterprise-metadata-item__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="enterprise-metadata-item__value">${job.rate_min}-${job.rate_max}/hr</span>
          </div>
        )}
        {job.start_date && (
          <div className="enterprise-metadata-item">
            <svg className="enterprise-metadata-item__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="enterprise-metadata-item__value">Start {new Date(job.start_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Match Explanation */}
      {(matchReasons || matchExplanation) && (
        <WhyMatchBullets reasons={matchReasons} explanation={matchExplanation} />
      )}

      {/* Description Section */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ 
          fontSize: '0.875rem', 
          fontWeight: 600, 
          color: 'var(--neutral-800)', 
          marginBottom: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          About This Role
        </h3>
        {job.description ? (
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--neutral-700)', 
            lineHeight: '1.6', 
            margin: 0 
          }}>
            {job.description}
          </p>
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--neutral-400)' }}>No description provided</p>
        )}
      </div>

      {/* Requirements Section */}
      {job.requirements && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--neutral-100)' }}>
          <h3 style={{ 
            fontSize: '0.875rem', 
            fontWeight: 600, 
            color: 'var(--neutral-800)', 
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Requirements
          </h3>
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--neutral-700)', 
            lineHeight: '1.6', 
            whiteSpace: 'pre-wrap', 
            margin: 0 
          }}>
            {job.requirements}
          </p>
        </div>
      )}

      {/* Benefits Section */}
      {job.benefits && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--neutral-100)' }}>
          <h3 style={{ 
            fontSize: '0.875rem', 
            fontWeight: 600, 
            color: 'var(--neutral-800)', 
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Benefits & Perks
          </h3>
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--neutral-700)', 
            lineHeight: '1.6', 
            whiteSpace: 'pre-wrap', 
            margin: 0 
          }}>
            {job.benefits}
          </p>
        </div>
      )}

      {/* View Full Job Link */}
      {onViewFullJob && (
        <div className="enterprise-actions">
          <button
            onClick={onViewFullJob}
            className="enterprise-btn enterprise-btn--secondary"
            style={{ width: '100%' }}
          >
            View Full Job Posting →
          </button>
        </div>
      )}
    </div>
  );
};

export default JobSwipeCard;
