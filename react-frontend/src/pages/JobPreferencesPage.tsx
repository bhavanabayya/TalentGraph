import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { preferencesAPI, jobRolesAPI, JobPreference } from '../api/client';
import '../styles/JobPreferences.css';

interface Product {
  id: number;
  name: string;
  author_id: number;
}

interface JobRole {
  id: number;
  name: string;
  product_id: number;
  seniority?: string;
}

interface OntologyData {
  products: Product[];
  roles: { [key: string]: JobRole[] };
  skills: string[];
  oracleAuthorId: number;
}

const JobPreferencesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<JobPreference[]>([]);
  const [ontology, setOntology] = useState<OntologyData>({
    products: [],
    roles: {},
    skills: [],
    oracleAuthorId: 1, // Oracle is typically ID 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState<JobPreference>({
    product_author_id: 1, // Oracle only
    product_id: 0,
    roles: [],
    seniority_level: '',
    years_experience_min: undefined,
    years_experience_max: undefined,
    hourly_rate_min: undefined,
    hourly_rate_max: undefined,
    required_skills: [],
    work_type: '',
    location_preferences: [],
    availability: '',
    preference_name: '',
  });

  // Skills state with ratings
  const [skillsWithRatings, setSkillsWithRatings] = useState<Array<{ name: string; rating: number }>>([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [currentSkillRating, setCurrentSkillRating] = useState(3);
  const [selectedLocation, setSelectedLocation] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Handle URL params for editing
  useEffect(() => {
    const editId = searchParams.get('edit');
    const isNew = searchParams.get('new');
    
    if (editId && preferences.length > 0) {
      const pref = preferences.find(p => p.id === Number(editId));
      if (pref) {
        handleEdit(pref);
      }
    } else if (isNew) {
      setShowForm(true);
    }
  }, [searchParams, preferences]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch preferences
      const prefsRes = await preferencesAPI.getMyPreferences();
      setPreferences(prefsRes.data);

      // Fetch ontology data - Oracle products and roles
      const authorsRes = await jobRolesAPI.getAuthors();
      const oracleAuthor = authorsRes.data.find((a: any) => a.name === 'Oracle');
      const oracleId = oracleAuthor?.id || 1;

      // Get Oracle products
      const productsRes = await jobRolesAPI.getProducts('Oracle');
      const skillsRes = await jobRolesAPI.getSkills();

      setOntology({
        products: productsRes.data,
        roles: {},
        skills: skillsRes.data,
        oracleAuthorId: oracleId,
      });

      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = async (productId: number) => {
    setFormData({ ...formData, product_id: productId, roles: [] });
    try {
      const product = ontology.products.find((p) => p.id === productId);
      if (product) {
        const rolesRes = await jobRolesAPI.getRoles('Oracle', product.name);
        setOntology({
          ...ontology,
          roles: { ...ontology.roles, [product.name]: rolesRes.data },
        });
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const handleRoleToggle = (roleId: number) => {
    const product = ontology.products.find((p) => p.id === formData.product_id);
    if (product) {
      const role = ontology.roles[product.name]?.find((r) => r.id === roleId);
      if (role) {
        const isSelected = formData.roles.includes(role.name);
        if (isSelected) {
          setFormData({
            ...formData,
            roles: formData.roles.filter((r) => r !== role.name),
          });
        } else {
          setFormData({
            ...formData,
            roles: [...formData.roles, role.name],
          });
        }
      }
    }
  };

  const handleAddSkill = () => {
    if (selectedSkill && !skillsWithRatings.find(s => s.name === selectedSkill)) {
      setSkillsWithRatings([...skillsWithRatings, { name: selectedSkill, rating: currentSkillRating }]);
      setSelectedSkill('');
      setCurrentSkillRating(3);
    }
  };

  const handleRemoveSkill = (skillName: string) => {
    setSkillsWithRatings(skillsWithRatings.filter(s => s.name !== skillName));
  };

  const handleUpdateSkillRating = (skillName: string, newRating: number) => {
    setSkillsWithRatings(
      skillsWithRatings.map(s =>
        s.name === skillName ? { ...s, rating: newRating } : s
      )
    );
  };

  const handleAddLocation = () => {
    if (selectedLocation && !formData.location_preferences?.includes(selectedLocation)) {
      setFormData({
        ...formData,
        location_preferences: [...(formData.location_preferences || []), selectedLocation],
      });
      setSelectedLocation('');
    }
  };

  const handleRemoveLocation = (location: string) => {
    setFormData({
      ...formData,
      location_preferences: formData.location_preferences?.filter((l) => l !== location),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert skillsWithRatings to the format expected by the backend
      const submissionData = {
        ...formData,
        required_skills: skillsWithRatings.length > 0 ? JSON.stringify(skillsWithRatings) : undefined,
      };
      
      if (editingId) {
        await preferencesAPI.update(editingId, submissionData);
        setSuccessMessage('Profile updated successfully');
      } else {
        await preferencesAPI.create(submissionData);
        setSuccessMessage('Profile created successfully');
      }
      await fetchData();
      resetForm();
      setShowForm(false);
      navigate('/profile-dashboard');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save preference');
    }
  };

  const handleEdit = (pref: JobPreference) => {
    setFormData(pref);
    setEditingId(pref.id || null);
    setShowForm(true);
    
    // Parse and populate skillsWithRatings from required_skills
    if (pref.required_skills && pref.required_skills.length > 0) {
      try {
        let skillsData = pref.required_skills;
        
        // If required_skills is a string, parse it as JSON
        if (typeof skillsData === 'string') {
          skillsData = JSON.parse(skillsData);
        }
        
        // Ensure it's an array of objects with name and rating
        if (Array.isArray(skillsData)) {
          const parsedSkills = skillsData.map((skill: any) => ({
            name: typeof skill === 'string' ? skill : skill.name,
            rating: typeof skill === 'string' ? 0 : (skill.rating || 3)
          }));
          setSkillsWithRatings(parsedSkills);
        }
      } catch (e) {
        console.error('Error parsing skills:', e);
        setSkillsWithRatings([]);
      }
    } else {
      setSkillsWithRatings([]);
    }
  };

  const handleDelete = async (preferenceId: number) => {
    try {
      await preferencesAPI.delete(preferenceId);
      setSuccessMessage('Profile deleted successfully');
      await fetchData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete profile');
    }
  };

  const resetForm = () => {
    setFormData({
      product_author_id: 1,
      product_id: 0,
      roles: [],
      seniority_level: '',
      years_experience_min: undefined,
      years_experience_max: undefined,
      hourly_rate_min: undefined,
      hourly_rate_max: undefined,
      required_skills: [],
      work_type: '',
      location_preferences: [],
      availability: '',
      preference_name: '',
    });
    setEditingId(null);
    setSelectedSkill('');
    setSelectedLocation('');
  };

  if (loading) {
    return <div className="preferences-page loading">Loading...</div>;
  }

  const product = ontology.products.find((p) => p.id === formData.product_id);

  return (
    <div className="preferences-page">
      <div className="preferences-header">
        <h1>Oracle Profiles</h1>
        <p>Create and manage your Oracle career profiles by product, role, experience, and rate</p>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? 'Cancel' : '+ Create New Profile'}
        </button>
      </div>

      {successMessage && <div className="success-message">{successMessage}</div>}
      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="preferences-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>{editingId ? 'Edit Profile' : 'New Oracle Profile'}</h2>

            {/* Product Author - Oracle Only */}
            <div className="form-group">
              <label>Product Vendor</label>
              <input
                type="text"
                value="Oracle"
                disabled
                className="disabled-input"
              />
            </div>

            {/* Oracle Product Selection */}
            <div className="form-group">
              <label>Product Type *</label>
              <select
                value={formData.product_id}
                onChange={(e) => handleProductChange(Number(e.target.value))}
                required
              >
                <option value="">Select Product</option>
                {ontology.products.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Selection */}
            {formData.product_id > 0 && (
              <div className="form-group">
                <label>Roles (Select multiple) *</label>
                <div className="roles-list">
                  {ontology.roles[product?.name || '']?.map((role) => (
                    <label key={role.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.roles.includes(role.name)}
                        onChange={() => handleRoleToggle(role.id)}
                      />
                      {role.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Preference Name */}
            <div className="form-group">
              <label>Profile Name (optional)</label>
              <input
                type="text"
                placeholder="e.g., Senior Oracle Fusion Consultant"
                value={formData.preference_name || ''}
                onChange={(e) => setFormData({ ...formData, preference_name: e.target.value })}
              />
            </div>

            {/* Experience */}
            <div className="form-row">
              <div className="form-group">
                <label>Min Experience (years)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.years_experience_min || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      years_experience_min: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Max Experience (years)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.years_experience_max || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      years_experience_max: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>

            {/* Seniority Level */}
            <div className="form-group">
              <label>Seniority Level</label>
              <select
                value={formData.seniority_level || ''}
                onChange={(e) => setFormData({ ...formData, seniority_level: e.target.value })}
              >
                <option value="">Select Level</option>
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
              </select>
            </div>

            {/* Rate */}
            <div className="form-row">
              <div className="form-group">
                <label>Hourly Rate Min ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hourly_rate_min || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hourly_rate_min: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Hourly Rate Max ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hourly_rate_max || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hourly_rate_max: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>

            {/* Work Type */}
            <div className="form-group">
              <label>Work Type</label>
              <select
                value={formData.work_type || ''}
                onChange={(e) => setFormData({ ...formData, work_type: e.target.value })}
              >
                <option value="">Select Type</option>
                <option value="Remote">Remote</option>
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            {/* Skills */}
            <div className="form-group">
              <label>Required Skills</label>
              <div className="skill-input" style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>Skill</label>
                  <select 
                    value={selectedSkill} 
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select a skill</option>
                    {ontology.skills?.map((skill) => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ minWidth: '150px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>Rating</label>
                  <div className="rating-stars-preview" style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        className={`star ${star <= currentSkillRating ? 'filled' : ''}`}
                        onClick={() => setCurrentSkillRating(star)}
                        title={`${star} star${star > 1 ? 's' : ''}`}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '18px',
                          color: star <= currentSkillRating ? '#FFB800' : '#ddd'
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={handleAddSkill} 
                  className="btn-small"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}
                >
                  Add Skill
                </button>
              </div>
              
              {/* Skills Table */}
              {skillsWithRatings.length > 0 && (
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: 600,
                        fontSize: '13px',
                        color: '#333',
                        borderRight: '1px solid #ddd'
                      }}>
                        Skill Name
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontWeight: 600,
                        fontSize: '13px',
                        color: '#333',
                        borderRight: '1px solid #ddd',
                        width: '200px'
                      }}>
                        Proficiency Rating (1-5)
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontWeight: 600,
                        fontSize: '13px',
                        color: '#333',
                        width: '100px'
                      }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillsWithRatings.map((skill, idx) => (
                      <tr key={skill.name} style={{
                        borderBottom: idx < skillsWithRatings.length - 1 ? '1px solid #eee' : 'none',
                        backgroundColor: idx % 2 === 0 ? '#fafafa' : '#fff'
                      }}>
                        <td style={{
                          padding: '12px',
                          fontSize: '14px',
                          color: '#333',
                          fontWeight: 500,
                          borderRight: '1px solid #ddd'
                        }}>
                          {skill.name}
                        </td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'center',
                          borderRight: '1px solid #ddd'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginBottom: '6px' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handleUpdateSkillRating(skill.name, star)}
                                style={{
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                  color: star <= skill.rating ? '#FFB800' : '#ddd',
                                  padding: '0 2px'
                                }}
                                title={`${star} star${star > 1 ? 's' : ''}`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          <span style={{ fontSize: '11px', color: '#999' }}>
                            {skill.rating}/5
                          </span>
                        </td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'center'
                        }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill.name)}
                            style={{
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                              transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#d32f2f')}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f44336')}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Locations */}
            <div className="form-group">
              <label>Location Preferences</label>
              <div className="location-input">
                <input
                  type="text"
                  placeholder="e.g., San Francisco, New York"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                />
                <button type="button" onClick={handleAddLocation} className="btn-small">
                  Add
                </button>
              </div>
              <div className="tags">
                {formData.location_preferences?.map((location) => (
                  <span key={location} className="tag">
                    {location}
                    <button
                      type="button"
                      onClick={() => handleRemoveLocation(location)}
                      className="tag-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="form-group">
              <label>Availability</label>
              <input
                type="text"
                placeholder="e.g., Immediately, 2 weeks, Starting Jan 15, etc."
                value={formData.availability || ''}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingId ? 'Update Profile' : 'Save Profile'}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Profiles List */}
      <div className="preferences-list">
        <h2>Your Oracle Profiles ({preferences.length})</h2>
        {preferences.length === 0 ? (
          <p className="empty-message">No profiles yet. Create one to get started!</p>
        ) : (
          <div className="preferences-grid">
            {preferences.map((pref) => (
              <div key={pref.id} className="preference-card">
                <div className="card-header">
                  <h3>{pref.preference_name}</h3>
                  <span className={`status ${pref.is_active ? 'active' : 'inactive'}`}>
                    {pref.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="card-body">
                  <div className="card-section">
                    <strong>Roles:</strong>
                    <div className="tags">
                      {pref.roles?.map((role) => (
                        <span key={role} className="tag-role">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {pref.seniority_level && (
                    <div className="card-section">
                      <strong>Seniority:</strong> {pref.seniority_level}
                    </div>
                  )}

                  {pref.years_experience_min || pref.years_experience_max ? (
                    <div className="card-section">
                      <strong>Experience:</strong> {pref.years_experience_min}-{pref.years_experience_max} years
                    </div>
                  ) : null}

                  {pref.hourly_rate_min || pref.hourly_rate_max ? (
                    <div className="card-section">
                      <strong>Rate:</strong> ${pref.hourly_rate_min}-${pref.hourly_rate_max}/hr
                    </div>
                  ) : null}

                  {pref.work_type && (
                    <div className="card-section">
                      <strong>Work Type:</strong> {pref.work_type}
                    </div>
                  )}

                  {pref.required_skills && pref.required_skills.length > 0 && (
                    <div className="card-section">
                      <strong>Required Skills:</strong>
                      <div className="tags">
                        {pref.required_skills.map((skill) => (
                          <span key={skill} className="tag-skill">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="card-actions">
                  <button className="btn-edit" onClick={() => handleEdit(pref)}>
                    ✎ Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this profile?')) {
                        handleDelete(pref.id || 0);
                      }
                    }}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobPreferencesPage;
