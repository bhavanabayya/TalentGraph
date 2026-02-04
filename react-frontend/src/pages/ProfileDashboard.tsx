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
      {successMessage && <div className="success-message">{successMessage}</div>}
      {error && <div className="error-message">{error}</div>}

      {/* Preferences Section */}
      <div className="preferences-section">
        <div className="section-header">
          <h2>Your Job Profiles ({totalPreferences})</h2>
          <button
            className="btn-primary"
            onClick={handleCreateNew}
          >
            + New Profile
          </button>
        </div>

        {totalPreferences === 0 ? (
          <div className="empty-state">
            <h3>No profiles yet</h3>
            <p>Create your first profile to start matching with opportunities.</p>
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
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 24px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  backgroundColor: '#fff'
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
                    {pref.preference_name || pref.primary_role}
                  </h3>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#666' }}>
                    {pref.primary_role && (
                      <div>
                        <strong>Role:</strong> {pref.primary_role}
                      </div>
                    )}
                    {pref.product && (
                      <div>
                        <strong>Product Type:</strong> {pref.product}
                      </div>
                    )}
                    {pref.location && (
                      <div>
                        <strong>Job Location:</strong> 📍 {pref.location}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`status ${pref.is_active ? 'active' : 'inactive'}`}>
                    {pref.is_active ? '✓ Active' : '○ Inactive'}
                  </span>
                  <button
                    className="btn-edit"
                    onClick={() => pref.id && handleEditPreference(pref.id)}
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                  >
                    ✎ Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => pref.id && setDeleteConfirm(pref.id)}
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                  >
                    🗑 Delete
                  </button>
                </div>

                {deleteConfirm === pref.id && pref.id && (
                  <div className="delete-confirmation">
                    <p>Are you sure you want to delete this profile?</p>
                    <div className="confirm-buttons">
                      <button
                        className="btn-confirm-yes"
                        onClick={() => pref.id && handleDeletePreference(pref.id)}
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
    </div>
  );
};

export default ProfileDashboard;
