import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { preferencesAPI, CandidateProfileWithPreferences } from '../api/client';
import '../styles/ProfileDashboard.css';

const ProfileDashboard: React.FC = () => {
  const [profile, setProfile] = useState<CandidateProfileWithPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await preferencesAPI.getProfileWithPreferences();
      setProfile(res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePreference = async (preferenceId: number) => {
    try {
      await preferencesAPI.delete(preferenceId);
      setSuccessMessage('Profile deleted successfully');
      setDeleteConfirm(null);
      await fetchProfile();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete profile');
    }
  };

  const handleEditPreference = (preferenceId: number) => {
    navigate(`/job-preferences?edit=${preferenceId}`);
  };

  const handleCreateNew = () => {
    navigate('/job-preferences?new=true');
  };

  if (loading) {
    return <div className="profile-dashboard loading">Loading your profile...</div>;
  }

  if (!profile) {
    return (
      <div className="profile-dashboard">
        <div className="error-message">Profile not found</div>
      </div>
    );
  }

  const activePreferences = profile.job_preferences?.filter((p) => p.is_active) || [];
  const totalPreferences = profile.job_preferences?.length || 0;

  return (
    <div className="profile-dashboard">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-avatar">
            {profile.profile_picture_path ? (
              <img src={profile.profile_picture_path} alt={profile.name} />
            ) : (
              <div className="avatar-placeholder">{profile.name.charAt(0)}</div>
            )}
          </div>
          <div className="profile-details">
            <h1>{profile.name}</h1>
            {profile.location && <p className="location">📍 {profile.location}</p>}
            {profile.summary && <p className="summary">{profile.summary}</p>}
            <div className="profile-meta">
              {profile.work_type && <span className="meta-tag">💼 {profile.work_type}</span>}
              {profile.availability && <span className="meta-tag">⏰ {profile.availability}</span>}
            </div>
          </div>
        </div>
      </div>

      {successMessage && <div className="success-message">{successMessage}</div>}
      {error && <div className="error-message">{error}</div>}

      {/* Preferences Overview */}
      <div className="preferences-overview">
        <div className="overview-card">
          <h3>Total Profiles</h3>
          <div className="overview-number">{totalPreferences}</div>
        </div>
        <div className="overview-card">
          <h3>Active Profiles</h3>
          <div className="overview-number">{activePreferences.length}</div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="preferences-section">
        <div className="section-header">
          <h2>Your Oracle Profiles</h2>
          <button
            className="btn-primary"
            onClick={handleCreateNew}
          >
            + New Profile
          </button>
        </div>

        {totalPreferences === 0 ? (
          <div className="empty-state">
            <h3>No Oracle profiles yet</h3>
            <p>Create your first Oracle profile to start matching with opportunities.</p>
            <button
              className="btn-primary-large"
              onClick={handleCreateNew}
            >
              Create Your First Profile
            </button>
          </div>
        ) : (
          <div className="preferences-container">
            {profile.job_preferences?.map((pref, index) => (
              <div
                key={pref.id}
                className={`preference-item ${pref.is_active ? 'active' : 'inactive'}`}
              >
                <div className="preference-number">Profile {index + 1}</div>

                <div className="preference-header">
                  <h3>{pref.preference_name}</h3>
                  <span className={`status ${pref.is_active ? 'active' : 'inactive'}`}>
                    {pref.is_active ? '✓ Active' : '○ Inactive'}
                  </span>
                </div>

                <div className="preference-content">
                  {/* Roles */}
                  <div className="content-block">
                    <div className="block-label">Roles</div>
                    <div className="role-tags">
                      {pref.roles?.map((role) => (
                        <span key={role} className="role-tag">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="details-grid">
                    {pref.seniority_level && (
                      <div className="detail-item">
                        <span className="detail-label">Seniority</span>
                        <span className="detail-value">{pref.seniority_level}</span>
                      </div>
                    )}

                    {(pref.years_experience_min || pref.years_experience_max) && (
                      <div className="detail-item">
                        <span className="detail-label">Experience</span>
                        <span className="detail-value">
                          {pref.years_experience_min}-{pref.years_experience_max} yrs
                        </span>
                      </div>
                    )}

                    {(pref.hourly_rate_min || pref.hourly_rate_max) && (
                      <div className="detail-item">
                        <span className="detail-label">Rate</span>
                        <span className="detail-value">
                          ${pref.hourly_rate_min}-${pref.hourly_rate_max}/hr
                        </span>
                      </div>
                    )}

                    {pref.work_type && (
                      <div className="detail-item">
                        <span className="detail-label">Work Type</span>
                        <span className="detail-value">{pref.work_type}</span>
                      </div>
                    )}

                    {pref.availability && (
                      <div className="detail-item">
                        <span className="detail-label">Available</span>
                        <span className="detail-value">{pref.availability}</span>
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  {pref.summary && (
                    <div className="content-block">
                      <div className="block-label">Summary</div>
                      <p style={{ margin: '0', fontSize: '14px', color: '#555', lineHeight: '1.5' }}>
                        {pref.summary}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {pref.required_skills && pref.required_skills.length > 0 && (
                    <div className="content-block">
                      <div className="block-label">Required Skills</div>
                      {(() => {
                        try {
                          // Parse JSON if it's a string
                          const skillsData = typeof pref.required_skills === 'string' 
                            ? JSON.parse(pref.required_skills)
                            : pref.required_skills;
                          
                          // Display as list with ratings
                          if (Array.isArray(skillsData) && skillsData.length > 0) {
                            return (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                {skillsData.map((skill: any) => {
                                  const skillName = typeof skill === 'string' ? skill : skill.name;
                                  const rating = typeof skill === 'string' ? 0 : (skill.rating || 0);
                                  return (
                                    <div key={skillName} style={{
                                      backgroundColor: '#e3f2fd',
                                      color: '#1976d2',
                                      padding: '6px 12px',
                                      borderRadius: '16px',
                                      fontSize: '12px',
                                      fontWeight: 500,
                                      border: '1px solid #90caf9',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px'
                                    }}>
                                      <span>{skillName}</span>
                                      {rating > 0 && (
                                        <span style={{ fontSize: '10px', color: '#FFB800', marginLeft: '4px' }}>
                                          {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          } else {
                            return null;
                          }
                        } catch (e) {
                          return null;
                        }
                      })()}
                    </div>
                  )}

                  {/* Locations */}
                  {pref.location_preferences && pref.location_preferences.length > 0 && (
                    <div className="content-block">
                      <div className="block-label">Preferred Locations</div>
                      <div className="location-tags">
                        {pref.location_preferences.map((location) => (
                          <span key={location} className="location-tag">
                            📍 {location}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="preference-footer">
                  <small>Created {pref.created_at ? new Date(pref.created_at as string | number).toLocaleDateString() : 'N/A'}</small>
                  <div className="action-buttons">
                    <button
                      className="btn-edit"
                      onClick={() => handleEditPreference(pref.id)}
                    >
                      ✎ Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => setDeleteConfirm(pref.id)}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>

                {deleteConfirm === pref.id && (
                  <div className="delete-confirmation">
                    <p>Are you sure you want to delete this profile?</p>
                    <div className="confirm-buttons">
                      <button
                        className="btn-confirm-yes"
                        onClick={() => handleDeletePreference(pref.id)}
                      >
                        Yes, Delete
                      </button>
                      <button
                        className="btn-confirm-no"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics Section */}
      {totalPreferences > 0 && (
        <div className="statistics-section">
          <h2>Preference Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Experience Range</h4>
              <p>
                {Math.min(
                  ...(profile.job_preferences
                    ?.filter((p) => p.years_experience_min)
                    .map((p) => p.years_experience_min || 0) || [0])
                )}{' '}
                -{' '}
                {Math.max(
                  ...(profile.job_preferences
                    ?.filter((p) => p.years_experience_max)
                    .map((p) => p.years_experience_max || 0) || [0])
                )}{' '}
                years
              </p>
            </div>
            <div className="stat-card">
              <h4>Rate Range</h4>
              <p>
                ${Math.min(
                  ...(profile.job_preferences
                    ?.filter((p) => p.hourly_rate_min)
                    .map((p) => p.hourly_rate_min || 0) || [0])
                )}{' '}
                - ${Math.max(
                  ...(profile.job_preferences
                    ?.filter((p) => p.hourly_rate_max)
                    .map((p) => p.hourly_rate_max || 0) || [0])
                )}/hr
              </p>
            </div>
            <div className="stat-card">
              <h4>Total Skills</h4>
              <p>
                {new Set(
                  profile.job_preferences
                    ?.flatMap((p) => {
                      try {
                        const skills = typeof p.required_skills === 'string' 
                          ? JSON.parse(p.required_skills || '[]')
                          : (p.required_skills || []);
                        return Array.isArray(skills) && skills.length > 0 && typeof skills[0] === 'object'
                          ? skills.map((s: any) => s.name)
                          : skills;
                      } catch {
                        return p.required_skills || [];
                      }
                    })
                ).size || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDashboard;
