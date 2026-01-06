# Quick Test Guide: Oracle Products & Roles Dropdowns

## Setup (Already Done ✅)

Backend is running on `http://127.0.0.1:8000`
Frontend is running on `http://localhost:3000`

---

## Step-by-Step Testing

### 1. Open the Candidate Dashboard
```
Go to: http://localhost:3000
Login with candidate account
Navigate to "Candidate Dashboard" → "Edit Your Profile" tab
```

### 2. Scroll to "Product/Role Focus" Section
You should see:
- ✅ **Product Vendor**: "Oracle" (gray, disabled field)
- ✅ **Product Type**: Empty dropdown with "Select Product..." placeholder
- (Primary Role will appear after selecting product)

### 3. Test Product Type Dropdown
```
Click on "Product Type" dropdown
```

**Expected Result:**
You should see 4 options:
1. SaaS
2. E-Business Suite
3. PeopleSoft
4. JD Edwards

**What's happening in background:**
- Frontend calls: `jobRolesAPI.getProducts('Oracle')`
- Backend responds with all 4 products from roles.json
- Browser console should show: 
  ```
  Loaded products for Oracle: ["SaaS", "E-Business Suite", "PeopleSoft", "JD Edwards"]
  ```

### 4. Select a Product (Test with "SaaS")
```
Click on "SaaS" in the dropdown
```

**Expected Result:**
- Dropdown closes and shows "SaaS" selected
- "Primary Role" dropdown field appears below Product Type
- Placeholder shows "Select Role..."

**What's happening:**
- Form state updated: `formData.product = 'SaaS'`
- Roles array cleared to prepare for new roles

### 5. Test Primary Role Dropdown
```
Click on "Primary Role" dropdown
```

**Expected Result:**
You should see **7 roles** for SaaS:
1. Oracle Fusion Functional Consultant
2. Oracle Fusion Technical Consultant
3. Oracle Integration Cloud (OIC) Developer
4. Oracle Reporting Consultant (OTBI/BIP)
5. Oracle Cloud Architect
6. Oracle Cloud Project Manager
7. Oracle Cloud Security Consultant

**What's happening in background:**
- Frontend calls: `jobRolesAPI.getRoles('Oracle', 'SaaS')`
- Backend fetches roles for SaaS from roles.json
- Browser console shows:
  ```
  Loaded roles for Oracle - SaaS: ["Oracle Fusion Functional Consultant", ...]
  ```

### 6. Test with Different Products
Repeat steps 4-5 with other products to verify:

#### E-Business Suite (7 roles):
- Oracle EBS Functional Consultant
- Oracle EBS Technical Consultant
- Oracle EBS Developer (PL/SQL, Forms/OAF)
- Oracle EBS Techno-Functional Consultant
- Oracle EBS DBA
- Oracle Workflow Specialist
- Oracle EBS Project Manager

#### PeopleSoft (6 roles):
- PeopleSoft HCM Consultant
- PeopleSoft Finance Consultant
- PeopleSoft Developer
- PeopleSoft Integration Specialist
- PeopleSoft Admin/DBA
- PeopleSoft Analyst

#### JD Edwards (5 roles):
- JDE Functional Consultant
- JDE Technical Developer
- JDE CNC Administrator
- JDE Business Analyst
- JDE Architect

### 7. Test Availability Field
```
Click on "Availability" text input (above Product/Role section)
Type a custom availability
```

**Expected Result:**
Text input accepts any custom text like:
- "Immediately"
- "2 weeks notice"
- "Starting Jan 15"
- "Available from Feb 1"
- Any date or timeframe

---

## Debugging Tips

### If dropdowns are empty (not working):

**Check 1: Browser Console (F12 → Console)**
```
Look for errors. You should see:
✅ "Loaded products for Oracle: [...]"
✅ "Loaded roles for Oracle - SaaS: [...]"

❌ If you see errors like "Failed to load products", check:
   - Backend is running on http://127.0.0.1:8000
   - No CORS errors
   - API endpoints returning data
```

**Check 2: Test API Directly**
Open in browser:
```
✅ http://127.0.0.1:8000/job-roles/products?author=Oracle
   Should return: {"author": "Oracle", "products": ["SaaS", "E-Business Suite", ...]}

✅ http://127.0.0.1:8000/job-roles/roles?author=Oracle&product=SaaS
   Should return: {"author": "Oracle", "product": "SaaS", "roles": [...]}
```

**Check 3: Frontend Running?**
```
npm start from: D:\WORK\App\react-frontend
Should be accessible at: http://localhost:3000
```

**Check 4: Backend Running?**
```
uvicorn app.main:app --reload from: D:\WORK\App\backend
Should show API docs at: http://127.0.0.1:8000/docs
```

---

## Form Data After Selection

Once you've selected product and role, the form data structure should be:
```javascript
{
  availability: "Immediately",              // Your text input
  product: "SaaS",                         // Selected product
  primary_role: "Oracle Fusion...",        // Selected role
  // ... other profile fields ...
}
```

---

## Save & Verify

After selecting product + role:
1. Fill in other fields (name, summary, etc.)
2. Click **"Save Profile"** button
3. Data should save to backend
4. Refresh page - product and role should persist

---

## Files Modified

- ✅ `backend/app/data/roles.json` - Contains all product/role data
- ✅ `backend/app/routers/job_roles.py` - API endpoints
- ✅ `react-frontend/src/api/client.ts` - API client (jobRolesAPI)
- ✅ `react-frontend/src/pages/CandidateDashboard.tsx` - Form component
  - `handleLoadProducts()` - Fetches products from API
  - `handleLoadRoles()` - Fetches roles from API
  - `fetchAllData()` - Pre-loads Oracle products on mount

