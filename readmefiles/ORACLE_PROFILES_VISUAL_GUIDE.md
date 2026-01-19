# 🎯 Oracle Profiles - Visual Implementation Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Profile Dashboard (/profile-dashboard)                         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ [Basic Info] [Statistics]                               │  │
│  │                                                         │  │
│  │ Profile 1: Senior Fusion Role                           │  │
│  │ ┌─────────────────────────────────────────────────────┐ │  │
│  │ │ Roles: Functional Consultant, Architect             │ │  │
│  │ │ Experience: 8-15 years | Rate: $150-200/hr         │ │  │
│  │ │ [✎ Edit] [🗑 Delete] ← NEW!                         │ │  │
│  │ └─────────────────────────────────────────────────────┘ │  │
│  │                                                         │  │
│  │ Profile 2: EBS Implementation                           │  │
│  │ ┌─────────────────────────────────────────────────────┐ │  │
│  │ │ Roles: Technical Consultant, Developer              │ │  │
│  │ │ Experience: 5-10 years | Rate: $100-150/hr         │ │  │
│  │ │ [✎ Edit] [🗑 Delete] ← NEW!                         │ │  │
│  │ └─────────────────────────────────────────────────────┘ │  │
│  │                                                         │  │
│  │ [+ New Profile] ← Go to edit page for creation          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            ↓ Edit/Create                       │
│                                                                 │
│  Job Preferences Page (/job-preferences)                        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ FORM (appears when creating or editing):                │  │
│  │                                                         │  │
│  │ Oracle Product: [Oracle Fusion ▼]                      │  │
│  │              (no "Select Vendor" step!) ← SIMPLIFIED!  │  │
│  │                                                         │  │
│  │ Roles: ☑ Functional Consultant                         │  │
│  │        ☑ Architect                                     │  │
│  │        ☐ Technical Consultant                          │  │
│  │                                                         │  │
│  │ Profile Name: [Senior Oracle Fusion Consultant]        │  │
│  │ Experience: [8] - [15] years                           │  │
│  │ Seniority: [Senior ▼]                                  │  │
│  │ Hourly Rate: $[150] - $[200] /hr                       │  │
│  │ Work Type: [Hybrid ▼]                                  │  │
│  │ Locations: [Add: NYC] [Boston] [Remove ×]              │  │
│  │ Skills: [Add: SQL] [Java] [Remove ×]                   │  │
│  │ Availability: [2 weeks ▼]                              │  │
│  │                                                         │  │
│  │ [Save Profile] or [Update Profile]                     │  │
│  │       ↓ On Save                                        │  │
│  │ ✅ Profile created/updated successfully                │  │
│  │       ↓ Navigation                                     │  │
│  │ Back to Profile Dashboard                              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Create New Profile:
```
┌──────────────┐
│   Dashboard  │
└──────┬───────┘
       │ [+ New Profile]
       ↓
┌──────────────────────┐
│ /job-preferences     │
│ ?new=true            │
└──────┬───────────────┘
       │ useEffect detects ?new
       │ setShowForm(true)
       ↓
┌──────────────────────┐
│   Show Form          │
│   (all fields empty) │
└──────┬───────────────┘
       │ User fills form
       │ Selects Oracle product
       │ Chooses roles, rate, etc.
       ↓
┌──────────────────────┐
│  [Save Profile]      │
└──────┬───────────────┘
       │ POST /preferences/create
       │ {product_id, roles, ...}
       ↓
┌──────────────────────┐
│  Backend saves       │
│  Returns ID: 123     │
└──────┬───────────────┘
       │
       ├─ setSuccessMessage('Profile created successfully')
       ├─ resetForm()
       ├─ setShowForm(false)
       ├─ navigate('/profile-dashboard')
       └─ setTimeout(() => clearMessage, 3000)
       ↓
┌──────────────────────┐
│   ✅ Dashboard       │
│  Shows new profile   │
│ Profile 1 (new!)    │
│ [✎ Edit] [🗑 Delete]│
└──────────────────────┘
```

### Edit Existing Profile:
```
┌──────────────────────┐
│   Dashboard          │
│ Profile 2            │
│ [✎ Edit] [🗑 Delete] │
└──────┬───────────────┘
       │ [✎ Edit] clicked
       │ handleEditPreference(2)
       ↓
┌──────────────────────────────┐
│ navigate(                    │
│ '/job-preferences?edit=2')   │
└──────┬───────────────────────┘
       ↓
┌──────────────────────────────┐
│ /job-preferences            │
│ useEffect detects ?edit=2   │
│ Finds profile 2 in list     │
│ handleEdit(profile2)        │
└──────┬───────────────────────┘
       │ setFormData(profile2 data)
       │ setEditingId(2)
       │ setShowForm(true)
       ↓
┌──────────────────────────────┐
│   Show Form                  │
│   (pre-filled with          │
│    existing values)          │
│ Product: Oracle EBS         │
│ Roles: ☑ Technical ☑ Dev    │
│ Rate: $100-150              │
│ etc. (all populated!)        │
└──────┬───────────────────────┘
       │ User modifies fields
       │ (e.g., rate to $120-160)
       ↓
┌──────────────────────────────┐
│  [Update Profile]            │
└──────┬───────────────────────┘
       │ PUT /preferences/2
       │ {product_id, roles, ...}
       ↓
┌──────────────────────────────┐
│  Backend updates             │
│  Returns updated: 2          │
└──────┬───────────────────────┘
       │
       ├─ setSuccessMessage('Profile updated successfully')
       ├─ resetForm()
       ├─ setShowForm(false)
       ├─ navigate('/profile-dashboard')
       └─ setTimeout(() => clearMessage, 3000)
       ↓
┌──────────────────────────────┐
│   ✅ Dashboard               │
│  Profile 2 updated!          │
│  Rate now: $120-160/hr      │
│  [✎ Edit] [🗑 Delete]        │
└──────────────────────────────┘
```

### Delete Profile:
```
┌──────────────────────┐
│   Dashboard          │
│ Profile 3            │
│ [✎ Edit] [🗑 Delete] │
└──────┬───────────────┘
       │ [🗑 Delete] clicked
       │ setDeleteConfirm(3)
       ↓
┌──────────────────────────────────┐
│ ⚠️ Delete Confirmation Appears   │
│                                  │
│ Are you sure you want to         │
│ delete this profile?              │
│                                  │
│ [Yes, Delete] [Cancel]           │
└──────┬─────────────────┬─────────┘
       │                 │
   YES │                 │ CANCEL
       ↓                 ↓
┌──────────────┐   ┌──────────────┐
│ handleDelete │   │ setDeleteConf│
│ (3)          │   │ irm(null)    │
└──────┬───────┘   └──────┬───────┘
       │                  │
       │                  └─→ [Confirmation closes]
       │                      [Profile stays]
       │
       ↓
┌──────────────────────┐
│ DELETE /preferences/3│
└──────┬───────────────┘
       │
       ├─ setSuccessMessage('Profile deleted')
       ├─ setDeleteConfirm(null)
       ├─ fetchProfile()
       └─ setTimeout(() => clearMessage, 3000)
       ↓
┌──────────────────────┐
│   ✅ Dashboard       │
│                      │
│ Profile 3 GONE!      │
│                      │
│ Profile 1            │
│ [✎ Edit] [🗑 Delete] │
│                      │
│ Profile 2            │
│ [✎ Edit] [🗑 Delete] │
│                      │
│ [+ New Profile]      │
└──────────────────────┘
```

---

## Component Interaction Map

```
┌──────────────────────────────────────────────────────────────┐
│                    React Context & State                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  authStore (useAuth hook)                                   │
│  ├─ isAuthenticated: boolean                                │
│  ├─ userType: 'candidate' | 'company'                       │
│  ├─ candidateId: number                                     │
│  └─ accessToken: string                                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                            ↓
                      (shared across pages)
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                   ProfileDashboard.tsx                       │
├──────────────────────────────────────────────────────────────┤
│ State:                                                       │
│  ├─ profile: CandidateProfileWithPreferences                │
│  ├─ loading: boolean                                        │
│  ├─ error: string                                           │
│  ├─ successMessage: string                                  │
│  └─ deleteConfirm: number | null                            │
│                                                              │
│ Functions:                                                  │
│  ├─ fetchProfile() → GET /preferences/my-profile            │
│  ├─ handleEditPreference(id) → navigate ?edit=id            │
│  ├─ handleDeletePreference(id) → DELETE /preferences/id     │
│  └─ handleCreateNew() → navigate ?new=true                  │
│                                                              │
│ Renders:                                                    │
│  ├─ Profile info (name, location, etc.)                    │
│  ├─ List of job_preferences                                │
│  │  └─ Each with [✎ Edit] [🗑 Delete] buttons              │
│  ├─ Delete confirmation (modal)                            │
│  └─ Success/error messages                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
    ↓ navigate('/job-preferences?edit=3')
    ↓ navigate('/job-preferences?new=true')
    ↓
┌──────────────────────────────────────────────────────────────┐
│              JobPreferencesPage.tsx                          │
├──────────────────────────────────────────────────────────────┤
│ Props: (from URL)                                           │
│  └─ searchParams: URLSearchParams                           │
│     ├─ edit=123 (if editing)                               │
│     └─ new=true (if creating)                              │
│                                                              │
│ State:                                                      │
│  ├─ preferences: JobPreference[]                            │
│  ├─ ontology: {products, roles, skills, oracleAuthorId}   │
│  ├─ loading: boolean                                        │
│  ├─ showForm: boolean                                       │
│  ├─ editingId: number | null                               │
│  ├─ formData: JobPreference                                 │
│  ├─ selectedSkill: string                                   │
│  └─ selectedLocation: string                                │
│                                                              │
│ Functions:                                                  │
│  ├─ fetchData()                                            │
│  │   ├─ GET /preferences/my-preferences                    │
│  │   └─ GET /job-roles/authors/Oracle/products             │
│  ├─ handleProductChange(productId)                          │
│  │   └─ Fetch roles for that product                       │
│  ├─ handleRoleToggle(roleId)                               │
│  ├─ handleAddSkill()                                        │
│  ├─ handleRemoveSkill()                                     │
│  ├─ handleAddLocation()                                     │
│  ├─ handleRemoveLocation()                                  │
│  ├─ handleSubmit(e)                                         │
│  │   ├─ POST /preferences/create (if new)                  │
│  │   ├─ PUT /preferences/{id} (if editing)                 │
│  │   └─ navigate('/profile-dashboard')                      │
│  ├─ handleEdit(pref)                                        │
│  ├─ handleDelete(id)                                        │
│  │   └─ DELETE /preferences/{id}                           │
│  └─ resetForm()                                             │
│                                                              │
│ Lifecycle:                                                  │
│  1. fetchData() runs on mount                              │
│  2. useEffect watches searchParams                         │
│  3. If ?edit=id → handleEdit() pre-fills form              │
│  4. If ?new=true → setShowForm(true)                       │
│                                                              │
│ Renders:                                                    │
│  ├─ Page header with title                                 │
│  ├─ Form (if showForm=true) with fields                    │
│  │   └─ Oracle product dropdown (no vendor!)               │
│  ├─ Preferences list with cards                            │
│  │   └─ Each with [✎ Edit] [🗑 Delete] buttons            │
│  └─ Success/error messages                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
    ↓ (after save/delete)
    ↓ navigate('/profile-dashboard')
    ↓
Back to ProfileDashboard, which refetches updated data
```

---

## API Call Sequence

### Create Flow:
```
1. POST /preferences/create
   Request: {
     product_author_id: 1,
     product_id: 2,
     roles: ["Functional Consultant"],
     seniority_level: "Senior",
     years_experience_min: 8,
     years_experience_max: 15,
     hourly_rate_min: 150,
     hourly_rate_max: 200,
     required_skills: ["Oracle Fusion", "SQL"],
     work_type: "Hybrid",
     location_preferences: ["NYC", "Boston"],
     availability: "2 weeks",
     preference_name: "Senior Oracle Fusion Consultant"
   }
   
   Response: {
     id: 123,
     candidate_id: 456,
     ... (all fields echoed back)
   }

2. GET /preferences/my-preferences
   Returns: [pref1, pref2, newpref123]
   
3. GET /preferences/my-profile
   Returns: {
     id: 456,
     name: "John Smith",
     ... (all profile data including updated preferences)
   }
```

### Edit Flow:
```
1. GET /preferences/{id} (if form loading from URL)
   Returns: Full preference data
   
2. PUT /preferences/{id}
   Request: (only changed fields)
   {
     hourly_rate_min: 160,
     hourly_rate_max: 210
   }
   
   Response: {
     id: 123,
     ... (full updated data)
   }

3. GET /preferences/my-profile (for dashboard refresh)
```

### Delete Flow:
```
1. DELETE /preferences/{id}
   Returns: {"message": "Job preference deleted successfully"}

2. GET /preferences/my-profile (for dashboard refresh)
```

---

## State Management Flow

```
User Actions              State Changes              UI Updates
─────────────────────────────────────────────────────────────

Click [+ New Profile]
  ↓
handleCreateNew()
  ↓
navigate('?new=true')
  ↓
useEffect detects ?new
  ↓
setShowForm(true)         showForm = true            Form appears
  ↓
User fills form
  ↓
setFormData({...})        formData = {...}           Form reflects input

Click [Save Profile]
  ↓
handleSubmit()
  ↓
POST /preferences/create
  ↓
setSuccessMessage('...')  successMessage = '...'     Green message
resetForm()               formData = {}              Form clears
setShowForm(false)        showForm = false           Form hides
navigate('...')           (page changes)             Dashboard loads
fetchProfile()            profile = {...}            Updated list shows
timeout(3000)             successMessage = ''        Message fades

─────────────────────────────────────────────────────────────

Click [✎ Edit]
  ↓
handleEditPreference(3)
  ↓
navigate('?edit=3')
  ↓
useEffect detects ?edit=3
  ↓
Find profile 3
  ↓
handleEdit(profile3)
  ↓
setFormData(profile3)     formData = profile3        Form pre-fills!
setEditingId(3)           editingId = 3              (shows existing data)
setShowForm(true)         showForm = true            Form appears

User changes fields
  ↓
setFormData({...})        formData = {...}           Form updates

Click [Update Profile]
  ↓
handleSubmit()
  ↓
PUT /preferences/3
  ↓
setSuccessMessage('...')  successMessage = '...'     Green message
resetForm()               formData = {}              Form clears
setEditingId(null)        editingId = null           (reset state)
setShowForm(false)        showForm = false           Form hides
navigate('...')           (page changes)             Dashboard loads
fetchProfile()            profile = {...}            Updated list shows

─────────────────────────────────────────────────────────────

Click [🗑 Delete]
  ↓
setDeleteConfirm(3)       deleteConfirm = 3          ⚠️ Warning shows

User clicks [Yes, Delete]
  ↓
handleDeletePreference(3)
  ↓
DELETE /preferences/3
  ↓
setSuccessMessage('...')  successMessage = '...'     Green message
setDeleteConfirm(null)    deleteConfirm = null       Warning disappears
fetchProfile()            profile = {...}            Profile 3 gone!

User clicks [Cancel]
  ↓
setDeleteConfirm(null)    deleteConfirm = null       Warning closes
(no API call)             (no change)                Profile stays
```

---

## Error Handling Flow

```
Any async action:

try {
  API Call
  ↓
  Success
  ↓
  Show success message
  Navigate away
  
} catch (error) {
  ↓
  setError('Error message')
  ↓
  Red error box appears
  ↓
  User sees problem
}
```

---

## Responsive Design

```
Desktop (>768px):
┌──────────────────────────────┐
│ Profile 1                    │
│ [✎ Edit] [🗑 Delete]         │
├──────────────────────────────┤
│ Profile 2                    │
│ [✎ Edit] [🗑 Delete]         │
└──────────────────────────────┘

Tablet (481-768px):
┌────────────────┐
│ Profile 1      │
│ [✎ Edit]      │
│ [🗑 Delete]    │
├────────────────┤
│ Profile 2      │
│ [✎ Edit]      │
│ [🗑 Delete]    │
└────────────────┘

Mobile (<480px):
┌─────────┐
│Profile 1│
│[✎][🗑]  │
├─────────┤
│Profile 2│
│[✎][🗑]  │
└─────────┘
(buttons full width on small screens)
```

---

This visual guide summarizes the complete implementation of Oracle Profiles with edit/delete functionality! 🎉
