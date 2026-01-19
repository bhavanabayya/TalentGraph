# Job Preferences Testing Guide

## Setup & Running

### 1. Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies (if needed)
pip install -r requirements.txt

# Run the server with auto-reload
uvicorn app.main:app --reload
```

Server will be available at: `http://localhost:8000`

### 2. Frontend Setup

```powershell
# Navigate to react-frontend directory
cd react-frontend

# Install dependencies (if not done yet)
npm install

# Start the development server
npm start
```

Frontend will be available at: `http://localhost:3000`

---

## Testing Workflow

### Step 1: Create a Candidate Account

1. Go to `http://localhost:3000`
2. Click **Sign Up**
3. Enter email and password (must include uppercase, number, special char)
4. Select **"candidate"** as user type
5. Click **Sign Up**
6. Complete OTP verification (check console or modify for testing)
7. You should be redirected to candidate dashboard

### Step 2: Access Profile Dashboard

1. Navigate to `http://localhost:3000/profile-dashboard`
2. You should see:
   - Your profile name & location
   - "Total Profiles: 0" (since no preferences yet)
   - "Your Job Preference Profiles" section showing empty state
   - Button to "Create Your First Preference"

### Step 3: Create Your First Job Preference

**Option A: From Profile Dashboard**
- Click "Create Your First Preference" button
- OR click "+ New Preference" button

**Option B: Direct Navigation**
- Navigate to `http://localhost:3000/job-preferences`

### Step 4: Fill Out Preference Form

#### Section 1: Product Selection
1. **Product Author**: Select "Oracle"
2. **Product**: Select one of:
   - SaaS (Oracle Fusion)
   - E-Business Suite
   - PeopleSoft
   - JD Edwards

#### Section 2: Role Selection
3. **Roles**: Check multiple roles (e.g., "Oracle Fusion Functional Consultant", "Oracle Fusion Technical Consultant")

#### Section 3: Profile Details
4. **Preference Name**: e.g., "Senior Oracle Fusion Consultant - Remote"
5. **Min Experience**: 3 years
6. **Max Experience**: 8 years
7. **Seniority Level**: Select "Senior"

#### Section 4: Rate
8. **Hourly Rate Min**: 100
9. **Hourly Rate Max**: 200

#### Section 5: Work Preferences
10. **Work Type**: Select "Hybrid"
11. **Location Preferences**: 
    - Type: "San Francisco"
    - Click "Add"
    - Type: "New York"
    - Click "Add"

#### Section 6: Skills
12. **Required Skills**:
    - Select a skill from dropdown (e.g., "Oracle Fusion")
    - Click "Add"
    - Repeat for multiple skills

#### Section 7: Availability
13. **Availability**: Select "Immediately"

### Step 5: Save Preference

1. Click **"Save Preference"** button
2. Form should close
3. Your preference should appear in the list below as a card

### Step 6: View Preference Card

You should see a card displaying:
- Preference name
- Status badge (Active/Inactive)
- **Roles**: Listed as blue tags
- **Seniority**: Senior
- **Experience**: 3-8 yrs
- **Rate**: $100-$200/hr
- **Work Type**: Hybrid
- **Required Skills**: Listed as purple tags
- **Edit** and **Delete** buttons at bottom

### Step 7: Edit Preference

1. Click **"Edit"** button on preference card
2. Form reopens with current values filled
3. Make changes (e.g., change rate to $120-$180)
4. Click **"Update Preference"**
5. Card should update with new values

### Step 8: Create Second Preference

1. Click **"+ Create New Preference"** button
2. Create another preference for different product:
   - Author: Oracle
   - Product: E-Business Suite
   - Roles: "Oracle EBS Functional Consultant", "Oracle EBS Technical Consultant"
   - Name: "Oracle EBS - Mid Level"
   - Experience: 2-5 years
   - Rate: $80-$120/hr
   - Work Type: Remote
   - Skills: "Oracle EBS", "PL/SQL"
3. Save

### Step 9: View Profile Dashboard

1. Navigate to `/profile-dashboard`
2. You should see:
   - **Total Profiles: 2**
   - **Active Profiles: 2**
   - Two preference cards in grid layout
   - **Statistics Section** showing:
     - Experience Range: 2-8 years
     - Rate Range: $80-$200/hr
     - Total Skills: Multiple skills

### Step 10: Delete Preference

1. Click **Delete** button on any preference card
2. Confirm deletion
3. Card should disappear
4. Count should update

---

## API Testing with Curl

### Get All Preferences

```bash
curl -X GET http://localhost:8000/preferences/my-preferences \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
[
  {
    "id": 1,
    "candidate_id": 1,
    "product_author_id": 1,
    "product_id": 1,
    "roles": ["Oracle Fusion Functional Consultant"],
    "seniority_level": "Senior",
    "years_experience_min": 3,
    "years_experience_max": 8,
    "hourly_rate_min": 100,
    "hourly_rate_max": 200,
    "required_skills": ["Oracle Fusion", "PL/SQL"],
    "work_type": "Hybrid",
    "location_preferences": ["San Francisco", "New York"],
    "availability": "Immediately",
    "preference_name": "Senior Oracle Fusion Consultant",
    "is_active": true,
    "created_at": "2025-12-23T10:30:00",
    "updated_at": "2025-12-23T10:30:00"
  }
]
```

### Get Profile with Preferences

```bash
curl -X GET http://localhost:8000/preferences/my-profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "id": 1,
  "user_id": 1,
  "name": "John Doe",
  "location": "San Francisco",
  "profile_picture_path": null,
  "summary": "Experienced Oracle Consultant",
  "work_type": "Hybrid",
  "availability": "Immediately",
  "created_at": "2025-12-23T09:00:00",
  "updated_at": "2025-12-23T09:00:00",
  "job_preferences": [
    {
      "id": 1,
      "candidate_id": 1,
      "product_author_id": 1,
      "product_id": 1,
      ...
    },
    {
      "id": 2,
      "candidate_id": 1,
      "product_author_id": 1,
      "product_id": 2,
      ...
    }
  ]
}
```

---

## Troubleshooting

### Issue: "Product author not found"
- **Solution**: Ensure you select from the available authors loaded from `roles.json`
- **Check**: Go to `http://localhost:8000/docs` and test `/job-roles/authors` endpoint

### Issue: "Product not found for this author"
- **Solution**: Make sure you selected both author AND product before selecting roles
- **Check**: The product dropdown should populate after selecting author

### Issue: Preferences not loading
- **Solution**: Check browser console for errors
- **Check**: Ensure JWT token is valid (check localStorage: `access_token`)
- **Verify**: Backend is running on `http://localhost:8000`

### Issue: Form not submitting
- **Solution**: Check all required fields are filled:
  - Product Author *
  - Product *
  - At least one Role *
- **Check**: Browser console for validation errors

### Issue: Ontology data not loading (empty dropdowns)
- **Solution**: Verify `roles.json` exists and is valid JSON
- **Check**: Restart backend server
- **Verify**: `GET /job-roles/authors` returns data

---

## Database Verification

### Check if Preferences Table Exists

```python
# Connect to SQLite database
import sqlite3

conn = sqlite3.connect('moblyze_poc.db')
cursor = conn.cursor()

# List all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print(tables)

# Query preferences
cursor.execute("SELECT * FROM candidatejobpreference")
preferences = cursor.fetchall()
print(f"Total preferences: {len(preferences)}")
```

---

## Performance Notes

- **JSON Storage**: Skills, roles, and locations are stored as JSON strings
- **Scalability**: System supports unlimited preferences per candidate
- **Matching**: Ready for future implementation of preference-to-job matching

---

## Next Steps

After testing:

1. **Integrate with matching logic** to suggest jobs based on preferences
2. **Add preference templates** for quick profile creation
3. **Implement preference analytics** to track which preferences get most interest
4. **Build preference comparison** UI to compare multiple preferences side-by-side
5. **Add preference sharing** for recruiter collaboration

---

## Sample Test Data

### Test Preference 1: Oracle Fusion Senior
```
Product Author: Oracle
Product: SaaS
Roles: [Oracle Fusion Functional Consultant, Oracle Fusion Technical Consultant]
Experience: 5-10 years
Seniority: Senior
Rate: $120-$200/hr
Work Type: Hybrid
Locations: [San Francisco, New York, Remote]
Skills: [Oracle Fusion, PL/SQL, Integration Cloud]
Availability: Immediately
```

### Test Preference 2: Oracle EBS Mid
```
Product Author: Oracle
Product: E-Business Suite
Roles: [Oracle EBS Functional Consultant, Oracle EBS Developer]
Experience: 2-5 years
Seniority: Mid
Rate: $80-$130/hr
Work Type: Remote
Locations: [Remote, Austin, Dallas]
Skills: [Oracle EBS, PL/SQL, Forms/OAF]
Availability: 2 weeks
```

### Test Preference 3: PeopleSoft HCM
```
Product Author: Oracle
Product: PeopleSoft
Roles: [PeopleSoft HCM Consultant, PeopleSoft Developer]
Experience: 3-7 years
Seniority: Mid
Rate: $90-$140/hr
Work Type: On-site
Locations: [Chicago, Boston]
Skills: [PeopleSoft HCM, PeopleCode, COBOL]
Availability: 1 month
```

---

## Success Criteria

✅ Can create preferences with multiple roles  
✅ Preferences save and display on dashboard  
✅ Can edit preferences and changes persist  
✅ Can delete preferences  
✅ Profile dashboard shows all preferences in grid layout  
✅ Statistics calculate correctly  
✅ Skills and locations display as tags  
✅ Ontology cascading dropdowns work properly  
✅ Backend API returns proper validation errors  
✅ Frontend handles errors gracefully  

Happy Testing! 🚀
