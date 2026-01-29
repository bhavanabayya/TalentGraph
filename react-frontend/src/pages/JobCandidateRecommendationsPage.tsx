import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SwipeCardStack from '../components/swipe/SwipeCardStack';
import CandidateSwipeCard from '../components/swipe/CandidateSwipeCard';
// import SwipeActionBar from '../components/swipe/SwipeActionBar'; // Commented out - using swipe only
import { jobsAPI, recommendationsAPI, matchesAPI } from '../api/client';
import '../styles/EnterpriseDashboard.css';

interface Candidate {
  id: number;
  name: string;
  headline?: string;
  location?: string;
  experience_years?: number;
  rate_min?: number;
  rate_max?: number;
  availability_start?: string;
  skills?: Array<{ name: string }>;
  certifications?: Array<{ name: string }>;
}

interface Recommendation {
  id: number;
  candidate: Candidate;
  match_score: number;
  match_breakdown?: any;
  match_reasons?: string[];
  unlock_level?: string;
  explanation?: any; // Deprecated - use match_breakdown
}

const JobCandidateRecommendationsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [currentCandidateForInvite, setCurrentCandidateForInvite] = useState<Recommendation | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchRecommendations();
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      console.log('[JobCandidateRecs] Fetching recommendations for job ID:', jobId);
      
      const response = await recommendationsAPI.getJobRecommendations(Number(jobId));
      console.log('[JobCandidateRecs] Raw API response:', response);
      console.log('[JobCandidateRecs] Response data:', response.data);
      
      // Handle different possible response structures
      const recsData = response.data?.recommendations || response.data || [];
      console.log('[JobCandidateRecs] Processed recommendations:', recsData);
      
      const recsWithId = recsData.map((rec: any, idx: number) => ({
        ...rec,
        id: rec.candidate?.id || idx
      }));
      
      console.log('[JobCandidateRecs] Final recommendations with IDs:', recsWithId);
      console.log('[JobCandidateRecs] Recommendations count:', recsWithId.length);
      
      setRecommendations(recsWithId);
    } catch (error) {
      console.error('[JobCandidateRecs] Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobDetails = async () => {
    try {
      console.log('[JobCandidateRecs] Fetching job details for ID:', jobId);
      const response = await jobsAPI.get(Number(jobId));
      console.log('[JobCandidateRecs] Job details:', response.data);
      setCurrentJob(response.data);
    } catch (error) {
      console.error('[JobCandidateRecs] Failed to fetch job details:', error);
    }
  };

  const handlePass = async (rec: Recommendation) => {
    try {
      await matchesAPI.recruiterAction(rec.candidate.id, Number(jobId), 'PASS');
      // Card automatically removed by SwipeCardStack
    } catch (error) {
      console.error('Failed to pass candidate:', error);
      alert('Failed to pass candidate. Please try again.');
    }
  };

  const handleLike = async (rec: Recommendation) => {
    try {
      await matchesAPI.recruiterAction(rec.candidate.id, Number(jobId), 'LIKE');
      // Card automatically removed by SwipeCardStack
    } catch (error) {
      console.error('Failed to like candidate:', error);
      alert('Failed to like candidate. Please try again.');
    }
  };

  const handleAskToApply = (rec: Recommendation) => {
    setCurrentCandidateForInvite(rec);
    setShowMessageInput(true);
  };

  const handleSendInvite = async () => {
    if (!currentCandidateForInvite) return;
    
    try {
      await matchesAPI.recruiterAction(
        currentCandidateForInvite.candidate.id,
        Number(jobId),
        'ASK_TO_APPLY',
        inviteMessage
      );
      
      // Remove candidate from recommendations
      setRecommendations(prev => prev.filter(r => r.id !== currentCandidateForInvite.id));
      
      // Reset state
      setShowMessageInput(false);
      setInviteMessage('');
      setCurrentCandidateForInvite(null);
      
      alert('✅ Invitation sent successfully!');
    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to send invitation. Please try again.';
      alert(`Failed to send invitation: ${errorMessage}`);
    }
  };

  const handleCancelInvite = () => {
    setShowMessageInput(false);
    setInviteMessage('');
    setCurrentCandidateForInvite(null);
  };

  const handleViewProfile = (candidateId: number) => {
    navigate(`/company-dashboard/candidate/${candidateId}`);
  };

  const renderCard = (rec: Recommendation) => {
    return (
      <div>
        <CandidateSwipeCard
          candidate={rec.candidate}
          matchScore={rec.match_score}
          matchExplanation={rec.match_breakdown}
          matchReasons={rec.match_reasons}
          unlockLevel={rec.unlock_level || 'PREVIEW'}
          onViewFullProfile={() => handleViewProfile(rec.candidate.id)}
        />

        {/* SwipeActionBar commented out - using swipe gestures only
        {showAskMessage && (
          <div style={{
            padding: '16px 24px',
            backgroundColor: '#fef3c7',
            borderTop: '1px solid #fbbf24'
          }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: '#92400e',
              marginBottom: '8px'
            }}>
              Add a personal message (optional):
            </label>
            <textarea
              value={askMessage}
              onChange={(e) => setAskMessage(e.target.value)}
              placeholder="We'd love to have you join our team..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                fontSize: '14px',
                borderRadius: '6px',
                border: '1px solid #fbbf24',
                resize: 'vertical'
              }}
            />
            <button
              onClick={() => {
                setShowAskMessage(false);
                setAskMessage('');
              }}
              style={{
                marginTop: '8px',
                padding: '6px 12px',
                fontSize: '13px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        )}

        <SwipeActionBar
          variant="recruiter"
          onPass={() => handlePass(rec)}
          onLike={() => handleLike(rec)}
          onPrimaryCTA={() => handleAskToApply(rec)}
          primaryCTALabel={showAskMessage ? '📨 Send Invitation' : '📨 Ask to Apply'}
          loading={actionLoading}
        />
        */}
      </div>
    );
  };

  return (
    <div className="enterprise-dashboard">
      {/* Header */}
      <header className="enterprise-header">
        <div className="enterprise-header__brand">
          <h1 className="enterprise-header__logo">TalentGraph</h1>
          <div>
            <p className="enterprise-header__user-name">Candidate Discovery</p>
            <p className="enterprise-header__user-role">
              {currentJob ? currentJob.title : 'Loading...'}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/company-dashboard')}
          className="enterprise-btn enterprise-btn--outline"
        >
          ← Back to Dashboard
        </button>
      </header>

      {/* Content */}
      <div className="enterprise-content">
        <div className="enterprise-section">
          <div className="enterprise-section__header">
            <div>
              <h1 className="enterprise-section__title">AI-Matched Candidates</h1>
              {currentJob && (
                <p className="enterprise-section__subtitle">
                  For {currentJob.title} • Discover talent matched to your requirements
                </p>
              )}
            </div>
          </div>

          {/* Message Input Modal */}
          {showMessageInput && currentCandidateForInvite && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '540px',
                width: '90%',
                boxShadow: 'var(--shadow-xl)'
              }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 700, 
                  color: 'var(--neutral-900)', 
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.01em'
                }}>
                  Invite {currentCandidateForInvite.candidate.name} to Apply
                </h3>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--neutral-500)', 
                  marginBottom: '1.5rem',
                  lineHeight: '1.6'
                }}>
                  Add a personal message to encourage this candidate to apply for {currentJob?.title || 'this position'}.
                </p>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="We think you'd be a great fit for this role because..."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: '6px',
                    border: '1px solid var(--neutral-300)',
                    resize: 'vertical',
                    marginBottom: '1.5rem',
                    fontFamily: 'inherit',
                    lineHeight: '1.5'
                  }}
                />
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleCancelInvite}
                    className="enterprise-btn enterprise-btn--outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendInvite}
                    className="enterprise-btn enterprise-btn--primary"
                  >
                    Send Invitation →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Swipe Stack */}
          <SwipeCardStack
            cards={recommendations}
            renderCard={renderCard}
            onSwipeLeft={handlePass}
            onSwipeRight={handleLike}
            onAskToApply={handleAskToApply}
            loading={loading}
            emptyMessage="No more candidate recommendations available. Check back later or adjust your job requirements."
            variant="recruiter"
          />
        </div>
      </div>
    </div>
  );
};

export default JobCandidateRecommendationsPage;
