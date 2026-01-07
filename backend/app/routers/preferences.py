from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime
import json

from ..database import get_session
from ..models import Candidate, CandidateJobPreference
from ..schemas import JobPreferenceCreate, JobPreferenceUpdate, JobPreferenceRead, CandidateReadWithPreferences
from ..security import require_candidate


router = APIRouter(prefix="/preferences", tags=["preferences"])


@router.post("/create", response_model=JobPreferenceRead)
def create_job_preference(
    preference: JobPreferenceCreate,
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
    
    # Create job preference
    new_preference = CandidateJobPreference(
        candidate_id=candidate.id,
        product=preference.product,
        primary_role=preference.primary_role,
        years_experience=preference.years_experience,
        rate_min=preference.rate_min,
        rate_max=preference.rate_max,
        work_type=preference.work_type,
        location=preference.location,
        availability=preference.availability,
        summary=preference.summary,
        required_skills=json.dumps(preference.required_skills) if preference.required_skills else None,
        preference_name=preference.preference_name or f"{preference.product} - {preference.primary_role}",
    )
    
    session.add(new_preference)
    session.commit()
    session.refresh(new_preference)
    
    return new_preference


@router.get("/my-preferences", response_model=list[JobPreferenceRead])
def get_my_preferences(
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Get all active job preferences for authenticated candidate."""
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
        select(CandidateJobPreference).where(
            (CandidateJobPreference.candidate_id == candidate.id) &
            (CandidateJobPreference.is_active == True)
        ).order_by(CandidateJobPreference.created_at.desc())
    ).all()
    
    return preferences


@router.get("/my-profile", response_model=CandidateReadWithPreferences)
def get_profile_with_preferences(
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Get candidate profile with all job preferences."""
    user_id = current_user.get("user_id")
    
    candidate = session.exec(
        select(Candidate).where(Candidate.user_id == user_id)
    ).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    return candidate


@router.get("/{preference_id}", response_model=JobPreferenceRead)
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
    
    return preference


@router.put("/{preference_id}", response_model=JobPreferenceRead)
def update_preference(
    preference_id: int,
    update: JobPreferenceUpdate,
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
        if field == 'required_skills' and value is not None:
            # Convert list to JSON string
            setattr(preference, field, json.dumps(value))
        elif value is not None:
            setattr(preference, field, value)
    
    preference.updated_at = datetime.utcnow()
    session.add(preference)
    session.commit()
    session.refresh(preference)
    
    return preference


@router.delete("/{preference_id}", response_model=dict)
def delete_preference(
    preference_id: int,
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Delete a job preference (soft or hard delete)."""
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
    
    # Hard delete
    session.delete(preference)
    session.commit()
    
    return {"message": "Job preference deleted successfully"}
