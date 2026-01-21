"""
Recommendation Engine for Matching Candidates with Job Postings
Uses weighted feature scoring with similarity calculations
"""

import logging
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
import re

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """
    Matches candidates with job postings using weighted feature scoring.
    
    Feature Weights:
    1. Role + Seniority: 40%
    2. Start Date/Availability: 25%
    3. Location: 20%
    4. Salary Range: 15%
    """
    
    WEIGHTS = {
        'role': 0.40,
        'start_date': 0.25,
        'location': 0.20,
        'salary': 0.15
    }
    
    # Seniority level mapping (0 = lowest, 1 = highest compatibility)
    SENIORITY_LEVELS = {
        'junior': 1,
        'mid-level': 2,
        'mid': 2,
        'senior': 3,
        'lead': 4,
        'principal': 5,
        'staff': 5,
        'architect': 5
    }
    
    @staticmethod
    def normalize_seniority(seniority: str) -> int:
        """Extract seniority level from text"""
        if not seniority:
            return 2  # Default to mid-level
        
        seniority_lower = seniority.lower()
        for key, value in RecommendationEngine.SENIORITY_LEVELS.items():
            if key in seniority_lower:
                return value
        return 2  # Default
    
    @staticmethod
    def calculate_role_similarity(candidate_role: str, job_role: str, 
                                  candidate_seniority: str, job_seniority: str) -> float:
        """
        Calculate role similarity including seniority matching.
        Returns score between 0 and 1.
        """
        if not candidate_role or not job_role:
            return 0.0
        
        # Role name matching (70% of role score)
        candidate_role_lower = candidate_role.lower()
        job_role_lower = job_role.lower()
        
        # Exact match
        if candidate_role_lower == job_role_lower:
            role_match = 1.0
        # Partial match (contains key terms)
        elif any(word in job_role_lower for word in candidate_role_lower.split() if len(word) > 3):
            role_match = 0.7
        elif any(word in candidate_role_lower for word in job_role_lower.split() if len(word) > 3):
            role_match = 0.7
        else:
            role_match = 0.0
        
        # Seniority matching (30% of role score)
        candidate_level = RecommendationEngine.normalize_seniority(candidate_seniority)
        job_level = RecommendationEngine.normalize_seniority(job_seniority)
        
        # Perfect match or adjacent levels
        level_diff = abs(candidate_level - job_level)
        if level_diff == 0:
            seniority_match = 1.0
        elif level_diff == 1:
            seniority_match = 0.8
        elif level_diff == 2:
            seniority_match = 0.5
        else:
            seniority_match = 0.2
        
        return (role_match * 0.7) + (seniority_match * 0.3)
    
    @staticmethod
    def calculate_date_similarity(candidate_availability: str, job_start_date: str) -> float:
        """
        Calculate availability/start date similarity.
        Returns score between 0 and 1.
        """
        if not candidate_availability:
            return 0.5  # Neutral if not specified
        
        availability_lower = candidate_availability.lower()
        
        # Parse candidate availability
        if 'immediately' in availability_lower or 'asap' in availability_lower:
            candidate_days = 0
        elif 'week' in availability_lower:
            # Extract number of weeks
            weeks = re.findall(r'(\d+)', availability_lower)
            candidate_days = int(weeks[0]) * 7 if weeks else 14
        elif 'month' in availability_lower:
            months = re.findall(r'(\d+)', availability_lower)
            candidate_days = int(months[0]) * 30 if months else 30
        else:
            candidate_days = 30  # Default
        
        # If job has start date, calculate difference
        if job_start_date:
            try:
                if isinstance(job_start_date, str):
                    start_date = datetime.fromisoformat(job_start_date.replace('Z', '+00:00'))
                else:
                    start_date = job_start_date
                
                days_until_start = (start_date - datetime.now()).days
                
                # Perfect match if availability aligns with start date
                days_diff = abs(candidate_days - days_until_start)
                
                if days_diff <= 7:
                    return 1.0
                elif days_diff <= 14:
                    return 0.9
                elif days_diff <= 30:
                    return 0.7
                elif days_diff <= 60:
                    return 0.5
                else:
                    return 0.3
            except Exception as e:
                logger.warning(f"Error parsing start date: {e}")
                return 0.5
        
        # If no start date, prefer immediately available
        if candidate_days <= 7:
            return 0.9
        elif candidate_days <= 30:
            return 0.7
        else:
            return 0.5
    
    @staticmethod
    def calculate_location_similarity(candidate_location: str, job_location: str,
                                     candidate_work_type: str, job_work_type: str) -> float:
        """
        Calculate location similarity considering work type.
        Returns score between 0 and 1.
        """
        if not candidate_location or not job_location:
            return 0.5
        
        candidate_location_lower = candidate_location.lower()
        job_location_lower = job_location.lower()
        
        # Remote work handling
        candidate_remote = candidate_work_type and 'remote' in candidate_work_type.lower()
        job_remote = job_work_type and 'remote' in job_work_type.lower()
        
        if candidate_remote and job_remote:
            return 1.0  # Perfect match for remote
        
        if candidate_remote or job_remote:
            return 0.8  # One is remote, flexible
        
        # Geographic matching
        if candidate_location_lower == job_location_lower:
            return 1.0
        
        # Extract city/state for partial matching
        candidate_parts = set(candidate_location_lower.replace(',', ' ').split())
        job_parts = set(job_location_lower.replace(',', ' ').split())
        
        # Check for common location components
        common_parts = candidate_parts.intersection(job_parts)
        if common_parts:
            return 0.7  # Same city or state
        
        # Check for nearby locations (simplified - could use geo-coordinates)
        if 'california' in candidate_location_lower and 'california' in job_location_lower:
            return 0.6
        if 'texas' in candidate_location_lower and 'texas' in job_location_lower:
            return 0.6
        if 'new york' in candidate_location_lower and 'new york' in job_location_lower:
            return 0.6
        
        return 0.3  # Different locations
    
    @staticmethod
    def calculate_salary_similarity(candidate_min: float, candidate_max: float,
                                   job_min: float, job_max: float) -> float:
        """
        Calculate salary range overlap.
        Returns score between 0 and 1.
        """
        if not all([candidate_min, candidate_max, job_min, job_max]):
            return 0.5  # Neutral if not specified
        
        # Calculate overlap
        overlap_min = max(candidate_min, job_min)
        overlap_max = min(candidate_max, job_max)
        
        if overlap_max < overlap_min:
            # No overlap - calculate gap
            gap = overlap_min - overlap_max
            avg_range = ((candidate_max - candidate_min) + (job_max - job_min)) / 2
            
            if gap <= avg_range * 0.1:  # Within 10%
                return 0.7
            elif gap <= avg_range * 0.2:  # Within 20%
                return 0.5
            else:
                return 0.2
        else:
            # Calculate overlap percentage
            overlap = overlap_max - overlap_min
            candidate_range = candidate_max - candidate_min
            job_range = job_max - job_min
            avg_range = (candidate_range + job_range) / 2
            
            overlap_ratio = overlap / avg_range if avg_range > 0 else 0
            
            # Score based on overlap
            if overlap_ratio >= 0.8:
                return 1.0
            elif overlap_ratio >= 0.5:
                return 0.9
            elif overlap_ratio >= 0.3:
                return 0.7
            else:
                return 0.5
    
    @staticmethod
    def calculate_match_score(candidate: Dict[str, Any], job: Dict[str, Any], 
                             preference: Dict[str, Any] = None) -> Tuple[float, Dict[str, float]]:
        """
        Calculate overall match score between candidate and job.
        
        Args:
            candidate: Candidate profile dict
            job: Job posting dict
            preference: Optional candidate job preference (takes precedence over profile)
        
        Returns:
            Tuple of (overall_score, feature_scores_dict)
        """
        # Use preference data if available, otherwise fall back to candidate profile
        if preference:
            candidate_role = preference.get('primary_role') or candidate.get('primary_role', '')
            candidate_seniority = ''  # Extract from role if present
            candidate_availability = preference.get('availability') or candidate.get('availability', '')
            candidate_location = preference.get('location') or candidate.get('location', '')
            candidate_work_type = preference.get('work_type') or candidate.get('work_type', '')
            candidate_rate_min = preference.get('rate_min') or candidate.get('rate_min', 0)
            candidate_rate_max = preference.get('rate_max') or candidate.get('rate_max', 0)
        else:
            candidate_role = candidate.get('primary_role', '')
            candidate_seniority = ''
            candidate_availability = candidate.get('availability', '')
            candidate_location = candidate.get('location', '')
            candidate_work_type = candidate.get('work_type', '')
            candidate_rate_min = candidate.get('rate_min', 0)
            candidate_rate_max = candidate.get('rate_max', 0)
        
        job_role = job.get('role', '')
        job_seniority = job.get('seniority', '')
        job_start_date = job.get('start_date')
        job_location = job.get('location', '')
        job_work_type = job.get('work_type', '')
        job_rate_min = job.get('min_rate', 0)
        job_rate_max = job.get('max_rate', 0)
        
        # Calculate individual feature scores
        role_score = RecommendationEngine.calculate_role_similarity(
            candidate_role, job_role, candidate_seniority, job_seniority
        )
        
        date_score = RecommendationEngine.calculate_date_similarity(
            candidate_availability, job_start_date
        )
        
        location_score = RecommendationEngine.calculate_location_similarity(
            candidate_location, job_location, candidate_work_type, job_work_type
        )
        
        salary_score = RecommendationEngine.calculate_salary_similarity(
            candidate_rate_min, candidate_rate_max, job_rate_min, job_rate_max
        )
        
        # Calculate weighted overall score
        overall_score = (
            role_score * RecommendationEngine.WEIGHTS['role'] +
            date_score * RecommendationEngine.WEIGHTS['start_date'] +
            location_score * RecommendationEngine.WEIGHTS['location'] +
            salary_score * RecommendationEngine.WEIGHTS['salary']
        )
        
        feature_scores = {
            'role_match': round(role_score * 100, 1),
            'date_match': round(date_score * 100, 1),
            'location_match': round(location_score * 100, 1),
            'salary_match': round(salary_score * 100, 1),
            'overall_score': round(overall_score * 100, 1)
        }
        
        return overall_score, feature_scores
    
    @staticmethod
    def recommend_jobs_for_candidate(candidate: Dict[str, Any], 
                                    job_preferences: List[Dict[str, Any]],
                                    available_jobs: List[Dict[str, Any]],
                                    top_n: int = 10) -> List[Dict[str, Any]]:
        """
        Recommend jobs for a candidate based on their preferences.
        
        Returns:
            List of jobs with match scores, sorted by relevance
        """
        recommendations = []
        
        for job in available_jobs:
            # Calculate match score for each preference, take the best
            best_score = 0
            best_breakdown = {}
            best_preference = None
            
            if job_preferences:
                for preference in job_preferences:
                    score, breakdown = RecommendationEngine.calculate_match_score(
                        candidate, job, preference
                    )
                    if score > best_score:
                        best_score = score
                        best_breakdown = breakdown
                        best_preference = preference
            else:
                # Use candidate profile directly
                best_score, best_breakdown = RecommendationEngine.calculate_match_score(
                    candidate, job
                )
            
            if best_score > 0.2:  # Minimum threshold
                recommendations.append({
                    'job': job,
                    'match_score': round(best_score * 100, 1),
                    'match_breakdown': best_breakdown,
                    'matched_preference': best_preference.get('preference_name') if best_preference else None
                })
        
        # Sort by match score descending
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
        
        return recommendations[:top_n]
    
    @staticmethod
    def recommend_candidates_for_job(job: Dict[str, Any],
                                    candidates: List[Dict[str, Any]],
                                    top_n: int = 10) -> List[Dict[str, Any]]:
        """
        Recommend candidates for a job posting.
        
        Returns:
            List of candidates with match scores, sorted by relevance
        """
        recommendations = []
        
        for candidate in candidates:
            # Get candidate's job preferences
            preferences = candidate.get('job_preferences', [])
            
            # Calculate match score for each preference, take the best
            best_score = 0
            best_breakdown = {}
            best_preference = None
            
            if preferences:
                for preference in preferences:
                    score, breakdown = RecommendationEngine.calculate_match_score(
                        candidate, job, preference
                    )
                    if score > best_score:
                        best_score = score
                        best_breakdown = breakdown
                        best_preference = preference
            else:
                # Use candidate profile directly
                best_score, best_breakdown = RecommendationEngine.calculate_match_score(
                    candidate, job
                )
            
            if best_score > 0.2:  # Minimum threshold
                recommendations.append({
                    'candidate': candidate,
                    'match_score': round(best_score * 100, 1),
                    'match_breakdown': best_breakdown,
                    'matched_preference': best_preference.get('preference_name') if best_preference else None
                })
        
        # Sort by match score descending
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
        
        return recommendations[:top_n]
