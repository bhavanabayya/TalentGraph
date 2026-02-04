/**
 * Company Dashboard - Interface for recruiters/HR
 * Tabs: Job Management, Browse Candidates, Shortlist, Rankings
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI, jobRolesAPI, candidateAPI, recommendationsAPI, matchesAPI } from '../api/client';
import { useAuth } from '../context/authStore';
import '../styles/Dashboard.css';
import '../styles/EnterpriseDashboard.css';

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
  // Removed unused state variables: authors, products, roles

  // All Candidates (Browse)
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [browseCandidatesLoading, setBrowseCandidatesLoading] = useState(false);

  // Recommendations
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [swipingCandidateId, setSwipingCandidateId] = useState<number | null>(null);
  const [askMessage, setAskMessage] = useState<{ [key: number]: string }>({});
  const [showAskMessageFor, setShowAskMessageFor] = useState<number | null>(null);
  const [selectedJobForSwipe, setSelectedJobForSwipe] = useState<number | null>(null);

  // Shortlist & Rankings
  const [shortlist, setShortlist] = useState<any[]>([]);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [rankings] = useState<any[]>([]);
  const [teamWorkload, setTeamWorkload] = useState<any[]>([]);
  
  // Candidate profile modal
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);

  useEffect(() => {
    loadJobs();
    loadOntology();
    if (companyRole === 'ADMIN' || companyRole === 'HR') {
      loadTeamWorkload();
    }
  }, []);

  // Load data when active tab changes
  useEffect(() => {
    if (activeTab === 'browse' && allCandidates.length === 0 && !browseCandidatesLoading) {
      loadAllCandidates();
    } else if (activeTab === 'recommendations' && recommendations.length === 0 && !recommendationsLoading) {
      loadRecommendations();
    }
  }, [activeTab]);

  const loadOntology = async () => {
    console.log('[COMPANY-DASHBOARD] Loading ontology (authors)');
    try {
      const authorsRes = await jobRolesAPI.getAuthors();
      const authorsList = authorsRes.data.authors || [];
      console.log(`[COMPANY-DASHBOARD] Authors loaded: ${authorsList.length} items - ${authorsList.join(', ')}`);
      // setAuthors(authorsList); // Not used in current UI
    } catch (err) {
      console.error('[COMPANY-DASHBOARD] Failed to load ontology:', err);
    }
  };

  const _handleLoadProducts = async (author?: string) => {
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
      // setProducts(productsList); // Not used in current UI
      // setRoles([]); // Not used in current UI
    } catch (err) {
      console.error(`[COMPANY-DASHBOARD] Failed to load products for ${authorToUse}:`, err);
    }
  };

  const _handleLoadRoles = async (author?: string, product?: string) => {
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
      // setRoles(rolesList); // Not used in current UI
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

  const loadShortlist = async (jobId?: number) => {
    console.log(`[COMPANY-DASHBOARD] Loading shortlist`);
    try {
      setShortlistLoading(true);
      // Get company ID from first job
      const companyId = jobs.length > 0 && jobs[0].company_id ? jobs[0].company_id : null;
      if (!companyId) {
        console.warn('[COMPANY-DASHBOARD] No company ID available');
        return;
      }
      const response = await matchesAPI.getRecruiterShortlist(companyId);
      console.log(`[COMPANY-DASHBOARD] Shortlist loaded: ${response.data?.total || 0} candidates`);
      setShortlist(response.data?.shortlisted_candidates || []);
    } catch (err) {
      console.error('[COMPANY-DASHBOARD] Failed to load shortlist:', err);
    } finally {
      setShortlistLoading(false);
    }
  };

  const handleViewCandidateProfile = async (candidateId: number) => {
    try {
      const response = await candidateAPI.getById(candidateId);
      setSelectedCandidate(response.data);
      setShowCandidateModal(true);
    } catch (error) {
      console.error('Failed to fetch candidate profile:', error);
      alert('Failed to load candidate profile. Please try again.');
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

  const _handleCreateJob = async () => {
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
      // setProducts([]); // Not used in current UI
      // setRoles([]); // Not used in current UI
      console.log('[COMPANY-DASHBOARD] Form reset complete');
      alert('Job created successfully!');
    } catch (err) {
      console.error('[COMPANY-DASHBOARD] Job creation failed:', err);
      setError('Failed to create job');
      console.error(err);
    }
  };

  const _handleDeleteJob = async (jobId: number) => {
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
            Job Posting Portal
          </button>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <nav className="dashboard-tabs">
        <button className={`tab ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>Job Management</button>
        <button className={`tab ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => { setActiveTab('browse'); loadAllCandidates(); }}>Browse Candidates</button>
        <button className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`} onClick={() => { setActiveTab('recommendations'); loadRecommendations(); }}>Recommendations</button>
        <button className={`tab ${activeTab === 'shortlist' ? 'active' : ''}`} onClick={() => { setActiveTab('shortlist'); loadShortlist(); }}>
          Shortlist {shortlist.length > 0 && <span style={{ backgroundColor: 'var(--primary-indigo)', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '12px', marginLeft: '6px' }}>{shortlist.length}</span>}
        </button>
        <button className={`tab ${activeTab === 'rankings' ? 'active' : ''}`} onClick={() => { setActiveTab('rankings'); selectedJobId && loadRankings(selectedJobId); }}>Rankings</button>
        {(companyRole === 'ADMIN' || companyRole === 'HR') && (
          <button className={`tab ${activeTab === 'team' ? 'active' : ''}`} onClick={() => { setActiveTab('team'); loadTeamWorkload(); }}>Team Management</button>
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
                        Edit
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
                        Delete
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--neutral-900)', marginBottom: '1.5rem' }}>Browse All Candidates</h2>
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
                    <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '16px' }}>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', fontWeight: 600, color: 'var(--neutral-900)' }}>{candidate.name}</h3>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                          {candidate.email}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          {candidate.location || 'Not specified'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                          </svg>
                          {candidate.years_experience || 0} years exp
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23"/>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                          </svg>
                          ${candidate.rate_min || 0} - ${candidate.rate_max || 0}/hr
                        </span>
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
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>Work Type</p>
                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--neutral-900)' }}>{candidate.work_type || 'Not specified'}</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>Availability</p>
                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--neutral-900)' }}>{candidate.availability || 'Not specified'}</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 600 }}>Status</p>
                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--neutral-900)' }}>{candidate.status || 'active'}</p>
                      </div>
                    </div>

                    {/* Summary */}
                    {candidate.summary && (
                      <div style={{ marginBottom: '20px' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-900)' }}>Summary</p>
                        <p style={{ margin: 0, color: 'var(--neutral-600)', lineHeight: 1.6, fontSize: '0.875rem' }}>
                          {candidate.summary.length > 300 ? `${candidate.summary.substring(0, 300)}...` : candidate.summary}
                        </p>
                      </div>
                    )}

                    {/* Skills */}
                    {candidate.skills && candidate.skills.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-900)' }}>Skills ({candidate.skills.length})</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {candidate.skills.slice(0, 10).map((skill: any, idx: number) => (
                            <span key={idx} style={{
                              padding: '6px 12px',
                              backgroundColor: 'var(--indigo-50)',
                              color: 'var(--primary-indigo)',
                              border: '1px solid var(--primary-indigo)',
                              borderRadius: '6px',
                              fontSize: '0.8125rem',
                              fontWeight: 500
                            }}>
                              {skill.name} {skill.level && `(${skill.level})`}
                            </span>
                          ))}
                          {candidate.skills.length > 10 && (
                            <span style={{
                              padding: '6px 12px',
                              backgroundColor: 'var(--neutral-100)',
                              color: 'var(--neutral-600)',
                              border: '1px solid var(--neutral-300)',
                              borderRadius: '6px',
                              fontSize: '0.8125rem',
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
                      <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--neutral-200)' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '1.125rem', fontWeight: 600, color: 'var(--neutral-900)' }}>
                          Job Preferences ({candidate.job_preferences.length})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {candidate.job_preferences.map((pref: any, idx: number) => (
                            <div key={idx} style={{
                              padding: '16px',
                              backgroundColor: 'var(--neutral-50)',
                              borderRadius: '8px',
                              border: '1px solid var(--neutral-200)'
                            }}>
                              <div style={{ marginBottom: '12px' }}>
                                <h5 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--primary-indigo)' }}>
                                  {pref.preference_name || `Preference ${idx + 1}`}
                                </h5>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
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
                                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600 }}>Rate Range</p>
                                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--neutral-900)' }}>
                                    ${pref.rate_min || 0} - ${pref.rate_max || 0}/hr
                                  </p>
                                </div>
                                <div>
                                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600 }}>Work Type</p>
                                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--neutral-900)' }}>{pref.work_type || 'Any'}</p>
                                </div>
                                <div>
                                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600 }}>Location</p>
                                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--neutral-900)' }}>{pref.location || 'Any'}</p>
                                </div>
                              </div>

                              {pref.required_skills && (() => {
                                try {
                                  const skills = JSON.parse(pref.required_skills);
                                  return skills.length > 0 && (
                                    <div>
                                      <p style={{ margin: '0 0 6px 0', fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600 }}>Required Skills</p>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {skills.map((skill: any, skillIdx: number) => (
                                          <span key={skillIdx} style={{
                                            padding: '4px 8px',
                                            backgroundColor: 'var(--success-green)',
                                            color: 'white',
                                            border: '1px solid var(--success-green)',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: 500
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

        {/* Recommendations Tab - Redirect to Job-Specific Candidate Swipe */}
        {activeTab === 'recommendations' && (
          <div className="enterprise-section">
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              maxWidth: '1000px',
              margin: '0 auto'
            }}>
              {/* Icon */}
              <div style={{ marginBottom: '2rem' }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary-indigo)" strokeWidth="1.5" style={{ margin: '0 auto' }}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>

              {/* Title */}
              <h2 style={{
                fontSize: '1.875rem',
                marginBottom: '1rem',
                color: 'var(--neutral-900)',
                fontWeight: 700,
                letterSpacing: '-0.02em'
              }}>
                Discover AI-Matched Candidates
              </h2>

              {/* Description */}
              <p style={{
                fontSize: '1rem',
                color: 'var(--neutral-600)',
                marginBottom: '3rem',
                lineHeight: 1.6,
                maxWidth: '600px',
                margin: '0 auto 3rem'
              }}>
                Select a job posting below to start reviewing candidates matched to your requirements.
              </p>

              {/* Job Selection - Cards Grid */}
              {jobs.filter(j => j.status === 'active').length === 0 ? (
                <div className="enterprise-empty-state" style={{ maxWidth: '500px', margin: '0 auto' }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-400)" strokeWidth="1.5" style={{ marginBottom: '1rem' }}>
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                  <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.25rem', fontWeight: 600, color: 'var(--neutral-700)' }}>
                    No Active Job Postings
                  </h3>
                  <p style={{ color: 'var(--neutral-600)', fontSize: '0.9375rem', marginBottom: '2rem', lineHeight: 1.6 }}>
                    Create a job posting to start discovering qualified candidates.
                  </p>
                  <button
                    className="enterprise-btn enterprise-btn--primary"
                    onClick={() => setActiveTab('jobs')}
                  >
                    Create Job Posting
                  </button>
                </div>
              ) : (
                <>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '3rem',
                    textAlign: 'left'
                  }}>
                    {jobs.filter(j => j.status === 'active').map(job => (
                      <div
                        key={job.id}
                        onClick={() => navigate(`/company-dashboard/job/${job.id}/candidates`)}
                        className="enterprise-card"
                        style={{
                          padding: '1.5rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: '1px solid var(--neutral-200)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary-indigo)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--neutral-200)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                        }}
                      >
                        <h3 style={{
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color: 'var(--neutral-900)',
                          marginBottom: '1rem',
                          lineHeight: 1.3
                        }}>
                          {job.title}
                        </h3>
                        
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.625rem',
                          marginBottom: '1.25rem',
                          fontSize: '0.875rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-indigo)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                            </svg>
                            <span style={{ fontWeight: 600 }}>
                              {job.product_author}
                            </span>
                            {job.product && <span style={{ color: 'var(--neutral-600)' }}>• {job.product}</span>}
                          </div>
                          {job.role && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--neutral-700)' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                              </svg>
                              {job.role}
                            </div>
                          )}
                          {job.location && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--neutral-600)' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                              </svg>
                              {job.location}
                            </div>
                          )}
                          {job.seniority && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--neutral-600)' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              {job.seniority}
                            </div>
                          )}
                        </div>

                        <div style={{
                          paddingTop: '1rem',
                          borderTop: '1px solid var(--neutral-200)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            fontSize: '0.8125rem',
                            color: 'var(--success-green)',
                            fontWeight: 600,
                            padding: '0.25rem 0.75rem',
                            backgroundColor: 'var(--success-green-light)',
                            borderRadius: '9999px'
                          }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="12" r="10"/>
                            </svg>
                            Active
                          </span>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            fontSize: '0.875rem',
                            color: 'var(--primary-indigo)',
                            fontWeight: 600
                          }}>
                            View Candidates
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="5" y1="12" x2="19" y2="12"/>
                              <polyline points="12 5 19 12 12 19"/>
                            </svg>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Feature Highlights */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '3rem',
                    marginTop: '3rem',
                    flexWrap: 'wrap',
                    paddingTop: '2rem',
                    borderTop: '1px solid var(--neutral-200)'
                  }}>
                    <div style={{ textAlign: 'center', maxWidth: '200px' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-400)" strokeWidth="1.5" style={{ margin: '0 auto 0.5rem' }}>
                        <path d="M9 11l3 3L22 4"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                      </svg>
                      <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', fontWeight: 500 }}>Swipe or use keyboard</div>
                    </div>
                    <div style={{ textAlign: 'center', maxWidth: '200px' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-400)" strokeWidth="1.5" style={{ margin: '0 auto 0.5rem' }}>
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4"/>
                        <path d="M12 8h.01"/>
                      </svg>
                      <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', fontWeight: 500 }}>AI-matched candidates</div>
                    </div>
                    <div style={{ textAlign: 'center', maxWidth: '200px' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-400)" strokeWidth="1.5" style={{ margin: '0 auto 0.5rem' }}>
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                      <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', fontWeight: 500 }}>Quick screening</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Shortlist Tab */}
        {activeTab === 'shortlist' && (
          <div className="enterprise-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem', fontWeight: 700, color: 'var(--neutral-900)' }}>
                  Shortlisted Candidates
                </h2>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--neutral-600)' }}>
                  Candidates you've liked - {shortlist.length} {shortlist.length === 1 ? 'candidate' : 'candidates'}
                </p>
              </div>
              <button
                className="enterprise-btn enterprise-btn--outline"
                onClick={() => loadShortlist()}
                disabled={shortlistLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
                {shortlistLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {shortlistLoading ? (
              <div className="enterprise-empty-state">
                <p style={{ margin: 0, color: 'var(--neutral-600)' }}>Loading shortlist...</p>
              </div>
            ) : shortlist.length === 0 ? (
              <div className="enterprise-empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-400)" strokeWidth="1.5" style={{ marginBottom: '1rem' }}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: 600, color: 'var(--neutral-700)' }}>
                  No Shortlisted Candidates Yet
                </h3>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--neutral-600)' }}>
                  When you like candidates in the Recommendations tab, they'll appear here
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {shortlist.map((item: any) => {
                  const candidate = item.candidate;
                  return (
                    <div key={item.match_state_id} className="enterprise-card" style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--neutral-900)' }}>
                            {candidate.name}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--neutral-600)', marginBottom: '0.5rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                              </svg>
                              {candidate.location || 'Location not specified'}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                              </svg>
                              {candidate.work_type || 'N/A'}
                            </span>
                            {candidate.years_experience && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <polyline points="12 6 12 12 16 14"/>
                                </svg>
                                {candidate.years_experience} years
                              </span>
                            )}
                            {candidate.rate_min && candidate.rate_max && (
                              <span style={{ fontWeight: 600, color: 'var(--success-green)' }}>
                                ${candidate.rate_min}-${candidate.rate_max}/hr
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--neutral-700)' }}>
                            <strong>Role:</strong> {candidate.primary_role || 'Not specified'}
                          </p>
                          {candidate.summary && (
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--neutral-600)', lineHeight: 1.5 }}>
                              {candidate.summary}
                            </p>
                          )}
                        </div>

                        {/* Match Score Badge */}
                        {item.match_score && (
                          <div style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: 'var(--indigo-50)',
                            color: 'var(--primary-indigo)',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            border: '1px solid var(--primary-indigo)'
                          }}>
                            {Math.round(item.match_score)}% Match
                          </div>
                        )}
                      </div>

                      {/* Liked timestamp */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--neutral-500)', marginBottom: '1rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        Liked {item.liked_at ? new Date(item.liked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently'}
                      </div>

                      {/* Job context */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--neutral-600)', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--neutral-50)', borderRadius: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                        </svg>
                        <span>Liked for: <strong>{item.job?.title || 'Job'}</strong></span>
                      </div>

                      {/* Action button */}
                      <button 
                        className="enterprise-btn enterprise-btn--primary"
                        onClick={() => handleViewCandidateProfile(candidate.id)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        View Profile
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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

      {/* Candidate Profile Modal */}
      {showCandidateModal && selectedCandidate && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem',
            overflowY: 'auto'
          }}
          onClick={() => setShowCandidateModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '2rem',
              borderBottom: '1px solid var(--neutral-200)',
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              zIndex: 10,
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem', fontWeight: 700, color: 'var(--neutral-900)' }}>
                    {selectedCandidate.name}
                  </h2>
                  <p style={{ margin: 0, fontSize: '1rem', color: 'var(--neutral-600)' }}>
                    {selectedCandidate.primary_role || 'Professional'}
                  </p>
                </div>
                <button
                  onClick={() => setShowCandidateModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '2rem',
                    cursor: 'pointer',
                    color: 'var(--neutral-500)',
                    padding: '0',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--neutral-100)';
                    e.currentTarget.style.color = 'var(--neutral-700)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--neutral-500)';
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '2rem' }}>
              {/* Summary */}
              {selectedCandidate.summary && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600, color: 'var(--neutral-900)' }}>
                    Professional Summary
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--neutral-700)', whiteSpace: 'pre-wrap' }}>
                    {selectedCandidate.summary}
                  </p>
                </div>
              )}

              {/* Candidate Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.5rem',
                marginBottom: '2rem',
                padding: '1.5rem',
                backgroundColor: 'var(--neutral-50)',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--neutral-900)', fontWeight: 500 }}>{selectedCandidate.email || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--neutral-900)', fontWeight: 500 }}>{selectedCandidate.phone || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--neutral-900)', fontWeight: 500 }}>{selectedCandidate.location || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Work Type</div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--neutral-900)', fontWeight: 500 }}>{selectedCandidate.work_type || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Years of Experience</div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--neutral-900)', fontWeight: 500 }}>
                    {selectedCandidate.years_experience ? `${selectedCandidate.years_experience} years` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rate Range</div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--success-green)', fontWeight: 600 }}>
                    {selectedCandidate.rate_min && selectedCandidate.rate_max 
                      ? `$${selectedCandidate.rate_min}-$${selectedCandidate.rate_max}/hr`
                      : 'N/A'
                    }
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Availability</div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--neutral-900)', fontWeight: 500 }}>
                    {selectedCandidate.availability ? new Date(selectedCandidate.availability).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product</div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--neutral-900)', fontWeight: 500 }}>{selectedCandidate.product || 'N/A'}</div>
                </div>
              </div>

              {/* Skills */}
              {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600, color: 'var(--neutral-900)' }}>
                    Skills
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedCandidate.skills.map((skill: any, index: number) => (
                      <span
                        key={index}
                        style={{
                          padding: '0.5rem 0.875rem',
                          backgroundColor: 'var(--indigo-50)',
                          color: 'var(--primary-indigo)',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          border: '1px solid var(--primary-indigo)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        {skill.name}
                        {skill.rating && (
                          <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '4px' }}>
                            ({skill.rating}/5)
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {selectedCandidate.certifications && selectedCandidate.certifications.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600, color: 'var(--neutral-900)' }}>
                    Certifications
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedCandidate.certifications.map((cert: any, index: number) => (
                      <div
                        key={index}
                        style={{
                          padding: '1rem',
                          backgroundColor: 'var(--neutral-50)',
                          borderRadius: '6px',
                          border: '1px solid var(--neutral-200)'
                        }}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--neutral-900)', marginBottom: '0.25rem' }}>
                          {cert.name}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                          {cert.issuer} {cert.year && `• ${cert.year}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1.5rem 2rem',
              borderTop: '1px solid var(--neutral-200)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              position: 'sticky',
              bottom: 0,
              backgroundColor: 'white',
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px'
            }}>
              <button
                onClick={() => setShowCandidateModal(false)}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: 'var(--neutral-100)',
                  color: 'var(--neutral-700)',
                  border: '1px solid var(--neutral-300)',
                  borderRadius: '8px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--neutral-200)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--neutral-100)';
                }}
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


export default CompanyDashboard;
