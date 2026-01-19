# Job Preferences Implementation Guide

## Overview

This implementation adds a **multi-profile job preference system** to the talent marketplace. Instead of having a single profile, candidates can now create multiple job preference profiles, each tailored to different product types, roles, experience levels, rates, and skills.

## Architecture

### Database Model

**New Table: `CandidateJobPreference`**

```
CandidateJobPreference
├── candidate_id (FK → Candidate)
├── product_author_id (FK → ProductAuthor, e.g., Oracle)
├── product_id (FK → Product, e.g., Oracle Fusion)
├── roles (JSON array: ["Oracle Fusion Functional Consultant", "Oracle Fusion Technical Consultant"])
├── seniority_level (Junior / Mid / Senior)
├── years_experience_min (e.g., 2)
├── years_experience_max (e.g., 7)
├── hourly_rate_min (e.g., 75.00)
├── hourly_rate_max (e.g., 150.00)
├── required_skills (JSON array: ["Oracle Fusion", "PL/SQL", "OIC"])
├── work_type (Remote / On-site / Hybrid)
├── location_preferences (JSON array: ["San Francisco", "New York"])
├── availability (Immediately / 2 weeks / 1 month)
├── preference_name (e.g., "Senior Oracle Fusion Consultant")
├── is_active (boolean)
├── created_at
└── updated_at
```

**Updated Candidate Model**

- Removed single product/role fields
- Removed single rate fields
- Added relationship to `job_preferences` (one-to-many)
- Simplified to core profile info: name, location, summary, availability

---

## Backend API Endpoints

### Job Preferences API (`/preferences`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **POST** | `/preferences/create` | Create new job preference |
| **GET** | `/preferences/my-preferences` | Get all candidate's preferences |
| **GET** | `/preferences/my-profile` | Get full profile + all preferences (dashboard) |
| **GET** | `/preferences/{preference_id}` | Get specific preference |
| **PUT** | `/preferences/{preference_id}` | Update preference |
| **DELETE** | `/preferences/{preference_id}` | Delete preference |

### Request Examples

**Create Preference**
```json
POST /preferences/create
{
  "product_author_id": 1,
  "product_id": 5,
  "roles": ["Oracle Fusion Functional Consultant", "Oracle Fusion Technical Consultant"],
  "seniority_level": "Senior",
  "years_experience_min": 5,
  "years_experience_max": 10,
  "hourly_rate_min": 100,
  "hourly_rate_max": 200,
  "required_skills": ["Oracle Fusion", "PL/SQL", "Integration Cloud"],
  "work_type": "Hybrid",
  "location_preferences": ["San Francisco", "New York", "Remote"],
  "availability": "Immediately",
  "preference_name": "Senior Oracle Fusion - Hybrid Role"
}
```

---

## Frontend Components

### 1. **JobPreferencesPage** (`src/pages/JobPreferencesPage.tsx`)

**Purpose**: Manage (create, edit, delete) job preferences

**Features**:
- Form to create/edit preferences with multi-select roles
- Dynamic product & role selection based on Oracle ontology
- Add/remove required skills from dropdown
- Add/remove location preferences
- Display all preferences as cards
- Edit/Delete individual preferences

**Styling**: `src/styles/JobPreferences.css`

### 2. **ProfileDashboard** (`src/pages/ProfileDashboard.tsx`)

**Purpose**: Display candidate profile with all job preferences

**Features**:
- Profile header with name, location, summary
- Overview cards showing total & active preferences
- Grid of preference cards showing:
  - Roles tagged by preference
  - Experience range
  - Hourly rate
  - Work type
  - Required skills
  - Location preferences
- Statistics section (experience range, rate range, total skills)
- Link to edit preferences

**Styling**: `src/styles/ProfileDashboard.css`

---

## API Client Methods

**New in `src/api/client.ts`**:

```typescript
preferencesAPI = {
  create: (data: JobPreference) => POST /preferences/create
  getMyPreferences: () => GET /preferences/my-preferences
  getProfileWithPreferences: () => GET /preferences/my-profile
  getById: (preferenceId: number) => GET /preferences/{id}
  update: (preferenceId: number, data: Partial<JobPreference>) => PUT /preferences/{id}
  delete: (preferenceId: number) => DELETE /preferences/{id}
}
```

**New Interfaces**:
```typescript
JobPreference {
  id?: number
  candidate_id?: number
  product_author_id: number
  product_id: number
  roles: string[]
  seniority_level?: string
  years_experience_min?: number
  years_experience_max?: number
  hourly_rate_min?: number
  hourly_rate_max?: number
  required_skills?: string[]
  work_type?: string
  location_preferences?: string[]
  availability?: string
  preference_name?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

CandidateProfileWithPreferences {
  id: number
  user_id: number
  name: string
  location?: string
  profile_picture_path?: string
  summary?: string
  work_type?: string
  availability?: string
  created_at: string
  updated_at: string
  job_preferences: JobPreference[]
}
```

---

## Routes

**Updated `src/App.tsx`**:

| Route | Component | Access |
|-------|-----------|--------|
| `/profile-dashboard` | ProfileDashboard | Candidate only |
| `/job-preferences` | JobPreferencesPage | Candidate only |

---

## Data Flow

### Creating a Job Preference

1. **User navigates to** `/job-preferences`
2. **Component fetches**:
   - Ontology (Authors → Products → Roles)
   - Available skills
   - User's existing preferences
3. **User selects**:
   - Product Author (e.g., Oracle)
   - Product (e.g., Oracle Fusion)
   - Multiple roles
   - Experience range
   - Rate range
   - Skills
   - Work type & locations
4. **Form submits** to `POST /preferences/create`
5. **Backend**:
   - Validates product author & product exist
   - Stores roles/skills as JSON
   - Creates `CandidateJobPreference` record
   - Returns created preference
6. **Frontend** updates preferences list

### Viewing Profile Dashboard

1. **User navigates to** `/profile-dashboard`
2. **Component fetches** `GET /preferences/my-profile`
3. **Backend returns**:
   - Candidate profile info
   - All job preferences with parsed JSON fields
4. **Frontend displays**:
   - Profile header
   - Overview stats
   - Preference cards
   - Statistics

---

## Key Features

✅ **Multiple Profiles**: One candidate can have many job preferences  
✅ **Product-Centric**: Choose specific product (Oracle Fusion, EBS, etc.)  
✅ **Multi-Role Support**: Select multiple roles per preference  
✅ **Flexible Experience**: Min/max years for each preference  
✅ **Dynamic Rate**: Different hourly rates per preference  
✅ **Skill Matching**: Required skills associated with each preference  
✅ **Location Flexibility**: Multiple location preferences per profile  
✅ **Profile Management**: Easy edit/delete of preferences  
✅ **Dashboard View**: Visual overview of all preferences  
✅ **Active/Inactive**: Toggle preferences without deleting  

---

## Database Migration

When upgrading existing system:

1. The `CandidateJobPreference` table will be auto-created on app startup via `init_db()`
2. Existing `Candidate` records will have NULL values for removed fields
3. Candidates need to create new preferences via the UI
4. Legacy data in `product_author`, `product`, `primary_role` can be migrated if needed

---

## Testing Checklist

### Backend
- [ ] Create preference with multiple roles
- [ ] Fetch preferences list
- [ ] Update preference (change rates, skills, etc.)
- [ ] Delete preference
- [ ] Validate product author/product exist
- [ ] Test JWT authentication on all endpoints

### Frontend
- [ ] Load JobPreferencesPage
- [ ] Ontology cascading dropdowns work
- [ ] Can select multiple roles
- [ ] Add/remove skills
- [ ] Add/remove locations
- [ ] Submit creates preference
- [ ] Edit existing preference
- [ ] Delete with confirmation
- [ ] ProfileDashboard loads preferences
- [ ] Dashboard displays all preference cards correctly

---

## Future Enhancements

1. **Preference Templates**: Save common preferences as templates
2. **Job Matching**: Match job posts against all preferences
3. **Auto-Generation**: Generate preferences from resume
4. **Preference Analytics**: Track which preferences get most matches
5. **Bulk Operations**: Edit multiple preferences at once
6. **Preference Sharing**: Share preferences with recruiters
7. **Seniority Levels**: More granular seniority (L1, L2, L3, etc.)
8. **Remote Work Details**: Timezone preferences, overlap hours, etc.

---

## Support for Other Products

Currently configured for **Oracle** (SaaS, E-Business Suite, PeopleSoft, JD Edwards).

To add **SAP** or other products:

1. Update `roles.json` with SAP product structure
2. API automatically loads from `roles.json`
3. UI dynamically shows authors/products/roles
4. No backend code changes needed

---

## File Structure

```
backend/
├── app/
│   ├── models.py (+ CandidateJobPreference)
│   ├── schemas.py (+ JobPreference schemas)
│   ├── routers/
│   │   └── preferences.py (NEW)
│   ├── database.py (updated init_db)
│   └── main.py (+ preferences router)

react-frontend/
├── src/
│   ├── api/
│   │   └── client.ts (+ preferencesAPI)
│   ├── pages/
│   │   ├── JobPreferencesPage.tsx (NEW)
│   │   └── ProfileDashboard.tsx (NEW)
│   ├── styles/
│   │   ├── JobPreferences.css (NEW)
│   │   └── ProfileDashboard.css (NEW)
│   └── App.tsx (+ new routes)
```

---

## Summary

This implementation enables candidates to maintain **multiple job preference profiles** tailored to different products, roles, experience levels, and compensation expectations. The system is flexible, scalable, and ready for future enhancements like automated matching and preference templates.
