import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidateAPI, matchesAPI, jobsAPI } from '../api/client';
import '../styles/EnterpriseDashboard.css';

interface RecruiterRequest {
  id: number;
  job: {
    id: number;
    title: string;
    company_name?: string;
    location?: string;
  };
  recruiter: {
    name: string;
    email: string;
  };
  message?: string;
  sent_at: string;
  expires_at?: string;
  match_score?: number;
}

interface JobDetails {
  id: number;
  title: string;
  description?: string;
  company_name?: string;
  location?: string;
  role?: string;
  seniority?: string;
  job_type?: string;
  work_type?: string;
  min_rate?: number;
  max_rate?: number;
  currency?: string;
  required_skills?: string;
  nice_to_have_skills?: string;
  duration?: string;
  start_date?: string;
}

const RequestsInboxPage: React.FC = () => {
  const navigate = useNavigate();
  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [requests, setRequests] = useState<RecruiterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingToId, setRespondingToId] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobDetails | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);

  useEffect(() => {
    fetchCandidateProfile();
  }, []);

  useEffect(() => {
    if (candidateId) {
      fetchRequests();
    }
  }, [candidateId]);

  const fetchCandidateProfile = async () => {
    try {
      const response = await candidateAPI.getMe();
      setCandidateId(response.data.id || null);
    } catch (error) {
      console.error('Failed to fetch candidate profile:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      if (candidateId) {
        const response = await matchesAPI.getPendingAsks(candidateId);
        setRequests(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: number) => {
    try {
      setRespondingToId(requestId);
      await matchesAPI.respondToAsk(requestId, true);
      
      // Remove from list
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      alert('Failed to accept invitation. Please try again.');
    } finally {
      setRespondingToId(null);
    }
  };

  const handleDecline = async (requestId: number) => {
    try {
      setRespondingToId(requestId);
      await matchesAPI.respondToAsk(requestId, false);
      
      // Remove from list
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      alert('Invitation declined.');
    } catch (error) {
      console.error('Failed to decline invitation:', error);
      alert('Failed to decline invitation. Please try again.');
    } finally {
      setRespondingToId(null);
    }
  };

  const handleViewJob = async (jobId: number) => {
    try {
      const response = await jobsAPI.get(jobId);
      setSelectedJob(response.data);
      setShowJobModal(true);
    } catch (error) {
      console.error('Failed to fetch job details:', error);
      alert('Failed to load job details. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="enterprise-dashboard">
        <div className="enterprise-content">
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--neutral-500)' }}>
            <div style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Loading invitations...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-dashboard">
      {/* Header */}
      <header className="enterprise-header">
        <div className="enterprise-header__brand">
          <h1 className="enterprise-header__logo">TalentGraph</h1>
          <div>
            <p className="enterprise-header__user-name">Recruiter Invitations</p>
            <p className="enterprise-header__user-role">Companies interested in your profile</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/candidate-dashboard')}
          className="enterprise-btn enterprise-btn--outline"
        >
          ← Back to Dashboard
        </button>
      </header>

      {/* Content */}
      <div className="enterprise-content">
        <div className="enterprise-section">
          <div className="enterprise-section__header">
            <div>
              <h1 className="enterprise-section__title">Your Invitations</h1>
              <p className="enterprise-section__subtitle">
                {requests.length === 0 
                  ? 'No pending invitations at this time'
                  : `${requests.length} ${requests.length === 1 ? 'company has' : 'companies have'} invited you to apply`
                }
              </p>
            </div>
          </div>

          <div className="enterprise-section__header">
            <div>
              <h1 className="enterprise-section__title">Your Invitations</h1>
              <p className="enterprise-section__subtitle">
                {requests.length === 0 
                  ? 'No pending invitations at this time'
                  : `${requests.length} ${requests.length === 1 ? 'company has' : 'companies have'} invited you to apply`
                }
              </p>
            </div>
          </div>

          {/* Invitations List */}
          {requests.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '2px dashed var(--neutral-300)',
              marginTop: '2rem'
            }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-400)" strokeWidth="1.5" style={{ margin: '0 auto 1.5rem' }}>
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--neutral-700)', marginBottom: '0.5rem' }}>
                No pending invitations
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500)' }}>
                Companies will appear here when they invite you to apply
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="enterprise-card"
                  style={{
                    border: '1px solid var(--neutral-200)',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Header Row */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '1.25rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--neutral-100)'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'var(--primary-indigo)',
                        marginBottom: '0.5rem',
                        cursor: 'pointer',
                        transition: 'color 0.2s'
                      }}
                      onClick={() => handleViewJob(request.job.id)}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-purple)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--primary-indigo)'}
                      >
                        {request.job.title}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', marginBottom: '0.5rem', fontWeight: 500 }}>
                        {request.job.company_name || 'Company'}
                      </p>
                      {request.job.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--neutral-500)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          {request.job.location}
                        </div>
                      )}
                    </div>

                    {/* Match Score */}
                    {request.match_score && (
                      <div style={{
                        background: 'linear-gradient(135deg, var(--success-green) 0%, #059669 100%)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                        letterSpacing: '0.02em'
                      }}>
                        {request.match_score}% MATCH
                      </div>
                    )}
                  </div>

                  {/* Recruiter Message */}
                  {request.message && (
                    <div style={{
                      backgroundColor: 'var(--neutral-50)',
                      border: '1px solid var(--neutral-200)',
                      borderLeft: '3px solid var(--primary-indigo)',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1.25rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-indigo)" strokeWidth="2">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-indigo)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Message from {request.recruiter.name}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--neutral-700)', lineHeight: '1.6', fontStyle: 'italic', margin: 0 }}>
                        "{request.message}"
                      </p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div style={{
                    display: 'flex',
                    gap: '1.5rem',
                    fontSize: '0.8125rem',
                    color: 'var(--neutral-500)',
                    marginBottom: '1.25rem',
                    fontWeight: 500
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Received {new Date(request.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    {request.expires_at && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--warning-amber)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        Expires {new Date(request.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => handleDecline(request.id)}
                      disabled={respondingToId === request.id}
                      className="enterprise-btn enterprise-btn--outline"
                      style={{
                        flex: 1,
                        opacity: respondingToId === request.id ? 0.5 : 1,
                        cursor: respondingToId === request.id ? 'not-allowed' : 'pointer',
                        color: 'var(--neutral-600)',
                        borderColor: 'var(--neutral-300)'
                      }}
                    >
                      Decline
                    </button>

                    <button
                      onClick={() => handleViewJob(request.job.id)}
                      className="enterprise-btn enterprise-btn--outline"
                      style={{ flex: 1 }}
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => handleAccept(request.id)}
                      disabled={respondingToId === request.id}
                      className="enterprise-btn enterprise-btn--primary"
                      style={{
                        flex: 2,
                        opacity: respondingToId === request.id ? 0.5 : 1,
                        cursor: respondingToId === request.id ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {respondingToId === request.id ? 'Processing...' : 'Accept & Apply →'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          padding: '2rem'
        }} onClick={() => setShowJobModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-xl)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid var(--neutral-200)' }}>
              <div>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem', color: 'var(--primary-indigo)', fontWeight: 700 }}>
                  {selectedJob.title}
                </h2>
                {selectedJob.company_name && (
                  <p style={{ margin: 0, fontSize: '1rem', color: 'var(--neutral-600)', fontWeight: 500 }}>
                    {selectedJob.company_name}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowJobModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--neutral-400)',
                  padding: '0.25rem',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Job Details Grid */}
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Basic Info */}
              {selectedJob.description && (
                <div>
                  <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: 'var(--neutral-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Job Description
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--neutral-700)', lineHeight: '1.7' }}>
                    {selectedJob.description}
                  </p>
                </div>
              )}

              {/* Job Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {selectedJob.role && (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Role
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--neutral-800)', fontWeight: 500 }}>
                      {selectedJob.role}
                    </p>
                  </div>
                )}

                {selectedJob.location && (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Location
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--neutral-800)', fontWeight: 500 }}>
                      {selectedJob.location}
                    </p>
                  </div>
                )}

                {selectedJob.seniority && (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Seniority Level
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--neutral-800)', fontWeight: 500 }}>
                      {selectedJob.seniority}
                    </p>
                  </div>
                )}

                {selectedJob.job_type && (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Job Type
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--neutral-800)', fontWeight: 500 }}>
                      {selectedJob.job_type}
                    </p>
                  </div>
                )}

                {selectedJob.work_type && (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Work Type
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--neutral-800)', fontWeight: 500 }}>
                      {selectedJob.work_type}
                    </p>
                  </div>
                )}

                {(selectedJob.min_rate || selectedJob.max_rate) && (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Rate Range
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--neutral-800)', fontWeight: 500 }}>
                      {selectedJob.currency || '$'}{selectedJob.min_rate} - {selectedJob.currency || '$'}{selectedJob.max_rate}/hr
                    </p>
                  </div>
                )}

                {selectedJob.duration && (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Duration
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--neutral-800)', fontWeight: 500 }}>
                      {selectedJob.duration}
                    </p>
                  </div>
                )}

                {selectedJob.start_date && (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Start Date
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--neutral-800)', fontWeight: 500 }}>
                      {new Date(selectedJob.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>

              {/* Skills */}
              {selectedJob.required_skills && (
                <div>
                  <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: 'var(--neutral-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Required Skills
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedJob.required_skills.split(',').map((skill, index) => (
                      <span key={index} style={{
                        padding: '0.375rem 0.75rem',
                        backgroundColor: 'var(--indigo-50)',
                        color: 'var(--primary-indigo)',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        border: '1px solid var(--indigo-200)'
                      }}>
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.nice_to_have_skills && (
                <div>
                  <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: 'var(--neutral-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Nice to Have
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedJob.nice_to_have_skills.split(',').map((skill, index) => (
                      <span key={index} style={{
                        padding: '0.375rem 0.75rem',
                        backgroundColor: 'var(--neutral-100)',
                        color: 'var(--neutral-700)',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        border: '1px solid var(--neutral-300)'
                      }}>
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowJobModal(false)}
                className="enterprise-btn enterprise-btn--outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsInboxPage;
