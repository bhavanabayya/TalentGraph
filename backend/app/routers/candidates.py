from pathlib import Path
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from ..database import get_session
from ..models import Candidate, Skill, Certification, Resume
from ..schemas import (
    CandidateCreate,
    CandidateRead,
    RoleFitRequest,
    RoleFitResponse,
    ResumeRead,
)

router = APIRouter(prefix="/candidates", tags=["candidates"])

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/", response_model=CandidateRead)
def create_candidate(
    candidate_in: CandidateCreate,
    session: Session = Depends(get_session),
):
    candidate = Candidate(
        name=candidate_in.name,
        email=candidate_in.email,
        location=candidate_in.location,
        product_author=candidate_in.product_author,
        product=candidate_in.product,
        primary_role=candidate_in.primary_role,
        summary=candidate_in.summary,
        years_experience=candidate_in.years_experience,
        rate_min=candidate_in.rate_min,
        rate_max=candidate_in.rate_max,
        availability=candidate_in.availability,
        work_type=candidate_in.work_type,
        location_preference_1=candidate_in.location_preference_1,
        location_preference_2=candidate_in.location_preference_2,
        location_preference_3=candidate_in.location_preference_3,
        job_roles=json.dumps(candidate_in.job_roles) if candidate_in.job_roles else None,
        preference_1=candidate_in.preference_1,
        preference_2=candidate_in.preference_2,
        preference_3=candidate_in.preference_3,
    )

    session.add(candidate)
    session.flush()  # gets candidate.id

    for s in candidate_in.skills:
        session.add(Skill(candidate_id=candidate.id, name=s.name, level=s.level))

    for c in candidate_in.certifications:
        session.add(
            Certification(
                candidate_id=candidate.id,
                name=c.name,
                issuer=c.issuer,
                year=c.year,
            )
        )

    session.commit()
    session.refresh(candidate)
    return candidate


@router.get("/{candidate_id}", response_model=CandidateRead)
def get_candidate(candidate_id: int, session: Session = Depends(get_session)):
    candidate = session.exec(
        select(Candidate).where(Candidate.id == candidate_id)
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.get("/by-email/{email}", response_model=CandidateRead)
def get_candidate_by_email(email: str, session: Session = Depends(get_session)):
    """Get candidate profile by email address for auto-loading on re-login."""
    candidate = session.exec(
        select(Candidate).where(Candidate.email == email)
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="No profile found for this email")
    return candidate


# ---------- Resume Management ----------


@router.post("/{candidate_id}/resumes", response_model=ResumeRead)
async def upload_resume_file(
    candidate_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    candidate = session.exec(
        select(Candidate).where(Candidate.id == candidate_id)
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    contents = await file.read()
    dest_path = UPLOAD_DIR / f"candidate_{candidate_id}_{file.filename}"
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

    return ResumeRead(id=resume.id, filename=resume.filename)


@router.post("/{candidate_id}/profile-picture")
async def upload_profile_picture(
    candidate_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    candidate = session.exec(
        select(Candidate).where(Candidate.id == candidate_id)
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Only allow image files
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    contents = await file.read()
    dest_path = UPLOAD_DIR / f"profile_{candidate_id}_{file.filename}"
    dest_path.write_bytes(contents)

    # Update candidate with profile picture path
    candidate.profile_picture_path = str(dest_path)
    session.add(candidate)
    session.commit()
    session.refresh(candidate)

    return {"ok": True, "message": "Profile picture uploaded", "path": str(dest_path)}


@router.get("/{candidate_id}/profile-picture")
def get_profile_picture(candidate_id: int, session: Session = Depends(get_session)):
    candidate = session.exec(
        select(Candidate).where(Candidate.id == candidate_id)
    ).first()
    if not candidate or not candidate.profile_picture_path:
        raise HTTPException(status_code=404, detail="Profile picture not found")
    picture_path = Path(candidate.profile_picture_path)
    if not picture_path.exists():
        raise HTTPException(status_code=404, detail="Profile picture file not found")

    return FileResponse(
        picture_path,
        media_type="image/jpeg",
        headers={"Content-Disposition": "inline"}
    )


@router.get("/{candidate_id}/resumes", response_model=list[ResumeRead])
def list_resumes(candidate_id: int, session: Session = Depends(get_session)):
    candidate = session.exec(
        select(Candidate).where(Candidate.id == candidate_id)
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    resumes = session.exec(
        select(Resume).where(Resume.candidate_id == candidate_id)
    ).all()
    return [ResumeRead(id=r.id, filename=r.filename) for r in resumes]


@router.get("/{candidate_id}/resumes/{resume_id}/download")
def download_resume(
    candidate_id: int, resume_id: int, session: Session = Depends(get_session)
):
    resume = session.exec(
        select(Resume).where(
            (Resume.id == resume_id) & (Resume.candidate_id == candidate_id)
        )
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    resume_path = Path(resume.storage_path)
    if not resume_path.exists():
        raise HTTPException(status_code=404, detail="Resume file not found on disk")

    # Use inline disposition to open in browser, not download
    return FileResponse(
        resume_path,
        media_type=resume.content_type or "application/pdf",
        filename=resume.filename,
        headers={"Content-Disposition": "inline"}
    )


# ---------- Role-fit scoring (placeholder AI) ----------


@router.post("/{candidate_id}/role-fit", response_model=RoleFitResponse)
def compute_role_fit(
    candidate_id: int,
    req: RoleFitRequest,
    session: Session = Depends(get_session),
):
    candidate = session.exec(
        select(Candidate).where(Candidate.id == candidate_id)
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

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
