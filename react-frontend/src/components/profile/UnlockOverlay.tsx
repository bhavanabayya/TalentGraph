import React from 'react';

interface UnlockOverlayProps {
  unlockLevel: string;
  reasonText?: string;
  children: React.ReactNode;
  section?: 'resume' | 'contact' | 'full-profile';
}

const UnlockOverlay: React.FC<UnlockOverlayProps> = ({ 
  unlockLevel, 
  reasonText = 'Full profile unlocks after mutual interest or apply',
  children,
  section = 'full-profile'
}) => {
  // Determine if this section should be locked
  const isLocked = () => {
    if (unlockLevel === 'FULL') return false;
    if (unlockLevel === 'PARTIAL' && section === 'resume') return false;
    if (unlockLevel === 'PREVIEW') return true;
    if (section === 'contact') return unlockLevel !== 'FULL';
    return false;
  };

  const locked = isLocked();

  if (!locked) {
    return <>{children}</>;
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Blurred content */}
      <div style={{
        filter: 'blur(8px)',
        pointerEvents: 'none',
        userSelect: 'none'
      }}>
        {children}
      </div>

      {/* Overlay banner */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px 32px',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        minWidth: '300px',
        zIndex: 10
      }}>
        <div style={{
          fontSize: '32px',
          marginBottom: '12px'
        }}>
          🔒
        </div>
        <p style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#1f2937',
          marginBottom: '8px'
        }}>
          {section === 'resume' ? 'Resume Locked' : 
           section === 'contact' ? 'Contact Info Locked' : 
           'Profile Locked'}
        </p>
        <p style={{
          fontSize: '13px',
          color: '#6b7280',
          lineHeight: '1.5',
          margin: 0
        }}>
          {reasonText}
        </p>
      </div>
    </div>
  );
};

export default UnlockOverlay;
