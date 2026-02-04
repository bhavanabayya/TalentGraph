import React from 'react';
import MatchScoreBadge from '../match/MatchScoreBadge';
import WhyMatchBullets from '../match/WhyMatchBullets';
import UnlockOverlay from '../profile/UnlockOverlay';

interface CandidateSwipeCardProps {
  candidate: {
    id: number;
    name: string;
    headline?: string;
    primary_role?: string;
    location?: string;
    experience_years?: number;
    years_experience?: number;
    rate_min?: number;
    rate_max?: number;
    availability?: string;
    availability_start?: string;
    work_type?: string;
    summary?: string;
    skills?: Array<{ name: string; level?: string; rating?: number }>;
    certifications?: Array<{ name: string; issuer?: string }>;
    job_preferences?: Array<{
      id: number;
      preference_name?: string;
      primary_role?: string;
      location?: string;
      work_type?: string;
      rate_min?: number;
      rate_max?: number;
      availability?: string;
    }>;
  };
  matchScore: number;
  matchExplanation?: any;
  matchReasons?: string[];
  unlockLevel: string;
  onViewFullProfile?: () => void;
}

const CandidateSwipeCard: React.FC<CandidateSwipeCardProps> = ({
  candidate,
  matchScore,
  matchExplanation,
  matchReasons,
  unlockLevel,
  onViewFullProfile
}) => {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      {/* Header Section */}
      <div style={{
        padding: '2rem',
        borderBottom: '1px solid var(--neutral-200)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--neutral-900)', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
              {candidate.name}
            </h2>
            {(candidate.headline || candidate.primary_role) && (
              <p style={{ fontSize: '1.0625rem', color: 'var(--neutral-600)', margin: 0, fontWeight: 500 }}>
                {candidate.headline || candidate.primary_role}
              </p>
            )}
          </div>
          <MatchScoreBadge score={matchScore} />
        </div>

        {/* Quick Info */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.875rem',
          color: 'var(--neutral-600)'
        }}>
          {candidate.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {candidate.location}
            </span>
          )}
          {(candidate.experience_years !== undefined || candidate.years_experience !== undefined) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              {candidate.experience_years || candidate.years_experience} years experience
            </span>
          )}
          {candidate.rate_min && candidate.rate_max && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--success-green)', fontWeight: 600 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              ${candidate.rate_min}-${candidate.rate_max}/hr
            </span>
          )}
          {(candidate.availability_start || candidate.availability) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Available {new Date(candidate.availability_start || candidate.availability || '').toLocaleDateString()}
            </span>
          )}
          {candidate.work_type && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              {candidate.work_type}
            </span>
          )}
        </div>

        {/* Match Explanation */}
        {(matchReasons || matchExplanation) && (
          <WhyMatchBullets reasons={matchReasons} explanation={matchExplanation} />
        )}
      </div>

      {/* Summary Section */}
      {candidate.summary && (
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neutral-200)' }}>
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--neutral-900)', marginBottom: '0.75rem' }}>
            Professional Summary
          </h3>
          <p style={{ fontSize: '0.9375rem', color: 'var(--neutral-700)', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-wrap' }}>
            {candidate.summary}
          </p>
        </div>
      )}

      {/* Job Preferences/Profiles Section */}
      {candidate.job_preferences && candidate.job_preferences.length > 0 && (
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neutral-200)' }}>
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--neutral-900)', marginBottom: '1rem' }}>
            Job Preferences
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {candidate.job_preferences.map((pref, idx) => (
              <div 
                key={pref.id || idx}
                style={{
                  backgroundColor: 'var(--neutral-50)',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--neutral-200)'
                }}
              >
                {pref.preference_name && (
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--neutral-900)', margin: '0 0 0.75rem 0' }}>
                    {pref.preference_name}
                  </h4>
                )}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem',
                  fontSize: '0.875rem'
                }}>
                  {pref.primary_role && (
                    <div>
                      <span style={{ color: 'var(--neutral-500)' }}>Role:</span>{' '}
                      <span style={{ color: 'var(--neutral-900)', fontWeight: 500 }}>{pref.primary_role}</span>
                    </div>
                  )}
                  {pref.location && (
                    <div>
                      <span style={{ color: 'var(--neutral-500)' }}>Location:</span>{' '}
                      <span style={{ color: 'var(--neutral-900)', fontWeight: 500 }}>{pref.location}</span>
                    </div>
                  )}
                  {pref.work_type && (
                    <div>
                      <span style={{ color: 'var(--neutral-500)' }}>Work Type:</span>{' '}
                      <span style={{ color: 'var(--neutral-900)', fontWeight: 500 }}>{pref.work_type}</span>
                    </div>
                  )}
                  {pref.rate_min && pref.rate_max && (
                    <div>
                      <span style={{ color: 'var(--neutral-500)' }}>Rate:</span>{' '}
                      <span style={{ color: 'var(--neutral-900)', fontWeight: 500 }}>${pref.rate_min}-${pref.rate_max}/hr</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Section */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neutral-200)' }}>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--neutral-900)', marginBottom: '0.75rem' }}>
          Key Skills
        </h3>
        {candidate.skills && candidate.skills.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {candidate.skills.map((skill, idx) => (
              <span key={idx} style={{
                backgroundColor: 'var(--indigo-50)',
                color: 'var(--primary-indigo)',
                padding: '0.5rem 0.875rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                border: '1px solid var(--primary-indigo)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}>
                {skill.name}
                {skill.level && (
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>• {skill.level}</span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--neutral-400)' }}>No skills listed</p>
        )}
      </div>

      {/* Certifications Section */}
      {candidate.certifications && candidate.certifications.length > 0 && (
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neutral-200)' }}>
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--neutral-900)', marginBottom: '0.75rem' }}>
            Certifications
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {candidate.certifications.map((cert, idx) => (
              <span key={idx} style={{
                backgroundColor: 'var(--success-green-light)',
                color: 'var(--success-green)',
                padding: '0.5rem 0.875rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                border: '1px solid var(--success-green)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {cert.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Resume Section (with unlock overlay) */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neutral-200)' }}>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--neutral-900)', marginBottom: '0.75rem' }}>
          Resume
        </h3>
        <UnlockOverlay 
          unlockLevel={unlockLevel} 
          section="resume"
          reasonText="Resume unlocks after you express interest or mutual like"
        >
          <div style={{
            backgroundColor: 'var(--neutral-50)',
            padding: '1rem',
            borderRadius: '8px',
            minHeight: '120px',
            border: '1px solid var(--neutral-200)'
          }}>
            <p style={{ fontSize: '0.9375rem', color: 'var(--neutral-700)', lineHeight: '1.7' }}>
              Professional with {candidate.years_experience || candidate.experience_years || 0}+ years of experience in software development.
              Specialized in building scalable applications using modern frameworks and cloud technologies.
              Strong track record of delivering high-quality projects on time and within budget.
            </p>
          </div>
        </UnlockOverlay>
      </div>

      {/* Contact Section (with unlock overlay) */}
      <div style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--neutral-900)', marginBottom: '0.75rem' }}>
          Contact Information
        </h3>
        <UnlockOverlay 
          unlockLevel={unlockLevel} 
          section="contact"
          reasonText="Contact info unlocks after you apply or mutual match"
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
            fontSize: '0.875rem',
            color: 'var(--neutral-600)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              candidate@example.com
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              +1 (555) 123-4567
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
              LinkedIn: linkedin.com/in/candidate
            </div>
          </div>
        </UnlockOverlay>
      </div>

      {/* View Full Profile Link */}
      {onViewFullProfile && (
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: 'var(--neutral-50)',
          textAlign: 'center',
          borderTop: '1px solid var(--neutral-200)'
        }}>
          <button
            onClick={onViewFullProfile}
            className="enterprise-btn enterprise-btn--outline"
            style={{
              fontSize: '0.875rem',
              padding: '0.5rem 1.5rem'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            View Full Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default CandidateSwipeCard;
