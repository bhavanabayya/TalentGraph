"""
Phase 2: Deterministic scoring for candidate-job matching.

Formula:
- Skill Overlap (40%): must-have skills weighted 2x, nice-to-have 1x
- Product/Role Alignment (30%): exact match 100, category match 70, no match 0
- Location Fit (15%): candidate location preference matches job location
- Rate Fit (10%): candidate rate range overlaps with job rate range
- Availability (5%): candidate availability <= job requirement

Final Score: 0-100
"""

from typing import Optional, List
from sqlmodel import Session, select
from .models import Candidate, JobPost, Skill


def normalize_location(location: Optional[str]) -> Optional[str]:
    """Normalize location string for comparison."""
    if not location:
        return None
    return location.lower().strip()


def calculate_skill_overlap_score(candidate_skills: List[str], required_skills: List[str], nice_to_have: List[str]) -> tuple[float, list[str], list[str]]:
    """
    Calculate skill overlap score (0-100).
    
    Must-have skills: 2x weight
    Nice-to-have skills: 1x weight
    
    Returns: (score, matched_skills, missing_skills)
    """
    if not required_skills:
        return 100.0, [], []
    
    candidate_skills_lower = [s.lower().strip() for s in candidate_skills]
    required_lower = [s.lower().strip() for s in required_skills]
    nice_lower = [s.lower().strip() for s in nice_to_have] if nice_to_have else []
    
    matched_required = [s for s in required_lower if s in candidate_skills_lower]
    matched_nice = [s for s in nice_lower if s in candidate_skills_lower]
    missing_required = [s for s in required_lower if s not in candidate_skills_lower]
    
    # Weighted scoring
    required_weight = 2.0
    nice_weight = 1.0
    
    max_score = (len(required_lower) * required_weight) + (len(nice_lower) * nice_weight)
    achieved_score = (len(matched_required) * required_weight) + (len(matched_nice) * nice_weight)
    
    if max_score == 0:
        skill_score = 100.0
    else:
        skill_score = (achieved_score / max_score) * 100.0
    
    return skill_score, matched_required + matched_nice, missing_required


def calculate_product_alignment_score(
    candidate_author: Optional[str],
    candidate_product: Optional[str],
    candidate_role: Optional[str],
    job_author: str,
    job_product: str,
    job_role: str
) -> float:
    """
    Calculate product/role alignment score (0-100).
    
    - Exact match (author + product + role): 100
    - Author + Product match: 90
    - Author only: 70
    - No match: 0
    """
    cand_author = candidate_author.lower().strip() if candidate_author else ""
    cand_product = candidate_product.lower().strip() if candidate_product else ""
    cand_role = candidate_role.lower().strip() if candidate_role else ""
    
    job_author = job_author.lower().strip()
    job_product = job_product.lower().strip()
    job_role = job_role.lower().strip()
    
    if cand_author == job_author and cand_product == job_product and cand_role == job_role:
        return 100.0
    elif cand_author == job_author and cand_product == job_product:
        return 90.0
    elif cand_author == job_author:
        return 70.0
    else:
        return 0.0


def calculate_location_fit(
    candidate_locations: List[Optional[str]],
    job_location: Optional[str]
) -> bool:
    """
    Check if candidate's location preferences include job location.
    Returns True if match found or either is flexible/remote.
    """
    if not job_location:
        return True  # No location requirement
    
    job_loc_norm = normalize_location(job_location)
    
    for cand_loc in candidate_locations:
        if not cand_loc:
            continue
        cand_loc_norm = normalize_location(cand_loc)
        if cand_loc_norm and job_loc_norm and cand_loc_norm in job_loc_norm or job_loc_norm in cand_loc_norm:
            return True
    
    # Check for "Remote" flexibility
    for cand_loc in candidate_locations:
        if cand_loc and "remote" in cand_loc.lower():
            return True
    
    return False


def calculate_rate_fit(
    candidate_min: Optional[float],
    candidate_max: Optional[float],
    job_min: Optional[float],
    job_max: Optional[float]
) -> bool:
    """
    Check if rate ranges overlap.
    """
    if not candidate_min or not candidate_max or not job_min or not job_max:
        return True  # No rate data available
    
    # Ranges overlap if: cand_max >= job_min AND cand_min <= job_max
    return candidate_max >= job_min and candidate_min <= job_max


def calculate_availability_fit(
    candidate_availability: Optional[str],
    job_requirement: str = "ASAP"
) -> bool:
    """
    Simple availability check.
    Candidate availability keywords: "Immediately", "2 weeks", "1 month", "Flexible"
    """
    if not candidate_availability:
        return True
    
    avail_lower = candidate_availability.lower()
    
    # Mapping: how many days notice
    availability_days = {
        "immediately": 0,
        "asap": 0,
        "2 weeks": 14,
        "1 month": 30,
        "flexible": 0,
        "open": 0
    }
    
    requirement_days = {
        "immediately": 0,
        "asap": 0,
        "2 weeks": 14,
        "flexible": 30,
    }
    
    cand_days = next(
        (days for key, days in availability_days.items() if key in avail_lower),
        30
    )
    req_days = requirement_days.get(job_requirement.lower(), 30)
    
    return cand_days <= req_days


def calculate_match_score(
    candidate: Candidate,
    job_post: JobPost,
    session: Optional[Session] = None
) -> dict:
    """
    Calculate overall match score (0-100) and explanation.
    
    Weights:
    - Skill Overlap: 40%
    - Product/Role Alignment: 30%
    - Location Fit: 15%
    - Rate Fit: 10%
    - Availability: 5%
    """
    
    # Extract candidate skills
    candidate_skills = []
    if session:
        skills = session.exec(select(Skill).where(Skill.candidate_id == candidate.id)).all()
        candidate_skills = [s.name for s in skills]
    
    # Parse job requirements (stored as JSON strings)
    import json
    required_skills = []
    nice_to_have = []
    
    try:
        if job_post.required_skills:
            required_skills = json.loads(job_post.required_skills) if isinstance(job_post.required_skills, str) else job_post.required_skills
        if job_post.nice_to_have_skills:
            nice_to_have = json.loads(job_post.nice_to_have_skills) if isinstance(job_post.nice_to_have_skills, str) else job_post.nice_to_have_skills
    except:
        pass
    
    # Calculate component scores
    skill_score, matched_skills, missing_skills = calculate_skill_overlap_score(
        candidate_skills, required_skills, nice_to_have
    )
    
    alignment_score = calculate_product_alignment_score(
        candidate.product_author,
        candidate.product,
        candidate.primary_role,
        job_post.product_author,
        job_post.product,
        job_post.role
    )
    
    candidate_locs = [
        candidate.location,
        candidate.location_preference_1,
        candidate.location_preference_2,
        candidate.location_preference_3
    ]
    location_fit = calculate_location_fit(candidate_locs, job_post.location)
    location_score = 100.0 if location_fit else 0.0
    
    rate_fit = calculate_rate_fit(
        candidate.rate_min,
        candidate.rate_max,
        job_post.min_rate,
        job_post.max_rate
    )
    rate_score = 100.0 if rate_fit else 0.0
    
    availability_fit = calculate_availability_fit(candidate.availability)
    availability_score = 100.0 if availability_fit else 0.0
    
    # Weighted overall score
    overall_score = (
        (skill_score * 0.40) +
        (alignment_score * 0.30) +
        (location_score * 0.15) +
        (rate_score * 0.10) +
        (availability_score * 0.05)
    )
    
    return {
        "overall_score": round(overall_score, 1),
        "skill_score": round(skill_score, 1),
        "alignment_score": round(alignment_score, 1),
        "location_fit": location_fit,
        "rate_fit": rate_fit,
        "availability_fit": availability_fit,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
    }
