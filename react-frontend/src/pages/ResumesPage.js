import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const ResumesPage = ({ API_BASE, authToken, candidateId }) => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const headers = { Authorization: `Bearer ${authToken}` };

  const loadResumes = useCallback(async () => {
    try {
      const resp = await axios.get(`${API_BASE}/candidates/${candidateId}/resumes`, { headers });
      setResumes(resp.data);
    } catch (error) {
      console.error('Error loading resumes:', error);
    }
    setLoading(false);
  }, [candidateId, API_BASE, headers]);

  useEffect(() => {
    if (!candidateId) {
      setMessage('Please create your profile first.');
      setMessageType('warning');
      setLoading(false);
      return;
    }
    loadResumes();
  }, [candidateId, loadResumes]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage('Please select a file.');
      setMessageType('error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await axios.post(
        `${API_BASE}/candidates/${candidateId}/resumes`,
        formData,
        { headers: { ...headers, 'Content-Type': 'multipart/form-data' } }
      );
      setMessage('Resume uploaded successfully!');
      setMessageType('success');
      setSelectedFile(null);
      loadResumes();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Failed to upload resume');
      setMessageType('error');
    }
    setUploading(false);
  };

  if (loading) {
    return <div className="container"><p className="ds-muted">Loading resumes...</p></div>;
  }

  if (!candidateId) {
    return (
      <div className="container">
        <h1 className="ds-h1">Resume Management</h1>
        <div className="alert alert-warning">Please create your profile first on the Profile page.</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="ds-h1">Resume Management</h1>
      <p className="ds-muted">Upload and manage your professional resumes.</p>

      {message && (
        <div className={`alert alert-${messageType}`} style={{ marginTop: '20px' }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: '40px' }}>
        <h2 className="ds-h2">Upload Your Resume</h2>
        <p className="ds-soft">Upload your resume for potential matches and role fit scoring.</p>

        <form onSubmit={handleUpload} style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label>Select Resume (PDF/DOC/DOCX)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={uploading || !selectedFile}
          >
            {uploading ? 'Uploading...' : 'Upload Resume'}
          </button>
        </form>
      </div>

      <div className="spacer-lg">
        <h2 className="ds-h2">Saved Resumes</h2>

        {resumes.length === 0 ? (
          <div className="alert alert-info">
            No resumes uploaded yet. Upload your first resume above!
          </div>
        ) : (
          <div style={{ marginTop: '20px' }}>
            {resumes.map((resume) => (
              <div
                key={resume.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  borderBottom: '1px solid rgba(17, 24, 39, 0.1)',
                }}
              >
                <div>
                  <p className="ds-body">{resume.filename}</p>
                </div>
                <button
                  onClick={() => {
                    window.open(
                      `${API_BASE}/candidates/${candidateId}/resumes/${resume.id}/download`,
                      '_blank'
                    );
                  }}
                  className="btn btn-primary"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumesPage;
