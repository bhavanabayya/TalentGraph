# Role-Based Job Management - Visual Flow

## User Journey by Role

### ADMIN/HR User - Full Management Access

```
Login with ADMIN/HR role
  ↓
RecruiterJobPostingPage Loads
  ↓
canManageJobs = TRUE
isRecruiterOnly = FALSE
  ↓
✓ "Post New Job" button VISIBLE
✓ Job posting form VISIBLE
✓ Edit buttons on cards VISIBLE
✓ Delete buttons on cards VISIBLE
  ↓
Can Create → POST /jobs/recruiter/create (Backend allows HR/ADMIN)
Can Edit → PUT /jobs/recruiter/{id} (Backend allows HR/ADMIN)
Can Delete → DELETE /jobs/recruiter/{id} (Backend allows HR/ADMIN)
```

### RECRUITER User - View-Only Access

```
Login with RECRUITER role
  ↓
RecruiterJobPostingPage Loads
  ↓
canManageJobs = FALSE
isRecruiterOnly = TRUE
  ↓
✗ "Post New Job" button HIDDEN
✗ Job posting form HIDDEN
✗ Edit buttons HIDDEN
✗ Delete buttons HIDDEN
✓ "View Only (Read-Only Access)" indicator SHOWN
✓ Context message SHOWN
  ↓
Can View → GET /jobs/recruiter/my-postings (Backend allows RECRUITER)
Can View → GET /jobs/assigned-to-me (Backend allows RECRUITER)
Cannot Create → Blocked by frontend UI
Cannot Edit → Blocked by frontend UI + backend 403
Cannot Delete → Blocked by frontend UI + backend 403
```

### CANDIDATE User - Job Feed

```
Login with CANDIDATE role
  ↓
CandidateDashboard Loads
  ↓
Cannot Access Job Postings Portal
  ↓
Can View All Jobs → GET /jobs/available
Can Apply → No changes needed
```

## Database Permissions Summary

| Endpoint | HTTP | Role Check | RECRUITER | ADMIN/HR |
|----------|------|------------|-----------|----------|
| GET /recruiter/my-postings | GET | ["RECRUITER", "HR", "ADMIN"] | ✓ Can | ✓ Can |
| GET /assigned-to-me | GET | ["RECRUITER", "HR", "ADMIN"] | ✓ Can | ✓ Can |
| GET /company/all-postings | GET | ["ADMIN", "HR"] | ✗ Cannot | ✓ Can |
| **POST /recruiter/create** | POST | **["HR", "ADMIN"]** | **✗ Cannot** | **✓ Can** |
| **PUT /recruiter/{id}** | PUT | **["HR", "ADMIN"]** | **✗ Cannot** | **✓ Can** |
| **DELETE /recruiter/{id}** | DELETE | **["HR", "ADMIN"]** | **✗ Cannot** | **✓ Can** |
| POST /create | POST | ["HR", "ADMIN"] | ✗ Cannot | ✓ Can |
| PATCH /{id} | PATCH | ["HR", "ADMIN"] | ✗ Cannot | ✓ Can |
| DELETE /{id} | DELETE | ["HR", "ADMIN"] | ✗ Cannot | ✓ Can |

## Security Layers

### Layer 1: Frontend UI Controls
- Hide/show buttons based on `companyRole` from auth context
- Prevent accidental misuse
- Improves UX by removing unavailable options

### Layer 2: Backend Authorization
- JWT token contains `company_role` claim
- `require_company_role()` validates role on every request
- Returns 403 Forbidden if unauthorized
- Prevents API abuse if someone bypasses UI

### Layer 3: Business Logic
- Each operation checks `current_user.get("company_id")`
- Jobs can only be accessed within same company
- Cross-company access prevented

## Implementation Summary

**Files Changed**: 2
- `react-frontend/src/pages/RecruiterJobPostingPage.tsx` (Frontend)
- `backend/app/routers/jobs.py` (Backend)

**Lines Changed**: ~15
- 5 lines in frontend (role detection + conditional rendering)
- 3 lines × 3 endpoints in backend (role restrictions)
- Plus descriptive comments

**Backward Compatibility**: ✓ Maintained
- Existing HR/ADMIN workflows unchanged
- GET endpoints still allow RECRUITER to view
- No database schema changes
- No API interface changes

**Testing Status**: Ready ✓
- Manual testing scenarios documented
- All permission combinations verified
- Security validated through both layers

