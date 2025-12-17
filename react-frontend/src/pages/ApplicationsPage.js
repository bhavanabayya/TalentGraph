import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApplicationsPage = ({ API_BASE, authToken, candidateId }) => {
  const [jobRoles, setJobRoles] = useState({});
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [roleFitScore, setRoleFitScore] = useState(null);

  const [formData, setFormData] = useState({
    author: 'Select...',
    product: '',
    role: '',
    resumeId: '',
  });

  const headers = { Authorization: `Bearer ${authToken}` };

  const loadData = async () => {
    try {
      const [rolesResp, resumesResp] = await Promise.all([
        axios.get(`${API_BASE}/job-roles`),
        axios.get(`${API_BASE}/candidates/${candidateId}/resumes`, { headers }),
      ]);
      setJobRoles(rolesResp.data.product_authors || {});
      setResumes(resumesResp.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!candidateId) {
      setMessage('Please create your profile first.');
      setMessageType('warning');
      setLoading(false);
      return;
    }
    loadData();
  }, [candidateId, API_BASE]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGetRoleFit = async (e) => {
    e.preventDefault();
    if (!formData.author || !formData.product || !formData.role || !formData.resumeId) {
      setMessage('Please fill in all fields.');
      setMessageType('error');
      return;
    }

    try {
      const resp = await axios.post(
        `${API_BASE}/candidates/${candidateId}/role-fit`,
        {
          product_author: formData.author,
          product: formData.product,
          job_role: formData.role,
          resume_id: parseInt(formData.resumeId),
        },
        { headers }
      );
      setRoleFitScore(resp.data);
      setMessage('Role-fit score computed!');
      setMessageType('success');
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Failed to compute role fit score');
      setMessageType('error');
    }
  };

  const availableProducts = formData.author !== 'Select...' && jobRoles[formData.author]
    ? Object.keys(jobRoles[formData.author].products)
    : [];

  const availableRoles = formData.product && formData.author !== 'Select...'
    ? jobRoles[formData.author].products[formData.product]?.roles || []
    : [];

  if (loading) {
    return <div className="container"><p className="ds-muted">Loading applications...</p></div>;
  }

  if (!candidateId) {
    return (
      <div className="container">
        <h1 className="ds-h1">Applications & Role Fit</h1>
        <div className="alert alert-warning">Please create your profile first on the Profile page.</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="ds-h1">Applications & Role Fit</h1>
      <p className="ds-muted">Test how well your profile matches specific job roles.</p>

      {message && (
        <div className={`alert alert-${messageType}`} style={{ marginTop: '20px' }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: '40px' }}>
        <h2 className="ds-h2">Compute Role Fit Score</h2>
        <p className="ds-muted">Select a job role and resume to see your fit score.</p>

        <form onSubmit={handleGetRoleFit} style={{ marginTop: '20px' }}>
          <div className="cols-2">
            <div className="form-group">
              <label>Product Author</label>
              <select name="author" value={formData.author} onChange={handleInputChange}>
                <option value="Select...">Select...</option>
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
          </div>

          {availableRoles.length > 0 && (
            <div className="form-group">
              <label>Job Role</label>
              <select name="role" value={formData.role} onChange={handleInputChange}>
                <option value="">Select Role</option>
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Select Resume</label>
            <select name="resumeId" value={formData.resumeId} onChange={handleInputChange}>
              <option value="">Select Resume</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.filename}
                </option>
              ))}
            </select>
          </div>

          {resumes.length === 0 && (
            <div className="alert alert-info">
              No resumes available. Please upload a resume first on the Resumes page.
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={resumes.length === 0}
          >
            Get Role Fit Score
          </button>
        </form>

        {roleFitScore && (
          <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
            <h3 className="ds-h3">Role Fit Results</h3>
            <div style={{ marginTop: '20px' }}>
              <p className="ds-body">
                <strong>Score:</strong> {roleFitScore.score}%
              </p>
              <p className="ds-body">
                <strong>Role:</strong> {roleFitScore.job_role}
              </p>
              <p className="ds-body">
                <strong>Product:</strong> {roleFitScore.product}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsPage;
