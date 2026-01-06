# 🔧 Oracle Profiles - Technical Implementation Details

## Architecture Changes

### Frontend Changes Only
- **Backend**: No changes needed ✅
- **Database**: No changes needed ✅
- **Models**: No changes needed ✅
- **API**: No changes needed ✅

All changes are **front-end only** (React/TypeScript)

---

## Modified Components

### 1. JobPreferencesPage.tsx
**Path:** `react-frontend/src/pages/JobPreferencesPage.tsx`

#### Key Changes:

**Before:**
```tsx
const [ontology, setOntology] = useState<OntologyData>({
  authors: [],        // List of vendors
  products: {},       // Products by vendor
  roles: {},         // Roles by vendor+product
  skills: [],        // Available skills
});

// User selects vendor first
<select onChange={(e) => handleAuthorChange(Number(e.target.value))}>
  {ontology.authors.map((author) => (...))}
</select>

// Then selects product
<select onChange={(e) => handleProductChange(Number(e.target.value))}>
  {ontology.products[author?.name || ''].map((prod) => (...))}
</select>
```

**After:**
```tsx
const [ontology, setOntology] = useState<OntologyData>({
  products: [],       // Only Oracle products
  roles: {},         // Roles by product only
  skills: [],
  oracleAuthorId: 1, // Oracle hardcoded
});

// Skip vendor selection, only show products
<select onChange={(e) => handleProductChange(Number(e.target.value))}>
  {ontology.products.map((prod) => (...))}
</select>
```

#### Data Fetching:
```tsx
// Before: Fetch all authors
const authorsRes = await jobRolesAPI.getAuthors();

// After: Fetch Oracle directly
const authorsRes = await jobRolesAPI.getAuthors();
const oracleAuthor = authorsRes.data.find((a: any) => a.name === 'Oracle');
const oracleId = oracleAuthor?.id || 1;

// Then fetch Oracle products only
const productsRes = await jobRolesAPI.getProducts('Oracle');
```

#### Form Initialization:
```tsx
// Before
const [formData, setFormData] = useState<JobPreference>({
  product_author_id: 0,  // User selects
  product_id: 0,
  // ...
});

// After
const [formData, setFormData] = useState<JobPreference>({
  product_author_id: 1,  // Hardcoded to Oracle
  product_id: 0,         // User selects product
  // ...
});
```

#### URL Parameter Support:
```tsx
// NEW: Support URL params for editing
useEffect(() => {
  const editId = searchParams.get('edit');
  const isNew = searchParams.get('new');
  
  if (editId && preferences.length > 0) {
    const pref = preferences.find(p => p.id === Number(editId));
    if (pref) {
      handleEdit(pref); // Auto-load form
    }
  } else if (isNew) {
    setShowForm(true);
  }
}, [searchParams, preferences]);
```

#### Success Handling:
```tsx
// NEW: Show success message and navigate
const handleSubmit = async (e: React.FormEvent) => {
  // ... save logic ...
  if (editingId) {
    setSuccessMessage('Profile updated successfully');
  } else {
    setSuccessMessage('Profile created successfully');
  }
  await fetchData();
  resetForm();
  setShowForm(false);
  navigate('/profile-dashboard'); // Go back to dashboard
  setTimeout(() => setSuccessMessage(''), 3000);
};
```

---

### 2. ProfileDashboard.tsx
**Path:** `react-frontend/src/pages/ProfileDashboard.tsx`

#### New State Variables:
```tsx
const [successMessage, setSuccessMessage] = useState('');
const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
```

#### New Functions:

**Edit Handler:**
```tsx
const handleEditPreference = (preferenceId: number) => {
  // Navigate to JobPreferencesPage with edit param
  navigate(`/job-preferences?edit=${preferenceId}`);
};
```

**Delete Handler:**
```tsx
const handleDeletePreference = async (preferenceId: number) => {
  try {
    // Call API to delete
    await preferencesAPI.delete(preferenceId);
    setSuccessMessage('Profile deleted successfully');
    setDeleteConfirm(null);
    
    // Refresh profile data
    await fetchProfile();
    
    // Show success for 3 seconds
    setTimeout(() => setSuccessMessage(''), 3000);
  } catch (err: any) {
    setError(err.response?.data?.detail || 'Failed to delete profile');
  }
};
```

**Create New Handler:**
```tsx
const handleCreateNew = () => {
  navigate('/job-preferences?new=true');
};
```

#### UI Changes:

**Before:**
```tsx
<div className="preference-footer">
  <small>Created {pref.created_at?.toLocaleDateString()}</small>
  <button className="btn-view" onClick={() => navigate('/job-preferences')}>
    Edit Preference →
  </button>
</div>
```

**After:**
```tsx
<div className="preference-footer">
  <small>Created {pref.created_at ? new Date(pref.created_at).toLocaleDateString() : 'N/A'}</small>
  <div className="action-buttons">
    <button
      className="btn-edit"
      onClick={() => handleEditPreference(pref.id)}
    >
      ✎ Edit
    </button>
    <button
      className="btn-delete"
      onClick={() => setDeleteConfirm(pref.id)}
    >
      🗑 Delete
    </button>
  </div>
</div>

{/* NEW: Delete confirmation */}
{deleteConfirm === pref.id && (
  <div className="delete-confirmation">
    <p>Are you sure you want to delete this profile?</p>
    <div className="confirm-buttons">
      <button
        className="btn-confirm-yes"
        onClick={() => handleDeletePreference(pref.id)}
      >
        Yes, Delete
      </button>
      <button
        className="btn-confirm-no"
        onClick={() => setDeleteConfirm(null)}
      >
        Cancel
      </button>
    </div>
  </div>
)}
```

---

### 3. ProfileDashboard.css
**Path:** `react-frontend/src/styles/ProfileDashboard.css`

#### New CSS Classes:

**Action Buttons Container:**
```css
.action-buttons {
  display: flex;
  gap: 8px;
}
```

**Edit Button:**
```css
.btn-edit {
  background: #cfe9ff;
  color: #0056b3;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-edit:hover {
  background: #99d1ff;
  transform: translateY(-1px);
}
```

**Delete Button:**
```css
.btn-delete {
  background: #f5c2c7;
  color: #721c24;
  /* same structure as btn-edit */
}

.btn-delete:hover {
  background: #f1b0b7;
  transform: translateY(-1px);
}
```

**Confirmation Box:**
```css
.delete-confirmation {
  padding: 12px 20px;
  background: #fff3cd;
  border-top: 1px solid #ffc107;
  border-bottom: 1px solid #ffc107;
  text-align: center;
}

.delete-confirmation p {
  margin: 0 0 12px 0;
  color: #856404;
  font-weight: 500;
  font-size: 14px;
}
```

**Confirmation Buttons:**
```css
.btn-confirm-yes {
  background: #721c24;
  color: white;
  padding: 6px 16px;
  /* dark red, hover becomes darker */
}

.btn-confirm-no {
  background: #d3d3d3;
  color: #333;
  /* gray, hover becomes darker gray */
}
```

**Messages:**
```css
.success-message {
  background: #d4edda;
  color: #155724;
  padding: 12px 20px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid #c3e6cb;
  font-weight: 500;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 12px 20px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid #f5c6cb;
  font-weight: 500;
}
```

---

## Data Flow Diagrams

### Create Profile Flow
```
User clicks "New Profile"
    ↓
navigate('/job-preferences?new=true')
    ↓
JobPreferencesPage loads with ?new param
    ↓
useEffect detects isNew=true
    ↓
setShowForm(true) - Opens form
    ↓
User fills form with:
  - Oracle product (only option)
  - Roles
  - Experience, rate, skills, etc.
    ↓
User clicks "Save Profile"
    ↓
POST /preferences/create
    ↓
Backend returns new preference ID
    ↓
setSuccessMessage('Profile created successfully')
    ↓
navigate('/profile-dashboard')
    ↓
ProfileDashboard fetches updated list
    ↓
New profile appears in list ✅
```

### Edit Profile Flow
```
User clicks "✎ Edit" button
    ↓
handleEditPreference(pref.id)
    ↓
navigate(`/job-preferences?edit=${pref.id}`)
    ↓
JobPreferencesPage loads with ?edit param
    ↓
useEffect detects editId
    ↓
Finds preference in list by ID
    ↓
handleEdit(pref) - Populates form
    ↓
Form shows current values
    ↓
User modifies fields
    ↓
User clicks "Update Profile"
    ↓
PUT /preferences/{id}
    ↓
Backend returns updated preference
    ↓
setSuccessMessage('Profile updated successfully')
    ↓
navigate('/profile-dashboard')
    ↓
ProfileDashboard refetches data
    ↓
Updated profile shows new values ✅
```

### Delete Profile Flow
```
User clicks "🗑 Delete" button on profile card
    ↓
setDeleteConfirm(pref.id) - Shows confirmation
    ↓
Delete confirmation box appears with yellow warning
    ↓
User has two choices:
    │
    ├─ "Yes, Delete"
    │   ↓
    │   handleDeletePreference(pref.id)
    │   ↓
    │   DELETE /preferences/{id}
    │   ↓
    │   Backend deletes preference
    │   ↓
    │   setSuccessMessage('Profile deleted successfully')
    │   ↓
    │   setDeleteConfirm(null) - Closes confirmation
    │   ↓
    │   fetchProfile() - Refresh data
    │   ↓
    │   Profile disappears from list ✅
    │
    └─ "Cancel"
        ↓
        setDeleteConfirm(null) - Closes confirmation
        ↓
        Profile stays in list (no change)
```

---

## API Calls Used

### In JobPreferencesPage:
```tsx
// Fetch existing preferences
const prefsRes = await preferencesAPI.getMyPreferences();

// Fetch Oracle products
const productsRes = await jobRolesAPI.getProducts('Oracle');

// Fetch available skills
const skillsRes = await jobRolesAPI.getSkills();

// Create new preference
await preferencesAPI.create(formData);

// Update existing preference
await preferencesAPI.update(editingId, formData);

// Delete preference
await preferencesAPI.delete(preferenceId);
```

### In ProfileDashboard:
```tsx
// Fetch profile with all preferences
const res = await preferencesAPI.getProfileWithPreferences();

// Delete preference
await preferencesAPI.delete(preferenceId);
```

---

## Type Definitions

### JobPreference Type (from api/client.ts):
```tsx
interface JobPreference {
  id?: number;
  candidate_id?: number;
  product_author_id: number;    // Always 1 (Oracle)
  product_id: number;           // Selected Oracle product
  roles: string[];              // Selected roles
  seniority_level?: string;      // Junior/Mid/Senior
  years_experience_min?: number;
  years_experience_max?: number;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  required_skills?: string[];
  work_type?: string;            // Remote/On-site/Hybrid
  location_preferences?: string[];
  availability?: string;
  preference_name?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
```

---

## State Management

### JobPreferencesPage State:
```tsx
const [preferences, setPreferences] = useState<JobPreference[]>([]);
const [ontology, setOntology] = useState<OntologyData>({...});
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [successMessage, setSuccessMessage] = useState('');
const [showForm, setShowForm] = useState(false);
const [editingId, setEditingId] = useState<number | null>(null);
const [formData, setFormData] = useState<JobPreference>({...});
const [selectedSkill, setSelectedSkill] = useState('');
const [selectedLocation, setSelectedLocation] = useState('');
```

### ProfileDashboard State:
```tsx
const [profile, setProfile] = useState<CandidateProfileWithPreferences | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [successMessage, setSuccessMessage] = useState('');
const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
```

---

## URL Parameters

### JobPreferencesPage:
```
/job-preferences           → Show form and preferences list
/job-preferences?new=true  → Open form for creating new preference
/job-preferences?edit=3    → Open form pre-filled with preference ID 3
```

---

## Browser Compatibility

All features use standard React/TypeScript:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

---

## Performance Considerations

### Optimizations:
- ✅ Form pre-population uses URL params (no extra API calls)
- ✅ Only fetch Oracle products (not all vendors)
- ✅ Success messages auto-dismiss after 3 seconds
- ✅ Confirmation boxes prevent accidental deletes

### No Changes to API Performance:
- Backend endpoints unchanged
- Database queries unchanged
- All optimization is front-end only

---

## Error Handling

### User Feedback:
- ✅ Error messages appear in red box
- ✅ Success messages appear in green box
- ✅ Delete requires confirmation (prevents accidents)
- ✅ All async operations show loading state

### Error Scenarios Handled:
- Network error when creating profile
- Network error when updating profile
- Network error when deleting profile
- Profile not found when loading
- Form validation errors

---

## Testing Checklist

- [ ] Create new profile successfully
- [ ] Edit existing profile successfully
- [ ] Delete profile with confirmation
- [ ] Cancel delete (profile remains)
- [ ] Edit URL params work (`?edit=id`, `?new=true`)
- [ ] Form pre-populates on edit
- [ ] Success messages appear and disappear
- [ ] Error messages show on API errors
- [ ] Only Oracle products appear in dropdown
- [ ] Navigation flows work correctly

---

## Files Changed Summary

| File | Changes | Impact |
|------|---------|--------|
| JobPreferencesPage.tsx | Oracle-only, URL params, success messages | High |
| ProfileDashboard.tsx | Edit/delete buttons, confirmation, messages | High |
| ProfileDashboard.css | New button/confirmation/message styles | Medium |

**Backend:** No changes needed ✅
**Database:** No changes needed ✅
**Models:** No changes needed ✅
