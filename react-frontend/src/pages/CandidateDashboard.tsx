import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  candidateAPI,
  jobRolesAPI,
  jobsAPI,
  preferencesAPI,
  default as apiClient,
} from '../api/client';
import { useAuth } from '../context/authStore';
import { JobPreferenceCard, JobPreferencesList } from '../components/JobPreferencesCard';
import { SkillSelector } from '../components/SkillSelector';
import '../styles/Dashboard.css';

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
  const { logout } = useAuth();
  
  // Profile state
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [applications, setApplications] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [preferences, setPreferences] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [resumes, setResumes] = useState<any[]>([]);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  
  // Multiple job profiles state
  const [jobProfiles, setJobProfiles] = useState<any[]>([]);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  
  // Author/Product/Role dropdowns
  const [authors, setAuthors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [allSkills, setAllSkills] = useState<any[]>([]);
  
  // Skills state for main profile and job preferences
  const [skillsInput, setSkillsInput] = useState<any[]>([]);
  const [prefSkillsInput, setPrefSkillsInput] = useState<any[]>([]);
  
  // Preference form state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentPreference, setCurrentPreference] = useState<any>({
    product_author_id: 0,
    product_id: 0,
    roles: [],
    years_experience_min: undefined,
    years_experience_max: undefined,
    hourly_rate_min: undefined,
    hourly_rate_max: undefined,
    required_skills: [],
    work_type: '',
    location_preferences: [],
    availability: '',
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedSkill, setSelectedSkill] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedLocation, setSelectedLocation] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showPreferenceForm, setShowPreferenceForm] = useState(false);
  
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
      const [profileRes, resumesRes, appsRes, authorsRes, skillsRes, jobsRes, productsRes, jobProfilesRes] = await Promise.all([
        candidateAPI.getMe(),
        candidateAPI.listResumes().catch(() => ({ data: [] })),
        candidateAPI.listApplications().catch(() => ({ data: [] })),
        jobRolesAPI.getAuthors().catch(() => ({ data: [] })),
        jobRolesAPI.getSkills().catch(() => ({ data: [] })),
        apiClient.get('/jobs/available').catch(() => ({ data: [] })),
        jobRolesAPI.getProducts('Oracle').catch(() => ({ data: [] })),
        preferencesAPI.getMyPreferences().catch(() => ({ data: [] })),
      ]);

      setProfile(profileRes.data || {});
      setFormData(profileRes.data || {});
      setResumes(Array.isArray(resumesRes.data) ? resumesRes.data : []);
      setApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
      
      // Handle job profiles
      const jobProfilesData = Array.isArray(jobProfilesRes.data) ? jobProfilesRes.data : jobProfilesRes.data?.data || [];
      setJobProfiles(jobProfilesData);
      
      // Handle authors response - could be array or wrapped in data
      const authorsData = Array.isArray(authorsRes.data) ? authorsRes.data : authorsRes.data?.data || [];
      setAuthors(authorsData);
      
      const skillsData = Array.isArray(skillsRes.data) ? skillsRes.data : skillsRes.data?.data || [];
      setAllSkills(skillsData);
      
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resetPreferenceForm = () => {
    setCurrentPreference({
      product_author_id: 0,
      product_id: 0,
      roles: [],
      years_experience_min: undefined,
      years_experience_max: undefined,
      hourly_rate_min: undefined,
      hourly_rate_max: undefined,
      required_skills: [],
      work_type: '',
      location_preferences: [],
      availability: '',
    });
    setSelectedSkill('');
    setSelectedLocation('');
    setProducts([]);
    setRoles([]);
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

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      // Only send fields that the backend expects
      const updateData = {
        name: formData.name,
        location: formData.location,
        summary: formData.summary,
        product: formData.product,
        primary_role: formData.primary_role,
        years_experience: formData.years_experience,
        rate_min: formData.rate_min,
        rate_max: formData.rate_max,
        availability: formData.availability,
        work_type: formData.work_type,
      };
      await candidateAPI.updateMe(updateData);
      setError('');
      alert('Profile updated successfully');
      await fetchAllData();
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (skillName: string, category: string) => {
    try {
      setSaving(true);
      await candidateAPI.addSkill({ name: skillName, category, level: 'Intermediate' });
      await fetchAllData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add skill');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSkill = async (skillId: number) => {
    try {
      setSaving(true);
      await candidateAPI.removeSkill(skillId);
      await fetchAllData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to remove skill');
    } finally {
      setSaving(false);
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
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
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

  // ========== Multiple Job Profiles Handlers ==========

  const handleAddProfile = () => {
    setFormMode('add');
    setEditingProfile({
      preference_name: '',
      product: '',
      primary_role: '',
      years_experience: undefined,
      rate_min: undefined,
      rate_max: undefined,
      work_type: '',
      location: '',
      availability: '',
      summary: '',
    });
    setProducts([]);
    setRoles([]);
    setShowProfileForm(true);
  };

  const handleEditProfile = (profile: any) => {
    setFormMode('edit');
    setEditingProfile(profile);
    setShowProfileForm(true);
    // Load roles for the product
    if (profile.product) {
      handleLoadRoles('Oracle', profile.product);
    }
  };

  const handleSaveProfile = async () => {
    if (!editingProfile.product || !editingProfile.primary_role) {
      setError('Please select both product and role');
      return;
    }

    try {
      setSaving(true);
      const profileData = {
        preference_name: editingProfile.preference_name || `${editingProfile.product} - ${editingProfile.primary_role}`,
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
        await preferencesAPI.create(profileData);
        setError('');
        alert('Profile created successfully!');
      } else {
        await preferencesAPI.update(editingProfile.id, profileData);
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

  const handleDeleteProfile = async (preferenceId: number) => {
    try {
      setSaving(true);
      await preferencesAPI.delete(preferenceId);
      setError('');
      alert('Profile deleted successfully!');
      await fetchAllData();
    } catch (err: any) {
      console.error('Error deleting profile:', err);
      setError(err.response?.data?.detail || 'Failed to delete profile');
    } finally {
      setSaving(false);
    }
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
        <h1>Candidate Dashboard</h1>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </header>

      <nav className="dashboard-tabs">
        <button className={`tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile Dashboard</button>
        <button className={`tab ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => setActiveTab('skills')}>Skills</button>
        <button className={`tab ${activeTab === 'certifications' ? 'active' : ''}`} onClick={() => setActiveTab('certifications')}>Certifications</button>
        <button className={`tab ${activeTab === 'resumes' ? 'active' : ''}`} onClick={() => setActiveTab('resumes')}>Resumes</button>
        <button className={`tab ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>Applications</button>
        <button className={`tab ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>Available Jobs</button>
      </nav>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-content">
        {/* Profile Dashboard Tab - Shows Main Profile + All Job Profiles */}
        {activeTab === 'profile' && profile && (
          <div className="profile-dashboard-section">
            {/* Main Profile Section */}
            <div style={{ marginBottom: '48px' }}>
              <h2>Main Profile</h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>Your primary candidate information and details.</p>
              
              {/* Profile Summary Card */}
              <div style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '24px',
                marginBottom: '32px'
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Profile Summary</h3>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>A quick view of your candidate information and preferences.</p>
                
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
                </div>

                {/* Skills Section */}
                {(profile?.skills?.length > 0 || skillsInput.length > 0) && (
                  <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e0e0e0' }}>
                    <p style={{ margin: '0 0 12px 0', color: '#999', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Key Skills ({(profile?.skills?.length || 0) + skillsInput.length})</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {/* Display saved skills */}
                      {profile?.skills?.map((skill: any) => (
                        <div 
                          key={`saved-${skill.id}`}
                          style={{
                            backgroundColor: skill.category === 'technical' ? '#e3f2fd' : '#f3e5f5',
                            color: skill.category === 'technical' ? '#1976d2' : '#7b1fa2',
                            padding: '6px 12px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: 500,
                            border: skill.category === 'technical' ? '1px solid #90caf9' : '1px solid #e1bee7'
                          }}
                        >
                          {skill.name}
                          {skill.level && <span> ({skill.level})</span>}
                        </div>
                      ))}
                      {/* Display newly added skills (not yet saved) */}
                      {skillsInput.map((skill: any, idx: number) => (
                        <div 
                          key={`new-${idx}`}
                          style={{
                            backgroundColor: skill.category === 'technical' ? '#e3f2fd' : '#f3e5f5',
                            color: skill.category === 'technical' ? '#1976d2' : '#7b1fa2',
                            padding: '6px 12px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: 500,
                            border: skill.category === 'technical' ? '2px solid #90caf9' : '2px solid #e1bee7',
                            opacity: 0.85,
                            position: 'relative'
                          }}
                        >
                          {skill.name}
                          {skill.level && <span> ({skill.level})</span>}
                          <span style={{ marginLeft: '6px', fontSize: '10px', opacity: 0.7 }}>✨</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <h3>Edit Main Profile</h3>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Years of Experience</label>
                <input type="number" value={formData.years_experience || ''} onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Rate Min ($)</label>
                  <input type="number" value={formData.rate_min || ''} onChange={(e) => setFormData({ ...formData, rate_min: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Rate Max ($)</label>
                  <input type="number" value={formData.rate_max || ''} onChange={(e) => setFormData({ ...formData, rate_max: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div className="form-group">
                <label>Availability</label>
                <input 
                  type="text" 
                  placeholder="e.g., Immediately, 2 weeks, Starting Jan 15, etc." 
                  value={formData.availability || ''} 
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label>Work Type</label>
                <select value={formData.work_type || ''} onChange={(e) => setFormData({ ...formData, work_type: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <h3>Product/Role Focus</h3>
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
                <label>Product Type</label>
                <select value={formData.product || ''} onChange={(e) => { setFormData({ ...formData, product: e.target.value, primary_role: '' }); setRoles([]); }} onFocus={() => handleLoadProducts('Oracle')}>
                  <option value="">Select Product...</option>
                  {products.map((p) => (<option key={p} value={p}>{p}</option>))}
                </select>
              </div>
              {formData.product && (
                <div className="form-group">
                  <label>Primary Role</label>
                  <select value={formData.primary_role || ''} onChange={(e) => setFormData({ ...formData, primary_role: e.target.value })} onFocus={() => handleLoadRoles('Oracle', formData.product)}>
                    <option value="">Select Role...</option>
                    {roles.map((r) => (<option key={r} value={r}>{r}</option>))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Professional Summary</label>
                <textarea value={formData.summary || ''} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} rows={4} />
              </div>

              {formData.product && formData.primary_role && (
                <div className="form-group">
                  <label>Key Skills for Your Profile</label>
                  <SkillSelector
                    selectedSkills={skillsInput}
                    onSkillsChange={setSkillsInput}
                    technicalSkills={technicalSkills}
                    softSkills={softSkills}
                  />
                  <small style={{ color: '#999', marginTop: '8px', display: 'block' }}>
                    Select skills that match your experience in {formData.product} - {formData.primary_role}
                  </small>
                </div>
              )}

              <button className="btn btn-primary" onClick={handleUpdateProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
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
                    <label>Profile Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., Oracle Fusion - Senior Developer"
                      value={editingProfile.preference_name || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, preference_name: e.target.value })}
                    />
                    <small style={{ color: '#999' }}>If left empty, will be auto-generated from product and role</small>
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
                        onChange={(e) => setEditingProfile({ ...editingProfile, primary_role: e.target.value })}
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
                    <label>Work Type</label>
                    <select
                      value={editingProfile.work_type || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, work_type: e.target.value })}
                    >
                      <option value="">Select...</option>
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
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
                    <label>Availability</label>
                    <input
                      type="text"
                      placeholder="e.g., Immediately, 2 weeks, Starting Jan 15"
                      value={editingProfile.availability || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, availability: e.target.value })}
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
                      style={{ backgroundColor: '#6c757d' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <JobPreferencesList
                  preferences={jobProfiles}
                  onEdit={handleEditProfile}
                  onDelete={handleDeleteProfile}
                  onAddNew={handleAddProfile}
                />
              )}
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="skills-section">
            <h2>Skills</h2>
            
            {/* Technical Skills Dropdown */}
            <div className="skills-dropdown-group">
              <h3>Technical Skills</h3>
              <select 
                value="" 
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddSkill(e.target.value, 'technical');
                    e.target.value = ''; // Reset dropdown
                  }
                }}
                className="skill-selector"
              >
                <option value="">+ Select a technical skill to add</option>
                {technicalSkills.map((skill) => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
              
              {/* Technical Skills List */}
              <div className="skills-list-filtered">
                {profile?.skills && profile.skills.filter((s: any) => s.category === 'technical').length > 0 ? (
                  <ul>
                    {profile.skills.filter((s: any) => s.category === 'technical').map((skill: any) => (
                      <li key={skill.id} className="skill-item">
                        <div className="skill-info">
                          <strong>{skill.name}</strong>
                          {skill.level && <span className="level">{skill.level}</span>}
                        </div>
                        <button className="btn-delete" onClick={() => handleRemoveSkill(skill.id)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-skills">No technical skills added yet</p>
                )}
              </div>
            </div>

            {/* Soft Skills Dropdown */}
            <div className="skills-dropdown-group">
              <h3>Soft Skills</h3>
              <select 
                value="" 
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddSkill(e.target.value, 'soft');
                    e.target.value = ''; // Reset dropdown
                  }
                }}
                className="skill-selector"
              >
                <option value="">+ Select a soft skill to add</option>
                {softSkills.map((skill) => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
              
              {/* Soft Skills List */}
              <div className="skills-list-filtered">
                {profile?.skills && profile.skills.filter((s: any) => s.category === 'soft').length > 0 ? (
                  <ul>
                    {profile.skills.filter((s: any) => s.category === 'soft').map((skill: any) => (
                      <li key={skill.id} className="skill-item">
                        <div className="skill-info">
                          <strong>{skill.name}</strong>
                          {skill.level && <span className="level">{skill.level}</span>}
                        </div>
                        <button className="btn-delete" onClick={() => handleRemoveSkill(skill.id)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-skills">No soft skills added yet</p>
                )}
              </div>
            </div>

            {/* Summary */}
            <div style={{
              backgroundColor: '#f0f7ff',
              border: '1px solid #b3d9ff',
              borderRadius: '6px',
              padding: '12px 16px',
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#0066cc' }}>
                Total Skills: <strong>{profile?.skills?.length || 0}</strong>
                {profile?.skills && ` (${profile.skills.filter((s: any) => s.category === 'technical').length} technical, ${profile.skills.filter((s: any) => s.category === 'soft').length} soft)`}
              </p>
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

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="applications-section">
            <h2>Your Applications</h2>
            {applications && applications.length > 0 ? (
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Match Score</th>
                    <th>Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app: any) => (
                    <tr key={app.id}>
                      <td>{app.job_title}</td>
                      <td>{app.company_name}</td>
                      <td><span className={`status status-${app.status}`}>{app.status}</span></td>
                      <td>{app.match_score ? `${app.match_score.toFixed(0)}%` : 'N/A'}</td>
                      <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No applications yet</p>
            )}

            {/* Recommendations Section */}
            <div style={{ marginTop: '40px' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '20px' }}>📊 AI Recommendations</h3>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Based on your profile, skills, and preferences, we recommend the following opportunities:
              </p>
              {recommendations && recommendations.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {recommendations.map((rec: any) => (
                    <div key={rec.id} style={{
                      border: '2px solid #4CAF50',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#f1f8f4'
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>{rec.job_title}</h4>
                      <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>
                        <strong>{rec.company_name}</strong>
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                        <span style={{ 
                          backgroundColor: '#4CAF50', 
                          color: 'white', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {rec.match_score ? `${rec.match_score}% Match` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#f0f7ff',
                  border: '1px solid #b3d9ff',
                  borderRadius: '6px',
                  padding: '16px',
                  textAlign: 'center',
                  color: '#0066cc'
                }}>
                  <p style={{ margin: 0 }}>
                    💡 AI recommendations will appear here as they become available. Explore "Available Jobs" to find opportunities!
                  </p>
                </div>
              )}
            </div>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {availableJobs.map((job: any) => (
                  <div key={job.id} style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    backgroundColor: '#fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease'
                  }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#2c3e50' }}>
                      {job.title || job.job_title || 'Job Title'}
                    </h3>
                    <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>
                      <strong>Company:</strong> {job.company_name || 'Company Name'}
                    </p>
                    
                    {job.description && (
                      <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '13px', lineHeight: '1.5' }}>
                        {job.description.substring(0, 150)}...
                      </p>
                    )}

                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '12px' }}>
                        <strong>Required Skills:</strong>
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {job.required_skills && job.required_skills.length > 0 ? (
                          job.required_skills.slice(0, 3).map((skill: string, idx: number) => (
                            <span key={idx} style={{
                              backgroundColor: '#e3f2fd',
                              color: '#1976d2',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}>
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#999' }}>Not specified</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                      <div>
                        {job.salary_min && job.salary_max && (
                          <p style={{ margin: 0, fontSize: '13px', color: '#4CAF50', fontWeight: 'bold' }}>
                            ${job.salary_min}k - ${job.salary_max}k/yr
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={() => handleApplyJob(job.id)}
                        disabled={saving}
                        style={{
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          opacity: saving ? 0.7 : 1
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
    </div>
  );
};

export default CandidateDashboard;
