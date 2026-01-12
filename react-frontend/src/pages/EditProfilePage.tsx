import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  candidateAPI,
  jobRolesAPI,
} from '../api/client';
import { useAuth } from '../context/authStore';
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

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Profile state
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Skills state
  const [skillsInput, setSkillsInput] = useState<any[]>([]);
  
  // Author/Product/Role dropdowns
  const [products, setProducts] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const profileRes = await candidateAPI.getMe();
      
      setProfile(profileRes.data || {});
      setFormData(profileRes.data || {});
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load profile data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
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
      // Redirect back to dashboard
      navigate('/candidate-dashboard');
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/candidate-dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <div className="dashboard-container loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Edit Profile</h1>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-content">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
            <h2>Edit Main Profile</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>Update your primary candidate information and details.</p>

            <div className="form-group">
              <label>Name</label>
              <input 
                type="text" 
                value={formData.name || ''} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input 
                type="text" 
                value={formData.location || ''} 
                onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
              />
            </div>

            <div className="form-group">
              <label>Years of Experience</label>
              <input 
                type="number" 
                value={formData.years_experience || ''} 
                onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) })} 
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Rate Min ($)</label>
                <input 
                  type="number" 
                  value={formData.rate_min || ''} 
                  onChange={(e) => setFormData({ ...formData, rate_min: parseFloat(e.target.value) })} 
                />
              </div>
              <div className="form-group">
                <label>Rate Max ($)</label>
                <input 
                  type="number" 
                  value={formData.rate_max || ''} 
                  onChange={(e) => setFormData({ ...formData, rate_max: parseFloat(e.target.value) })} 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Availability</label>
              <input 
                type="date" 
                value={formData.availability || ''} 
                onChange={(e) => {
                  const date = e.target.value;
                  if (date) {
                    const dateObj = new Date(date);
                    const formattedDate = dateObj.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    });
                    setFormData({ ...formData, availability: formattedDate });
                  } else {
                    setFormData({ ...formData, availability: '' });
                  }
                }}
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <small style={{ color: '#999', marginTop: '4px', display: 'block' }}>Select your availability date</small>
            </div>

            <div className="form-group">
              <label>Work Type</label>
              <select 
                value={formData.work_type || ''} 
                onChange={(e) => setFormData({ ...formData, work_type: e.target.value })}
              >
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
              <select 
                value={formData.product || ''} 
                onChange={(e) => { 
                  setFormData({ ...formData, product: e.target.value, primary_role: '' }); 
                  setRoles([]); 
                }} 
                onFocus={() => handleLoadProducts('Oracle')}
              >
                <option value="">Select Product...</option>
                {products.map((p) => (<option key={p} value={p}>{p}</option>))}
              </select>
            </div>

            {formData.product && (
              <div className="form-group">
                <label>Primary Role</label>
                <select 
                  value={formData.primary_role || ''} 
                  onChange={(e) => setFormData({ ...formData, primary_role: e.target.value })} 
                  onFocus={() => handleLoadRoles('Oracle', formData.product)}
                >
                  <option value="">Select Role...</option>
                  {roles.map((r) => (<option key={r} value={r}>{r}</option>))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Professional Summary</label>
              <textarea 
                value={formData.summary || ''} 
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })} 
                rows={4} 
              />
            </div>

            {formData.product && formData.primary_role && (
              <div className="form-group">
                <label>Key Skills for Your Profile</label>
                <SkillSelector
                  selectedSkills={[
                    ...(profile?.skills?.map((s: any) => ({ name: s.name, rating: s.rating || 3 })) || []),
                    ...skillsInput
                  ]}
                  onSkillsChange={(updatedSkills: any[]) => {
                    // Filter out saved skills and keep only new ones
                    const savedSkillNames = profile?.skills?.map((s: any) => s.name) || [];
                    const newSkills = updatedSkills.filter((s: any) => !savedSkillNames.includes(s.name));
                    setSkillsInput(newSkills);
                  }}
                  technicalSkills={technicalSkills}
                  softSkills={softSkills}
                />
                <small style={{ color: '#999', marginTop: '8px', display: 'block' }}>
                  Select skills that match your experience in {formData.product} - {formData.primary_role}
                </small>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
              <button 
                className="btn btn-primary" 
                onClick={handleUpdateProfile} 
                disabled={saving}
                style={{ flex: 1 }}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleCancel}
                disabled={saving}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;
