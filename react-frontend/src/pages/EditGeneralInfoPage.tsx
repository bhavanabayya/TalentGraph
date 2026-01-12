import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidateAPI } from '../api/client';
import { useAuth } from '../context/authStore';
import SocialLinksWidget from '../components/SocialLinksWidget';
import '../styles/Dashboard.css';

const EditGeneralInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [formData, setFormData] = useState<any>({
    name: '',
    email: '',
    phone: '',
    residential_address: '',
    location: '',
    is_general_info_complete: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await candidateAPI.getMe();
      setFormData({
        name: res.data?.name || '',
        email: res.data?.email || '',
        phone: res.data?.phone || '',
        residential_address: res.data?.residential_address || '',
        location: res.data?.location || '',
        is_general_info_complete: res.data?.is_general_info_complete || false
      });
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load profile');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.name?.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!formData.email?.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!formData.phone?.trim()) {
      setError('Please enter your phone number');
      return;
    }

    try {
      setSaving(true);
      
      // Update profile with general info completion flag
      await candidateAPI.updateMe({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        residential_address: formData.residential_address?.trim() || '',
        location: formData.location?.trim() || '',
        is_general_info_complete: true  // Mark as complete when saved
      });
      
      setError('');
      alert('General information saved successfully!');
      
      // Redirect to dashboard if completing for the first time, otherwise back to general info
      if (!formData.is_general_info_complete) {
        navigate('/candidate-dashboard');
      } else {
        navigate('/general-info');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.detail || 'Failed to save information');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/general-info');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <div className="dashboard-container loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Edit General Information</h1>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-content">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
            <h2>General Information</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>Update your personal and contact information. All marked with * are required fields.</p>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>

              <div className="form-group">
                <label>Residential Address</label>
                <textarea 
                  value={formData.residential_address} 
                  onChange={(e) => setFormData({ ...formData, residential_address: e.target.value })}
                  placeholder="Enter your full residential address"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Current Location</label>
                <input 
                  type="text" 
                  value={formData.location} 
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., San Francisco, CA"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                <button 
                  type="submit"
                  className="btn btn-primary" 
                  disabled={saving}
                  style={{ flex: 1 }}
                >
                  {saving ? 'Saving...' : 'Save Information'}
                </button>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={handleCancel}
                  disabled={saving}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Social Links Widget */}
          <SocialLinksWidget editable={true} />
        </div>
      </div>
    </div>
  );
};

export default EditGeneralInfoPage;
