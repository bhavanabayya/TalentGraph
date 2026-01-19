# Role-Based Access Control Testing Guide

## Quick Start Testing

### Prerequisites
1. Backend running on `http://127.0.0.1:8000`
2. Frontend running on appropriate dev server
3. Database initialized with test data

### Test Credentials Format
- Email: `{firstname}.{lastname}@company.com`
- Password: `TestPassword123!`
- Role: Selected during signup

## Test Scenarios

### Scenario 1: HR User - Full Access

#### Setup
```
Create account with role: HR
Company: Your Company
```

#### Test Steps
1. **Login as HR**
   - Username: `john.smith@company.com`
   - Role in token: `HR`

2. **Verify UI Elements**
   - [ ] Page title shows "My Job Postings"
   - [ ] "Post New Job" button is VISIBLE
   - [ ] Job posting form is VISIBLE
   - [ ] Edit button visible on each job
   - [ ] Delete button visible on each job
   - [ ] No "View Only" message shown

3. **Test Create Job**
   - [ ] Fill form with job details
   - [ ] Click "Post New Job"
   - [ ] Success message appears
   - [ ] New job visible in list

4. **Test Edit Job**
   - [ ] Click Edit button on a job
   - [ ] Form populates with job details
   - [ ] Modify a field (e.g., location)
   - [ ] Click submit
   - [ ] Changes reflected in list

5. **Test Delete Job**
   - [ ] Click Delete button on a job
   - [ ] Confirm deletion in dialog
   - [ ] Job removed from list
   - [ ] Success message appears

---

### Scenario 2: ADMIN User - Full Access

#### Setup
```
Create account with role: ADMIN
Company: Your Company
```

#### Test Steps
1. **Login as ADMIN**
   - Username: `jane.admin@company.com`
   - Role in token: `ADMIN`

2. **Verify Same Access as HR**
   - [ ] All buttons visible (Post, Edit, Delete)
   - [ ] Can create jobs
   - [ ] Can edit jobs
   - [ ] Can delete jobs
   - [ ] No "View Only" message

3. **Test Team Management (Bonus)**
   - [ ] Navigate to CompanyDashboard
   - [ ] See all team members
   - [ ] See job workload assignments
   - [ ] Can reassign jobs to recruiters

---

### Scenario 3: RECRUITER User - View-Only Access

#### Setup
```
Create account with role: RECRUITER
Company: Your Company
```

#### Test Steps
1. **Login as RECRUITER**
   - Username: `mike.recruiter@company.com`
   - Role in token: `RECRUITER`

2. **Verify UI Restrictions**
   - [ ] Page title shows "Available Job Postings" (NOT "My Job Postings")
   - [ ] "Post New Job" button is HIDDEN
   - [ ] Job posting form is HIDDEN
   - [ ] Edit button is HIDDEN on all jobs
   - [ ] Delete button is HIDDEN on all jobs
   - [ ] "View Only (Read-Only Access)" message VISIBLE on each job
   - [ ] Context message VISIBLE: "View-only mode. You can see assigned and created jobs but cannot edit or delete them."

3. **Test Cannot Create Job**
   - [ ] Look for "Post New Job" button - NOT VISIBLE
   - [ ] Cannot find way to create job through UI
   - ✓ Frontend restriction working

4. **Test Cannot Edit (Frontend)**
   - [ ] Look for Edit button - NOT VISIBLE
   - [ ] Cannot find way to edit job through UI
   - ✓ Frontend restriction working

5. **Test Cannot Delete (Frontend)**
   - [ ] Look for Delete button - NOT VISIBLE
   - [ ] Cannot find way to delete job through UI
   - ✓ Frontend restriction working

6. **Test Cannot Create (Backend Protection)**
   - [ ] Open browser console (F12)
   - [ ] Try to call API: `fetch('http://127.0.0.1:8000/jobs/recruiter/create', { method: 'POST', ... })`
   - [ ] Expect 403 Forbidden response
   - [ ] Error message: "Not authorized for this action" or similar
   - ✓ Backend restriction working

7. **Test Cannot Edit (Backend Protection)**
   - [ ] Try API: `fetch('http://127.0.0.1:8000/jobs/recruiter/1', { method: 'PUT', ... })`
   - [ ] Expect 403 Forbidden
   - ✓ Backend restriction working

8. **Test Cannot Delete (Backend Protection)**
   - [ ] Try API: `fetch('http://127.0.0.1:8000/jobs/recruiter/1', { method: 'DELETE' })`
   - [ ] Expect 403 Forbidden
   - ✓ Backend restriction working

9. **Test Can View Jobs**
   - [ ] API call: `GET /jobs/recruiter/my-postings`
   - [ ] Returns list of jobs
   - [ ] Response 200 OK
   - ✓ Read access working

---

### Scenario 4: CANDIDATE User - Job Feed Only

#### Setup
```
Create account as CANDIDATE
(Different signup flow, not company role)
```

#### Test Steps
1. **Login as CANDIDATE**
   - Username: `alice.candidate@example.com`

2. **Verify Access Restrictions**
   - [ ] Cannot access Job Postings Portal at all
   - [ ] Cannot see /recruiter-portal route
   - [ ] Redirected if trying to access directly
   - ✓ Navigation restriction working

3. **Verify Job Feed Access**
   - [ ] Can view CandidateDashboard
   - [ ] Can see all available jobs in feed
   - [ ] Cannot see Edit/Delete buttons
   - [ ] Cannot create jobs
   - [ ] Can apply to jobs (if implemented)
   - ✓ Candidate workflow unchanged

---

### Scenario 5: Cross-Role Job Visibility

#### Setup
```
User 1: HR User from Company A
User 2: HR User from Company B
User 3: RECRUITER from Company A
User 4: CANDIDATE
```

#### Test Steps
1. **HR User from Company A**
   - [ ] Creates job "Position 1"
   - [ ] Can see "Position 1" in their Job Postings
   - [ ] Can edit "Position 1"
   - [ ] Can delete "Position 1"

2. **RECRUITER from Company A**
   - [ ] Can see "Position 1" in their Job Postings
   - [ ] Cannot edit "Position 1"
   - [ ] Cannot delete "Position 1"
   - [ ] Sees read-only message

3. **HR User from Company B**
   - [ ] Cannot see "Position 1" at all
   - [ ] Has own job postings page isolated

4. **CANDIDATE**
   - [ ] Can see "Position 1" in their job feed
   - [ ] Can see all jobs from all companies
   - [ ] Can apply to "Position 1" (if enabled)

---

## API Testing with cURL

### Test 1: HR Creates Job
```bash
curl -X POST http://127.0.0.1:8000/jobs/recruiter/create \
  -H "Authorization: Bearer {HR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Developer",
    "description": "...",
    "product_author": "Oracle",
    "product": "Fusion",
    "role": "Developer",
    "job_type": "Contract",
    "location": "Remote",
    "min_rate": 50,
    "max_rate": 75
  }'

# Expected: 200 OK, job created
```

### Test 2: RECRUITER Tries to Create Job
```bash
curl -X POST http://127.0.0.1:8000/jobs/recruiter/create \
  -H "Authorization: Bearer {RECRUITER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{...same data...}'

# Expected: 403 Forbidden
# Response: {"detail": "Not authorized for this action"}
```

### Test 3: RECRUITER Can View Jobs
```bash
curl -X GET http://127.0.0.1:8000/jobs/recruiter/my-postings \
  -H "Authorization: Bearer {RECRUITER_TOKEN}"

# Expected: 200 OK, list of jobs
```

### Test 4: RECRUITER Tries to Edit Job
```bash
curl -X PUT http://127.0.0.1:8000/jobs/recruiter/123 \
  -H "Authorization: Bearer {RECRUITER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"title": "New Title"}'

# Expected: 403 Forbidden
```

### Test 5: RECRUITER Tries to Delete Job
```bash
curl -X DELETE http://127.0.0.1:8000/jobs/recruiter/123 \
  -H "Authorization: Bearer {RECRUITER_TOKEN}"

# Expected: 403 Forbidden
```

---

## Expected Errors

### When RECRUITER violates permissions:

```json
{
  "detail": "Not authorized for this action"
}
```
Status: 403 Forbidden

### When accessing job from different company:

```json
{
  "detail": "Job not found or unauthorized"
}
```
Status: 404 Not Found

---

## Checklist

- [ ] HR can create jobs
- [ ] HR can edit jobs
- [ ] HR can delete jobs
- [ ] ADMIN can create jobs
- [ ] ADMIN can edit jobs
- [ ] ADMIN can delete jobs
- [ ] RECRUITER cannot create jobs
- [ ] RECRUITER cannot edit jobs
- [ ] RECRUITER cannot delete jobs
- [ ] RECRUITER can view jobs
- [ ] RECRUITER sees read-only indicator
- [ ] RECRUITER doesn't see action buttons
- [ ] CANDIDATE can view job feed
- [ ] CANDIDATE cannot access portal
- [ ] Cross-company isolation working
- [ ] Backend API enforces permissions
- [ ] Frontend UI matches permissions

---

## Troubleshooting

### Issue: RECRUITER can still see Edit button
- Check: Is `canManageJobs` flag correctly checking role?
- Check: Is companyRole being extracted from auth context?
- Solution: Refresh page, clear browser cache

### Issue: RECRUITER can still create job through API
- Check: Is backend endpoint using `require_company_role(["HR", "ADMIN"])`?
- Check: Is JWT token being sent with request?
- Solution: Verify backend code changes applied

### Issue: Edit button not working for HR
- Check: Is form data being populated correctly?
- Check: Is API endpoint accessible?
- Solution: Check browser console for errors

### Issue: RECRUITER seeing "View Only" on wrong role
- Check: Is role comparison correct in code?
- Check: Should be `isRecruiterOnly = companyRole === 'RECRUITER'`
- Solution: Verify exact string match (case-sensitive)

