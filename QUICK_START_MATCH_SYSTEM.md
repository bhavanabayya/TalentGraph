# 🚀 Quick Start Guide - Match State System

## Prerequisites
- Backend running on port 8000
- Frontend running on port 3000
- Sample data seeded (candidates + jobs)

---

## Step 1: Delete Old Database (Fresh Start)

```powershell
cd D:\WORK\App
Remove-Item backend\moblyze_poc.db
```

This ensures the new `MatchState` table is created.

---

## Step 2: Start Backend

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

**Verify**: Check console for:
```
INFO - Database initialized successfully
INFO - Application startup complete
```

Visit: http://localhost:8000/docs
- Should see new `/matches/*` endpoints

---

## Step 3: Seed Sample Data

```powershell
cd backend
.\run_seed_data.ps1
```

This creates:
- 2 Candidates: sarah.anderson@email.com, michael.chen@email.com
- 1 Company with 3 users (admin, HR, recruiter)
- 6 Job postings

---

## Step 4: Start Frontend

```powershell
cd react-frontend
npm start
```

**Verify**: Frontend opens at http://localhost:3000

---

## Step 5: Test Candidate Flow

### Login as Candidate
- Email: `sarah.anderson@email.com`
- Password: `password123`

### Navigate to Recommendations Tab
1. Click **✨ Recommendations** tab
2. Should see job matches with scores
3. Try the actions:
   - 👍 **Like** - Job stays visible, shows interest
   - 👎 **Pass** - Job disappears, won't show again
   - ✅ **Apply** - Creates application, disappears from feed

### Check Pending Invitations
1. Click **💌 Recruiter Invites** tab
2. Initially empty (recruiters haven't invited yet)
3. Will populate after Step 6

---

## Step 6: Test Recruiter Flow

### Login as Recruiter
- Email: `recruiter.jane@techcorp.com`
- Password: `recruiter123`

### Navigate to Recommendations Tab
1. Click **✨ Recommendations** tab
2. Should see candidate matches with scores
3. Try the actions:
   - 👍 **Like** - Candidate stays visible
   - 👎 **Pass** - Candidate disappears
   - 📨 **Ask to Apply** - Expand to add message, send invitation

### Send an Invitation
1. Find Sarah Anderson in recommendations
2. Click **📨 Ask to Apply**
3. Type message: "We'd love to have you join our team!"
4. Click **📨 Send Invitation**
5. Candidate card disappears (invitation sent)

---

## Step 7: Verify Reverse Flow

### Switch back to Candidate (Sarah)
1. Logout from recruiter account
2. Login as sarah.anderson@email.com
3. Click **💌 Recruiter Invites** tab
4. Should see 1 pending invitation with recruiter message
5. Click **✅ Accept & Apply**
6. Invitation disappears
7. Check **Applications** tab - new application added!

---

## Step 8: Verify Database State

```powershell
# Check match states created
cd backend
python
```

```python
from app.database import engine
from sqlmodel import Session, select
from app.models import MatchState

with Session(engine) as session:
    states = session.exec(select(MatchState)).all()
    for state in states:
        print(f"Candidate {state.candidate_id} ↔ Job {state.job_post_id}")
        print(f"  Candidate: {state.candidate_action}")
        print(f"  Recruiter: {state.recruiter_action}")
        print(f"  Status: {state.status}")
        print(f"  Unlock: {state.unlock_level}")
        print()
```

**Expected Output**:
```
Candidate 1 ↔ Job 3
  Candidate: APPLY
  Recruiter: ASK_TO_APPLY
  Status: MATCHED
  Unlock: FULL
```

---

## Step 9: Test Feed Filtering

### As Candidate
1. Like 3 jobs
2. Pass 2 jobs
3. Apply to 1 job
4. Click **🔄 Refresh Recommendations**
5. **Should NOT see** the 6 jobs you interacted with
6. Only new/unseen jobs appear

### As Recruiter
1. Like 3 candidates
2. Pass 2 candidates
3. Invite 1 candidate
4. Click **🔄 Refresh Recommendations**
5. **Should NOT see** the 6 candidates you interacted with
6. Only new/unseen candidates appear

---

## Step 10: Test API Endpoints

### Using FastAPI Docs (http://localhost:8000/docs)

#### 1. Candidate Actions
```
POST /matches/candidate/action
{
  "job_post_id": 1,
  "action": "LIKE"
}
```

#### 2. Get Pending Asks
```
GET /matches/candidate/pending-asks
```

#### 3. Respond to Ask
```
POST /matches/candidate/respond-to-ask
{
  "match_state_id": 1,
  "response": "ACCEPT"
}
```

#### 4. Recruiter Actions
```
POST /matches/recruiter/action
{
  "candidate_id": 1,
  "job_post_id": 2,
  "action": "ASK_TO_APPLY",
  "message": "Join our team!"
}
```

#### 5. Get Match State
```
GET /matches/state/1/2
```

---

## Common Issues & Solutions

### ❌ "MatchState table doesn't exist"
**Solution**: Delete `moblyze_poc.db` and restart backend

### ❌ Recommendations show 0 items
**Solution**: 
1. Check if jobs exist: GET /jobs/all
2. Check if candidates exist: GET /candidates/list/all
3. Verify seed data ran successfully

### ❌ "Cannot find name 'matchesAPI'"
**Solution**: 
1. Check `react-frontend/src/api/client.ts` has `matchesAPI` export
2. Restart frontend dev server (`npm start`)

### ❌ Swipe action doesn't remove item
**Solution**: 
1. Check browser console for errors
2. Verify backend returned 200 OK
3. Check `swipingJobId` state is updating

### ❌ "Recruiter Invites" tab shows 0
**Solution**:
1. First have recruiter send invitation (Step 6)
2. Make sure recruiter used "Ask to Apply" not regular "Apply"
3. Check backend logs for ask_to_apply_status = PENDING

---

## Verification Checklist

- [ ] Backend starts without errors
- [ ] `/matches` endpoints visible in Swagger docs
- [ ] Seed data creates candidates + jobs
- [ ] Candidate sees recommendations
- [ ] Candidate can Like/Pass/Apply jobs
- [ ] Jobs disappear after action
- [ ] Recruiter sees candidate recommendations
- [ ] Recruiter can Like/Pass/Invite candidates
- [ ] "Ask to Apply" shows message input
- [ ] Candidate receives invitations
- [ ] Candidate can Accept/Decline invitations
- [ ] Accept creates application automatically
- [ ] Refresh excludes already-swiped items
- [ ] Match state records created in database

---

## Next Testing Scenarios

### Scenario 1: Mutual Like
1. Candidate likes Job A
2. Recruiter (for Job A) likes Candidate
3. Check database: `status = 'MATCHED'`, `unlock_level = 'PARTIAL'`

### Scenario 2: Apply Without Invitation
1. Candidate applies directly from recommendations
2. Check database: `candidate_action = 'APPLY'`, `unlock_level = 'FULL'`

### Scenario 3: Declined Invitation
1. Recruiter sends invitation
2. Candidate declines
3. Check database: `status = 'REJECTED'`
4. Verify candidate never sees that job again

### Scenario 4: Bulk Actions
1. Candidate swipes on 20 jobs rapidly
2. Check all 20 disappear from feed
3. Verify database has 20 MatchState records

---

## Performance Testing

### Simulate Scale
```python
# Create 1000 fake match states
from app.models import MatchState
from app.database import engine
from sqlmodel import Session
import random

with Session(engine) as session:
    for i in range(1000):
        state = MatchState(
            candidate_id=random.randint(1, 10),
            job_post_id=random.randint(1, 20),
            candidate_action=random.choice(['NONE', 'LIKE', 'PASS', 'APPLY']),
            recruiter_action=random.choice(['NONE', 'LIKE', 'PASS']),
            status='OPEN',
            initial_match_score=random.uniform(50, 95)
        )
        session.add(state)
    session.commit()
    print("Created 1000 match states")
```

**Measure**:
- Time to load recommendations with 1000 states
- Time to filter exclusions
- Database query time (check backend logs)

---

## Success Metrics

✅ **Functional**: All swipe actions work  
✅ **State Tracking**: Database records accurate  
✅ **Feed Filtering**: No repeats in recommendations  
✅ **Workflow**: Full reverse-apply flow works  
✅ **Performance**: Sub-second response times  

---

## Troubleshooting SQL

### View all match states
```sql
SELECT candidate_id, job_post_id, 
       candidate_action, recruiter_action,
       status, unlock_level
FROM matchstate
ORDER BY updated_at DESC
LIMIT 20;
```

### Find pending invitations
```sql
SELECT * FROM matchstate
WHERE recruiter_action = 'ASK_TO_APPLY'
AND ask_to_apply_status = 'PENDING';
```

### Find mutual likes
```sql
SELECT * FROM matchstate
WHERE candidate_action = 'LIKE'
AND recruiter_action = 'LIKE'
AND status = 'MATCHED';
```

---

**Setup Time**: ~10 minutes  
**Testing Time**: ~20 minutes  
**Total**: ~30 minutes to fully verify system

Happy testing! 🎉
