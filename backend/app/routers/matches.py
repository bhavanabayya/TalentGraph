"""
Dating-app-style match state management with swipe mechanics.
Handles Like/Pass/Apply actions from candidates and Like/Pass/Ask-to-Apply from recruiters.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from ..database import get_session
from ..models import MatchState, Candidate, JobPost, Application, CompanyUser, User
from ..security import get_current_user, require_company_role

import logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/matches", tags=["matches"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class CandidateActionRequest(BaseModel):
    candidate_id: int
    job_id: int
    action: str  # "LIKE", "PASS", "APPLY"


class RecruiterActionRequest(BaseModel):
    candidate_id: int
    job_id: int
    action: str  # "LIKE", "PASS", "ASK_TO_APPLY"
    message: Optional[str] = None  # Optional message for ASK_TO_APPLY


class RespondToAskRequest(BaseModel):
    match_state_id: int
    accept: bool  # True = accept and apply, False = decline


def _ask_status(match: MatchState) -> str:
    """Return normalized invitation status for recruiter/candidate inbox views."""
    if match.ask_to_apply_expires_at and datetime.utcnow() > match.ask_to_apply_expires_at:
        return "EXPIRED"

    if match.ask_to_apply_status in {"PENDING", "ACCEPTED", "DECLINED", "EXPIRED"}:
        return match.ask_to_apply_status

    if match.ask_to_apply_accepted is True:
        return "ACCEPTED"

    return "PENDING"


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def update_unlock_level(match: MatchState) -> str:
    """
    Calculate unlock level based on current match state.
    
    Rules:
    - APPLY → FULL (candidate applied)
    - ASK_TO_APPLY + ACCEPTED → FULL (candidate accepted invitation)
    - Mutual LIKE (both liked) → PARTIAL
    - Any PASS → Keep as PREVIEW (rejected)
    - Otherwise → PREVIEW
    """
    # Auto-unlock to FULL if candidate applied
    if match.candidate_action == "APPLY":
        return "FULL"
    
    # Auto-unlock to FULL if candidate accepted ask-to-apply
    if match.ask_to_apply_accepted:
        return "FULL"
    
    # Mutual like → PARTIAL unlock
    if match.candidate_action == "LIKE" and match.recruiter_action == "LIKE":
        return "PARTIAL"
    
    # If either passed, stay at PREVIEW (effectively rejected)
    if match.candidate_action == "PASS" or match.recruiter_action == "PASS":
        return "PREVIEW"
    
    # Default: PREVIEW
    return "PREVIEW"


def get_or_create_match_state(
    session: Session,
    candidate_id: int,
    job_id: int
) -> MatchState:
    """Get existing match state or create new one."""
    statement = select(MatchState).where(
        MatchState.candidate_id == candidate_id,
        MatchState.job_post_id == job_id
    )
    match = session.exec(statement).first()
    
    if not match:
        match = MatchState(
            candidate_id=candidate_id,
            job_post_id=job_id,
            status="OPEN",
            unlock_level="PREVIEW"
        )
        session.add(match)
        session.commit()
        session.refresh(match)
    
    return match


# ============================================================================
# CANDIDATE ACTIONS (Like/Pass/Apply)
# ============================================================================

@router.post("/candidate/action")
def candidate_action(
    request: CandidateActionRequest,
    session: Session = Depends(get_session)
):
    """
    Candidate swipes on a job (LIKE/PASS/APPLY).
    
    - LIKE: Express interest
    - PASS: Not interested (hides from feed)
    - APPLY: Direct application (auto-unlocks FULL profile)
    """
    # Validate action
    if request.action not in ["LIKE", "PASS", "APPLY"]:
        raise HTTPException(status_code=400, detail="Invalid action. Must be LIKE, PASS, or APPLY")
    
    # Verify candidate exists
    candidate = session.get(Candidate, request.candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Verify job exists
    job = session.get(JobPost, request.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get or create match state
    match = get_or_create_match_state(session, request.candidate_id, request.job_id)
    
    # Update candidate action
    match.candidate_action = request.action
    match.candidate_action_at = datetime.utcnow()
    
    # If applying, create application record
    if request.action == "APPLY":
        # Check if application already exists
        existing_app = session.exec(
            select(Application).where(
                Application.candidate_id == request.candidate_id,
                Application.job_post_id == request.job_id
            )
        ).first()
        
        if not existing_app:
            application = Application(
                candidate_id=request.candidate_id,
                job_post_id=request.job_id,
                status="submitted"
            )
            session.add(application)
    
    # Update status based on actions
    if request.action == "PASS" or match.recruiter_action == "PASS":
        match.status = "REJECTED"
    elif request.action == "LIKE" and match.recruiter_action == "LIKE":
        match.status = "MATCHED"
    
    # Update unlock level
    match.unlock_level = update_unlock_level(match)
    
    session.add(match)
    session.commit()
    session.refresh(match)
    
    logger.info(f"Candidate {request.candidate_id} {request.action} job {request.job_id}")
    
    return match


# ============================================================================
# RECRUITER ACTIONS (Like/Pass/Ask-to-Apply)
# ============================================================================

@router.post("/recruiter/action")
def recruiter_action(
    request: RecruiterActionRequest,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)  # Get authenticated user
):
    """
    Recruiter swipes on a candidate (LIKE/PASS/ASK_TO_APPLY).
    
    - LIKE: Express interest
    - PASS: Not interested (hides from feed)
    - ASK_TO_APPLY: Send invitation to candidate with optional message
    
    Security: Validates that recruiter can only invite for their own company's jobs
    """
    # Validate action
    if request.action not in ["LIKE", "PASS", "ASK_TO_APPLY"]:
        raise HTTPException(status_code=400, detail="Invalid action. Must be LIKE, PASS, or ASK_TO_APPLY")
    
    # Verify candidate exists
    candidate = session.get(Candidate, request.candidate_id)
    if not candidate:
        logger.warning(f"Recruiter {current_user.get('sub')} attempted to invite non-existent candidate {request.candidate_id}")
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Verify job exists
    job = session.get(JobPost, request.job_id)
    if not job:
        logger.warning(f"Recruiter {current_user.get('sub')} attempted action on non-existent job {request.job_id}")
        raise HTTPException(status_code=404, detail="Job not found")
    
    # SECURITY: Verify recruiter belongs to the company that owns this job
    recruiter_email = current_user.get('sub')
    user = session.exec(select(User).where(User.email == recruiter_email)).first()
    if user and user.company_user:
        recruiter_company_id = user.company_user.company_id
        if job.company_id != recruiter_company_id:
            logger.error(f"SECURITY VIOLATION: Recruiter {recruiter_email} (Company {recruiter_company_id}) attempted to {request.action} candidate {request.candidate_id} for job {request.job_id} belonging to Company {job.company_id}")
            raise HTTPException(
                status_code=403, 
                detail="You can only take actions on candidates for your own company's jobs"
            )
    else:
        logger.error(f"Recruiter {recruiter_email} not found or not associated with a company")
        raise HTTPException(status_code=403, detail="User not authorized")
    
    # Get or create match state
    match = get_or_create_match_state(session, request.candidate_id, request.job_id)
    
    # Update recruiter action
    match.recruiter_action = request.action
    match.recruiter_action_at = datetime.utcnow()
    
    # Handle ASK_TO_APPLY special case
    if request.action == "ASK_TO_APPLY":
        match.ask_to_apply_message = request.message
        match.ask_to_apply_sent_at = datetime.utcnow()
        # Set expiry (e.g., 30 days from now)
        match.ask_to_apply_expires_at = datetime.utcnow() + timedelta(days=30)
        match.ask_to_apply_accepted = False  # Not accepted yet
        match.ask_to_apply_status = "PENDING"
        
        # AUDIT LOG: Track invitation details
        logger.info(
            f"INVITATION SENT | Recruiter: {current_user.get('sub')} | "
            f"Candidate: {candidate.email} (ID: {request.candidate_id}) | "
            f"Job: '{job.title}' (ID: {request.job_id}) | "
            f"Company: {job.company.company_name if job.company else 'Unknown'} | "
            f"Message Length: {len(request.message or '')} chars | "
            f"Expires: {match.ask_to_apply_expires_at}"
        )
    
    # Update status based on actions
    if request.action == "PASS" or match.candidate_action == "PASS":
        match.status = "REJECTED"
    elif request.action == "LIKE" and match.candidate_action == "LIKE":
        match.status = "MATCHED"
    
    # Update unlock level
    match.unlock_level = update_unlock_level(match)
    
    session.add(match)
    session.commit()
    session.refresh(match)
    
    logger.info(f"Recruiter {request.action} candidate {request.candidate_id} for job {request.job_id}")
    
    return match


# ============================================================================
# CANDIDATE INBOX (Pending Asks)
# ============================================================================

@router.get("/candidate/pending-asks/{candidate_id}")
def get_pending_asks(
    candidate_id: int,
    session: Session = Depends(get_session)
):
    """
    Get all pending recruiter invitations (ASK_TO_APPLY) for a candidate.
    Returns invitations that haven't expired and haven't been responded to.
    """
    # Verify candidate exists
    candidate = session.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Query invitations that are still in pending state
    now = datetime.utcnow()
    statement = select(MatchState).where(
        MatchState.candidate_id == candidate_id,
        MatchState.recruiter_action == "ASK_TO_APPLY",
        MatchState.ask_to_apply_expires_at > now  # Not expired
    )

    invites = session.exec(statement).all()

    # Enrich with job details
    result = []
    for match in invites:
        # Keep only canonical pending rows (with legacy fallback)
        status = _ask_status(match)
        if status != "PENDING":
            continue

        job = session.get(JobPost, match.job_post_id)
        if job:
            result.append({
                "match_state_id": match.id,
                "job": {
                    "id": job.id,
                    "title": job.title,
                    "company_name": job.company.company_name if job.company else "Unknown",
                    "location": job.location,
                    "work_type": job.work_type,
                    "role": job.role,
                    "seniority": job.seniority,
                    "min_rate": job.min_rate,
                    "max_rate": job.max_rate
                },
                "message": match.ask_to_apply_message,
                "asked_at": match.ask_to_apply_sent_at,
                "expires_at": match.ask_to_apply_expires_at,
                "match_score": match.initial_match_score
            })
    
    # AUDIT LOG: Track when candidates view their invitations
    logger.info(
        f"INVITATIONS VIEWED | Candidate: {candidate.email} (ID: {candidate_id}) | "
        f"Pending Count: {len(result)} | "
        f"Jobs: {[r['job']['id'] for r in result]}"
    )
    
    return {
        "pending_asks": result,
        "total": len(result)
    }


# ============================================================================
# RESPOND TO ASK (Accept/Decline)
# ============================================================================

@router.post("/candidate/respond-to-ask")
def respond_to_ask(
    request: RespondToAskRequest,
    session: Session = Depends(get_session)
):
    """
    Candidate responds to recruiter invitation (ASK_TO_APPLY).
    
    - accept=True: Accept invitation and auto-create application
    - accept=False: Decline invitation
    """
    # Get match state
    match = session.get(MatchState, request.match_state_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match state not found")
    
    # Verify it's an ask-to-apply
    if match.recruiter_action != "ASK_TO_APPLY":
        raise HTTPException(status_code=400, detail="This is not an ask-to-apply invitation")
    
    # Check if already responded
    if match.ask_to_apply_status in {"ACCEPTED", "DECLINED"}:
        raise HTTPException(status_code=400, detail="Already responded to this invitation")
    
    # Check if expired
    if match.ask_to_apply_expires_at and datetime.utcnow() > match.ask_to_apply_expires_at:
        match.status = "EXPIRED"
        match.ask_to_apply_status = "EXPIRED"
        session.add(match)
        session.commit()
        raise HTTPException(status_code=400, detail="This invitation has expired")
    
    # Get candidate and job details for audit log
    candidate = session.get(Candidate, match.candidate_id)
    job = session.get(JobPost, match.job_post_id)
    
    # Update match state
    match.ask_to_apply_accepted = request.accept
    
    if request.accept:
        # Auto-set candidate action to APPLY
        match.candidate_action = "APPLY"
        match.candidate_action_at = datetime.utcnow()
        match.status = "MATCHED"
        match.ask_to_apply_status = "ACCEPTED"
        
        # Create application
        existing_app = session.exec(
            select(Application).where(
                Application.candidate_id == match.candidate_id,
                Application.job_post_id == match.job_post_id
            )
        ).first()
        
        if not existing_app:
            application = Application(
                candidate_id=match.candidate_id,
                job_post_id=match.job_post_id,
                status="submitted"
            )
            session.add(application)
        
        # AUDIT LOG: Track acceptance
        logger.info(
            f"INVITATION ACCEPTED | Candidate: {candidate.email if candidate else 'Unknown'} (ID: {match.candidate_id}) | "
            f"Job: '{job.title if job else 'Unknown'}' (ID: {match.job_post_id}) | "
            f"Application Created | Source: RECRUITER_INVITE"
        )
    else:
        # Declined
        match.status = "REJECTED"
        match.ask_to_apply_status = "DECLINED"
        
        # AUDIT LOG: Track rejection
        logger.info(
            f"INVITATION DECLINED | Candidate: {candidate.email if candidate else 'Unknown'} (ID: {match.candidate_id}) | "
            f"Job: '{job.title if job else 'Unknown'}' (ID: {match.job_post_id}) | "
            f"Status: REJECTED"
        )
    
    # Update unlock level
    match.unlock_level = update_unlock_level(match)
    
    session.add(match)
    session.commit()
    session.refresh(match)
    
    return match


# ============================================================================
# QUERY MATCH STATE
# ============================================================================

@router.get("/state/{candidate_id}/{job_id}")
def get_match_state(
    candidate_id: int,
    job_id: int,
    session: Session = Depends(get_session)
):
    """
    Get current match state for a specific candidate-job pair.
    Returns null if no interaction yet.
    """
    statement = select(MatchState).where(
        MatchState.candidate_id == candidate_id,
        MatchState.job_post_id == job_id
    )
    match = session.exec(statement).first()
    
    if not match:
        return None
    
    return match


# ============================================================================
# RECRUITER SHORTLIST (Liked Candidates)
# ============================================================================

@router.get("/recruiter/shortlist/{company_id}")
def get_recruiter_shortlist(
    company_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all candidates that recruiters from this company have liked.
    Returns candidates with LIKE action from recruiter side.
    """
    # Query all matches where recruiter liked the candidate
    statement = select(MatchState).join(
        JobPost, MatchState.job_post_id == JobPost.id
    ).where(
        JobPost.company_id == company_id,
        MatchState.recruiter_action == "LIKE"
    )
    
    liked_matches = session.exec(statement).all()
    
    # Enrich with candidate and job details
    result = []
    for match in liked_matches:
        candidate = session.get(Candidate, match.candidate_id)
        job = session.get(JobPost, match.job_post_id)
        
        if candidate and job:
            result.append({
                "match_state_id": match.id,
                "candidate": {
                    "id": candidate.id,
                    "name": candidate.name,
                    "email": candidate.email,
                    "location": candidate.location,
                    "primary_role": candidate.primary_role,
                    "years_experience": candidate.years_experience,
                    "rate_min": candidate.rate_min,
                    "rate_max": candidate.rate_max,
                    "work_type": candidate.work_type,
                    "availability": candidate.availability,
                    "summary": candidate.summary
                },
                "job": {
                    "id": job.id,
                    "title": job.title,
                    "role": job.role
                },
                "match_score": match.initial_match_score,
                "liked_at": match.recruiter_action_at.isoformat() if match.recruiter_action_at else None,
                "status": match.status
            })
    
    logger.info(
        f"SHORTLIST VIEWED | Company ID: {company_id} | "
        f"User: {current_user.get('sub', 'Unknown')} | "
        f"Liked Count: {len(result)}"
    )
    
    return {
        "total": len(result),
        "shortlisted_candidates": result
    }


# ============================================================================
# CANDIDATE LIKES (Liked Jobs)
# ============================================================================

@router.get("/candidate/likes/{candidate_id}")
def get_candidate_likes(
    candidate_id: int,
    session: Session = Depends(get_session)
):
    """
    Get all jobs that the candidate has liked.
    Returns jobs with LIKE action from candidate side.
    """
    # Verify candidate exists
    candidate = session.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Query all matches where candidate liked the job
    statement = select(MatchState).where(
        MatchState.candidate_id == candidate_id,
        MatchState.candidate_action == "LIKE"
    )
    
    liked_matches = session.exec(statement).all()
    
    # Enrich with job details
    result = []
    for match in liked_matches:
        job = session.get(JobPost, match.job_post_id)
        
        if job:
            # Get company info
            from ..models import CompanyAccount
            company = session.get(CompanyAccount, job.company_id)
            
            result.append({
                "match_state_id": match.id,
                "job": {
                    "id": job.id,
                    "title": job.title,
                    "description": job.description,
                    "company_name": company.company_name if company else "Unknown Company",
                    "company_id": job.company_id,
                    "role": job.role,
                    "seniority": job.seniority,
                    "location": job.location,
                    "work_type": job.work_type,
                    "job_type": job.job_type,
                    "min_rate": job.min_rate,
                    "max_rate": job.max_rate,
                    "duration": job.duration,
                    "start_date": job.start_date,
                    "required_skills": job.required_skills,
                    "nice_to_have_skills": job.nice_to_have_skills
                },
                "match_score": match.initial_match_score,
                "liked_at": match.candidate_action_at.isoformat() if match.candidate_action_at else None,
                "status": match.status,
                "recruiter_action": match.recruiter_action  # Show if recruiter also liked
            })
    
    logger.info(
        f"LIKES VIEWED | Candidate: {candidate.email} (ID: {candidate_id}) | "
        f"Liked Count: {len(result)}"
    )
    
    return {
        "total": len(result),
        "liked_jobs": result
    }


@router.get("/recruiter/sent-requests")
def get_recruiter_sent_requests(
    session: Session = Depends(get_session),
    current_user: dict = Depends(require_company_role(["RECRUITER", "HR", "ADMIN"]))
):
    """
    Get ASK_TO_APPLY invitations sent by the current recruiter.
    Used by recruiter Sent Invitations page.
    """
    recruiter_email = current_user.get("sub")
    user = session.exec(select(User).where(User.email == recruiter_email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    recruiter = session.exec(select(CompanyUser).where(CompanyUser.user_id == user.id)).first()
    if not recruiter:
        raise HTTPException(status_code=403, detail="Only company users can view sent invitations")

    company_role = current_user.get("company_role")
    jobs_query = select(JobPost).where(JobPost.company_id == recruiter.company_id)

    # Recruiters see invitations sent for jobs they created.
    # HR/Admin can review all invitations in the company.
    if company_role == "RECRUITER":
        jobs_query = jobs_query.where(JobPost.created_by_user_id == user.id)

    recruiter_jobs = session.exec(jobs_query).all()
    recruiter_job_ids = [job.id for job in recruiter_jobs if job.id is not None]
    if not recruiter_job_ids:
        return []

    sent_requests = session.exec(
        select(MatchState).where(
            MatchState.job_post_id.in_(recruiter_job_ids),
            MatchState.recruiter_action == "ASK_TO_APPLY",
        )
    ).all()

    response = []
    for item in sent_requests:
        candidate = session.get(Candidate, item.candidate_id)
        job = session.get(JobPost, item.job_post_id)
        if not candidate or not job:
            continue

        response.append({
            "id": item.id,
            "candidate": {
                "id": candidate.id,
                "name": candidate.name,
                "headline": candidate.primary_role,
            },
            "job": {
                "id": job.id,
                "title": job.title,
            },
            "message": item.ask_to_apply_message,
            "sent_at": item.ask_to_apply_sent_at,
            "status": _ask_status(item),
            "expires_at": item.ask_to_apply_expires_at,
        })

    response.sort(key=lambda x: x.get("sent_at") or datetime.min, reverse=True)
    return response
