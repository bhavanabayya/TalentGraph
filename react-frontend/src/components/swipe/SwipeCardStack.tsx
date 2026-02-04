import React, { useState } from 'react';

interface SwipeCardStackProps<T> {
  cards: T[];
  renderCard: (card: T, unlockLevel?: string) => React.ReactNode;
  onSwipeLeft: (card: T) => void;
  onSwipeRight: (card: T) => void;
  onAskToApply?: (card: T) => void;
  onPrimaryCTA?: (card: T) => void;
  onBookmark?: (card: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  variant?: 'recruiter' | 'candidate';
}

function SwipeCardStack<T extends { id: number }>({
  cards,
  renderCard,
  onSwipeLeft,
  onSwipeRight,
  onAskToApply,
  loading = false,
  emptyMessage = 'No more recommendations',
  variant = 'candidate'
}: SwipeCardStackProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const currentCard = cards[currentIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentCard || loading) return;

    setSwipeDirection(direction);

    // Trigger callback
    if (direction === 'left') {
      onSwipeLeft(currentCard);
    } else {
      onSwipeRight(currentCard);
    }

    // Move to next card after animation
    setTimeout(() => {
      setSwipeDirection(null);
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (loading) return;
    
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (direction === 'next' && currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handleSwipe('left');
      } else if (e.key === 'ArrowRight') {
        handleSwipe('right');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentCard]);

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        color: '#6b7280'
      }}>
        <div>Loading recommendations...</div>
      </div>
    );
  }

  // Empty state
  if (!currentCard || currentIndex >= cards.length) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        border: '2px dashed #d1d5db'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
        <p style={{ fontSize: '18px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
          You've reviewed all recommendations!
        </p>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '500px' }}>
      {/* Card Stack Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Current Card */}
        <div style={{
          position: 'relative',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          transition: swipeDirection ? 'transform 0.3s ease, opacity 0.3s ease' : 'none',
          transform: swipeDirection === 'left' ? 'translateX(-100%) rotate(-10deg)' :
                     swipeDirection === 'right' ? 'translateX(100%) rotate(10deg)' : 'none',
          opacity: swipeDirection ? 0 : 1
        }}>
          {/* Swipe Direction Overlay */}
          {swipeDirection && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '64px',
              fontWeight: 700,
              color: swipeDirection === 'right' ? '#10b981' : '#ef4444',
              opacity: 0.8,
              zIndex: 100,
              pointerEvents: 'none'
            }}>
              {swipeDirection === 'right' ? '✓' : '✗'}
            </div>
          )}

          {renderCard(currentCard)}
        </div>

        {/* Progress Indicator with Navigation Arrows */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <button
            onClick={() => handleNavigate('prev')}
            disabled={currentIndex === 0 || loading}
            style={{
              padding: '6px 12px',
              fontSize: '18px',
              backgroundColor: '#f3f4f6',
              color: currentIndex === 0 || loading ? '#d1d5db' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: currentIndex === 0 || loading ? 'not-allowed' : 'pointer',
              opacity: currentIndex === 0 || loading ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (currentIndex > 0 && !loading) {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            title="Previous recommendation (preview only)"
          >
            ←
          </button>
          
          <div style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#6b7280',
            minWidth: '60px'
          }}>
            {currentIndex + 1} / {cards.length}
          </div>

          <button
            onClick={() => handleNavigate('next')}
            disabled={currentIndex === cards.length - 1 || loading}
            style={{
              padding: '6px 12px',
              fontSize: '18px',
              backgroundColor: '#f3f4f6',
              color: currentIndex === cards.length - 1 || loading ? '#d1d5db' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: currentIndex === cards.length - 1 || loading ? 'not-allowed' : 'pointer',
              opacity: currentIndex === cards.length - 1 || loading ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (currentIndex < cards.length - 1 && !loading) {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            title="Next recommendation (preview only)"
          >
            →
          </button>
        </div>
      </div>

      {/* Swipe Helper Text */}
      <div style={{
        marginTop: '20px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#9ca3af',
        marginBottom: '12px'
      }}>
        Use navigation arrows above to browse • Use buttons below to Pass or Like
      </div>

      {/* Swipe Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        marginTop: '12px'
      }}>
        <button
          onClick={() => handleSwipe('left')}
          disabled={!currentCard || loading}
          style={{
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: 600,
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: !currentCard || loading ? 'not-allowed' : 'pointer',
            opacity: !currentCard || loading ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (currentCard && !loading) e.currentTarget.style.backgroundColor = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
          }}
        >
          ✗ Pass
        </button>
        <button
          onClick={() => handleSwipe('right')}
          disabled={!currentCard || loading}
          style={{
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: 600,
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: !currentCard || loading ? 'not-allowed' : 'pointer',
            opacity: !currentCard || loading ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (currentCard && !loading) e.currentTarget.style.backgroundColor = '#059669';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#10b981';
          }}
        >
          ✓ Like
        </button>
        {variant === 'recruiter' && onAskToApply && (
          <button
            onClick={() => onAskToApply(currentCard)}
            disabled={!currentCard || loading}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: 600,
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: !currentCard || loading ? 'not-allowed' : 'pointer',
              opacity: !currentCard || loading ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (currentCard && !loading) e.currentTarget.style.backgroundColor = '#7c3aed';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#8b5cf6';
            }}
          >
            📨 Ask to Apply
          </button>
        )}
      </div>
    </div>
  );
}

export default SwipeCardStack;
