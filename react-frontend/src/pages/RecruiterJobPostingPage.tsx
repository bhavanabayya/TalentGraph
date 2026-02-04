import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authStore';
import { jobsAPI, jobRolesAPI } from '../api/client';
import '../styles/Dashboard.css';

interface JobPosting {
  id?: number;
  title: string;
  description: string;
  product_author: string;
  product: string;
  role: string;
  seniority?: string;
  job_type: 'Permanent' | 'Contract';
  duration?: string;
  start_date?: string;
  currency: 'USD' | 'EUR' | 'GBP';
  location?: string;
  work_type?: 'Remote' | 'On-site' | 'Hybrid';
  min_rate?: number;  // Hourly rate for contracts
  max_rate?: number;  // Hourly rate for contracts
  salary_min?: number;  // Annual salary for permanent jobs
  salary_max?: number;  // Annual salary for permanent jobs
  status?: string;
}

const RecruiterJobPostingPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout, companyRole, email } = useAuth();

  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Ontology state
  const [authors, setAuthors] = useState<string[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  // Check if user can create/edit jobs (ADMIN or HR can, RECRUITER cannot)
  const canManageJobs = companyRole === 'ADMIN' || companyRole === 'HR';
  const isRecruiterOnly = companyRole === 'RECRUITER';

  const [formData, setFormData] = useState<JobPosting>({
    title: '',  // Will be auto-set from role
    description: '',
    product_author: 'Oracle',
    product: '',
    role: '',
    seniority: 'Mid',
    job_type: 'Permanent',
    duration: '',
    start_date: '',
    currency: 'USD',
    location: '',
    work_type: 'Remote',
    min_rate: undefined,
    max_rate: undefined,
    salary_min: undefined,
    salary_max: undefined,
  });

  useEffect(() => {
    fetchJobPostings();
    loadAuthors();
  }, []);

  useEffect(() => {
    if (showForm && formData.product_author) {
      handleLoadProducts(formData.product_author);
      if (formData.product) {
        handleLoadRoles(formData.product_author, formData.product);
      }
    }
  }, [showForm]);

  const loadAuthors = async () => {
    try {
      const res = await jobRolesAPI.getAuthors();
      setAuthors(res.data.authors || []);
    } catch (err) {
      console.error('Failed to load authors:', err);
    }
  };

  const handleLoadProducts = async (author?: string) => {
    const authorToUse = author || formData.product_author;
    if (!authorToUse) {
      setProducts([]);
      return;
    }
    try {
      const res = await jobRolesAPI.getProducts(authorToUse);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      setProducts([]);
    }
  };

  const handleLoadRoles = async (author?: string, product?: string) => {
    const authorToUse = author || formData.product_author;
    const productToUse = product || formData.product;
    if (!authorToUse || !productToUse) {
      setRoles([]);
      return;
    }
    try {
      const res = await jobRolesAPI.getRoles(authorToUse, productToUse);
      setRoles(res.data.roles || []);
    } catch (err) {
      console.error('Failed to load roles:', err);
      setRoles([]);
    }
  };

  const fetchJobPostings = async () => {
    try {
      setLoading(true);
      const res = await jobsAPI.getRecruiterPostings();
      setJobPostings(res.data || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load job postings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.role) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      // Auto-set title from role
      const jobData = { ...formData, title: formData.role };
      console.log('Submitting job data:', jobData);
      
      if (editingId) {
        await jobsAPI.updateJobPosting(editingId, jobData);
      } else {
        await jobsAPI.createJobPosting(jobData);
      }
      
      setSuccessMessage(editingId ? 'Job posting updated!' : 'Job posting created!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      setShowForm(false);
      setEditingId(null);
      resetForm();
      await fetchJobPostings();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save job posting');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',  // Will be auto-set from role
      description: '',
      product_author: 'Oracle',
      product: '',
      role: '',
      seniority: 'Mid',
      job_type: 'Permanent',
      duration: '',
      start_date: '',
      currency: 'USD',
      location: '',
      work_type: 'Remote',
      min_rate: undefined,
      max_rate: undefined,
      salary_min: undefined,
      salary_max: undefined,
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <div className="dashboard-container loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Job Postings Portal</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
            Signed in as: <strong>{email}</strong> ({companyRole})
          </p>
        </div>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </header>

      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-content">
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Create New Posting Button - Only for ADMIN/HR */}
          <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0' }}>
                {isRecruiterOnly ? 'Available Job Postings' : 'My Job Postings'}
              </h2>
              {isRecruiterOnly && (
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  View-only mode. You can see assigned and created jobs but cannot edit or delete them.
                </p>
              )}
            </div>
            {canManageJobs && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  resetForm();
                  setEditingId(null);
                  setShowForm(!showForm);
                  if (!showForm) {
                    // Load products for default author when form opens
                    handleLoadProducts('Oracle');
                  }
                }}
                style={{ fontSize: '14px' }}
              >
                {showForm ? '✕ Close Form' : '+ Post New Job'}
              </button>
            )}
          </div>

          {/* Job Posting Form */}
          {showForm && (
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              marginBottom: '30px'
            }}>
              <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Job Posting' : 'Post a New Job'}</h3>
              
              <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <fieldset style={{ border: '1px solid #e0e0e0', padding: '20px', marginBottom: '20px', borderRadius: '8px' }}>
                  <legend style={{ padding: '0 10px', fontWeight: 600 }}>Job Details</legend>

                  <div className="form-group">
                    <label>Description *</label>
                    <textarea
                      placeholder="Job description, responsibilities, and requirements"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={5}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Product Author *</label>
                    <select
                      value={formData.product_author}
                      onChange={(e) => {
                        const author = e.target.value;
                        setFormData({ ...formData, product_author: author, product: '', role: '' });
                        handleLoadProducts(author);
                      }}
                      required
                    >
                      <option value="">Select a product author</option>
                      {authors.map((author) => (
                        <option key={author} value={author}>{author}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Product *</label>
                      <select
                        value={formData.product}
                        onChange={(e) => {
                          const product = e.target.value;
                          setFormData({ ...formData, product, role: '' });
                          handleLoadRoles(formData.product_author, product);
                        }}
                        required
                        disabled={!formData.product_author}
                      >
                        <option value="">Select a product</option>
                        {products.map((product) => (
                          <option key={product} value={product}>{product}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Role *</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        required
                        disabled={!formData.product}
                      >
                        <option value="">Select a role</option>
                        {roles.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Seniority Level</label>
                      <select
                        value={formData.seniority || ''}
                        onChange={(e) => setFormData({ ...formData, seniority: e.target.value })}
                      >
                        <option value="Junior">Junior</option>
                        <option value="Mid">Mid</option>
                        <option value="Senior">Senior</option>
                        <option value="Lead">Lead</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Work Type</label>
                      <select
                        value={formData.work_type || ''}
                        onChange={(e) => setFormData({ ...formData, work_type: e.target.value as any })}
                      >
                        <option value="Remote">Remote</option>
                        <option value="On-site">On-site</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      placeholder="e.g., San Francisco, CA or Remote"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </fieldset>

                {/* Job Type & Duration */}
                <fieldset style={{ border: '1px solid #e0e0e0', padding: '20px', marginBottom: '20px', borderRadius: '8px' }}>
                  <legend style={{ padding: '0 10px', fontWeight: 600 }}>Employment Type</legend>

                  <div className="form-group">
                    <label>Job Type *</label>
                    <div style={{ display: 'flex', gap: '30px', marginTop: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="job_type"
                          value="Permanent"
                          checked={formData.job_type === 'Permanent'}
                          onChange={(e) => setFormData({ ...formData, job_type: e.target.value as any })}
                          style={{ marginRight: '8px' }}
                        />
                        Permanent
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="job_type"
                          value="Contract"
                          checked={formData.job_type === 'Contract'}
                          onChange={(e) => setFormData({ ...formData, job_type: e.target.value as any })}
                          style={{ marginRight: '8px' }}
                        />
                        Contract
                      </label>
                    </div>
                  </div>

                  {formData.job_type === 'Contract' && (
                    <div className="form-group">
                      <label>Duration</label>
                      <input
                        type="text"
                        placeholder="e.g., 6 months, 1 year"
                        value={formData.duration || ''}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={formData.start_date || ''}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                </fieldset>

                {/* Compensation */}
                <fieldset style={{ border: '1px solid #e0e0e0', padding: '20px', marginBottom: '20px', borderRadius: '8px' }}>
                  <legend style={{ padding: '0 10px', fontWeight: 600 }}>Compensation</legend>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Currency *</label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
                        required
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                      </select>
                    </div>
                  </div>

                  {formData.job_type === 'Contract' ? (
                    <div className="form-row">
                      <div className="form-group">
                        <label>Hourly Rate Min ($/hr)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g., 50"
                          value={formData.min_rate || ''}
                          onChange={(e) => setFormData({ ...formData, min_rate: e.target.value ? parseFloat(e.target.value) : undefined })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Hourly Rate Max ($/hr)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g., 100"
                          value={formData.max_rate || ''}
                          onChange={(e) => setFormData({ ...formData, max_rate: e.target.value ? parseFloat(e.target.value) : undefined })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="form-row">
                      <div className="form-group">
                        <label>Annual Salary Min</label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="e.g., 80000"
                          value={formData.salary_min || ''}
                          onChange={(e) => setFormData({ ...formData, salary_min: e.target.value ? parseFloat(e.target.value) : undefined })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Annual Salary Max</label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="e.g., 120000"
                          value={formData.salary_max || ''}
                          onChange={(e) => setFormData({ ...formData, salary_max: e.target.value ? parseFloat(e.target.value) : undefined })}
                        />
                      </div>
                    </div>
                  )}
                </fieldset>

                {/* Form Actions */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    style={{ flex: 1 }}
                  >
                    {saving ? 'Posting...' : editingId ? 'Update Job Posting' : 'Post Job'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    disabled={saving}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Job Postings List */}
          {jobPostings.length === 0 ? (
            <div style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#666'
            }}>
              <p style={{ fontSize: '16px', marginBottom: '10px' }}>No job postings yet</p>
              <p style={{ fontSize: '14px', color: '#999' }}>Click "Post New Job" to create your first job posting</p>
            </div>
          ) : (
            <div>
              {jobPostings.map((job) => (
                <div
                  key={job.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '24px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  {/* Header with Title and Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#2c3e50' }}>{job.title}</h3>
                      <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
                        <strong>{job.product_author}</strong> - {job.product} - {job.role}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {canManageJobs ? (
                        <>
                          <button
                            className="btn btn-small"
                            onClick={() => {
                              setFormData(job);
                              setEditingId(job.id!);
                              setShowForm(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-small"
                            style={{ backgroundColor: '#dc3545', color: 'white' }}
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this job posting?')) {
                                try {
                                  setSaving(true);
                                  await jobsAPI.deleteJobPosting(job.id!);
                                  setSuccessMessage('Job posting deleted');
                                  setTimeout(() => setSuccessMessage(''), 3000);
                                  await fetchJobPostings();
                                } catch (err: any) {
                                  setError(err.response?.data?.detail || 'Failed to delete job posting');
                                } finally {
                                  setSaving(false);
                                }
                              }
                            }}
                            disabled={saving}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#999', fontStyle: 'italic', padding: '4px 8px' }}>
                          View Only (Read-Only Access)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '16px',
                    marginBottom: '16px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    {/* Job Type */}
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#999', textTransform: 'uppercase' }}>Job Type</p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#2c3e50', fontWeight: '500' }}>
                        {job.job_type || 'Not specified'}
                      </p>
                    </div>

                    {/* Duration (for contracts) */}
                    {job.job_type === 'Contract' && job.duration && (
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#999', textTransform: 'uppercase' }}>Duration</p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#2c3e50', fontWeight: '500' }}>
                          {job.duration}
                        </p>
                      </div>
                    )}

                    {/* Start Date */}
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#999', textTransform: 'uppercase' }}>Start Date</p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#2c3e50', fontWeight: '500' }}>
                        {job.start_date ? new Date(job.start_date).toLocaleDateString() : 'Flexible'}
                      </p>
                    </div>

                    {/* Seniority Level */}
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#999', textTransform: 'uppercase' }}>Seniority</p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#2c3e50', fontWeight: '500' }}>
                        {job.seniority || 'Not specified'}
                      </p>
                    </div>

                    {/* Work Type */}
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#999', textTransform: 'uppercase' }}>Work Type</p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#2c3e50', fontWeight: '500' }}>
                        {job.work_type || 'Not specified'}
                      </p>
                    </div>

                    {/* Location */}
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#999', textTransform: 'uppercase' }}>Location</p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#2c3e50', fontWeight: '500' }}>
                        {job.location || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {/* Compensation */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '20px',
                    marginBottom: '16px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #f0f0f0',
                    alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#999', textTransform: 'uppercase' }}>Currency</p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#2c3e50', fontWeight: '500' }}>
                        {job.currency || 'USD'}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#999', textTransform: 'uppercase' }}>
                        {job.job_type === 'Contract' ? 'Hourly Rate' : 'Annual Salary'}
                      </p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#27ae60', fontWeight: '600' }}>
                        {job.job_type === 'Contract' 
                          ? (job.min_rate && job.max_rate 
                            ? `${job.currency || 'USD'} ${job.min_rate} - ${job.max_rate}/hr`
                            : job.min_rate
                            ? `${job.currency || 'USD'} ${job.min_rate}+/hr`
                            : 'Not specified')
                          : (job.salary_min && job.salary_max
                            ? `${job.currency || 'USD'} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}/yr`
                            : job.salary_min
                            ? `${job.currency || 'USD'} ${job.salary_min.toLocaleString()}+/yr`
                            : 'Not specified')
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterJobPostingPage;
