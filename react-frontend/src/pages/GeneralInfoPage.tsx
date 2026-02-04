import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidateAPI } from '../api/client';
import { useAuth } from '../context/authStore';
import SocialLinksWidget from '../components/SocialLinksWidget';
import '../styles/Dashboard.css';

const GeneralInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGeneralInfoComplete, setIsGeneralInfoComplete] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await candidateAPI.getMe();
      console.log('Profile data:', res.data);
      setProfile(res.data || {});
      
      // Check if general info is marked complete
      setIsGeneralInfoComplete(res.data?.is_general_info_complete || false);
      
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load profile');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleEditDetails = () => {
    navigate('/edit-general-info');
  };

  if (loading) return <div className="dashboard-container loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>General Information</h1>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-content">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {!isGeneralInfoComplete ? (
            // Show welcome message and form for new users
            <div style={{ 
              backgroundColor: 'white', 
              padding: '40px', 
              borderRadius: '8px', 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              <h2 style={{ marginTop: 0, color: '#333' }}>Welcome to Your Profile!</h2>
              <p style={{ color: '#666', fontSize: '16px', marginBottom: '30px' }}>
                Let's start by setting up your general information. This will help us create your professional profile and match you with the right opportunities.
              </p>
              <button 
                className="btn btn-primary" 
                onClick={handleEditDetails}
                style={{ fontSize: '16px', padding: '12px 32px' }}
              >
                Setup General Information
              </button>
            </div>
          ) : (
            // Show general info dashboard for existing users
            <div style={{ 
              backgroundColor: 'white', 
              padding: '30px', 
              borderRadius: '8px', 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ margin: 0 }}>General Information</h2>
                <button 
                  className="btn btn-primary" 
                  onClick={handleEditDetails}
                  style={{ fontSize: '14px' }}
                >
                  ✎ Edit Details
                </button>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, rgba(74, 158, 255, 0.1) 0%, rgba(43, 127, 217, 0.08) 100%)',
                border: '2px solid #4a9eff',
                borderRadius: '8px',
                padding: '24px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Full Name</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#333' }}>{profile.name || '—'}</p>
                  </div>
                  
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Email Address</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#333' }}>{profile.email || '—'}</p>
                  </div>
                  
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Phone Number</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#333' }}>{profile.phone || '—'}</p>
                  </div>
                  
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Current Location</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#333' }}>{profile.location || '—'}</p>
                  </div>
                  
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Residential Address</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#333' }}>{profile.residential_address || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Social Links Widget */}
              <div style={{ marginTop: '30px' }}>
                <SocialLinksWidget editable={false} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneralInfoPage;
