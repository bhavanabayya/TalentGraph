# Oracle Products & Roles Configuration

## Backend Data Structure (roles.json)

The system loads Oracle products and roles from `backend/app/data/roles.json` with the following structure:

### **Vendor: Oracle**

#### **1. Product: SaaS**
- Oracle Fusion Functional Consultant
- Oracle Fusion Technical Consultant
- Oracle Integration Cloud (OIC) Developer
- Oracle Reporting Consultant (OTBI/BIP)
- Oracle Cloud Architect
- Oracle Cloud Project Manager
- Oracle Cloud Security Consultant

#### **2. Product: E-Business Suite**
- Oracle EBS Functional Consultant
- Oracle EBS Technical Consultant
- Oracle EBS Developer (PL/SQL, Forms/OAF)
- Oracle EBS Techno-Functional Consultant
- Oracle EBS DBA
- Oracle Workflow Specialist
- Oracle EBS Project Manager

#### **3. Product: PeopleSoft**
- PeopleSoft HCM Consultant
- PeopleSoft Finance Consultant
- PeopleSoft Developer
- PeopleSoft Integration Specialist
- PeopleSoft Admin/DBA
- PeopleSoft Analyst

#### **4. Product: JD Edwards**
- JDE Functional Consultant
- JDE Technical Developer
- JDE CNC Administrator
- JDE Business Analyst
- JDE Architect

---

## API Endpoints

### Get All Products for Oracle
```
GET /job-roles/products?author=Oracle
Response: {"author": "Oracle", "products": ["SaaS", "E-Business Suite", "PeopleSoft", "JD Edwards"]}
```

### Get All Roles for a Specific Product
```
GET /job-roles/roles?author=Oracle&product=SaaS
Response: {"author": "Oracle", "product": "SaaS", "roles": [...]}
```

---

## Frontend Form Flow

### Step 1: Page Loads
- `fetchAllData()` called on component mount
- Calls `jobRolesAPI.getProducts('Oracle')` 
- Products array populated: `['SaaS', 'E-Business Suite', 'PeopleSoft', 'JD Edwards']`

### Step 2: Candidate Selects Product Type
- Opens dropdown showing all 4 Oracle products
- User selects one (e.g., "SaaS")
- Form state updates: `formData.product = 'SaaS'`
- Roles array is cleared

### Step 3: Primary Role Field Appears
- Once product is selected, Primary Role dropdown becomes visible
- When candidate clicks/focuses on Role dropdown:
  - `handleLoadRoles('Oracle', formData.product)` is called
  - API fetches roles for that product
  - Dropdown populates with 7+ roles for that product

### Step 4: Candidate Selects Role
- User clicks role dropdown
- Sees all applicable roles (e.g., for SaaS: 7 roles listed)
- Selects a role (e.g., "Oracle Fusion Functional Consultant")
- Form state updates: `formData.primary_role = selected role`

---

## Current Implementation Status

### ✅ Working Components
- **Product Vendor Field**: Shows "Oracle" (disabled, gray)
- **Product Type Dropdown**: Loads and displays all 4 Oracle products
- **Primary Role Dropdown**: Appears when product selected, loads roles for that product
- **Availability Field**: Text input accepting custom dates/availability
- **Backend APIs**: All endpoints working correctly, returning correct data

### 🔄 Real-time Data Flow
1. Page Mount → Fetch Oracle products automatically
2. Product Selection → Roles cleared, ready for selection
3. Role Dropdown Focus → Fetch roles for selected product
4. Role Selection → Save with product + role combo

---

## Testing the Dropdowns

### To verify dropdowns are working:

1. **Go to Candidate Dashboard** → Edit Your Profile tab
2. **Scroll to "Product/Role Focus" section**
3. **Product Vendor**: Should show "Oracle" (disabled, gray background)
4. **Product Type**: Click to open dropdown
   - Should see: "SaaS", "E-Business Suite", "PeopleSoft", "JD Edwards"
5. **Select any product** (e.g., "SaaS")
6. **Primary Role dropdown appears** below Product Type
7. **Click Role dropdown** to open
   - Should see all 7 roles for SaaS:
     - Oracle Fusion Functional Consultant
     - Oracle Fusion Technical Consultant
     - Oracle Integration Cloud (OIC) Developer
     - Oracle Reporting Consultant (OTBI/BIP)
     - Oracle Cloud Architect
     - Oracle Cloud Project Manager
     - Oracle Cloud Security Consultant

### Browser Console (F12)
You'll see logs like:
```
Loaded products for Oracle: ["SaaS", "E-Business Suite", "PeopleSoft", "JD Edwards"]
Loaded roles for Oracle - SaaS: ["Oracle Fusion Functional Consultant", ...]
```

---

## Files Involved

- **Backend Data**: `backend/app/data/roles.json`
- **Backend API**: `backend/app/routers/job_roles.py`
- **Frontend API Client**: `react-frontend/src/api/client.ts` (jobRolesAPI)
- **Frontend Component**: `react-frontend/src/pages/CandidateDashboard.tsx`
- **Frontend Styling**: `react-frontend/src/styles/Dashboard.css`

