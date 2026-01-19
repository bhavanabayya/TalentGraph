# TalentGraph v2.0 - Two-Sided Enterprise Talent Marketplace

A dating-app-style platform connecting enterprise talent with job opportunities, featuring deterministic AI-powered matching and role-based access control.

## 📋 Overview

**TalentGraph v2.0** is a complete rewrite from single-sided candidate POC to **two-sided marketplace** with:
- **Dual-sided marketplace**: Candidates build profiles; Companies post jobs
- **Dating-style UI**: Swipe like/pass on candidates for jobs
- **AI Matching (Phase 2)**: Deterministic scoring based on skills, products, location, rate, availability
- **Multi-factor Authentication**: OTP-based email verification
- **Role-based Access Control**: HR, ADMIN, RECRUITER, TEAM_LEAD permissions
- **Real-time Feedback Loop**: Track likes, passes, interviews, hires for Phase 3 learning

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 16+
- npm

### Backend Setup (5 minutes)

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows PowerShell

pip install -r requirements.txt

# Create .env file
echo "APP_JWT_SECRET=your-secret-key-change-in-production" > .env
echo "SMTP_HOST=smtp.gmail.com" >> .env

# Run
uvicorn app.main:app --reload
# Server: http://127.0.0.1:8000
# Docs: http://127.0.0.1:8000/docs
```

### Frontend Setup (5 minutes)

```bash
cd react-frontend
npm install
npm start
# App: http://localhost:3000
```

Both running? 🎉 You now have a full two-sided marketplace!

---

## 📁 Project Structure

```
TalentGraph/
├── backend/               # FastAPI + SQLModel
│   ├── app/
│   │   ├── models.py     # 13 SQLModel tables
│   │   ├── schemas.py    # Pydantic request/response
│   │   ├── security.py   # JWT + password hashing + RBAC
│   │   ├── matching.py   # Phase 2 scoring algorithm
│   │   ├── main.py       # FastAPI app setup
│   │   ├── database.py   # SQLModel session
│   │   └── routers/
│   │       ├── auth.py       # signup, login, send-otp, verify-otp
│   │       ├── candidates.py # candidate profile CRUD
│   │       ├── company.py    # company account + employees
│   │       ├── jobs.py       # job posting CRUD
│   │       ├── swipes.py     # candidate feed, like/pass, ranking
│   │       └── job_roles.py  # ontology read-only
│   └── requirements.txt
│
├── react-frontend/        # React + TypeScript
│   ├── src/
│   │   ├── pages/         # Welcome, SignUp, SignIn, OTP, Dashboards
│   │   ├── components/    # CandidateCard (dating UI)
│   │   ├── api/           # Axios client + API helpers
│   │   ├── context/       # Zustand auth store
│   │   ├── styles/        # CSS for all components
│   │   └── App.tsx        # Router + protected routes
│   └── package.json
│
├── ARCHITECTURE.md        # Detailed tech stack + Phase 3 roadmap
├── IMPLEMENTATION_SUMMARY.md  # All changes in v2.0
├── BACKEND_SETUP.md       # Backend installation guide
├── FRONTEND_SETUP.md      # Frontend installation guide
└── FOLDER_STRUCTURE.md    # Complete file tree
```

---

## 🔐 Authentication Flow

```
1. Sign Up (email, password, user_type)
   ↓
2. Login (email, password)
   ↓
3. Send OTP (6-digit code via email)
   ↓
4. Verify OTP (get JWT token)
   ↓
5. Access Protected Resources (as candidate or company)
```

**JWT Claims:**
```json
{
  "sub": "user@example.com",
  "user_id": 123,
  "user_type": "candidate|company",
  "company_id": 456,
  "company_role": "HR|ADMIN|RECRUITER|TEAM_LEAD"
}
```

---

## 💕 Matching Algorithm (Phase 2)

**Overall Score = 0-100** based on weighted components:

| Component | Weight | Formula |
|-----------|--------|---------|
| **Skill Overlap** | 40% | (matched skills / required skills) × 100<br/>Must-have: 2x weight, Nice-to-have: 1x |
| **Product Alignment** | 30% | Exact match: 100, Author+Product: 90, Author: 70, None: 0 |
| **Location Fit** | 15% | Candidate preference matches job location: 100, else 0 |
| **Rate Fit** | 10% | Candidate & job rate ranges overlap: 100, else 0 |
| **Availability** | 5% | Candidate availability ≤ job requirement: 100, else 0 |

---

## 🎯 API Endpoints

### Authentication
```
POST   /auth/signup        Create account (email, password, user_type)
POST   /auth/login         Validate password → needs_otp: true
POST   /auth/send-otp      Email 6-digit OTP code
POST   /auth/verify-otp    Verify code → get JWT token
```

### Candidates
```
GET    /candidates/me      Get current profile
PATCH  /candidates/me      Update profile
POST   /candidates/skills  Add skill
```

### Company
```
POST   /company/create-account    Create company (first user=ADMIN)
GET    /company/profile           Get company + employees
POST   /company/invite-employee   Add employee (HR/ADMIN only)
GET    /company/employees         List employees
```

### Jobs
```
POST   /jobs/create        Create job (HR/ADMIN only)
GET    /jobs/              List company jobs
GET    /jobs/{id}          Get job details
PATCH  /jobs/{id}          Update job (HR/ADMIN only)
DELETE /jobs/{id}          Delete job (HR/ADMIN only)
```

### Swipes (Dating UI)
```
GET    /swipes/feed/{job_id}      Get candidate cards (paginated, sorted by score)
POST   /swipes/like               Like candidate
POST   /swipes/pass               Pass on candidate
GET    /swipes/shortlist/{job_id} Get liked candidates
GET    /swipes/ranking/{job_id}   Get ranking by score
```

**Full API docs:** `http://127.0.0.1:8000/docs`

---

## 👥 Role-Based Access Control

| Role | Create Jobs | View Candidates | Swipe | Schedule Calls | Manage Team |
|------|------------|-----------------|-------|---|---|
| **ADMIN** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **HR** | ✓ | ✓ | ✓ | ✗ | ✓ |
| **RECRUITER** | ✗ | ✓ | ✓ | ✓ | ✗ |
| **TEAM_LEAD** | ✗ | ✓ | ✓ | ✗ | ✗ |

---

## 📊 Database Schema (13 Tables)

- **User**: email, password_hash, user_type (base auth table)
- **OTPStore**: email, code, expires_at (multi-factor authentication)
- **Candidate**: profile, skills, experience, rates, preferences
- **Skill**: candidate skills with proficiency
- **Certification**: industry certifications
- **Resume**: uploaded files
- **CompanyAccount**: company profile
- **CompanyUser**: employee with role (HR, ADMIN, etc.)
- **JobPost**: job listing with requirements
- **Swipe**: like/pass actions with match score
- **ProductAuthor**: vendor (e.g., Oracle, SAP)
- **Product**: product line (e.g., Oracle EBS)
- **JobRole**: role name + seniority

---

## 🎨 Frontend Features

### Pages
- **WelcomePage**: Choose Candidate or Company
- **SignUpPage**: Register with password validation
- **SignInPage**: Email + password
- **OTPVerifyPage**: 6-digit code + resend timer
- **CandidateDashboard**: Profile, applications, resumes
- **CompanyDashboard**: Jobs, candidate feed, shortlist

### Components
- **CandidateCard**: Dating-style card with:
  - Match score (0-100%) with color coding
  - Candidate details (location, experience, rate, skills)
  - Match analysis (matched/missing skills, rate fit, location fit)
  - Like (♥) and Pass (✕) buttons
  - Smooth animations

### State Management
- **Zustand store**: Global auth state
- **Axios interceptor**: Auto-inject JWT token
- **localStorage**: Persist auth across browser refresh

---

## 🚄 Roadmap

### Phase 1 (Original) ✅
- [x] Candidate profile creation
- [x] Resume upload
- [x] Product/role selection

### Phase 2 (Current v2.0) ✅
- [x] Multi-factor OTP authentication
- [x] Two-sided marketplace (candidates + companies)
- [x] Role-based access control (ADMIN, HR, RECRUITER, TEAM_LEAD)
- [x] Job posting and management
- [x] Candidate feed with dating-style UI
- [x] Like/Pass/Shortlist/Ranking
- [x] Deterministic matching (40% skills, 30% alignment, 15% location, 10% rate, 5% availability)

### Phase 3 (Planned) 🔮
- [ ] Resume parsing with LLM (extract skills, experience, education)
- [ ] Semantic embeddings for matching (sentence-transformers)
- [ ] Blended scoring (0.6 × embeddings + 0.4 × rules)
- [ ] Learning loop from swipes/interviews/hires
- [ ] Vector database (Pinecone/Milvus) for similarity search

---

## 🔧 Environment Variables

### Backend (.env in `backend/`)
```
APP_JWT_SECRET=your-secret-key-change-in-production
APP_JWT_EXP_HOURS=24

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=TalentGraph
SMTP_FROM_EMAIL=noreply@talentgraph.com
```

### Frontend (.env in `react-frontend/`)
```
REACT_APP_API_URL=http://127.0.0.1:8000
```

---

## 📖 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Tech stack, matching formula, Phase 3 roadmap
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Detailed changelog
- **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - Backend installation & troubleshooting
- **[FRONTEND_SETUP.md](./FRONTEND_SETUP.md)** - Frontend setup & deployment
- **[FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)** - Complete file tree

---

**Built with ❤️ for enterprise talent matching**

Happy hiring! 🚀
