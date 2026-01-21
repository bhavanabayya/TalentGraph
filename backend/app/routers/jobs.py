"""
Job posting endpoints: create, list, update, delete jobs.
"""

import json
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..database import get_session
from ..models import JobPost, CompanyUser
from ..schemas import JobPostCreate, JobPostRead, JobPostUpdate
from ..security import get_current_user, require_company_role
from ..recommendation_engine import RecommendationEngine

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
    
    # Auto-set title from role if not provided
    job_title = req.title if req.title else req.role
    logger.info(f"[JOB_CREATE] Job title: {job_title}")
    
    # Create job post
    logger.info(f"[JOB_CREATE] Creating JobPost record in database")
    job = JobPost(
        company_id=company_id,
        title=job_title,
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
        salary_min=req.salary_min,
        salary_max=req.salary_max,
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
        salary_min=job.salary_min,
        salary_max=job.salary_max,
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
            job_type=job.job_type,
            duration=job.duration,
            start_date=job.start_date.isoformat() if job.start_date else None,
            currency=job.currency,
            location=job.location,
            work_type=job.work_type,
            min_rate=job.min_rate,
            max_rate=job.max_rate,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
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
            job_type=job.job_type,
            duration=job.duration,
            start_date=job.start_date.isoformat() if job.start_date else None,
            currency=job.currency,
            location=job.location,
            work_type=job.work_type,
            min_rate=job.min_rate,
            max_rate=job.max_rate,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            required_skills=json.loads(job.required_skills or "[]"),
            nice_to_have_skills=json.loads(job.nice_to_have_skills or "[]"),
            status=job.status,
            created_at=job.created_at.isoformat(),
            updated_at=job.updated_at.isoformat()
        )
        for job in jobs
    ]


@router.get("/company/all-postings", response_model=list[JobPostRead])
def get_company_all_postings(
    current_user: dict = Depends(require_company_role(["ADMIN", "HR"])),
    session: Session = Depends(get_session)
):
    """
    Get ALL job postings for the company (Admin/HR only).
    Shows all jobs created by anyone in the company, grouped by creator.
    """
    company_id = current_user.get("company_id")
    user_id = current_user.get("user_id")
    user_email = current_user.get("email")
    
    logger.info(f"[COMPANY_ALL_POSTINGS] User {user_id} ({user_email}) requesting all company jobs for company {company_id}")
    
    # Debug: Get all jobs in the database for this company
    all_jobs = session.exec(
        select(JobPost).where(JobPost.company_id == company_id).order_by(JobPost.created_at.desc())
    ).all()
    
    logger.info(f"[COMPANY_ALL_POSTINGS] Found {len(all_jobs)} total jobs for company_id={company_id}")
    for job in all_jobs:
        logger.info(f"[COMPANY_ALL_POSTINGS]   - Job ID {job.id}: '{job.title}' (created_by_user_id={job.created_by_user_id}, company_id={job.company_id})")
    
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
            job_type=job.job_type,
            duration=job.duration,
            start_date=job.start_date.isoformat() if job.start_date else None,
            currency=job.currency,
            location=job.location,
            work_type=job.work_type,
            min_rate=job.min_rate,
            max_rate=job.max_rate,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            required_skills=json.loads(job.required_skills or "[]"),
            nice_to_have_skills=json.loads(job.nice_to_have_skills or "[]"),
            status=job.status,
            created_at=job.created_at.isoformat(),
            updated_at=job.updated_at.isoformat(),
            created_by_user_id=job.created_by_user_id
        )
        for job in all_jobs
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
        job_type=job.job_type,
        duration=job.duration,
        start_date=job.start_date.isoformat() if job.start_date else None,
        currency=job.currency,
        location=job.location,
        work_type=job.work_type,
        min_rate=job.min_rate,
        max_rate=job.max_rate,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
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

@router.get("/recruiter/my-accessible-postings", response_model=list[JobPostRead])
def get_recruiter_accessible_postings(
    current_user: dict = Depends(require_company_role(["RECRUITER", "HR", "ADMIN"])),
    session: Session = Depends(get_session)
):
    """
    Get job postings created by the current user (RECRUITER's own postings).
    Shows only jobs where created_by_user_id matches the current user's CompanyUser.
    This is what the recruiter "owns" and can manage.
    """
    user_id = current_user.get("user_id")
    company_id = current_user.get("company_id")
    
    logger.info(f"[RECRUITER_ACCESSIBLE] User {user_id} requesting accessible postings for company {company_id}")
    
    # Get the CompanyUser to match against created_by_user_id
    company_user = session.exec(
        select(CompanyUser).where(
            CompanyUser.user_id == user_id,
            CompanyUser.company_id == company_id
        )
    ).first()
    
    if not company_user:
        logger.error(f"[RECRUITER_ACCESSIBLE] CompanyUser not found for user {user_id} in company {company_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not found in this company"
        )
    
    logger.info(f"[RECRUITER_ACCESSIBLE] CompanyUser found: {company_user.id}")
    
    # Get jobs created by this specific user
    jobs = session.exec(
        select(JobPost).where(
            JobPost.company_id == company_id,
            JobPost.created_by_user_id == company_user.id
        ).order_by(JobPost.created_at.desc())
    ).all()
    
    logger.info(f"[RECRUITER_ACCESSIBLE] Found {len(jobs)} jobs created by user {user_id}")
    
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
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            required_skills=json.loads(job.required_skills or "[]"),
            nice_to_have_skills=json.loads(job.nice_to_have_skills or "[]"),
            status=job.status,
            created_at=job.created_at.isoformat(),
            updated_at=job.updated_at.isoformat(),
            created_by_user_id=job.created_by_user_id
        ))
    
    return result


@router.get("/assigned-to-me", response_model=list[JobPostRead])
def get_jobs_assigned_to_me(
    current_user: dict = Depends(require_company_role(["RECRUITER", "HR", "ADMIN"])),
    session: Session = Depends(get_session)
):
    """
    Get job postings assigned to the current user.
    Shows only jobs where assigned_to_user_id matches the current user's CompanyUser.
    """
    user_id = current_user.get("user_id")
    company_id = current_user.get("company_id")
    
    logger.info(f"[ASSIGNED_TO_ME] User {user_id} requesting assigned jobs for company {company_id}")
    
    # Get the CompanyUser
    company_user = session.exec(
        select(CompanyUser).where(
            CompanyUser.user_id == user_id,
            CompanyUser.company_id == company_id
        )
    ).first()
    
    if not company_user:
        logger.error(f"[ASSIGNED_TO_ME] CompanyUser not found for user {user_id} in company {company_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not found in this company"
        )
    
    # Get jobs assigned to this user
    jobs = session.exec(
        select(JobPost).where(
            JobPost.company_id == company_id,
            JobPost.assigned_to_user_id == company_user.id
        ).order_by(JobPost.created_at.desc())
    ).all()
    
    logger.info(f"[ASSIGNED_TO_ME] Found {len(jobs)} jobs assigned to user {user_id}")
    
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
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            required_skills=json.loads(job.required_skills or "[]"),
            nice_to_have_skills=json.loads(job.nice_to_have_skills or "[]"),
            status=job.status,
            created_at=job.created_at.isoformat(),
            updated_at=job.updated_at.isoformat(),
            created_by_user_id=job.created_by_user_id,
            assigned_to_user_id=job.assigned_to_user_id
        ))
    
    return result


@router.put("/{job_id}/assign", response_model=JobPostRead)
def assign_job_to_recruiter(
    job_id: int,
    assigned_to_user_id: int,
    current_user: dict = Depends(require_company_role(["ADMIN", "HR"])),
    session: Session = Depends(get_session)
):
    """
    Assign a job to a specific recruiter (Admin/HR only).
    """
    company_id = current_user.get("company_id")
    user_id = current_user.get("user_id")
    
    logger.info(f"[ASSIGN_JOB] Admin/HR {user_id} assigning job {job_id} to user {assigned_to_user_id}")
    
    # Get the job
    job = session.get(JobPost, job_id)
    if not job:
        logger.error(f"[ASSIGN_JOB] Job {job_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Verify job belongs to this company
    if job.company_id != company_id:
        logger.error(f"[ASSIGN_JOB] Job {job_id} does not belong to company {company_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot assign job from another company"
        )
    
    # Verify the target recruiter exists and belongs to this company
    target_recruiter = session.exec(
        select(CompanyUser).where(
            CompanyUser.id == assigned_to_user_id,
            CompanyUser.company_id == company_id
        )
    ).first()
    
    if not target_recruiter:
        logger.error(f"[ASSIGN_JOB] Target recruiter {assigned_to_user_id} not found in company {company_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recruiter not found in this company"
        )
    
    # Assign the job
    job.assigned_to_user_id = assigned_to_user_id
    job.updated_at = datetime.utcnow()
    session.add(job)
    session.commit()
    session.refresh(job)
    
    logger.info(f"[ASSIGN_JOB] Job {job_id} assigned to recruiter {assigned_to_user_id} ({target_recruiter.first_name})")
    
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
        updated_at=job.updated_at.isoformat(),
        created_by_user_id=job.created_by_user_id,
        assigned_to_user_id=job.assigned_to_user_id
    )


@router.get("/team/workload", response_model=list[dict])
def get_team_workload(
    current_user: dict = Depends(require_company_role(["ADMIN", "HR"])),
    session: Session = Depends(get_session)
):
    """
    Get job distribution across the team (Admin/HR only).
    Shows count of jobs created and assigned to each recruiter.
    """
    company_id = current_user.get("company_id")
    
    logger.info(f"[TEAM_WORKLOAD] Fetching workload for company {company_id}")
    
    # Get all recruiters in company
    recruiters = session.exec(
        select(CompanyUser).where(CompanyUser.company_id == company_id).order_by(CompanyUser.first_name)
    ).all()
    
    logger.info(f"[TEAM_WORKLOAD] Found {len(recruiters)} team members")
    
    workload = []
    for recruiter in recruiters:
        # Count jobs created by this recruiter
        created_count = len(session.exec(
            select(JobPost).where(
                JobPost.company_id == company_id,
                JobPost.created_by_user_id == recruiter.id
            )
        ).all())
        
        # Count jobs assigned to this recruiter
        assigned_count = len(session.exec(
            select(JobPost).where(
                JobPost.company_id == company_id,
                JobPost.assigned_to_user_id == recruiter.id
            )
        ).all())
        
        workload.append({
            "recruiter_id": recruiter.id,
            "recruiter_name": f"{recruiter.first_name} {recruiter.last_name}",
            "role": recruiter.role,
            "jobs_created": created_count,
            "jobs_assigned": assigned_count,
            "total_jobs": created_count + assigned_count
        })
    
    logger.info(f"[TEAM_WORKLOAD] Workload distribution: {len(workload)} team members")
    return workload


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
            salary_min=job.salary_min,
            salary_max=job.salary_max,
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
    current_user: dict = Depends(require_company_role(["HR", "ADMIN"])),
    session: Session = Depends(get_session)
):
    """
    Create a new job posting (HR/Admin only).
    Note: "Recruiter" endpoints are used by all roles but job creation is restricted to HR/Admin.
    """
    company_id = current_user.get("company_id")
    user_id = current_user.get("user_id")
    logger.info(f"[RECRUITER_CREATE] Creating job by user {user_id} for company {company_id}")
    
    # Get the CompanyUser record to capture created_by_user_id
    company_user = session.exec(
        select(CompanyUser).where(
            CompanyUser.user_id == user_id,
            CompanyUser.company_id == company_id
        )
    ).first()
    
    if not company_user:
        logger.error(f"[RECRUITER_CREATE] CompanyUser not found for user {user_id} in company {company_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not found in company"
        )
    
    logger.info(f"[RECRUITER_CREATE] CompanyUser found: id={company_user.id}, role={company_user.role}")
    
    required_skills_json = json.dumps(req.required_skills or [])
    nice_to_have_json = json.dumps(req.nice_to_have_skills or [])
    
    # Auto-set title from role if not provided
    job_title = req.title if req.title else req.role
    
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
        created_by_user_id=company_user.id,  # Track who created the job
        title=job_title,
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
        salary_min=req.salary_min,
        salary_max=req.salary_max,
        required_skills=required_skills_json,
        nice_to_have_skills=nice_to_have_json,
        status="active"
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    logger.info(f"[RECRUITER_CREATE] Job created with ID: {job.id}, created_by_user_id: {company_user.id}")
    
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
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        required_skills=req.required_skills or [],
        nice_to_have_skills=req.nice_to_have_skills or [],
        status=job.status,
        created_at=job.created_at.isoformat(),
        updated_at=job.updated_at.isoformat(),
        created_by_user_id=job.created_by_user_id
    )


@router.put("/recruiter/{job_id}", response_model=JobPostRead)
def recruiter_update_job(
    job_id: int,
    req: JobPostUpdate,
    current_user: dict = Depends(require_company_role(["HR", "ADMIN"])),
    session: Session = Depends(get_session)
):
    """
    Update a job posting (HR/Admin only).
    Note: "Recruiter" endpoints are used by all roles but job editing is restricted to HR/Admin.
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
    elif req.role:  # If role is being updated but not title, auto-set title from role
        job.title = req.role
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
    if req.role:
        job.role = req.role
        # Auto-update title if role changes and title isn't explicitly set
        if not req.title:
            job.title = req.role
    if req.product:
        job.product = req.product
    if req.product_author:
        job.product_author = req.product_author
    if req.seniority:
        job.seniority = req.seniority
    if req.min_rate is not None:
        job.min_rate = req.min_rate
    if req.max_rate is not None:
        job.max_rate = req.max_rate
    if req.salary_min is not None:
        job.salary_min = req.salary_min
    if req.salary_max is not None:
        job.salary_max = req.salary_max
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
    current_user: dict = Depends(require_company_role(["HR", "ADMIN"])),
    session: Session = Depends(get_session)
):
    """
    Delete a job posting (HR/Admin only).
    Note: "Recruiter" endpoints are used by all roles but job deletion is restricted to HR/Admin.
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


@router.get("/recommendations/all")
def get_all_candidate_recommendations(
    top_n: int = 10,
    current_user: dict = Depends(require_company_role(["RECRUITER", "HR", "ADMIN"])),
    session: Session = Depends(get_session)
):
    """
    Get candidate recommendations for all active jobs in the company.
    Returns aggregated list of best matching candidates.
    """
    try:
        from ..models import Candidate, CandidateJobPreference, Skill
        
        company_id = current_user.get("company_id")
        logger.info(f"[ALL_RECOMMENDATIONS] GET /recommendations/all for company {company_id}")
        
        # Get all active jobs for this company
        jobs = session.exec(
            select(JobPost).where(
                JobPost.company_id == company_id,
                JobPost.status == 'active'
            )
        ).all()
        
        if not jobs:
            return {
                'company_id': company_id,
                'total_jobs': 0,
                'total_recommendations': 0,
                'recommendations': []
            }
        
        # Get all candidates
        candidates = session.exec(select(Candidate)).all()
        
        # Prepare candidates data (same as above)
        candidates_data = []
        for candidate in candidates:
            preferences = session.exec(
                select(CandidateJobPreference).where(
                    CandidateJobPreference.candidate_id == candidate.id,
                    CandidateJobPreference.is_active == True
                )
            ).all()
            
            skills = session.exec(
                select(Skill).where(Skill.candidate_id == candidate.id)
            ).all()
            
            preferences_data = [
                {
                    'id': pref.id,
                    'preference_name': pref.preference_name,
                    'primary_role': pref.primary_role,
                    'location': pref.location,
                    'availability': pref.availability,
                    'work_type': pref.work_type,
                    'rate_min': pref.rate_min,
                    'rate_max': pref.rate_max,
                } for pref in preferences
            ]
            
            skills_data = [
                {
                    'id': skill.id,
                    'name': skill.name,
                    'level': skill.level,
                    'rating': skill.rating
                } for skill in skills
            ]
            
            candidates_data.append({
                'id': candidate.id,
                'name': candidate.name,
                'email': candidate.email,
                'primary_role': candidate.primary_role,
                'location': candidate.location,
                'availability': candidate.availability,
                'work_type': candidate.work_type,
                'rate_min': candidate.rate_min,
                'rate_max': candidate.rate_max,
                'years_experience': candidate.years_experience,
                'summary': candidate.summary,
                'job_preferences': preferences_data,
                'skills': skills_data
            })
        
        # Aggregate recommendations across all jobs
        all_matches = {}  # candidate_id -> best match data
        
        for job in jobs:
            job_data = {
                'id': job.id,
                'title': job.title,
                'role': job.role,
                'seniority': job.seniority,
                'location': job.location,
                'work_type': job.work_type,
                'min_rate': job.min_rate,
                'max_rate': job.max_rate,
                'start_date': job.start_date,
            }
            
            job_recommendations = RecommendationEngine.recommend_candidates_for_job(
                job_data, candidates_data, top_n=50  # Get more for aggregation
            )
            
            for rec in job_recommendations:
                candidate_id = rec['candidate']['id']
                if candidate_id not in all_matches or rec['match_score'] > all_matches[candidate_id]['match_score']:
                    all_matches[candidate_id] = {
                        'candidate': rec['candidate'],
                        'best_match_job_id': job.id,
                        'best_match_job_title': job.title,
                        'match_score': rec['match_score'],
                        'match_breakdown': rec['match_breakdown'],
                        'matched_preference': rec['matched_preference']
                    }
        
        # Sort by match score and take top N
        final_recommendations = sorted(
            all_matches.values(),
            key=lambda x: x['match_score'],
            reverse=True
        )[:top_n]
        
        logger.info(f"[ALL_RECOMMENDATIONS] Returning {len(final_recommendations)} candidate recommendations")
        return {
            'company_id': company_id,
            'total_jobs': len(jobs),
            'total_recommendations': len(final_recommendations),
            'recommendations': final_recommendations
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ALL_RECOMMENDATIONS] Failed to generate recommendations: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}"
        )


@router.get("/recommendations/{job_id}")
def get_candidate_recommendations_for_job(
    job_id: int,
    top_n: int = 10,
    current_user: dict = Depends(require_company_role(["RECRUITER", "HR", "ADMIN"])),
    session: Session = Depends(get_session)
):
    """
    Get personalized candidate recommendations for a specific job posting.
    Uses weighted matching algorithm considering:
    - Role + Seniority (40%)
    - Start Date/Availability (25%)
    - Location (20%)
    - Salary Range (15%)
    """
    try:
        from ..models import Candidate, CandidateJobPreference, Skill
        
        company_id = current_user.get("company_id")
        logger.info(f"[JOB_RECOMMENDATIONS] GET /recommendations/{job_id} for company {company_id}")
        
        # Get job posting
        job = session.get(JobPost, job_id)
        if not job or job.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found or unauthorized"
            )
        
        # Get all active candidates with their preferences
        candidates = session.exec(select(Candidate)).all()
        
        # Prepare job data
        job_data = {
            'id': job.id,
            'title': job.title,
            'role': job.role,
            'seniority': job.seniority,
            'location': job.location,
            'work_type': job.work_type,
            'min_rate': job.min_rate,
            'max_rate': job.max_rate,
            'start_date': job.start_date,
            'description': job.description,
            'product_author': job.product_author,
            'product': job.product,
            'required_skills': job.required_skills,
        }
        
        # Prepare candidates data with preferences
        candidates_data = []
        for candidate in candidates:
            # Get preferences
            preferences = session.exec(
                select(CandidateJobPreference).where(
                    CandidateJobPreference.candidate_id == candidate.id,
                    CandidateJobPreference.is_active == True
                )
            ).all()
            
            # Get skills
            skills = session.exec(
                select(Skill).where(Skill.candidate_id == candidate.id)
            ).all()
            
            preferences_data = []
            for pref in preferences:
                preferences_data.append({
                    'id': pref.id,
                    'preference_name': pref.preference_name,
                    'primary_role': pref.primary_role,
                    'location': pref.location,
                    'availability': pref.availability,
                    'work_type': pref.work_type,
                    'rate_min': pref.rate_min,
                    'rate_max': pref.rate_max,
                })
            
            skills_data = [
                {
                    'id': skill.id,
                    'name': skill.name,
                    'level': skill.level,
                    'rating': skill.rating
                } for skill in skills
            ]
            
            candidates_data.append({
                'id': candidate.id,
                'name': candidate.name,
                'email': candidate.email,
                'primary_role': candidate.primary_role,
                'location': candidate.location,
                'availability': candidate.availability,
                'work_type': candidate.work_type,
                'rate_min': candidate.rate_min,
                'rate_max': candidate.rate_max,
                'years_experience': candidate.years_experience,
                'summary': candidate.summary,
                'job_preferences': preferences_data,
                'skills': skills_data
            })
        
        # Get recommendations
        recommendations = RecommendationEngine.recommend_candidates_for_job(
            job_data, candidates_data, top_n
        )
        
        logger.info(f"[JOB_RECOMMENDATIONS] Returning {len(recommendations)} candidate recommendations for job {job_id}")
        return {
            'job_id': job.id,
            'job_title': job.title,
            'total_recommendations': len(recommendations),
            'recommendations': recommendations
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[JOB_RECOMMENDATIONS] Failed to generate recommendations: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}"
        )
