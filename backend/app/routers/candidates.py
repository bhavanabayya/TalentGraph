from pathlib import Path
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from ..database import get_session
from ..models import Candidate, Skill, Certification, Resume, User, Application, JobPost
from ..schemas import (
    CandidateCreate,
    CandidateRead,
    CandidateProfileUpdate,
    SkillCreate,
    SkillRead,
    CertificationCreate,
    CertificationRead,
    RoleFitRequest,
    RoleFitResponse,
    ResumeRead,
    ApplicationListRead,
    MatchScoreDisplay,
)
from ..security import get_current_user, get_current_user_email, require_candidate
from ..matching import calculate_match_score

router = APIRouter(prefix="/candidates", tags=["candidates"])

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


# ============================================================================
# PROFILE MANAGEMENT
# ============================================================================

@router.get("/me", response_model=CandidateRead)
def get_my_profile(
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Get authenticated candidate's profile."""
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


@router.put("/me", response_model=CandidateRead)
def update_my_profile(
    update: CandidateProfileUpdate,
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Update authenticated candidate's profile."""
    user_id = current_user.get("user_id")
    
    candidate = session.exec(
        select(Candidate).where(Candidate.user_id == user_id)
    ).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    # Update only provided fields
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(candidate, field, value)
    
    session.add(candidate)
    session.commit()
    session.refresh(candidate)
    
    return candidate


@router.get("/{candidate_id}", response_model=CandidateRead)
def get_candidate(candidate_id: int, session: Session = Depends(get_session)):
    """Get candidate profile by ID (public view)."""
    candidate = session.exec(
        select(Candidate).where(Candidate.id == candidate_id)
    ).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    return candidate


# ============================================================================
# SKILLS MANAGEMENT
# ============================================================================

@router.post("/me/skills", response_model=SkillRead)
def add_skill(
    skill: SkillCreate,
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Add a skill to candidate profile."""
    user_id = current_user.get("user_id")
    
    candidate = session.exec(
        select(Candidate).where(Candidate.user_id == user_id)
    ).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    new_skill = Skill(
        candidate_id=candidate.id,
        name=skill.name,
        level=skill.level,
        category=skill.category
    )
    session.add(new_skill)
    session.commit()
    session.refresh(new_skill)
    
    return SkillRead(id=new_skill.id, name=new_skill.name, level=new_skill.level, category=new_skill.category)


@router.get("/me/skills", response_model=list[SkillRead])
def list_my_skills(
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Get all skills for authenticated candidate."""
    user_id = current_user.get("user_id")
    
    candidate = session.exec(
        select(Candidate).where(Candidate.user_id == user_id)
    ).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    skills = session.exec(
        select(Skill).where(Skill.candidate_id == candidate.id)
    ).all()
    
    return [SkillRead(id=s.id, name=s.name, level=s.level, category=s.category) for s in skills]


@router.delete("/me/skills/{skill_id}")
def remove_skill(
    skill_id: int,
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Delete a skill from candidate profile."""
    user_id = current_user.get("user_id")
    
    candidate = session.exec(
        select(Candidate).where(Candidate.user_id == user_id)
    ).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    skill = session.exec(
        select(Skill).where(
            (Skill.id == skill_id) & (Skill.candidate_id == candidate.id)
        )
    ).first()
    
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    session.delete(skill)
    session.commit()
    
    return {"ok": True, "message": "Skill removed"}


# ============================================================================
# CERTIFICATIONS MANAGEMENT
# ============================================================================

@router.post("/me/certifications", response_model=CertificationRead)
def add_certification(
    cert: CertificationCreate,
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Add a certification to candidate profile."""
    user_id = current_user.get("user_id")
    
    candidate = session.exec(
        select(Candidate).where(Candidate.user_id == user_id)
    ).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    new_cert = Certification(
        candidate_id=candidate.id,
        name=cert.name,
        issuer=cert.issuer,
        year=cert.year
    )
    session.add(new_cert)
    session.commit()
    session.refresh(new_cert)
    
    return CertificationRead(id=new_cert.id, name=new_cert.name, issuer=new_cert.issuer, year=new_cert.year)


@router.get("/me/certifications", response_model=list[CertificationRead])
def list_my_certifications(
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Get all certifications for authenticated candidate."""
    user_id = current_user.get("user_id")
    
    candidate = session.exec(
        select(Candidate).where(Candidate.user_id == user_id)
    ).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    certs = session.exec(
        select(Certification).where(Certification.candidate_id == candidate.id)
    ).all()
    
    return [CertificationRead(id=c.id, name=c.name, issuer=c.issuer, year=c.year) for c in certs]


# ============================================================================
# RESUME MANAGEMENT
# ============================================================================

@router.post("/me/resumes", response_model=ResumeRead)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Upload a resume file."""
    user_id = current_user.get("user_id")
    
    candidate = session.exec(
        select(Candidate).where(Candidate.user_id == user_id)
    ).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    contents = await file.read()
    dest_path = UPLOAD_DIR / f"candidate_{candidate.id}_{file.filename}"
    dest_path.write_bytes(contents)

    resume = Resume(
        candidate_id=candidate.id,
        filename=file.filename,
        content_type=file.content_type,
        storage_path=str(dest_path),
    )
    session.add(resume)
    session.commit()
    session.refresh(resume)

    return ResumeRead(id=resume.id, filename=resume.filename, created_at=resume.created_at.isoformat())


@router.get("/me/resumes", response_model=list[ResumeRead])
def list_my_resumes(
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Get all resumes for authenticated candidate."""
    user_id = current_user.get("user_id")
    
    candidate = session.exec(
        select(Candidate).where(Candidate.user_id == user_id)
    ).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )

    resumes = session.exec(
        select(Resume).where(Resume.candidate_id == candidate.id)
    ).all()
    
    return [ResumeRead(id=r.id, filename=r.filename, created_at=r.created_at.isoformat()) for r in resumes]


@router.get("/me/resumes/{resume_id}/download")
def download_resume(
    resume_id: int,
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Download a resume file."""
    user_id = current_user.get("user_id")
    
    candidate = session.exec(
        select(Candidate).where(Candidate.user_id == user_id)
    ).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    resume = session.exec(
        select(Resume).where(
            (Resume.id == resume_id) & (Resume.candidate_id == candidate.id)
        )
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )

    resume_path = Path(resume.storage_path)
    if not resume_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file not found on disk"
        )

    return FileResponse(
        resume_path,
        media_type=resume.content_type or "application/octet-stream",
        filename=resume.filename
    )


# ============================================================================
# APPLICATIONS MANAGEMENT
# ============================================================================

@router.get("/me/applications", response_model=list[ApplicationListRead])
def list_my_applications(
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Get all job applications for authenticated candidate."""
    user_id = current_user.get("user_id")
    
    candidate = session.exec(
        select(Candidate).where(Candidate.user_id == user_id)
    ).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    applications = session.exec(
        select(Application).where(Application.candidate_id == candidate.id)
    ).all()
    
    result = []
    for app in applications:
        job = session.get(JobPost, app.job_post_id)
        company = session.get(job.company) if job else None
        result.append(ApplicationListRead(
            id=app.id,
            job_post_id=app.job_post_id,
            job_title=job.title if job else "Unknown",
            company_name=company.company_name if company else "Unknown",
            status=app.status,
            match_score=app.match_score,
            applied_at=app.applied_at.isoformat()
        ))
    
    return result


# ============================================================================
# MATCH SCORING FOR JOB ROLES
# ============================================================================

@router.post("/{candidate_id}/role-fit", response_model=RoleFitResponse)
def compute_role_fit(
    candidate_id: int,
    req: RoleFitRequest,
    session: Session = Depends(get_session)
):
    """Compute role-fit score for a candidate (POC/Rule-based scoring)."""
    candidate = session.exec(
        select(Candidate).where(Candidate.id == candidate_id)
    ).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )

    # base score
    score = 50
    factors: dict[str, object] = {}

    # vendor match
    if candidate.product_author and candidate.product_author.lower() == req.product_author.lower():
        score += 20
        factors["product_author_match"] = True
    else:
        factors["product_author_match"] = False

    # product match
    if candidate.product and candidate.product.lower() == req.product.lower():
        score += 15
        factors["product_match"] = True
    else:
        factors["product_match"] = False

    # experience
    if candidate.years_experience:
        if candidate.years_experience >= 7:
            score += 10
            factors["experience_level"] = "senior"
        elif candidate.years_experience >= 3:
            score += 5
            factors["experience_level"] = "mid"
        else:
            factors["experience_level"] = "junior"

    # preference boost if role matches primary_role text (very rough)
    if candidate.primary_role and req.job_role.lower() in candidate.primary_role.lower():
        score += 5
        factors["primary_role_alignment"] = True
    else:
        factors["primary_role_alignment"] = False

    score = max(0, min(100, score))

    notes = (
        "This is a rule-based placeholder fit score. "
        "In a real implementation, this would use resume parsing + embeddings + ML/LLM-based scoring."
    )

    return RoleFitResponse(
        candidate_id=candidate.id,
        product_author=req.product_author,
        product=req.product,
        job_role=req.job_role,
        resume_id=req.resume_id,
        score=score,
        factors=factors,
        notes=notes,
    )
