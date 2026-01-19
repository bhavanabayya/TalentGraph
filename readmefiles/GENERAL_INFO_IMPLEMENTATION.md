# General Information Section Implementation

## Overview
A new **General Information** section has been implemented that:
- Redirects **new users** to a form to fill in their basic information when they first sign in
- Redirects **existing users** directly to the profile dashboard
- Shows a dashboard view with saved information and an "Edit Details" button
- Stores: Name, Email, Phone, Residential Address, Location

---

## Backend Changes

### 1. Model Updates (`backend/app/models.py`)

Added new fields to the **Candidate** model:
```python
class Candidate(SQLModel, table=True):
    # General Information
    email: Optional[str] = None           # Contact email
    phone: Optional[str] = None           # Contact phone number
    residential_address: Optional[str] = None  # Full residential address
    
    # General Info Completion Flag
    is_general_info_complete: bool = False  # Tracks if user completed initial setup
```

**Key Fields:**
- `email` - Contact email address (separate from user's login email)
- `phone` - Contact phone number
- `residential_address` - Full residential address
- `location` - City/Location preference (already existed, now used more prominently)
- `is_general_info_complete` - Boolean flag to track if initial setup is done

### 2. Schema Updates (`backend/app/schemas.py`)

Updated **CandidateProfileUpdate** and **CandidateRead** schemas to include:
```python
class CandidateProfileUpdate(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    residential_address: Optional[str] = None
    location: Optional[str] = None
    is_general_info_complete: Optional[bool] = None

class CandidateRead(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    residential_address: Optional[str] = None
    location: Optional[str] = None
    is_general_info_complete: bool = False
```

### 3. API Endpoint (`backend/app/routers/candidates.py`)

Added new endpoint to check general info completion status:
```python
@router.get("/me/general-info-status")
def check_general_info_status(
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    """Check if candidate has completed general information setup."""
    return {
        "is_general_info_complete": candidate.is_general_info_complete,
        "has_required_fields": bool(candidate.name and candidate.email and candidate.phone),
        "candidate_id": candidate.id
    }
```

---

## Frontend Changes

### 1. Routing (`react-frontend/src/App.tsx`)

Added two new routes for candidates:
```tsx
import GeneralInfoPage from './pages/GeneralInfoPage.tsx';
import EditGeneralInfoPage from './pages/EditGeneralInfoPage.tsx';

// Routes
<Route path="/general-info" element={<ProtectedRoute element={<GeneralInfoPage />} requiredUserType="candidate" />} />
<Route path="/edit-general-info" element={<ProtectedRoute element={<EditGeneralInfoPage />} requiredUserType="candidate" />} />
```

### 2. Sign-In Redirect Logic (`react-frontend/src/pages/SignInPage.tsx`)

Modified to check if user has completed general info:
```tsx
if (response.data.user_type === 'candidate') {
  // Check if candidate has completed general info
  const statusRes = await candidateAPI.getMe();
  if (statusRes.data?.is_general_info_complete) {
    navigate('/candidate-dashboard');  // Existing user
  } else {
    navigate('/general-info');  // New user
  }
}
```

**Flow:**
- **New User (first login):** `/signin` → `/general-info` (welcome screen) → `/edit-general-info` (form)
- **Existing User:** `/signin` → `/candidate-dashboard` (skips general info)

### 3. General Info Page (`react-frontend/src/pages/GeneralInfoPage.tsx`)

**Two states:**

#### For New Users (is_general_info_complete = false):
- Shows welcome message
- Button: "Setup General Information" → navigates to edit page

#### For Existing Users (is_general_info_complete = true):
- Shows dashboard card with saved information
- Displays: Name, Email, Phone, Residential Address, Location
- Button: "✎ Edit Details" → navigates to edit page
- Button: "Continue to Profile Dashboard →" → navigates to main dashboard

### 4. Edit General Info Page (`react-frontend/src/pages/EditGeneralInfoPage.tsx`)

**Features:**
- Form with all 5 fields
- Required fields marked with *: Name, Email, Phone
- Optional fields: Residential Address, Location
- Validation before save
- On save:
  - Updates profile data
  - Sets `is_general_info_complete = true`
  - Shows success alert
  - New users → navigate to `/candidate-dashboard`
  - Existing users → navigate back to `/general-info`

### 5. Candidate Dashboard Menu (`react-frontend/src/pages/CandidateDashboard.tsx`)

Added new tab for quick access:
```tsx
<button className={`tab ${activeTab === 'general-info' ? 'active' : ''}`} 
        onClick={() => setActiveTab('general-info')}>
  General Information
</button>
```

**Tab Content:**
- Shows same dashboard view as GeneralInfoPage
- Edit button opens edit form
- Allows users to view/update their general information anytime

---

## User Flows

### New User Flow
1. **Sign Up** → Create account
2. **Sign In** → Credentials verified
3. **General Info Page** → Shows welcome message
4. **Setup Button** → Navigate to edit form
5. **Fill Form** → Enter name, email, phone, address, location
6. **Save** → `is_general_info_complete` = true
7. **Auto-redirect** → `/candidate-dashboard`

### Existing User Flow
1. **Sign In** → Credentials verified
2. **Check Status** → API call to check `is_general_info_complete`
3. **Auto-redirect** → `/candidate-dashboard` (skip general info)
4. **View Info** → Click "General Information" tab in dashboard
5. **Edit** → Can update information anytime

### Edit from Dashboard
1. **In Candidate Dashboard** → Click "General Information" tab
2. **Edit Button** → Navigate to `/edit-general-info`
3. **Update Form** → Change any field
4. **Save** → Save changes
5. **Return** → Back to General Info view in dashboard

---

## Database Migration Note

When deploying, the SQLite database will be recreated with:
- New columns: `email`, `phone`, `residential_address`, `is_general_info_complete`
- Existing candidates will have default values:
  - `email = NULL`
  - `phone = NULL`
  - `residential_address = NULL`
  - `is_general_info_complete = False`

To initialize existing candidates as "complete", run:
```sql
UPDATE candidate SET is_general_info_complete = true WHERE id > 0;
```

Or set only those with all fields filled:
```sql
UPDATE candidate 
SET is_general_info_complete = true 
WHERE email IS NOT NULL AND phone IS NOT NULL;
```

---

## Files Modified

### Backend
- `backend/app/models.py` - Added fields to Candidate model
- `backend/app/schemas.py` - Updated CandidateBase, CandidateRead, CandidateProfileUpdate
- `backend/app/routers/candidates.py` - Added `/me/general-info-status` endpoint

### Frontend
- `react-frontend/src/App.tsx` - Added routes and imports
- `react-frontend/src/pages/SignInPage.tsx` - Added redirect logic
- `react-frontend/src/pages/GeneralInfoPage.tsx` - Updated component
- `react-frontend/src/pages/EditGeneralInfoPage.tsx` - Updated component
- `react-frontend/src/pages/CandidateDashboard.tsx` - Added menu tab and content section

---

## Testing Checklist

### Backend
- [ ] Model migration creates new columns
- [ ] `is_general_info_complete` defaults to False
- [ ] Update endpoint sets flag to True on save
- [ ] GET /candidates/me returns all fields correctly
- [ ] GET /candidates/me/general-info-status works

### Frontend
- [ ] New user sign-in redirects to `/general-info`
- [ ] Existing user sign-in redirects to `/candidate-dashboard`
- [ ] New user welcome message displays
- [ ] Form saves all 5 fields correctly
- [ ] Edit button navigates to form
- [ ] Existing user dashboard shows saved data
- [ ] General Information tab in dashboard shows correct data
- [ ] Edit from dashboard works
- [ ] Logout and re-login skips general info for existing users

---

## Future Enhancements

- [ ] Profile picture upload in general info
- [ ] LinkedIn/social profile links
- [ ] Preferred contact method selection
- [ ] Language preferences
- [ ] Timezone information
- [ ] Availability calendar integration
