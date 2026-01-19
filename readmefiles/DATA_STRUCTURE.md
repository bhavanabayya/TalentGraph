# Complete Oracle Products & Roles Data Structure

## Data Source File: `backend/app/data/roles.json`

All products and roles are stored in this file with complete hierarchy.

---

## Oracle Vendor - Complete Breakdown

### 📦 Product 1: **SaaS** (7 Roles)

1. **Oracle Fusion Functional Consultant**
2. **Oracle Fusion Technical Consultant**
3. **Oracle Integration Cloud (OIC) Developer**
4. **Oracle Reporting Consultant (OTBI/BIP)**
5. **Oracle Cloud Architect**
6. **Oracle Cloud Project Manager**
7. **Oracle Cloud Security Consultant**

---

### 📦 Product 2: **E-Business Suite** (7 Roles)

1. **Oracle EBS Functional Consultant**
2. **Oracle EBS Technical Consultant**
3. **Oracle EBS Developer (PL/SQL, Forms/OAF)**
4. **Oracle EBS Techno-Functional Consultant**
5. **Oracle EBS DBA**
6. **Oracle Workflow Specialist**
7. **Oracle EBS Project Manager**

---

### 📦 Product 3: **PeopleSoft** (6 Roles)

1. **PeopleSoft HCM Consultant**
2. **PeopleSoft Finance Consultant**
3. **PeopleSoft Developer**
4. **PeopleSoft Integration Specialist**
5. **PeopleSoft Admin/DBA**
6. **PeopleSoft Analyst**

---

### 📦 Product 4: **JD Edwards** (5 Roles)

1. **JDE Functional Consultant**
2. **JDE Technical Developer**
3. **JDE CNC Administrator**
4. **JDE Business Analyst**
5. **JDE Architect**

---

## API Response Examples

### GET `/job-roles/products?author=Oracle`

**Response:**
```json
{
  "author": "Oracle",
  "products": [
    "SaaS",
    "E-Business Suite",
    "PeopleSoft",
    "JD Edwards"
  ]
}
```

---

### GET `/job-roles/roles?author=Oracle&product=SaaS`

**Response:**
```json
{
  "author": "Oracle",
  "product": "SaaS",
  "roles": [
    "Oracle Fusion Functional Consultant",
    "Oracle Fusion Technical Consultant",
    "Oracle Integration Cloud (OIC) Developer",
    "Oracle Reporting Consultant (OTBI/BIP)",
    "Oracle Cloud Architect",
    "Oracle Cloud Project Manager",
    "Oracle Cloud Security Consultant"
  ]
}
```

---

### GET `/job-roles/roles?author=Oracle&product=E-Business Suite`

**Response:**
```json
{
  "author": "Oracle",
  "product": "E-Business Suite",
  "roles": [
    "Oracle EBS Functional Consultant",
    "Oracle EBS Technical Consultant",
    "Oracle EBS Developer (PL/SQL, Forms/OAF)",
    "Oracle EBS Techno-Functional Consultant",
    "Oracle EBS DBA",
    "Oracle Workflow Specialist",
    "Oracle EBS Project Manager"
  ]
}
```

---

### GET `/job-roles/roles?author=Oracle&product=PeopleSoft`

**Response:**
```json
{
  "author": "Oracle",
  "product": "PeopleSoft",
  "roles": [
    "PeopleSoft HCM Consultant",
    "PeopleSoft Finance Consultant",
    "PeopleSoft Developer",
    "PeopleSoft Integration Specialist",
    "PeopleSoft Admin/DBA",
    "PeopleSoft Analyst"
  ]
}
```

---

### GET `/job-roles/roles?author=Oracle&product=JD Edwards`

**Response:**
```json
{
  "author": "Oracle",
  "product": "JD Edwards",
  "roles": [
    "JDE Functional Consultant",
    "JDE Technical Developer",
    "JDE CNC Administrator",
    "JDE Business Analyst",
    "JDE Architect"
  ]
}
```

---

## Total Count

| Metric | Count |
|--------|-------|
| Total Oracle Products | 4 |
| Total Oracle Roles | 25 |
| SaaS Roles | 7 |
| E-Business Suite Roles | 7 |
| PeopleSoft Roles | 6 |
| JD Edwards Roles | 5 |

---

## Frontend Implementation

### Data Loading Flow

```
1. Page Mount
   ↓
2. fetchAllData() called
   ↓
3. jobRolesAPI.getProducts('Oracle') called
   ↓
4. products state = ["SaaS", "E-Business Suite", "PeopleSoft", "JD Edwards"]
   ↓
5. Product Type dropdown populated with 4 options
```

### Role Loading Flow

```
1. Candidate selects product from dropdown
   (e.g., "SaaS")
   ↓
2. formData.product = "SaaS"
   ↓
3. Primary Role dropdown appears
   ↓
4. When candidate clicks Role dropdown
   ↓
5. handleLoadRoles('Oracle', 'SaaS') called
   ↓
6. jobRolesAPI.getRoles('Oracle', 'SaaS') called
   ↓
7. roles state = [7 SaaS roles array]
   ↓
8. Role dropdown populated with 7 options
```

---

## Code Implementation References

### Backend (FastAPI)
**File:** `backend/app/routers/job_roles.py`

```python
@router.get("/products")
def get_products(author: str):
    # Returns list of products for author
    # For Oracle: ["SaaS", "E-Business Suite", "PeopleSoft", "JD Edwards"]

@router.get("/roles")
def get_roles(author: str, product: str):
    # Returns list of roles for author + product combination
    # For Oracle + SaaS: [7 roles]
```

### Frontend (React)
**File:** `react-frontend/src/pages/CandidateDashboard.tsx`

```typescript
// Fetch products on page load
const fetchAllData = async () => {
  const productsRes = await jobRolesAPI.getProducts('Oracle');
  setProducts(productsRes.data); // Array of 4 products
}

// Fetch roles when product selected
const handleLoadRoles = async (author: string, product: string) => {
  const res = await jobRolesAPI.getRoles(author, product);
  setRoles(res.data); // Array of roles for that product
}
```

---

## Current Status ✅

- ✅ All data properly stored in `roles.json`
- ✅ Backend APIs returning correct data
- ✅ Frontend dropdowns configured to display products and roles
- ✅ Product Vendor field hardcoded to "Oracle"
- ✅ Availability field accepts custom text input
- ✅ Role dropdown auto-populates based on product selection

**Ready for Testing!** See [TESTING_GUIDE.md](TESTING_GUIDE.md) for step-by-step verification.

