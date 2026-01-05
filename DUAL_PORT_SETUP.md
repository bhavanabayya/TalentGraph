# Dual Port Setup - Original vs New Unified Dashboard

## Overview
The application now supports running **two versions simultaneously**:
- **Port 3000**: Original working candidate dashboard (with tabs for profile/skills/certs/resumes/apps)
- **Port 3001**: New unified dashboard (with consolidated candidate experience)

## New Unified Dashboard Features (Port 3001)

The unified dashboard consolidates all candidate features into one streamlined interface:

### 1. **Profile Section**
- Display candidate basic info (name, email, location, experience)
- Show all saved job preferences in a summary view

### 2. **Job Preferences Section**
Create up to 3 job preference profiles. For each preference, user can specify:
- **Basic Info**: Preference name, location
- **Job Role Preferences**: Select multiple job roles of interest
- **Experience & Rate**: Min/max years experience, hourly rate range
- **Skills**: Select required skills for the role
- **Job Type**: Full-time, Part-time, Contract, Freelance
- **Availability**: Immediate, 2 weeks, 1 month, etc.
- **Location Preferences**: Up to 3 preferred work locations
- **Certifications**: Add certifications relevant to the selected role

All saved preferences appear in the Profile section automatically.

### 3. **Resumes Section**
- Upload resumes (PDF, DOC, DOCX)
- View uploaded resumes in browser
- Save and manage multiple resumes

### 4. **Applications Section**
- View all submitted applications
- See application status (Pending, Rejected, Accepted, etc.)
- View company name and application date

## Running Both Versions

### Terminal 1 - Original Version (Port 3000)
```powershell
cd d:\WORK\App\react-frontend
npm start
```
Access at: **http://localhost:3000**

### Terminal 2 - New Unified Version (Port 3001)
```powershell
cd d:\WORK\App\react-frontend
npm run start:new
```
Access at: **http://localhost:3001**

### Terminal 3 - Backend (Port 8000)
```powershell
cd d:\WORK\App\backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```
Access at: **http://localhost:8000/docs**

## Key Routes

| Route | Port | Version | Purpose |
|-------|------|---------|---------|
| `/candidate-dashboard` | 3000 | Original | Old multi-tab dashboard |
| `/unified-dashboard` | 3001 | New | Consolidated 4-section dashboard |
| `/candidate-dashboard` | 3001 | New | Redirects to unified dashboard |

## Database & Backend

Both frontend versions connect to the **same backend** on port 8000, so:
- All preferences saved in one version appear in the other
- Database is shared
- API endpoints are unified

## Backend Endpoints for New Dashboard

### Job Preferences (New)
- `POST /preferences/create` - Create new preference
- `GET /preferences/my-preferences` - Get all preferences
- `GET /preferences/my-profile` - Get profile + preferences together
- `PUT /preferences/{id}` - Update preference
- `DELETE /preferences/{id}` - Delete preference

### Existing Endpoints
- `GET /candidates/me` - Get current candidate profile
- `POST /candidates/upload-resume` - Upload resume
- `GET /candidates/resumes` - List resumes
- `GET /candidates/applications` - List applications
- `GET /job-roles/authors` - Get product authors
- `GET /job-roles/products/{author}` - Get products
- `GET /job-roles/roles/{author}/{product}` - Get roles
- `GET /job-roles/skills` - Get available skills

## Testing the New Features

1. **Login** to the new unified dashboard on http://localhost:3001
2. Navigate to **Job Preferences** tab
3. Click **"+ Add New Preference"**
4. Fill in all fields and save
5. Check **Profile** tab to see the saved preference
6. Create up to 3 preferences
7. Upload a resume in **Resumes** tab
8. View applications in **Applications** tab

## File Structure

```
react-frontend/
  src/
    pages/
      CandidateDashboard.tsx          ← Original (Port 3000)
      UnifiedCandidateDashboard.tsx   ← New (Port 3001)
      JobPreferencesPage.tsx          ← Standalone (optional)
    api/
      client.ts                        ← API methods for preferences
    App.tsx                           ← Routes both versions
    
backend/
  app/
    models.py                         ← CandidateJobPreference model
    routers/
      preferences.py                  ← Preference endpoints (NEW)
    schemas.py                        ← Preference schemas
```

## Notes

- Both versions use the same API backend
- Job preference data is shared between versions
- Original version remains untouched and fully functional
- New version is available at `/unified-dashboard` route
- You can test both side-by-side on different browsers/tabs

## Troubleshooting

**Port 3001 won't start**: Make sure no other service is using it
```powershell
netstat -ano | findstr :3001
```

**Preferences not showing**: Check browser console for API errors
```
localhost:3001 → Console tab
```

**Backend not responding**: Verify uvicorn is running
```powershell
curl http://127.0.0.1:8000/docs
```

