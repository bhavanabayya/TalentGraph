# Recommendation Algorithm Documentation

## Overview
The recommendation engine uses a **weighted scoring algorithm** to match candidates with job postings. It considers multiple features and calculates a compatibility score for each candidate-job pair.

## Feature Weights (Priority Order)

Based on the requirements, the algorithm uses the following weights:

| Priority | Feature | Weight | Description |
|----------|---------|--------|-------------|
| **1** | **Role + Seniority** | **40%** | Job role alignment and seniority level matching |
| **2** | **Start Date** | **25%** | Availability vs. job start date compatibility |
| **3** | **Location** | **20%** | Geographic location and remote work preference |
| **4** | **Salary** | **15%** | Hourly/annual rate range overlap |

### Total = 100%

## Algorithm Details

### 1. Role + Seniority Matching (40% weight)

**Components:**
- **Role Name Match (70% of role score)**
  - Exact role match: 100%
  - Multiple keyword match: 90%
  - Single keyword match: 70%
  - Partial match: 60%
  - No match: 20%

- **Seniority Level Match (30% of role score)**
  - Same level: 100%
  - Adjacent level (±1): 80%
  - 2 levels apart: 50%
  - 3+ levels apart: 20%

**Seniority Hierarchy:**
1. Junior/Entry
2. Mid-level/Associate
3. Senior
4. Lead
5. Principal/Staff/Architect

**Example:**
```
Candidate: "Senior Software Engineer"
Job: "Senior Full Stack Engineer"

Role match: 90% (multiple keywords: "Senior", "Engineer")
Seniority match: 100% (both "Senior" level)
Overall role score: (0.9 × 0.7) + (1.0 × 0.3) = 0.63 + 0.30 = 0.93 (93%)
Weighted contribution: 0.93 × 40% = 37.2%
```

---

### 2. Start Date/Availability Matching (25% weight)

**Scoring Logic:**
- ≤7 days difference: 100%
- ≤14 days difference: 90%
- ≤30 days difference: 70%
- ≤60 days difference: 50%
- >60 days difference: 30%

**Candidate Availability Parsing:**
- "Immediately" / "ASAP" → 0 days
- "2 weeks" → 14 days
- "1 month" → 30 days
- Default: 30 days

**Example:**
```
Candidate availability: "2 weeks"
Job start date: February 10, 2026

Current date: January 26, 2026
Days until job start: 15 days
Candidate ready in: 14 days
Difference: 1 day

Date match: 100% (within 7 days)
Weighted contribution: 1.0 × 25% = 25%
```

---

### 3. Location Matching (20% weight)

**Scoring Logic:**

| Scenario | Score |
|----------|-------|
| Both Remote | 100% |
| One Remote | 80% |
| Same City/Location | 100% |
| Same State/Region | 70% |
| Different Location | 30% |

**Example:**
```
Candidate: "San Francisco, CA" (Remote preferred)
Job: "Remote" (anywhere)

Location match: 100% (both remote-compatible)
Weighted contribution: 1.0 × 20% = 20%
```

---

### 4. Salary Range Matching (15% weight)

**Scoring Logic:**

**With Overlap:**
- 80%+ overlap: 100%
- 50-80% overlap: 90%
- 30-50% overlap: 70%
- <30% overlap: 50%

**Without Overlap:**
- Gap ≤10% of avg range: 70%
- Gap ≤20% of avg range: 50%
- Gap >20% of avg range: 20%

**Example:**
```
Candidate rate: $80-$100/hr
Job rate: $90-$120/hr

Overlap: $90-$100 = $10
Candidate range: $20
Job range: $30
Average range: $25

Overlap ratio: $10 / $25 = 40%
Salary match: 70% (30-50% overlap)
Weighted contribution: 0.7 × 15% = 10.5%
```

---

## Complete Match Score Calculation

### Formula:
```
Overall Match Score = 
    (Role Score × 0.40) +
    (Date Score × 0.25) +
    (Location Score × 0.20) +
    (Salary Score × 0.15)
```

### Example: Complete Calculation

**Candidate Profile:**
- Role: "Senior Full Stack Developer"
- Seniority: "Senior"
- Availability: "2 weeks"
- Location: "San Francisco, CA"
- Rate: $80-$100/hr

**Job Posting:**
- Role: "Senior Software Engineer"
- Seniority: "Senior"
- Start Date: February 10, 2026
- Location: "Remote"
- Rate: $90-$120/hr

**Calculations:**

1. **Role + Seniority (40%)**
   - Role match: 90% (keywords match)
   - Seniority match: 100% (both Senior)
   - Combined: (0.9 × 0.7) + (1.0 × 0.3) = 0.93
   - **Contribution: 0.93 × 0.40 = 0.372 (37.2%)**

2. **Start Date (25%)**
   - Date difference: 1 day
   - Date match: 100%
   - **Contribution: 1.0 × 0.25 = 0.25 (25%)**

3. **Location (20%)**
   - Remote compatible
   - Location match: 100%
   - **Contribution: 1.0 × 0.20 = 0.20 (20%)**

4. **Salary (15%)**
   - Overlap: $10 / $25 = 40%
   - Salary match: 70%
   - **Contribution: 0.7 × 0.15 = 0.105 (10.5%)**

**Final Match Score:**
```
Total = 37.2% + 25% + 20% + 10.5% = 92.7% ✅ EXCELLENT MATCH
```

---

## Match Quality Tiers

| Score Range | Tier | Description |
|-------------|------|-------------|
| 90-100% | 🟢 Excellent | Perfect or near-perfect match |
| 70-89% | 🟡 Good | Strong compatibility |
| 50-69% | 🟠 Fair | Moderate fit, some compromises |
| 20-49% | 🔴 Poor | Significant mismatches |
| <20% | ⚫ No Match | Not recommended |

**Minimum Threshold:** 20% (recommendations below this are filtered out)

---

## Two-Way Recommendations

### For Candidates:
```
GET /api/candidates/me/recommendations?top_n=10
```
**Returns:**
- Job postings ranked by match score
- Match breakdown (role, date, location, salary percentages)
- Match reasons (top 3 alignment points)
- Matched preference name (if using job preferences)

**Response Format:**
```json
{
  "candidate_id": 123,
  "candidate_name": "John Doe",
  "total_recommendations": 10,
  "recommendations": [
    {
      "job": {
        "id": 45,
        "title": "Senior Software Engineer",
        "role": "Senior Software Engineer",
        "seniority": "Senior",
        "location": "Remote",
        "min_rate": 90,
        "max_rate": 120,
        "start_date": "2026-02-10"
      },
      "match_score": 92.7,
      "match_breakdown": {
        "role_match": 93.0,
        "date_match": 100.0,
        "location_match": 100.0,
        "salary_match": 70.0
      },
      "match_reasons": [
        "Excellent role match: Senior Full Stack Developer → Senior Software Engineer",
        "Availability aligns perfectly with start date",
        "Remote work - location flexible"
      ],
      "matched_preference": "Remote Tech Jobs"
    }
  ]
}
```

### For Recruiters:
```
GET /api/jobs/recommendations/all?top_n=10&offset=0
```
**Returns:**
- Candidates ranked by match score **across all active jobs**
- Best matching job for each candidate
- Match breakdown and reasons
- Excludes candidates already swiped/rejected

**Response Format:**
```json
{
  "company_id": 5,
  "total_jobs": 3,
  "total_recommendations": 10,
  "total_available": 45,
  "excluded_count": 12,
  "recommendations": [
    {
      "candidate": {
        "id": 123,
        "name": "John Doe",
        "email": "john@example.com",
        "location": "San Francisco, CA",
        "years_experience": 8,
        "rate_min": 80,
        "rate_max": 100,
        "skills": [...]
      },
      "best_match_job_id": 45,
      "best_match_job_title": "Senior Software Engineer",
      "match_score": 92.7,
      "match_breakdown": {
        "role_match": 93.0,
        "date_match": 100.0,
        "location_match": 100.0,
        "salary_match": 70.0
      },
      "match_reasons": [
        "Excellent role match: Senior Full Stack Developer → Senior Software Engineer",
        "Availability aligns perfectly with start date",
        "Remote work - location flexible"
      ],
      "matched_preference": "Remote Tech Jobs"
    }
  ]
}
```

---

## Candidate Job Preferences

Candidates can create **multiple job preferences** (e.g., "Remote Tech Jobs", "SF Bay Area Contracts", "Lead Roles Only"). The algorithm:

1. Calculates match scores for **each preference** vs. each job
2. Uses the **highest scoring preference** for that candidate-job pair
3. Returns which preference led to the match

**Benefit:** Candidates seeking different types of roles (e.g., remote full-time vs. local contract) get separate optimized matches for each preference.

---

## Exclusions & Filtering

### Automatic Exclusions:
- Jobs with `status != 'active'`
- Candidates/jobs already swiped (LIKE/PASS)
- Candidates who applied or were rejected
- Matches below 20% threshold

### Pagination:
- `top_n`: Number of results per page (default: 10)
- `offset`: Starting index for pagination (default: 0)

---

## Performance Considerations

- **Caching:** Consider caching recommendations for 1-2 hours
- **Batch Processing:** Pre-calculate scores for all pairs daily
- **Real-time Updates:** Recalculate when:
  - New job posted
  - Candidate updates profile
  - Candidate adds/modifies preferences

---

## Testing the Algorithm

### Test Data Generator:
```python
# Sample candidate
candidate = {
    'id': 1,
    'primary_role': 'Senior Software Engineer',
    'location': 'San Francisco, CA',
    'availability': '2 weeks',
    'work_type': 'Remote',
    'rate_min': 80,
    'rate_max': 100
}

# Sample job
job = {
    'id': 1,
    'role': 'Senior Full Stack Engineer',
    'seniority': 'Senior',
    'location': 'Remote',
    'start_date': '2026-02-10',
    'work_type': 'Remote',
    'min_rate': 90,
    'max_rate': 120
}

# Calculate match
from app.recommendation_engine import RecommendationEngine
score, breakdown, reasons = RecommendationEngine.calculate_match_score(candidate, job)
print(f"Match Score: {score * 100:.1f}%")
print(f"Breakdown: {breakdown}")
print(f"Reasons: {reasons}")
```

### Expected Output:
```
Match Score: 92.7%
Breakdown: {'role_match': 93.0, 'date_match': 100.0, 'location_match': 100.0, 'salary_match': 70.0}
Reasons: ['Excellent role match: Senior Software Engineer → Senior Full Stack Engineer', 
          'Availability aligns perfectly with start date', 
          'Remote work - location flexible']
```

---

## Future Enhancements

1. **Skills Matching:** Add skill-based scoring (weights from job description)
2. **Machine Learning:** Train model on successful matches
3. **Collaborative Filtering:** "Candidates like you also liked..."
4. **Diversity Scoring:** Promote diverse candidate pools
5. **Geographic Distance:** Calculate actual miles/km for location scoring
6. **Recency Boost:** Prioritize newly posted jobs or active candidates
7. **Mutual Interest:** Boost score if both parties liked similar roles before

---

## API Endpoints Summary

| Endpoint | Method | Description | Audience |
|----------|--------|-------------|----------|
| `/api/candidates/me/recommendations` | GET | Get job recommendations for logged-in candidate | Candidate |
| `/api/jobs/recommendations/all` | GET | Get candidate recommendations across all company jobs | Recruiter |
| `/api/jobs/{job_id}/candidates` | GET | Get candidates for specific job | Recruiter |

---

## Code Location

- **Algorithm Implementation:** `backend/app/recommendation_engine.py`
- **API Endpoints:**
  - Candidate recommendations: `backend/app/routers/candidates.py` (line 221)
  - Recruiter recommendations: `backend/app/routers/jobs.py` (line 953)

---

**Last Updated:** January 26, 2026  
**Algorithm Version:** 1.0  
**Author:** Moblyze POC Team
