import React, { useState } from 'react';
import '../styles/SocialMediaLinksManager.css';

interface SocialLink {
  platform: string;
  url: string;
  display_name?: string;
}

interface SocialMediaLinksManagerProps {
  links: SocialLink[];
  onLinksChange: (links: SocialLink[]) => void;
  readOnly?: boolean;
}

const PLATFORM_OPTIONS = [
  'LinkedIn',
  'GitHub',
  'Portfolio',
  'Twitter',
  'Facebook',
  'Instagram',
  'Personal Website',
  'Medium',
  'Dev.to',
  'Stack Overflow',
  'Other'
];

const SocialMediaLinksManager: React.FC<SocialMediaLinksManagerProps> = ({
  links = [],
  onLinksChange,
  readOnly = false
}) => {
  const [newLink, setNewLink] = useState<SocialLink>({
    platform: 'LinkedIn',
    url: '',
    display_name: ''
  });
  const [urlError, setUrlError] = useState('');

  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddLink = () => {
    setUrlError('');

    if (!newLink.platform.trim()) {
      setUrlError('Please select a platform');
      return;
    }

    if (!newLink.url.trim()) {
      setUrlError('Please enter a URL');
      return;
    }

    if (!isValidUrl(newLink.url)) {
      setUrlError('Please enter a valid URL (e.g., https://linkedin.com/in/...)');
      return;
    }

    // Check for duplicates
    if (links.some(l => l.url === newLink.url)) {
      setUrlError('This URL is already added');
      return;
    }

    const linkToAdd: SocialLink = {
      platform: newLink.platform,
      url: newLink.url,
      display_name: newLink.display_name || newLink.platform
    };

    onLinksChange([...links, linkToAdd]);
    setNewLink({ platform: 'LinkedIn', url: '', display_name: '' });
  };

  const handleRemoveLink = (index: number) => {
    onLinksChange(links.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddLink();
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: string } = {
      'LinkedIn': '💼',
      'GitHub': '🐙',
      'Portfolio': '🌐',
      'Twitter': '🐦',
      'Facebook': 'f',
      'Instagram': '📷',
      'Personal Website': '🏠',
      'Medium': '📝',
      'Dev.to': '👨‍💻',
      'Stack Overflow': '⚡',
      'Other': '🔗'
    };
    return icons[platform] || '🔗';
  };

  return (
    <div className="social-media-links-manager">
      <div className="social-header">
        <h3>Social Media & Professional Links</h3>
        <p className="social-subtitle">Add your LinkedIn, GitHub, portfolio, and other professional links</p>
      </div>

      {!readOnly && (
        <div className="add-link-section">
          <div className="add-link-form">
            <select
              value={newLink.platform}
              onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })}
              className="platform-select"
            >
              {PLATFORM_OPTIONS.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>

            <input
              type="url"
              placeholder="https://linkedin.com/in/yourprofile"
              value={newLink.url}
              onChange={(e) => {
                setNewLink({ ...newLink, url: e.target.value });
                setUrlError('');
              }}
              onKeyPress={handleKeyPress}
              className={`url-input ${urlError ? 'error' : ''}`}
            />

            <input
              type="text"
              placeholder="Optional display name (default: platform name)"
              value={newLink.display_name}
              onChange={(e) => setNewLink({ ...newLink, display_name: e.target.value })}
              onKeyPress={handleKeyPress}
              className="display-name-input"
            />

            <button
              onClick={handleAddLink}
              className="add-button"
              type="button"
            >
              + Add Link
            </button>
          </div>
          {urlError && <div className="error-message">{urlError}</div>}
        </div>
      )}

      <div className="links-list">
        {links && links.length > 0 ? (
          <ul className="links-ul">
            {links.map((link, index) => (
              <li key={index} className="link-item">
                <span className="platform-icon">{getPlatformIcon(link.platform)}</span>
                <div className="link-content">
                  <span className="platform-label">{link.platform}</span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-url"
                    title={link.url}
                  >
                    {link.display_name || link.platform}
                  </a>
                </div>
                {!readOnly && (
                  <button
                    onClick={() => handleRemoveLink(index)}
                    className="remove-button"
                    type="button"
                    title="Remove this link"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-links-message">
            {readOnly ? 'No social media links added' : 'No links added yet. Add your first link above!'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialMediaLinksManager;
