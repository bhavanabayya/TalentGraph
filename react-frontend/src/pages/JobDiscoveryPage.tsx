import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SwipeCardStack from '../components/swipe/SwipeCardStack';
import JobSwipeCard from '../components/swipe/JobSwipeCard';
// import SwipeActionBar from '../components/swipe/SwipeActionBar'; // Commented out - using swipe only
import { candidateAPI, recommendationsAPI, matchesAPI } from '../api/client';
import '../styles/EnterpriseDashboard.css';

interface Job {
  id: number;
  title: string;
  company_name?: string;
  location?: string;
  employment_type?: string;
  rate_min?: number;
  rate_max?: number;
  start_date?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
}

interface Recommendation {
  id: number;
  job: Job;
  match_score: number;
  match_breakdown?: any;
  match_reasons?: string[];
  explanation?: any; // Deprecated - use match_breakdown
}

const JobDiscoveryPage: React.FC = () => {
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidateProfile();
  }, []);

  useEffect(() => {
    if (candidateId) {
      fetchRecommendations();
    }
  }, [candidateId]);

  const fetchCandidateProfile = async () => {
    try {
      console.log('[JobDiscovery] Fetching candidate profile...');
      const response = await candidateAPI.getMe();
      console.log('[JobDiscovery] Candidate profile:', response.data);
      setCandidateId(response.data.id || null);
    } catch (error) {
      console.error('[JobDiscovery] Failed to fetch candidate profile:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      console.log('[JobDiscovery] Fetching recommendations...');
      const response = await recommendationsAPI.getCandidateRecommendations();
      console.log('[JobDiscovery] Raw API response:', response);
      console.log('[JobDiscovery] Recommendations data:', response.data);
      
      const recsData = response.data?.recommendations || response.data || [];
      console.log('[JobDiscovery] Processed recommendations:', recsData);
      
      const recsWithId = recsData.map((rec: any, idx: number) => ({
        ...rec,
        id: rec.job?.id || idx
      }));
      
      console.log('[JobDiscovery] Final recommendations count:', recsWithId.length);
      setRecommendations(recsWithId);
    } catch (error) {
      console.error('[JobDiscovery] Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePass = async (rec: Recommendation) => {
    if (!candidateId) return;

    try {
      await matchesAPI.candidateAction(candidateId, rec.job.id, 'PASS');
      // Card automatically removed by SwipeCardStack
    } catch (error) {
      console.error('Failed to pass job:', error);
      alert('Failed to pass job. Please try again.');
    }
  };

  const handleLike = async (rec: Recommendation) => {
    if (!candidateId) return;

    try {
      await matchesAPI.candidateAction(candidateId, rec.job.id, 'LIKE');
      // Card automatically removed by SwipeCardStack
    } catch (error) {
      console.error('Failed to like job:', error);
      alert('Failed to like job. Please try again.');
    }
  };

  const handleViewJob = (jobId: number) => {
    navigate(`/candidate-dashboard/job/${jobId}`);
  };

  const renderCard = (rec: Recommendation) => {
    return (
      <div>
        <JobSwipeCard
          job={rec.job}
          matchScore={rec.match_score}
          matchExplanation={rec.match_breakdown}
          matchReasons={rec.match_reasons}
          onViewFullJob={() => handleViewJob(rec.job.id)}
        />

        {/* SwipeActionBar commented out - using swipe gestures only
        <SwipeActionBar
          variant="candidate"
          onPass={() => handlePass(rec)}
          onLike={() => handleLike(rec)}
          onPrimaryCTA={() => handleApply(rec)}
          primaryCTALabel="✅ Apply Now"
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
            <p className="enterprise-header__user-name">Job Discovery</p>
            <p className="enterprise-header__user-role">Personalized Matches</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/candidate-dashboard')}
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
              <h1 className="enterprise-section__title">Discover Your Next Opportunity</h1>
              <p className="enterprise-section__subtitle">
                Review AI-matched job recommendations tailored to your skills and career preferences
              </p>
            </div>
          </div>

          {/* Swipe Stack */}
          <SwipeCardStack
            cards={recommendations}
            renderCard={renderCard}
            onSwipeLeft={handlePass}
            onSwipeRight={handleLike}
            loading={loading}
            emptyMessage="No more job recommendations available. Check back later for new opportunities."
            variant="candidate"
          />
        </div>
      </div>
    </div>
  );
};

export default JobDiscoveryPage;
