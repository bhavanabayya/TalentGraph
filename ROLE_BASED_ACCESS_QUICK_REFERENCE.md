# Role-Based Job Management - Quick Reference Card

## At a Glance

```
ADMIN/HR: ✓ Create ✓ Read ✓ Edit ✓ Delete | RECRUITER: ✓ Read Only | CANDIDATE: ✓ Feed Only
```

---

## Frontend Quick Reference

### Check User Role
```tsx
import { useAuth } from '../context/authStore';

const { companyRole } = useAuth();

// companyRole values: 'ADMIN' | 'HR' | 'RECRUITER'
```

### Conditional Rendering
```tsx
const canManageJobs = companyRole === 'ADMIN' || companyRole === 'HR';
const isRecruiterOnly = companyRole === 'RECRUITER';

{canManageJobs && <button>Manage Jobs</button>}
{isRecruiterOnly && <span>View Only</span>}
```

### Modified Files
- `react-frontend/src/pages/RecruiterJobPostingPage.tsx` (Lines 26, 44-45, 203-210, 211-226, 520-551)

---

## Backend Quick Reference

### Secure an Endpoint
```python
from ..security import require_company_role

@router.post("/endpoint")
def my_endpoint(
    current_user: dict = Depends(require_company_role(["HR", "ADMIN"])),
    session: Session = Depends(get_session)
):
    company_id = current_user.get("company_id")
    # Your code here
```

### Role Options
- `["HR", "ADMIN"]` → HR and ADMIN only (default for job management)
- `["RECRUITER", "HR", "ADMIN"]` → All three roles (for viewing)
- `["ADMIN"]` → ADMIN only
- Any combination as needed

### Modified Files
- `backend/app/routers/jobs.py` (Lines 689, 783, 864)

---

## API Endpoints

### Job Management (HR/ADMIN Only)

| Method | Endpoint | Role | Purpose |
|--------|----------|------|---------|
| POST | /jobs/recruiter/create | HR, ADMIN | Create job |
| PUT | /jobs/recruiter/{id} | HR, ADMIN | Edit job |
| DELETE | /recruiter/{id} | HR, ADMIN | Delete job |
| PUT | /jobs/{id}/assign | HR, ADMIN | Assign to recruiter |

### Job Viewing (All Roles)

| Method | Endpoint | Role | Purpose |
|--------|----------|------|---------|
| GET | /jobs/recruiter/my-postings | ALL | View all company jobs |
| GET | /jobs/assigned-to-me | ALL | View jobs assigned to user |
| GET | /jobs/available | CANDIDATE | View job feed |

---

## Permission Summary

```
CREATE JOB
├─ Frontend: Show form + button only to ADMIN/HR
└─ Backend: API checks role, returns 403 if RECRUITER

READ JOB
├─ Frontend: Always show job list (if accessible)
└─ Backend: API allows RECRUITER to view

EDIT JOB
├─ Frontend: Show Edit button only to ADMIN/HR
└─ Backend: API checks role, returns 403 if RECRUITER

DELETE JOB
├─ Frontend: Show Delete button only to ADMIN/HR
└─ Backend: API checks role, returns 403 if RECRUITER
```

---

## Test Scenarios (Quick)

### ✅ Test RECRUITER Cannot Edit
```bash
curl -X PUT http://127.0.0.1:8000/jobs/recruiter/1 \
  -H "Authorization: Bearer RECRUITER_TOKEN" \
  -d '{"title": "New Title"}'
  
# Expect: 403 Forbidden
```

### ✅ Test RECRUITER Can View
```bash
curl http://127.0.0.1:8000/jobs/recruiter/my-postings \
  -H "Authorization: Bearer RECRUITER_TOKEN"

# Expect: 200 OK with job list
```

### ✅ Test HR Can Edit
```bash
curl -X PUT http://127.0.0.1:8000/jobs/recruiter/1 \
  -H "Authorization: Bearer HR_TOKEN" \
  -d '{"title": "New Title"}'

# Expect: 200 OK with updated job
```

---

## Troubleshooting

| Issue | Check | Fix |
|-------|-------|-----|
| RECRUITER sees Edit button | Frontend `canManageJobs` flag | Verify role comparison logic |
| RECRUITER can edit via API | Backend role check | Verify `require_company_role(["HR", "ADMIN"])` |
| Button not showing for HR | Auth context | Verify `companyRole` in localStorage |
| 403 Error on valid request | JWT token | Verify token includes `company_role` claim |
| Wrong role shown | Auth store | Check auth context initialization |

---

## Files at a Glance

```
react-frontend/src/pages/
  └─ RecruiterJobPostingPage.tsx ← Modified (role-based UI)

backend/app/routers/
  └─ jobs.py ← Modified (role-based API)

backend/app/
  └─ security.py ← Uses require_company_role()
  └─ models.py ← JobPost model with created_by_user_id
```

---

## Key Concepts

**canManageJobs**: Boolean flag that's TRUE for ADMIN/HR, FALSE for RECRUITER  
**isRecruiterOnly**: Boolean flag that's TRUE for RECRUITER, FALSE for others  
**require_company_role()**: FastAPI dependency that validates role in JWT token  
**company_id**: Isolates jobs by company (cross-company access prevented)  
**created_by_user_id**: Tracks who created each job (audit trail)  

---

## Common Patterns

### Pattern 1: Show Different Content by Role
```tsx
<div>
  {canManageJobs && <CreateJobForm />}
  {isRecruiterOnly && <ViewOnlyMessage />}
</div>
```

### Pattern 2: Conditionally Render Button
```tsx
{canManageJobs && (
  <button onClick={handleEdit}>Edit</button>
)}
```

### Pattern 3: Secure Backend Endpoint
```python
@router.patch("/{id}")
def update(
    req: UpdateSchema,
    current_user = Depends(require_company_role(["HR", "ADMIN"])),
    session = Depends(get_session)
):
    # Your code
```

---

## Status

✅ Frontend: Complete  
✅ Backend: Complete  
✅ Testing: Documented  
✅ Documentation: Comprehensive  

**Ready for Production**

