# Skills Integration - Backend & Frontend TODO

## ✅ Completed Tasks

### Frontend
- [x] Import SkillSelector component in CandidateDashboard
- [x] Add skillsInput and prefSkillsInput state management
- [x] Add skills section to Main Profile form (conditional on product + role)
- [x] Add skills section to Job Preference Profile form (conditional on product + role)
- [x] Update SkillSelector component to accept technicalSkills and softSkills props
- [x] Make component props flexible (availableSkills, technicalSkills, softSkills)
- [x] React build succeeds with no errors

## 🔄 In Progress

None currently

## ⏳ Pending Tasks

### Backend Model Updates

#### 1. Update CandidateJobPreference Model
**File**: `backend/app/models.py`

**Current**:
```python
class CandidateJobPreference(SQLModel, table=True):
    # existing fields...
    summary: Optional[str] = None
```

**Need to Add**:
```python
from sqlalchemy import JSON
from typing import Optional, List

class CandidateJobPreference(SQLModel, table=True):
    # ... existing fields ...
    
    # New field to store job preference skills
    required_skills: Optional[str] = Field(
        default=None,
        sa_column=Column(JSON),
        description="JSON array of skills for this preference: [{name, rating}, ...]"
    )
```

#### 2. Update Preference Schemas
**File**: `backend/app/schemas.py`

**Add SkillItem model**:
```python
from typing import List

class SkillItem(BaseModel):
    name: str
    rating: int  # 1-5
    
    class Config:
        json_schema_extra = {
            "example": [
                {"name": "React", "rating": 5},
                {"name": "TypeScript", "rating": 4},
                {"name": "Leadership", "rating": 3}
            ]
        }
```

**Update CandidateJobPreferenceCreate**:
```python
class CandidateJobPreferenceCreate(BaseModel):
    # ... existing fields ...
    required_skills: Optional[List[SkillItem]] = Field(
        default_factory=list,
        description="Skills required or preferred for this role"
    )
```

**Update CandidateJobPreferenceUpdate**:
```python
class CandidateJobPreferenceUpdate(BaseModel):
    # ... existing fields ...
    required_skills: Optional[List[SkillItem]] = None
```

**Update CandidateJobPreferenceRead**:
```python
class CandidateJobPreferenceRead(CandidateJobPreferenceCreate):
    id: int
    candidate_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    required_skills: Optional[List[SkillItem]] = None
```

### Backend API Updates

#### 3. Update Preference Router
**File**: `backend/app/routers/preferences.py`

**In create_preference() function**:
```python
@router.post("/", response_model=CandidateJobPreferenceRead)
async def create_preference(
    pref: CandidateJobPreferenceCreate,
    session: Session = Depends(get_session),
    current_user: str = Depends(require_token)
):
    candidate = session.exec(
        select(Candidate).where(Candidate.email == current_user)
    ).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Handle skills - store as JSON string
    db_pref = CandidateJobPreference(
        **pref.dict(exclude={"required_skills"}),
        candidate_id=candidate.id,
        required_skills=json.dumps(pref.required_skills) if pref.required_skills else None
    )
    
    session.add(db_pref)
    session.commit()
    session.refresh(db_pref)
    return db_pref
```

**In update_preference() function**:
```python
@router.put("/{pref_id}", response_model=CandidateJobPreferenceRead)
async def update_preference(
    pref_id: int,
    pref: CandidateJobPreferenceUpdate,
    session: Session = Depends(get_session),
    current_user: str = Depends(require_token)
):
    candidate = session.exec(
        select(Candidate).where(Candidate.email == current_user)
    ).first()
    
    db_pref = session.exec(
        select(CandidateJobPreference).where(
            (CandidateJobPreference.id == pref_id) &
            (CandidateJobPreference.candidate_id == candidate.id)
        )
    ).first()
    
    if not db_pref:
        raise HTTPException(status_code=404, detail="Preference not found")
    
    update_data = pref.dict(exclude_unset=True)
    if "required_skills" in update_data:
        update_data["required_skills"] = (
            json.dumps(update_data["required_skills"]) 
            if update_data["required_skills"] else None
        )
    
    for field, value in update_data.items():
        setattr(db_pref, field, value)
    
    session.add(db_pref)
    session.commit()
    session.refresh(db_pref)
    return db_pref
```

**Add import at top**:
```python
import json
```

### Frontend Integration

#### 4. Update handleSaveProfile Function
**File**: `react-frontend/src/pages/CandidateDashboard.tsx`

**Modify handleSaveProfile() to include skills**:
```typescript
const handleSaveProfile = async () => {
    if (!editingProfile.product || !editingProfile.primary_role) {
      setError('Please select both product and role');
      return;
    }

    try {
      setSaving(true);
      const profileData = {
        preference_name: editingProfile.preference_name || `${editingProfile.product} - ${editingProfile.primary_role}`,
        product: editingProfile.product,
        primary_role: editingProfile.primary_role,
        years_experience: editingProfile.years_experience,
        rate_min: editingProfile.rate_min,
        rate_max: editingProfile.rate_max,
        work_type: editingProfile.work_type,
        location: editingProfile.location,
        availability: editingProfile.availability,
        summary: editingProfile.summary,
        required_skills: editingProfile.skills || [],  // NEW: Add skills
        is_active: editingProfile.is_active !== undefined ? editingProfile.is_active : true,
      };

      if (formMode === 'add') {
        await preferencesAPI.create(profileData);
        setError('');
        alert('Profile created successfully!');
      } else {
        await preferencesAPI.update(editingProfile.id, profileData);
        setError('');
        alert('Profile updated successfully!');
      }

      setShowProfileForm(false);
      setEditingProfile(null);
      await fetchAllData();
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.response?.data?.detail || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };
```

#### 5. Load Skills when Editing Preference
**File**: `react-frontend/src/pages/CandidateDashboard.tsx`

**Update handleEditProfile() function**:
```typescript
const handleEditProfile = (profile: any) => {
    setFormMode('edit');
    setEditingProfile({
      ...profile,
      skills: profile.required_skills || []  // Load existing skills
    });
    setShowProfileForm(true);
    // Load roles for the product
    if (profile.product) {
      handleLoadRoles('Oracle', profile.product);
    }
  };
```

### Database Migration (If using Alembic)

#### 6. Create Database Migration (Optional)
If the project uses Alembic for migrations:

```python
# backend/alembic/versions/add_skills_to_preferences.py
"""Add required_skills to CandidateJobPreference

Revision ID: xxxxx
Revises: previous_revision
Create Date: YYYY-MM-DD HH:MM:SS.XXXXXX

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'xxxxx'
down_revision = 'previous_revision'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column(
        'candidatejobpreference',
        sa.Column('required_skills', sa.JSON(), nullable=True)
    )

def downgrade() -> None:
    op.drop_column('candidatejobpreference', 'required_skills')
```

If not using Alembic, the table will be auto-created on next startup via `init_db()`.

### Testing

#### 7. Test Skills Saving
- [ ] Create new job preference with skills
- [ ] Verify skills appear in response
- [ ] Edit job preference and update skills
- [ ] Delete and re-add skills
- [ ] Verify skills persist after page refresh
- [ ] Test with multiple job preferences
- [ ] Verify skills are not lost when updating other fields

#### 8. Test API via Swagger
- [ ] POST /preferences - create with required_skills
- [ ] PUT /preferences/{id} - update with required_skills
- [ ] GET /preferences - verify skills in response

## Implementation Priority

1. **HIGH**: Backend model and schema updates (Items 1-2)
2. **HIGH**: Update preference router (Item 3)
3. **HIGH**: Frontend handleSaveProfile update (Item 4)
4. **MEDIUM**: Frontend handleEditProfile update (Item 5)
5. **LOW**: Database migration (Item 6 - optional if no Alembic)
6. **VERIFICATION**: Testing (Item 7-8)

## Estimated Time
- Backend: ~30 minutes
- Frontend: ~15 minutes
- Testing: ~20 minutes
- **Total**: ~65 minutes

## Success Criteria
- ✅ Skills can be selected in job preference form
- ✅ Skills are saved to database
- ✅ Skills persist after page refresh
- ✅ Skills can be edited in existing preferences
- ✅ Skills display on preference cards
- ✅ API returns skills in job preference response
- ✅ No errors in console or server logs

## Notes
- Skills are stored as JSON string in DB (allows flexibility in future)
- Frontend loads skills back into state via `handleEditProfile()`
- Current implementation only adds to job preferences
- Main profile skills are still in separate skill management tab
- Skills can be enhanced later with:
  - Job-skill matching scores
  - Required vs preferred skills
  - Skill endorsements
  - Skill verification status
