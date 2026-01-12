import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  candidateAPI,
  jobRolesAPI,
  preferencesAPI,
  default as apiClient,
} from '../api/client';
import { useAuth } from '../context/authStore';
import { SkillSelector } from '../components/SkillSelector';
import SocialLinksWidget from '../components/SocialLinksWidget';
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
  const { logout, email } = useAuth();
  
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [jobProfiles, setJobProfiles] = useState<any[]>([]);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  
  // Author/Product/Role dropdowns
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [authors, setAuthors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [allSkills, setAllSkills] = useState<any[]>([]);
  
  // Skills state for main profile and job preferences
  const [skillsInput, setSkillsInput] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      const jobProfilesData = Array.isArray(jobProfilesRes?.data) ? jobProfilesRes.data : (jobProfilesRes as any)?.data?.data || [];
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
      
      // Handle skill changes
      const currentSkillNames = profile?.skills?.map((s: any) => s.name) || [];
      const selectedSkillNames = [
        ...(profile?.skills?.map((s: any) => s.name) || []),
        ...skillsInput.map((s: any) => s.name)
      ];
      
      // Delete skills that were removed from the SkillSelector
      const skillsToDelete = currentSkillNames.filter((name: string) => !selectedSkillNames.includes(name));
      for (const skillName of skillsToDelete) {
        const skillId = profile?.skills?.find((s: any) => s.name === skillName)?.id;
        if (skillId) {
          await candidateAPI.removeSkill(skillId);
        }
      }
      
      // Add new skills with ratings
      if (skillsInput && skillsInput.length > 0) {
        for (const skill of skillsInput) {
          await candidateAPI.addSkill({
            name: skill.name,
            rating: skill.rating || 3,
            category: 'technical'
          });
        }
      }
      
      setError('');
      alert('Profile updated successfully');
      setSkillsInput([]); // Clear the input after saving
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        <button className={`tab ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>Applications</button>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <h3 style={{ marginTop: 0, marginBottom: 0 }}>Profile Summary</h3>
                  <button
                    onClick={handleEditProfileClick}
                    style={{
                      background: 'linear-gradient(135deg, #0056b3 0%, #4a9eff 100%)',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.3s',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.background = 'linear-gradient(135deg, #003d82 0%, #2b7fd9 100%)';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.background = 'linear-gradient(135deg, #0056b3 0%, #4a9eff 100%)';
                    }}
                  >
                    ✎ Edit Profile
                  </button>
                </div>
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
                    <label>Availability</label>
                    <input
                      type="date"
                      value={editingProfile.availability || ''}
                      onChange={(e) => {
                        const date = e.target.value;
                        if (date) {
                          const dateObj = new Date(date);
                          const formattedDate = dateObj.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          });
                          setEditingProfile({ ...editingProfile, availability: formattedDate });
                        } else {
                          setEditingProfile({ ...editingProfile, availability: '' });
                        }
                      }}
                      style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <small style={{ color: '#999', marginTop: '4px', display: 'block' }}>Select your availability date</small>
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
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#999', textTransform: 'uppercase' }}>Hourly Rate</p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#27ae60', fontWeight: '600' }}>
                          {job.min_rate && job.max_rate 
                            ? `${job.currency || 'USD'} ${job.min_rate} - ${job.max_rate}/hr`
                            : job.min_rate
                            ? `${job.currency || 'USD'} ${job.min_rate}+/hr`
                            : job.salary_min && job.salary_max
                            ? `$${job.salary_min}k - $${job.salary_max}k/yr`
                            : 'Not specified'}
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
    </div>
  );
};

export default CandidateDashboard;
