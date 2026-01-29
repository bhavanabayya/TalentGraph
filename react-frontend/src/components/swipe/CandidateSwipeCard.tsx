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
        padding: '24px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>
              {candidate.name}
            </h2>
            {(candidate.headline || candidate.primary_role) && (
              <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
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
          gap: '16px',
          fontSize: '14px',
          color: '#4b5563'
        }}>
          {candidate.location && (
            <span>📍 {candidate.location}</span>
          )}
          {(candidate.experience_years !== undefined || candidate.years_experience !== undefined) && (
            <span>💼 {candidate.experience_years || candidate.years_experience} years experience</span>
          )}
          {candidate.rate_min && candidate.rate_max && (
            <span>💰 ${candidate.rate_min}-${candidate.rate_max}/hr</span>
          )}
          {(candidate.availability_start || candidate.availability) && (
            <span>📅 Available {new Date(candidate.availability_start || candidate.availability || '').toLocaleDateString()}</span>
          )}
          {candidate.work_type && (
            <span>🏢 {candidate.work_type}</span>
          )}
        </div>

        {/* Match Explanation */}
        {(matchReasons || matchExplanation) && (
          <WhyMatchBullets reasons={matchReasons} explanation={matchExplanation} />
        )}
      </div>

      {/* Summary Section */}
      {candidate.summary && (
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
            Professional Summary
          </h3>
          <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
            {candidate.summary}
          </p>
        </div>
      )}

      {/* Job Preferences/Profiles Section */}
      {candidate.job_preferences && candidate.job_preferences.length > 0 && (
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
            Job Preferences
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {candidate.job_preferences.map((pref, idx) => (
              <div 
                key={pref.id || idx}
                style={{
                  backgroundColor: '#f9fafb',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}
              >
                {pref.preference_name && (
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>
                    {pref.preference_name}
                  </h4>
                )}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  fontSize: '13px'
                }}>
                  {pref.primary_role && (
                    <div>
                      <span style={{ color: '#6b7280' }}>Role:</span>{' '}
                      <span style={{ color: '#111827', fontWeight: 500 }}>{pref.primary_role}</span>
                    </div>
                  )}
                  {pref.location && (
                    <div>
                      <span style={{ color: '#6b7280' }}>Location:</span>{' '}
                      <span style={{ color: '#111827', fontWeight: 500 }}>{pref.location}</span>
                    </div>
                  )}
                  {pref.work_type && (
                    <div>
                      <span style={{ color: '#6b7280' }}>Work Type:</span>{' '}
                      <span style={{ color: '#111827', fontWeight: 500 }}>{pref.work_type}</span>
                    </div>
                  )}
                  {pref.rate_min && pref.rate_max && (
                    <div>
                      <span style={{ color: '#6b7280' }}>Rate:</span>{' '}
                      <span style={{ color: '#111827', fontWeight: 500 }}>${pref.rate_min}-${pref.rate_max}/hr</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Section */}
      <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
          Key Skills
        </h3>
        {candidate.skills && candidate.skills.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {candidate.skills.map((skill, idx) => (
              <span key={idx} style={{
                backgroundColor: '#ede9fe',
                color: '#6b21a8',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {skill.name}
                {skill.level && (
                  <span style={{ fontSize: '11px', opacity: 0.8 }}>• {skill.level}</span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>No skills listed</p>
        )}
      </div>

      {/* Certifications Section */}
      {candidate.certifications && candidate.certifications.length > 0 && (
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
            Certifications
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {candidate.certifications.map((cert, idx) => (
              <span key={idx} style={{
                backgroundColor: '#dcfce7',
                color: '#166534',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500
              }}>
                ✓ {cert.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Resume Section (with unlock overlay) */}
      <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
          Resume
        </h3>
        <UnlockOverlay 
          unlockLevel={unlockLevel} 
          section="resume"
          reasonText="Resume unlocks after you express interest or mutual like"
        >
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '16px',
            borderRadius: '8px',
            minHeight: '120px'
          }}>
            <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
              Professional with {candidate.years_experience || candidate.experience_years || 0}+ years of experience in software development.
              Specialized in building scalable applications using modern frameworks and cloud technologies.
              Strong track record of delivering high-quality projects on time and within budget.
            </p>
          </div>
        </UnlockOverlay>
      </div>

      {/* Contact Section (with unlock overlay) */}
      <div style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
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
            gap: '8px',
            fontSize: '14px',
            color: '#4b5563'
          }}>
            <div>📧 candidate@example.com</div>
            <div>📱 +1 (555) 123-4567</div>
            <div>💼 LinkedIn: linkedin.com/in/candidate</div>
          </div>
        </UnlockOverlay>
      </div>

      {/* View Full Profile Link */}
      {onViewFullProfile && (
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#f9fafb',
          textAlign: 'center'
        }}>
          <button
            onClick={onViewFullProfile}
            style={{
              background: 'none',
              border: 'none',
              color: '#8b5cf6',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            View Full Profile →
          </button>
        </div>
      )}
    </div>
  );
};

export default CandidateSwipeCard;
