# Complete Job Details Display - Implementation Map

## Visual Display Structure

### 🔴 RECRUITER PORTAL - Job Overview Card

```
╔══════════════════════════════════════════════════════════════════╗
║ HEADER SECTION                                                    ║
║ ┌──────────────────────────────────────────────────────────────┐ ║
║ │ Senior Oracle Fusion Consultant               [Edit] [Delete]  │ ║
║ │ Oracle - Oracle Fusion - Functional Consultant                 │ ║
║ └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║ DETAILS GRID SECTION                                              ║
║ ┌──────────────────────────────────────────────────────────────┐ ║
║ │                                                              │ ║
║ │ Job Type             Duration (Contract only)               │ ║
║ │ Permanent            6 months                               │ ║
║ │                                                              │ ║
║ │ Start Date           Seniority Level                        │ ║
║ │ Jan 15, 2026         Senior                                 │ ║
║ │                                                              │ ║
║ │ Work Type            Location                               │ ║
║ │ Remote               San Francisco, CA                      │ ║
║ │                                                              │ ║
║ └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║ COMPENSATION SECTION                                              ║
║ ┌──────────────────────────────────────────────────────────────┐ ║
║ │                                                              │ ║
║ │ Currency             Hourly Rate                            │ ║
║ │ USD                  USD 75 - 100/hr                        │ ║
║ │                                                              │ ║
║ └──────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════╝

LEGEND:
- Header: Job title, product info, action buttons
- Details: Grid of 2-3 columns (responsive)
- Compensation: Currency and hourly rate range
- All fields have labels and values
```

---

### 🔵 CANDIDATE PORTAL - Job Opportunity Card

```
╔══════════════════════════════════════════════════════════════════╗
║ HEADER SECTION                                                    ║
║ ┌──────────────────────────────────────────────────────────────┐ ║
║ │ Senior Oracle Fusion Consultant                               │ ║
║ │ Product: Oracle - Oracle Fusion | Role: Functional Consultant │ ║
║ │ Company: Tech Corp Inc                                         │ ║
║ └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║ DETAILS GRID SECTION                                              ║
║ ┌──────────────────────────────────────────────────────────────┐ ║
║ │                                                              │ ║
║ │ Job Type             Start Date           Seniority          │ ║
║ │ Permanent            Jan 15, 2026         Senior             │ ║
║ │                                                              │ ║
║ │ Work Type            Location                                │ ║
║ │ Remote               San Francisco, CA                       │ ║
║ │                                                              │ ║
║ └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║ COMPENSATION SECTION                                              ║
║ ┌──────────────────────────────────────────────────────────────┐ ║
║ │                                                              │ ║
║ │ Currency             Hourly Rate                            │ ║
║ │ USD                  USD 75 - 100/hr                        │ ║
║ │                                                              │ ║
║ └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║ DESCRIPTION SECTION                                               ║
║ ┌──────────────────────────────────────────────────────────────┐ ║
║ │                                                              │ ║
║ │ Description                                                  │ ║
║ │ We are seeking an experienced Oracle Fusion Functional      │ ║
║ │ Consultant to support and implement Oracle Fusion Cloud ERP │ ║
║ │ and HCM modules. This role will focus on business process...│ ║
║ │ [First 300 characters only, truncated with ...]            │ ║
║ │                                                              │ ║
║ └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║ SKILLS & ACTION SECTION                                           ║
║ ┌──────────────────────────────────────────────────────────────┐ ║
║ │                                                              │ ║
║ │ Required Skills: [Oracle Fusion] [SQL] [HCM]  +2 more      │ ║
║ │                                                      [Apply] │ ║
║ │                                                              │ ║
║ └──────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════╝

LEGEND:
- Header: Job title, product/role, company
- Details: Responsive grid showing employment terms
- Compensation: Clear currency and rate display
- Description: Preview of full description (300 chars)
- Skills: Top 3 as badges with count of remaining
- Action: Apply button
```

---

## Field Display Matrix

### Which Fields Display In Each Section

#### HEADER SECTION
| Recruiter | Candidate |
|-----------|-----------|
| Job Title | Job Title |
| Product Author | Product Author |
| Product | Product |
| Role | Role |
| (Buttons) | Company Name |

#### DETAILS GRID
| Recruiter | Candidate |
|-----------|-----------|
| Job Type | Job Type |
| Duration | Duration |
| Start Date | Start Date |
| Seniority | Seniority |
| Work Type | Work Type |
| Location | Location |

#### COMPENSATION
| Recruiter | Candidate |
|-----------|-----------|
| Currency | Currency |
| Hourly Rate | Hourly Rate |

#### ADDITIONAL (Candidate Only)
| Recruiter | Candidate |
|-----------|-----------|
| N/A | Description (300 chars) |
| N/A | Required Skills (badges) |
| N/A | Apply Button |

---

## Data Flow & Transformations

### Recruiter Form → Job Posted → Recruiter Views Overview

```
Form Fields Filled:
├─ title: "Senior Oracle Fusion Consultant"
├─ description: "We are seeking..."
├─ product_author: "Oracle"
├─ product: "Oracle Fusion"
├─ role: "Functional Consultant"
├─ seniority: "Senior"
├─ job_type: "Permanent"
├─ duration: null (not applicable)
├─ start_date: "2026-01-15"
├─ work_type: "Remote"
├─ location: "San Francisco, CA"
├─ currency: "USD"
├─ min_rate: 75
└─ max_rate: 100

Stored in Database:
├─ jobposts.title: "Senior Oracle Fusion Consultant"
├─ jobposts.description: "We are seeking..."
├─ jobposts.product_author: "Oracle"
├─ ... (all fields)

Displayed in Recruiter Overview:
├─ Title: ✅ Shown
├─ Description: ❌ NOT shown (excluded as requested)
├─ Product Author: ✅ Shown
├─ Product: ✅ Shown
├─ Role: ✅ Shown
├─ Seniority: ✅ Shown
├─ Job Type: ✅ Shown
├─ Duration: ✅ Shown (if contract)
├─ Start Date: ✅ Shown (formatted)
├─ Work Type: ✅ Shown
├─ Location: ✅ Shown
├─ Currency: ✅ Shown
├─ Hourly Rate: ✅ Shown (min-max)
└─ Actions: ✅ Edit/Delete available
```

### Database → Candidate Fetches → Candidate Sees Overview

```
API Endpoint: GET /jobs/available
Returns:
├─ id: 1
├─ title: "Senior Oracle Fusion Consultant"
├─ description: "We are seeking..."
├─ product_author: "Oracle"
├─ product: "Oracle Fusion"
├─ role: "Functional Consultant"
├─ seniority: "Senior"
├─ job_type: "Permanent"
├─ duration: null
├─ start_date: "2026-01-15"
├─ work_type: "Remote"
├─ location: "San Francisco, CA"
├─ currency: "USD"
├─ min_rate: 75
├─ max_rate: 100
├─ company_name: "Tech Corp Inc"
└─ required_skills: ["Oracle Fusion", "SQL", "HCM", "PL/SQL", "FDDI"]

Displayed in Candidate Feed:
├─ Title: ✅ "Senior Oracle Fusion Consultant"
├─ Product: ✅ "Oracle - Oracle Fusion"
├─ Role: ✅ "Functional Consultant"
├─ Company: ✅ "Tech Corp Inc"
├─ Job Type: ✅ "Permanent"
├─ Duration: ✅ N/A (not contract)
├─ Start Date: ✅ "Jan 15, 2026" (formatted)
├─ Seniority: ✅ "Senior"
├─ Work Type: ✅ "Remote"
├─ Location: ✅ "San Francisco, CA"
├─ Currency: ✅ "USD"
├─ Hourly Rate: ✅ "USD 75 - 100/hr"
├─ Description: ✅ First 300 chars + "..."
├─ Skills: ✅ [Oracle Fusion] [SQL] [HCM] +2 more
└─ Action: ✅ Apply button
```

---

## Responsive Grid Breakpoints

### Desktop (1200px+)
```
Details Grid: 4 columns
├─ Column 1: Job Type, Duration, etc
├─ Column 2: Start Date, Seniority, etc
├─ Column 3: Work Type, Location, etc
└─ Column 4: Additional info if needed
```

### Tablet (768px - 1199px)
```
Details Grid: 2-3 columns
├─ Column 1: Job Type, Start Date, etc
├─ Column 2: Seniority, Work Type, etc
└─ Column 3: Location, Additional info
```

### Mobile (< 768px)
```
Details Grid: 1-2 columns
├─ Column 1: Job Type, Start Date, Seniority
└─ Column 2: Work Type, Location
(Stacked vertically for readability)
```

---

## Label & Value Styling

### Label Style
```css
fontSize: '12px'
fontWeight: '600'
color: '#999'
textTransform: 'uppercase'
margin: '0 0 4px 0'
```
Example: "JOB TYPE" in gray, small, uppercase

### Value Style
```css
fontSize: '14px'
color: '#2c3e50'
fontWeight: '500'
margin: 0
```
Example: "Permanent" in dark blue-gray

### Special: Compensation Value
```css
fontSize: '14px'
color: '#27ae60' /* Green for emphasis */
fontWeight: '600'
```
Example: "USD 75 - 100/hr" in green

---

## Conditional Display Rules

### Shows Only If:

**Duration Field**:
```
IF job_type === 'Contract' AND duration EXISTS
  THEN show duration field
  ELSE hide duration field
```

**Start Date Format**:
```
IF start_date EXISTS
  THEN show formatted date (Jan 15, 2026)
  ELSE show "Flexible"
```

**Hourly Rate**:
```
IF min_rate AND max_rate EXIST
  THEN show "{currency} {min} - {max}/hr"
ELSE IF min_rate EXISTS
  THEN show "{currency} {min}+/hr"
ELSE IF max_rate EXISTS
  THEN show "up to {currency} {max}/hr"
ELSE
  THEN show "Not specified"
```

**Skills (Candidate Only)**:
```
IF required_skills.length > 0
  THEN show first 3 as badges
       IF more than 3 exist
         THEN show "+N more"
ELSE
  THEN show "Not specified"
```

**Description (Candidate Only)**:
```
IF description.length > 300
  THEN show first 300 characters + "..."
ELSE
  THEN show full description
```

---

## Comparison Table

### Side-by-Side Field Display

| Field | Recruiter Portal | Candidate Portal | Display Format |
|-------|------------------|------------------|-----------------|
| Title | Header, Large | Header, Large | Text, 20px |
| Product Author | Subtitle | Header line | Text, 14px |
| Product | Subtitle | Header line | Text, 14px |
| Role | Subtitle | Header line | Text, 14px |
| Company | ✗ | Header line | Text, 13px |
| Job Type | Grid cell | Grid cell | Value, 14px |
| Duration | Grid cell | Grid cell | Value, 14px |
| Start Date | Grid cell | Grid cell | Formatted date |
| Seniority | Grid cell | Grid cell | Value, 14px |
| Work Type | Grid cell | Grid cell | Value, 14px |
| Location | Grid cell | Grid cell | Value, 14px |
| Currency | Section | Section | Value, 14px |
| Hourly Rate | Section, Green | Section, Green | Range, 14px, #27ae60 |
| Description | ✗ (excluded) | Truncated | 300 chars max |
| Skills | ✗ | Badges | Top 3 + count |
| Actions | Edit, Delete | Apply | Buttons |

---

## Summary

**Total Fields Displayed**:
- **Recruiter Portal**: 12 fields (all except description)
- **Candidate Portal**: 15 fields (all except edit/delete)

**Information Coverage**:
- **100%** of form fields visible (except description on recruiter side)
- **Consistent** across both portals
- **Professional** styling and layout
- **Responsive** on all devices

**User Experience**:
- **Clear** information hierarchy
- **Professional** appearance
- **Easy** to scan
- **Mobile-friendly**
- **Accessible**

---

## Status

✅ **FULLY IMPLEMENTED AND READY**

Both portals now display comprehensive job details in a professional, user-friendly format with all relevant information clearly organized.
