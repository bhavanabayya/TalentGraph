import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  candidateAPI,
  jobRolesAPI,
  preferencesAPI,
  recommendationsAPI,
  matchesAPI,
  jobsAPI,
} from '../api/client';
import { useAuth } from '../context/authStore';
import { SkillSelector } from '../components/SkillSelector';
import SocialLinksWidget from '../components/SocialLinksWidget';
import AvailabilityDatePicker from '../components/AvailabilityDatePicker';
import '../styles/Dashboard.css';
import '../styles/EnterpriseDashboard.css';

// Technical and soft skills lists
const technicalSkills = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'React', 'Angular', 'Vue.js',
  'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'SQL', 'MongoDB', 'PostgreSQL',
  'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'Git', 'CI/CD'
];

const softSkills = [
  'Communication', 'Leadership', 'Problem Solving', 'Time Management', 'Teamwork',
  'Critical Thinking', 'Adaptability', 'Creativity', 'Project Management', 'Negotiation'
];

const CandidateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout, email } = useAuth();
  
  // Profile state
  const [profile, setProfile] = useState<any>(null);
  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [swipingJobId, setSwipingJobId] = useState<number | null>(null);
  const [pendingAsks, setPendingAsks] = useState<any[]>([]);
  const [likedJobs, setLikedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  
  // Job details modal state
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  
  // Multiple job profiles state
  const [jobProfiles, setJobProfiles] = useState<any[]>([]);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  
  // Author/Product/Role dropdowns
  const [products, setProducts] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  
  // Skills state for main profile
  const [skillsInput, setSkillsInput] = useState<any[]>([]);
  
  // Certifications state
  const [newCert, setNewCert] = useState({ name: '', issuer: '', year: '' });
  
  // Resume upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [profileRes, jobsRes, productsRes, jobProfilesRes] = await Promise.all([
        candidateAPI.getMe(),
        jobsAPI.listAll().catch(() => ({ data: [] })),
        jobRolesAPI.getProducts('Oracle').catch(() => ({ data: [] })),
        preferencesAPI.getMyPreferences().catch(() => ({ data: [] })),
      ]);

      setProfile(profileRes.data || {});
      setCandidateId(profileRes.data?.id || null);
      
      // Handle job profiles
      const jobProfilesData = Array.isArray(jobProfilesRes?.data) ? jobProfilesRes.data : (jobProfilesRes as any)?.data?.data || [];
      setJobProfiles(jobProfilesData);
      
      // Handle jobs response
      const jobsData = Array.isArray(jobsRes.data) ? jobsRes.data : (jobsRes.data as any)?.data || [];
      setAvailableJobs(jobsData);

      // Handle products response - API returns {author, products: [...]}
      let productsData = [];
      if (Array.isArray(productsRes.data)) {
        productsData = productsRes.data;
      } else if (productsRes.data?.products && Array.isArray(productsRes.data.products)) {
        productsData = productsRes.data.products;
      } else if (productsRes.data?.data && Array.isArray(productsRes.data.data)) {
        productsData = productsRes.data.data;
      }
      console.log('Processed products:', productsData);
      setProducts(productsData);
      
      // TODO: Generate recommendations based on candidate profile vs available jobs
      // For now, recommendations will be empty until AI integration
      setRecommendations([]);
      
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      setRecommendationsLoading(true);
      const response = await recommendationsAPI.getCandidateRecommendations(20);
      const recommendationsData = response.data?.recommendations || [];
      setRecommendations(recommendationsData);
      console.log(`Loaded ${recommendationsData.length} job recommendations`);
    } catch (err: any) {
      console.error('Failed to load recommendations:', err);
      setError(err.response?.data?.detail || 'Failed to load recommendations');
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const loadPendingAsks = async () => {
    if (!candidateId) return;
    try {
      const response = await matchesAPI.getPendingAsks(candidateId);
      setPendingAsks(response.data?.pending_asks || []);
      console.log(`Loaded ${response.data?.total || 0} pending asks`);
    } catch (err: any) {
      console.error('Failed to load pending asks:', err);
    }
  };

  const loadLikedJobs = async () => {
    if (!candidateId) return;
    try {
      const response = await matchesAPI.getCandidateLikes(candidateId);
      setLikedJobs(response.data?.liked_jobs || []);
      console.log(`Loaded ${response.data?.total || 0} liked jobs`);
    } catch (err: any) {
      console.error('Failed to load liked jobs:', err);
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

  const handleSwipeAction = async (jobId: number, action: 'LIKE' | 'PASS' | 'APPLY') => {
    if (!candidateId) return;
    try {
      setSwipingJobId(jobId);
      await matchesAPI.candidateAction(candidateId, jobId, action);
      
      // Remove from recommendations
      setRecommendations(prev => prev.filter(rec => rec.job.id !== jobId));
      
      // Show success message
      const actionMessages = {
        'LIKE': '👍 Job liked!',
        'PASS': '👎 Job passed',
        'APPLY': '✅ Application submitted!'
      };
      alert(actionMessages[action]);
      
      // Refresh data if applied
      if (action === 'APPLY') {
        await fetchAllData();
      }
    } catch (err: any) {
      console.error('Failed to perform action:', err);
      alert(err.response?.data?.detail || `Failed to ${action.toLowerCase()} job`);
    } finally {
      setSwipingJobId(null);
    }
  };

  const handleRespondToAsk = async (matchStateId: number, response: 'ACCEPT' | 'DECLINE') => {
    try {
      await matchesAPI.respondToAsk(matchStateId, response === 'ACCEPT');
      
      // Remove from pending asks
      setPendingAsks(prev => prev.filter(ask => ask.match_state_id !== matchStateId));
      
      // Show success message
      if (response === 'ACCEPT') {
        alert('✅ Application submitted! You\'ve accepted the recruiter\'s invitation.');
        await fetchAllData(); // Refresh to show new application
      } else {
        alert('Declined recruiter invitation');
      }
      
    } catch (err: any) {
      console.error('Failed to respond to ask:', err);
      alert(err.response?.data?.detail || 'Failed to respond');
    }
  };

  const handleLoadProducts = async (authorName: string) => {
    try {
      const res = await jobRolesAPI.getProducts(authorName);
      let productsData = [];
      if (Array.isArray(res.data)) {
        productsData = res.data;
      } else if (res.data?.products && Array.isArray(res.data.products)) {
        productsData = res.data.products;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        productsData = res.data.data;
      }
      console.log(`Loaded products for ${authorName}:`, productsData);
      setProducts(productsData);
    } catch (err) {
      console.error('Error loading products:', err);
      setProducts([]);
    }
  };

  const handleLoadRoles = async (authorName: string, productName: string) => {
    try {
      const res = await jobRolesAPI.getRoles(authorName, productName);
      let rolesData = [];
      if (Array.isArray(res.data)) {
        rolesData = res.data;
      } else if (res.data?.roles && Array.isArray(res.data.roles)) {
        rolesData = res.data.roles;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        rolesData = res.data.data;
      }
      console.log(`Loaded roles for ${authorName} - ${productName}:`, rolesData);
      setRoles(rolesData);
    } catch (err) {
      console.error('Error loading roles:', err);
      setRoles([]);
    }
  };

  const handleAddCertification = async () => {
    if (!newCert.name) {
      setError('Please enter certification name');
      return;
    }
    try {
      setSaving(true);
      await candidateAPI.addCertification({
        name: newCert.name,
        issuer: newCert.issuer,
        year: newCert.year ? parseInt(newCert.year) : undefined,
      });
      setNewCert({ name: '', issuer: '', year: '' });
      setError('');
      await fetchAllData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add certification');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadResume = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }
    try {
      setSaving(true);
      await candidateAPI.uploadResume(selectedFile);
      setSelectedFile(null);
      setError('');
      await fetchAllData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload resume');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyJob = async (jobId: number) => {
    try {
      setSaving(true);
      // Submit application - using swipes API like/apply endpoint
      await fetch(`http://127.0.0.1:8000/swipes/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ job_id: jobId }),
      });
      setError('');
      alert('Application submitted successfully!');
      await fetchAllData();
    } catch (err: any) {
      setError('Failed to submit application');
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSaveProfile = async () => {
    if (!editingProfile.product || !editingProfile.primary_role) {
      setError('Please select both product and role');
      return;
    }

    // Check for duplicate job type (if not editing the same profile)
    const isDuplicateWorkType = jobProfiles.some((profile) => {
      // If we're editing, don't count the current profile
      if (formMode === 'edit' && profile.id === editingProfile.id) {
        return false;
      }
      return profile.work_type === editingProfile.work_type && editingProfile.work_type;
    });

    if (isDuplicateWorkType) {
      setError(`A profile with job type "${editingProfile.work_type}" already exists. Job types must be unique.`);
      return;
    }

    try {
      setSaving(true);
      // Auto-set preference name to role name if not explicitly set
      const preferenceName = editingProfile.preference_name?.trim() ? 
        editingProfile.preference_name : 
        editingProfile.primary_role;

      const profileData = {
        preference_name: preferenceName,
        product: editingProfile.product,
        primary_role: editingProfile.primary_role,
        years_experience: editingProfile.years_experience,
        rate_min: editingProfile.rate_min,
        rate_max: editingProfile.rate_max,
        work_type: editingProfile.work_type,
        location: editingProfile.location,
        availability: editingProfile.availability,
        summary: editingProfile.summary,
        is_active: editingProfile.is_active !== undefined ? editingProfile.is_active : true,
      };

      if (formMode === 'add') {
        await preferencesAPI.create(profileData as any);
        setError('');
        alert('Profile created successfully!');
      } else {
        await preferencesAPI.update(editingProfile.id, profileData as any);
        setError('');
        alert('Profile updated successfully!');
      }

      setShowProfileForm(false);
      setEditingProfile(null);
      await fetchAllData();
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.response?.data?.detail || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleEditProfileClick = () => {
    navigate('/edit-profile');
  };

  const handleCancelProfileForm = () => {
    setShowProfileForm(false);
    setEditingProfile(null);
    setFormMode('add');
    setProducts([]);
    setRoles([]);
  };

  if (loading) return <div className="dashboard-container loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Candidate Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
            Signed in as: <strong>{email}</strong>
          </p>
        </div>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </header>

      <nav className="dashboard-tabs">
        <button className={`tab ${activeTab === 'general-info' ? 'active' : ''}`} onClick={() => setActiveTab('general-info')}>General Information</button>
        <button className={`tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile Dashboard</button>
        <button className={`tab ${activeTab === 'certifications' ? 'active' : ''}`} onClick={() => setActiveTab('certifications')}>Certifications</button>
        <button className={`tab ${activeTab === 'resumes' ? 'active' : ''}`} onClick={() => setActiveTab('resumes')}>Resumes</button>
        <button className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`} onClick={() => { setActiveTab('recommendations'); loadRecommendations(); }}>Recommendations</button>
        <button className={`tab ${activeTab === 'asks' ? 'active' : ''}`} onClick={() => { setActiveTab('asks'); loadPendingAsks(); }}>
          Recruiter Invites {pendingAsks.length > 0 && <span style={{ backgroundColor: '#f44336', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '12px', marginLeft: '6px' }}>{pendingAsks.length}</span>}
        </button>
        <button className={`tab ${activeTab === 'likes' ? 'active' : ''}`} onClick={() => { setActiveTab('likes'); loadLikedJobs(); }}>
          Likes {likedJobs.length > 0 && <span style={{ backgroundColor: 'var(--primary-indigo)', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '12px', marginLeft: '6px' }}>{likedJobs.length}</span>}
        </button>
        <button className={`tab ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>Available Jobs</button>
      </nav>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-content">
        {/* General Information Tab */}
        {activeTab === 'general-info' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ 
              backgroundColor: 'white', 
              padding: '30px', 
              borderRadius: '8px', 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ margin: 0 }}>General Information</h2>
                <button 
                  className="btn btn-primary" 
                  onClick={() => navigate('/edit-general-info')}
                  style={{ fontSize: '14px' }}
                >
                  ✎ Edit Details
                </button>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, rgba(74, 158, 255, 0.1) 0%, rgba(43, 127, 217, 0.08) 100%)',
                border: '2px solid #4a9eff',
                borderRadius: '8px',
                padding: '24px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Full Name</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#333' }}>{profile?.name || '—'}</p>
                  </div>
                  
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Email Address</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#333' }}>{profile?.email || '—'}</p>
                  </div>
                  
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Phone Number</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#333' }}>{profile?.phone || '—'}</p>
                  </div>
                  
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Current Location</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#333' }}>{profile?.location || '—'}</p>
                  </div>
                  
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Residential Address</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#333' }}>{profile?.residential_address || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Social Links Widget */}
              <div style={{ marginTop: '30px' }}>
                <SocialLinksWidget editable={false} />
              </div>
            </div>
          </div>
        )}

        {/* Profile Dashboard Tab - Shows Main Profile + All Job Profiles */}
        {activeTab === 'profile' && profile && (
          <div className="profile-dashboard-section">
            {/* Main Profile Section */}
            <div style={{ marginBottom: '48px' }}>
              <h2>Main Profile</h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>Your primary candidate information and details.</p>
              
              {/* Profile Summary Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(74, 158, 255, 0.1) 0%, rgba(43, 127, 217, 0.08) 100%)',
                border: '2px solid #4a9eff',
                borderRadius: '8px',
                padding: '24px',
                marginBottom: '32px'
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Profile Summary</h3>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: 0 }}>A quick view of your candidate information and preferences.</p>
                </div>
                
                {/* Name and Role */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>{profile.name || 'Your Name'}</h4>
                  <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px', lineHeight: 1.5 }}>
                    {profile.primary_role || 'No role selected'}{profile.product && `, ${profile.product}`}
                  </p>
                  {profile.summary && (
                    <p style={{ margin: 0, color: '#555', fontSize: '13px', lineHeight: 1.6, fontStyle: 'italic' }}>
                      "{profile.summary}"
                    </p>
                  )}
                </div>
                
                {/* Key Metrics Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Experience</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{profile.years_experience || '—'} yrs</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Rate</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                      {profile.rate_min || '—'}{profile.rate_max && `–$${profile.rate_max}`}{profile.rate_min && '/hr'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Location</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{profile.location || '—'}</p>
                  </div>
                </div>
                
                {/* Additional Info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Status</p>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{profile.availability || '—'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Career Path</p>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{profile.primary_role || '—'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Product Expert</p>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{profile.product ? `Oracle - ${profile.product}` : '—'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Work Type</p>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{profile.work_type || '—'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Visa Status</p>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{profile.visa_type || '—'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Ethnicity</p>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{profile.ethnicity || 'Not disclosed'}</p>
                  </div>
                </div>

                {/* Skills Section */}
                {(profile?.skills?.length > 0 || skillsInput.length > 0) && (
                  <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e0e0e0' }}>
                    <p style={{ margin: '0 0 12px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Key Skills ({(profile?.skills?.length || 0) + skillsInput.length})</p>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                          <th style={{
                            padding: '12px',
                            textAlign: 'left',
                            fontWeight: 600,
                            fontSize: '13px',
                            color: '#333',
                            borderRight: '1px solid #ddd'
                          }}>
                            Skill Name
                          </th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'center',
                            fontWeight: 600,
                            fontSize: '13px',
                            color: '#333',
                            borderRight: skillsInput.length > 0 ? '1px solid #ddd' : 'none',
                            width: '200px'
                          }}>
                            Proficiency Rating
                          </th>
                          {skillsInput.length > 0 && (
                            <th style={{
                              padding: '12px',
                              textAlign: 'center',
                              fontWeight: 600,
                              fontSize: '13px',
                              color: '#333',
                              width: '100px'
                            }}>
                              Action
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Display saved skills */}
                        {profile?.skills?.map((skill: any, idx: number) => (
                          <tr key={`saved-${skill.id}`} style={{
                            borderBottom: '1px solid #eee',
                            backgroundColor: idx % 2 === 0 ? '#fafafa' : '#fff'
                          }}>
                            <td style={{
                              padding: '12px',
                              fontSize: '14px',
                              color: '#333',
                              fontWeight: 500,
                              borderRight: '1px solid #ddd'
                            }}>
                              {skill.name}
                            </td>
                            <td style={{
                              padding: '12px',
                              textAlign: 'center',
                              borderRight: skillsInput.length > 0 ? '1px solid #ddd' : 'none'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                  <span key={star} style={{
                                    color: star <= (skill.rating || 0) ? '#FFB800' : '#ddd',
                                    fontSize: '14px'
                                  }}>★</span>
                                ))}
                              </div>
                              <span style={{ fontSize: '11px', color: '#999', marginTop: '4px', display: 'block' }}>
                                {skill.rating || 0}/5
                              </span>
                            </td>
                          </tr>
                        ))}
                        {/* Display newly added skills (not yet saved) */}
                        {skillsInput.map((skill: any, idx: number) => (
                          <tr key={`new-${idx}`} style={{
                            borderBottom: '1px solid #eee',
                            backgroundColor: '#e8f5e9',
                            opacity: 0.9
                          }}>
                            <td style={{
                              padding: '12px',
                              fontSize: '14px',
                              color: '#333',
                              fontWeight: 500,
                              borderRight: '1px solid #ddd'
                            }}>
                              {skill.name} <span style={{ fontSize: '10px', opacity: 0.7 }}>✨ (Pending Save)</span>
                            </td>
                            <td style={{
                              padding: '12px',
                              textAlign: 'center',
                              borderRight: '1px solid #ddd'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                  <span key={star} style={{
                                    color: star <= (skill.rating || 3) ? '#FFB800' : '#ddd',
                                    fontSize: '14px'
                                  }}>★</span>
                                ))}
                              </div>
                              <span style={{ fontSize: '11px', color: '#999', marginTop: '4px', display: 'block' }}>
                                {skill.rating || 3}/5
                              </span>
                            </td>
                            <td style={{
                              padding: '12px',
                              textAlign: 'center'
                            }}>
                              <button
                                onClick={() => setSkillsInput(skillsInput.filter((_: any, i: number) => i !== idx))}
                                style={{
                                  backgroundColor: '#f44336',
                                  color: 'white',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#d32f2f')}
                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f44336')}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Job Preference Profiles Section */}
            <div style={{
              borderTop: '2px solid #e0e0e0',
              paddingTop: '48px'
            }}>
              {showProfileForm ? (
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '24px',
                  maxWidth: '600px',
                  margin: '0 auto 24px'
                }}>
                  <h3 style={{ marginTop: 0 }}>
                    {formMode === 'add' ? 'Create New Role Profile' : 'Edit Role Profile'}
                  </h3>
                  
                  <div className="form-group">
                    <label>Profile Name</label>
                    <input
                      type="text"
                      placeholder="Auto-generated from role"
                      value={editingProfile.preference_name || editingProfile.primary_role || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, preference_name: e.target.value })}
                      disabled={!editingProfile.primary_role}
                      style={{ 
                        backgroundColor: !editingProfile.primary_role ? '#f5f5f5' : 'white',
                        cursor: !editingProfile.primary_role ? 'not-allowed' : 'text'
                      }}
                    />
                    <small style={{ color: '#999' }}>Auto-sets to the role name. Select a role first.</small>
                  </div>

                  <div className="form-group">
                    <label>Product Vendor</label>
                    <input
                      type="text"
                      value="Oracle"
                      disabled
                      style={{
                        backgroundColor: '#f5f5f5',
                        color: '#666',
                        cursor: 'not-allowed',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Product Type *</label>
                    <select
                      value={editingProfile.product || ''}
                      onChange={(e) => {
                        setEditingProfile({ ...editingProfile, product: e.target.value, primary_role: '' });
                        setRoles([]);
                      }}
                      onFocus={() => handleLoadProducts('Oracle')}
                    >
                      <option value="">Select Product...</option>
                      {products.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {editingProfile.product && (
                    <div className="form-group">
                      <label>Primary Role *</label>
                      <select
                        value={editingProfile.primary_role || ''}
                        onChange={(e) => {
                          // Auto-set preference name to role when role is selected
                          setEditingProfile({ 
                            ...editingProfile, 
                            primary_role: e.target.value,
                            preference_name: e.target.value  // Set name same as role
                          });
                        }}
                        onFocus={() => handleLoadRoles('Oracle', editingProfile.product)}
                      >
                        <option value="">Select Role...</option>
                        {roles.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Years of Experience</label>
                    <input
                      type="number"
                      value={editingProfile.years_experience || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, years_experience: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Rate Min ($)</label>
                      <input
                        type="number"
                        value={editingProfile.rate_min || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, rate_min: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Rate Max ($)</label>
                      <input
                        type="number"
                        value={editingProfile.rate_max || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, rate_max: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Work Type *</label>
                    <select
                      value={editingProfile.work_type || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, work_type: e.target.value })}
                    >
                      <option value="">Select...</option>
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                    <small style={{ color: '#999' }}>Note: Work type must be unique across all your role profiles.</small>
                  </div>

                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      placeholder="e.g., San Francisco, CA or Any"
                      value={editingProfile.location || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, location: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Availability Date</label>
                    <AvailabilityDatePicker
                      value={editingProfile.availability}
                      onChange={(date) => setEditingProfile({ ...editingProfile, availability: date })}
                      placeholder="Select your availability date"
                    />
                  </div>

                  <div className="form-group">
                    <label>Professional Summary</label>
                    <textarea
                      placeholder="Brief summary of your background and interests for this role"
                      value={editingProfile.summary || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, summary: e.target.value })}
                      rows={4}
                    />
                  </div>

                  {/* Skills Preview Section */}
                  {editingProfile.product && editingProfile.primary_role && (
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      padding: '12px',
                      marginBottom: '16px'
                    }}>
                      <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '12px', fontWeight: 500 }}>
                        Profile Preview
                      </p>
                      <p style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
                        {editingProfile.preference_name || `${editingProfile.product} - ${editingProfile.primary_role}`}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
                        {editingProfile.years_experience && (
                          <div style={{ fontSize: '12px' }}>
                            <span style={{ color: '#666', fontWeight: 500 }}>Experience:</span> {editingProfile.years_experience} yrs
                          </div>
                        )}
                        {(editingProfile.rate_min || editingProfile.rate_max) && (
                          <div style={{ fontSize: '12px' }}>
                            <span style={{ color: '#666', fontWeight: 500 }}>Rate:</span> ${editingProfile.rate_min || '0'}–${editingProfile.rate_max || '0'}/hr
                          </div>
                        )}
                        {editingProfile.work_type && (
                          <div style={{ fontSize: '12px' }}>
                            <span style={{ color: '#666', fontWeight: 500 }}>Type:</span> {editingProfile.work_type}
                          </div>
                        )}
                        {editingProfile.location && (
                          <div style={{ fontSize: '12px' }}>
                            <span style={{ color: '#666', fontWeight: 500 }}>Location:</span> {editingProfile.location}
                          </div>
                        )}
                      </div>
                      {/* Preview Skills */}
                      {editingProfile.required_skills && (
                        <div>
                          <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '11px', fontWeight: 500 }}>SKILLS ({editingProfile.required_skills ? (typeof editingProfile.required_skills === 'string' ? JSON.parse(editingProfile.required_skills).length : editingProfile.required_skills.length) : 0})</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {(typeof editingProfile.required_skills === 'string' ? JSON.parse(editingProfile.required_skills) : editingProfile.required_skills || []).map((skill: any, idx: number) => (
                              <div 
                                key={idx}
                                style={{
                                  backgroundColor: skill.category === 'technical' ? '#e3f2fd' : '#f3e5f5',
                                  color: skill.category === 'technical' ? '#1976d2' : '#7b1fa2',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  border: skill.category === 'technical' ? '1px solid #90caf9' : '1px solid #e1bee7'
                                }}
                              >
                                {skill.name}
                                {skill.level && <span> ({skill.level})</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {editingProfile.product && editingProfile.primary_role && (
                    <div className="form-group">
                      <label>Required Skills for This Role</label>
                      <SkillSelector
                        selectedSkills={editingProfile.required_skills ? (typeof editingProfile.required_skills === 'string' ? JSON.parse(editingProfile.required_skills) : editingProfile.required_skills) : []}
                        onSkillsChange={(skills) => {
                          const skillsJson = JSON.stringify(skills);
                          setEditingProfile({ ...editingProfile, required_skills: skillsJson });
                        }}
                        technicalSkills={technicalSkills}
                        softSkills={softSkills}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : formMode === 'add' ? 'Create Profile' : 'Update Profile'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={handleCancelProfileForm}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                  <p style={{ fontSize: '16px', marginBottom: '10px' }}>Job preferences are now managed on a dedicated page.</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => navigate('/job-preferences')}
                    style={{ marginTop: '10px' }}
                  >
                    Go to Job Preferences
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certifications' && (
          <div className="certifications-section">
            <h2>Certifications</h2>
            <div className="add-cert">
              <h3>Add a Certification</h3>
              <div className="form-group">
                <label>Certification Name</label>
                <input type="text" value={newCert.name} onChange={(e) => setNewCert({ ...newCert, name: e.target.value })} placeholder="e.g., Oracle Certified Associate" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Issuer</label>
                  <input type="text" value={newCert.issuer} onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })} placeholder="e.g., Oracle University" />
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input type="number" value={newCert.year || ''} onChange={(e) => setNewCert({ ...newCert, year: e.target.value })} />
                </div>
              </div>
              <button className="btn btn-secondary" onClick={handleAddCertification}>Add Certification</button>
            </div>
            <div className="certs-list">
              <h3>Your Certifications ({profile?.certifications?.length || 0})</h3>
              {profile?.certifications && profile.certifications.length > 0 ? (
                <ul>
                  {profile.certifications.map((cert: any) => (
                    <li key={cert.id} className="cert-item">
                      <strong>{cert.name}</strong>
                      {cert.issuer && <p>Issuer: {cert.issuer}</p>}
                      {cert.year && <p>Year: {cert.year}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No certifications added yet</p>
              )}
            </div>
          </div>
        )}

        {/* Resumes Tab */}
        {activeTab === 'resumes' && (
          <div className="resumes-section">
            <h2>Resumes</h2>
            <div className="upload-resume">
              <h3>Upload Resume</h3>
              <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx" />
              <button className="btn btn-secondary" onClick={handleUploadResume} disabled={saving || !selectedFile}>{saving ? 'Uploading...' : 'Upload Resume'}</button>
            </div>
            <div className="resumes-list">
              <h3>Your Resumes ({profile?.resumes?.length || 0})</h3>
              {profile?.resumes && profile.resumes.length > 0 ? (
                <ul>
                  {profile.resumes.map((resume: any) => (
                    <li key={resume.id} className="resume-item">
                      <span>{resume.filename}</span>
                      <small>{new Date(resume.created_at).toLocaleDateString()}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No resumes uploaded yet</p>
              )}
            </div>
          </div>
        )}

        {/* Recommendations Tab - Redirect to Swipe Discovery */}
        {activeTab === 'recommendations' && (
          <div className="recommendations-section">
            <div style={{
              textAlign: 'center',
              padding: '5rem 3rem',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              {/* Icon */}
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--primary-indigo)" strokeWidth="1.5" style={{ margin: '0 auto 2rem', display: 'block' }}>
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="7.5 4.21 12 6.81 16.5 4.21" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="7.5 19.79 7.5 14.6 3 12" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="21 12 16.5 14.6 16.5 19.79" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="22.08" x2="12" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>

              {/* Title */}
              <h2 style={{
                fontSize: '2rem',
                marginBottom: '1.25rem',
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700
              }}>
                Discover Your Perfect Match
              </h2>

              {/* Description */}
              <p style={{
                fontSize: '1.125rem',
                color: 'var(--neutral-600)',
                marginBottom: '2.5rem',
                lineHeight: 1.6,
                maxWidth: '500px',
                margin: '0 auto 2.5rem'
              }}>
                Swipe through personalized job recommendations matched to your skills and preferences. 
                Use <strong style={{ color: 'var(--primary-indigo)' }}>arrow keys</strong> or interactive buttons!
              </p>

              {/* CTA Button */}
              <button
                onClick={() => navigate('/candidate-dashboard/discover')}
                className="enterprise-btn enterprise-btn--primary"
                style={{
                  padding: '1rem 3rem',
                  fontSize: '1.125rem'
                }}
              >
                Start Discovering Jobs →
              </button>

              {/* Feature Highlights */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '2.5rem',
                marginTop: '3rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ textAlign: 'center', maxWidth: '180px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-400)" strokeWidth="2" style={{ margin: '0 auto 0.5rem' }}>
                    <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', fontWeight: 500 }}>Swipe or use keyboard</div>
                </div>
                <div style={{ textAlign: 'center', maxWidth: '180px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-400)" strokeWidth="2" style={{ margin: '0 auto 0.5rem' }}>
                    <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', fontWeight: 500 }}>AI-matched opportunities</div>
                </div>
                <div style={{ textAlign: 'center', maxWidth: '180px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-400)" strokeWidth="2" style={{ margin: '0 auto 0.5rem' }}>
                    <polyline points="13 17 18 12 13 7" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="6 17 11 12 6 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', fontWeight: 500 }}>Quick decision-making</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recruiter Invites Tab */}
        {activeTab === 'asks' && (
          <div className="asks-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--neutral-900)', fontWeight: 700, fontSize: '1.5rem' }}>Recruiter Invitations</h2>
                <p style={{ margin: 0, color: 'var(--neutral-600)', fontSize: '0.875rem' }}>
                  {pendingAsks.length === 0 
                    ? 'No pending invitations at this time'
                    : `${pendingAsks.length} ${pendingAsks.length === 1 ? 'company has' : 'companies have'} invited you to apply`
                  }
                </p>
              </div>
              <button 
                className="enterprise-btn enterprise-btn--outline"
                onClick={loadPendingAsks}
              >
                Refresh
              </button>
            </div>

            {pendingAsks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'white', borderRadius: '12px', border: '2px dashed var(--neutral-300)' }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-400)" strokeWidth="1.5" style={{ margin: '0 auto 1.5rem' }}>
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--neutral-700)', marginBottom: '0.5rem' }}>No pending invitations</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', margin: 0 }}>Companies will appear here when they invite you to apply</p>
              </div>
            )}

            {pendingAsks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pendingAsks.map((ask: any) => (
                  <div key={ask.match_state_id} style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid var(--neutral-200)',
                    boxShadow: 'var(--shadow-md)',
                    position: 'relative',
                    transition: 'all 0.2s'
                  }}>
                    {/* Match Score Badge */}
                    {ask.match_score && (
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'linear-gradient(135deg, var(--success-green) 0%, #059669 100%)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                        letterSpacing: '0.02em'
                      }}>
                        {ask.match_score}% MATCH
                      </div>
                    )}

                    {/* Job Header */}
                    <div style={{ marginBottom: '1.25rem', paddingRight: '120px', paddingBottom: '1rem', borderBottom: '1px solid var(--neutral-100)' }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--primary-indigo)', fontWeight: 600 }}>
                        {ask.job.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--neutral-500)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                          </svg>
                          {ask.job.role}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          {ask.job.location}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                            <line x1="1" y1="10" x2="23" y2="10"/>
                          </svg>
                          {ask.job.seniority}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23"/>
                            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                          </svg>
                          ${ask.job.min_rate} - ${ask.job.max_rate}/hr
                        </div>
                      </div>
                    </div>

                    {/* Recruiter Message */}
                    {ask.message && (
                      <div style={{
                        backgroundColor: 'var(--neutral-50)',
                        border: '1px solid var(--neutral-200)',
                        borderLeft: '3px solid var(--primary-indigo)',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.25rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-indigo)" strokeWidth="2">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                          </svg>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-indigo)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Message from Recruiter
                          </span>
                        </div>
                        <p style={{ margin: 0, color: 'var(--neutral-700)', lineHeight: 1.6, fontSize: '0.875rem', fontStyle: 'italic' }}>
                          "{ask.message}"
                        </p>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--neutral-500)', marginBottom: '1.25rem', fontWeight: 500 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Received {new Date(ask.asked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(ask.asked_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        className="enterprise-btn enterprise-btn--outline"
                        onClick={() => handleRespondToAsk(ask.match_state_id, 'DECLINE')}
                        style={{ flex: 1, color: 'var(--neutral-600)', borderColor: 'var(--neutral-300)' }}
                      >
                        Decline
                      </button>
                      <button 
                        className="enterprise-btn enterprise-btn--primary"
                        onClick={() => handleRespondToAsk(ask.match_state_id, 'ACCEPT')}
                        style={{ flex: 2 }}
                      >
                        Accept & Apply →
                      </button>
                      <button 
                        className="enterprise-btn enterprise-btn--outline"
                        onClick={() => handleViewJob(ask.job.id)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Likes Tab */}
        {activeTab === 'likes' && (
          <div className="enterprise-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem', fontWeight: 700, color: 'var(--neutral-900)' }}>
                  Liked Jobs
                </h2>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--neutral-600)' }}>
                  Jobs you've shown interest in - {likedJobs.length} {likedJobs.length === 1 ? 'job' : 'jobs'}
                </p>
              </div>
              <button
                className="enterprise-btn enterprise-btn--outline"
                onClick={loadLikedJobs}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
                Refresh
              </button>
            </div>

            {likedJobs.length === 0 ? (
              <div className="enterprise-empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-400)" strokeWidth="1.5" style={{ marginBottom: '1rem' }}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: 600, color: 'var(--neutral-700)' }}>
                  No Liked Jobs Yet
                </h3>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--neutral-600)' }}>
                  When you like jobs in the Recommendations tab, they'll appear here
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {likedJobs.map((likedJob: any) => (
                  <div key={likedJob.match_state_id} className="enterprise-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--neutral-900)' }}>
                          {likedJob.job.title}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                              <circle cx="12" cy="7" r="4"/>
                            </svg>
                            {likedJob.job.company_name}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            {likedJob.job.location}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                            </svg>
                            {likedJob.job.work_type}
                          </span>
                          {likedJob.job.min_rate && likedJob.job.max_rate && (
                            <span style={{ fontWeight: 600, color: 'var(--success-green)' }}>
                              ${likedJob.job.min_rate}-${likedJob.job.max_rate}/hr
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Match Score Badge */}
                      {likedJob.match_score && (
                        <div style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--indigo-50)',
                          color: 'var(--primary-indigo)',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          border: '1px solid var(--primary-indigo)'
                        }}>
                          {Math.round(likedJob.match_score)}% Match
                        </div>
                      )}
                    </div>

                    {/* Liked timestamp */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--neutral-500)', marginBottom: '1rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--error-red)" stroke="var(--error-red)" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      Liked {likedJob.liked_at ? new Date(likedJob.liked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently'}
                    </div>

                    {/* Recruiter Status Badge */}
                    {likedJob.recruiter_action && likedJob.recruiter_action !== 'NONE' && (
                      <div style={{ marginBottom: '1rem' }}>
                        {likedJob.recruiter_action === 'LIKE' && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.875rem',
                            backgroundColor: 'var(--success-green-light)',
                            color: 'var(--success-green)',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: 600
                          }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                              <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                            Mutual Interest - Recruiter also liked you!
                          </div>
                        )}
                        {likedJob.recruiter_action === 'ASK_TO_APPLY' && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.875rem',
                            backgroundColor: 'var(--indigo-50)',
                            color: 'var(--primary-indigo)',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: 600
                          }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                              <polyline points="22,6 12,13 2,6"/>
                            </svg>
                            Recruiter invited you to apply!
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        className="enterprise-btn enterprise-btn--outline"
                        onClick={() => handleViewJob(likedJob.job.id)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        View Details
                      </button>
                      <button 
                        className="enterprise-btn enterprise-btn--primary"
                        onClick={async () => {
                          if (!candidateId) return;
                          try {
                            await matchesAPI.candidateAction(candidateId, likedJob.job.id, 'APPLY');
                            alert('Application submitted successfully!');
                            loadLikedJobs(); // Refresh list
                          } catch (error) {
                            console.error('Failed to apply:', error);
                            alert('Failed to submit application. Please try again.');
                          }
                        }}
                        style={{ flex: 2 }}
                      >
                        Apply Now →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Available Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="jobs-section">
            <h2>Available Job Opportunities</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Browse and apply to job postings from recruiters on the platform. Click "Apply" to submit your application.
            </p>
            {availableJobs && availableJobs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {availableJobs.map((job: any) => (
                  <div key={job.id} style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '24px',
                    backgroundColor: '#fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    {/* Header Section */}
                    <div style={{ marginBottom: '16px' }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#2c3e50' }}>
                        {job.title || job.job_title || 'Job Title'}
                      </h3>
                      <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>
                        <strong>Product:</strong> {job.product_author && job.product 
                          ? `${job.product_author} - ${job.product}` 
                          : 'Not specified'
                        } {job.role && <span><strong> | Role:</strong> {job.role}</span>}
                      </p>
                      {job.company_name && (
                        <p style={{ margin: '0 0 12px 0', color: '#999', fontSize: '13px' }}>
                          <strong>Company:</strong> {job.company_name}
                        </p>
                      )}
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
                      alignItems: 'center',
                      flexWrap: 'wrap'
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

                    {/* Description */}
                    {job.description && (
                      <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#999', textTransform: 'uppercase' }}>Description</p>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
                          {job.description.substring(0, 300)}
                          {job.description.length > 300 ? '...' : ''}
                        </p>
                      </div>
                    )}

                    {/* Skills & Apply Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      {job.required_skills && job.required_skills.length > 0 && (
                        <div>
                          <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>
                            Required Skills:
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {job.required_skills.slice(0, 3).map((skill: string, idx: number) => (
                              <span key={idx} style={{
                                backgroundColor: '#e3f2fd',
                                color: '#1976d2',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px'
                              }}>
                                {skill}
                              </span>
                            ))}
                            {job.required_skills.length > 3 && (
                              <span style={{
                                backgroundColor: '#f5f5f5',
                                color: '#666',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px'
                              }}>
                                +{job.required_skills.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      <button 
                        onClick={() => handleApplyJob(job.id)}
                        disabled={saving}
                        style={{
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          opacity: saving ? 0.7 : 1,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {saving ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                backgroundColor: '#f9f9f9',
                border: '2px dashed #ddd',
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center'
              }}>
                <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
                  📋 No jobs available yet. Check back soon!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
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
          onClick={() => setShowJobModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              maxWidth: '800px',
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
                    {selectedJob.title}
                  </h2>
                  <p style={{ margin: 0, fontSize: '1rem', color: 'var(--neutral-600)' }}>
                    {selectedJob.company?.company_name || 'Company Name'}
                  </p>
                </div>
                <button
                  onClick={() => setShowJobModal(false)}
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
              {/* Job Description */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600, color: 'var(--neutral-900)' }}>
                  Job Description
                </h3>
                <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--neutral-700)', whiteSpace: 'pre-wrap' }}>
                  {selectedJob.description || 'No description provided.'}
                </p>
              </div>

              {/* Job Details Grid */}
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
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--neutral-900)', fontWeight: 500 }}>{selectedJob.role || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--neutral-900)', fontWeight: 500 }}>{selectedJob.location || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Seniority</div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--neutral-900)', fontWeight: 500 }}>{selectedJob.seniority || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Job Type</div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--neutral-900)', fontWeight: 500 }}>{selectedJob.job_type || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Work Type</div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--neutral-900)', fontWeight: 500 }}>{selectedJob.work_type || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rate Range</div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--neutral-900)', fontWeight: 500 }}>
                    {selectedJob.min_rate && selectedJob.max_rate 
                      ? `$${selectedJob.min_rate}-$${selectedJob.max_rate}/hr`
                      : 'N/A'
                    }
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--neutral-900)', fontWeight: 500 }}>{selectedJob.duration || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Start Date</div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--neutral-900)', fontWeight: 500 }}>
                    {selectedJob.start_date ? new Date(selectedJob.start_date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Required Skills */}
              {selectedJob.required_skills && selectedJob.required_skills.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600, color: 'var(--neutral-900)' }}>
                    Required Skills
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedJob.required_skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        style={{
                          padding: '0.5rem 0.875rem',
                          backgroundColor: 'var(--indigo-50)',
                          color: 'var(--primary-indigo)',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          border: '1px solid var(--primary-indigo)'
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Nice to Have Skills */}
              {selectedJob.nice_to_have_skills && selectedJob.nice_to_have_skills.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600, color: 'var(--neutral-900)' }}>
                    Nice to Have Skills
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedJob.nice_to_have_skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        style={{
                          padding: '0.5rem 0.875rem',
                          backgroundColor: 'var(--neutral-100)',
                          color: 'var(--neutral-700)',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          border: '1px solid var(--neutral-300)'
                        }}
                      >
                        {skill}
                      </span>
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
              position: 'sticky',
              bottom: 0,
              backgroundColor: 'white',
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px'
            }}>
              <button
                onClick={() => setShowJobModal(false)}
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

export default CandidateDashboard;
