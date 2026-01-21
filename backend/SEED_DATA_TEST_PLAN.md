# Seed Data Testing Plan

## 🎯 Objective

Verify that the seed data system correctly populates the database and that all data synchronizes bidirectionally between the database and UI.

## 📋 Pre-Test Setup

### 1. Environment Check
- [ ] PostgreSQL running on port 5433
- [ ] Backend virtual environment activated
- [ ] All dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)

### 2. Run Seed Data
```powershell
cd backend
.\run_seed_data.ps1
```

Expected Output:
```
✅ Existing seed data cleared
✅ Created 2 candidates with complete profiles
✅ Created company with 3 users
✅ Created 6 job postings
```

### 3. Start Services
```powershell
# Terminal 1 - Backend
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd react-frontend
npm start
```

## 🧪 Test Suite 1: Database Verification

### Test 1.1: Record Counts
**Objective:** Verify all seed data was created

```sql
-- Connect to database
psql -U moblyze_user -d moblyze_db -h localhost -p 5433

-- Run verification queries
SELECT 'Users (should be 5)' as check, COUNT(*) FROM "user";
SELECT 'Candidates (should be 2)' as check, COUNT(*) FROM candidate;
SELECT 'Skills (should be 17)' as check, COUNT(*) FROM skill;
SELECT 'Certifications (should be 6)' as check, COUNT(*) FROM certification;
SELECT 'Social Links (should be 5)' as check, COUNT(*) FROM sociallink;
SELECT 'Job Preferences (should be 4)' as check, COUNT(*) FROM candidatejobpreference;
SELECT 'Company Accounts (should be 1)' as check, COUNT(*) FROM companyaccount;
SELECT 'Company Users (should be 3)' as check, COUNT(*) FROM companyuser;
SELECT 'Job Posts (should be 6)' as check, COUNT(*) FROM jobpost;
```

**Expected Results:**
- [ ] Users: 5
- [ ] Candidates: 2
- [ ] Skills: 17
- [ ] Certifications: 6
- [ ] Social Links: 5
- [ ] Job Preferences: 4
- [ ] Company Accounts: 1
- [ ] Company Users: 3
- [ ] Job Posts: 6

### Test 1.2: Data Integrity
**Objective:** Verify relationships are correctly established

```sql
-- Verify candidate relationships
SELECT 
    c.name,
    COUNT(DISTINCT s.id) as skills_count,
    COUNT(DISTINCT cert.id) as cert_count,
    COUNT(DISTINCT sl.id) as social_links_count,
    COUNT(DISTINCT jp.id) as preferences_count
FROM candidate c
LEFT JOIN skill s ON s.candidate_id = c.id
LEFT JOIN certification cert ON cert.candidate_id = c.id
LEFT JOIN sociallink sl ON sl.candidate_id = c.id
LEFT JOIN candidatejobpreference jp ON jp.candidate_id = c.id
GROUP BY c.name;
```

**Expected Results:**
- [ ] Sarah Anderson: 8 skills, 3 certs, 3 social links, 2 preferences
- [ ] Michael Chen: 9 skills, 3 certs, 2 social links, 2 preferences

### Test 1.3: Job Postings
**Objective:** Verify all job postings are active

```sql
SELECT title, location, work_type, job_type, status
FROM jobpost
ORDER BY title;
```

**Expected Results:**
- [ ] All 6 jobs present
- [ ] All status = 'active'
- [ ] All have valid company_id

## 🧪 Test Suite 2: Candidate Portal Tests

### Test 2.1: Candidate Login - Sarah Anderson
**Steps:**
1. Navigate to `http://localhost:3000`
2. Click on "Candidate Login" or navigate to candidate portal
3. Enter credentials:
   - Email: `sarah.anderson@email.com`
   - Password: `password123`
4. Click "Sign In"

**Expected Results:**
- [ ] Successfully authenticated
- [ ] Redirected to candidate dashboard
- [ ] JWT token stored in session/localStorage

### Test 2.2: View Candidate Profile
**Steps:**
1. After login, navigate to profile page
2. Verify all information displays correctly

**Expected Results - General Information:**
- [ ] Name: Sarah Anderson
- [ ] Email: sarah.anderson@email.com
- [ ] Phone: +1 (555) 123-4567
- [ ] Location: San Francisco, CA
- [ ] Address: 123 Tech Street, San Francisco, CA 94102
- [ ] Visa Type: Citizen
- [ ] Ethnicity: Asian

**Expected Results - Professional Information:**
- [ ] Role: Oracle Fusion Functional Consultant
- [ ] Product: SaaS
- [ ] Experience: 8 years
- [ ] Rate: $125-175/hr
- [ ] Work Type: Remote
- [ ] Availability: 2 weeks

**Expected Results - Skills (8 total):**
- [ ] Oracle Fusion Cloud (5 stars, Expert)
- [ ] Oracle EBS (4 stars, Advanced)
- [ ] Financial Management (5 stars, Expert)
- [ ] Supply Chain Management (4 stars, Advanced)
- [ ] SQL (4 stars, Advanced)
- [ ] OTBI Reporting (5 stars, Expert)
- [ ] Project Management (4 stars, Advanced)
- [ ] Stakeholder Communication (5 stars, Expert)

**Expected Results - Certifications (3 total):**
- [ ] Oracle Cloud Infrastructure Foundations (Oracle, 2023)
- [ ] Oracle Fusion Financials Cloud Service (Oracle, 2022)
- [ ] PMP - Project Management Professional (PMI, 2021)

**Expected Results - Social Links (3 total):**
- [ ] LinkedIn Profile
- [ ] GitHub Profile
- [ ] Portfolio Website

### Test 2.3: View Job Preferences
**Steps:**
1. Navigate to Job Preferences section
2. View all preferences

**Expected Results - 2 preferences visible:**

**Preference 1:**
- [ ] Name: Oracle Fusion - Senior Finance Role
- [ ] Product: SaaS
- [ ] Role: Oracle Fusion Functional Consultant
- [ ] Rate: $140-180/hr
- [ ] Work Type: Remote
- [ ] Location: San Francisco, CA (Remote)
- [ ] Status: Active

**Preference 2:**
- [ ] Name: Oracle EBS - Supply Chain Specialist
- [ ] Product: E-Business Suite
- [ ] Role: Oracle EBS Supply Chain Consultant
- [ ] Rate: $130-170/hr
- [ ] Work Type: Hybrid
- [ ] Location: Bay Area, CA
- [ ] Status: Active

### Test 2.4: Browse Job Postings
**Steps:**
1. Navigate to job listings/browse jobs page
2. Verify all job postings are visible

**Expected Results:**
- [ ] 6 job postings displayed
- [ ] Each job shows title, location, rate/salary
- [ ] Can click to view job details

### Test 2.5: View Job Details
**Steps:**
1. Click on "Senior Oracle Fusion Financials Consultant"
2. View complete job details

**Expected Results:**
- [ ] Title displayed correctly
- [ ] Description shows
- [ ] Contract, 12 months
- [ ] $140-180/hr
- [ ] San Francisco, CA
- [ ] Hybrid work type
- [ ] Required skills list shows
- [ ] Nice-to-have skills show
- [ ] Apply button visible/functional

### Test 2.6: Update Profile (UI → Database Sync)
**Steps:**
1. Go to profile edit page
2. Change phone number to: `+1 (555) 999-9999`
3. Change availability to: "Immediately"
4. Click "Save" or "Update Profile"

**Verification:**
```sql
SELECT name, phone, availability 
FROM candidate 
WHERE email = 'sarah.anderson@email.com';
```

**Expected Results:**
- [ ] UI shows success message
- [ ] Database updated with new values
- [ ] Phone: +1 (555) 999-9999
- [ ] Availability: Immediately

### Test 2.7: Candidate Login - Michael Chen
**Steps:**
1. Logout
2. Login with Michael Chen credentials:
   - Email: `michael.chen@email.com`
   - Password: `password123`

**Expected Results:**
- [ ] Successfully authenticated
- [ ] Profile shows Michael Chen's information
- [ ] 9 skills visible
- [ ] 3 certifications visible
- [ ] 2 job preferences visible

## 🧪 Test Suite 3: Company/Recruiter Portal Tests

### Test 3.1: Admin Login
**Steps:**
1. Navigate to company/recruiter portal
2. Enter credentials:
   - Email: `hr.admin@techcorp.com`
   - Password: `admin123`
3. Click "Sign In"

**Expected Results:**
- [ ] Successfully authenticated
- [ ] Redirected to company dashboard
- [ ] JWT token stored

### Test 3.2: View Company Profile
**Steps:**
1. Navigate to company profile page

**Expected Results:**
- [ ] Company Name: TechCorp Solutions
- [ ] Location: San Francisco, CA
- [ ] Description visible
- [ ] Company users count: 3

### Test 3.3: View Job Management Dashboard
**Steps:**
1. Navigate to job management/job listings

**Expected Results:**
- [ ] All 6 job postings visible
- [ ] Each shows title, location, status
- [ ] Can filter/search jobs
- [ ] Create new job button visible

### Test 3.4: View Individual Job Details
**Steps:**
1. Click on each job posting
2. Verify details are correct

**Job 1 - Expected Results:**
- [ ] Title: Senior Oracle Fusion Financials Consultant
- [ ] Contract, 12 months
- [ ] $140-180/hr
- [ ] San Francisco, CA, Hybrid
- [ ] Status: Active
- [ ] Required skills visible

**Job 2 - Expected Results:**
- [ ] Title: Oracle HCM Cloud Implementation Consultant
- [ ] Contract, 9 months
- [ ] $120-160/hr
- [ ] Austin, TX, Hybrid

**Job 3 - Expected Results:**
- [ ] Title: Oracle EBS Supply Chain Consultant
- [ ] Contract, 6 months
- [ ] $130-170/hr
- [ ] Remote

**Job 4 - Expected Results:**
- [ ] Title: Oracle Payroll Cloud Specialist
- [ ] Contract, 8 months
- [ ] $115-155/hr
- [ ] Remote

**Job 5 - Expected Results:**
- [ ] Title: Oracle Fusion Technical Consultant
- [ ] Permanent
- [ ] $140-180k/year
- [ ] San Francisco, CA, Hybrid

**Job 6 - Expected Results:**
- [ ] Title: Junior Oracle Fusion Financials Consultant
- [ ] Permanent
- [ ] $75-95k/year
- [ ] Austin, TX, Hybrid

### Test 3.5: Create New Job Posting (UI → Database Sync)
**Steps:**
1. Click "Create New Job" or similar
2. Fill in job details:
   - Title: "Test Oracle DBA Position"
   - Product Author: Oracle
   - Product: Database
   - Role: Oracle DBA
   - Job Type: Contract
   - Duration: 6 months
   - Location: Chicago, IL
   - Work Type: Remote
   - Min Rate: 100
   - Max Rate: 140
3. Submit

**Verification:**
```sql
SELECT title, location, work_type, job_type 
FROM jobpost 
WHERE title = 'Test Oracle DBA Position';
```

**Expected Results:**
- [ ] UI shows success message
- [ ] New job appears in job list (total: 7 jobs)
- [ ] Database contains new record
- [ ] All fields saved correctly

### Test 3.6: Update Job Posting (UI → Database Sync)
**Steps:**
1. Select "Senior Oracle Fusion Financials Consultant"
2. Click "Edit" or similar
3. Change min rate from $140 to $150
4. Change max rate from $180 to $190
5. Save changes

**Verification:**
```sql
SELECT title, min_rate, max_rate 
FROM jobpost 
WHERE title = 'Senior Oracle Fusion Financials Consultant';
```

**Expected Results:**
- [ ] UI shows success message
- [ ] Job list shows updated rates
- [ ] Database updated: min_rate = 150, max_rate = 190

### Test 3.7: HR User Login
**Steps:**
1. Logout
2. Login with HR credentials:
   - Email: `recruiter.jane@techcorp.com`
   - Password: `recruiter123`

**Expected Results:**
- [ ] Successfully authenticated
- [ ] Can view all company job postings
- [ ] Can create new job postings
- [ ] Has appropriate permissions

### Test 3.8: Cross-User Visibility
**Steps:**
1. While logged in as Jane Williams (HR)
2. View job management dashboard

**Expected Results:**
- [ ] Can see all 7 jobs (6 seed + 1 created by admin)
- [ ] Jobs created by admin are visible
- [ ] Can edit/manage all jobs
- [ ] Changes made by admin are reflected

## 🧪 Test Suite 4: Bidirectional Sync Tests

### Test 4.1: Database → UI (Direct Database Update)
**Steps:**
1. Update database directly:
```sql
UPDATE candidate 
SET rate_min = 150, rate_max = 200 
WHERE email = 'sarah.anderson@email.com';
```
2. In UI, logout and login as Sarah Anderson
3. View profile

**Expected Results:**
- [ ] Profile shows updated rate: $150-200/hr
- [ ] No manual refresh needed beyond page load
- [ ] Data syncs correctly

### Test 4.2: UI → Database (Profile Update)
**Steps:**
1. Logged in as Sarah Anderson
2. Update summary/bio text
3. Change location to "Los Angeles, CA"
4. Save

**Verification:**
```sql
SELECT name, location, summary 
FROM candidate 
WHERE email = 'sarah.anderson@email.com';
```

**Expected Results:**
- [ ] Database reflects new location
- [ ] Summary updated in database
- [ ] Changes persist after logout/login

### Test 4.3: Job Preferences Sync
**Steps:**
1. As candidate, create a new job preference
2. Check database for new record
3. Update database directly, refresh UI
4. Verify UI shows database changes

**Expected Results:**
- [ ] New preference appears in database
- [ ] Database updates appear in UI
- [ ] Bidirectional sync works correctly

### Test 4.4: Job Posting Sync
**Steps:**
1. As HR user, change job status to "closed"
2. Verify database updated
3. Update database directly to status "active"
4. Refresh UI

**Expected Results:**
- [ ] Status change in UI saves to database
- [ ] Database change reflects in UI
- [ ] Both directions work correctly

## 🧪 Test Suite 5: Data Persistence Tests

### Test 5.1: Server Restart
**Steps:**
1. Note all data in UI
2. Stop backend server (Ctrl+C)
3. Restart backend server
4. Refresh frontend
5. Verify all data still present

**Expected Results:**
- [ ] All candidates still exist
- [ ] All job postings still visible
- [ ] No data loss
- [ ] All relationships intact

### Test 5.2: Multiple Login Sessions
**Steps:**
1. Open browser window 1, login as Sarah Anderson
2. Open browser window 2, login as Michael Chen
3. Open browser window 3, login as HR Admin
4. Verify each shows correct data

**Expected Results:**
- [ ] Each user sees their own profile
- [ ] No data mixing between sessions
- [ ] Authentication works correctly for all

### Test 5.3: Re-run Seed Data
**Steps:**
1. Run seed data script again: `.\run_seed_data.ps1`
2. Verify it clears and recreates data
3. Check database record counts
4. Login and verify UI

**Expected Results:**
- [ ] Script runs without errors
- [ ] Old seed data cleared
- [ ] New seed data created
- [ ] Same record counts as initial run
- [ ] UI shows correct data

## 🧪 Test Suite 6: Edge Cases and Error Handling

### Test 6.1: Invalid Login
**Steps:**
1. Try to login with wrong password
2. Try to login with non-existent email

**Expected Results:**
- [ ] Error message displayed
- [ ] No authentication token created
- [ ] User not logged in

### Test 6.2: Update with Invalid Data
**Steps:**
1. Try to update candidate rate with negative number
2. Try to create job with missing required fields

**Expected Results:**
- [ ] Validation error shown
- [ ] Database not updated
- [ ] User informed of issue

### Test 6.3: Concurrent Updates
**Steps:**
1. Open same job in two browser tabs
2. Edit in both tabs
3. Save in both tabs

**Expected Results:**
- [ ] Last save wins (or proper conflict handling)
- [ ] No data corruption
- [ ] Consistent state maintained

## 📊 Test Results Summary

| Test Suite | Total Tests | Passed | Failed | Notes |
|------------|-------------|--------|--------|-------|
| Database Verification | 3 | | | |
| Candidate Portal | 7 | | | |
| Company Portal | 8 | | | |
| Bidirectional Sync | 4 | | | |
| Data Persistence | 3 | | | |
| Edge Cases | 3 | | | |
| **TOTAL** | **28** | | | |

## ✅ Success Criteria

The seed data implementation is considered successful if:

- [ ] All 28 tests pass
- [ ] No data corruption occurs
- [ ] All relationships are correct
- [ ] UI reflects database state accurately
- [ ] Database reflects UI changes accurately
- [ ] No performance degradation
- [ ] Seed data script is idempotent
- [ ] Documentation is accurate and complete

## 🐛 Defect Tracking

| ID | Description | Severity | Status | Resolution |
|----|-------------|----------|--------|------------|
| | | | | |
| | | | | |

## 📝 Notes

- All tests should be run in sequence
- Database should be in clean state before starting
- Clear browser cache between test suites
- Document any deviations from expected results
- Take screenshots of any errors

## 🔄 Regression Testing

After any changes to:
- Models (models.py)
- Routers (routers/*.py)
- Frontend components
- Database schema

Re-run:
1. Test Suite 4: Bidirectional Sync Tests
2. Test Suite 5: Data Persistence Tests

## 📅 Test Schedule

- **Initial Testing:** After seed data implementation
- **Regression Testing:** After any model/router changes
- **Before Deployment:** Full test suite execution
- **After Deployment:** Smoke tests (Tests 2.1, 3.1, 4.1)

---

**Test Plan Version:** 1.0
**Created:** January 21, 2026
**Last Updated:** January 21, 2026
**Tester:** [Your Name]
**Status:** Ready for Execution
