import os
from sqlmodel import SQLModel, create_engine, Session

# PostgreSQL connection string
# Format: postgresql://user:password@host:port/database
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://moblyze_user:moblyze_pass@localhost:5433/moblyze_db"
)

# For PostgreSQL, we use pool_pre_ping to handle connection drops
engine = create_engine(
    DATABASE_URL,
    echo=True,
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=10,  # Number of connections to maintain
    max_overflow=20  # Additional connections when pool is full
)


def init_db():
    """Initialize database and create all tables."""
    # Import ALL models here to register them with SQLModel.metadata
    from .models import (
        # Auth
        User,
        # Candidate side
        Skill,
        Certification,
        Resume,
        Candidate,
        CandidateJobPreference,
        SocialLink,
        # Company side
        CompanyAccount,
        CompanyUser,
        JobPost,
        Swipe,
        Application,
        # Match system
        MatchState,
        # Ontology
        ProductAuthor,
        Product,
        JobRole,
    )

    SQLModel.metadata.create_all(bind=engine)


def get_session():
    with Session(engine) as session:
        yield session
