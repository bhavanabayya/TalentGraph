# Talent Insights Feature Plan
## Executive Summary

**Goal**: Add a new "Talent Insights" dashboard tab for both candidates and recruiters that provides AI-powered recommendations, advanced matching actions, and job analytics—without disrupting existing functionality.

**Core Principle**: All new features live under a separate tab. Existing endpoints remain untouched. New APIs are additive only.

---

## Feature Overview

### Feature 1: Talent Insights Dashboard (Candidate Side)
**Purpose**: Give candidates AI-ranked job recommendations with quick-apply actions.

**Key Components**:
- AI-ranked job recommendations based on skills/experience/preferences
- One-click **Apply** or **Reject** buttons
- Visual match score indicators (0-100%)
- Filter by job role, location, experience level

### Feature 2: Talent Insights Dashboard (Recruiter Side)
**Purpose**: Give recruiters AI-ranked candidate recommendations with advanced engagement actions.

**Key Components**:
- AI-ranked candidate recommendations for each job posting
- Three action buttons: **Like** (shortlist), **Ask to Apply**, **Reject**
- Match score indicators and skill alignment visualization
- Filter by product/role/experience

### Feature 3: Job Analytics Panel
**Purpose**: Provide recruiters with real-time job performance metrics.

**Key Metrics** (Data Sources):
- **Applied**: Count from `candidate_actions` table where `action_type='apply'`
- **Shortlisted**: Count from `recruiter_actions` table where `action_type='like'`
- **Interviewed**: Count from `matches` table where `status='interview'`
- **Offered**: Count from `matches` table where `status='offered'`
- **Hired**: Count from `matches` table where `status='hired'`
- **Match Rate**: (# of matches / # of applications) * 100
- **Avg. Response Time**: Time between candidate apply and recruiter action

### Feature 4: Recruiter Job Workspace
**Purpose**: Unified view per job posting with edit controls, recommendations, and analytics in one place.

**Sections**:
- **Job Details** (editable inline)
- **Recommendations** (candidates ranked by AI)
- **Analytics** (metrics panel)
- **Activity Feed** (recent candidate actions)

### Feature 5: Match System
**Purpose**: Formalize mutual interest as "Matches".

**Logic** (Explicit):
- **Match Created When**: Candidate clicks "Apply" AND Recruiter clicks "Like" (order doesn't matter)
- If candidate applies first → match created when recruiter likes
- If recruiter likes first → match created when candidate applies
- Both actions must occur for a match to exist
- Matches unlock direct messaging (future phase)
- Match state transitions: `matched` → `interview` → `offered` → `hired`

---

## User Flows

### Candidate Flow: Talent Insights Tab

```
Dashboard → Talent Insights Tab
  ↓
View AI-Ranked Job Recommendations
  ├─ Each card shows:
  │   - Job title, company, location
  │   - Match score (85%)
  │   - Top 3 aligned skills
  │   - Apply / Reject buttons
  ↓
Action: Click "Apply"
  ├─ POST /api/candidate-actions/apply
  ├─ Card moves to "Applied" section
  ├─ Recruiter sees in their feed
  └─ If recruiter already liked → instant Match created (candidate Apply + recruiter Like)
  ↓
Action: Click "Reject"
  ├─ POST /api/candidate-actions/reject
  └─ Card removed from recommendations
```

**UI States**:
- Default: Recommendations grid (3 columns)
- Applied: Collapsed section at top showing "You applied to X jobs"
- Matched: Badge overlay on cards that mutually matched

---

### Recruiter Flow: Talent Insights Tab

```
Dashboard → Talent Insights Tab
  ↓
Select Job Posting (dropdown or tabs)
  ↓
View AI-Ranked Candidate Recommendations
  ├─ Each card shows:
  │   - Candidate name, title, experience
  │   - Match score (92%)
  │   - Skill alignment chart
  │   - Like / Ask to Apply / Reject buttons
  ↓
Action: Click "Like" (Shortlist)
  ├─ POST /api/recruiter-actions/like
  ├─ Candidate added to "Shortlisted" analytics count
  ├─ If candidate already applied → instant Match created (candidate Apply + recruiter Like)
  └─ Card gets purple "Liked" badge
  ↓
Action: Click "Ask to Apply"
  ├─ POST /api/recruiter-actions/ask-to-apply
  ├─ Candidate sees invitation in their dashboard
  └─ Optional message field (short note)
  ↓
Action: Click "Reject"
  ├─ POST /api/recruiter-actions/reject
  └─ Card removed from recommendations
  ↓
View Job Analytics Panel (sidebar)
  ├─ Applied: 24
  ├─ Shortlisted: 12
  ├─ Interviewed: 5
  ├─ Offered: 2
  └─ Match Rate: 42%
```

**UI States**:
- Tabbed view by job posting (max 5 tabs visible, dropdown for more)
- Sidebar: Analytics panel (sticky)
- Main area: Candidate recommendation cards (2-3 columns)
- Top filters: Experience, Skills, Availability

---

### Recruiter Flow: Job Workspace

```
Dashboard → Talent Insights Tab → Select Job
  ↓
Three-Section Layout:
  ┌─────────────────────────────────────────┐
  │ [Job Details - Editable]                │
  │  Title, Description, Requirements       │
  │  [Save Changes Button]                  │
  ├─────────────────────────────────────────┤
  │ [Recommendations - Ranked List]         │
  │  AI-scored candidates with actions      │
  ├─────────────────────────────────────────┤
  │ [Analytics - Metrics Panel]             │
  │  Applied/Interviewed/Shortlisted/Offered│
  └─────────────────────────────────────────┘
```

**Interactions**:
- Inline editing of job details (PUT /api/jobs/{id})
- Real-time analytics updates on candidate actions
- Expandable candidate cards for full profile view

---

## Data Flow & API Design

### New API Endpoints

#### Candidate Actions
```
POST /api/v2/candidate-actions/apply
Body: { job_id: int, candidate_id: int }
Response: { success: bool, match_created: bool }

POST /api/v2/candidate-actions/reject
Body: { job_id: int, candidate_id: int }
Response: { success: bool }

GET /api/v2/candidate/recommendations
Query: candidate_id, limit=20
Response: { jobs: [{ id, title, match_score, skills_aligned }] }
```

#### Recruiter Actions
```
POST /api/v2/recruiter-actions/like
Body: { job_id: int, candidate_id: int }
Response: { success: bool, match_created: bool }

POST /api/v2/recruiter-actions/ask-to-apply
Body: { job_id: int, candidate_id: int, message?: string }
Response: { success: bool, invitation_id: int }

POST /api/v2/recruiter-actions/reject
Body: { job_id: int, candidate_id: int }
Response: { success: bool }

GET /api/v2/recruiter/recommendations
Query: job_id, limit=20
Response: { candidates: [{ id, name, match_score, skills_aligned }] }
```

#### Analytics
```
GET /api/v2/jobs/{job_id}/analytics
Response: {
  applied_count: int,
  interviewed_count: int,
  shortlisted_count: int,
  offered_count: int,
  match_rate: float,
  avg_response_time_hours: float
}

GET /api/v2/candidate/{candidate_id}/activity
Response: {
  applications: [{ job_id, status, created_at }],
  matches: [{ job_id, matched_at }],
  invitations: [{ job_id, message, recruiter_name }]
}
```

#### Match System
```
GET /api/v2/matches
Query: candidate_id OR recruiter_id
Response: { matches: [{ id, job_id, candidate_id, status, created_at }] }

PUT /api/v2/matches/{match_id}/status
Body: { status: 'interview' | 'offered' | 'hired' | 'rejected' }
Response: { success: bool }
```

---

### Database Schema Additions

**New Tables**:

```sql
-- Candidate Actions
CREATE TABLE candidate_actions (
    id INTEGER PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(id),
    job_id INTEGER REFERENCES jobs(id),
    action_type VARCHAR(20), -- 'apply', 'reject'
    created_at TIMESTAMP
);

-- Recruiter Actions
CREATE TABLE recruiter_actions (
    id INTEGER PRIMARY KEY,
    recruiter_id INTEGER REFERENCES recruiters(id),
    job_id INTEGER REFERENCES jobs(id),
    candidate_id INTEGER REFERENCES candidates(id),
    action_type VARCHAR(20), -- 'like', 'ask_to_apply', 'reject'
    message TEXT NULL,
    created_at TIMESTAMP
);

-- Matches (only created when both candidate applies AND recruiter likes)
CREATE TABLE matches (
    id INTEGER PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id),
    candidate_id INTEGER REFERENCES candidates(id),
    status VARCHAR(20), -- 'matched', 'interview', 'offered', 'hired', 'rejected'
    matched_at TIMESTAMP, -- when match was created
    updated_at TIMESTAMP,
    UNIQUE(job_id, candidate_id) -- prevent duplicate matches
);

-- Job Analytics (denormalized for performance)
CREATE TABLE job_analytics (
    job_id INTEGER PRIMARY KEY REFERENCES jobs(id),
    applied_count INTEGER DEFAULT 0,
    interviewed_count INTEGER DEFAULT 0,
    shortlisted_count INTEGER DEFAULT 0,
    offered_count INTEGER DEFAULT 0,
    match_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP
);
```

**Indexes**:
```sql
CREATE INDEX idx_candidate_actions_candidate ON candidate_actions(candidate_id);
CREATE INDEX idx_candidate_actions_job ON candidate_actions(job_id);
CREATE INDEX idx_recruiter_actions_job ON recruiter_actions(job_id);
CREATE INDEX idx_matches_candidate ON matches(candidate_id);
CREATE INDEX idx_matches_job ON matches(job_id);
```

---

## Recommendation Algorithm

### Scoring Logic (Hybrid Approach)

**Inputs**:
- Candidate skills vs job requirements (keyword match)
- Experience level alignment
- Product/ProductAuthor preferences (from ontology)
- Embeddings similarity (optional ML layer)
- Availability overlap

**Formula**:
```
match_score = (
    0.35 * skill_overlap_score +      // Jaccard similarity
    0.25 * experience_alignment +     // Years exp vs requirement
    0.20 * product_preference_score + // Ontology match
    0.15 * embedding_similarity +     // AI/ML (future)
    0.05 * availability_score         // Calendar overlap
) * 100
```

**Implementation**:
- **Phase 1**: Use existing `recommendation_engine.py` with deterministic rule-based scoring
- **Phase 2**: Optionally add vector embeddings for skill/description matching (blended with deterministic scores, not replacing them)
- **Phase 3**: Train XGBoost on historical match outcomes (optional ML enhancement)

---

## UI/UX Design Guidelines

### Color Palette
**Primary**: Purple gradient (#6B46C1 → #9F7AEA)  
**Accent**: Deep purple (#553C9A)  
**Backgrounds**: White (#FFFFFF), Light gray (#F7FAFC)  
**Text**: Dark gray (#2D3748), Medium gray (#718096)  
**Success**: Green (#48BB78)  
**Warning**: Amber (#ECC94B)  
**Danger**: Red (#F56565)

### Typography
- **Headers**: Inter, 600 weight, 24-32px
- **Body**: Inter, 400 weight, 14-16px
- **Captions**: Inter, 400 weight, 12px
- **Line Height**: 1.5-1.6

### Component Styling

**Cards (Recommendations)**:
```css
.recommendation-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.recommendation-card:hover {
  box-shadow: 0 8px 24px rgba(107, 70, 193, 0.12);
  border-color: #9F7AEA;
}
```

**Buttons (Actions)**:
```css
.btn-apply {
  background: linear-gradient(135deg, #6B46C1 0%, #9F7AEA 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-weight: 500;
}

.btn-like {
  background: white;
  color: #6B46C1;
  border: 2px solid #6B46C1;
  border-radius: 8px;
  padding: 10px 24px;
}

.btn-reject {
  background: white;
  color: #718096;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 10px 24px;
}
```

**Match Score Badge**:
```css
.match-score {
  background: linear-gradient(135deg, #6B46C1 0%, #9F7AEA 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}
```

**Analytics Panel**:
```css
.analytics-panel {
  background: linear-gradient(180deg, #F7FAFC 0%, #FFFFFF 100%);
  border-left: 4px solid #6B46C1;
  padding: 24px;
  border-radius: 8px;
}

.metric-value {
  font-size: 32px;
  font-weight: 700;
  color: #6B46C1;
}

.metric-label {
  font-size: 12px;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

### Layout Patterns

**Dashboard Tab Navigation**:
```
┌─────────────────────────────────────────────┐
│ [Dashboard] [Talent Insights] [Profile] ◄─┐ │
└────────────────────────────────────────────┘│
  Active tab: purple underline (4px)         │
  Inactive: gray text, no underline          │
  Hover: light purple background             │
                                             │
```

**Talent Insights Layout (Candidate)**:
```
┌─────────────────────────────────────────────┐
│ Talent Insights                             │
│ ─────────────────────────────────────────── │
│ [Filters: Role ▾] [Experience ▾] [Sort ▾]  │
│                                             │
│ ┌────────┐  ┌────────┐  ┌────────┐        │
│ │ Job 1  │  │ Job 2  │  │ Job 3  │        │
│ │ 92%    │  │ 87%    │  │ 81%    │        │
│ │[Apply] │  │[Apply] │  │[Apply] │        │
│ └────────┘  └────────┘  └────────┘        │
│                                             │
│ ┌────────┐  ┌────────┐  ┌────────┐        │
│ │ Job 4  │  │ Job 5  │  │ Job 6  │        │
│ └────────┘  └────────┘  └────────┘        │
└─────────────────────────────────────────────┘
```

**Talent Insights Layout (Recruiter)**:
```
┌─────────────────────────────────────────────┐
│ Talent Insights                             │
│ ─────────────────────────────────────────── │
│ Job: [Senior Engineer ▾]                    │
│                                             │
│ ┌───────────────┐ │ ┌──────────────────┐   │
│ │ Candidate 1   │ │ │ Analytics        │   │
│ │ 95% match     │ │ │ ──────────────── │   │
│ │ [Like] [Ask]  │ │ │ Applied: 24      │   │
│ │ [Reject]      │ │ │ Shortlisted: 12  │   │
│ ├───────────────┤ │ │ Interviewed: 5   │   │
│ │ Candidate 2   │ │ │ Offered: 2       │   │
│ │ 89% match     │ │ │ ──────────────── │   │
│ │ [Like] [Ask]  │ │ │ Match Rate: 42%  │   │
│ │ [Reject]      │ │ └──────────────────┘   │
│ └───────────────┘ │                         │
└─────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal**: Set up data models and basic API endpoints.

**Tasks**:
1. Create database migrations for new tables (candidate_actions, recruiter_actions, matches, job_analytics)
2. Add SQLModel classes in `models.py`
3. Add Pydantic schemas in `schemas.py`
4. Implement basic CRUD endpoints:
   - `POST /api/v2/candidate-actions/apply`
   - `POST /api/v2/candidate-actions/reject`
   - `POST /api/v2/recruiter-actions/like`
   - `POST /api/v2/recruiter-actions/reject`
5. Add match creation logic (when candidate applies + recruiter likes)
6. Write unit tests for new endpoints

**Deliverable**: Backend API with all endpoints functional (no UI yet).

---

### Phase 2: Recommendations & Scoring (Week 3)
**Goal**: Implement deterministic ranking algorithm and recommendation endpoints.

**Tasks**:
1. Extend `recommendation_engine.py` with hybrid scoring logic (deterministic)
2. Create `GET /api/v2/candidate/recommendations` endpoint
3. Create `GET /api/v2/recruiter/recommendations?job_id={id}` endpoint
4. Add skill overlap calculation (Jaccard similarity - deterministic)
5. Add experience alignment scoring (rule-based)
6. Add product preference scoring (from ontology)
7. Write tests for scoring algorithm
8. *(Optional)* Add vector embeddings for skill/description matching (blend with deterministic scores if implemented)

**Deliverable**: Recommendation endpoints return ranked lists with match scores using deterministic + optional embedding blend.

---

### Phase 3: Candidate UI (Week 4)
**Goal**: Build Talent Insights tab for candidates.

**Tasks**:
1. Create `TalentInsightsCandidate.tsx` component
2. Add tab navigation in dashboard
3. Build job recommendation cards with Apply/Reject buttons
4. Integrate with `/api/v2/candidate/recommendations`
5. Handle Apply action (POST + UI update)
6. Handle Reject action (remove from list)
7. Add match score badges and skill alignment UI
8. Apply purple gradient theme

**Deliverable**: Candidates can view and interact with AI-ranked jobs.

---

### Phase 4: Recruiter UI (Week 5)
**Goal**: Build Talent Insights tab for recruiters.

**Tasks**:
1. Create `TalentInsightsRecruiter.tsx` component
2. Add job selector dropdown
3. Build candidate recommendation cards with Like/Ask/Reject buttons
4. Integrate with `/api/v2/recruiter/recommendations`
5. Handle Like action (POST + UI feedback)
6. Handle Ask to Apply action (modal with message field)
7. Handle Reject action (remove from list)
8. Apply purple gradient theme

**Deliverable**: Recruiters can view and interact with AI-ranked candidates.

---

### Phase 5: Analytics & Job Workspace (Week 6)
**Goal**: Add analytics panel and unified job workspace view.

**Tasks**:
1. Implement `GET /api/v2/jobs/{id}/analytics` endpoint
2. Add analytics calculations (aggregate from candidate_actions, recruiter_actions)
3. Create `JobAnalyticsPanel.tsx` component
4. Integrate analytics into Talent Insights recruiter view (sidebar)
5. Create `JobWorkspace.tsx` component (3-section layout)
6. Add inline job editing capability
7. Add real-time analytics updates (polling or WebSocket)

**Deliverable**: Recruiters see live job metrics and unified workspace.

---

### Phase 6: Polish & Testing (Week 7)
**Goal**: Refine UI, add animations, ensure backward compatibility.

**Tasks**:
1. Add loading states and skeleton screens
2. Add success/error toast notifications
3. Add smooth transitions for card actions
4. Test existing endpoints (ensure no regressions)
5. Add E2E tests for new flows
6. Performance optimization (query indexes, caching)
7. Accessibility audit (ARIA labels, keyboard navigation)

**Deliverable**: Production-ready feature with polished UX.

---

## Match Creation Logic (Implementation Detail)

### When a Match is Created

**Scenario 1: Candidate Applies First**
```
1. Candidate clicks "Apply" on Job X
   → Create candidate_action record (type='apply')
   → Check: Does recruiter_action exist for this (job, candidate) with type='like'?
   → NO: No match created yet, wait for recruiter
   
2. Recruiter clicks "Like" on same Candidate for Job X
   → Create recruiter_action record (type='like')
   → Check: Does candidate_action exist with type='apply'?
   → YES: Create match record (status='matched', matched_at=NOW)
```

**Scenario 2: Recruiter Likes First**
```
1. Recruiter clicks "Like" on Candidate Y for Job Z
   → Create recruiter_action record (type='like')
   → Check: Does candidate_action exist for this (job, candidate) with type='apply'?
   → NO: No match created yet, wait for candidate
   
2. Candidate clicks "Apply" on Job Z
   → Create candidate_action record (type='apply')
   → Check: Does recruiter_action exist with type='like'?
   → YES: Create match record (status='matched', matched_at=NOW)
```

### Match Creation Pseudocode
```python
def create_match_if_applicable(job_id: int, candidate_id: int, db: Session) -> Optional[Match]:
    """
    Check if both candidate applied AND recruiter liked.
    If yes, create match. If no, return None.
    """
    candidate_applied = db.query(CandidateAction).filter(
        CandidateAction.job_id == job_id,
        CandidateAction.candidate_id == candidate_id,
        CandidateAction.action_type == 'apply'
    ).first()
    
    recruiter_liked = db.query(RecruiterAction).filter(
        RecruiterAction.job_id == job_id,
        RecruiterAction.candidate_id == candidate_id,
        RecruiterAction.action_type == 'like'
    ).first()
    
    if candidate_applied and recruiter_liked:
        # Both conditions met, create match
        match = Match(
            job_id=job_id,
            candidate_id=candidate_id,
            status='matched',
            matched_at=datetime.utcnow()
        )
        db.add(match)
        db.commit()
        return match
    
    return None  # Not ready for match yet
```

### Analytics Data Sources (Explicit)

**All counts are derived from database queries**:

```python
# Applied count
applied_count = db.query(CandidateAction).filter(
    CandidateAction.job_id == job_id,
    CandidateAction.action_type == 'apply'
).count()

# Shortlisted count
shortlisted_count = db.query(RecruiterAction).filter(
    RecruiterAction.job_id == job_id,
    RecruiterAction.action_type == 'like'
).count()

# Interviewed count (from match status transitions)
interviewed_count = db.query(Match).filter(
    Match.job_id == job_id,
    Match.status == 'interview'
).count()

# Offered count (from match status transitions)
offered_count = db.query(Match).filter(
    Match.job_id == job_id,
    Match.status == 'offered'
).count()

# Hired count (from match status transitions)
hired_count = db.query(Match).filter(
    Match.job_id == job_id,
    Match.status == 'hired'
).count()

# Match count (total matches regardless of status)
match_count = db.query(Match).filter(
    Match.job_id == job_id
).count()

# Match rate
match_rate = (match_count / applied_count * 100) if applied_count > 0 else 0
```

---

## Backward Compatibility Checklist

- ✅ All existing endpoints remain unchanged
- ✅ New endpoints use `/api/v2/` prefix for versioning
- ✅ Old dashboard tabs unaffected (Talent Insights is separate)
- ✅ Existing database tables unchanged (only additions)
- ✅ No changes to authentication flow
- ✅ Existing React components untouched
- ✅ API responses maintain existing schemas

---

## Risk Mitigation

**Risk 1**: Recommendation algorithm performance at scale  
**Mitigation**: Pre-calculate match scores nightly, cache results, add pagination.

**Risk 2**: UI state sync issues (stale data after actions)  
**Mitigation**: Optimistic UI updates + background refetch, use React Query.

**Risk 3**: Analytics calculations slow down API  
**Mitigation**: Use denormalized `job_analytics` table, update async via background job.

**Risk 4**: Match logic edge cases (simultaneous actions)  
**Mitigation**: Use database transactions, add unique constraints on (job_id, candidate_id).

---

## Success Metrics

**Engagement**:
- % of candidates using Talent Insights tab
- % of recruiters using Talent Insights tab
- Daily active users on new tab

**Effectiveness**:
- Apply-to-Match conversion rate
- Like-to-Match conversion rate
- Avg. time to first action on recommendations
- Match rate vs. old flow

**Performance**:
- API response time <200ms for recommendations
- Analytics load time <500ms
- Zero downtime during rollout

---

## Future Enhancements (Post-Launch)

**Phase 7+**:
- Direct messaging for matched pairs
- Interview scheduling integration
- Candidate notes/tags for recruiters
- Email notifications for new recommendations
- Advanced filters (salary range, remote preference)
- ML model training on historical match outcomes
- A/B testing different recommendation algorithms
- Recruiter collaboration (team notes on candidates)

---

## Questions for Product Team

1. Should "Ask to Apply" trigger an email notification immediately?
2. What's the max character limit for "Ask to Apply" message?
3. Should matches expire after X days of inactivity?
4. Do we need approval workflow for job edits in workspace view?
5. Should analytics include competitor benchmarks (if data available)?
6. What permission levels do recruiters have (edit any job vs. only their own)?

---

## Appendix: API Request/Response Examples

### POST /api/v2/candidate-actions/apply
**Request**:
```json
{
  "job_id": 42,
  "candidate_id": 123
}
```

**Response**:
```json
{
  "success": true,
  "match_created": false,
  "action_id": 789
}
```

**Response (if match created)**:
```json
{
  "success": true,
  "match_created": true,
  "match_id": 555,
  "action_id": 789
}
```

---

### GET /api/v2/candidate/recommendations
**Query Params**: `candidate_id=123&limit=20`

**Response**:
```json
{
  "recommendations": [
    {
      "job_id": 42,
      "title": "Senior Backend Engineer",
      "company": "TechCorp",
      "location": "San Francisco, CA",
      "match_score": 92.5,
      "skills_aligned": ["Python", "FastAPI", "PostgreSQL"],
      "total_skills_required": 8,
      "experience_match": "strong", // 'strong', 'moderate', 'weak'
      "created_at": "2026-01-15T10:30:00Z"
    },
    {
      "job_id": 58,
      "title": "Full Stack Developer",
      "company": "StartupXYZ",
      "location": "Remote",
      "match_score": 87.3,
      "skills_aligned": ["React", "TypeScript", "Node.js"],
      "total_skills_required": 6,
      "experience_match": "moderate",
      "created_at": "2026-01-20T14:22:00Z"
    }
  ],
  "total_count": 45,
  "page": 1,
  "page_size": 20
}
```

---

### GET /api/v2/jobs/42/analytics
**Response**:
```json
{
  "job_id": 42,
  "applied_count": 24,           // from candidate_actions table
  "shortlisted_count": 12,       // from recruiter_actions table (likes)
  "match_count": 8,              // from matches table (any status)
  "interviewed_count": 5,        // from matches table where status='interview'
  "offered_count": 2,            // from matches table where status='offered'
  "hired_count": 1,              // from matches table where status='hired'
  "match_rate": 33.3,            // (match_count / applied_count) * 100
  "avg_response_time_hours": 18.5,  // avg time from apply to recruiter action
  "last_updated": "2026-02-03T09:15:00Z"
}
```

---

## Component File Structure (React Frontend)

```
src/
  pages/
    TalentInsights/
      index.tsx                    // Main routing component
      CandidateView.tsx           // Candidate recommendations UI
      RecruiterView.tsx           // Recruiter recommendations UI
      JobWorkspace.tsx            // Unified job workspace
      
  components/
    TalentInsights/
      RecommendationCard.tsx      // Generic card component
      CandidateCard.tsx          // Candidate-specific card
      JobCard.tsx                 // Job-specific card
      AnalyticsPanel.tsx         // Metrics sidebar
      ActionButtons.tsx          // Like/Apply/Reject buttons
      MatchScoreBadge.tsx       // Score indicator
      SkillAlignment.tsx        // Skill overlap visualization
      AskToApplyModal.tsx       // Message modal
      
  api/
    talentInsights.ts             // API client functions
    
  styles/
    talentInsights.css            // Feature-specific styles
```

---

## Backend File Structure

```
backend/app/
  routers/
    talent_insights/
      __init__.py
      candidate_actions.py       // Candidate endpoints
      recruiter_actions.py      // Recruiter endpoints
      recommendations.py        // Recommendation endpoints
      analytics.py              // Analytics endpoints
      matches.py                // Match system endpoints
      
  models.py                       // Add new SQLModel classes
  schemas.py                      // Add new Pydantic schemas
  recommendation_engine.py        // Extend scoring logic
  
  services/
    match_service.py             // Match creation/validation logic
    analytics_service.py         // Analytics calculation logic
```

---

## End of Plan

**Next Step**: Review this plan with the team, prioritize phases, and begin Phase 1 implementation once approved.
