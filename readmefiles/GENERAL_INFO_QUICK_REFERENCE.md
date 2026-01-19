# General Information Section - Quick Reference

## 🚀 What Was Built

A new **General Information** section that handles the onboarding of new candidates and provides a central place for them to manage their basic profile information.

**Key Features:**
- ✅ Automatic redirect based on user status (new vs. existing)
- ✅ Welcome page for new users
- ✅ Edit form with validation
- ✅ Dashboard view of saved information
- ✅ Accessible from main candidate dashboard
- ✅ Stores: Name, Email, Phone, Address, Location

---

## 📊 Data Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Full name |
| `email` | String | Yes | Contact email address |
| `phone` | String | Yes | Phone number |
| `residential_address` | String | No | Full residential address |
| `location` | String | No | City/location (e.g., "San Francisco, CA") |
| `is_general_info_complete` | Boolean | N/A | Flag: true = setup complete, false = pending |

---

## 🔄 User Flow Summary

### New User Journey
```
Sign In → Check Status (is_general_info_complete = false)
  ↓
General Info Page (Welcome view)
  ↓
Edit Form (setup)
  ↓
Save (sets is_general_info_complete = true)
  ↓
Auto-redirect to Dashboard
```

### Existing User Journey
```
Sign In → Check Status (is_general_info_complete = true)
  ↓
Auto-redirect to Dashboard (skip general info)
  ↓
Can still access "General Information" tab anytime
```

---

## 📁 Files Changed

### Backend (3 files)
1. **models.py** - Added 5 fields to Candidate model
2. **schemas.py** - Updated request/response models
3. **routers/candidates.py** - Added status check endpoint

### Frontend (5 files)
1. **App.tsx** - Added 2 routes
2. **SignInPage.tsx** - Added redirect logic
3. **GeneralInfoPage.tsx** - Updated component
4. **EditGeneralInfoPage.tsx** - Updated component
5. **CandidateDashboard.tsx** - Added menu tab

---

## 🔌 API Endpoints

### Get Profile (existing)
```
GET /candidates/me
Response includes:
  - is_general_info_complete: boolean
  - email: string | null
  - phone: string | null
  - residential_address: string | null
  - location: string | null
```

### Update Profile (modified)
```
PUT /candidates/me
Request body:
  {
    name: string,
    email: string,
    phone: string,
    residential_address: string,
    location: string,
    is_general_info_complete: boolean  ← NEW
  }
```

### Check Status (new)
```
GET /candidates/me/general-info-status
Response:
  {
    is_general_info_complete: boolean,
    has_required_fields: boolean,
    candidate_id: int
  }
```

---

## 🎯 Routes

### Protected Candidate Routes (New)
| Path | Component | Purpose |
|------|-----------|---------|
| `/general-info` | GeneralInfoPage | View general info / welcome screen |
| `/edit-general-info` | EditGeneralInfoPage | Edit general information form |

### Existing Routes (Modified)
| Path | Changes |
|------|---------|
| `/signin` | Added check for is_general_info_complete to decide redirect |
| `/candidate-dashboard` | Added "General Information" tab in menu |

---

## 🎨 UI Components

### GeneralInfoPage
**Two Views (conditional):**

**New User View:**
- Heading: "Welcome to Your Profile!"
- Description text
- Button: "Setup General Information"

**Existing User View:**
- Heading: "General Information"
- Edit button (top right)
- Data card with 2-column grid:
  - Full Name
  - Email Address
  - Phone Number
  - Current Location
  - Residential Address (full width)
- Continue button

### EditGeneralInfoPage
**Form Fields:**
```
- Full Name *                [text input]
- Email Address *            [email input]
- Phone Number *             [tel input]
- Residential Address        [textarea 3 rows]
- Current Location           [text input]

Buttons: [Save Information] [Cancel]
```

### CandidateDashboard
**New Tab:**
- "General Information" - First tab in menu
- Same content as GeneralInfoPage existing user view
- Full access to edit function

---

## ✅ Form Validation

**Required Fields:**
- ✓ Name (cannot be empty)
- ✓ Email (cannot be empty, valid format)
- ✓ Phone (cannot be empty)

**Optional Fields:**
- ○ Residential Address (any content allowed)
- ○ Location (any content allowed)

**Error Messages:**
```
"Please enter your full name"
"Please enter your email address"
"Please fill in all required fields (Name, Email, Phone)"
```

---

## 🔐 Access Control

### Who Can Access?
- ✅ Authenticated candidates only
- ✅ Protected by `require_candidate` dependency on backend
- ✅ Protected by `ProtectedRoute` component on frontend

### What Can They Do?
1. **View** general information (if completed)
2. **Edit** general information anytime
3. **Access** from two places:
   - Dedicated `/general-info` page
   - Dashboard "General Information" tab

---

## 🎯 Key Business Logic

### On First Sign-In
```python
# Backend creates candidate with:
is_general_info_complete = False

# Frontend checks this flag
if is_general_info_complete == False:
    redirect to /general-info
```

### After Form Submission
```python
# Form validates all required fields
# Backend saves and sets:
is_general_info_complete = True

# Frontend redirects to dashboard
navigate('/candidate-dashboard')
```

### On Subsequent Sign-Ins
```python
# Backend flag is already True
is_general_info_complete = True

# Frontend skips directly to dashboard
navigate('/candidate-dashboard')
```

---

## 🔌 Integration Checklist

- [x] Backend model updated
- [x] Schemas updated
- [x] API endpoint added
- [x] Routes created
- [x] Sign-in logic updated
- [x] Components created/updated
- [x] Dashboard menu updated
- [x] Validation implemented
- [x] Error handling implemented
- [x] Responsive design implemented

---

## 🧪 Testing Quick Checklist

### Backend
- [ ] Database migration works
- [ ] New columns exist
- [ ] Default values correct
- [ ] PUT endpoint saves all fields
- [ ] is_general_info_complete flag works
- [ ] GET endpoint returns updated fields

### Frontend - New User
- [ ] Sign-in redirects to /general-info
- [ ] Welcome message displays
- [ ] Form page loads
- [ ] Form validation works
- [ ] Save button submits correctly
- [ ] Auto-redirect to dashboard after save
- [ ] Sign out and sign back in skips general-info

### Frontend - Existing User
- [ ] Sign-in goes straight to dashboard
- [ ] General Information tab shows
- [ ] Data displays correctly
- [ ] Edit button opens form
- [ ] Can edit all fields
- [ ] Save button works
- [ ] Returns to view after edit

---

## 🐛 Troubleshooting

### User stuck on General Info page
**Cause:** is_general_info_complete not being set to true
**Solution:** Check that form submission includes `is_general_info_complete: true`

### Form not saving
**Cause:** Validation error
**Solution:** Check console for error message, ensure all 3 required fields filled

### Always redirects to general-info
**Cause:** is_general_info_complete always false
**Solution:** Check if database migration ran, check if update endpoint works

### Form fields empty when editing
**Cause:** getMe() API not returning current values
**Solution:** Verify API response includes all fields

---

## 📝 Code Examples

### Using the API (TypeScript)
```typescript
import { candidateAPI } from '../api/client';

// Get profile (includes general info)
const response = await candidateAPI.getMe();
const { name, email, phone, location, residential_address, is_general_info_complete } = response.data;

// Update profile
await candidateAPI.updateMe({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '(555) 123-4567',
  residential_address: '123 Main St, SF CA',
  location: 'San Francisco',
  is_general_info_complete: true
});
```

### Checking Status
```typescript
// In SignInPage after successful login
const statusRes = await candidateAPI.getMe();
if (statusRes.data?.is_general_info_complete) {
  navigate('/candidate-dashboard');
} else {
  navigate('/general-info');
}
```

---

## 🎓 Training Notes

**For New Candidates:**
1. Sign up with email
2. On first sign-in, see "Welcome to Your Profile"
3. Click "Setup General Information"
4. Fill out the form with your details
5. Click "Save Information"
6. Auto-redirect to main dashboard
7. Can always edit information from the "General Information" tab

**For Returning Candidates:**
1. Sign in normally
2. Automatically go to dashboard (general info setup skipped)
3. Click "General Information" tab to view/edit saved information
4. Make any updates and save

---

## 📊 Database Schema

### Candidate Table Changes
```sql
ALTER TABLE candidate ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULLABLE;
ALTER TABLE candidate ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULLABLE;
ALTER TABLE candidate ADD COLUMN IF NOT EXISTS residential_address TEXT NULLABLE;
ALTER TABLE candidate ADD COLUMN IF NOT EXISTS is_general_info_complete BOOLEAN DEFAULT FALSE;
```

### Notes
- `email` is separate from User.email (user's login email)
- `phone` accepts any format (no validation)
- `residential_address` supports multiline text
- `is_general_info_complete` is false by default (for existing records)

---

## 📞 Support

**Common Questions:**

Q: Why is `is_general_info_complete` needed?
A: To distinguish between new users (need to complete setup) and returning users (skip to dashboard)

Q: Why separate `email` from the User table?
A: User.email is for login credentials; Candidate.email is for contact preferences (may differ)

Q: Can users skip this section?
A: No - new users must complete it before accessing dashboard. They can edit it anytime.

Q: Is this data required for job matching?
A: No - it's basic contact information. Job matching uses profile, skills, and preferences.

Q: Can existing users who haven't filled general info still use the system?
A: Yes - the system works with or without general info. But sign-in will redirect them to complete it.

---

## 🔄 Future Enhancements

Potential additions:
- [ ] Photo/avatar upload in general info
- [ ] Social media links
- [ ] Preferred contact method selection
- [ ] Language preferences
- [ ] Timezone information
- [ ] Availability status
- [ ] Resume linking from this section
- [ ] Email verification for contact email
