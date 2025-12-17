# AI Agent Instructions for Enterprise Talent POC

## Architecture Overview

This is a **candidate-centric talent marketplace POC** with a two-tier structure:

- **Backend**: FastAPI + SQLModel + SQLite (candidate profiles, skills, resumes, job role ontology)
- **Frontend**: Streamlit (candidate profile UI and AI enrichment preview)

**Key Data Flow**: Candidates create profiles → upload resumes → system extracts skills (placeholder) → matches against job role ontology → displays fit scores.

**Data Model** ([models.py](backend/app/models.py)):
- **Candidate**: Core profile with name, email, experience, product author/product preferences
- **Skill/Certification**: Extracted or manually added candidate qualifications
- **Resume**: File storage for uploaded documents
- **Ontology** (ProductAuthor → Product → JobRole): Fixed taxonomy loaded from [roles.json](backend/app/data/roles.json)

## Project Setup & Development Workflows

### Environment & Dependencies

- Backend uses SQLModel (SQLAlchemy + Pydantic integration)
- Windows PowerShell scripts in [commands.txt](commands.txt) for venv setup
- **Database**: SQLite (`moblyze_poc.db`) - autocreated on startup via `init_db()` in [main.py](backend/app/main.py)
- **Key env vars**: `APP_JWT_SECRET` (JWT authentication), `SMTP_EMAIL`/`SMTP_PASSWORD` (future OTP auth)

### Running the App

```powershell
# Backend (from backend/ directory)
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (from frontend/ directory)
.\venv\Scripts\Activate.ps1
streamlit run app.py

# Cleanup
Get-ChildItem -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force
Remove-Item moblyze_poc.db
```

## API Conventions & Patterns

### Router Structure
All routers in [routers/](backend/app/routers/) follow the pattern:
- **Prefix**: `/candidates`, `/job-roles`, `/auth`
- **Tags**: Used for OpenAPI grouping
- **Database**: `session: Session = Depends(get_session)` injected via FastAPI

### Request/Response Pattern
- **Input Models**: `*Create` classes in [schemas.py](backend/app/schemas.py) (e.g., `CandidateCreate`)
- **Output Models**: `*Read` classes (e.g., `CandidateRead`) with IDs and relationships
- **Relationships**: Pydantic models expose nested objects (e.g., `CandidateRead.skills: List[SkillRead]`)

### Authentication
- [security.py](backend/app/security.py): `require_token()` validates JWT Bearer tokens
- Token decoding expects `sub` claim = email address
- Currently mostly commented out in [auth.py](backend/app/routers/auth.py) - ready for OTP implementation

### File Uploads
- Uploads stored in `backend/app/uploads/` (created dynamically)
- Resume model links to `storage_path` for retrieval

## Important Implementation Details

### Database Initialization
The `init_db()` function in [main.py](backend/app/main.py) is called on FastAPI startup. It:
1. Imports all model classes (critical for table creation)
2. Creates tables via `SQLModel.metadata.create_all()`
3. **Important**: Always include new models in this import list

### Frontend API Communication
- Frontend expects `API_BASE = "http://127.0.0.1:8000"`
- Uses `requests` library for HTTP calls
- Session state manages `authed_email`, `candidate_id` across page runs

### Job Role Ontology
- Static data loaded from [roles.json](backend/app/data/roles.json) (no DB writes)
- Endpoints in [job_roles.py](backend/app/routers/job_roles.py) serve this as-is
- Future: Link candidates to ontology roles via `Candidate.job_role_id`

## Code Patterns & Conventions

1. **Session Dependency**: Always use `session: Session = Depends(get_session)` for database access
2. **Error Handling**: Raise `HTTPException(status_code=..., detail="...")` for API errors
3. **Relationships**: Use `Relationship(back_populates="...")` for bidirectional SQLModel links
4. **Validation**: Pydantic `BaseModel` for schemas; SQLModel `Field()` for DB constraints
5. **Path Resolution**: Use `Path(__file__).resolve().parent` for relative paths (see database.py, routers)

## Common Development Tasks

- **Add new endpoint**: Create router in [routers/](backend/app/routers/), include in [main.py](backend/app/main.py)
- **Add new table**: Define in [models.py](backend/app/models.py), import in `init_db()`
- **Update schema**: Modify [schemas.py](backend/app/schemas.py) - mirrors database structure
- **Query candidates**: Use `session.exec(select(Candidate)).all()` pattern
- **Test API**: Use FastAPI `/docs` (Swagger) at `http://127.0.0.1:8000/docs`
