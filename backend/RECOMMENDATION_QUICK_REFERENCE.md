# Recommendation System - Quick Reference

## 🎯 Algorithm Weights (Priority Order)

```
┌─────────────────────────────────────────────────────────────┐
│                    MATCH SCORE BREAKDOWN                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1️⃣  ROLE + SENIORITY ████████████████████ 40%              │
│      • Role name match (70% of role score)                  │
│      • Seniority level (30% of role score)                  │
│                                                              │
│  2️⃣  START DATE       █████████████ 25%                     │
│      • Availability vs job start date                       │
│                                                              │
│  3️⃣  LOCATION         ██████████ 20%                        │
│      • Geographic match + remote preference                 │
│                                                              │
│  4️⃣  SALARY           ████████ 15%                          │
│      • Hourly/annual rate overlap                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Scoring Examples

### Example 1: Excellent Match (92.7%)
```
Candidate                          Job Posting
────────────────────────────────  ────────────────────────────────
Senior Full Stack Developer   →   Senior Software Engineer
San Francisco, CA                  Remote
Available in 2 weeks               Start: Feb 10, 2026
$80-100/hr                         $90-120/hr

MATCH BREAKDOWN:
🟢 Role:     93% × 40% = 37.2%  (Excellent role fit + perfect seniority)
🟢 Date:    100% × 25% = 25.0%  (1 day difference - perfect timing)
🟢 Location: 100% × 20% = 20.0%  (Both remote-compatible)
🟡 Salary:   70% × 15% = 10.5%  (40% overlap - good range match)
                         ─────
TOTAL:                   92.7%  ✅ EXCELLENT MATCH
```

### Example 2: Good Match (78.4%)
```
Candidate                          Job Posting
────────────────────────────────  ────────────────────────────────
Mid-level React Developer     →   Senior Frontend Engineer
Austin, TX                         Austin, TX
Available immediately              Start: Feb 1, 2026
$60-80/hr                          $70-100/hr

MATCH BREAKDOWN:
🟡 Role:     80% × 40% = 32.0%  (Role match, but seniority gap)
🟢 Date:     90% × 25% = 22.5%  (Within 2 weeks)
🟢 Location: 100% × 20% = 20.0%  (Same city)
🟡 Salary:   40% × 15% =  6.0%  (Small overlap)
                         ─────
TOTAL:                   78.4%  🟡 GOOD MATCH
```

### Example 3: Fair Match (54.5%)
```
Candidate                          Job Posting
────────────────────────────────  ────────────────────────────────
Junior Python Developer       →   Senior Backend Engineer
New York, NY                       San Francisco, CA
Available in 1 month               Start: March 15, 2026
$40-60/hr                          $90-120/hr

MATCH BREAKDOWN:
🔴 Role:     50% × 40% = 20.0%  (Related role, big seniority gap)
🟡 Date:     70% × 25% = 17.5%  (Within 30 days)
🔴 Location: 30% × 20% =  6.0%  (Different cities, both onsite)
🔴 Salary:   20% × 15% =  3.0%  (No overlap, large gap)
                         ─────
TOTAL:                   54.5%  🟠 FAIR MATCH
```

## 🎨 Match Quality Tiers

```
     SCORE     │  TIER          │  COLOR  │  BADGE
───────────────┼────────────────┼─────────┼─────────────────
  90 - 100%    │  Excellent     │   🟢    │  █████ 95%
  70 - 89%     │  Good          │   🟡    │  ████  82%
  50 - 69%     │  Fair          │   🟠    │  ███   61%
  20 - 49%     │  Poor          │   🔴    │  ██    35%
   0 - 19%     │  No Match      │   ⚫    │  (filtered out)
```

## 🔄 Two-Way Matching Flow

### Candidate → Jobs
```
┌────────────────┐
│   Candidate    │
│   John Doe     │
└────────┬───────┘
         │
         │ Has preferences:
         │ • "Remote Tech Jobs"
         │ • "SF Bay Area"
         │
         ▼
   ┌──────────────────────┐
   │  Recommendation API  │
   │  Calculate scores    │
   │  for all active jobs │
   └──────────┬───────────┘
              │
              ▼
   ┌─────────────────────────┐
   │  Top 10 Matched Jobs    │
   ├─────────────────────────┤
   │ 1. Senior SWE - 92.7%   │
   │ 2. Full Stack - 87.3%   │
   │ 3. Backend Lead - 81.9% │
   │ ...                     │
   └─────────────────────────┘
```

### Recruiter → Candidates
```
┌────────────────┐
│  Company XYZ   │
│  3 Active Jobs │
└────────┬───────┘
         │
         │ Jobs:
         │ • Senior SWE (Remote)
         │ • Frontend Lead (SF)
         │ • DevOps Eng (Austin)
         │
         ▼
   ┌──────────────────────────┐
   │   Recommendation API     │
   │   Calculate scores       │
   │   for all candidates     │
   │   (exclude already seen) │
   └──────────┬───────────────┘
              │
              ▼
   ┌────────────────────────────────┐
   │  Top 10 Matched Candidates     │
   ├────────────────────────────────┤
   │ 1. John Doe - 92.7%            │
   │    Best for: Senior SWE        │
   │ 2. Jane Smith - 89.1%          │
   │    Best for: Frontend Lead     │
   │ 3. Bob Wilson - 84.5%          │
   │    Best for: Senior SWE        │
   │ ...                            │
   └────────────────────────────────┘
```

## 📱 UI Integration

### Candidate Swipe Card
```
┌─────────────────────────────────────────┐
│                                    95%  │
│  Senior Software Engineer          🟢   │
│  TechCorp Inc. - Cloud Platform         │
│                                         │
│  📍 Remote  💰 $90-120/hr  📅 Feb 10   │
│                                         │
│  ──────────────────────────────────     │
│  WHY THIS MATCHES:                      │
│  ✓ Excellent role match                │
│  ✓ Availability aligns perfectly       │
│  ✓ Remote work - flexible location     │
│                                         │
│  BREAKDOWN:                             │
│  Role:     ████████████ 93%            │
│  Date:     ████████████ 100%           │
│  Location: ████████████ 100%           │
│  Salary:   ████████     70%            │
│                                         │
│     👎 Pass       👍 Like               │
└─────────────────────────────────────────┘
         ← →  Keyboard Shortcuts
```

### Recruiter Candidate Card
```
┌─────────────────────────────────────────┐
│                                    93%  │
│  John Doe                          🟢   │
│  john.doe@email.com                     │
│  8 years experience                     │
│                                         │
│  🎯 Best Match: Senior SWE Position     │
│  📍 SF Bay Area  💰 $80-100/hr         │
│                                         │
│  ──────────────────────────────────     │
│  WHY THIS MATCHES:                      │
│  ✓ Excellent role fit + seniority      │
│  ✓ Available within 2 weeks            │
│  ✓ Remote-compatible location          │
│                                         │
│  TOP SKILLS:                            │
│  [React] [Node.js] [AWS] [Python]      │
│                                         │
│     👎 Pass       👍 Like               │
└─────────────────────────────────────────┘
         ← →  Keyboard Shortcuts
```

## 🛠️ API Quick Reference

### Get Job Recommendations (Candidate)
```bash
GET /api/candidates/me/recommendations?top_n=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "candidate_id": 123,
  "total_recommendations": 10,
  "recommendations": [
    {
      "job": { ... },
      "match_score": 92.7,
      "match_breakdown": {
        "role_match": 93.0,
        "date_match": 100.0,
        "location_match": 100.0,
        "salary_match": 70.0
      },
      "match_reasons": [
        "Excellent role match",
        "Availability aligns perfectly",
        "Remote work - flexible location"
      ]
    }
  ]
}
```

### Get Candidate Recommendations (Recruiter)
```bash
GET /api/jobs/recommendations/all?top_n=10&offset=0
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_recommendations": 10,
  "recommendations": [
    {
      "candidate": { ... },
      "best_match_job_id": 45,
      "best_match_job_title": "Senior SWE",
      "match_score": 92.7,
      "match_breakdown": { ... },
      "match_reasons": [ ... ]
    }
  ]
}
```

## 🧪 Testing Commands

```bash
# Backend server (must be running)
cd backend
uvicorn app.main:app --reload

# Test candidate recommendations
curl -H "Authorization: Bearer <token>" \
  http://127.0.0.1:8000/api/candidates/me/recommendations?top_n=5

# Test recruiter recommendations
curl -H "Authorization: Bearer <token>" \
  http://127.0.0.1:8000/api/jobs/recommendations/all?top_n=5
```

## 📝 Key Files

| File | Purpose |
|------|---------|
| `backend/app/recommendation_engine.py` | Core algorithm implementation |
| `backend/app/routers/candidates.py` | Candidate recommendation endpoint |
| `backend/app/routers/jobs.py` | Recruiter recommendation endpoint |
| `react-frontend/src/pages/JobDiscoveryPage.tsx` | Candidate swipe UI |
| `react-frontend/src/pages/JobCandidateRecommendationsPage.tsx` | Recruiter swipe UI |
| `react-frontend/src/components/swipe/SwipeCardStack.tsx` | Swipe mechanism |

---

**Version:** 1.0  
**Last Updated:** January 26, 2026
