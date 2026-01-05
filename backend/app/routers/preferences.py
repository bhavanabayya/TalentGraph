"""
Job preference management for candidates.
Candidates can create multiple job preference profiles with different roles, rates, skills, etc.
"""

import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime

from ..database import get_session
from ..models import Candidate, CandidateJobPreference, ProductAuthor, Product, User
from ..schemas import (
    CandidateJobPreferenceCreate,
    CandidateJobPreferenceUpdate,
    CandidateJobPreferenceRead,
    CandidateReadWithPreferences,
)
from ..security import require_candidate

router = APIRouter(prefix="/preferences", tags=["job-preferences"])


# ============================================================================
# PREFERENCE CRUD OPERATIONS
# ============================================================================

@router.post("/create", response_model=CandidateJobPreferenceRead)
def create_job_preference(
    preference: CandidateJobPreferenceCreate,
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Create a new job preference profile for the candidate."""
    user_id = current_user.get("user_id")
    
    # Get candidate
    candidate = session.exec(
        select(Candidate).where(Candidate.user_id == user_id)
    ).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    # Verify product author and product exist
    author = session.exec(
        select(ProductAuthor).where(ProductAuthor.id == preference.product_author_id)
    ).first()
    if not author:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product author not found"
        )
    
    product = session.exec(
        select(Product).where(
            (Product.id == preference.product_id) & 
            (Product.author_id == preference.product_author_id)
        )
    ).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product not found for this author"
        )
    
    # Create job preference
    new_preference = CandidateJobPreference(
        candidate_id=candidate.id,
        product_author_id=preference.product_author_id,
        product_id=preference.product_id,
        roles=json.dumps(preference.roles),  # Store as JSON
        seniority_level=preference.seniority_level,
        years_experience_min=preference.years_experience_min,
        years_experience_max=preference.years_experience_max,
        hourly_rate_min=preference.hourly_rate_min,
        hourly_rate_max=preference.hourly_rate_max,
        required_skills=json.dumps(preference.required_skills) if preference.required_skills else None,
        work_type=preference.work_type,
        location_preferences=json.dumps(preference.location_preferences) if preference.location_preferences else None,
        availability=preference.availability,
        preference_name=preference.preference_name or f"{author.name} - {product.name} Profile",
    )
    
    session.add(new_preference)
    session.commit()
    session.refresh(new_preference)
    
    # Parse JSON fields for response
    response_pref = _format_preference_response(new_preference)
    return response_pref


@router.get("/my-preferences", response_model=list[CandidateJobPreferenceRead])
def get_my_preferences(
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Get all job preferences for authenticated candidate."""
    user_id = current_user.get("user_id")
    
    candidate = session.exec(
        select(Candidate).where(Candidate.user_id == user_id)
    ).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    preferences = session.exec(
        select(CandidateJobPreference).where(CandidateJobPreference.candidate_id == candidate.id)
    ).all()
    
    return [_format_preference_response(p) for p in preferences]


@router.get("/my-profile", response_model=CandidateReadWithPreferences)
def get_profile_with_preferences(
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Get candidate profile with all job preferences (Dashboard view)."""
    user_id = current_user.get("user_id")
    
    candidate = session.exec(
        select(Candidate).where(Candidate.user_id == user_id)
    ).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    # Get all preferences
    preferences = session.exec(
        select(CandidateJobPreference).where(
            CandidateJobPreference.candidate_id == candidate.id
        )
    ).all()
    
    # Format response
    formatted_prefs = [_format_preference_response(p) for p in preferences]
    
    return CandidateReadWithPreferences(
        id=candidate.id,
        user_id=candidate.user_id,
        name=candidate.name,
        location=candidate.location,
        profile_picture_path=candidate.profile_picture_path,
        summary=candidate.summary,
        work_type=candidate.work_type,
        availability=candidate.availability,
        created_at=candidate.created_at,
        updated_at=candidate.updated_at,
        job_preferences=formatted_prefs
    )


@router.get("/{preference_id}", response_model=CandidateJobPreferenceRead)
def get_preference(
    preference_id: int,
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Get specific job preference."""
    user_id = current_user.get("user_id")
    
    candidate = session.exec(
        select(Candidate).where(Candidate.user_id == user_id)
    ).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    preference = session.exec(
        select(CandidateJobPreference).where(
            (CandidateJobPreference.id == preference_id) &
            (CandidateJobPreference.candidate_id == candidate.id)
        )
    ).first()
    
    if not preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job preference not found"
        )
    
    return _format_preference_response(preference)


@router.put("/{preference_id}", response_model=CandidateJobPreferenceRead)
def update_preference(
    preference_id: int,
    update: CandidateJobPreferenceUpdate,
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Update existing job preference."""
    user_id = current_user.get("user_id")
    
    candidate = session.exec(
        select(Candidate).where(Candidate.user_id == user_id)
    ).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    preference = session.exec(
        select(CandidateJobPreference).where(
            (CandidateJobPreference.id == preference_id) &
            (CandidateJobPreference.candidate_id == candidate.id)
        )
    ).first()
    
    if not preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job preference not found"
        )
    
    # Update fields
    update_data = update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if field == "roles" and value is not None:
            setattr(preference, field, json.dumps(value))
        elif field == "required_skills" and value is not None:
            setattr(preference, field, json.dumps(value))
        elif field == "location_preferences" and value is not None:
            setattr(preference, field, json.dumps(value))
        elif value is not None:
            setattr(preference, field, value)
    
    preference.updated_at = datetime.utcnow()
    session.add(preference)
    session.commit()
    session.refresh(preference)
    
    return _format_preference_response(preference)


@router.delete("/{preference_id}", response_model=dict)
def delete_preference(
    preference_id: int,
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Delete a job preference."""
    user_id = current_user.get("user_id")
    
    candidate = session.exec(
        select(Candidate).where(Candidate.user_id == user_id)
    ).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    preference = session.exec(
        select(CandidateJobPreference).where(
            (CandidateJobPreference.id == preference_id) &
            (CandidateJobPreference.candidate_id == candidate.id)
        )
    ).first()
    
    if not preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job preference not found"
        )
    
    session.delete(preference)
    session.commit()
    
    return {"message": "Job preference deleted successfully"}


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _format_preference_response(preference: CandidateJobPreference) -> CandidateJobPreferenceRead:
    """Convert preference model to response schema, parsing JSON fields."""
    return CandidateJobPreferenceRead(
        id=preference.id,
        candidate_id=preference.candidate_id,
        product_author_id=preference.product_author_id,
        product_id=preference.product_id,
        roles=json.loads(preference.roles) if preference.roles else [],
        seniority_level=preference.seniority_level,
        years_experience_min=preference.years_experience_min,
        years_experience_max=preference.years_experience_max,
        hourly_rate_min=preference.hourly_rate_min,
        hourly_rate_max=preference.hourly_rate_max,
        required_skills=json.loads(preference.required_skills) if preference.required_skills else None,
        work_type=preference.work_type,
        location_preferences=json.loads(preference.location_preferences) if preference.location_preferences else None,
        availability=preference.availability,
        preference_name=preference.preference_name,
        is_active=preference.is_active,
        created_at=preference.created_at,
        updated_at=preference.updated_at,
    )
