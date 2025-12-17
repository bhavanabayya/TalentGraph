import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const ProfilePage = ({ API_BASE, authToken, authedEmail, candidateId, onCandidateIdChange }) => {
  const [profile, setProfile] = useState(null);
  const [jobRoles, setJobRoles] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: authedEmail,
    location: '',
    product_author: 'Select...',
    product: '',
    primary_role: '',
    years_experience: 3,
    availability: '',
    rate_min: 80,
    rate_max: 120,
    work_type: 'Remote',
    location_preference_1: '',
    location_preference_2: '',
    location_preference_3: '',
    job_roles: [],
    skills: [],
  });

  const headers = { Authorization: `Bearer ${authToken}` };

  const loadProfile = useCallback(async () => {
    if (!candidateId) {
      setLoading(false);
      return;
    }
    try {
      const resp = await axios.get(`${API_BASE}/candidates/${candidateId}`, { headers });
      setProfile(resp.data);
      setFormData({
        name: resp.data.name,
        email: resp.data.email,
        location: resp.data.location,
        product_author: resp.data.product_author || 'Select...',
        product: resp.data.product || '',
        primary_role: resp.data.primary_role || '',
        years_experience: resp.data.years_experience || 3,
        availability: resp.data.availability || '',
        rate_min: resp.data.rate_min || 80,
        rate_max: resp.data.rate_max || 120,
        work_type: resp.data.work_type || 'Remote',
        location_preference_1: resp.data.location_preference_1 || '',
        location_preference_2: resp.data.location_preference_2 || '',
        location_preference_3: resp.data.location_preference_3 || '',
        job_roles: resp.data.job_roles || [],
        skills: resp.data.skills || [],
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
    setLoading(false);
  }, [candidateId, API_BASE, headers]);

  const loadJobRoles = useCallback(async () => {
    try {
      const resp = await axios.get(`${API_BASE}/job-roles`, { headers });
      setJobRoles(resp.data.product_authors || {});
    } catch (error) {
      console.error('Error loading job roles:', error);
    }
  }, [API_BASE, headers]);

  useEffect(() => {
    loadProfile();
    loadJobRoles();
  }, [loadProfile, loadJobRoles]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      email: formData.email,
      location: formData.location,
      product_author: formData.product_author === 'Select...' ? null : formData.product_author,
      product: formData.product,
      primary_role: formData.primary_role,
      years_experience: formData.years_experience,
      availability: formData.availability,
      rate_min: formData.rate_min,
      rate_max: formData.rate_max,
      work_type: formData.work_type,
      location_preference_1: formData.location_preference_1,
      location_preference_2: formData.location_preference_2,
      location_preference_3: formData.location_preference_3,
      job_roles: formData.job_roles,
      skills: formData.skills.map((s) => ({
        name: typeof s === 'string' ? s : s.name,
        level: 'Intermediate',
      })),
      certifications: [],
    };

    try {
      const resp = await axios.post(`${API_BASE}/candidates/`, payload, { headers });
      onCandidateIdChange(resp.data.id);
      setMessage('Profile saved successfully!');
      setMessageType('success');
      setProfile(resp.data);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Failed to save profile');
      setMessageType('error');
    }
  };

  const availableProducts = formData.product_author !== 'Select...' && jobRoles[formData.product_author]
    ? Object.keys(jobRoles[formData.product_author].products || {})
    : [];

  const availableRoles = formData.product && formData.product_author !== 'Select...' && jobRoles[formData.product_author]?.products?.[formData.product]
    ? jobRoles[formData.product_author].products[formData.product].roles || []
    : [];

  if (loading) return <div className="container"><p className="ds-muted">Loading profile...</p></div>;

  return (
    <div className="container">
      <h1 className="ds-h1">Candidate Profile</h1>
      <p className="ds-muted">Review your profile summary and keep your information up to date.</p>

      {message && (
        <div className={`alert alert-${messageType}`} style={{ marginTop: '20px' }}>
          {message}
        </div>
      )}

      {profile && (
        <div style={{ marginTop: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '750',
            background: 'linear-gradient(135deg, #1e40af 0%, #0ea5e9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '28px',
            letterSpacing: '-0.5px'
          }}>Your Profile</h2>

          <div className="card" style={{ marginBottom: '28px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '32px',
                fontWeight: '800',
                color: '#0f172a',
                marginBottom: '4px'
              }}>{profile.name}</h3>
              <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
                {profile.primary_role || 'Professional'}
              </p>
            </div>

            <div className="cols-3" style={{ marginTop: '24px', marginBottom: '28px' }}>
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
                borderRadius: '10px',
                border: '1px solid #bfdbfe'
              }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af', textTransform: 'uppercase', marginBottom: '8px' }}>Experience</p>
                <p style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{profile.years_experience}</p>
                <p style={{ fontSize: '13px', color: '#64748b' }}>years</p>
              </div>

              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                borderRadius: '10px',
                border: '1px solid #bbf7d0'
              }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#059669', textTransform: 'uppercase', marginBottom: '8px' }}>Rate (USD/hr)</p>
                <p style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>${profile.rate_min}–${profile.rate_max}</p>
              </div>

              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fef08a 100%)',
                borderRadius: '10px',
                border: '1px solid #fcd34d'
              }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', marginBottom: '8px' }}>Availability</p>
                <p style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{profile.availability || 'Available'}</p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>Professional Details</h4>
              <div className="cols-2">
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Product Expert</p>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>{profile.product_author || '—'}</p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Product</p>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>{profile.product || '—'}</p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Work Type</p>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>{profile.work_type || 'Remote'}</p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Base Location</p>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>{profile.location || '—'}</p>
                </div>
              </div>
            </div>

            {profile.job_roles && profile.job_roles.length > 0 && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px', marginTop: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>Interested Roles</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {profile.job_roles.map((role, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-block',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(profile.location_preference_1 || profile.location_preference_2 || profile.location_preference_3) && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px', marginTop: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>Preferred Locations</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {[profile.location_preference_1, profile.location_preference_2, profile.location_preference_3]
                    .filter(loc => loc)
                    .map((location, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px 16px',
                          background: '#f1f5f9',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#334155'
                        }}
                      >
                        📍 {location}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="spacer-lg">
        <h2 className="ds-h2">Create / Update Profile</h2>

        <form onSubmit={handleSaveProfile} style={{ marginTop: '20px' }}>
          <h4 className="ds-h4" style={{ marginTop: '24px' }}>Basic Information</h4>

          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Full Name"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" value={formData.email} disabled />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City, State / Country"
            />
          </div>

          <h4 className="ds-h4" style={{ marginTop: '24px' }}>Professional Information</h4>

          <div className="form-group">
            <label>Product Author</label>
            <select name="product_author" value={formData.product_author} onChange={handleInputChange}>
              <option>Select...</option>
              {Object.keys(jobRoles).map((author) => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>
          </div>

          {availableProducts.length > 0 && (
            <div className="form-group">
              <label>Product</label>
              <select name="product" value={formData.product} onChange={handleInputChange}>
                <option value="">Select Product</option>
                {availableProducts.map((prod) => (
                  <option key={prod} value={prod}>
                    {prod}
                  </option>
                ))}
              </select>
            </div>
          )}

          <h4 className="ds-h4" style={{ marginTop: '24px' }}>Job Role Preferences</h4>

          {availableRoles.length > 0 && (
            <div>
              <div className="form-group">
                <label style={{ marginBottom: '12px', display: 'block' }}>Your Selected Roles:</label>
                {formData.job_roles.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {formData.job_roles.map((role, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#e0e7ff',
                          color: '#312e81',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        {role}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              job_roles: prev.job_roles.filter((_, i) => i !== idx),
                            }));
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#312e81',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="ds-muted" style={{ marginBottom: '12px' }}>No roles selected yet</p>
                )}
              </div>

              <div className="form-group">
                <label>Add Job Role</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    id="roleSelect"
                    style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="">Select a role to add</option>
                    {availableRoles.filter((role) => !formData.job_roles.includes(role)).map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const select = document.getElementById('roleSelect');
                      const selectedRole = select.value;
                      if (selectedRole && !formData.job_roles.includes(selectedRole)) {
                        setFormData((prev) => ({
                          ...prev,
                          job_roles: [...prev.job_roles, selectedRole],
                        }));
                        select.value = '';
                      }
                    }}
                    className="btn btn-secondary"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="cols-2">
            <div className="form-group">
              <label>Years of Experience</label>
              <input
                type="number"
                name="years_experience"
                value={formData.years_experience}
                onChange={handleInputChange}
                min="0"
                max="40"
              />
            </div>

            <div className="form-group">
              <label>Availability</label>
              <input
                type="text"
                name="availability"
                value={formData.availability}
                onChange={handleInputChange}
                placeholder="e.g. Immediate, 2 weeks"
              />
            </div>
          </div>

          <div className="cols-2">
            <div className="form-group">
              <label>Min Rate (USD/hr)</label>
              <input
                type="number"
                name="rate_min"
                value={formData.rate_min}
                onChange={handleInputChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Max Rate (USD/hr)</label>
              <input
                type="number"
                name="rate_max"
                value={formData.rate_max}
                onChange={handleInputChange}
                min="0"
              />
            </div>
          </div>

          <h4 className="ds-h4" style={{ marginTop: '24px' }}>Work Type & Location Preferences</h4>

          <div className="form-group">
            <label>Work Type</label>
            <select name="work_type" value={formData.work_type} onChange={handleInputChange}>
              <option value="Remote">Remote</option>
              <option value="Full-time">Full-time (On-site)</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <div className="form-group">
            <label>Preferred Location 1</label>
            <input
              type="text"
              name="location_preference_1"
              value={formData.location_preference_1}
              onChange={handleInputChange}
              placeholder="e.g. San Francisco, USA"
            />
          </div>

          <div className="form-group">
            <label>Preferred Location 2</label>
            <input
              type="text"
              name="location_preference_2"
              value={formData.location_preference_2}
              onChange={handleInputChange}
              placeholder="e.g. New York, USA"
            />
          </div>

          <div className="form-group">
            <label>Preferred Location 3</label>
            <input
              type="text"
              name="location_preference_3"
              value={formData.location_preference_3}
              onChange={handleInputChange}
              placeholder="e.g. Toronto, Canada"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-large">
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
