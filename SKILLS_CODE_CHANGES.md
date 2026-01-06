# Skills Integration - Code Changes Reference

## File 1: CandidateDashboard.tsx

### Change 1: Add Import
**Line**: 12
**Type**: Addition

```typescript
import { SkillSelector } from '../components/SkillSelector';
```

### Change 2: Add State for Skills
**Lines**: ~67-68
**Type**: Addition

```typescript
const [skillsInput, setSkillsInput] = useState<any[]>([]);
const [prefSkillsInput, setPrefSkillsInput] = useState<any[]>([]);
```

### Change 3: Main Profile - Add Skills Section
**Location**: Main Profile Edit Form (after Professional Summary)
**Lines**: ~568-578
**Type**: Addition

**Before**:
```typescript
<div className="form-group">
  <label>Professional Summary</label>
  <textarea 
    value={formData.summary || ''} 
    onChange={(e) => setFormData({ ...formData, summary: e.target.value })} 
    rows={4} 
  />
</div>
<button className="btn btn-primary" onClick={handleUpdateProfile} disabled={saving}>
  {saving ? 'Saving...' : 'Save Profile'}
</button>
```

**After**:
```typescript
<div className="form-group">
  <label>Professional Summary</label>
  <textarea 
    value={formData.summary || ''} 
    onChange={(e) => setFormData({ ...formData, summary: e.target.value })} 
    rows={4} 
  />
</div>

{formData.product && formData.primary_role && (
  <div className="form-group">
    <label>Key Skills for Your Profile</label>
    <SkillSelector
      selectedSkills={skillsInput}
      onSkillsChange={setSkillsInput}
      technicalSkills={technicalSkills}
      softSkills={softSkills}
    />
    <small style={{ color: '#999', marginTop: '8px', display: 'block' }}>
      Select skills that match your experience in {formData.product} - {formData.primary_role}
    </small>
  </div>
)}

<button className="btn btn-primary" onClick={handleUpdateProfile} disabled={saving}>
  {saving ? 'Saving...' : 'Save Profile'}
</button>
```

### Change 4: Job Preference - Add Skills Section
**Location**: Job Preference Profile Form (after Professional Summary)
**Lines**: ~745-754
**Type**: Addition

**Before**:
```typescript
<div className="form-group">
  <label>Professional Summary</label>
  <textarea
    placeholder="Brief summary of your background and interests for this role"
    value={editingProfile.summary || ''}
    onChange={(e) => setEditingProfile({ ...editingProfile, summary: e.target.value })}
    rows={4}
  />
</div>

<div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
  <button
    className="btn btn-primary"
    onClick={handleSaveProfile}
    disabled={saving}
  >
```

**After**:
```typescript
<div className="form-group">
  <label>Professional Summary</label>
  <textarea
    placeholder="Brief summary of your background and interests for this role"
    value={editingProfile.summary || ''}
    onChange={(e) => setEditingProfile({ ...editingProfile, summary: e.target.value })}
    rows={4}
  />
</div>

{editingProfile.product && editingProfile.primary_role && (
  <div className="form-group">
    <label>Skills for This Role</label>
    <SkillSelector
      selectedSkills={editingProfile.skills || []}
      onSkillsChange={(skills) => setEditingProfile({ ...editingProfile, skills })}
      technicalSkills={technicalSkills}
      softSkills={softSkills}
    />
  </div>
)}

<div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
  <button
    className="btn btn-primary"
    onClick={handleSaveProfile}
    disabled={saving}
  >
```

## File 2: SkillSelector.tsx

### Change 1: Update Props Interface
**Lines**: 6-13
**Type**: Modification

**Before**:
```typescript
interface SkillSelectorProps {
  selectedSkills: Skill[];
  onSkillsChange: (skills: Skill[]) => void;
  availableSkills: string[];
  category?: string;
}
```

**After**:
```typescript
interface SkillSelectorProps {
  selectedSkills: Skill[];
  onSkillsChange: (skills: Skill[]) => void;
  availableSkills?: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  category?: string;
}
```

### Change 2: Update Component Signature & Add Skill Combination
**Lines**: 17-20
**Type**: Modification

**Before**:
```typescript
export const SkillSelector: React.FC<SkillSelectorProps> = ({
  selectedSkills,
  onSkillsChange,
  availableSkills,
  category = 'Technical'
}) => {
  const [selectedSkill, setSelectedSkill] = useState('');
  const [currentRating, setCurrentRating] = useState(3);
```

**After**:
```typescript
export const SkillSelector: React.FC<SkillSelectorProps> = ({
  selectedSkills,
  onSkillsChange,
  availableSkills = [],
  technicalSkills = [],
  softSkills = [],
  category = 'Technical'
}) => {
  const [selectedSkill, setSelectedSkill] = useState('');
  const [currentRating, setCurrentRating] = useState(3);

  // Combine available skills from both sources
  const allAvailableSkills = [...availableSkills, ...technicalSkills, ...softSkills];
  
  // Determine category label
  const displayCategory = technicalSkills.length > 0 && softSkills.length > 0 
    ? 'Skill' 
    : category;
```

### Change 3: Update Label Display
**Line**: ~74
**Type**: Modification

**Before**:
```typescript
<label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
  {category} Skill
</label>
```

**After**:
```typescript
<label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
  {displayCategory}
</label>
```

### Change 4: Update Skill Filtering to Use Combined List
**Lines**: ~81-92
**Type**: Modification

**Before**:
```typescript
<select
  value={selectedSkill}
  onChange={(e) => setSelectedSkill(e.target.value)}
  style={{
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  }}
>
  <option value="">Select a skill...</option>
  {availableSkills
    .filter(skill => !selectedSkills.find(s => s.name === skill))
    .map(skill => (
      <option key={skill} value={skill}>{skill}</option>
    ))}
</select>
```

**After**:
```typescript
<select
  value={selectedSkill}
  onChange={(e) => setSelectedSkill(e.target.value)}
  style={{
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  }}
>
  <option value="">Select a skill...</option>
  {allAvailableSkills
    .filter(skill => !selectedSkills.find(s => s.name === skill))
    .map(skill => (
      <option key={skill} value={skill}>{skill}</option>
    ))}
</select>
```

## Summary of Changes

### Total Lines Added: ~35
### Total Lines Modified: ~15
### New Files Created: 0
### Files Updated: 2

### Breakdown by File:
- **CandidateDashboard.tsx**: 
  - 1 import addition
  - 2 state declarations
  - 2 component additions (main profile + job preference)
  - Total: ~35 lines

- **SkillSelector.tsx**:
  - 1 interface update
  - 1 component signature update with logic
  - 2 display updates
  - Total: ~15 lines

### Functionality Added:
✅ Skills section in main profile form
✅ Skills section in job preference form
✅ State management for skills
✅ Conditional rendering (only when product + role selected)
✅ Support for technical and soft skills
✅ Dynamic category labeling
✅ Skill deduplication in dropdown

### React Build:
✅ No new errors
✅ 3 existing warnings (unrelated to skills feature)
✅ Bundle size +2.44 KB (minimal)

## Integration Checklist

- [x] Import SkillSelector component
- [x] Add state for main profile skills
- [x] Add state for job preference skills
- [x] Add SkillSelector to main profile form
- [x] Add conditional rendering for main profile
- [x] Add contextual help text for main profile
- [x] Add SkillSelector to job preference form
- [x] Add conditional rendering for job preference
- [x] Update component props to accept technicalSkills
- [x] Update component props to accept softSkills
- [x] Update component to combine skill arrays
- [x] Update component category label logic
- [x] Update component dropdown filtering
- [x] Test React build
- [x] Create documentation

## Next Steps for Backend Integration

The frontend is ready for backend integration. The following backend work is needed:

1. Add `required_skills` field to `CandidateJobPreference` model (JSON)
2. Update schema classes to include `SkillItem` model
3. Update preference router POST/PUT endpoints to handle skills
4. Update frontend `handleSaveProfile()` to include skills in API call
5. Update frontend `handleEditProfile()` to load skills from API response

See `SKILLS_INTEGRATION_TODO.md` for detailed backend implementation guide.
