/**
 * Company Dashboard - Interface for recruiters/HR
 * Tabs: Job Postings, Candidate Feed, Shortlist, Rankings
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI, swipesAPI, jobRolesAPI } from '../api/client';
import { useAuth } from '../context/authStore';
import '../styles/Dashboard.css';

const CompanyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout, companyRole, email } = useAuth();

  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Job form state
  const [newJob, setNewJob] = useState({
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

  // Ontology data
  const [authors, setAuthors] = useState<string[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  // Feed state
  const [feedCandidates, setFeedCandidates] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [currentFeedIndex, setCurrentFeedIndex] = useState(0);

  // Shortlist & Rankings
  const [shortlist, setShortlist] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);
  const [teamWorkload, setTeamWorkload] = useState<any[]>([]);

  useEffect(() => {
    loadJobs();
    loadOntology();
    if (companyRole === 'ADMIN' || companyRole === 'HR') {
      loadTeamWorkload();
    }
  }, []);

  const loadOntology = async () => {
    console.log('[COMPANY-DASHBOARD] Loading ontology (authors)');
    try {
      const authorsRes = await jobRolesAPI.getAuthors();
      const authorsList = authorsRes.data.authors || [];
      console.log(`[COMPANY-DASHBOARD] Authors loaded: ${authorsList.length} items - ${authorsList.join(', ')}`);
      setAuthors(authorsList);
    } catch (err) {
      console.error('[COMPANY-DASHBOARD] Failed to load ontology:', err);
    }
  };

  const handleLoadProducts = async (author?: string) => {
    const authorToUse = author || newJob.product_author;
    if (!authorToUse) {
      console.warn('[COMPANY-DASHBOARD] handleLoadProducts called without author');
      return;
    }
    console.log(`[COMPANY-DASHBOARD] Loading products for author: ${authorToUse}`);
    try {
      const res = await jobRolesAPI.getProducts(authorToUse);
      const productsList = res.data.products || [];
      console.log(`[COMPANY-DASHBOARD] Products loaded: ${productsList.length} items - ${productsList.join(', ')}`);
      setProducts(productsList);
      setRoles([]);
    } catch (err) {
      console.error(`[COMPANY-DASHBOARD] Failed to load products for ${authorToUse}:`, err);
    }
  };

  const handleLoadRoles = async (author?: string, product?: string) => {
    const authorToUse = author || newJob.product_author;
    const productToUse = product || newJob.product;
    if (!authorToUse || !productToUse) {
      console.warn('[COMPANY-DASHBOARD] handleLoadRoles called without author or product');
      return;
    }
    console.log(`[COMPANY-DASHBOARD] Loading roles for author=${authorToUse}, product=${productToUse}`);
    try {
      const res = await jobRolesAPI.getRoles(authorToUse, productToUse);
      const rolesList = res.data.roles || [];
      console.log(`[COMPANY-DASHBOARD] Roles loaded: ${rolesList.length} items`);
      console.log('[COMPANY-DASHBOARD] Roles:', rolesList);
      setRoles(rolesList);
    } catch (err) {
      console.error(`[COMPANY-DASHBOARD] Failed to load roles for ${authorToUse}/${productToUse}:`, err);
      console.error('Failed to load roles', err);
    }
  };

  const loadJobs = async () => {
    console.log(`[COMPANY-DASHBOARD] Loading jobs for company (role: ${companyRole})`);
    try {
      let response;
      
      // Admin/HR can see all company jobs
      if (companyRole === 'ADMIN' || companyRole === 'HR') {
        console.log('[COMPANY-DASHBOARD] User is ADMIN/HR - fetching all company postings');
        response = await jobsAPI.getCompanyAllPostings();
      } else {
        // Recruiters see only their own jobs (created by them)
        console.log('[COMPANY-DASHBOARD] User is RECRUITER - fetching their accessible postings');
        response = await jobsAPI.getRecruiterAccessiblePostings();
      }
      
      console.log(`[COMPANY-DASHBOARD] Jobs loaded successfully: ${response.data?.length || 0} jobs found`);
      setJobs(response.data || []);
      if (response.data?.length > 0) {
        setSelectedJobId(response.data[0].id);
        console.log(`[COMPANY-DASHBOARD] First job selected: ID ${response.data[0].id}`);
      }
      setError('');
    } catch (err) {
      console.error('[COMPANY-DASHBOARD] Failed to load jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadCandidateFeed = async (jobId: number) => {
    console.log(`[COMPANY-DASHBOARD] Loading candidate feed for job ${jobId}`);
    setFeedLoading(true);
    try {
      const response = await swipesAPI.getCandidateFeed(jobId, 0, 10);
      console.log(`[COMPANY-DASHBOARD] Candidate feed loaded: ${response.data?.candidates?.length || 0} candidates`);
      setFeedCandidates(response.data?.candidates || []);
      setCurrentFeedIndex(0);
    } catch (err) {
      console.error('[COMPANY-DASHBOARD] Failed to load candidate feed:', err);
    } finally {
      setFeedLoading(false);
    }
  };

  const loadShortlist = async (jobId: number) => {
    console.log(`[COMPANY-DASHBOARD] Loading shortlist for job ${jobId}`);
    try {
      const response = await swipesAPI.getShortlist(jobId);
      console.log(`[COMPANY-DASHBOARD] Shortlist loaded: ${(response.data as any)?.candidates?.length || 0} candidates`);
      setShortlist((response.data as any)?.candidates || []);
    } catch (err) {
      console.error('[COMPANY-DASHBOARD] Failed to load shortlist:', err);
    }
  };

  const loadRankings = async (jobId: number) => {
    console.log(`[COMPANY-DASHBOARD] Loading rankings for job ${jobId}`);
    try {
      const response = await swipesAPI.getRanking(jobId);
      console.log(`[COMPANY-DASHBOARD] Rankings loaded: ${(response.data as any)?.ranked_candidates?.length || 0} candidates`);
      setRankings((response.data as any)?.ranked_candidates || []);
    } catch (err) {
      console.error('[COMPANY-DASHBOARD] Failed to load rankings:', err);
    }
  };

  const handleCreateJob = async () => {
    console.log('[COMPANY-DASHBOARD] Creating new job - validating form');
    if (!newJob.title || !newJob.description) {
      console.error('[COMPANY-DASHBOARD] Form validation failed - missing title or description');
      setError('Title and description are required');
      return;
    }
    if (!newJob.product_author || !newJob.product || !newJob.role) {
      console.error('[COMPANY-DASHBOARD] Form validation failed - missing required fields');
      setError('Product Author, Product, and Role are required');
      return;
    }
    
    console.log('[COMPANY-DASHBOARD] Form validation passed - creating job');
    console.log(`[COMPANY-DASHBOARD] Job details: title=${newJob.title}, author=${newJob.product_author}, product=${newJob.product}, role=${newJob.role}`);
    try {
      console.log('[COMPANY-DASHBOARD] Sending job creation request to API');
      await jobsAPI.create(newJob);
      console.log('[COMPANY-DASHBOARD] Job created successfully - reloading jobs list');
      await loadJobs();
      console.log('[COMPANY-DASHBOARD] Jobs list reloaded - resetting form');
      setNewJob({
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
      setProducts([]);
      setRoles([]);
      console.log('[COMPANY-DASHBOARD] Form reset complete');
      alert('Job created successfully!');
    } catch (err) {
      console.error('[COMPANY-DASHBOARD] Job creation failed:', err);
      setError('Failed to create job');
      console.error(err);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await jobsAPI.delete(jobId);
      await loadJobs();
    } catch (err) {
      setError('Failed to delete job');
      console.error(err);
    }
  };

  const handleLikeCandidate = async (candidateId: number) => {
    if (!selectedJobId) return;
    try {
      await swipesAPI.like(selectedJobId, candidateId);
      // Move to next candidate
      const nextIndex = currentFeedIndex + 1;
      if (nextIndex < feedCandidates.length) {
        setCurrentFeedIndex(nextIndex);
      } else {
        alert('End of candidates for this job');
      }
    } catch (err) {
      console.error('Failed to like candidate', err);
    }
  };

  const handlePassCandidate = async (candidateId: number) => {
    if (!selectedJobId) return;
    try {
      await swipesAPI.pass(selectedJobId, candidateId);
      // Move to next candidate
      const nextIndex = currentFeedIndex + 1;
      if (nextIndex < feedCandidates.length) {
        setCurrentFeedIndex(nextIndex);
      } else {
        alert('End of candidates for this job');
      }
    } catch (err) {
      console.error('Failed to pass on candidate', err);
    }
  };

  const loadTeamWorkload = async () => {
    console.log('[COMPANY-DASHBOARD] Loading team workload');
    try {
      const response = await jobsAPI.getTeamWorkload();
      console.log('[COMPANY-DASHBOARD] Team workload loaded:', response.data);
      setTeamWorkload(response.data || []);
    } catch (err) {
      console.error('[COMPANY-DASHBOARD] Failed to load team workload:', err);
    }
  };

  const handleAssignJob = async (jobId: number, assignedToUserId: number) => {
    console.log(`[COMPANY-DASHBOARD] Assigning job ${jobId} to recruiter ${assignedToUserId}`);
    try {
      await jobsAPI.assignJobToRecruiter(jobId, assignedToUserId);
      console.log('[COMPANY-DASHBOARD] Job assigned successfully');
      alert('Job assigned successfully!');
      await loadTeamWorkload();
      await loadJobs();
    } catch (err) {
      console.error('[COMPANY-DASHBOARD] Failed to assign job:', err);
      alert('Failed to assign job');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <div className="dashboard-container"><p>Loading...</p></div>;

  const currentCandidate = feedCandidates[currentFeedIndex];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Recruiter Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
            Signed in as: <strong>{email}</strong> ({companyRole})
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/recruiter-job-posting')} style={{ fontSize: '14px' }}>
            📝 Job Posting Portal
          </button>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <nav className="dashboard-tabs">
        <button className={`tab ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>📋 Job Management</button>
        <button className={`tab ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => { setActiveTab('feed'); selectedJobId && loadCandidateFeed(selectedJobId); }}>Candidate Feed</button>
        <button className={`tab ${activeTab === 'shortlist' ? 'active' : ''}`} onClick={() => { setActiveTab('shortlist'); selectedJobId && loadShortlist(selectedJobId); }}>Shortlist</button>
        <button className={`tab ${activeTab === 'rankings' ? 'active' : ''}`} onClick={() => { setActiveTab('rankings'); selectedJobId && loadRankings(selectedJobId); }}>Rankings</button>
        {(companyRole === 'ADMIN' || companyRole === 'HR') && (
          <button className={`tab ${activeTab === 'team' ? 'active' : ''}`} onClick={() => { setActiveTab('team'); loadTeamWorkload(); }}>👥 Team Management</button>
        )}
      </nav>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-content">
        {/* Job Management Tab */}
        {activeTab === 'jobs' && (
          <div className="jobs-management-section">
            <h2>📋 All Job Postings</h2>
            {jobs.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>No job postings yet</p>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '20px',
                marginTop: '20px'
              }}>
                {jobs.map((job: any) => (
                  <div key={job.id} style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ marginBottom: '16px' }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{job.title}</h3>
                      <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '14px' }}>
                        <strong>{job.product_author}</strong> - {job.product} - {job.role}
                      </p>
                      <p style={{ margin: '0', color: '#999', fontSize: '12px' }}>
                        {job.location} • {job.work_type}
                      </p>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px',
                      marginBottom: '16px',
                      paddingBottom: '16px',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999' }}>Rate</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>${job.min_rate} - ${job.max_rate}</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999' }}>Duration</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{job.duration || 'Not specified'}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-small"
                        onClick={() => navigate('/recruiter-job-posting', { state: { editJobId: job.id } })}
                        style={{ flex: 1, fontSize: '14px' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-small"
                        style={{ flex: 1, fontSize: '14px', backgroundColor: '#dc3545', color: 'white' }}
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this job posting?')) {
                            try {
                              await jobsAPI.deleteJobPosting(job.id);
                              setError('');
                              loadJobs();
                              alert('Job deleted successfully');
                            } catch (err: any) {
                              setError(err.response?.data?.detail || 'Failed to delete job');
                            }
                          }
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Candidate Feed Tab */}
        {activeTab === 'feed' && (
          <div className="feed-section">
            <h2>Candidate Feed</h2>
            {selectedJobId && jobs.find(j => j.id === selectedJobId) && (
              <>
                <p>Job: <strong>{jobs.find(j => j.id === selectedJobId)?.title}</strong></p>
                {feedLoading && <p>Loading candidates...</p>}
                {!feedLoading && currentCandidate ? (
                  <div className="candidate-card">
                    <div className="candidate-info">
                      <h3>{currentCandidate.name}</h3>
                      <p><strong>Location:</strong> {currentCandidate.location}</p>
                      <p><strong>Experience:</strong> {currentCandidate.years_experience} years</p>
                      <p><strong>Rate:</strong> ${currentCandidate.rate_min} - ${currentCandidate.rate_max}/hr</p>
                      <p><strong>Availability:</strong> {currentCandidate.availability}</p>
                      <p><strong>Work Type:</strong> {currentCandidate.work_type}</p>
                      {currentCandidate.summary && <p><strong>Summary:</strong> {currentCandidate.summary}</p>}
                      
                      <div className="skills-section">
                        <h4>Skills ({currentCandidate.skills?.length || 0})</h4>
                        <div className="skills-list">
                          {currentCandidate.skills?.map((skill: any) => (
                            <span key={skill.id} className="skill-badge">{skill.name} {skill.level && `(${skill.level})`}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="candidate-actions">
                      <button className="btn btn-success" onClick={() => handleLikeCandidate(currentCandidate.id)}>👍 Like</button>
                      <button className="btn btn-danger" onClick={() => handlePassCandidate(currentCandidate.id)}>👎 Pass</button>
                    </div>
                    <p className="feed-counter">{currentFeedIndex + 1} / {feedCandidates.length}</p>
                  </div>
                ) : (
                  <p>No more candidates for this job</p>
                )}
              </>
            )}
            {!selectedJobId && <p>Please select a job first</p>}
          </div>
        )}

        {/* Shortlist Tab */}
        {activeTab === 'shortlist' && (
          <div className="shortlist-section">
            <h2>Shortlisted Candidates</h2>
            {selectedJobId && (
              <>
                <p>Job: <strong>{jobs.find(j => j.id === selectedJobId)?.title}</strong></p>
                {shortlist.length > 0 ? (
                  <table className="candidates-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Experience</th>
                        <th>Match Score</th>
                        <th>Rate Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shortlist.map((candidate: any) => (
                        <tr key={candidate.id}>
                          <td>{candidate.name}</td>
                          <td>{candidate.location}</td>
                          <td>{candidate.years_experience} years</td>
                          <td><strong>{candidate.match_score?.toFixed(0)}%</strong></td>
                          <td>${candidate.rate_min} - ${candidate.rate_max}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No shortlisted candidates yet</p>
                )}
              </>
            )}
            {!selectedJobId && <p>Please select a job first</p>}
          </div>
        )}

        {/* Rankings Tab */}
        {activeTab === 'rankings' && (
          <div className="rankings-section">
            <h2>Ranked Candidates</h2>
            {selectedJobId && (
              <>
                <p>Job: <strong>{jobs.find(j => j.id === selectedJobId)?.title}</strong></p>
                {rankings.length > 0 ? (
                  <div className="rankings-list">
                    {rankings.map((candidate: any, index: number) => (
                      <div key={candidate.id} className="ranking-item">
                        <div className="rank-badge">#{index + 1}</div>
                        <div className="rank-info">
                          <h4>{candidate.name}</h4>
                          <p>{candidate.location} • {candidate.years_experience} years exp</p>
                          {candidate.explanation && <p className="explanation">{candidate.explanation}</p>}
                        </div>
                        <div className="rank-score">{candidate.match_score?.toFixed(0)}%</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No ranked candidates yet</p>
                )}
              </>
            )}
            {!selectedJobId && <p>Please select a job first</p>}
          </div>
        )}

        {/* Team Management Tab */}
        {activeTab === 'team' && (
          <div className="team-section">
            <h2>👥 Team Management & Workload</h2>
            {teamWorkload.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd', backgroundColor: '#f5f7ff' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Team Member</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Role</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Jobs Created</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Jobs Assigned</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamWorkload.map((member: any) => (
                      <tr key={member.recruiter_id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>
                          <strong>{member.recruiter_name}</strong>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            backgroundColor: member.role === 'ADMIN' ? '#667eea' : member.role === 'HR' ? '#764ba2' : '#4a9eff',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 500
                          }}>
                            {member.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            width: '32px',
                            height: '32px',
                            lineHeight: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#f0f3ff',
                            color: '#667eea',
                            fontWeight: 600
                          }}>
                            {member.jobs_created}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            width: '32px',
                            height: '32px',
                            lineHeight: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#fff3f0',
                            color: '#d32f2f',
                            fontWeight: 600
                          }}>
                            {member.jobs_assigned}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <strong style={{ fontSize: '16px' }}>{member.total_jobs}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No team members or workload data available</p>
            )}

            <h3 style={{ marginTop: '32px' }}>Assign Job to Team Member</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div>
                <label>Select Job</label>
                <select
                  value={selectedJobId || ''}
                  onChange={(e) => setSelectedJobId(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select a job...</option>
                  {jobs.map((job: any) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Assign to Recruiter</label>
                <select
                  onChange={(e) => {
                    const assignedToUserId = parseInt(e.target.value);
                    if (selectedJobId && assignedToUserId) {
                      handleAssignJob(selectedJobId, assignedToUserId);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Choose recruiter...</option>
                  {teamWorkload.map((member: any) => (
                    <option key={member.recruiter_id} value={member.recruiter_id}>
                      {member.recruiter_name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default CompanyDashboard;
