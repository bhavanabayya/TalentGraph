# Job Preferences - Quick Reference Card

## 🚀 Quick Start

```powershell
# Terminal 1: Backend
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload

# Terminal 2: Frontend  
cd react-frontend
npm start

# Visit http://localhost:3000 and sign up as candidate
```

---

## 📍 Key Routes

| Path | Purpose |
|------|---------|
| `/job-preferences` | Create/edit/manage job preferences |
| `/profile-dashboard` | View profile with all preferences |

---

## 🎨 UI Components

### JobPreferencesPage
- **Form**: Create/edit preferences with cascading dropdowns
- **List**: Display preferences as cards with edit/delete
- **Features**: Multi-role select, skill/location tags

### ProfileDashboard  
- **Header**: Profile info + avatar
- **Stats**: Total preferences, active count
- **Cards**: Display each preference with all details
- **Stats**: Experience range, rate range, skill count

---

## 📊 API Endpoints

```
POST   /preferences/create           - Create preference
GET    /preferences/my-preferences   - Get all preferences
GET    /preferences/my-profile       - Get profile + preferences (dashboard)
GET    /preferences/{id}             - Get specific preference
PUT    /preferences/{id}             - Update preference  
DELETE /preferences/{id}             - Delete preference
```

All require: `Authorization: Bearer {token}`

---

## 🗄️ Database Table

```
CandidateJobPreference
├── candidate_id (FK)
├── product_author_id (FK)
├── product_id (FK)
├── roles (JSON)
├── seniority_level
├── years_experience_min/max
├── hourly_rate_min/max
├── required_skills (JSON)
├── work_type
├── location_preferences (JSON)
├── availability
├── preference_name
├── is_active
├── created_at
└── updated_at
```

---

## 📋 Form Fields

**Required:**
- Product Author (Oracle, SAP, etc.)
- Product (Oracle Fusion, EBS, etc.)
- Roles (select multiple)

**Optional:**
- Preference Name
- Min/Max Experience (years)
- Seniority Level
- Hourly Rate Min/Max
- Work Type (Remote/Hybrid/On-site)
- Location Preferences (add multiple)
- Required Skills (add multiple)
- Availability

---

## 🔍 Test Workflow

1. **Sign Up** → Email, password, user_type="candidate"
2. **Navigate** → `/job-preferences`
3. **Create** → Fill form, select product, roles, rate, skills
4. **Save** → Click "Save Preference"
5. **View** → Go to `/profile-dashboard`
6. **Edit** → Click "Edit" on preference card
7. **Delete** → Click "Delete" (with confirmation)

---

## 📁 Files Modified/Created

### Backend
- `models.py` - Added CandidateJobPreference model
- `schemas.py` - Added preference schemas
- `routers/preferences.py` - NEW route file
- `database.py` - Updated init_db()
- `main.py` - Registered router

### Frontend
- `api/client.ts` - Added preferencesAPI
- `pages/JobPreferencesPage.tsx` - NEW component
- `pages/ProfileDashboard.tsx` - NEW component
- `styles/JobPreferences.css` - NEW styles
- `styles/ProfileDashboard.css` - NEW styles
- `App.tsx` - Added routes

### Documentation
- `JOB_PREFERENCES_IMPLEMENTATION.md` - Technical guide
- `JOB_PREFERENCES_TESTING.md` - Testing guide
- `JOB_PREFERENCES_SUMMARY.md` - Overview
- `JOB_PREFERENCES_CHECKLIST.md` - Progress tracking
- `JOB_PREFERENCES_QUICK_REF.md` - This file

---

## 🐛 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Product dropdown empty | Restart backend, check roles.json |
| Can't submit form | Check all required fields marked with * |
| Preferences not loading | Clear localStorage, ensure JWT valid |
| Database errors | Delete moblyze_poc.db, restart backend |
| Ontology not loading | Run GET /job-roles/authors in Swagger |

---

## 📊 Example Preference Data

```json
{
  "product_author_id": 1,
  "product_id": 5,
  "roles": [
    "Oracle Fusion Functional Consultant",
    "Oracle Fusion Technical Consultant"
  ],
  "seniority_level": "Senior",
  "years_experience_min": 5,
  "years_experience_max": 10,
  "hourly_rate_min": 120,
  "hourly_rate_max": 200,
  "required_skills": [
    "Oracle Fusion",
    "PL/SQL",
    "Integration Cloud"
  ],
  "work_type": "Hybrid",
  "location_preferences": [
    "San Francisco",
    "New York",
    "Remote"
  ],
  "availability": "Immediately",
  "preference_name": "Senior Oracle Fusion - Hybrid"
}
```

---

## 🎯 Key Features

✅ Multiple job preference profiles  
✅ Product-centric (Oracle, SAP, etc.)  
✅ Multi-role support per preference  
✅ Flexible experience ranges  
✅ Dynamic rate configurations  
✅ Skill-based matching ready  
✅ Work type & location flexibility  
✅ Active/inactive toggle  
✅ Full CRUD operations  
✅ Beautiful dashboard view  
✅ Mobile responsive  
✅ Full audit trail  

---

## 🔐 Security

- All endpoints require JWT Bearer token
- User can only access own preferences
- Product/product validation on backend
- No SQL injection (ORM + parameterized)
- CORS configured for localhost:3000

---

## 📈 What's Next

1. **Preference Matching**: Match job posts to preferences
2. **Templates**: Save/load preference templates
3. **Analytics**: Track which preferences get matches
4. **Resume Parsing**: Auto-generate from resume
5. **Recommendations**: ML-based role suggestions

---

## 📞 Documentation

- **Technical Details**: See `JOB_PREFERENCES_IMPLEMENTATION.md`
- **Step-by-Step Testing**: See `JOB_PREFERENCES_TESTING.md`
- **Full Overview**: See `JOB_PREFERENCES_SUMMARY.md`
- **Progress Tracking**: See `JOB_PREFERENCES_CHECKLIST.md`
- **API Docs**: Visit `http://localhost:8000/docs` (Swagger)

---

## ✅ Success Criteria

- [ ] Can create preference
- [ ] Preference appears in list
- [ ] Can edit preference
- [ ] Can delete preference
- [ ] Profile dashboard shows all preferences
- [ ] Statistics calculate correctly
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Database has records

---

**Ready to Test?** Follow `JOB_PREFERENCES_TESTING.md` for detailed instructions!

🚀 Happy coding!
