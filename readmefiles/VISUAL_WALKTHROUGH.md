# Visual Walkthrough: Oracle Products & Roles Form

## Step-by-Step What You'll See

---

## STEP 1️⃣: Open Candidate Dashboard

**Location**: `http://localhost:3000`

```
┌─────────────────────────────────────────────┐
│  Candidate Dashboard                        │
│  [Edit Your Profile] [Skills] [Jobs]        │
└─────────────────────────────────────────────┘

Loading candidate profile...
```

---

## STEP 2️⃣: Click "Edit Your Profile" Tab

You'll see the profile form with sections:

```
┌─ Edit Your Profile ─────────────────────────┐
│                                             │
│ Basic Information                           │
│ ┌───────────────────────────────────────┐   │
│ │ Name: [___________________]           │   │
│ │ Email: [__@example.com]               │   │
│ │ Location: [___________________]       │   │
│ │ Years of Experience: [___]            │   │
│ │                                       │   │
│ │ Availability:                         │   │
│ │ [_________________________________]    │   │
│ │  (e.g., Immediately, 2 weeks, etc)   │   │
│ │                                       │   │
│ │ Work Type: [Remote ▼]                 │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ Product/Role Focus                          │
│ ┌───────────────────────────────────────┐   │
│ │ Product Vendor:                       │   │
│ │ [Oracle_______________] (disabled)    │   │
│ │                                       │   │
│ │ Product Type:                         │   │
│ │ [Select Product... ▼]                 │   │
│ │                                       │   │
│ │ (Primary Role field appears after     │   │
│ │  selecting product)                   │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ [Save Profile]                              │
└─────────────────────────────────────────────┘
```

---

## STEP 3️⃣: Click "Product Type" Dropdown

```
Before Click:
┌─ Product Type ─────────┐
│ [Select Product... ▼]   │
└────────────────────────┘

After Click (Dropdown Opens):
┌─ Product Type ─────────┐
│ [Select Product... ▼]   │  ← Click arrow
│ ┌──────────────────┐    │
│ │ SaaS             │ ←── Choose one
│ │ E-Business Suite │
│ │ PeopleSoft       │
│ │ JD Edwards       │
│ └──────────────────┘    │
└────────────────────────┘
```

**What's Happening Behind the Scenes:**
```
Browser Console:
✅ Loaded products for Oracle: ["SaaS", "E-Business Suite", "PeopleSoft", "JD Edwards"]
```

---

## STEP 4️⃣: Select a Product (Example: "SaaS")

```
Click on "SaaS":

┌─ Product Type ─────────┐
│ [SaaS ▼]               │  ← Product selected
└────────────────────────┘

NEW FIELD APPEARS:

┌─ Primary Role ─────────┐
│ [Select Role... ▼]     │  ← This field appears automatically
└────────────────────────┘
```

**What Happened:**
- Form state updated: `product = "SaaS"`
- Roles array cleared and ready for new data
- Primary Role dropdown becomes visible

---

## STEP 5️⃣: Click "Primary Role" Dropdown

```
Before Click:
┌─ Primary Role ─────────┐
│ [Select Role... ▼]      │
└────────────────────────┘

After Click (Dropdown Opens):
┌─ Primary Role ─────────────────────────┐
│ [Select Role... ▼]                      │
│ ┌──────────────────────────────────────┐│
│ │ Oracle Fusion Functional Consultant  ││ ← 7 roles
│ │ Oracle Fusion Technical Consultant   ││    for
│ │ Oracle Integration Cloud Developer   ││    SaaS
│ │ Oracle Reporting Consultant (OTBI)   ││    product
│ │ Oracle Cloud Architect               ││
│ │ Oracle Cloud Project Manager         ││
│ │ Oracle Cloud Security Consultant     ││
│ └──────────────────────────────────────┘│
└────────────────────────────────────────┘
```

**What's Happening Behind the Scenes:**
```
Browser Console:
✅ Loaded roles for Oracle - SaaS: ["Oracle Fusion Functional Consultant", ...]
```

---

## STEP 6️⃣: Select a Role (Example: "Oracle Fusion Functional Consultant")

```
Click on "Oracle Fusion Functional Consultant":

┌─ Primary Role ──────────────────────┐
│ [Oracle Fusion Functional Consult...▼]│  ← Role selected
└─────────────────────────────────────┘
```

**Form Data Now Contains:**
```javascript
{
  product: "SaaS",
  primary_role: "Oracle Fusion Functional Consultant",
  availability: "Your custom text",
  // ... other fields ...
}
```

---

## STEP 7️⃣: Fill in Other Fields

Scroll up and fill:
- **Name**: Your full name
- **Location**: Your location
- **Years of Experience**: Number
- **Availability**: Your custom text (e.g., "2 weeks notice")
- **Work Type**: Remote/On-site/Hybrid
- **Professional Summary**: Description

---

## STEP 8️⃣: Click "Save Profile"

```
Before Save:
[Save Profile]

During Save:
[Saving...] ← Button disabled, showing progress

After Save (Success):
✅ Profile saved successfully!
[Save Profile] ← Button re-enabled
```

---

## COMPLETE FORM VIEW

After all selections and scrolling, you'd see the complete "Product/Role Focus" section:

```
┌─────────────────────────────────────────────────┐
│ Product/Role Focus                              │
│                                                 │
│ Product Vendor:                                 │
│ ┌──────────────────────────────────────────┐    │
│ │ Oracle                           (gray)   │    │
│ └──────────────────────────────────────────┘    │
│                                                 │
│ Product Type:                                   │
│ ┌──────────────────────────────────────────┐    │
│ │ SaaS ▼                                    │    │
│ └──────────────────────────────────────────┘    │
│                                                 │
│ Primary Role:                                   │
│ ┌──────────────────────────────────────────┐    │
│ │ Oracle Fusion Functional Consultant ▼    │    │
│ └──────────────────────────────────────────┘    │
│                                                 │
│ Professional Summary:                           │
│ ┌──────────────────────────────────────────┐    │
│ │ Experienced Oracle Fusion consultant     │    │
│ │ with 5+ years in ERP implementations... │    │
│ │                                          │    │
│ │                                          │    │
│ └──────────────────────────────────────────┘    │
│                                                 │
│ [Save Profile]                                  │
└─────────────────────────────────────────────────┘
```

---

## Dropdown Content for All Products

### When You Select **SaaS** (7 roles appear):
```
□ Oracle Fusion Functional Consultant
□ Oracle Fusion Technical Consultant
□ Oracle Integration Cloud (OIC) Developer
□ Oracle Reporting Consultant (OTBI/BIP)
□ Oracle Cloud Architect
□ Oracle Cloud Project Manager
□ Oracle Cloud Security Consultant
```

### When You Select **E-Business Suite** (7 roles appear):
```
□ Oracle EBS Functional Consultant
□ Oracle EBS Technical Consultant
□ Oracle EBS Developer (PL/SQL, Forms/OAF)
□ Oracle EBS Techno-Functional Consultant
□ Oracle EBS DBA
□ Oracle Workflow Specialist
□ Oracle EBS Project Manager
```

### When You Select **PeopleSoft** (6 roles appear):
```
□ PeopleSoft HCM Consultant
□ PeopleSoft Finance Consultant
□ PeopleSoft Developer
□ PeopleSoft Integration Specialist
□ PeopleSoft Admin/DBA
□ PeopleSoft Analyst
```

### When You Select **JD Edwards** (5 roles appear):
```
□ JDE Functional Consultant
□ JDE Technical Developer
□ JDE CNC Administrator
□ JDE Business Analyst
□ JDE Architect
```

---

## Browser Console Output

**When page loads:**
```
✅ Loaded products for Oracle: ["SaaS", "E-Business Suite", "PeopleSoft", "JD Edwards"]
```

**When you click on a product dropdown:**
```
✅ Loaded roles for Oracle - SaaS: ["Oracle Fusion Functional Consultant", "Oracle Fusion Technical Consultant", ...]
```

---

## Availability Field Examples

The **Availability** field accepts any custom text:

```
Examples:
✅ "Immediately"
✅ "2 weeks notice"
✅ "Starting Jan 15, 2026"
✅ "Available from Feb 1"
✅ "After current project (3-4 weeks)"
✅ "Flexible - Can start anytime"
✅ "Available evenings/weekends"
✅ "Notice period negotiable"
```

---

## Color Scheme & Visual Design

```
Product Vendor Field:
┌──────────────────────────────┐
│ Oracle                       │  ← Gray background (disabled)
└──────────────────────────────┘   Light gray text

Product Type & Role Dropdowns:
┌──────────────────────────────┐
│ [Select Product... ▼]        │  ← White background (active)
└──────────────────────────────┘   Blue border on focus

Save Button:
[Save Profile]  ← Blue background when active
[Saving...]     ← Disabled during submission
```

---

## Summary

| Field | Type | Input | Auto-Populates |
|-------|------|-------|---|
| Product Vendor | Text Input | "Oracle" (Fixed) | N/A |
| Product Type | Dropdown | Choose 1 of 4 | On page load |
| Primary Role | Dropdown | Choose from list | When product selected |
| Availability | Text Input | Custom text | User types |

---

**This is exactly what candidates will see and interact with!**

Refer to [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed step-by-step testing instructions.

