from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


# --- Core skill & certification models ---


class Skill(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    candidate_id: int = Field(foreign_key="candidate.id")
    name: str
    level: Optional[str] = None  # e.g., Beginner / Intermediate / Expert

    candidate: "Candidate" = Relationship(back_populates="skills")


class Certification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    candidate_id: int = Field(foreign_key="candidate.id")
    name: str
    issuer: Optional[str] = None
    year: Optional[int] = None

    candidate: "Candidate" = Relationship(back_populates="certifications")


# --- Ontology: Authors / Products / Roles ---


class ProductAuthor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str  # Oracle / SAP / Workday / Salesforce / Microsoft / Other
    code: Optional[str] = None

    products: List["Product"] = Relationship(back_populates="author")


class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    author_id: int = Field(foreign_key="productauthor.id")
    name: str  # e.g. E-Business Suite, SaaS, PeopleSoft, JDE
    code: Optional[str] = None

    author: ProductAuthor = Relationship(back_populates="products")
    roles: List["JobRole"] = Relationship(back_populates="product")


class JobRole(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id")
    name: str  # e.g. Oracle Fusion Functional Consultant
    seniority: Optional[str] = None  # e.g. Junior / Mid / Senior
    description: Optional[str] = None

    product: Product = Relationship(back_populates="roles")


# --- Resume model ---


class Resume(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    candidate_id: int = Field(foreign_key="candidate.id")
    filename: str
    content_type: Optional[str] = None
    storage_path: str

    candidate: "Candidate" = Relationship(back_populates="resumes")


# --- Candidate model ---


class Candidate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str
    location: Optional[str] = None

    # Profile picture
    profile_picture_path: Optional[str] = None

    # vendor / product
    product_author: Optional[str] = None
    product: Optional[str] = None

    primary_role: Optional[str] = None
    summary: Optional[str] = None
    years_experience: Optional[int] = None
    rate_min: Optional[float] = None
    rate_max: Optional[float] = None
    availability: Optional[str] = None

    # work type & location preferences
    work_type: Optional[str] = None  # Remote / Full-time / Hybrid
    location_preference_1: Optional[str] = None
    location_preference_2: Optional[str] = None
    location_preference_3: Optional[str] = None
    
    # job roles (JSON array stored as string)
    job_roles: Optional[str] = None  # JSON-serialized list of role names

    # legacy preference fields (deprecated, kept for backward compatibility)
    preference_1: Optional[str] = None
    preference_2: Optional[str] = None
    preference_3: Optional[str] = None

    # future: link to ontology role
    job_role_id: Optional[int] = Field(default=None, foreign_key="jobrole.id")

    skills: List[Skill] = Relationship(back_populates="candidate")
    certifications: List[Certification] = Relationship(back_populates="candidate")
    resumes: List[Resume] = Relationship(back_populates="candidate")
