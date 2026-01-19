# TalentGraph v2.0 - Complete Folder Structure

```
.
├── ARCHITECTURE.md                    # Detailed architecture & matching formula
├── BACKEND_SETUP.md                   # Backend setup instructions
├── FRONTEND_SETUP.md                  # Frontend setup instructions
├── README.md                          # Project overview
├── .gitignore                         # Git ignore rules
│
├── backend/
│   ├── requirements.txt               # Python dependencies
│   │                                  # Updated with passlib, bcrypt
│   │
│   ├── .env.example                   # Environment variables template
│   │
│   ├── moblyze_poc.db                 # SQLite database (auto-created)
│   │
│   └── app/
│       ├── __init__.py
│       ├── main.py                    # FastAPI app + router setup
│       │                              # Updated: includes all 6 routers
│       │
│       ├── database.py                # SQLModel + Session management
│       │                              # Updated: imports all 13 models
│       │
│       ├── models.py                  # SQLModel table definitions
│       │                              # NEW: User, OTPStore, CompanyAccount, 
│       │                              # CompanyUser, JobPost, Swipe
│       │
│       ├── schemas.py                 # Pydantic request/response models
│       │                              # NEW: Auth, Company, Jobs, Swipes schemas
│       │
│       ├── security.py                # JWT + password hashing + RBAC
│       │                              # UPDATED: comprehensive auth helpers
│       │
│       ├── matching.py                # Phase 2 matching & scoring logic
│       │                              # NEW: deterministic score calculation
│       │
│       ├── data/
│       │   ├── roles.json             # Ontology seed data (Oracle focused)
│       │   └── skills.json            # Skill reference data
│       │
│       ├── uploads/                   # Resume file storage
│       │   └── (resume files)
│       │
│       └── routers/
│           ├── __init__.py
│           ├── auth.py                # Signup, login, send-otp, verify-otp
│           │                          # UPDATED: with DB-backed OTP
│           │
│           ├── candidates.py          # Existing: candidate profile CRUD
│           │
│           ├── company.py             # NEW: company account + employees
│           │
│           ├── jobs.py                # NEW: job posting CRUD
│           │
│           ├── swipes.py              # NEW: dating feed, like/pass, ranking
│           │
│           └── job_roles.py           # Existing: ontology read-only
│
├── react-frontend/
│   ├── package.json                   # Dependencies (React, Axios, Zustand)
│   │
│   ├── .env                           # API URL config (optional)
│   │
│   ├── public/
│   │   └── index.html
│   │
│   └── src/
│       ├── index.tsx
│       ├── index.css
│       ├── App.tsx                    # Main router + protected routes
│       ├── App.css
│       │
│       ├── api/
│       │   └── client.ts              # Axios instance + API helpers
│       │                              # Methods: authAPI, candidateAPI, 
│       │                              # companyAPI, jobsAPI, swipesAPI
│       │
│       ├── context/
│       │   └── authStore.ts           # Zustand auth state management
│       │
│       ├── pages/
│       │   ├── WelcomePage.tsx        # Candidate vs Company choice
│       │   ├── SignUpPage.tsx         # Registration form
│       │   ├── SignInPage.tsx         # Login with password
│       │   ├── OTPVerifyPage.tsx      # MFA with 6-digit code
│       │   ├── CandidateDashboard.tsx # Candidate profile & applications
│       │   └── CompanyDashboard.tsx   # Company jobs & candidate feed
│       │
│       ├── components/
│       │   └── CandidateCard.tsx      # Dating-style card (Like/Pass)
│       │
│       └── styles/
│           ├── Welcome.css
│           ├── Auth.css
│           ├── Dashboard.css
│           └── CandidateCard.css

# Summary of Files

## Total Files by Layer:

**Backend:**
- Models: 13 tables (User, OTPStore, Candidate, Skill, Certification, Resume, 
           CompanyAccount, CompanyUser, JobPost, Swipe, ProductAuthor, Product, JobRole)
- Routes: 6 files (auth, candidates, company, jobs, swipes, job_roles)
- Core: 5 files (main, database, models, schemas, security, matching)
- Routers: 1 __init__.py
- Data: 2 JSON files

**Frontend:**
- Pages: 6 TypeScript files
- Components: 1 main component (CandidateCard)
- API: 1 client file with 5 API namespaces
- State: 1 Zustand store
- CSS: 4 style files

## Key Updates in v2.0:

✅ **Authentication:**
   - Multi-factor OTP (6-digit codes via email)
   - Password hashing with bcrypt
   - JWT with user_id, user_type, company_role claims
   - Role-based access control (ADMIN, HR, RECRUITER, TEAM_LEAD)

✅ **Company Features:**
   - Company account creation
   - Multi-employee management with roles
   - Job posting with skill requirements
   - Candidate feed (dating-style UI)
   - Swipe actions (like/pass)
   - Shortlist & ranking

✅ **Matching & Scoring:**
   - Phase 2 deterministic scoring (0-100)
   - 5-component formula: skills (40%), alignment (30%), location (15%), rate (10%), availability (5%)
   - Skill overlap with must-have/nice-to-have weighting
   - Match explanation with detailed reasoning

✅ **Database:**
   - Normalized schema with relationships
   - OTP storage for MFA
   - Feedback signals (likes, passes, interviews, hires)
   - Audit timestamps (created_at, updated_at)

✅ **Frontend:**
   - TypeScript for type safety
   - Token persistence in localStorage
   - Zustand for global state
   - Axios with automatic token injection
   - Dating-style card UI with animations
   - Protected routes by user type
   - Responsive design

✅ **Deployment Ready:**
   - CORS configured for localhost + production
   - .env-based configuration
   - Database auto-initialization
   - API documentation (Swagger /docs)
   - Separated setup guides

## Running Both Together:

**Terminal 1:**
```bash
cd backend && source venv/bin/activate && uvicorn app.main:app --reload
```

**Terminal 2:**
```bash
cd react-frontend && npm start
```

Access at:
- Frontend: http://localhost:3000
- Backend API: http://127.0.0.1:8000
- API Docs: http://127.0.0.1:8000/docs

## Next Steps:

1. Install dependencies:
   ```bash
   cd backend && pip install -r requirements.txt
   cd ../react-frontend && npm install
   ```

2. Set up environment:
   ```bash
   cp .env.example .env
   # Edit .env with your secrets
   ```

3. Run servers:
   ```bash
   # Terminal 1: Backend
   cd backend && uvicorn app.main:app --reload

   # Terminal 2: Frontend
   cd react-frontend && npm start
   ```

4. Access application:
   - http://localhost:3000

5. Test API endpoints:
   - http://127.0.0.1:8000/docs (Swagger UI)

---

**Phase 3 (Future):**
- Resume parsing with LLM
- Semantic embeddings for matching
- Learning loop from swipes/hires
- Vector database integration
- Advanced ranking algorithms
```
