# Job Overview - Visual Reference Guide

## What Gets Displayed WHERE

### 1️⃣ RECRUITER PORTAL - Job Postings List View

**Page**: `http://localhost:3000/recruiter-job-posting`

**Each Job Card Shows**:

```
╔════════════════════════════════════════════════════════════════╗
║                                                    [Edit][Delete]║
║ Senior Oracle Fusion Consultant                                 ║
║ Oracle - Oracle Fusion - Functional Consultant                  ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║ Job Type          Duration       Start Date       Seniority     ║
║ Permanent         N/A           Jan 15, 2026      Senior        ║
║                                                                 ║
║ Work Type         Location       (If needed, more fields)       ║
║ Remote            San Francisco                                 ║
║                                                                 ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║ Currency          Hourly Rate                                   ║
║ USD               USD 75 - 100/hr                              ║
║                                                                 ║
╚════════════════════════════════════════════════════════════════╝
```

**Fields Displayed** ✅
- ✅ Job Title
- ✅ Product Author (Oracle)
- ✅ Product (Oracle Fusion)
- ✅ Role (Functional Consultant)
- ✅ Job Type (Permanent/Contract)
- ✅ Duration (Contract jobs only)
- ✅ Start Date
- ✅ Seniority Level
- ✅ Work Type (Remote/On-site/Hybrid)
- ✅ Location
- ✅ Currency
- ✅ Hourly Rate (Min - Max)

**NOT Displayed** ❌
- ❌ Job Description (excluded as requested)
- ❌ Required Skills (not applicable to recruiter)
- ❌ Company Name (recruiter's own company)

---

### 2️⃣ CANDIDATE PORTAL - Available Job Opportunities Feed

**Page**: `http://localhost:3000/candidate-dashboard` → Jobs Tab

**Each Job Card Shows**:

```
╔════════════════════════════════════════════════════════════════╗
║ Senior Oracle Fusion Consultant                                 ║
║ Product: Oracle - Oracle Fusion | Role: Functional Consultant  ║
║ Company: Tech Corp Inc                                          ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║ Job Type          Start Date       Seniority        Work Type  ║
║ Permanent        Jan 15, 2026       Senior           Remote     ║
║                                                                 ║
║ Location                                                        ║
║ San Francisco                                                   ║
║                                                                 ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║ Currency          Hourly Rate                                   ║
║ USD               USD 75 - 100/hr                              ║
║                                                                 ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║ Description                                                     ║
║ We are seeking an experienced Oracle Fusion Functional         ║
║ Consultant to support and implement Oracle Fusion Cloud        ║
║ ERP and HCM modules. This role will focus on...                ║
║ [First 300 characters]                                         ║
║                                                                 ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║ Required Skills:  [Oracle Fusion] [SQL] [HCM]  +2 more         ║
║                                                      [Apply]    ║
╚════════════════════════════════════════════════════════════════╝
```

**Fields Displayed** ✅
- ✅ Job Title
- ✅ Product Author (Oracle)
- ✅ Product (Oracle Fusion)
- ✅ Role (Functional Consultant)
- ✅ Company Name
- ✅ Job Type
- ✅ Duration (Contract jobs only)
- ✅ Start Date
- ✅ Seniority Level
- ✅ Work Type
- ✅ Location
- ✅ Currency
- ✅ Hourly Rate (Min - Max)
- ✅ Description (First 300 characters only)
- ✅ Required Skills (Top 3 shown as badges)

---

## Detailed Field Breakdown

### 📋 Basic Information Section

| Field | Format | Example | Where Shown |
|-------|--------|---------|-------------|
| **Job Title** | Large heading | Senior Oracle Fusion Consultant | Both |
| **Product Author** | Text | Oracle | Both |
| **Product** | Text | Oracle Fusion | Both |
| **Role** | Text | Functional Consultant | Both |
| **Company Name** | Text | Tech Corp Inc | Candidate only |

### 🔧 Employment Details Section

| Field | Format | Example | Where Shown |
|-------|--------|---------|-------------|
| **Job Type** | Badge | Permanent / Contract | Both |
| **Duration** | Text | 6 months | Both (contract only) |
| **Start Date** | Formatted date | Jan 15, 2026 | Both |
| **Seniority Level** | Text | Senior | Both |

### 🌍 Work Arrangements Section

| Field | Format | Example | Where Shown |
|-------|--------|---------|-------------|
| **Work Type** | Text | Remote / On-site / Hybrid | Both |
| **Location** | Text | San Francisco, CA | Both |

### 💰 Compensation Section

| Field | Format | Example | Where Shown |
|-------|--------|---------|-------------|
| **Currency** | Code | USD / EUR / GBP | Both |
| **Hourly Rate** | Range | USD 75 - 100/hr | Both |

### 📝 Content & Interaction Section

| Field | Format | Example | Where Shown |
|-------|--------|---------|-------------|
| **Description** | Truncated text | First 300 chars... | Candidate only |
| **Required Skills** | Badge tags | [Skill1][Skill2][Skill3] | Candidate only |
| **Action Buttons** | Buttons | Edit / Delete / Apply | Both (role-specific) |

---

## Real-World Example

### Job Posted by Recruiter in Oracle Company

**Recruiter Creates Job With**:
```
Title: Senior Oracle Fusion Consultant
Description: We are seeking an experienced Oracle Fusion Functional 
  Consultant to support and implement Oracle Fusion Cloud ERP...
Product Author: Oracle
Product: Oracle Fusion
Role: Functional Consultant
Job Type: Permanent
Start Date: 2026-01-15
Seniority: Senior
Work Type: Remote
Location: San Francisco, CA
Currency: USD
Min Rate: $75
Max Rate: $100
```

### What Recruiter Sees (Portal)

On Recruiter Job Postings page:
```
Senior Oracle Fusion Consultant
Oracle - Oracle Fusion - Functional Consultant

Job Type: Permanent    |    Start Date: Jan 15, 2026
Seniority: Senior      |    Work Type: Remote
Location: San Francisco

Currency: USD    |    Hourly Rate: USD 75 - 100/hr

[Edit] [Delete]
```

### What Candidate Sees (Feed)

On Candidate Available Jobs:
```
Senior Oracle Fusion Consultant
Product: Oracle - Oracle Fusion | Role: Functional Consultant
Company: [Recruiter's Company Name]

Job Type: Permanent    Start Date: Jan 15, 2026    Seniority: Senior    Work Type: Remote
Location: San Francisco

Currency: USD    Hourly Rate: USD 75 - 100/hr

Description:
We are seeking an experienced Oracle Fusion Functional Consultant to support 
and implement Oracle Fusion Cloud ERP and HCM modules. This role will focus on 
business process analysis, system configuration, data migration, and user enablement...

Required Skills: [Oracle Fusion] [SQL] [HCM] +2 more

[Apply]
```

---

## Display Features

### 1. Smart Currency Display
- Shows currency code (USD, EUR, GBP)
- Displays rate range if both min and max exist
- Falls back to single rate if only one specified
- "Not specified" if no rates given

### 2. Date Formatting
- Converts database format to readable: `2026-01-15` → `Jan 15, 2026`
- Shows "Flexible" if no start date specified
- Uses browser's locale settings

### 3. Conditional Fields
- **Duration**: Only shows for contract jobs
- **Skills**: Only shows in candidate feed, displays top 3 with "+N more"
- **Description**: Candidate feed shows first 300 characters with ellipsis

### 4. Responsive Layout
- **Desktop**: 4-5 column grid for details
- **Tablet**: 2-3 column grid
- **Mobile**: Single column, stacked layout

### 5. Professional Styling
- Color-coded labels (gray, uppercase)
- Proper typography hierarchy
- Subtle borders and shadows
- Clean spacing throughout

---

## Field Priority (What's Most Important)

### Recruiter View - Priority Order
1. Job Title - 🔴 Critical (what role is being filled)
2. Product/Role - 🔴 Critical (what technology/position)
3. Job Type - 🟠 High (permanent vs contract)
4. Compensation - 🟠 High (salary/rate info)
5. Seniority Level - 🟡 Medium (experience level)
6. Start Date - 🟡 Medium (when they need them)
7. Work Type/Location - 🟢 Low (logistics)

### Candidate View - Priority Order
1. Job Title - 🔴 Critical (is this role for me?)
2. Compensation - 🔴 Critical (am I interested in pay?)
3. Product/Role - 🔴 Critical (matches my expertise?)
4. Company - 🔴 Critical (who's hiring?)
5. Seniority - 🟠 High (fits my level?)
6. Skills Required - 🟠 High (can I do this?)
7. Work Type - 🟡 Medium (where/how will I work?)
8. Start Date - 🟡 Medium (when do they need someone?)

---

## Summary

✅ **Both portals now display comprehensive job information consistently**

- **Recruiter sees**: All job details they posted (except description)
- **Candidate sees**: Same details PLUS company name, skills, and brief description
- **Identical fields**: Product, Role, Job Type, Seniority, Work Type, Location, Currency, Rate, Start Date
- **Consistent formatting**: Same styles, layouts, and data handling across both portals
- **Professional presentation**: Clean grid layouts, proper spacing, responsive design
- **User-focused**: Information organized by relevance and importance

This provides candidates with all the information they need to evaluate job fit, while recruiters can see exactly what they posted.
