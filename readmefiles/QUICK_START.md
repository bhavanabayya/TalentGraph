# Quick Start Guide - TalentGraph App

## Prerequisites

- **Python 3.12+** (backend)
- **Node.js 16+** with npm (frontend)
- **Git** (optional, for version control)

---

## Backend Setup & Launch

### Step 1: Create and Activate Virtual Environment

```powershell
# Navigate to backend directory
cd d:\WORK\App\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1
```

### Step 2: Install Dependencies

```powershell
pip install -r requirements.txt
```

### Step 3: Start FastAPI Server

```powershell
uvicorn app.main:app --reload
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

**Verify API is running:**
- Open http://127.0.0.1:8000/docs in your browser
- Should see interactive Swagger API documentation

---

## Frontend Setup & Launch

### Step 1: Install Dependencies

```powershell
# Navigate to frontend directory
cd d:\WORK\App\react-frontend

# Install npm packages
npm install
```

### Step 2: Start React Development Server

```powershell
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view react-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

**Verify Frontend is running:**
- Browser should automatically open http://localhost:3000
- Should see Welcome page with "Sign Up" / "Sign In" buttons

---

## Testing the Full Application

### 1. Register as Candidate

1. Click "Sign Up" on Welcome page
2. Click "Candidate" tab (should be default)
3. Enter email (e.g., `candidate@example.com`)
4. Enter password (e.g., `TestPassword123!`)
5. Click "Sign Up"

### 2. Verify OTP

- Backend will log OTP code to console (in dev mode)
- Enter the code in OTP verification page
- Click "Verify"
- Should redirect to Candidate Dashboard

### 3. Complete Candidate Profile

1. **Profile Tab**:
   - Fill in name, location, experience, rates, availability
   - Select Product Author (e.g., "Oracle")
   - Select Product (e.g., "EBS")
   - Select Role (e.g., "DBA")
   - Add professional summary
   - Click "Save Profile"

2. **Skills Tab**:
   - Add skill name (e.g., "Oracle SQL")
   - Select level (Beginner/Intermediate/Expert)
   - Select category (technical/soft/domain)
   - Click "Add Skill"
   - Repeat for multiple skills

3. **Certifications Tab**:
   - Add certification name, issuer, year
   - Click "Add Certification"

4. **Resumes Tab**:
   - Click file input, select a PDF/DOC file
   - Click "Upload Resume"

### 4. Register as Company

1. Click "Logout"
2. Click "Sign Up"
3. Click "Company" tab
4. Enter email (e.g., `recruiter@techcorp.com`)
5. Enter password
6. Click "Sign Up"
7. Verify OTP

### 5. Test Company Recruiter Features

1. **Job Postings Tab**:
   - Fill in job title (e.g., "Senior Oracle DBA")
   - Fill in description, location, rate range, work type
   - Click "Create Job"
   - Should see job listed in "Your Jobs" table

2. **Candidate Feed Tab**:
   - Select a job from the job list
   - Click "Candidate Feed" tab
   - Should see candidate profile card
   - Click "👍 Like" to shortlist
   - Click "👎 Pass" to move to next candidate

3. **Shortlist Tab**:
   - Select the same job
   - Click "Shortlist" tab
   - Should see liked candidates sorted by match score

4. **Rankings Tab**:
   - Select a job
   - Click "Rankings" tab
   - Should see ranked list with explanations for each score

---

## Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use different port
uvicorn app.main:app --reload --port 8001
```

**Module import errors:**
```powershell
# Ensure you're in correct venv
.\venv\Scripts\Activate.ps1

# Reinstall requirements
pip install --upgrade -r requirements.txt
```

**Database errors:**
```powershell
# Delete old database and let it recreate
Remove-Item moblyze_poc.db
# Restart uvicorn - will auto-create fresh database
```

### Frontend Issues

**Port 3000 already in use:**
```powershell
# Kill port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or set custom port
$env:PORT=3001
npm start
```

**Cannot connect to API:**
- Verify backend is running on http://127.0.0.1:8000
- Check network tab in browser DevTools for API calls
- Ensure Authorization header has Bearer token

**CORS errors:**
- Backend should handle CORS automatically
- Check browser console for specific error messages

---

## Environment Variables (Optional)

### Backend (.env in backend/ directory)

```
APP_JWT_SECRET=your-secret-key-here
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
DATABASE_URL=sqlite:///./moblyze_poc.db
```

### Frontend (.env in react-frontend/ directory)

```
REACT_APP_API_URL=http://127.0.0.1:8000
```

---

## Common API Endpoints for Testing

### Authentication
- `POST /auth/signup` - Create new user
- `POST /auth/login` - Login user
- `POST /auth/send-otp` - Send OTP code
- `POST /auth/verify-otp` - Verify OTP and get token

### Candidate
- `GET /candidates/me` - Get current candidate profile
- `PUT /candidates/me` - Update profile
- `POST /candidates/me/skills` - Add skill
- `GET /candidates/me/applications` - Get applications

### Jobs
- `POST /jobs/create` - Create job
- `GET /jobs/` - List company jobs
- `GET /jobs/{job_id}` - Get job details

### Swipes
- `GET /swipes/feed/{job_id}` - Get candidate feed
- `POST /swipes/like` - Like candidate
- `GET /swipes/shortlist/{job_id}` - Get shortlist

### Job Roles
- `GET /job-roles/authors` - List product authors
- `GET /job-roles/products?author=Oracle` - List products
- `GET /job-roles/roles?author=Oracle&product=EBS` - List roles

---

## Database Inspection

### View SQLite Database (Optional)

```powershell
# Install sqlite browser (optional)
choco install sqlite -y

# Or use Python to inspect
python
>>> import sqlite3
>>> conn = sqlite3.connect('moblyze_poc.db')
>>> cursor = conn.cursor()
>>> cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
>>> print(cursor.fetchall())
```

---

## Stopping Services

### Stop Backend
```powershell
# In backend terminal: Press CTRL+C
```

### Stop Frontend
```powershell
# In frontend terminal: Press CTRL+C
```

### Deactivate Virtual Environment
```powershell
deactivate
```

---

## Next Steps

1. Test all features end-to-end
2. Create sample data (candidates, jobs, swipes)
3. Review database schema: `backend/app/models.py`
4. Check API docs: `http://127.0.0.1:8000/docs`
5. Deploy to production (see DEPLOYMENT.md)

---

## Support & Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Docs**: https://react.dev/
- **SQLModel**: https://sqlmodel.tiangolo.com/
- **Axios**: https://axios-http.com/

---

**Happy testing! 🎉**
