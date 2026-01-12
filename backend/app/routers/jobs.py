"""
Job posting endpoints: create, list, update, delete jobs.
"""

import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..database import get_session
from ..models import JobPost, CompanyUser
from ..schemas import JobPostCreate, JobPostRead, JobPostUpdate
from ..security import get_current_user, require_company_role

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/jobs", tags=["jobs"])

logger.info("Jobs router initialized")


@router.post("/create", response_model=JobPostRead)
def create_job(
    req: JobPostCreate,
    current_user: dict = Depends(require_company_role(["HR", "ADMIN"])),
    session: Session = Depends(get_session)
):
    """
    Create a new job post (HR/ADMIN only).
    """
    user_id = current_user.get("user_id")
    company_id = current_user.get("company_id")
    logger.info(f"[JOB_CREATE] Creating job: title={req.title}, user_id={user_id}, company_id={company_id}")
    logger.info(f"[JOB_CREATE] Job details - author={req.product_author}, product={req.product}, role={req.role}")
    
    # Verify user is in company
    logger.info(f"[JOB_CREATE] Verifying CompanyUser for user {user_id} in company {company_id}")
    company_user = session.exec(
        select(CompanyUser).where(
            CompanyUser.user_id == user_id,
            CompanyUser.company_id == company_id
        )
    ).first()
    if not company_user:
        logger.error(f"[JOB_CREATE] CompanyUser not found for user {user_id} in company {company_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not in this company"
        )
    
    logger.info(f"[JOB_CREATE] CompanyUser verified: role={company_user.role}")
    
    # Serialize skills to JSON strings
    required_skills_json = json.dumps(req.required_skills or [])
    nice_to_have_json = json.dumps(req.nice_to_have_skills or [])
    logger.info(f"[JOB_CREATE] Skills serialized - required: {len(req.required_skills or [])}, nice_to_have: {len(req.nice_to_have_skills or [])}")
    
    # Create job post
    logger.info(f"[JOB_CREATE] Creating JobPost record in database")
    job = JobPost(
        company_id=company_id,
        title=req.title,
        description=req.description,
        product_author=req.product_author,
        product=req.product,
        role=req.role,
        seniority=req.seniority,
        job_type=req.job_type,
        duration=req.duration,
        start_date=req.start_date,
        currency=req.currency,
        location=req.location,
        work_type=req.work_type,
        min_rate=req.min_rate,
        max_rate=req.max_rate,
        required_skills=required_skills_json,
        nice_to_have_skills=nice_to_have_json,
        status="active"
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    logger.info(f"[JOB_CREATE] JobPost created successfully with ID: {job.id}")
    
    logger.info(f"[JOB_CREATE] Building JobPostRead response for job {job.id}")
    return JobPostRead(
        id=job.id,
        company_id=job.company_id,
        title=job.title,
        description=job.description,
        product_author=job.product_author,
        product=job.product,
        role=job.role,
        seniority=job.seniority,
        job_type=job.job_type,
        duration=job.duration,
        start_date=job.start_date.isoformat() if job.start_date else None,
        currency=job.currency,
        location=job.location,
        work_type=job.work_type,
        min_rate=job.min_rate,
        max_rate=job.max_rate,
        required_skills=req.required_skills or [],
        nice_to_have_skills=req.nice_to_have_skills or [],
        status=job.status,
        created_at=job.created_at.isoformat(),
        updated_at=job.updated_at.isoformat()
    )


@router.get("/available", response_model=list[JobPostRead])
def list_available_jobs(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    List all available jobs (for candidates).
    Returns all active jobs from all companies.
    """
    # Get all active jobs (any company, any user can see)
    jobs = session.exec(
        select(JobPost).where(JobPost.status == "active")
    ).all()
    
    return [
        JobPostRead(
            id=job.id,
            company_id=job.company_id,
            title=job.title,
            description=job.description,
            product_author=job.product_author,
            product=job.product,
            role=job.role,
            seniority=job.seniority,
            location=job.location,
            work_type=job.work_type,
            min_rate=job.min_rate,
            max_rate=job.max_rate,
            required_skills=json.loads(job.required_skills or "[]"),
            nice_to_have_skills=json.loads(job.nice_to_have_skills or "[]"),
            status=job.status,
            created_at=job.created_at.isoformat(),
            updated_at=job.updated_at.isoformat()
        )
        for job in jobs
    ]


@router.get("/", response_model=list[JobPostRead])
def list_company_jobs(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    List all jobs for current company.
    """
    company_id = current_user.get("company_id")
    if not company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a company user"
        )
    
    jobs = session.exec(
        select(JobPost).where(JobPost.company_id == company_id)
    ).all()
    
    return [
        JobPostRead(
            id=job.id,
            company_id=job.company_id,
            title=job.title,
            description=job.description,
            product_author=job.product_author,
            product=job.product,
            role=job.role,
            seniority=job.seniority,
            location=job.location,
            work_type=job.work_type,
            min_rate=job.min_rate,
            max_rate=job.max_rate,
            required_skills=json.loads(job.required_skills or "[]"),
            nice_to_have_skills=json.loads(job.nice_to_have_skills or "[]"),
            status=job.status,
            created_at=job.created_at.isoformat(),
            updated_at=job.updated_at.isoformat()
        )
        for job in jobs
    ]


@router.get("/{job_id}", response_model=JobPostRead)
def get_job(
    job_id: int,
    session: Session = Depends(get_session)
):
    """
    Get a specific job by ID.
    """
    job = session.get(JobPost, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return JobPostRead(
        id=job.id,
        company_id=job.company_id,
        title=job.title,
        description=job.description,
        product_author=job.product_author,
        product=job.product,
        role=job.role,
        seniority=job.seniority,
        location=job.location,
        work_type=job.work_type,
        min_rate=job.min_rate,
        max_rate=job.max_rate,
        required_skills=json.loads(job.required_skills or "[]"),
        nice_to_have_skills=json.loads(job.nice_to_have_skills or "[]"),
        status=job.status,
        created_at=job.created_at.isoformat(),
        updated_at=job.updated_at.isoformat()
    )


@router.patch("/{job_id}", response_model=JobPostRead)
def update_job(
    job_id: int,
    req: JobPostUpdate,
    current_user: dict = Depends(require_company_role(["HR", "ADMIN"])),
    session: Session = Depends(get_session)
):
    """
    Update a job post (HR/ADMIN only).
    """
    company_id = current_user.get("company_id")
    
    job = session.get(JobPost, job_id)
    if not job or job.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or unauthorized"
        )
    
    # Update fields
    if req.title is not None:
        job.title = req.title
    if req.description is not None:
        job.description = req.description
    if req.location is not None:
        job.location = req.location
    if req.work_type is not None:
        job.work_type = req.work_type
    if req.min_rate is not None:
        job.min_rate = req.min_rate
    if req.max_rate is not None:
        job.max_rate = req.max_rate
    if req.status is not None:
        job.status = req.status
    
    session.add(job)
    session.commit()
    session.refresh(job)
    
    return JobPostRead(
        id=job.id,
        company_id=job.company_id,
        title=job.title,
        description=job.description,
        product_author=job.product_author,
        product=job.product,
        role=job.role,
        seniority=job.seniority,
        location=job.location,
        work_type=job.work_type,
        min_rate=job.min_rate,
        max_rate=job.max_rate,
        required_skills=json.loads(job.required_skills or "[]"),
        nice_to_have_skills=json.loads(job.nice_to_have_skills or "[]"),
        status=job.status,
        created_at=job.created_at.isoformat(),
        updated_at=job.updated_at.isoformat()
    )


@router.delete("/{job_id}", response_model=dict)
def delete_job(
    job_id: int,
    current_user: dict = Depends(require_company_role(["HR", "ADMIN"])),
    session: Session = Depends(get_session)
):
    """
    Delete a job post (HR/ADMIN only).
    """
    company_id = current_user.get("company_id")
    
    job = session.get(JobPost, job_id)
    if not job or job.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or unauthorized"
        )
    
    session.delete(job)
    session.commit()
    
    return {"ok": True, "message": "Job deleted"}


# ============================================================================
# RECRUITER ENDPOINTS - For recruiter job posting portal
# ============================================================================

@router.get("/recruiter/my-postings", response_model=list[JobPostRead])
def get_recruiter_job_postings(
    current_user: dict = Depends(require_company_role(["RECRUITER", "HR", "ADMIN"])),
    session: Session = Depends(get_session)
):
    """
    Get all job postings for the current company (Recruiter/HR/Admin).
    """
    company_id = current_user.get("company_id")
    logger.info(f"[RECRUITER] Fetching job postings for company_id: {company_id}")
    
    jobs = session.exec(
        select(JobPost).where(JobPost.company_id == company_id).order_by(JobPost.created_at.desc())
    ).all()
    
    logger.info(f"[RECRUITER] Found {len(jobs)} job postings")
    
    result = []
    for job in jobs:
        result.append(JobPostRead(
            id=job.id,
            company_id=job.company_id,
            title=job.title,
            description=job.description,
            product_author=job.product_author,
            product=job.product,
            role=job.role,
            seniority=job.seniority,
            job_type=job.job_type,
            duration=job.duration,
            start_date=job.start_date.isoformat() if job.start_date else None,
            currency=job.currency,
            location=job.location,
            work_type=job.work_type,
            min_rate=job.min_rate,
            max_rate=job.max_rate,
            required_skills=json.loads(job.required_skills or "[]"),
            nice_to_have_skills=json.loads(job.nice_to_have_skills or "[]"),
            status=job.status,
            created_at=job.created_at.isoformat(),
            updated_at=job.updated_at.isoformat()
        ))
    
    return result


@router.post("/recruiter/create", response_model=JobPostRead)
def recruiter_create_job(
    req: JobPostCreate,
    current_user: dict = Depends(require_company_role(["RECRUITER", "HR", "ADMIN"])),
    session: Session = Depends(get_session)
):
    """
    Create a new job posting (Recruiter/HR/Admin).
    """
    company_id = current_user.get("company_id")
    user_id = current_user.get("user_id")
    logger.info(f"[RECRUITER_CREATE] Creating job by user {user_id} for company {company_id}")
    
    required_skills_json = json.dumps(req.required_skills or [])
    nice_to_have_json = json.dumps(req.nice_to_have_skills or [])
    
    # Convert start_date string to datetime if provided
    start_date = None
    if req.start_date:
        from datetime import datetime
        try:
            start_date = datetime.fromisoformat(req.start_date)
        except:
            pass
    
    job = JobPost(
        company_id=company_id,
        title=req.title,
        description=req.description,
        product_author=req.product_author,
        product=req.product,
        role=req.role,
        seniority=req.seniority,
        job_type=req.job_type,
        duration=req.duration,
        start_date=start_date,
        currency=req.currency,
        location=req.location,
        work_type=req.work_type,
        min_rate=req.min_rate,
        max_rate=req.max_rate,
        required_skills=required_skills_json,
        nice_to_have_skills=nice_to_have_json,
        status="active"
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    logger.info(f"[RECRUITER_CREATE] Job created with ID: {job.id}")
    
    return JobPostRead(
        id=job.id,
        company_id=job.company_id,
        title=job.title,
        description=job.description,
        product_author=job.product_author,
        product=job.product,
        role=job.role,
        seniority=job.seniority,
        job_type=job.job_type,
        duration=job.duration,
        start_date=job.start_date.isoformat() if job.start_date else None,
        currency=job.currency,
        location=job.location,
        work_type=job.work_type,
        min_rate=job.min_rate,
        max_rate=job.max_rate,
        required_skills=req.required_skills or [],
        nice_to_have_skills=req.nice_to_have_skills or [],
        status=job.status,
        created_at=job.created_at.isoformat(),
        updated_at=job.updated_at.isoformat()
    )


@router.put("/recruiter/{job_id}", response_model=JobPostRead)
def recruiter_update_job(
    job_id: int,
    req: JobPostUpdate,
    current_user: dict = Depends(require_company_role(["RECRUITER", "HR", "ADMIN"])),
    session: Session = Depends(get_session)
):
    """
    Update a job posting (Recruiter/HR/Admin).
    """
    company_id = current_user.get("company_id")
    logger.info(f"[RECRUITER_UPDATE] Updating job {job_id} for company {company_id}")
    
    job = session.get(JobPost, job_id)
    if not job or job.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or unauthorized"
        )
    
    # Update fields
    if req.title:
        job.title = req.title
    if req.description:
        job.description = req.description
    if req.job_type:
        job.job_type = req.job_type
    if req.duration:
        job.duration = req.duration
    if req.start_date:
        from datetime import datetime
        try:
            job.start_date = datetime.fromisoformat(req.start_date)
        except:
            pass
    if req.currency:
        job.currency = req.currency
    if req.location:
        job.location = req.location
    if req.work_type:
        job.work_type = req.work_type
    if req.min_rate is not None:
        job.min_rate = req.min_rate
    if req.max_rate is not None:
        job.max_rate = req.max_rate
    if req.status:
        job.status = req.status
    
    from datetime import datetime
    job.updated_at = datetime.utcnow()
    session.add(job)
    session.commit()
    session.refresh(job)
    logger.info(f"[RECRUITER_UPDATE] Job {job_id} updated successfully")
    
    return JobPostRead(
        id=job.id,
        company_id=job.company_id,
        title=job.title,
        description=job.description,
        product_author=job.product_author,
        product=job.product,
        role=job.role,
        seniority=job.seniority,
        job_type=job.job_type,
        duration=job.duration,
        start_date=job.start_date.isoformat() if job.start_date else None,
        currency=job.currency,
        location=job.location,
        work_type=job.work_type,
        min_rate=job.min_rate,
        max_rate=job.max_rate,
        required_skills=json.loads(job.required_skills or "[]"),
        nice_to_have_skills=json.loads(job.nice_to_have_skills or "[]"),
        status=job.status,
        created_at=job.created_at.isoformat(),
        updated_at=job.updated_at.isoformat()
    )


@router.delete("/recruiter/{job_id}", response_model=dict)
def recruiter_delete_job(
    job_id: int,
    current_user: dict = Depends(require_company_role(["RECRUITER", "HR", "ADMIN"])),
    session: Session = Depends(get_session)
):
    """
    Delete a job posting (Recruiter/HR/Admin).
    """
    company_id = current_user.get("company_id")
    logger.info(f"[RECRUITER_DELETE] Deleting job {job_id} for company {company_id}")
    
    job = session.get(JobPost, job_id)
    if not job or job.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or unauthorized"
        )
    
    session.delete(job)
    session.commit()
    logger.info(f"[RECRUITER_DELETE] Job {job_id} deleted successfully")
    
    return {"ok": True, "message": "Job posting deleted"}
