import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authStore';
import { jobsAPI } from '../api/client';
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
  min_rate?: number;
  max_rate?: number;
  status?: string;
}

const RecruiterJobPostingPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<JobPosting>({
    title: '',
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
  });

  useEffect(() => {
    fetchJobPostings();
  }, []);

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
    
    if (!formData.title || !formData.description || !formData.role) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      if (editingId) {
        await jobsAPI.updateJobPosting(editingId, formData);
      } else {
        await jobsAPI.createJobPosting(formData);
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
      title: '',
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
        <h1>Recruiter Portal - Job Postings</h1>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </header>

      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-content">
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Create New Posting Button */}
          <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>My Job Postings</h2>
            <button
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setEditingId(null);
                setShowForm(!showForm);
              }}
              style={{ fontSize: '14px' }}
            >
              {showForm ? '✕ Close Form' : '+ Post New Job'}
            </button>
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
                    <label>Job Title *</label>
                    <input
                      type="text"
                      placeholder="e.g., Senior Oracle Fusion Consultant"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

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

                  <div className="form-row">
                    <div className="form-group">
                      <label>Product *</label>
                      <input
                        type="text"
                        placeholder="e.g., Oracle Fusion"
                        value={formData.product}
                        onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Role *</label>
                      <input
                        type="text"
                        placeholder="e.g., Functional Consultant"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        required
                      />
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

                  <div className="form-row">
                    <div className="form-group">
                      <label>Hourly Rate Min</label>
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
                      <label>Hourly Rate Max</label>
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
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0' }}>{job.title}</h4>
                      <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
                        {job.product} - {job.role}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
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
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>{job.description}</p>
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
