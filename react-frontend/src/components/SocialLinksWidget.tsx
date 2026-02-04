import React, { useState, useEffect } from 'react';
import { candidateAPI } from '../api/client';
import '../styles/SocialLinksWidget.css';

interface SocialLink {
  id: number;
  platform: string;
  url: string;
  display_name?: string;
  created_at: string;
}

interface SocialLinksWidgetProps {
  onLinksUpdate?: (links: SocialLink[]) => void;
  editable?: boolean;
}

const PLATFORM_OPTIONS = [
  { value: 'github', label: 'GitHub', icon: '🐙' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'portfolio', label: 'Portfolio', icon: '🌐' },
  { value: 'twitter', label: 'Twitter', icon: '𝕏' },
  { value: 'personal-website', label: 'Personal Website', icon: '🏠' },
];

const SocialLinksWidget: React.FC<SocialLinksWidgetProps> = ({ 
  onLinksUpdate, 
  editable = true 
}) => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    platform: 'github',
    url: '',
    display_name: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  const fetchSocialLinks = async () => {
    try {
      setLoading(true);
      const res = await candidateAPI.getSocialLinks();
      setLinks(res.data);
      setError('');
      if (onLinksUpdate) {
        onLinksUpdate(res.data);
      }
    } catch (err: any) {
      console.error('Error fetching social links:', err);
      setError('Failed to load social links');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async () => {
    if (!formData.url.trim()) {
      setError('URL is required');
      return;
    }

    try {
      if (editingId) {
        // Update existing link
        const res = await candidateAPI.updateSocialLink(editingId, formData);
        setLinks(links.map(l => l.id === editingId ? res.data : l));
      } else {
        // Add new link
        const res = await candidateAPI.addSocialLink(formData);
        setLinks([...links, res.data]);
      }
      
      // Reset form
      setFormData({ platform: 'github', url: '', display_name: '' });
      setEditingId(null);
      setShowForm(false);
      setError('');
      
      if (onLinksUpdate) {
        onLinksUpdate(editingId ? links : [...links, { ...formData, id: 0, created_at: new Date().toISOString() }]);
      }
    } catch (err: any) {
      console.error('Error saving social link:', err);
      setError(err.response?.data?.detail || 'Failed to save social link');
    }
  };

  const handleEdit = (link: SocialLink) => {
    setFormData({
      platform: link.platform,
      url: link.url,
      display_name: link.display_name || '',
    });
    setEditingId(link.id);
    setShowForm(true);
  };

  const handleDelete = async (linkId: number) => {
    if (!window.confirm('Remove this social link?')) return;

    try {
      await candidateAPI.deleteSocialLink(linkId);
      const updatedLinks = links.filter(l => l.id !== linkId);
      setLinks(updatedLinks);
      setError('');
      if (onLinksUpdate) {
        onLinksUpdate(updatedLinks);
      }
    } catch (err: any) {
      console.error('Error deleting social link:', err);
      setError('Failed to delete social link');
    }
  };

  const handleCancel = () => {
    setFormData({ platform: 'github', url: '', display_name: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const getPlatformIcon = (platform: string) => {
    return PLATFORM_OPTIONS.find(p => p.value === platform)?.icon || '🔗';
  };

  const getPlatformLabel = (platform: string) => {
    return PLATFORM_OPTIONS.find(p => p.value === platform)?.label || platform;
  };

  if (loading) {
    return <div className="social-links-widget loading">Loading social links...</div>;
  }

  return (
    <div className="social-links-widget">
      <div className="social-links-header">
        <h3>Social Links & Portfolio</h3>
        {editable && (
          <button 
            className="btn-add-link"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancel' : '+ Add Link'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && editable && (
        <div className="social-link-form">
          <div className="form-group">
            <label>Platform *</label>
            <select 
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
            >
              {PLATFORM_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.icon} {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>URL *</label>
            <input 
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://github.com/yourprofile"
            />
          </div>

          <div className="form-group">
            <label>Display Name (Optional)</label>
            <input 
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="e.g., My GitHub Profile"
            />
          </div>

          <div className="form-actions">
            <button 
              className="btn btn-primary"
              onClick={handleAddLink}
            >
              {editingId ? 'Update Link' : 'Add Link'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="social-links-list">
        {links.length === 0 ? (
          <div className="empty-state">
            <p>No social links added yet</p>
            {editable && <p className="hint">Click "Add Link" to add your portfolio or social media profiles</p>}
          </div>
        ) : (
          links.map(link => (
            <div key={link.id} className="social-link-item">
              <div className="link-icon">{getPlatformIcon(link.platform)}</div>
              <div className="link-content">
                <div className="link-platform">{getPlatformLabel(link.platform)}</div>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="link-url">
                  {link.display_name || link.url}
                </a>
              </div>
              {editable && (
                <div className="link-actions">
                  <button 
                    className="btn-icon btn-edit"
                    onClick={() => handleEdit(link)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn-icon btn-delete"
                    onClick={() => handleDelete(link.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SocialLinksWidget;
