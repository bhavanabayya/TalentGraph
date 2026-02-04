from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship


# ============================================================================
# USER AUTHENTICATION & AUTHORIZATION
# ============================================================================

class User(SQLModel, table=True):
    """Universal user table for both Candidates and Company Employees"""
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    user_type: str  # "candidate" or "company"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    candidate: Optional["Candidate"] = Relationship(back_populates="user")
    company_user: Optional["CompanyUser"] = Relationship(back_populates="user")


# ============================================================================
# CANDIDATE SIDE
# ============================================================================

class Skill(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    candidate_id: int = Field(foreign_key="candidate.id")
    name: str
    rating: Optional[int] = Field(default=3)  # 1-5 star rating
    level: Optional[str] = None  # e.g., Beginner / Intermediate / Expert
    category: Optional[str] = None  # "technical", "soft", etc.

    candidate: "Candidate" = Relationship(back_populates="skills")


class Certification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    candidate_id: int = Field(foreign_key="candidate.id")
    name: str
    issuer: Optional[str] = None
    year: Optional[int] = None

    candidate: "Candidate" = Relationship(back_populates="certifications")


class Resume(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    candidate_id: int = Field(foreign_key="candidate.id")
    filename: str
    content_type: Optional[str] = None
    storage_path: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    candidate: "Candidate" = Relationship(back_populates="resumes")


class SocialLink(SQLModel, table=True):
    """Social media and portfolio links for candidates"""
    id: Optional[int] = Field(default=None, primary_key=True)
    candidate_id: int = Field(foreign_key="candidate.id")
    platform: str  # "github", "linkedin", "portfolio", "twitter", "personal-website"
    url: str
    display_name: Optional[str] = None  # e.g., "GitHub Profile", "My Portfolio"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    candidate: "Candidate" = Relationship(back_populates="social_links")


class CandidateJobPreference(SQLModel, table=True):
    """Job preference profile created by candidate for different roles/products"""
    id: Optional[int] = Field(default=None, primary_key=True)
    candidate_id: int = Field(foreign_key="candidate.id")
    
    # Profile name/label for this preference
    preference_name: Optional[str] = None  # e.g., "Oracle Fusion - Senior Role"
    
    # Product/Role selection
    product: str  # e.g., "SaaS", "E-Business Suite"
    primary_role: str  # e.g., "Oracle Fusion Functional Consultant"
    
    # Job preferences specific to this profile
    years_experience: Optional[int] = None
    rate_min: Optional[float] = None
    rate_max: Optional[float] = None
    
    # Work preferences
    work_type: Optional[str] = None  # Remote / On-site / Hybrid
    location: Optional[str] = None
    
    # Visa and Diversity Information for this profile
    visa_type: Optional[str] = None  # "Citizen", "Permanent Resident", "H1B", "OPT", "Requires Sponsorship", etc.
    ethnicity: Optional[str] = None  # Optional for diversity tracking
    
    # Availability
    availability: Optional[str] = None  # Immediately / 2 weeks / 1 month
    
    # Professional summary for this profile
    summary: Optional[str] = None
    
    # Required skills for this role (JSON: [{"name": "skill", "rating": 4}, ...])
    required_skills: Optional[str] = None
    
    # Metadata
    is_active: bool = True  # Can deactivate without deleting
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    candidate: "Candidate" = Relationship(back_populates="job_preferences")


class Candidate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True)
    
    # General Information
    name: str
    email: Optional[str] = None  # Contact email
    phone: Optional[str] = None  # Contact phone number
    residential_address: Optional[str] = None  # Full residential address
    location: Optional[str] = None  # City/Location preference
    profile_picture_path: Optional[str] = None
    
    # Visa and Diversity Information
    visa_type: Optional[str] = None  # "Citizen", "Permanent Resident", "H1B", "OPT", "Requires Sponsorship", etc.
    ethnicity: Optional[str] = None  # Optional for diversity tracking (e.g., "Asian", "Black or African American", "Hispanic or Latino", "White", "Prefer not to disclose")
    
    # General Info Completion Flag
    is_general_info_complete: bool = False  # Tracks if user has completed initial general info setup
    
    summary: Optional[str] = None
    
    # Product/Role Focus
    product: Optional[str] = None  # e.g., "SaaS", "E-Business Suite"
    primary_role: Optional[str] = None  # e.g., "Oracle Fusion Functional Consultant"
    
    # Experience and Rate
    years_experience: Optional[int] = None  # Years of experience
    rate_min: Optional[float] = None  # Minimum hourly/annual rate
    rate_max: Optional[float] = None  # Maximum hourly/annual rate
    
    # General preferences (used for broader matching)
    work_type: Optional[str] = None  # Remote / On-site / Hybrid
    availability: Optional[str] = None  # e.g., "Immediately", "2 weeks", "1 month"
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional[User] = Relationship(back_populates="candidate")
    skills: List[Skill] = Relationship(back_populates="candidate")
    certifications: List[Certification] = Relationship(back_populates="candidate")
    resumes: List[Resume] = Relationship(back_populates="candidate")
    social_links: List["SocialLink"] = Relationship(back_populates="candidate")
    job_preferences: List[CandidateJobPreference] = Relationship(back_populates="candidate")
    swipes_given: List["Swipe"] = Relationship(back_populates="candidate")
    applications: List["Application"] = Relationship(back_populates="candidate")


# ============================================================================
# COMPANY SIDE
# ============================================================================

class CompanyAccount(SQLModel, table=True):
    """Company/organization account"""
    id: Optional[int] = Field(default=None, primary_key=True)
    company_name: str
    domain: Optional[str] = None  # e.g., "example.com"
    hq_location: Optional[str] = None
    description: Optional[str] = None
    logo_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    company_users: List["CompanyUser"] = Relationship(back_populates="company")
    job_posts: List["JobPost"] = Relationship(back_populates="company")


class CompanyUser(SQLModel, table=True):
    """Employee of a company with role-based permissions"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True)
    company_id: int = Field(foreign_key="companyaccount.id")
    
    first_name: str
    last_name: str
    role: str  # "HR", "TEAM_LEAD", "RECRUITER", "ADMIN"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: Optional[User] = Relationship(back_populates="company_user")
    company: CompanyAccount = Relationship(back_populates="company_users")
    swipes_given: List["Swipe"] = Relationship(back_populates="company_user")


class JobPost(SQLModel, table=True):
    """Job posting by a company"""
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="companyaccount.id")
    created_by_user_id: Optional[int] = Field(foreign_key="companyuser.id")  # Recruiter who created this job
    assigned_to_user_id: Optional[int] = Field(foreign_key="companyuser.id")  # Recruiter assigned to manage this job
    
    title: str
    description: Optional[str] = None
    product_author: str  # e.g., "Oracle"
    product: str  # e.g., "Oracle EBS"
    role: str  # e.g., "Oracle Fusion Functional Consultant"
    seniority: Optional[str] = None  # Junior / Mid / Senior
    
    # New fields for recruiter portal
    job_type: Optional[str] = None  # "Permanent" or "Contract"
    duration: Optional[str] = None  # e.g., "6 months", "1 year"
    start_date: Optional[datetime] = None  # Job start date
    currency: Optional[str] = None  # "USD", "EUR", etc.
    
    location: Optional[str] = None
    work_type: Optional[str] = None  # Remote / On-site / Hybrid
    min_rate: Optional[float] = None  # Hourly rate for contracts
    max_rate: Optional[float] = None  # Hourly rate for contracts
    salary_min: Optional[float] = None  # Annual salary for permanent jobs
    salary_max: Optional[float] = None  # Annual salary for permanent jobs
    required_skills: Optional[str] = None  # JSON array of skill names
    nice_to_have_skills: Optional[str] = None  # JSON array
    
    status: str = "active"  # active, closed, archived
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    company: CompanyAccount = Relationship(back_populates="job_posts")
    swipes: List["Swipe"] = Relationship(back_populates="job_post")
    applications: List["Application"] = Relationship(back_populates="job_post")


class Swipe(SQLModel, table=True):
    """Like/Pass interaction between candidate and company on a job"""
    id: Optional[int] = Field(default=None, primary_key=True)
    candidate_id: int = Field(foreign_key="candidate.id")
    job_post_id: int = Field(foreign_key="jobpost.id")
    company_user_id: Optional[int] = Field(foreign_key="companyuser.id")  # Who swiped from company side
    
    action: str  # "like", "pass", "interview_scheduled", "hired", "rejected"
    match_score: Optional[float] = None  # 0-100
    match_explanation: Optional[str] = None  # JSON details
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    candidate: Candidate = Relationship(back_populates="swipes_given")
    job_post: JobPost = Relationship(back_populates="swipes")
    company_user: Optional[CompanyUser] = Relationship(back_populates="swipes_given")


# ============================================================================
# ONTOLOGY: Authors / Products / Roles (for Oracle POC)
# ============================================================================

class ProductAuthor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str  # "Oracle", "SAP", etc.
    code: Optional[str] = None

    products: List["Product"] = Relationship(back_populates="author")


class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    author_id: int = Field(foreign_key="productauthor.id")
    name: str  # e.g., "Oracle EBS", "Oracle Fusion"
    code: Optional[str] = None

    author: ProductAuthor = Relationship(back_populates="products")
    roles: List["JobRole"] = Relationship(back_populates="product")


class JobRole(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id")
    name: str  # e.g., "Oracle Fusion Functional Consultant"
    seniority: Optional[str] = None  # Junior / Mid / Senior
    description: Optional[str] = None

    product: Product = Relationship(back_populates="roles")


# ============================================================================
# MATCH STATE TRACKING (Dating App Model)
# ============================================================================

class MatchState(SQLModel, table=True):
    """
    Tracks the interaction state between a candidate and a specific job posting.
    Similar to dating app swipe mechanics.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    candidate_id: int = Field(foreign_key="candidate.id", index=True)
    job_post_id: int = Field(foreign_key="jobpost.id", index=True)
    
    # Actions taken by each party
    candidate_action: str = "NONE"  # NONE, LIKE, PASS, APPLY
    recruiter_action: str = "NONE"  # NONE, LIKE, PASS, ASK_TO_APPLY
    
    # Overall state of the match
    status: str = "OPEN"  # OPEN, MATCHED, REJECTED, EXPIRED
    
    # What information is unlocked for viewing
    unlock_level: str = "PREVIEW"  # PREVIEW (basic info), PARTIAL (resume + details), FULL (all details)
    
    # Match score at time of first interaction
    initial_match_score: Optional[float] = None  # 0-100
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    candidate_action_at: Optional[datetime] = None
    recruiter_action_at: Optional[datetime] = None
    
    # For ask_to_apply workflow
    ask_to_apply_message: Optional[str] = None  # Custom message from recruiter
    ask_to_apply_status: Optional[str] = None  # PENDING, ACCEPTED, DECLINED
    ask_to_apply_sent_at: Optional[datetime] = None  # When recruiter sent invitation
    ask_to_apply_expires_at: Optional[datetime] = None  # Expiration date for invitation
    ask_to_apply_accepted: bool = False  # Whether candidate accepted the invitation


# ============================================================================
# APPLICATION TRACKING
# ============================================================================

class Application(SQLModel, table=True):
    """Candidate application to a job posting"""
    id: Optional[int] = Field(default=None, primary_key=True)
    candidate_id: int = Field(foreign_key="candidate.id")
    job_post_id: int = Field(foreign_key="jobpost.id")
    
    status: str = "submitted"  # submitted, reviewing, interviewed, offered, rejected, withdrawn
    match_score: Optional[float] = None  # 0-100 at time of application
    applied_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    candidate: Candidate = Relationship(back_populates="applications")
    job_post: JobPost = Relationship(back_populates="applications")
