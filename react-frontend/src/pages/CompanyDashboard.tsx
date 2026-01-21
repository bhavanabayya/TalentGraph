/**
 * Company Dashboard - Interface for recruiters/HR
 * Tabs: Job Management, Browse Candidates, Shortlist, Rankings
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI, jobRolesAPI, candidateAPI, recommendationsAPI, matchesAPI } from '../api/client';
import { useAuth } from '../context/authStore';
import '../styles/Dashboard.css';

const CompanyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout, companyRole, email } = useAuth();

  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('browse');
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

  // All Candidates (Browse)
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [browseCandidatesLoading, setBrowseCandidatesLoading] = useState(false);

  // Recommendations
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [swipingCandidateId, setSwipingCandidateId] = useState<number | null>(null);
  const [askMessage, setAskMessage] = useState<{ [key: number]: string }>({});
  const [showAskMessageFor, setShowAskMessageFor] = useState<number | null>(null);

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

  const loadAllCandidates = async () => {
    console.log('[COMPANY-DASHBOARD] Loading all candidates for browse');
    setBrowseCandidatesLoading(true);
    try {
      const response = await candidateAPI.listAllCandidates();
      console.log(`[COMPANY-DASHBOARD] All candidates loaded: ${response.data?.length || 0} candidates`);
      setAllCandidates(response.data || []);
    } catch (err) {
      console.error('[COMPANY-DASHBOARD] Failed to load all candidates:', err);
    } finally {
      setBrowseCandidatesLoading(false);
    }
  };

  const loadRecommendations = async () => {
    console.log('[COMPANY-DASHBOARD] Loading candidate recommendations');
    setRecommendationsLoading(true);
    try {
      const response = await recommendationsAPI.getAllRecommendations(20);
      console.log(`[COMPANY-DASHBOARD] Recommendations loaded: ${response.data?.recommendations?.length || 0} candidates`);
      setRecommendations(response.data?.recommendations || []);
    } catch (err) {
      console.error('[COMPANY-DASHBOARD] Failed to load recommendations:', err);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const handleRecruiterAction = async (candidateId: number, jobId: number, action: 'LIKE' | 'PASS' | 'ASK_TO_APPLY') => {
    try {
      setSwipingCandidateId(candidateId);
      
      const message = action === 'ASK_TO_APPLY' ? askMessage[candidateId] : undefined;
      await matchesAPI.recruiterAction(candidateId, jobId, action, message);
      
      // Remove from recommendations
      setRecommendations(prev => prev.filter(rec => rec.candidate.id !== candidateId));
      
      // Clear message input
      if (action === 'ASK_TO_APPLY') {
        setAskMessage(prev => {
          const updated = { ...prev };
          delete updated[candidateId];
          return updated;
        });
        setShowAskMessageFor(null);
      }
      
      // Show success message
      const actionMessages = {
        'LIKE': '👍 Candidate liked!',
        'PASS': '👎 Candidate passed',
        'ASK_TO_APPLY': '📨 Invitation sent to candidate!'
      };
      alert(actionMessages[action]);
      
    } catch (err: any) {
      console.error('Failed to perform action:', err);
      alert(err.response?.data?.detail || `Failed to ${action.toLowerCase()}`);
    } finally {
      setSwipingCandidateId(null);
    }
  };

  const loadShortlist = async (jobId: number) => {
    console.log(`[COMPANY-DASHBOARD] Loading shortlist for job ${jobId}`);
    try {
      // TODO: Implement via matchesAPI
      // const response = await swipesAPI.getShortlist(jobId);
      // console.log(`[COMPANY-DASHBOARD] Shortlist loaded: ${(response.data as any)?.candidates?.length || 0} candidates`);
      // setShortlist((response.data as any)?.candidates || []);
      console.log('[COMPANY-DASHBOARD] Shortlist feature disabled - use recommendations instead');
    } catch (err) {
      console.error('[COMPANY-DASHBOARD] Failed to load shortlist:', err);
    }
  };

  const loadRankings = async (jobId: number) => {
    console.log(`[COMPANY-DASHBOARD] Loading rankings for job ${jobId}`);
    try {
      // TODO: Implement via matchesAPI
      // const response = await swipesAPI.getRanking(jobId);
      console.log('[COMPANY-DASHBOARD] Rankings feature disabled - use recommendations instead');
      // console.log(`[COMPANY-DASHBOARD] Rankings loaded: ${(response.data as any)?.ranked_candidates?.length || 0} candidates`);
      // setRankings((response.data as any)?.ranked_candidates || []);
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
        <button className={`tab ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => { setActiveTab('browse'); loadAllCandidates(); }}>👥 Browse Candidates</button>
        <button className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`} onClick={() => { setActiveTab('recommendations'); loadRecommendations(); }}>✨ Recommendations</button>
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

        {/* Browse Candidates Tab */}
        {activeTab === 'browse' && (
          <div className="browse-candidates-section">
            <h2>👥 Browse All Candidates</h2>
            {browseCandidatesLoading && <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Loading candidates...</p>}
            {!browseCandidatesLoading && allCandidates.length === 0 && (
              <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>No candidates found</p>
            )}
            {!browseCandidatesLoading && allCandidates.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '20px' }}>
                {allCandidates.map((candidate: any) => (
                  <div key={candidate.id} style={{
                    backgroundColor: 'white',
                    padding: '24px',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    {/* Candidate Header */}
                    <div style={{ marginBottom: '20px', borderBottom: '2px solid #f0f0f0', paddingBottom: '16px' }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', color: '#1976d2' }}>{candidate.name}</h3>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '14px', color: '#666' }}>
                        <span>📧 {candidate.email}</span>
                        <span>📍 {candidate.location || 'Not specified'}</span>
                        <span>💼 {candidate.years_experience || 0} years exp</span>
                        <span>💰 ${candidate.rate_min || 0} - ${candidate.rate_max || 0}/hr</span>
                      </div>
                    </div>

                    {/* Candidate Details Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '16px',
                      marginBottom: '20px'
                    }}>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>Work Type</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{candidate.work_type || 'Not specified'}</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>Availability</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{candidate.availability || 'Not specified'}</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>Status</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{candidate.status || 'active'}</p>
                      </div>
                    </div>

                    {/* Summary */}
                    {candidate.summary && (
                      <div style={{ marginBottom: '20px' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>Summary</p>
                        <p style={{ margin: 0, color: '#666', lineHeight: 1.6 }}>
                          {candidate.summary.length > 300 ? `${candidate.summary.substring(0, 300)}...` : candidate.summary}
                        </p>
                      </div>
                    )}

                    {/* Skills */}
                    {candidate.skills && candidate.skills.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>Skills ({candidate.skills.length})</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {candidate.skills.slice(0, 10).map((skill: any, idx: number) => (
                            <span key={idx} style={{
                              padding: '6px 12px',
                              backgroundColor: '#e3f2fd',
                              color: '#1976d2',
                              borderRadius: '4px',
                              fontSize: '13px'
                            }}>
                              {skill.name} {skill.level && `(${skill.level})`}
                            </span>
                          ))}
                          {candidate.skills.length > 10 && (
                            <span style={{
                              padding: '6px 12px',
                              backgroundColor: '#f5f5f5',
                              color: '#666',
                              borderRadius: '4px',
                              fontSize: '13px',
                              fontWeight: 600
                            }}>
                              +{candidate.skills.length - 10} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Job Preferences Section */}
                    {candidate.job_preferences && candidate.job_preferences.length > 0 && (
                      <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px solid #f0f0f0' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#333' }}>
                          Job Preferences ({candidate.job_preferences.length})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {candidate.job_preferences.map((pref: any, idx: number) => (
                            <div key={idx} style={{
                              padding: '16px',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '6px',
                              border: '1px solid #e0e0e0'
                            }}>
                              <div style={{ marginBottom: '12px' }}>
                                <h5 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#1976d2' }}>
                                  {pref.preference_name || `Preference ${idx + 1}`}
                                </h5>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '14px', color: '#666' }}>
                                  <span><strong>Product:</strong> {pref.product}</span>
                                  <span><strong>Role:</strong> {pref.primary_role}</span>
                                </div>
                              </div>

                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                gap: '12px',
                                marginBottom: '12px'
                              }}>
                                <div>
                                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999' }}>Rate Range</p>
                                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>
                                    ${pref.rate_min || 0} - ${pref.rate_max || 0}/hr
                                  </p>
                                </div>
                                <div>
                                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999' }}>Work Type</p>
                                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{pref.work_type || 'Any'}</p>
                                </div>
                                <div>
                                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999' }}>Location</p>
                                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{pref.location || 'Any'}</p>
                                </div>
                              </div>

                              {pref.required_skills && (() => {
                                try {
                                  const skills = JSON.parse(pref.required_skills);
                                  return skills.length > 0 && (
                                    <div>
                                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#999' }}>Required Skills</p>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {skills.map((skill: any, skillIdx: number) => (
                                          <span key={skillIdx} style={{
                                            padding: '4px 8px',
                                            backgroundColor: '#e8f5e9',
                                            color: '#2e7d32',
                                            borderRadius: '4px',
                                            fontSize: '12px'
                                          }}>
                                            {skill.name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                } catch (e) {
                                  return null;
                                }
                              })()}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="recommendations-section">
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ display: 'inline-block', marginRight: '20px' }}>✨ Candidate Recommendations</h2>
              <button 
                className="btn btn-primary"
                onClick={loadRecommendations}
                disabled={recommendationsLoading}
                style={{ fontSize: '14px' }}
              >
                {recommendationsLoading ? 'Loading...' : '🔄 Refresh Recommendations'}
              </button>
            </div>
            
            <p style={{ color: '#666', marginBottom: '30px', fontSize: '16px' }}>
              Our AI matching engine analyzes all your active job postings and finds the best-matched candidates.
              Matching is based on: <strong>Role & Seniority (40%)</strong>, <strong>Start Date (25%)</strong>, <strong>Location (20%)</strong>, and <strong>Salary (15%)</strong>.
            </p>

            {recommendationsLoading && (
              <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                <p>Analyzing candidates and calculating match scores...</p>
              </div>
            )}

            {!recommendationsLoading && recommendations.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
                <p>No recommendations available. Make sure you have active job postings and candidates in the system.</p>
              </div>
            )}

            {!recommendationsLoading && recommendations.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {recommendations.map((rec: any, idx: number) => (
                  <div key={idx} style={{
                    backgroundColor: 'white',
                    padding: '24px',
                    borderRadius: '8px',
                    border: `2px solid ${rec.match_score >= 70 ? '#4CAF50' : rec.match_score >= 50 ? '#FF9800' : '#2196F3'}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    position: 'relative'
                  }}>
                    {/* Match Score Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      backgroundColor: rec.match_score >= 70 ? '#4CAF50' : rec.match_score >= 50 ? '#FF9800' : '#2196F3',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      {rec.match_score}% Match
                    </div>

                    {/* Candidate Header */}
                    <div style={{ marginBottom: '16px', paddingRight: '120px' }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', color: '#1976d2' }}>
                        {rec.candidate.name}
                      </h3>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '14px', color: '#666' }}>
                        <span>📧 {rec.candidate.email}</span>
                        <span>📍 {rec.candidate.location}</span>
                        <span>💼 {rec.candidate.years_experience} years exp</span>
                        <span>💰 ${rec.candidate.rate_min} - ${rec.candidate.rate_max}/hr</span>
                      </div>
                    </div>

                    {/* Best Match Job */}
                    <div style={{
                      backgroundColor: '#e3f2fd',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ fontSize: '13px', color: '#1976d2', fontWeight: 500 }}>
                        🎯 Best Match For: <strong>{rec.best_match_job_title}</strong>
                      </div>
                    </div>

                    {/* Match Breakdown */}
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '16px',
                      borderRadius: '6px',
                      marginBottom: '16px'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666', textTransform: 'uppercase' }}>
                        Match Breakdown
                      </h4>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '12px'
                      }}>
                        <div>
                          <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Role</div>
                          <div style={{ fontWeight: 'bold', color: '#1976d2' }}>{rec.match_breakdown.role_match}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Availability</div>
                          <div style={{ fontWeight: 'bold', color: '#1976d2' }}>{rec.match_breakdown.date_match}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Location</div>
                          <div style={{ fontWeight: 'bold', color: '#1976d2' }}>{rec.match_breakdown.location_match}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Salary</div>
                          <div style={{ fontWeight: 'bold', color: '#1976d2' }}>{rec.match_breakdown.salary_match}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Matched Preference */}
                    {rec.matched_preference && (
                      <div style={{ marginBottom: '16px' }}>
                        <span style={{
                          backgroundColor: '#e8f5e9',
                          color: '#2e7d32',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: 500
                        }}>
                          ✓ Candidate's "{rec.matched_preference}" preference
                        </span>
                      </div>
                    )}

                    {/* Candidate Summary */}
                    {rec.candidate.summary && (
                      <p style={{ color: '#666', lineHeight: 1.6, marginBottom: '16px' }}>
                        {rec.candidate.summary.length > 200 
                          ? `${rec.candidate.summary.substring(0, 200)}...` 
                          : rec.candidate.summary}
                      </p>
                    )}

                    {/* Skills Preview */}
                    {rec.candidate.skills && rec.candidate.skills.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: 500 }}>
                          Top Skills:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {rec.candidate.skills.slice(0, 5).map((skill: any, skillIdx: number) => (
                            <span key={skillIdx} style={{
                              padding: '4px 10px',
                              backgroundColor: '#e3f2fd',
                              color: '#1976d2',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}>
                              {skill.name} {skill.level && `(${skill.level})`}
                            </span>
                          ))}
                          {rec.candidate.skills.length > 5 && (
                            <span style={{
                              padding: '4px 10px',
                              backgroundColor: '#f5f5f5',
                              color: '#666',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 600
                            }}>
                              +{rec.candidate.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Ask to Apply Section */}
                      {showAskMessageFor === rec.candidate.id && (
                        <div style={{
                          backgroundColor: '#fff3e0',
                          padding: '16px',
                          borderRadius: '6px',
                          border: '1px solid #ff9800'
                        }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#e65100' }}>
                            💬 Add a personal message (optional):
                          </label>
                          <textarea
                            value={askMessage[rec.candidate.id] || ''}
                            onChange={(e) => setAskMessage(prev => ({ ...prev, [rec.candidate.id]: e.target.value }))}
                            placeholder="E.g., We're impressed by your experience in..."
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '12px',
                              borderRadius: '4px',
                              border: '1px solid #ddd',
                              fontSize: '14px',
                              resize: 'vertical'
                            }}
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button 
                          className="btn"
                          onClick={() => handleRecruiterAction(rec.candidate.id, rec.best_match_job_id, 'LIKE')}
                          disabled={swipingCandidateId === rec.candidate.id}
                          style={{ 
                            flex: '1 1 auto',
                            minWidth: '110px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            opacity: swipingCandidateId === rec.candidate.id ? 0.6 : 1
                          }}
                          title="Like this candidate - shows mutual interest"
                        >
                          👍 Like
                        </button>
                        <button 
                          className="btn"
                          onClick={() => handleRecruiterAction(rec.candidate.id, rec.best_match_job_id, 'PASS')}
                          disabled={swipingCandidateId === rec.candidate.id}
                          style={{ 
                            flex: '1 1 auto',
                            minWidth: '110px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            opacity: swipingCandidateId === rec.candidate.id ? 0.6 : 1
                          }}
                          title="Pass on this candidate - won't show again"
                        >
                          👎 Pass
                        </button>
                        {showAskMessageFor === rec.candidate.id ? (
                          <>
                            <button 
                              className="btn"
                              onClick={() => handleRecruiterAction(rec.candidate.id, rec.best_match_job_id, 'ASK_TO_APPLY')}
                              disabled={swipingCandidateId === rec.candidate.id}
                              style={{ 
                                flex: '1 1 auto',
                                minWidth: '150px',
                                backgroundColor: '#FF9800',
                                color: 'white',
                                border: 'none',
                                opacity: swipingCandidateId === rec.candidate.id ? 0.6 : 1
                              }}
                            >
                              📨 Send Invitation
                            </button>
                            <button 
                              className="btn"
                              onClick={() => {
                                setShowAskMessageFor(null);
                                setAskMessage(prev => {
                                  const updated = { ...prev };
                                  delete updated[rec.candidate.id];
                                  return updated;
                                });
                              }}
                              style={{ 
                                flex: '0 0 auto',
                                backgroundColor: '#999',
                                color: 'white',
                                border: 'none'
                              }}
                            >
                              ✖ Cancel
                            </button>
                          </>
                        ) : (
                          <button 
                            className="btn"
                            onClick={() => setShowAskMessageFor(rec.candidate.id)}
                            style={{ 
                              flex: '1 1 auto',
                              minWidth: '150px',
                              backgroundColor: '#FF9800',
                              color: 'white',
                              border: 'none'
                            }}
                            title="Invite candidate to apply to this job"
                          >
                            📨 Ask to Apply
                          </button>
                        )}
                        <button 
                          className="btn btn-primary"
                          onClick={() => navigate(`/candidate/${rec.candidate.id}`)}
                          style={{ flex: '1 1 auto', minWidth: '150px' }}
                        >
                          📄 View Full Profile
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
