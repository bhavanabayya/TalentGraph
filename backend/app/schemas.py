"""
Request/Response schemas for all endpoints.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
import json
from pydantic import BaseModel, field_validator, EmailStr


# ============================================================================
# AUTH SCHEMAS
# ============================================================================

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str  # Must be at least 8 chars, 1 uppercase, 1 number, 1 special char
    user_type: str  # "candidate" or "company"
    company_role: Optional[str] = None  # "ADMIN", "HR", or "RECRUITER" (only for company users)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v):
            raise ValueError("Password must contain at least one special character")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    needs_otp: bool
    message: str
    access_token: str | None = None
    token_type: str | None = None
    user_id: int | None = None
    user_type: str | None = None


class SendOTPRequest(BaseModel):
    email: EmailStr


class SendOTPResponse(BaseModel):
    ok: bool
    message: str
    expires_in_sec: int


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    code: str


class VerifyOTPResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    user_type: str


# ============================================================================
# CANDIDATE SCHEMAS
# ============================================================================

class SkillCreate(BaseModel):
    name: str
    rating: Optional[int] = None  # 1-5 star rating
    level: Optional[str] = None
    category: Optional[str] = None


class SkillRead(SkillCreate):
    id: int


class CertificationCreate(BaseModel):
    name: str
    issuer: Optional[str] = None
    year: Optional[int] = None


class CertificationRead(CertificationCreate):
    id: int


class ResumeRead(BaseModel):
    id: int
    filename: str
    created_at: str


class SocialLinkCreate(BaseModel):
    platform: str  # "github", "linkedin", "portfolio", "twitter", "personal-website"
    url: str
    display_name: Optional[str] = None


class SocialLinkRead(SocialLinkCreate):
    id: int
    created_at: datetime


class CandidateBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    residential_address: Optional[str] = None
    location: Optional[str] = None
    profile_picture_path: Optional[str] = None
    
    # Visa and Diversity Information
    visa_type: Optional[str] = None
    ethnicity: Optional[str] = None
    
    product_author: Optional[str] = None
    product: Optional[str] = None
    
    primary_role: Optional[str] = None
    summary: Optional[str] = None
    years_experience: Optional[int] = None
    rate_min: Optional[float] = None
    rate_max: Optional[float] = None
    availability: Optional[str] = None
    
    work_type: Optional[str] = None
    location_preference_1: Optional[str] = None
    location_preference_2: Optional[str] = None
    location_preference_3: Optional[str] = None
    
    job_roles: Optional[List[str]] = None


class CandidateCreate(CandidateBase):
    skills: List[SkillCreate] = []
    certifications: List[CertificationCreate] = []


class CandidateRead(CandidateBase):
    id: int
    is_general_info_complete: bool = False
    skills: List[SkillRead] = []
    certifications: List[CertificationRead] = []
    resumes: List[ResumeRead] = []
    social_links: List[SocialLinkRead] = []
    
    @field_validator('job_roles', mode='before')
    @classmethod
    def parse_job_roles(cls, v):
        if isinstance(v, str) and v:
            try:
                return json.loads(v)
            except:
                return None
        return v


class CandidateProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    residential_address: Optional[str] = None
    location: Optional[str] = None
    visa_type: Optional[str] = None
    ethnicity: Optional[str] = None
    product: Optional[str] = None
    primary_role: Optional[str] = None
    summary: Optional[str] = None
    years_experience: Optional[int] = None
    rate_min: Optional[float] = None
    rate_max: Optional[float] = None
    availability: Optional[str] = None
    work_type: Optional[str] = None
    is_general_info_complete: Optional[bool] = None


# ============================================================================
# JOB PREFERENCES SCHEMAS
# ============================================================================

class JobPreferenceCreate(BaseModel):
    preference_name: Optional[str] = None
    product: str
    primary_role: str
    years_experience: Optional[int] = None
    rate_min: Optional[float] = None
    rate_max: Optional[float] = None
    work_type: Optional[str] = None
    location: Optional[str] = None
    visa_type: Optional[str] = None
    ethnicity: Optional[str] = None
    availability: Optional[str] = None
    summary: Optional[str] = None
    required_skills: Optional[list] = None  # [{\"name\": \"skill\", \"rating\": 1-5}, ...]


class JobPreferenceUpdate(BaseModel):
    preference_name: Optional[str] = None
    product: Optional[str] = None
    primary_role: Optional[str] = None
    years_experience: Optional[int] = None
    rate_min: Optional[float] = None
    rate_max: Optional[float] = None
    work_type: Optional[str] = None
    location: Optional[str] = None
    visa_type: Optional[str] = None
    ethnicity: Optional[str] = None
    availability: Optional[str] = None
    summary: Optional[str] = None
    required_skills: Optional[list] = None  # [{\"name\": \"skill\", \"rating\": 1-5}, ...]
    is_active: Optional[bool] = None


class JobPreferenceRead(BaseModel):
    id: int
    preference_name: Optional[str] = None
    product: str
    primary_role: str
    years_experience: Optional[int] = None
    rate_min: Optional[float] = None
    rate_max: Optional[float] = None
    work_type: Optional[str] = None
    location: Optional[str] = None
    visa_type: Optional[str] = None
    ethnicity: Optional[str] = None
    availability: Optional[str] = None
    summary: Optional[str] = None
    required_skills: Optional[str] = None  # JSON string
    is_active: bool
    created_at: datetime


# ============================================================================
# COMPANY SCHEMAS
# ============================================================================

class CompanyAccountBase(BaseModel):
    company_name: str
    domain: Optional[str] = None
    hq_location: Optional[str] = None
    description: Optional[str] = None
    logo_path: Optional[str] = None


class CompanyAccountCreate(CompanyAccountBase):
    pass


class CompanyAccountRead(CompanyAccountBase):
    id: int


class CompanyUserRead(BaseModel):
    id: int
    first_name: str
    last_name: str
    role: str
    is_active: bool


class CompanyProfileRead(CompanyAccountRead):
    company_users: List[CompanyUserRead] = []


# ============================================================================
# JOB POST SCHEMAS
# ============================================================================

class JobPostCreate(BaseModel):
    title: Optional[str] = None  # Auto-generated from role if not provided
    description: Optional[str] = None
    product_author: str  # "Oracle" for POC
    product: str  # "Oracle EBS", "Oracle Fusion"
    role: str
    seniority: Optional[str] = None
    
    # New fields
    job_type: Optional[str] = None  # "Permanent" or "Contract"
    duration: Optional[str] = None  # e.g., "6 months"
    start_date: Optional[str] = None  # Date string
    currency: Optional[str] = None  # "USD", "EUR"
    
    location: Optional[str] = None
    work_type: Optional[str] = None
    min_rate: Optional[float] = None  # Hourly rate for contracts
    max_rate: Optional[float] = None  # Hourly rate for contracts
    salary_min: Optional[float] = None  # Annual salary for permanent jobs
    salary_max: Optional[float] = None  # Annual salary for permanent jobs
    required_skills: Optional[List[str]] = None
    nice_to_have_skills: Optional[List[str]] = None
    
    # Company hierarchy
    created_by_user_id: Optional[int] = None  # Will be auto-populated from token
    assigned_to_user_id: Optional[int] = None  # Recruiter assigned to manage this job


class JobPostUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    product_author: Optional[str] = None
    product: Optional[str] = None
    role: Optional[str] = None
    seniority: Optional[str] = None
    job_type: Optional[str] = None
    duration: Optional[str] = None
    start_date: Optional[str] = None
    currency: Optional[str] = None
    location: Optional[str] = None
    work_type: Optional[str] = None
    min_rate: Optional[float] = None
    max_rate: Optional[float] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    status: Optional[str] = None
    assigned_to_user_id: Optional[int] = None


class JobPostRead(JobPostCreate):
    id: int
    company_id: int
    status: str
    created_at: str
    updated_at: str


# ============================================================================
# SWIPE / MATCHING SCHEMAS
# ============================================================================

class SwipeCreate(BaseModel):
    candidate_id: int
    job_post_id: int
    action: str  # "like", "pass"


class SwipeResponse(BaseModel):
    ok: bool
    swipe_id: int
    match_score: Optional[float]
    match_explanation: Optional[Dict[str, Any]]


class MatchExplanation(BaseModel):
    matched_skills: List[str]
    missing_skills: List[str]
    rate_fit: bool
    location_fit: bool
    overall_score: float


class CandidateMatchCard(BaseModel):
    """Card shown in the candidate feed for a job"""
    candidate_id: int
    name: str
    location: Optional[str]
    years_experience: Optional[int]
    product_author: Optional[str]
    product: Optional[str]
    primary_role: Optional[str]
    rate_min: Optional[float]
    rate_max: Optional[float]
    availability: Optional[str]
    skills: List[str]
    match_score: float
    match_explanation: MatchExplanation


class CandidateFeedResponse(BaseModel):
    """Response for candidate feed endpoint"""
    candidates: List[CandidateMatchCard]
    total_count: int


class RankingResponse(BaseModel):
    """Response for ranking endpoint"""
    candidate_id: int
    name: str
    rank: int
    score: float
    explanation: Dict[str, Any]


# ============================================================================
# ONTOLOGY SCHEMAS
# ============================================================================

class JobRoleRead(BaseModel):
    id: Optional[int] = None
    name: str
    seniority: Optional[str] = None
    description: Optional[str] = None


class ProductRead(BaseModel):
    id: int
    name: str
    roles: List[JobRoleRead] = []


class ProductAuthorRead(BaseModel):
    id: int
    name: str
    products: List[ProductRead] = []


class ProductRolesRead(BaseModel):
    author: str
    product: str
    roles: List[JobRoleRead]


# ============================================================================
# CANDIDATE ROLE-FIT SCHEMAS
# ============================================================================

class RoleFitRequest(BaseModel):
    product_author: str
    product: str
    job_role: str
    resume_id: Optional[int] = None


class RoleFitResponse(BaseModel):
    candidate_id: int
    product_author: str
    product: str
    job_role: str
    resume_id: Optional[int] = None
    score: float  # 0-100
    factors: Dict[str, Any]  # Detailed breakdown of scoring factors
    notes: str  # Explanation of the score


# ============================================================================
# APPLICATION SCHEMAS
# ============================================================================

class ApplicationCreate(BaseModel):
    job_post_id: int


class ApplicationRead(BaseModel):
    id: int
    candidate_id: int
    job_post_id: int
    status: str  # submitted, reviewing, interviewed, offered, rejected, withdrawn
    match_score: Optional[float]
    applied_at: str
    updated_at: str


class ApplicationUpdate(BaseModel):
    status: Optional[str] = None


class ApplicationListRead(BaseModel):
    """Application with job details"""
    id: int
    job_post_id: int
    job_title: str
    company_name: str
    status: str
    match_score: Optional[float]
    applied_at: str


class MatchScoreDisplay(BaseModel):
    """Score breakdown for display"""
    overall_score: float
    skill_score: float
    product_alignment_score: float
    location_score: float
    rate_score: float
    availability_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    explanation: str

# ============================================================================
# JOB PREFERENCE SCHEMAS
# ============================================================================

class CandidateJobPreferenceCreate(BaseModel):
    """Create a new job preference"""
    product_author_id: int  # e.g., Oracle
    product_id: int  # e.g., Oracle Fusion
    roles: List[str]  # Multiple roles, e.g., ["Oracle Fusion Functional Consultant", "Oracle Fusion Technical Consultant"]
    seniority_level: Optional[str] = None  # Junior / Mid / Senior
    years_experience_min: Optional[int] = None
    years_experience_max: Optional[int] = None
    hourly_rate_min: Optional[float] = None
    hourly_rate_max: Optional[float] = None
    required_skills: Optional[List[str]] = None  # List of skill names
    work_type: Optional[str] = None  # Remote / On-site / Hybrid
    location_preferences: Optional[List[str]] = None  # List of preferred locations
    availability: Optional[str] = None
    preference_name: Optional[str] = None  # Custom name for this preference


class CandidateJobPreferenceUpdate(BaseModel):
    """Update existing job preference"""
    roles: Optional[List[str]] = None
    seniority_level: Optional[str] = None
    years_experience_min: Optional[int] = None
    years_experience_max: Optional[int] = None
    hourly_rate_min: Optional[float] = None
    hourly_rate_max: Optional[float] = None
    required_skills: Optional[List[str]] = None
    work_type: Optional[str] = None
    location_preferences: Optional[List[str]] = None
    availability: Optional[str] = None
    preference_name: Optional[str] = None
    is_active: Optional[bool] = None


class CandidateJobPreferenceRead(BaseModel):
    """Read job preference"""
    id: int
    candidate_id: int
    preference_name: Optional[str]
    product: str
    primary_role: str
    years_experience: Optional[int]
    rate_min: Optional[float]
    rate_max: Optional[float]
    work_type: Optional[str]
    location: Optional[str]
    availability: Optional[str]
    summary: Optional[str]
    required_skills: Optional[str]  # JSON string
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CandidateReadWithPreferences(BaseModel):
    """Candidate with all job preferences"""
    id: int
    user_id: int
    name: str
    email: Optional[str]
    location: Optional[str]
    profile_picture_path: Optional[str]
    summary: Optional[str]
    years_experience: Optional[int]
    rate_min: Optional[float]
    rate_max: Optional[float]
    work_type: Optional[str]
    availability: Optional[str]
    status: Optional[str] = None  # For active/inactive status
    created_at: datetime
    updated_at: datetime
    skills: Optional[List[SkillRead]] = []
    job_preferences: List[CandidateJobPreferenceRead]
    
    class Config:
        from_attributes = True