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
  const { logout } = useAuth();

  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('jobs');
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

  useEffect(() => {
    loadJobs();
    loadOntology();
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
    console.log('[COMPANY-DASHBOARD] Loading jobs for company');
    try {
      const response = await jobsAPI.list();
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <div className="dashboard-container"><p>Loading...</p></div>;

  const currentCandidate = feedCandidates[currentFeedIndex];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Recruiter Dashboard</h1>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </header>

      <nav className="dashboard-tabs">
        <button className={`tab ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>Job Postings</button>
        <button className={`tab ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => { setActiveTab('feed'); selectedJobId && loadCandidateFeed(selectedJobId); }}>Candidate Feed</button>
        <button className={`tab ${activeTab === 'shortlist' ? 'active' : ''}`} onClick={() => { setActiveTab('shortlist'); selectedJobId && loadShortlist(selectedJobId); }}>Shortlist</button>
        <button className={`tab ${activeTab === 'rankings' ? 'active' : ''}`} onClick={() => { setActiveTab('rankings'); selectedJobId && loadRankings(selectedJobId); }}>Rankings</button>
      </nav>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-content">
        {/* Job Postings Tab */}
        {activeTab === 'jobs' && (
          <div className="jobs-section">
            <h2>Job Postings</h2>

            <div className="create-job">
              <h3>Create New Job</h3>
              <div className="form-group">
                <label>Job Title</label>
                <input type="text" value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} placeholder="e.g., Oracle DBA" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} rows={4} />
              </div>
              <div className="form-group">
                <label>Product Author *</label>
                <select value={newJob.product_author} onChange={(e) => { setNewJob({ ...newJob, product_author: e.target.value, product: '', role: '' }); setProducts([]); setRoles([]); }} onFocus={() => {}}>
                  <option value="">Select Author...</option>
                  {authors.map((a) => (<option key={a} value={a}>{a}</option>))}
                </select>
              </div>
              {newJob.product_author && (
                <div className="form-group">
                  <label>Product *</label>
                  <select value={newJob.product} onChange={(e) => { setNewJob({ ...newJob, product: e.target.value, role: '' }); setRoles([]); }} onFocus={() => handleLoadProducts(newJob.product_author)}>
                    <option value="">Select Product...</option>
                    {products.map((p) => (<option key={p} value={p}>{p}</option>))}
                  </select>
                </div>
              )}
              {newJob.product && (
                <div className="form-group">
                  <label>Role *</label>
                  <select value={newJob.role} onChange={(e) => setNewJob({ ...newJob, role: e.target.value })} onFocus={() => handleLoadRoles(newJob.product_author, newJob.product)}>
                    <option value="">Select Role...</option>
                    {roles.map((r) => (<option key={r} value={r}>{r}</option>))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Location</label>
                <input type="text" value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} placeholder="e.g., San Francisco, CA" />
              </div>
              <div className="form-group">
                <label>Seniority Level</label>
                <select value={newJob.seniority} onChange={(e) => setNewJob({ ...newJob, seniority: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="Entry Level">Entry Level</option>
                  <option value="Mid Level">Mid Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Rate Min ($)</label>
                  <input type="number" value={newJob.min_rate} onChange={(e) => setNewJob({ ...newJob, min_rate: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Rate Max ($)</label>
                  <input type="number" value={newJob.max_rate} onChange={(e) => setNewJob({ ...newJob, max_rate: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div className="form-group">
                <label>Work Type</label>
                <select value={newJob.work_type} onChange={(e) => setNewJob({ ...newJob, work_type: e.target.value })}>
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <button className="btn btn-secondary" onClick={handleCreateJob}>Create Job</button>
            </div>

            <div className="jobs-list">
              <h3>Your Jobs ({jobs.length})</h3>
              {jobs.length > 0 ? (
                <table className="jobs-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Location</th>
                      <th>Work Type</th>
                      <th>Rate Range</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job: any) => (
                      <tr key={job.id}>
                        <td>{job.title}</td>
                        <td>{job.location}</td>
                        <td>{job.work_type}</td>
                        <td>${job.min_rate} - ${job.max_rate}</td>
                        <td><span className={`status status-${job.status}`}>{job.status}</span></td>
                        <td>
                          <button className="btn-small" onClick={() => navigate(`/job/${job.id}`)}>View</button>
                          <button className="btn-small btn-danger" onClick={() => handleDeleteJob(job.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No jobs posted yet</p>
              )}
            </div>
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
      </div>
    </div>
  );
};

export default CompanyDashboard;
