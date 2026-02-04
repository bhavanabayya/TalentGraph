import React from 'react';

interface SwipeActionBarProps {
  variant: 'recruiter' | 'candidate';
  onPass: () => void;
  onSave?: () => void;
  onLike?: () => void;
  onPrimaryCTA: () => void; // Ask to Apply / Apply
  primaryCTALabel?: string;
  disabledMap?: {
    pass?: boolean;
    save?: boolean;
    like?: boolean;
    primary?: boolean;
  };
  loading?: boolean;
}

const SwipeActionBar: React.FC<SwipeActionBarProps> = ({
  variant,
  onPass,
  onSave,
  onLike,
  onPrimaryCTA,
  primaryCTALabel,
  disabledMap = {},
  loading = false
}) => {
  const buttonStyle = (color: string, disabled: boolean) => ({
    flex: 1,
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '6px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.5 : 1,
    transition: 'all 0.2s',
    backgroundColor: color,
    color: 'white'
  });

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      padding: '16px',
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb'
    }}>
      {/* Pass Button */}
      <button
        onClick={onPass}
        disabled={disabledMap.pass || loading}
        style={buttonStyle('#ef4444', !!disabledMap.pass)}
        onMouseEnter={(e) => {
          if (!disabledMap.pass && !loading) {
            e.currentTarget.style.backgroundColor = '#dc2626';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ef4444';
        }}
      >
        {variant === 'candidate' ? '✗ Not Interested' : '✗ Pass'}
      </button>

      {/* Save Button (optional) */}
      {onSave && (
        <button
          onClick={onSave}
          disabled={disabledMap.save || loading}
          style={buttonStyle('#6b7280', !!disabledMap.save)}
          onMouseEnter={(e) => {
            if (!disabledMap.save && !loading) {
              e.currentTarget.style.backgroundColor = '#4b5563';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6b7280';
          }}
        >
          ⭐ Save
        </button>
      )}

      {/* Like Button (recruiter only) */}
      {variant === 'recruiter' && onLike && (
        <button
          onClick={onLike}
          disabled={disabledMap.like || loading}
          style={buttonStyle('#3b82f6', !!disabledMap.like)}
          onMouseEnter={(e) => {
            if (!disabledMap.like && !loading) {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
        >
          👍 Like
        </button>
      )}

      {/* Interested Button (candidate only) */}
      {variant === 'candidate' && onLike && (
        <button
          onClick={onLike}
          disabled={disabledMap.like || loading}
          style={buttonStyle('#10b981', !!disabledMap.like)}
          onMouseEnter={(e) => {
            if (!disabledMap.like && !loading) {
              e.currentTarget.style.backgroundColor = '#059669';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#10b981';
          }}
        >
          ✓ Interested
        </button>
      )}

      {/* Primary CTA (Ask to Apply / Apply) */}
      <button
        onClick={onPrimaryCTA}
        disabled={disabledMap.primary || loading}
        style={buttonStyle('#8b5cf6', !!disabledMap.primary)}
        onMouseEnter={(e) => {
          if (!disabledMap.primary && !loading) {
            e.currentTarget.style.backgroundColor = '#7c3aed';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#8b5cf6';
        }}
      >
        {primaryCTALabel || (variant === 'recruiter' ? '📨 Ask to Apply' : '✅ Apply')}
      </button>
    </div>
  );
};

export default SwipeActionBar;
