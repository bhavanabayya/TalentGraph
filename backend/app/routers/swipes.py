"""
Swipe endpoints: candidate feed, like/pass, shortlist, ranking.
"""

import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select

from ..database import get_session
from ..models import (
    Candidate, JobPost, Swipe, User, CompanyUser, Skill
)
from ..schemas import (
    CandidateMatchCard, CandidateFeedResponse, RankingResponse, SwipeResponse, MatchExplanation
)
from ..matching import calculate_match_score
from ..security import get_current_user, require_company_user

router = APIRouter(prefix="/swipes", tags=["swipes"])


@router.get("/feed/{job_id}", response_model=CandidateFeedResponse)
def get_candidate_feed(
    job_id: int,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(require_company_user),
    session: Session = Depends(get_session)
):
    """
    Get candidate feed for a job (dating-style card stack).
    
    Filters out:
    - Already swiped candidates
    - Closed/archived jobs
    
    Sorts by match score (descending).
    """
    company_id = current_user.get("company_id")
    
    # Verify job belongs to company
    job = session.get(JobPost, job_id)
    if not job or job.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or unauthorized"
        )
    
    if job.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job is not active"
        )
    
    # Get all candidates for this product author (Oracle POC)
    candidates = session.exec(
        select(Candidate)
        .where(Candidate.product_author == job.product_author)
        .order_by(Candidate.created_at.desc())
    ).all()
    
    # Filter out already-swiped candidates
    swiped_candidate_ids = set()
    swipes = session.exec(
        select(Swipe).where(Swipe.job_post_id == job_id)
    ).all()
    for swipe in swipes:
        swiped_candidate_ids.add(swipe.candidate_id)
    
    # Calculate scores and build card list
    cards = []
    for candidate in candidates:
        if candidate.id in swiped_candidate_ids:
            continue
        
        score_data = calculate_match_score(candidate, job, session)
        
        # Extract skill names
        skills = session.exec(
            select(Skill).where(Skill.candidate_id == candidate.id)
        ).all()
        skill_names = [s.name for s in skills]
        
        # Build match explanation
        explanation = MatchExplanation(
            matched_skills=score_data.get("matched_skills", []),
            missing_skills=score_data.get("missing_skills", []),
            rate_fit=score_data.get("rate_fit", False),
            location_fit=score_data.get("location_fit", False),
            overall_score=score_data.get("overall_score", 0)
        )
        
        card = CandidateMatchCard(
            candidate_id=candidate.id,
            name=candidate.name,
            location=candidate.location,
            years_experience=candidate.years_experience,
            product_author=candidate.product_author,
            product=candidate.product,
            primary_role=candidate.primary_role,
            rate_min=candidate.rate_min,
            rate_max=candidate.rate_max,
            availability=candidate.availability,
            skills=skill_names,
            match_score=score_data.get("overall_score", 0),
            match_explanation=explanation
        )
        cards.append(card)
    
    # Sort by score descending
    cards.sort(key=lambda c: c.match_score, reverse=True)
    
    # Paginate
    total_count = len(cards)
    paginated_cards = cards[offset:offset + limit]
    
    return CandidateFeedResponse(
        candidates=paginated_cards,
        total_count=total_count
    )


@router.post("/like", response_model=SwipeResponse)
def like_candidate(
    candidate_id: int,
    job_id: int,
    current_user: dict = Depends(require_company_user),
    session: Session = Depends(get_session)
):
    """
    Like a candidate for a job.
    """
    user_id = current_user.get("user_id")
    company_id = current_user.get("company_id")
    
    # Verify job and candidate exist
    job = session.get(JobPost, job_id)
    if not job or job.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    candidate = session.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Check if already swiped
    existing = session.exec(
        select(Swipe).where(
            Swipe.candidate_id == candidate_id,
            Swipe.job_post_id == job_id
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already swiped on this candidate"
        )
    
    # Get company user
    company_user = session.exec(
        select(CompanyUser).where(CompanyUser.user_id == user_id)
    ).first()
    
    # Calculate match score
    score_data = calculate_match_score(candidate, job, session)
    
    # Create swipe
    swipe = Swipe(
        candidate_id=candidate_id,
        job_post_id=job_id,
        company_user_id=company_user.id if company_user else None,
        action="like",
        match_score=score_data.get("overall_score"),
        match_explanation=json.dumps(score_data)
    )
    session.add(swipe)
    session.commit()
    session.refresh(swipe)
    
    return SwipeResponse(
        ok=True,
        swipe_id=swipe.id,
        match_score=swipe.match_score,
        match_explanation=score_data
    )


@router.post("/pass", response_model=SwipeResponse)
def pass_candidate(
    candidate_id: int,
    job_id: int,
    current_user: dict = Depends(require_company_user),
    session: Session = Depends(get_session)
):
    """
    Pass on a candidate for a job.
    """
    user_id = current_user.get("user_id")
    company_id = current_user.get("company_id")
    
    # Verify job exists
    job = session.get(JobPost, job_id)
    if not job or job.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    candidate = session.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Check if already swiped
    existing = session.exec(
        select(Swipe).where(
            Swipe.candidate_id == candidate_id,
            Swipe.job_post_id == job_id
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already swiped on this candidate"
        )
    
    # Get company user
    company_user = session.exec(
        select(CompanyUser).where(CompanyUser.user_id == user_id)
    ).first()
    
    # Create pass swipe
    swipe = Swipe(
        candidate_id=candidate_id,
        job_post_id=job_id,
        company_user_id=company_user.id if company_user else None,
        action="pass"
    )
    session.add(swipe)
    session.commit()
    session.refresh(swipe)
    
    return SwipeResponse(
        ok=True,
        swipe_id=swipe.id,
        match_score=None,
        match_explanation=None
    )


@router.get("/shortlist/{job_id}", response_model=list[CandidateMatchCard])
def get_shortlist(
    job_id: int,
    current_user: dict = Depends(require_company_user),
    session: Session = Depends(get_session)
):
    """
    Get all candidates liked for a specific job.
    """
    company_id = current_user.get("company_id")
    
    job = session.get(JobPost, job_id)
    if not job or job.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Get all likes for this job
    likes = session.exec(
        select(Swipe)
        .where(
            Swipe.job_post_id == job_id,
            Swipe.action == "like"
        )
        .order_by(Swipe.match_score.desc())
    ).all()
    
    cards = []
    for swipe in likes:
        candidate = swipe.candidate
        skills = session.exec(
            select(Skill).where(Skill.candidate_id == candidate.id)
        ).all()
        skill_names = [s.name for s in skills]
        
        try:
            match_data = json.loads(swipe.match_explanation or "{}")
        except:
            match_data = {}
        
        explanation = MatchExplanation(
            matched_skills=match_data.get("matched_skills", []),
            missing_skills=match_data.get("missing_skills", []),
            rate_fit=match_data.get("rate_fit", False),
            location_fit=match_data.get("location_fit", False),
            overall_score=swipe.match_score or 0
        )
        
        card = CandidateMatchCard(
            candidate_id=candidate.id,
            name=candidate.name,
            location=candidate.location,
            years_experience=candidate.years_experience,
            product_author=candidate.product_author,
            product=candidate.product,
            primary_role=candidate.primary_role,
            rate_min=candidate.rate_min,
            rate_max=candidate.rate_max,
            availability=candidate.availability,
            skills=skill_names,
            match_score=swipe.match_score or 0,
            match_explanation=explanation
        )
        cards.append(card)
    
    return cards


@router.get("/ranking/{job_id}", response_model=list[RankingResponse])
def get_ranking(
    job_id: int,
    current_user: dict = Depends(require_company_user),
    session: Session = Depends(get_session)
):
    """
    Get ranked list of liked candidates for a job.
    """
    company_id = current_user.get("company_id")
    
    job = session.get(JobPost, job_id)
    if not job or job.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Get all likes sorted by score
    likes = session.exec(
        select(Swipe)
        .where(
            Swipe.job_post_id == job_id,
            Swipe.action == "like"
        )
        .order_by(Swipe.match_score.desc())
    ).all()
    
    rankings = []
    for rank, swipe in enumerate(likes, 1):
        candidate = swipe.candidate
        
        try:
            explanation = json.loads(swipe.match_explanation or "{}")
        except:
            explanation = {}
        
        ranking = RankingResponse(
            candidate_id=candidate.id,
            name=candidate.name,
            rank=rank,
            score=swipe.match_score or 0,
            explanation=explanation
        )
        rankings.append(ranking)
    
    return rankings
