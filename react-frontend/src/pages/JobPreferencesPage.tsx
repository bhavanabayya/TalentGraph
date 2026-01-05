import React, { useState, useEffect } from 'react';
import { preferencesAPI, jobRolesAPI, JobPreference } from '../api/client';
import '../styles/JobPreferences.css';

interface ProductAuthor {
  id: number;
  name: string;
}

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
  authors: ProductAuthor[];
  products: { [key: string]: Product[] };
  roles: { [key: string]: JobRole[] };
  skills: string[];
}

const JobPreferencesPage: React.FC = () => {
  const [preferences, setPreferences] = useState<JobPreference[]>([]);
  const [ontology, setOntology] = useState<OntologyData>({
    authors: [],
    products: {},
    roles: {},
    skills: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState<JobPreference>({
    product_author_id: 0,
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

  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch preferences
      const prefsRes = await preferencesAPI.getMyPreferences();
      setPreferences(prefsRes.data);

      // Fetch ontology data
      const authorsRes = await jobRolesAPI.getAuthors();
      const skillsRes = await jobRolesAPI.getSkills();

      setOntology({
        authors: authorsRes.data,
        products: {},
        roles: {},
        skills: skillsRes.data,
      });

      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorChange = async (authorId: number) => {
    setFormData({ ...formData, product_author_id: authorId, product_id: 0, roles: [] });
    try {
      const author = ontology.authors.find((a) => a.id === authorId);
      if (author) {
        const productsRes = await jobRolesAPI.getProducts(author.name);
        setOntology({
          ...ontology,
          products: { ...ontology.products, [author.name]: productsRes.data },
        });
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleProductChange = async (productId: number) => {
    setFormData({ ...formData, product_id: productId, roles: [] });
    try {
      const author = ontology.authors.find((a) => a.id === formData.product_author_id);
      const product = ontology.products[author?.name || '']?.find((p) => p.id === productId);

      if (author && product) {
        const rolesRes = await jobRolesAPI.getRoles(author.name, product.name);
        setOntology({
          ...ontology,
          roles: { ...ontology.roles, [`${author.name}-${product.name}`]: rolesRes.data },
        });
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const handleRoleToggle = (roleId: number) => {
    const author = ontology.authors.find((a) => a.id === formData.product_author_id);
    const product = ontology.products[author?.name || '']?.find((p) => p.id === formData.product_id);

    if (author && product) {
      const role = ontology.roles[`${author.name}-${product.name}`]?.find((r) => r.id === roleId);
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
    if (selectedSkill && !formData.required_skills?.includes(selectedSkill)) {
      setFormData({
        ...formData,
        required_skills: [...(formData.required_skills || []), selectedSkill],
      });
      setSelectedSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      required_skills: formData.required_skills?.filter((s) => s !== skill),
    });
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
      if (editingId) {
        await preferencesAPI.update(editingId, formData);
      } else {
        await preferencesAPI.create(formData);
      }
      await fetchData();
      resetForm();
      setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save preference');
    }
  };

  const handleEdit = (pref: JobPreference) => {
    setFormData(pref);
    setEditingId(pref.id || null);
    setShowForm(true);
  };

  const handleDelete = async (preferenceId: number) => {
    try {
      await preferencesAPI.delete(preferenceId);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete preference');
    }
  };

  const resetForm = () => {
    setFormData({
      product_author_id: 0,
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

  const author = ontology.authors.find((a) => a.id === formData.product_author_id);
  const product = ontology.products[author?.name || '']?.find((p) => p.id === formData.product_id);

  return (
    <div className="preferences-page">
      <div className="preferences-header">
        <h1>Job Preferences</h1>
        <p>Create and manage your job preferences by product, role, experience, and rate</p>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? 'Cancel' : '+ Create New Preference'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="preferences-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>{editingId ? 'Edit Preference' : 'New Job Preference'}</h2>

            {/* Product Selection */}
            <div className="form-group">
              <label>Product Author *</label>
              <select
                value={formData.product_author_id}
                onChange={(e) => handleAuthorChange(Number(e.target.value))}
                required
              >
                <option value="">Select Product (e.g., Oracle, SAP)</option>
                {ontology.authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </div>

            {formData.product_author_id > 0 && (
              <div className="form-group">
                <label>Product *</label>
                <select
                  value={formData.product_id}
                  onChange={(e) => handleProductChange(Number(e.target.value))}
                  required
                >
                  <option value="">Select Product</option>
                  {ontology.products[author?.name || '']?.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Role Selection */}
            {formData.product_id > 0 && (
              <div className="form-group">
                <label>Roles (Select multiple) *</label>
                <div className="roles-list">
                  {ontology.roles[`${author?.name}-${product?.name}`]?.map((role) => (
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
              <label>Preference Name (optional)</label>
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
              <div className="skill-input">
                <select value={selectedSkill} onChange={(e) => setSelectedSkill(e.target.value)}>
                  <option value="">Select a skill</option>
                  {ontology.skills?.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={handleAddSkill} className="btn-small">
                  Add
                </button>
              </div>
              <div className="tags">
                {formData.required_skills?.map((skill) => (
                  <span key={skill} className="tag">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="tag-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
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
              <select
                value={formData.availability || ''}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              >
                <option value="">Select Availability</option>
                <option value="Immediately">Immediately</option>
                <option value="2 weeks">2 weeks</option>
                <option value="1 month">1 month</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingId ? 'Update Preference' : 'Save Preference'}
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

      {/* Preferences List */}
      <div className="preferences-list">
        <h2>Your Job Preferences ({preferences.length})</h2>
        {preferences.length === 0 ? (
          <p className="empty-message">No preferences yet. Create one to get started!</p>
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
                    Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => {
                      if (window.confirm('Are you sure?')) {
                        handleDelete(pref.id || 0);
                      }
                    }}
                  >
                    Delete
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
