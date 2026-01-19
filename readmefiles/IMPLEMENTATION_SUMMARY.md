# UPDATED FOLDER TREE

Below is the complete folder structure of TalentGraph v2.0 after all upgrades:

```
d:\WORK\App\
│
├── ARCHITECTURE.md                          [Phase 2-3 matching formula + tech stack]
├── BACKEND_SETUP.md                         [Backend installation & env vars guide]
├── FRONTEND_SETUP.md                        [Frontend installation & deployment guide]
├── FOLDER_STRUCTURE.md                      [This file]
├── README.md
├── .gitignore
│
├── backend/
│   ├── requirements.txt                     [Updated: passlib, bcrypt, PyJWT, etc.]
│   ├── moblyze_poc.db                       [SQLite database - auto-created]
│   │
│   └── app/
│       ├── __init__.py
│       ├── main.py                          [UPDATED: includes all 6 routers + CORS]
│       ├── database.py                      [UPDATED: imports all 13 models]
│       ├── models.py                        [UPDATED: 13 tables incl. User, Company, Jobs]
│       ├── schemas.py                       [UPDATED: Auth, Company, Jobs, Swipes schemas]
│       ├── security.py                      [UPDATED: JWT + password hashing + RBAC]
│       ├── matching.py                      [NEW: Phase 2 deterministic scoring]
│       │
│       ├── data/
│       │   ├── roles.json
│       │   └── skills.json
│       │
│       ├── uploads/                         [Resume file storage]
│       │
│       └── routers/
│           ├── __init__.py
│           ├── auth.py                      [UPDATED: signup/login/send-otp/verify-otp]
│           ├── candidates.py
│           ├── company.py                   [NEW: company account + employee mgmt]
│           ├── jobs.py                      [NEW: job posting CRUD]
│           ├── swipes.py                    [NEW: dating feed, like/pass, ranking]
│           └── job_roles.py
│
├── react-frontend/
│   ├── package.json                         [UPDATED: TypeScript + Zustand]
│   ├── public/
│   │   └── index.html
│   │
│   └── src/
│       ├── index.tsx
│       ├── index.css
│       ├── App.tsx                          [UPDATED: protected routes by userType]
│       ├── App.css
│       │
│       ├── api/
│       │   └── client.ts                    [NEW: Axios + 5 API namespaces]
│       │
│       ├── context/
│       │   └── authStore.ts                 [NEW: Zustand auth store]
│       │
│       ├── pages/
│       │   ├── WelcomePage.tsx              [Candidate vs Company choice]
│       │   ├── SignUpPage.tsx               [Registration]
│       │   ├── SignInPage.tsx               [Login]
│       │   ├── OTPVerifyPage.tsx            [MFA with 6-digit code]
│       │   ├── CandidateDashboard.tsx       [Profile + applications]
│       │   └── CompanyDashboard.tsx         [Jobs + candidate feed]
│       │
│       ├── components/
│       │   └── CandidateCard.tsx            [NEW: Dating-style swipe card]
│       │
│       └── styles/
│           ├── Welcome.css
│           ├── Auth.css
│           ├── Dashboard.css
│           └── CandidateCard.css
│
└── [future: /models/  for resume parsing in Phase 3]
```

---

# SUMMARY OF ALL CHANGES

## ✅ BACKEND CHANGES

### 1. **models.py** - New tables added:
```
- User                  [email, password_hash, user_type]
- OTPStore             [email, code, expires_at]  
- CompanyAccount       [company_name, domain, hq_location]
- CompanyUser          [user_id, company_id, role]
- JobPost              [company_id, title, product, location, min_rate, max_rate]
- Swipe                [candidate_id, job_post_id, action, match_score]
```
**Kept:** Candidate, Skill, Certification, Resume, ProductAuthor, Product, JobRole

### 2. **schemas.py** - New request/response models:
```
- SignUpRequest, LoginRequest, LoginResponse
- SendOTPRequest, SendOTPResponse
- VerifyOTPRequest, VerifyOTPResponse
- CompanyAccountCreate, CompanyAccountRead, CompanyProfileRead
- CompanyUserRead
- JobPostCreate, JobPostUpdate, JobPostRead
- CandidateMatchCard, CandidateFeedResponse
- SwipeResponse, RankingResponse
- MatchExplanation
```

### 3. **security.py** - Complete rewrite:
```
- hash_password(password) -> hashed
- verify_password(plain, hash) -> bool
- create_access_token(data, expires_delta) -> JWT token
- decode_token(token) -> dict
- get_current_user() -> dict (dependency)
- get_current_user_id() -> int
- get_current_user_email() -> str
- require_candidate() -> dependency
- require_company_user() -> dependency
- require_company_role(["HR", "ADMIN"]) -> dependency
```

### 4. **matching.py** - NEW MODULE:
```
Implements Phase 2 scoring:
- calculate_skill_overlap_score()       [40% weight]
- calculate_product_alignment_score()   [30% weight]
- calculate_location_fit()              [15% weight]
- calculate_rate_fit()                  [10% weight]
- calculate_availability_fit()          [5% weight]
- calculate_match_score()               [combines all]

Returns: {overall_score, skill_score, alignment_score, 
          location_fit, rate_fit, availability_fit, 
          matched_skills, missing_skills}
```

### 5. **auth.py** (routers/) - Complete rewrite:
```
Endpoints:
- POST /auth/signup                     [email, password, user_type]
- POST /auth/login                      [email, password -> needs_otp]
- POST /auth/send-otp                   [email -> sends code]
- POST /auth/verify-otp                 [email, code -> JWT + user_id]

Features:
- Password validation (8+ chars, uppercase, digit, special char)
- bcrypt password hashing
- Database-backed OTP storage
- JWT token with user_id, user_type, company_role claims
```

### 6. **company.py** (routers/) - NEW:
```
Endpoints:
- POST /company/create-account          [company_name, domain, hq_location]
- GET /company/profile                  [get company + employees]
- POST /company/invite-employee         [employee_email, first_name, last_name, role]
- GET /company/employees                [list all employees]

Features:
- First user auto-added as ADMIN
- Role-based access control (HR/ADMIN only for invites)
- Company user management
```

### 7. **jobs.py** (routers/) - NEW:
```
Endpoints:
- POST /jobs/create                     [title, description, product_author, product, role, etc.]
- GET /jobs/                            [list company jobs]
- GET /jobs/{id}                        [get single job]
- PATCH /jobs/{id}                      [update job]
- DELETE /jobs/{id}                     [delete job]

Features:
- Required/nice-to-have skills (JSON arrays)
- Job status (active, closed, archived)
- Company validation
- HR/ADMIN role checks
```

### 8. **swipes.py** (routers/) - NEW:
```
Endpoints:
- GET /swipes/feed/{job_id}             [paginated candidate feed]
- POST /swipes/like                     [candidate_id, job_id]
- POST /swipes/pass                     [candidate_id, job_id]
- GET /swipes/shortlist/{job_id}        [liked candidates only]
- GET /swipes/ranking/{job_id}          [ranked by score]

Features:
- Candidate feed sorted by match score (descending)
- Filters out already-swiped candidates
- Match score calculation on each like
- Dating-style card presentation
```

### 9. **database.py** - Updated init_db():
```
Imports all 13 models:
- User, OTPStore
- Candidate, Skill, Certification, Resume
- CompanyAccount, CompanyUser, JobPost, Swipe
- ProductAuthor, Product, JobRole
```

### 10. **main.py** - Updated routers:
```
Includes:
- auth, candidates, company, jobs, swipes, job_roles

CORS for:
- http://localhost:3000, http://127.0.0.1:3000 (React)
- http://localhost:8501, http://127.0.0.1:8501 (Streamlit)
```

### 11. **requirements.txt** - New dependencies:
```
+ passlib[bcrypt]     [password hashing]
+ bcrypt              [password encryption]
(existing: fastapi, uvicorn, sqlmodel, pydantic, python-multipart, python-dotenv, PyJWT, requests)
```

---

## ✅ FRONTEND CHANGES

### 1. **package.json** - Updated:
```
Added:
+ zustand             [global state management]
+ typescript          [type safety]
+ @types/react, @types/react-dom, @types/node

Keep: react, react-dom, react-router-dom, axios, react-scripts
```

### 2. **src/api/client.ts** - NEW:
```
Exports:
- Axios instance with token auto-injection
- authAPI {signup, login, sendOTP, verifyOTP}
- candidateAPI {getMe, updateProfile, addSkill, uploadResume}
- companyAPI {createAccount, getProfile, inviteEmployee, listEmployees}
- jobsAPI {create, list, get, update, delete}
- swipesAPI {getCandidateFeed, like, pass, getShortlist, getRanking}

Features:
- Automatic Bearer token injection
- 401 error handling (redirect to signin)
- localStorage persistence
```

### 3. **src/context/authStore.ts** - NEW:
```
Zustand store:
- accessToken, userId, userType, email, isAuthenticated
- login(token, userId, userType, email)
- logout()
- loadFromStorage()
```

### 4. **src/pages/WelcomePage.tsx** - NEW:
```
UI:
- Hero section (TalentGraph branding)
- Candidate option card (signup button)
- Company option card (signup button)
- Sign in links
```

### 5. **src/pages/SignUpPage.tsx** - NEW:
```
Features:
- Email input
- Password validation
- Password confirmation
- User type selection (from URL param)
- Error/success messages
- Redirect to signin after success
```

### 6. **src/pages/SignInPage.tsx** - NEW:
```
Features:
- Email + password form
- Redirect to OTP verification
- Error handling
- Link to signup
```

### 7. **src/pages/OTPVerifyPage.tsx** - NEW:
```
Features:
- Two-phase flow: send OTP → verify OTP
- 6-digit code input
- Countdown timer for resend
- Redirect based on user_type (candidate/company)
```

### 8. **src/pages/CandidateDashboard.tsx** - NEW:
```
Tabs:
- Profile: view profile, skills, certifications, resumes
- Applications: view job applications
- Resumes: manage resume uploads

Features:
- Load profile on mount
- Display skills with levels
- Edit profile button
- Logout button
```

### 9. **src/pages/CompanyDashboard.tsx** - NEW:
```
Tabs:
- Jobs: create new job, view all jobs
- Candidate Feed: browse candidates for a job
- Shortlist: view liked candidates

Features:
- Load company profile
- Load job listings
- Load candidate feed on job selection
- Swipe card display
- Like/Pass actions
```

### 10. **src/components/CandidateCard.tsx** - NEW:
```
Props:
- candidate: CandidateCard
- onLike: () => void
- onPass: () => void

Display:
- Candidate name + photo placeholder
- Match score (0-100%) with color coding
- Location, experience, product, role, rate, availability
- Skills list (max 5 + count)
- Match analysis (matched/missing skills, rate fit, location fit)
- Like (♥) and Pass (✕) buttons

Animation:
- Slide in on load
- Scale on hover
```

### 11. **src/App.tsx** - UPDATED:
```
Router setup:
- ProtectedRoute component (checks auth + userType)
- Public routes: /, /signup, /signin, /otp-verify
- Protected candidate: /candidate-dashboard
- Protected company: /company-dashboard
- Fallback: redirect to /

Features:
- loadFromStorage() on mount
- Token-based access control
- User type validation
```

### 12. **src/styles/*** - NEW CSS files:
```
- Welcome.css          [gradient hero, option cards]
- Auth.css            [centered forms, input styling]
- Dashboard.css       [tabs, job cards, content sections]
- CandidateCard.css   [dating-style card, animations, buttons]
```

---

# MATCHING FORMULA (Phase 2)

```
Score = (Skill × 0.40) + (Alignment × 0.30) + (Location × 0.15) + (Rate × 0.10) + (Availability × 0.05)

Skill Overlap (40%):
  - Must-have skills: 2.0 weight each
  - Nice-to-have skills: 1.0 weight each
  - Score = (matched points / max points) × 100

Product Alignment (30%):
  - Exact (author + product + role): 100
  - Author + Product: 90
  - Author only: 70
  - No match: 0

Location Fit (15%):
  - Candidate preference includes job location OR has "Remote": 100
  - Otherwise: 0

Rate Fit (10%):
  - Candidate range overlaps job range: 100
  - Otherwise: 0

Availability (5%):
  - Candidate notice days ≤ job requirement days: 100
  - Otherwise: 0

Final: 0-100
```

---

# ROLE-BASED ACCESS CONTROL

```
User Types:
  - candidate: Can build profile, view jobs, apply
  - company: Can post jobs, browse candidates, swipe

Company Roles:
  - ADMIN: All permissions
  - HR: Create jobs, manage employees, view candidates
  - RECRUITER: View candidates, swipe, schedule calls
  - TEAM_LEAD: View candidates, swipe only

Protected Endpoints Use:
  - require_candidate() for candidate-only features
  - require_company_user() for company-only features
  - require_company_role(["HR", "ADMIN"]) for specific roles
```

---

# KEY FILES UPDATED/CREATED

## Modified Files:
✅ backend/app/models.py
✅ backend/app/schemas.py
✅ backend/app/security.py
✅ backend/app/database.py
✅ backend/app/main.py
✅ backend/app/routers/auth.py
✅ backend/requirements.txt
✅ react-frontend/package.json
✅ react-frontend/src/App.tsx
✅ react-frontend/src/App.css

## New Files Created:
✅ backend/app/matching.py
✅ backend/app/routers/company.py
✅ backend/app/routers/jobs.py
✅ backend/app/routers/swipes.py
✅ react-frontend/src/api/client.ts
✅ react-frontend/src/context/authStore.ts
✅ react-frontend/src/pages/WelcomePage.tsx
✅ react-frontend/src/pages/SignUpPage.tsx
✅ react-frontend/src/pages/SignInPage.tsx
✅ react-frontend/src/pages/OTPVerifyPage.tsx
✅ react-frontend/src/pages/CandidateDashboard.tsx
✅ react-frontend/src/pages/CompanyDashboard.tsx
✅ react-frontend/src/components/CandidateCard.tsx
✅ react-frontend/src/styles/Welcome.css
✅ react-frontend/src/styles/Auth.css
✅ react-frontend/src/styles/Dashboard.css
✅ react-frontend/src/styles/CandidateCard.css
✅ ARCHITECTURE.md
✅ BACKEND_SETUP.md
✅ FRONTEND_SETUP.md
✅ FOLDER_STRUCTURE.md

---

# QUICK START

## Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# Server: http://127.0.0.1:8000
# Docs: http://127.0.0.1:8000/docs
```

## Frontend:
```bash
cd react-frontend
npm install
npm start
# App: http://localhost:3000
```

---

# NOTES

- **Oracle POC**: System optimized for Oracle products initially
- **Database**: SQLite for POC (migrate to PostgreSQL for production)
- **Resume Folder**: Create `/resumes/` in root to upload model resumes
- **Phase 3**: AI parsing, embeddings, and learning loop (in architecture roadmap)
- **Passwords**: Min 8 chars, 1 uppercase, 1 digit, 1 special character
- **OTP**: 10-minute expiry, 6-digit code
- **JWT**: 24-hour expiry, can be configured via `APP_JWT_EXP_HOURS`
