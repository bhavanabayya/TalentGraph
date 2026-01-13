import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { preferencesAPI, jobRolesAPI, JobPreference } from '../api/client';
import AvailabilityDatePicker from '../components/AvailabilityDatePicker';
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
    years_experience_min: undefined,
    years_experience_max: undefined,
    hourly_rate_min: undefined,
    hourly_rate_max: undefined,
    required_skills: [],
    work_type: '',
    location_preferences: [],
    availability: '',
    preference_name: '',
    summary: '',
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
      setPreferences(Array.isArray(prefsRes.data) ? prefsRes.data : []);

      // Get Oracle products
      const productsRes = await jobRolesAPI.getProducts('Oracle');
      const productsResponseData = productsRes.data;
      
      // Extract products array from response
      let productsArray = [];
      if (Array.isArray(productsResponseData)) {
        productsArray = productsResponseData;
      } else if (productsResponseData?.products && Array.isArray(productsResponseData.products)) {
        // API returns { author: "Oracle", products: ["SaaS", "E-Business Suite", ...] }
        productsArray = productsResponseData.products.map((name: string, index: number) => ({
          id: index + 1,
          name: name,
          author_id: 1
        }));
      }
      
      // Get skills and flatten them into a simple array
      const skillsRes = await jobRolesAPI.getSkills();
      const skillsResponseData = skillsRes.data;
      
      let allSkillsArray: string[] = [];
      if (skillsResponseData) {
        // Extract base skills
        if (skillsResponseData.base_skills) {
          Object.values(skillsResponseData.base_skills).forEach((categorySkills: any) => {
            if (Array.isArray(categorySkills)) {
              allSkillsArray = [...allSkillsArray, ...categorySkills];
            }
          });
        }
        
        // Extract role-specific skills
        if (skillsResponseData.role_skills?.Oracle) {
          Object.values(skillsResponseData.role_skills.Oracle).forEach((productSkills: any) => {
            if (typeof productSkills === 'object') {
              Object.values(productSkills).forEach((roleSkills: any) => {
                if (Array.isArray(roleSkills)) {
                  allSkillsArray = [...allSkillsArray, ...roleSkills];
                }
              });
            }
          });
        }
        
        // Remove duplicates and sort
        allSkillsArray = [...new Set(allSkillsArray)].sort();
      }

      setOntology({
        products: productsArray,
        roles: {},
        skills: allSkillsArray,
        oracleAuthorId: 1,
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
        const rolesResponseData = rolesRes.data;
        
        // Extract roles array from response
        let rolesArray = [];
        if (Array.isArray(rolesResponseData)) {
          rolesArray = rolesResponseData;
        } else if (rolesResponseData?.roles && Array.isArray(rolesResponseData.roles)) {
          // API returns { author: "Oracle", product: "SaaS", roles: [...] }
          rolesArray = rolesResponseData.roles.map((name: string, index: number) => ({
            id: index + 1,
            name: name,
            product_id: productId
          }));
        }
        
        setOntology({
          ...ontology,
          roles: { ...ontology.roles, [product.name]: rolesArray },
        });
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
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
      // Map frontend fields to backend schema
      const selectedProduct = ontology.products.find(p => p.id === formData.product_id);
      
      // Get primary role - use first selected role or find from roles array
      let primaryRoleName = '';
      if (formData.roles && formData.roles.length > 0) {
        primaryRoleName = formData.roles[0]; // Use first selected role
      }
      
      const submissionData: any = {
        preference_name: formData.preference_name,
        product: selectedProduct?.name || '',
        primary_role: primaryRoleName,
        years_experience: formData.years_experience_min,
        rate_min: formData.hourly_rate_min,
        rate_max: formData.hourly_rate_max,
        work_type: formData.work_type,
        location: formData.location_preferences?.join(', ') || '',
        availability: formData.availability,
        summary: formData.summary,
        required_skills: skillsWithRatings.length > 0 ? skillsWithRatings : [],
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
      // Handle validation errors
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          // Pydantic validation errors
          const errorMessages = err.response.data.detail.map((e: any) => e.msg).join(', ');
          setError(errorMessages);
        } else if (typeof err.response.data.detail === 'string') {
          setError(err.response.data.detail);
        } else {
          setError('Validation error occurred');
        }
      } else {
        setError('Failed to save preference');
      }
      console.error('Form submission error:', err.response?.data);
    }
  };

  const handleEdit = (pref: JobPreference) => {
    setFormData({
      ...pref,
      roles: pref.roles || [] // Ensure roles is always an array
    });
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
      years_experience_min: undefined,
      years_experience_max: undefined,
      hourly_rate_min: undefined,
      hourly_rate_max: undefined,
      required_skills: [],
      work_type: '',
      location_preferences: [],
      availability: '',
      preference_name: '',
      summary: '',
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
        <h1>Job Profiles</h1>
        <p>Create and manage your career profiles by product, role, experience, and rate</p>
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
                <label>Primary Role *</label>
                <select
                  value={formData.roles.length > 0 ? formData.roles[0] : ''}
                  onChange={(e) => {
                    const selectedRole = e.target.value;
                    // Auto-set preference name to role name
                    setFormData({ 
                      ...formData, 
                      roles: selectedRole ? [selectedRole] : [],
                      preference_name: selectedRole  // Set preference name same as role
                    });
                  }}
                  required
                >
                  <option value="">Select Role</option>
                  {ontology.roles[product?.name || '']?.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <small style={{ color: '#999', marginTop: '4px', display: 'block' }}>Profile name will automatically be set to the selected role.</small>
              </div>
            )}

            {/* Preference Name */}
            <div className="form-group">
              <label>Profile Name</label>
              <input
                type="text"
                placeholder="Auto-generated from selected role"
                value={formData.preference_name || (formData.roles && formData.roles[0]) || ''}
                disabled={!formData.roles || !formData.roles.length}
                style={{ 
                  backgroundColor: !formData.roles || !formData.roles.length ? '#f5f5f5' : 'white',
                  cursor: !formData.roles || !formData.roles.length ? 'not-allowed' : 'text'
                }}
                onChange={(e) => setFormData({ ...formData, preference_name: e.target.value })}
              />
              <small style={{ color: '#999', marginTop: '4px', display: 'block' }}>Auto-set to the selected role. Select a role first.</small>
            </div>

            {/* Experience */}
            <div className="form-group">
              <label>Years of Experience</label>
              <input
                type="number"
                min="0"
                placeholder="e.g., 5"
                value={formData.years_experience_min || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    years_experience_min: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>

            {/* Professional Summary */}
            <div className="form-group">
              <label>Professional Summary</label>
              <textarea
                placeholder="Describe your experience and expertise in this role..."
                value={formData.summary || ''}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
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
                <div>
                  <h4 style={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    marginBottom: '12px',
                    color: '#333'
                  }}>
                    Selected Skills ({skillsWithRatings.length})
                  </h4>
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
                </div>
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
              <label>Availability Date</label>
              <AvailabilityDatePicker
                value={formData.availability}
                onChange={(date) => setFormData({ ...formData, availability: date })}
                placeholder="Select your availability date"
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
        <h2>Your Job Profiles ({preferences.length})</h2>
        {preferences.length === 0 ? (
          <p className="empty-message">No profiles yet. Create one to get started!</p>
        ) : (
          <div className="preferences-grid">
            {preferences.map((pref) => (
              <div key={pref.id} className="preference-card">
                <div className="card-header">
                  <h3>{pref.preference_name || pref.primary_role}</h3>
                  <span className={`status ${pref.is_active ? 'active' : 'inactive'}`}>
                    {pref.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="card-body">
                  <div className="card-section">
                    <strong>Role:</strong>
                    <div style={{ marginTop: '4px' }}>{pref.primary_role || 'N/A'}</div>
                  </div>

                  {pref.product && (
                    <div className="card-section">
                      <strong>Product Type:</strong>
                      <div style={{ marginTop: '4px' }}>{pref.product}</div>
                    </div>
                  )}

                  {pref.location && (
                    <div className="card-section">
                      <strong>Job Location:</strong>
                      <div style={{ marginTop: '4px' }}>📍 {pref.location}</div>
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
