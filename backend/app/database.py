from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///./moblyze_poc.db"
engine = create_engine(DATABASE_URL, echo=True)


def init_db():
    """Initialize database and create all tables."""
    # Import ALL models here to register them with SQLModel.metadata
    from .models import (
        # Auth
        User,
        OTPStore,
        # Candidate side
        Skill,
        Certification,
        Resume,
        Candidate,
        CandidateJobPreference,
        # Company side
        CompanyAccount,
        CompanyUser,
        JobPost,
        Swipe,
        Application,
        # Ontology
        ProductAuthor,
        Product,
        JobRole,
    )

    SQLModel.metadata.create_all(bind=engine)


def get_session():
    with Session(engine) as session:
        yield session
