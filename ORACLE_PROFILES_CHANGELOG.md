# 📝 Oracle Profiles - Change Log

## Date: January 6, 2026

---

## Files Modified

### 1. `react-frontend/src/pages/JobPreferencesPage.tsx`

#### Changed: Oracle-Only Product Selection
**Lines:** Top of component

**Before:**
```tsx
interface OntologyData {
  authors: ProductAuthor[];              // Multiple vendors
  products: { [key: string]: Product[] };
  roles: { [key: string]: JobRole[] };
  skills: string[];
}

const [ontology, setOntology] = useState<OntologyData>({
  authors: [],
  products: {},
  roles: {},
  skills: [],
});
```

**After:**
```tsx
interface OntologyData {
  products: Product[];                   // Only Oracle products
  roles: { [key: string]: JobRole[] };
  skills: string[];
  oracleAuthorId: number;               // Hardcoded Oracle ID
}

const [ontology, setOntology] = useState<OntologyData>({
  products: [],
  roles: {},
  skills: [],
  oracleAuthorId: 1,
});
```

---

#### Added: URL Parameter Support
**Lines:** New useEffect in component

**New Code:**
```tsx
const [searchParams] = useSearchParams();
const navigate = useNavigate();

// Handle URL params for editing
useEffect(() => {
  const editId = searchParams.get('edit');
  const isNew = searchParams.get('new');
  
  if (editId && preferences.length > 0) {
    const pref = preferences.find(p => p.id === Number(editId));
    if (pref) {
      handleEdit(pref);
    }
  } else if (isNew) {
    setShowForm(true);
  }
}, [searchParams, preferences]);
```

---

#### Changed: Data Fetching (Oracle-Only)
**Before:**
```tsx
const authorsRes = await jobRolesAPI.getAuthors();
const skillsRes = await jobRolesAPI.getSkills();

setOntology({
  authors: authorsRes.data,
  products: {},
  roles: {},
  skills: skillsRes.data,
});
```

**After:**
```tsx
const authorsRes = await jobRolesAPI.getAuthors();
const oracleAuthor = authorsRes.data.find((a: any) => a.name === 'Oracle');
const oracleId = oracleAuthor?.id || 1;

const productsRes = await jobRolesAPI.getProducts('Oracle');
const skillsRes = await jobRolesAPI.getSkills();

setOntology({
  products: productsRes.data,
  roles: {},
  skills: skillsRes.data,
  oracleAuthorId: oracleId,
});
```

---

#### Changed: Form Initialization
**Before:**
```tsx
const [formData, setFormData] = useState<JobPreference>({
  product_author_id: 0,    // User selects
  product_id: 0,
  roles: [],
  // ...
});
```

**After:**
```tsx
const [formData, setFormData] = useState<JobPreference>({
  product_author_id: 1,    // Oracle hardcoded
  product_id: 0,           // User selects product only
  roles: [],
  // ...
});
```

---

#### Removed: Author Selection Handler
**Removed Function:**
```tsx
const handleAuthorChange = async (authorId: number) => {
  // ... no longer needed
};
```

---

#### Changed: Product Change Handler
**Before:**
```tsx
const handleProductChange = async (productId: number) => {
  setFormData({ ...formData, product_id: productId, roles: [] });
  try {
    const author = ontology.authors.find((a) => a.id === formData.product_author_id);
    const product = ontology.products[author?.name || '']?.find((p) => p.id === productId);

    if (author && product) {
      const rolesRes = await jobRolesAPI.getRoles(author.name, product.name);
      setOntology({
        ...ontology,
        roles: { ...ontology.roles, [`${author.name}-${product.name}`]: rolesRes.data },
      });
    }
  } catch (err) {
    console.error('Error fetching roles:', err);
  }
};
```

**After:**
```tsx
const handleProductChange = async (productId: number) => {
  setFormData({ ...formData, product_id: productId, roles: [] });
  try {
    const product = ontology.products.find((p) => p.id === productId);
    if (product) {
      const rolesRes = await jobRolesAPI.getRoles('Oracle', product.name);
      setOntology({
        ...ontology,
        roles: { ...ontology.roles, [product.name]: rolesRes.data },
      });
    }
  } catch (err) {
    console.error('Error fetching roles:', err);
  }
};
```

---

#### Changed: Role Toggle Handler
**Before:**
```tsx
const handleRoleToggle = (roleId: number) => {
  const author = ontology.authors.find((a) => a.id === formData.product_author_id);
  const product = ontology.products[author?.name || '']?.find((p) => p.id === formData.product_id);

  if (author && product) {
    const role = ontology.roles[`${author.name}-${product.name}`]?.find((r) => r.id === roleId);
    // ...
  }
};
```

**After:**
```tsx
const handleRoleToggle = (roleId: number) => {
  const product = ontology.products.find((p) => p.id === formData.product_id);
  if (product) {
    const role = ontology.roles[product.name]?.find((r) => r.id === roleId);
    // ...
  }
};
```

---

#### Added: Success Message & Navigation
**New Code in handleSubmit:**
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    if (editingId) {
      await preferencesAPI.update(editingId, formData);
      setSuccessMessage('Profile updated successfully');
    } else {
      await preferencesAPI.create(formData);
      setSuccessMessage('Profile created successfully');
    }
    await fetchData();
    resetForm();
    setShowForm(false);
    navigate('/profile-dashboard');  // NEW!
    setTimeout(() => setSuccessMessage(''), 3000);  // NEW!
  } catch (err: any) {
    setError(err.response?.data?.detail || 'Failed to save preference');
  }
};
```

---

#### Changed: Form Labels
**Before:**
```tsx
<h1>Job Preferences</h1>
<p>Create and manage your job preferences...</p>
<h2>{editingId ? 'Edit Preference' : 'New Job Preference'}</h2>
<h2>Your Job Preferences ({preferences.length})</h2>
```

**After:**
```tsx
<h1>Oracle Profiles</h1>
<p>Create and manage your Oracle career profiles...</p>
<h2>{editingId ? 'Edit Profile' : 'New Oracle Profile'}</h2>
<h2>Your Oracle Profiles ({preferences.length})</h2>
```

---

#### Removed: Product Author Selection UI
**Before:**
```tsx
<div className="form-group">
  <label>Product Author *</label>
  <select
    value={formData.product_author_id}
    onChange={(e) => handleAuthorChange(Number(e.target.value))}
    required
  >
    <option value="">Select Product (e.g., Oracle, SAP)</option>
    {ontology.authors.map((author) => (...))}
  </select>
</div>

{formData.product_author_id > 0 && (
  <div className="form-group">
    <label>Product *</label>
    {/* Product selection */}
  </div>
)}
```

**After:**
```tsx
<div className="form-group">
  <label>Oracle Product *</label>
  <select
    value={formData.product_id}
    onChange={(e) => handleProductChange(Number(e.target.value))}
    required
  >
    <option value="">Select Oracle Product</option>
    {ontology.products.map((prod) => (...))}
  </select>
</div>
```

---

#### Added: Success Message Display
**New Code:**
```tsx
{successMessage && <div className="success-message">{successMessage}</div>}
{error && <div className="error-message">{error}</div>}
```

---

### 2. `react-frontend/src/pages/ProfileDashboard.tsx`

#### Added: New State Variables
**New Lines:**
```tsx
const [successMessage, setSuccessMessage] = useState('');
const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
```

---

#### Added: New Handler Functions
**New Functions:**
```tsx
const handleDeletePreference = async (preferenceId: number) => {
  try {
    await preferencesAPI.delete(preferenceId);
    setSuccessMessage('Profile deleted successfully');
    setDeleteConfirm(null);
    await fetchProfile();
    setTimeout(() => setSuccessMessage(''), 3000);
  } catch (err: any) {
    setError(err.response?.data?.detail || 'Failed to delete profile');
  }
};

const handleEditPreference = (preferenceId: number) => {
  navigate(`/job-preferences?edit=${preferenceId}`);
};

const handleCreateNew = () => {
  navigate('/job-preferences?new=true');
};
```

---

#### Changed: Profile Header
**Before:**
```tsx
<div className="profile-header">
  <div className="profile-info">
    {/* ... */}
  </div>
  <button
    className="btn-manage-prefs"
    onClick={() => navigate('/job-preferences')}
  >
    Manage Preferences
  </button>
</div>

{error && <div className="error-message">{error}</div>}
```

**After:**
```tsx
<div className="profile-header">
  <div className="profile-info">
    {/* ... */}
  </div>
</div>

{successMessage && <div className="success-message">{successMessage}</div>}
{error && <div className="error-message">{error}</div>}
```

---

#### Changed: Section Header Title
**Before:**
```tsx
<h2>Your Job Preference Profiles</h2>
<button
  className="btn-primary"
  onClick={() => navigate('/job-preferences')}
>
  + New Preference
</button>
```

**After:**
```tsx
<h2>Your Oracle Profiles</h2>
<button
  className="btn-primary"
  onClick={handleCreateNew}
>
  + New Profile
</button>
```

---

#### Changed: Empty State
**Before:**
```tsx
<h3>No job preferences yet</h3>
<p>Create job preference profiles to match with opportunities tailored to your interests.</p>
<button
  className="btn-primary-large"
  onClick={() => navigate('/job-preferences')}
>
  Create Your First Preference
</button>
```

**After:**
```tsx
<h3>No Oracle profiles yet</h3>
<p>Create your first Oracle profile to start matching with opportunities.</p>
<button
  className="btn-primary-large"
  onClick={handleCreateNew}
>
  Create Your First Profile
</button>
```

---

#### Replaced: Preference Footer
**Before:**
```tsx
<div className="preference-footer">
  <small>Created {pref.created_at ? new Date(pref.created_at).toLocaleDateString() : 'N/A'}</small>
  <button
    className="btn-view"
    onClick={() => navigate('/job-preferences')}
  >
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

### 3. `react-frontend/src/styles/ProfileDashboard.css`

#### Replaced: Button Footer Styles
**Before:**
```css
.preference-footer {
  padding: 12px 20px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preference-footer small {
  color: #999;
  font-size: 12px;
}

.btn-view {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: color 0.3s;
}

.btn-view:hover {
  color: #764ba2;
}
```

**After:**
```css
.preference-footer {
  padding: 12px 20px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.preference-footer small {
  color: #999;
  font-size: 12px;
  flex: 1;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-edit {
  background: #cfe9ff;
  color: #0056b3;
}

.btn-edit:hover {
  background: #99d1ff;
  transform: translateY(-1px);
}

.btn-delete {
  background: #f5c2c7;
  color: #721c24;
}

.btn-delete:hover {
  background: #f1b0b7;
  transform: translateY(-1px);
}
```

---

#### Added: Delete Confirmation Styles
**New Code:**
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

.confirm-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-confirm-yes,
.btn-confirm-no {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-confirm-yes {
  background: #721c24;
  color: white;
}

.btn-confirm-yes:hover {
  background: #5a1319;
  transform: translateY(-1px);
}

.btn-confirm-no {
  background: #d3d3d3;
  color: #333;
}

.btn-confirm-no:hover {
  background: #b0b0b0;
  transform: translateY(-1px);
}

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

#### Updated: Responsive Styles
**Before:**
```css
.preference-footer {
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}
```

**After:**
```css
.preference-footer {
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.action-buttons {
  width: 100%;
}

.btn-edit,
.btn-delete {
  flex: 1;
}
```

---

## Summary of Changes

| Category | Count |
|----------|-------|
| Functions Added | 3 |
| Functions Removed | 1 |
| State Variables Added | 2 |
| CSS Classes Added | 10 |
| Lines Added | ~350 |
| Lines Modified | ~50 |
| Lines Removed | ~50 |

## Impact

- ✅ **Frontend Only** - No backend changes
- ✅ **Backward Compatible** - All APIs unchanged
- ✅ **Better UX** - Edit/delete now on dashboard
- ✅ **Simpler** - Oracle-only, no vendor selection
- ✅ **Safer** - Delete confirmation prevents accidents

---

End of Change Log
