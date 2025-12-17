from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///./moblyze_poc.db"
engine = create_engine(DATABASE_URL, echo=True)


def init_db():
    from .models import (  # noqa
        Candidate,
        Skill,
        Certification,
        ProductAuthor,
        Product,
        JobRole,
        Resume,
    )

    SQLModel.metadata.create_all(bind=engine)


def get_session():
    with Session(engine) as session:
        yield session
