from typing import List, Optional, Dict, Any
import json
from pydantic import BaseModel, field_validator


# --- Skill & Certification DTOs ---


class SkillCreate(BaseModel):
    name: str
    level: Optional[str] = None


class CertificationCreate(BaseModel):
    name: str
    issuer: Optional[str] = None
    year: Optional[int] = None


class CandidateBase(BaseModel):
    name: str
    email: str
    location: Optional[str] = None

    profile_picture_path: Optional[str] = None

    product_author: Optional[str] = None
    product: Optional[str] = None

    primary_role: Optional[str] = None
    summary: Optional[str] = None
    years_experience: Optional[int] = None
    rate_min: Optional[float] = None
    rate_max: Optional[float] = None
    availability: Optional[str] = None

    # work type & location preferences
    work_type: Optional[str] = None
    location_preference_1: Optional[str] = None
    location_preference_2: Optional[str] = None
    location_preference_3: Optional[str] = None
    
    # job roles
    job_roles: Optional[List[str]] = None

    # legacy preferences
    preference_1: Optional[str] = None
    preference_2: Optional[str] = None
    preference_3: Optional[str] = None


class CandidateCreate(CandidateBase):
    skills: List[SkillCreate] = []
    certifications: List[CertificationCreate] = []


class SkillRead(SkillCreate):
    id: int


class CertificationRead(CertificationCreate):
    id: int


class ResumeRead(BaseModel):
    id: int
    filename: str


class CandidateRead(CandidateBase):
    id: int
    skills: List[SkillRead] = []
    certifications: List[CertificationRead] = []
    resumes: List[ResumeRead] = []
    
    @field_validator('job_roles', mode='before')
    @classmethod
    def parse_job_roles(cls, v):
        if isinstance(v, str) and v:
            try:
                return json.loads(v)
            except:
                return None
        return v


# --- Job roles / ontology schemas ---


class JobRoleRead(BaseModel):
    id: Optional[int] = None
    name: str
    seniority: Optional[str] = None
    description: Optional[str] = None


class ProductRolesRead(BaseModel):
    author: str
    product: str
    roles: List[JobRoleRead]


# --- Role-fit scoring request/response ---


class RoleFitRequest(BaseModel):
    product_author: str
    product: str
    job_role: str
    resume_id: Optional[int] = None  # which resume they used


class RoleFitResponse(BaseModel):
    candidate_id: int
    product_author: str
    product: str
    job_role: str
    resume_id: Optional[int]
    score: int
    factors: Dict[str, Any]
    notes: Optional[str] = None
