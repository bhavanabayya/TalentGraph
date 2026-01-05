/**
 * Job Detail Page - View and Edit Job Postings
 * Accessible to company users to manage their job postings
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobsAPI, jobRolesAPI } from '../api/client';
import { useAuth } from '../context/authStore';
import '../styles/Dashboard.css';

const JobDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const { logout } = useAuth();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    product_author: '',
    product: '',
    role: '',
    seniority: '',
    location: '',
    required_skills: [],
    nice_to_have_skills: [],
    min_rate: 0,
    max_rate: 0,
    work_type: 'Remote',
    status: 'active'
  });

  // Ontology state
  const [authors, setAuthors] = useState<string[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      if (!jobId) {
        setError('Job ID not found');
        return;
      }

      const res = await jobsAPI.get(parseInt(jobId));
      setJob(res.data);
      setFormData(res.data);

      // Load ontology
      const authorsRes = await jobRolesAPI.getAuthors();
      const authorsData = Array.isArray(authorsRes.data) ? authorsRes.data : authorsRes.data?.data || [];
      setAuthors(authorsData);

      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load job details');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadProducts = async (authorName: string) => {
    try {
      const res = await jobRolesAPI.getProducts(authorName);
      const productsData = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setProducts(productsData);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const handleLoadRoles = async (authorName: string, productName: string) => {
    try {
      const res = await jobRolesAPI.getRoles(authorName, productName);
      const rolesData = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setRoles(rolesData);
    } catch (err) {
      console.error('Error loading roles:', err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!jobId) return;

      await jobsAPI.update(parseInt(jobId), formData);
      setError('');
      setIsEditing(false);
      alert('Job updated successfully!');
      await fetchJobDetails();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update job');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;

    try {
      setSaving(true);
      if (!jobId) return;

      await jobsAPI.delete(parseInt(jobId));
      alert('Job deleted successfully!');
      navigate('/company-dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete job');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return <div className="dashboard-container loading">Loading job details...</div>;
  }

  if (!job) {
    return (
      <div className="dashboard-container">
        <p style={{ color: '#d32f2f' }}>Job not found</p>
        <button className="btn btn-primary" onClick={() => navigate('/company-dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Job Detail: {formData.title}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isEditing && (
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setIsEditing(false);
                setFormData(job);
              }}
            >
              Cancel
            </button>
          )}
          {!isEditing && (
            <button 
              className="btn btn-primary" 
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          )}
          <button 
            className="btn btn-logout" 
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="job-detail">
        {/* Job Information Section */}
        {!isEditing ? (
          <>
            <div className="job-info-card">
              <h2 style={{ marginTop: 0 }}>{formData.title}</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
                <div>
                  <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Status</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                    <span className={`status status-${formData.status}`}>{formData.status}</span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Location</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{formData.location || '—'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Work Type</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{formData.work_type || '—'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Seniority</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{formData.seniority || '—'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Rate Range</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>${formData.min_rate} - ${formData.max_rate}/hr</p>
                </div>
              </div>

              <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
                <h3>Description</h3>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#666' }}>
                  {formData.description || 'No description provided'}
                </p>
              </div>

              <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
                <h3>Job Role Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500 }}>PRODUCT AUTHOR</p>
                    <p style={{ margin: 0, fontWeight: 600 }}>{formData.product_author || '—'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500 }}>PRODUCT</p>
                    <p style={{ margin: 0, fontWeight: 600 }}>{formData.product || '—'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500 }}>ROLE</p>
                    <p style={{ margin: 0, fontWeight: 600 }}>{formData.role || '—'}</p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3>Required Skills</h3>
                {formData.required_skills && formData.required_skills.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {formData.required_skills.map((skill: string, idx: number) => (
                      <span key={idx} style={{
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '13px'
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#999' }}>No required skills specified</p>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3>Nice to Have Skills</h3>
                {formData.nice_to_have_skills && formData.nice_to_have_skills.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {formData.nice_to_have_skills.map((skill: string, idx: number) => (
                      <span key={idx} style={{
                        backgroundColor: '#f3e5f5',
                        color: '#7b1fa2',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '13px'
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#999' }}>No nice-to-have skills specified</p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setIsEditing(true)}
                >
                  Edit Job
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={handleDelete}
                  disabled={saving}
                >
                  Delete Job
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => navigate('/company-dashboard')}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Edit Form */}
            <div className="job-form">
              <h2>Edit Job Posting</h2>

              <div className="form-group">
                <label>Job Title</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                  placeholder="e.g., Senior Oracle DBA"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  rows={6}
                  placeholder="Detailed job description..."
                />
              </div>

              <div className="form-group">
                <label>Product Author</label>
                <select 
                  value={formData.product_author} 
                  onChange={(e) => {
                    setFormData({ ...formData, product_author: e.target.value, product: '', role: '' });
                    setProducts([]);
                    setRoles([]);
                  }}
                >
                  <option value="">Select Author...</option>
                  {authors.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {formData.product_author && (
                <div className="form-group">
                  <label>Product</label>
                  <select 
                    value={formData.product} 
                    onChange={(e) => {
                      setFormData({ ...formData, product: e.target.value, role: '' });
                      setRoles([]);
                    }}
                    onFocus={() => handleLoadProducts(formData.product_author)}
                  >
                    <option value="">Select Product...</option>
                    {products.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.product && (
                <div className="form-group">
                  <label>Role</label>
                  <select 
                    value={formData.role} 
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    onFocus={() => handleLoadRoles(formData.product_author, formData.product)}
                  >
                    <option value="">Select Role...</option>
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input 
                    type="text" 
                    value={formData.location} 
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
                <div className="form-group">
                  <label>Seniority Level</label>
                  <select 
                    value={formData.seniority} 
                    onChange={(e) => setFormData({ ...formData, seniority: e.target.value })}
                  >
                    <option value="">Select...</option>
                    <option value="Entry Level">Entry Level</option>
                    <option value="Mid Level">Mid Level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Rate Min ($)</label>
                  <input 
                    type="number" 
                    value={formData.min_rate} 
                    onChange={(e) => setFormData({ ...formData, min_rate: parseFloat(e.target.value) })} 
                  />
                </div>
                <div className="form-group">
                  <label>Rate Max ($)</label>
                  <input 
                    type="number" 
                    value={formData.max_rate} 
                    onChange={(e) => setFormData({ ...formData, max_rate: parseFloat(e.target.value) })} 
                  />
                </div>
                <div className="form-group">
                  <label>Work Type</label>
                  <select 
                    value={formData.work_type} 
                    onChange={(e) => setFormData({ ...formData, work_type: e.target.value })}
                  >
                    <option value="Remote">Remote</option>
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(job);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JobDetailPage;
