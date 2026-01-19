# Dual Dashboard Setup - Complete Summary

## What's Ready ✅

### Backend (Port 8000)
- ✅ `CandidateJobPreference` model with all fields
- ✅ 6 preference endpoints (create, list, get, update, delete, get-with-profile)
- ✅ Schemas for preference requests/responses
- ✅ All Python files compile without errors
- ✅ Database model relationships configured

### Frontend - Port 3000 (Original - UNTOUCHED)
- ✅ Fully working candidate dashboard with tabs
- ✅ Profile/skills/certifications/resumes/applications sections
- ✅ No changes - keeps existing functionality

### Frontend - Port 3001 (NEW UNIFIED)
- ✅ `UnifiedCandidateDashboard.tsx` created
- ✅ 4 main sections: Profile, Job Preferences, Resumes, Applications
- ✅ Job preferences form with all required fields
- ✅ Route registered in App.tsx at `/unified-dashboard`
- ✅ Ready to run with `npm run start:new` command

## How to Test

### Step 1: Start Backend
```powershell
cd d:\WORK\App\backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```
✅ Backend runs on http://127.0.0.1:8000

### Step 2: Start Original Version (Terminal 2)
```powershell
cd d:\WORK\App\react-frontend
npm start
```
✅ Original runs on http://localhost:3000

### Step 3: Start New Unified Version (Terminal 3)
```powershell
cd d:\WORK\App\react-frontend
npm run start:new
```
✅ New unified runs on http://localhost:3001

### Step 4: Test on Port 3001
1. Go to http://localhost:3001
2. Sign up / Sign in as candidate
3. Navigate to `/unified-dashboard` (or it should auto-load)
4. Test:
   - **Profile Section**: View candidate info
   - **Job Preferences**: Create preference with all fields
   - **Resumes**: Upload a resume
   - **Applications**: View applications
5. Create up to 3 preferences
6. Check Profile section - all preferences should appear

## Key Files Modified/Created

### Modified
- `react-frontend/package.json` - Added `start:new` script for port 3001
- `react-frontend/src/App.tsx` - Added import and route for UnifiedCandidateDashboard

### Created
- `react-frontend/src/pages/UnifiedCandidateDashboard.tsx` - New consolidated dashboard
- `DUAL_PORT_SETUP.md` - Complete setup guide
- `BACKEND_JOB_PREFERENCES_SUMMARY.md` - Backend details

### Unchanged (Preserved)
- `react-frontend/src/pages/CandidateDashboard.tsx` - Original working version
- All backend Python files (models, routers, etc.)
- Database schema

## Feature Details - New Unified Dashboard

### Profile Section
```
- Candidate Name, Email, Location, Experience
- "Saved Job Preferences" card grid showing all preferences
  - Each card displays: preference name, product, roles, experience, rate, work type, availability, locations, skills
```

### Job Preferences Section
```
Preference Form Fields:
├─ Preference Name (text)
├─ Product Author (dropdown) *
├─ Product (dropdown) * (auto-loads after author)
├─ Roles (multi-select grid) * (up to 3, auto-loads after product)
├─ Experience (min-max years)
├─ Rate (min-max hourly)
├─ Work Type (dropdown: Full-time, Part-time, Contract, Freelance)
├─ Availability (text: "Immediately", "2 weeks", etc.)
├─ Location Preferences (add up to 3 locations)
└─ Required Skills (select from dropdown, add multiple)

Max 3 preferences per candidate
Save button persists all data to database
Each saved preference appears in Profile section
```

### Resumes Section
```
- Upload box: Accept PDF, DOC, DOCX
- Resumes list: Shows uploaded files with dates
- View in browser capability
```

### Applications Section
```
- Applications list with:
  - Job title
  - Company name
  - Application status (badge)
  - Application date
```

## Database Schema

### CandidateJobPreference Table
```sql
- id: Integer (PK)
- candidate_id: Integer (FK to Candidate)
- product_author_id: Integer (FK to ProductAuthor)
- product_id: Integer (FK to Product)
- preference_name: String
- roles: JSON (array of role names)
- seniority_level: String
- years_experience_min: Integer
- years_experience_max: Integer
- hourly_rate_min: Integer
- hourly_rate_max: Integer
- required_skills: JSON (array of skill names)
- work_type: String (enum: Full-time, Part-time, Contract, Freelance)
- location_preferences: JSON (array, max 3 locations)
- availability: String
- is_active: Boolean (default True)
- created_at: DateTime
- updated_at: DateTime
```

## API Endpoints Summary

### New Preferences Endpoints
```
POST   /preferences/create                 - Create new preference
GET    /preferences/my-preferences         - List all candidate preferences
GET    /preferences/my-profile             - Get profile + all preferences (for dashboard)
GET    /preferences/{preference_id}        - Get specific preference
PUT    /preferences/{preference_id}        - Update preference
DELETE /preferences/{preference_id}        - Delete preference
```

### Existing Endpoints Used
```
GET    /candidates/me                      - Get candidate profile
POST   /candidates/upload-resume           - Upload resume
GET    /candidates/resumes                 - List resumes
GET    /candidates/applications            - List applications
GET    /job-roles/authors                  - List product authors
GET    /job-roles/products/{author}        - List products by author
GET    /job-roles/roles/{author}/{product} - List roles by product
GET    /job-roles/skills                   - List available skills
```

## Running Both Versions Simultaneously

```
┌─────────────────────────────────────────────────────────┐
│                    Your System                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Browser Tab 1        Browser Tab 2       Terminal     │
│  http://3000          http://3001         http://8000  │
│  (Original)           (New Unified)       (Backend)    │
│                                                         │
│  CandidateDashboard ← Unified Dashboard ← API Endpoints│
│  (old tabs)           (4 sections)         (same DB)   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Next Steps

1. ✅ **Setup complete** - all code is ready
2. ⏳ **Test on Port 3001** - Run `npm run start:new` and verify features
3. ⏳ **Compare both versions** - Keep port 3000 open to compare
4. ⏳ **Validate data sharing** - Create preference on 3001, see it on 3000
5. ⏳ **Deploy to production** - Decide which version to use or merge features

## Common Commands

```powershell
# Clear database
rm d:\WORK\App\backend\moblyze_poc.db

# Start backend with fresh DB
cd d:\WORK\App\backend
uvicorn app.main:app --reload

# Start port 3000 (original)
cd d:\WORK\App\react-frontend
npm start

# Start port 3001 (new)
cd d:\WORK\App\react-frontend
npm run start:new

# Kill port if stuck
Get-Process | Where-Object { $_.Port -eq 3001 } | Stop-Process -Force
```

## Verification Checklist

- [ ] Backend running on 8000 (check `/docs`)
- [ ] Port 3000 works (original dashboard loads)
- [ ] Port 3001 works (`npm run start:new` completes without errors)
- [ ] Can login on 3001
- [ ] Can create job preference on 3001
- [ ] Preference appears in Profile section on 3001
- [ ] Can upload resume on 3001
- [ ] Can see applications on 3001
- [ ] Data persists when switching between 3000 and 3001

---

**Status**: ✅ Ready to test on dual ports
**Next Action**: Run `npm run start:new` in react-frontend directory

