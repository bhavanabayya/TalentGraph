# General Information Section - Visual Guide

## User Journey Maps

### 🆕 NEW USER JOURNEY

```
┌─────────────────────────────────────────────────────────────────┐
│                         SIGN UP PAGE                             │
│  Email: john@example.com                                        │
│  Password: ••••••••                                             │
│  Type: Candidate                                                 │
│  [Sign Up Button]                                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓ Account created, is_general_info_complete = false
┌─────────────────────────────────────────────────────────────────┐
│                         SIGN IN PAGE                              │
│  Email: john@example.com                                        │
│  Password: ••••••••                                             │
│  [Sign In Button]                                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓ Check is_general_info_complete status
┌─────────────────────────────────────────────────────────────────┐
│               GENERAL INFO PAGE (Welcome View)                    │
│                                                                   │
│      ┌──────────────────────────────────────┐                   │
│      │  Welcome to Your Profile!            │                   │
│      │                                      │                   │
│      │  Let's start by setting up your     │                   │
│      │  general information. This will     │                   │
│      │  help us create your professional  │                   │
│      │  profile.                           │                   │
│      │                                      │                   │
│      │  [Setup General Information Button] │                   │
│      └──────────────────────────────────────┘                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓ User clicks "Setup General Information"
┌─────────────────────────────────────────────────────────────────┐
│              EDIT GENERAL INFO PAGE (Form)                        │
│                                                                   │
│  Full Name *              [_____________________]                │
│  Email Address *          [_____________________]                │
│  Phone Number *           [_____________________]                │
│  Residential Address      [_____________________]                │
│  Current Location         [_____________________]                │
│                                                                   │
│  [Save Information] [Cancel]                                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓ All 3 required fields filled & saved
              is_general_info_complete = true
┌─────────────────────────────────────────────────────────────────┐
│                  CANDIDATE DASHBOARD                              │
│  ┌─ General Information ─┬─ Profile ─┬─ Skills ─┬─ ...        │
│  │  General Information  │           │          │              │
│  │  ┌──────────────────────────────────────┐     │              │
│  │  │ Full Name: John Doe                  │     │              │
│  │  │ Email: john@email.com                │     │              │
│  │  │ Phone: (555) 123-4567                │     │              │
│  │  │ Address: 123 Main St, SF CA          │     │              │
│  │  │ Location: San Francisco              │     │              │
│  │  │              [✎ Edit Details]        │     │              │
│  │  └──────────────────────────────────────┘     │              │
│  └─────────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

### 👤 EXISTING USER JOURNEY

```
┌─────────────────────────────────────────────────────────────────┐
│                         SIGN IN PAGE                              │
│  Email: jane@example.com                                        │
│  Password: ••••••••                                             │
│  [Sign In Button]                                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓ Check is_general_info_complete status = true
┌─────────────────────────────────────────────────────────────────┐
│                  CANDIDATE DASHBOARD                              │
│  ┌─ General Information ─┬─ Profile ─┬─ Skills ─┬─ ...        │
│  │  Profile Dashboard    │           │          │              │
│  │  (Main Profile section, skills, etc.)        │              │
│  └─────────────────────────────────────────────────┘              │
└────────────────────┬────────────────────────────────────────────┘
                     │
      ┌──────────────┴──────────────┐
      ↓                             ↓
   Click "General            Click "Edit"
   Information" Tab             Button
      │                             │
      ↓                             ↓
┌──────────────────────┐    ┌──────────────────────┐
│  General Info View   │    │  Edit Form           │
│  ┌────────────────┐  │    │  ┌────────────────┐  │
│  │ Full Name: ...│  │    │  │ Full Name: ...│  │
│  │ Email: ...   │  │    │  │ Email: ...   │  │
│  │ Phone: ...   │  │    │  │ Phone: ...   │  │
│  │ Address: ... │  │    │  │ Address: ... │  │
│  │ Location: ...│  │    │  │ Location: ...│  │
│  │              │  │    │  │              │  │
│  │[Edit Details]│  │    │  │[Save] [Cancel]   │
│  └────────────────┘  │    │  └────────────────┘  │
└──────────────────────┘    └──────────────────────┘
```

---

## Component Structure

### GeneralInfoPage.tsx
```
┌─ GeneralInfoPage
│  ├─ Header: "General Information" + Logout button
│  ├─ Content (conditional rendering based on is_general_info_complete):
│  │  ├─ NEW USER VIEW:
│  │  │  └─ Welcome Card
│  │  │     ├─ Heading
│  │  │     ├─ Description
│  │  │     └─ "Setup General Information" Button
│  │  │
│  │  └─ EXISTING USER VIEW:
│  │     └─ Dashboard Card
│  │        ├─ Title + "Edit Details" Button
│  │        ├─ Info Grid (2 columns)
│  │        │  ├─ Full Name
│  │        │  ├─ Email Address
│  │        │  ├─ Phone Number
│  │        │  ├─ Current Location
│  │        │  └─ Residential Address (full width)
│  │        └─ "Continue to Profile Dashboard" Button
│  │
│  └─ States:
│     ├─ loading: Shows loading message
│     ├─ error: Shows error alert
│     └─ profile: Profile data from API
```

### EditGeneralInfoPage.tsx
```
┌─ EditGeneralInfoPage
│  ├─ Header: "Edit General Information" + Logout button
│  ├─ Form:
│  │  ├─ Full Name * (required)
│  │  │  └─ Text input
│  │  ├─ Email Address * (required)
│  │  │  └─ Email input
│  │  ├─ Phone Number * (required)
│  │  │  └─ Tel input
│  │  ├─ Residential Address (optional)
│  │  │  └─ Textarea (3 rows)
│  │  ├─ Current Location (optional)
│  │  │  └─ Text input
│  │  │
│  │  └─ Buttons:
│  │     ├─ [Save Information] - Primary (flex: 1)
│  │     └─ [Cancel] - Secondary (flex: 1)
│  │
│  └─ Validation:
│     ├─ name: required, trimmed
│     ├─ email: required, trimmed
│     ├─ phone: required, trimmed
│     ├─ residential_address: optional, trimmed
│     └─ location: optional, trimmed
```

### CandidateDashboard.tsx - General Info Tab
```
┌─ CandidateDashboard
│  ├─ Header: "Candidate Dashboard" + Logout
│  ├─ Navigation Tabs:
│  │  ├─ [General Information] ← NEW TAB
│  │  ├─ [Profile Dashboard]
│  │  ├─ [Certifications]
│  │  ├─ [Resumes]
│  │  ├─ [Applications]
│  │  └─ [Available Jobs]
│  │
│  └─ Content (when activeTab === 'general-info'):
│     └─ Same as GeneralInfoPage existing user view
```

---

## Form Validation Rules

### Required Fields (marked with *)
```
✓ Full Name
  - Cannot be empty
  - Trimmed before save
  - Min length: 1 character
  
✓ Email Address
  - Cannot be empty
  - Must be valid email format
  - Trimmed before save
  
✓ Phone Number
  - Cannot be empty
  - Trimmed before save
  - No format validation (accepts any format)
```

### Optional Fields
```
○ Residential Address
  - Optional
  - Trimmed before save
  - Supports multiline text
  - Max length: No limit
  
○ Current Location
  - Optional
  - Trimmed before save
  - Examples: "San Francisco, CA" or "London, UK"
```

---

## Data Flow

### On User Sign-Up
```
1. User creates account
2. Candidate profile created with:
   - name: (from email prefix)
   - email: null
   - phone: null
   - residential_address: null
   - location: null
   - is_general_info_complete: false ← Key flag
```

### On Sign-In
```
1. User signs in with email/password
2. Frontend calls: GET /candidates/me
3. Check response.data.is_general_info_complete
4. If false  → Redirect to /general-info
5. If true   → Redirect to /candidate-dashboard
```

### On Form Submit
```
1. User fills form and clicks "Save Information"
2. Frontend validates all required fields
3. Frontend calls: PUT /candidates/me
4. Request body includes:
   {
     name: "John Doe",
     email: "john@example.com",
     phone: "(555) 123-4567",
     residential_address: "123 Main St, SF CA",
     location: "San Francisco",
     is_general_info_complete: true ← Set to true
   }
5. Backend updates candidate record
6. Response includes updated is_general_info_complete: true
7. Frontend shows success message
8. Frontend redirects:
   - New users (first save) → /candidate-dashboard
   - Existing users (editing) → /general-info
```

---

## Styling Details

### Color Scheme
```
Primary Blue:     #4a9eff
Dark Blue:        #0056b3
Light Gray BG:    rgba(74, 158, 255, 0.1)
Border Blue:      #4a9eff
Text Primary:     #333
Text Secondary:   #666
Text Tertiary:    #999
```

### Cards & Containers
```
Background:       white
Padding:         30px (containers), 24px (cards)
Border Radius:   8px
Box Shadow:      0 2px 8px rgba(0, 0, 0, 0.1)
Grid (for data): 2 columns (1fr 1fr) on desktop
                 1 column on mobile
Grid Gap:        20px
```

### Typography
```
Labels (uppercase):
  - Font Size:  12px
  - Font Weight: 500
  - Text Transform: uppercase
  - Color: #999

Values:
  - Name: 18px, weight 600, color #333
  - Other: 16px, weight 500, color #333
```

---

## State Management

### Component States

```jsx
useState Variables:
├─ profile: any - Current profile data from API
├─ loading: boolean - Loading indicator
├─ error: string - Error message
├─ saving: boolean - Save in progress
├─ isGeneralInfoComplete: boolean - Completion status
└─ formData: object
   ├─ name: string
   ├─ email: string
   ├─ phone: string
   ├─ residential_address: string
   └─ location: string
```

### Data Fetch Sequence

```
1. Component mount → useEffect → fetchProfile()
2. Call: GET /candidates/me
3. Set profile state
4. Check: is_general_info_complete
5. Show appropriate UI
```

---

## Button Actions

### GeneralInfoPage (New User)
- **Setup General Information** 
  - onClick → navigate('/edit-general-info')

### GeneralInfoPage (Existing User)
- **✎ Edit Details**
  - onClick → navigate('/edit-general-info')
- **Continue to Profile Dashboard →**
  - onClick → navigate('/candidate-dashboard')

### EditGeneralInfoPage
- **Save Information**
  - onClick → Validate → API PUT → Success message → Navigate
- **Cancel**
  - onClick → navigate('/general-info')

### CandidateDashboard Tab
- **Tab Selection**
  - onClick → setActiveTab('general-info')
- **Edit Details** (in tab content)
  - onClick → navigate('/edit-general-info')

---

## Error Handling

### Validation Errors
```
❌ "Please enter your full name"
❌ "Please enter your email address"
❌ "Please fill in all required fields (Name, Email, Phone)"

Display: Inline alert box (color: #cc0000)
```

### API Errors
```
❌ "Failed to load profile"
❌ "Failed to save information"

Display: Alert box with detailed backend message
Action: User can retry or cancel
```

---

## Responsive Behavior

### Desktop (≥992px)
```
Layout: 2-column grid
Width: maxWidth 800px, margin auto
Gaps: 20px
```

### Tablet/Mobile (<992px)
```
Layout: 1-column grid
Width: Full with padding
Gaps: 16px
Font: Slightly reduced
```

---

## Testing Scenarios

### Scenario 1: Brand New User
```
✓ Sign up with email/password
✓ Redirected to /general-info
✓ See welcome message
✓ Click "Setup General Information"
✓ Redirected to /edit-general-info
✓ Form is empty
✓ Fill all required fields
✓ Click "Save Information"
✓ Success alert shown
✓ Redirected to /candidate-dashboard
✓ Sign out and sign back in
✓ Directly go to /candidate-dashboard (skip general info)
```

### Scenario 2: Existing User with Data
```
✓ Sign in
✓ Directly redirected to /candidate-dashboard
✓ Click "General Information" tab
✓ See saved data displayed
✓ Click "Edit Details"
✓ Form populated with existing data
✓ Modify a field
✓ Click "Save Information"
✓ Success alert shown
✓ Back to General Info view
✓ Data updated correctly
```

### Scenario 3: Incomplete Data
```
✓ Leave "Full Name" empty
✓ Try to save
✓ Error message shown
✓ Can't save until all required fields filled
```

---

## Integration Points

### With Authentication System
```
- Uses: useAuth() hook
- login() function called in SignInPage
- logout() function available in all pages
- Protected routes: /general-info, /edit-general-info
```

### With API Client
```
- Uses: candidateAPI from '../api/client'
- Methods:
  - getMe() - GET /candidates/me
  - updateMe(data) - PUT /candidates/me
  - getMe/general-info-status - GET /candidates/me/general-info-status
```

### With Navigation
```
- Uses: useNavigate() hook from react-router-dom
- Routes:
  - /general-info
  - /edit-general-info
  - /candidate-dashboard
```
