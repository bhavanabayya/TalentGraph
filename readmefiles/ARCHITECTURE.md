# TalentGraph v2.0 - Two-Sided Enterprise Talent Marketplace

## Overview

This is a POC for an enterprise hiring "dating app" connecting candidates with job opportunities. The system features:

- **Dual-sided authentication**: Candidates and Companies with role-based access control
- **Dating-style UI**: Swipe like/pass on candidates for jobs
- **Deterministic matching**: Phase 2 scoring based on skills, products, location, rate, availability
- **Phase 3 Roadmap**: AI-powered resume parsing, embedding-based matching, learning loop

---

## Architecture

### Technology Stack

- **Backend**: FastAPI + SQLModel (SQLAlchemy ORM) + SQLite
- **Frontend**: React + TypeScript + React Router
- **Authentication**: JWT + OTP-based MFA (6-digit codes)
- **Database**: SQLite with 13 core tables

### Database Schema

**User Management:**
- `User`: Universal user table (email, password_hash, user_type: "candidate"|"company")
- `OTPStore`: OTP records for MFA

**Candidate Side:**
- `Candidate`: Profile (name, location, experience, skills, preferences, rates)
- `Skill`: Candidate skills with proficiency levels
- `Certification`: Industry certifications
- `Resume`: Uploaded resume files

**Company Side:**
- `CompanyAccount`: Company profile (name, domain, HQ, description)
- `CompanyUser`: Employee with role (ADMIN, HR, RECRUITER, TEAM_LEAD)
- `JobPost`: Job openings with required/nice-to-have skills
- `Swipe`: Like/Pass/Interview/Hired actions on candidates

**Ontology (for Oracle POC):**
- `ProductAuthor`: "Oracle", "SAP", etc.
- `Product`: "Oracle EBS", "Oracle Fusion"
- `JobRole`: Role name + seniority

---

## Matching & Scoring Formula

### Phase 2 (Deterministic) - Current

**Overall Score: 0-100** (weighted combination)

```
overall_score = 
  (skill_score × 0.40) +
  (alignment_score × 0.30) +
  (location_fit × 0.15) +
  (rate_fit × 0.10) +
  (availability_fit × 0.05)
```

#### 1. Skill Overlap Score (40% weight)

```
max_points = (required_skills.count × 2.0) + (nice_to_have.count × 1.0)
achieved_points = (matched_required × 2.0) + (matched_nice × 1.0)

skill_score = (achieved_points / max_points) × 100
```

**Scoring Logic:**
- Must-have skills: 2.0 weight (critical)
- Nice-to-have skills: 1.0 weight
- Skill names compared case-insensitively
- Returns: matched_skills list, missing_required list

**Example:**
```
Required: ["Oracle Fusion", "SQL", "Java"]
Nice-to-have: ["Python", "Tableau"]
Candidate has: ["Oracle Fusion", "SQL", "Python"]

Matched required: 2/3 = 4.0 points
Matched nice: 1/2 = 1.0 point
Max: 3×2 + 2×1 = 8.0 points

skill_score = (5.0 / 8.0) × 100 = 62.5
```

#### 2. Product/Role Alignment Score (30% weight)

Candidate's product expertise vs. Job requirement:

```
- Exact match (author + product + role): 100
- Author + Product match: 90
- Author only: 70
- No match: 0
```

**Example:**
```
Candidate: Oracle + Oracle EBS + Functional Consultant
Job: Oracle + Oracle Fusion + Developer

Only author matches → score = 70
```

#### 3. Location Fit (15% weight)

```
location_fit = candidate_locations ∩ job_location ≠ ∅
              OR "Remote" in candidate_locations

location_score = 100 if fit else 0
```

**Candidate Locations:** location, location_preference_1, location_preference_2, location_preference_3

#### 4. Rate Fit (10% weight)

```
rate_fit = candidate_max >= job_min AND candidate_min <= job_max

rate_score = 100 if overlap else 0
```

**Example:**
```
Candidate: $80K-$120K
Job: $100K-$140K
Overlap: YES ($100K-$120K is common) → score = 100

Candidate: $50K-$70K
Job: $100K-$140K
Overlap: NO → score = 0
```

#### 5. Availability Fit (5% weight)

```
availability_fit = candidate_notice_days <= job_requirement_days

availability_score = 100 if fit else 0
```

**Availability Mappings:**
```
Candidate availability → notice days:
- "Immediately" / "ASAP" / "Open": 0 days
- "Flexible": 0 days
- "2 weeks": 14 days
- "1 month": 30 days

Job requirement: "ASAP" (default)
```

---

### Phase 2 Match Response Schema

```json
{
  "overall_score": 75.5,
  "skill_score": 62.5,
  "alignment_score": 70.0,
  "location_fit": true,
  "rate_fit": true,
  "availability_fit": true,
  "matched_skills": ["Oracle Fusion", "SQL"],
  "missing_skills": ["Java"]
}
```

---

## API Endpoints

### Authentication
- `POST /auth/signup` - Create account (email, password, user_type)
- `POST /auth/login` - Validate password, trigger OTP
- `POST /auth/send-otp` - Email 6-digit OTP code
- `POST /auth/verify-otp` - Verify code, issue JWT

**JWT Token Claims:**
```json
{
  "sub": "user@example.com",
  "user_id": 123,
  "user_type": "candidate|company",
  "company_id": 456,        // if company user
  "company_role": "HR|ADMIN|RECRUITER|TEAM_LEAD"
}
```

### Candidates
- `POST /candidates/` - Create candidate profile
- `GET /candidates/me` - Get current candidate profile
- `PATCH /candidates/me` - Update profile
- `POST /candidates/skills` - Add skill
- `POST /candidates/certifications` - Add certification
- `POST /candidates/resumes/upload` - Upload resume file
- `GET /candidates/{id}` - Get public candidate profile

### Company
- `POST /company/create-account` - Create company (first user=ADMIN)
- `GET /company/profile` - Get company profile + employees
- `POST /company/invite-employee` - Invite new employee (HR/ADMIN only)
- `GET /company/employees` - List employees

### Jobs
- `POST /jobs/create` - Post new job (HR/ADMIN only)
- `GET /jobs/` - List company's jobs
- `GET /jobs/{id}` - Get job details
- `PATCH /jobs/{id}` - Update job (HR/ADMIN only)
- `DELETE /jobs/{id}` - Delete job (HR/ADMIN only)

### Swipes (Dating UI)
- `GET /swipes/feed/{job_id}` - Get candidate feed (paginated, sorted by match score)
- `POST /swipes/like` - Like candidate → creates Swipe record with match score
- `POST /swipes/pass` - Pass on candidate
- `GET /swipes/shortlist/{job_id}` - Get liked candidates for job (ranked)
- `GET /swipes/ranking/{job_id}` - Get ranking with scores

### Ontology
- `GET /job-roles/` - List all Product Authors
- `GET /job-roles/{author}` - Get products for author
- `GET /job-roles/{author}/{product}` - Get roles for product

---

## Role-Based Access Control (RBAC)

**Company Roles:**
| Role | Create Jobs | View Candidates | Like/Pass | Schedule Calls | Manage Team | Manage HR |
|------|------------|-----------------|-----------|----------------|------------|-----------|
| ADMIN | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| HR | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| RECRUITER | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ |
| TEAM_LEAD | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |

**Role Checks:**
- `require_candidate()` - Only candidates
- `require_company_user()` - Only company users
- `require_company_role(["HR", "ADMIN"])` - Specific roles

---

## Feedback Signals (for Phase 3 learning)

**Swipe Actions:**
```
"like"                    # Initial interest
"pass"                    # Not interested
"interview_scheduled"     # Interview set
"hired"                   # Hired!
"rejected"                # Rejected after interview
```

**Stored Data:**
- `Swipe.action` - action type
- `Swipe.match_score` - Phase 2 score at swipe time
- `Swipe.match_explanation` - JSON with skill/rate/location details
- `Swipe.created_at` - timestamp

---

## Phase 3 AI Roadmap

### Data Infrastructure
1. **Vector Database** (Pinecone or Milvus)
   - Store embeddings for candidate profiles, resumes, job descriptions
   - Semantic search + similarity search

2. **Resume Parser** (with LLM)
   - Extract: skills, experience, certifications, education, projects
   - Auto-enrich candidate profiles
   - Store parsed data in DB

3. **Embedding Models**
   - Use pre-trained `sentence-transformers` (e.g., `all-MiniLM-L6-v2`)
   - Embed job descriptions, candidate profiles, resume text
   - Enable semantic matching beyond string matching

### Matching Evolution
```
Phase 2 (Current): Deterministic rules
  ↓
Phase 3A: Semantic + Rules
  - Use embeddings + Phase 2 scores
  - Blend: 0.6 × embeddings_score + 0.4 × rule_score
  - Better catch role misalignments (e.g., "Consultant" vs "Implementation Specialist")
  
Phase 3B: Learning from Swipes
  - Track: likes, passes, interview_scheduled, hired
  - Fine-tune weights based on hiring success
  - If candidates with low skill_score but high hired_rate → lower skill weight
```

### Implementation Tech Stack
- **Resume Parsing**: LlamaIndex + Claude/GPT-4 or specialized models (pdfplumber + spacy)
- **Embeddings**: SentenceTransformers or OpenAI embeddings API
- **Vector DB**: Pinecone (managed) or Milvus (self-hosted)
- **Learning Loop**: Scikit-learn for weight optimization + logging to analytics table

### Sample Phase 3 Pseudocode
```python
# Resume parsing + enrichment
parsed_resume = parse_resume_with_llm(resume_file)
candidate.skills.extend(parsed_resume.skills)
candidate.years_experience = parsed_resume.years_exp

# Embedding-based matching
candidate_embedding = embed_candidate_profile(candidate)
job_embedding = embed_job_description(job)
semantic_similarity = cosine_distance(candidate_embedding, job_embedding)

# Blended score
phase2_score = calculate_match_score(candidate, job)  # 0-100
blended_score = 0.6 * (semantic_similarity * 100) + 0.4 * phase2_score

# Log feedback for learning
log_feedback({
  "candidate_id": candidate.id,
  "job_id": job.id,
  "swipe_action": "like",
  "phase2_score": phase2_score,
  "semantic_score": semantic_similarity,
  "interview_outcome": "scheduled|hired|rejected"
})

# Periodically refit weights
refit_weights()  # optimize w1, w2, w3... to maximize hire rate
```

---

## Setup & Deployment

### Prerequisites
```bash
Python 3.10+
PostgreSQL or SQLite (default)
Node.js 16+
```

### Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows

pip install -r requirements.txt

# Create .env file
echo "APP_JWT_SECRET=your-secret-key-here" > .env
echo "SMTP_HOST=smtp.gmail.com" >> .env
echo "SMTP_PORT=587" >> .env
echo "SMTP_USERNAME=your-email@gmail.com" >> .env
echo "SMTP_PASSWORD=your-app-password" >> .env
echo "SMTP_FROM_EMAIL=noreply@talentgraph.com" >> .env

# Run
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd react-frontend
npm install
npm start  # runs on http://localhost:3000
```

### Database Migrations (POC)
```bash
# To reset database:
rm backend/moblyze_poc.db

# On next startup, init_db() recreates all tables
```

---

## File Structure

```
backend/
  app/
    __init__.py
    main.py                 # FastAPI app + router setup
    database.py             # SQLModel + session management
    models.py               # 13 SQLModel tables
    schemas.py              # Request/Response Pydantic models
    security.py             # JWT + password hashing + RBAC dependencies
    matching.py             # Phase 2 scoring logic
    routers/
      __init__.py
      auth.py               # signup, login, send-otp, verify-otp
      candidates.py         # candidate profile CRUD
      company.py            # company account + employee management
      jobs.py               # job posting CRUD
      swipes.py             # candidate feed, like/pass, shortlist, ranking
      job_roles.py          # ontology read-only endpoints
  data/
    roles.json              # Ontology seed data
    skills.json             # Skill reference data
  uploads/                  # Resume file storage
  requirements.txt

react-frontend/
  src/
    api/
      client.ts             # Axios instance + API helpers
    pages/
      WelcomePage.tsx       # Candidate vs Company choice
      SignUpPage.tsx
      SignInPage.tsx
      OTPVerifyPage.tsx
      CandidateDashboard.tsx
      CompanyDashboard.tsx
    components/
      CandidateCard.tsx     # Dating-style card
      JobCard.tsx
      SwipeButtons.tsx      # Like/Pass
    context/
      AuthContext.tsx       # Global auth state
    App.tsx
    index.tsx
  package.json

moblyze_poc.db              # SQLite database (auto-created)
.env                        # Secrets (in .gitignore)
.gitignore
README.md
```

---

## Next Steps (POC → Production)

1. **Database**: Migrate SQLite → PostgreSQL
2. **Resume Parsing**: Integrate LLM-based extraction (Phase 3)
3. **Embeddings**: Add semantic matching (Phase 3)
4. **Analytics**: Track swipes, interviews, hires
5. **UI Polish**: Finalize React components, animations
6. **Testing**: Unit tests + integration tests
7. **Deployment**: Docker + Kubernetes / AWS Lambda

---

## Notes

- **Oracle POC**: System is hardcoded for Oracle product family initially. Expand ontology in `roles.json` to support other vendors (SAP, Salesforce, etc.).
- **Password Policy**: Enforced 8+ chars, 1 uppercase, 1 digit, 1 special char
- **OTP Expiry**: 10 minutes
- **JWT Expiry**: 24 hours (configurable via `APP_JWT_EXP_HOURS`)
- **Rate Limiting**: Not yet implemented (add middleware for production)
- **Logging**: Currently prints debug info; use Python `logging` for production
