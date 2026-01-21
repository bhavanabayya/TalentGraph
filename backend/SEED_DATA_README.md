# Seed Data Documentation

## Overview

This document describes the seed data system for the TalentGraph application. The seed data populates your database with realistic sample data to demonstrate all features of the application including candidate profiles, job preferences, company accounts, and job postings.

## What's Included

### 👥 Candidates (2 profiles)

#### 1. Sarah Anderson
- **Email:** sarah.anderson@email.com
- **Password:** password123
- **Role:** Oracle Fusion Functional Consultant
- **Experience:** 8 years
- **Location:** San Francisco, CA
- **Work Type:** Remote
- **Rate:** $125-175/hr
- **Skills:** 
  - Oracle Fusion Cloud (Expert)
  - Oracle EBS (Advanced)
  - Financial Management (Expert)
  - Supply Chain Management (Advanced)
  - SQL, OTBI Reporting, Project Management
- **Certifications:**
  - Oracle Cloud Infrastructure Foundations (2023)
  - Oracle Fusion Financials Cloud Service (2022)
  - PMP - Project Management Professional (2021)
- **Job Preferences:**
  1. Oracle Fusion - Senior Finance Role
  2. Oracle EBS - Supply Chain Specialist

#### 2. Michael Chen
- **Email:** michael.chen@email.com
- **Password:** password123
- **Role:** Oracle HCM Cloud Consultant
- **Experience:** 6 years
- **Location:** Austin, TX
- **Work Type:** Hybrid
- **Rate:** $110-150/hr
- **Skills:**
  - Oracle HCM Cloud (Expert)
  - Core HR (Expert)
  - Talent Management (Advanced)
  - Payroll (Advanced)
  - HSDL, Fast Formulas, BIP Reporting
- **Certifications:**
  - Oracle HCM Cloud Implementation Specialist (2023)
  - Oracle Talent Management Cloud (2022)
  - SHRM-CP (2021)
- **Job Preferences:**
  1. Oracle HCM - Full Implementation
  2. Oracle Fusion - Payroll Specialist

### 🏢 Company Account

**Company Name:** TechCorp Solutions
- **Location:** San Francisco, CA
- **Description:** Leading enterprise technology consulting firm specializing in Oracle Cloud implementations

**Company Users (3):**

1. **Jennifer Smith** (ADMIN)
   - Email: hr.admin@techcorp.com
   - Password: admin123
   - Full administrative access

2. **Jane Williams** (HR)
   - Email: recruiter.jane@techcorp.com
   - Password: recruiter123
   - Can create and manage job postings

3. **Robert Johnson** (HR)
   - Email: hr.manager@techcorp.com
   - Password: manager123
   - Can create and manage job postings

### 💼 Job Postings (6 active positions)

1. **Senior Oracle Fusion Financials Consultant**
   - Contract, 12 months, $140-180/hr
   - Location: San Francisco, CA (Hybrid)
   - Focus: Full-cycle Fusion Financials implementation

2. **Oracle HCM Cloud Implementation Consultant**
   - Contract, 9 months, $120-160/hr
   - Location: Austin, TX (Hybrid)
   - Focus: Core HR, Talent, and Payroll modules

3. **Oracle EBS Supply Chain Consultant**
   - Contract, 6 months, $130-170/hr
   - Location: Remote
   - Focus: Inventory, Order Management, Purchasing

4. **Oracle Payroll Cloud Specialist**
   - Contract, 8 months, $115-155/hr
   - Location: Remote
   - Focus: Payroll Cloud with Fast Formulas

5. **Oracle Fusion Technical Consultant**
   - Permanent, $140-180k/year
   - Location: San Francisco, CA (Hybrid)
   - Focus: Integrations, APIs, OTBI, BIP

6. **Junior Oracle Fusion Financials Consultant**
   - Permanent, $75-95k/year
   - Location: Austin, TX (Hybrid)
   - Focus: Entry-level with training provided

## Running the Seed Data Script

### Prerequisites

1. PostgreSQL database running (port 5433)
2. Backend virtual environment created
3. All dependencies installed (`pip install -r requirements.txt`)

### Method 1: Using PowerShell Script (Recommended)

```powershell
cd backend
.\run_seed_data.ps1
```

This script will:
- Activate the virtual environment automatically
- Run the seed data script
- Display a summary of created data
- Provide login credentials

### Method 2: Manual Execution

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python seed_data.py
```

## What Happens When You Run the Script

1. **Clears Existing Seed Data**
   - Removes any previously created seed data
   - Preserves other database records
   - Maintains database integrity

2. **Creates Candidates**
   - 2 complete candidate profiles
   - Skills, certifications, and social links for each
   - 2 job preferences per candidate
   - Total: 4 job preference profiles

3. **Creates Company Account**
   - 1 company (TechCorp Solutions)
   - 3 company users with different roles
   - Ready for job management

4. **Creates Job Postings**
   - 6 diverse job postings
   - Mix of contract and permanent positions
   - Various seniority levels
   - All visible to company users

## Data Synchronization

The seed data is fully integrated with your application:

### ✅ Database → UI Sync
- All candidate profiles appear in the recruiter dashboard
- Job postings are visible in the job management section
- Candidate preferences are available for matching
- Skills and certifications display in candidate cards

### ✅ UI → Database Sync
- Updates made in the UI are persisted to database
- New job postings created via UI are stored properly
- Candidate profile updates sync automatically
- Swipe actions and applications are recorded

## Testing the Integration

### As a Candidate:
1. Login with candidate credentials
2. View your profile with all skills and certifications
3. Browse available job postings
4. Apply for jobs
5. Update your preferences

### As HR/Admin:
1. Login with company credentials
2. View all job postings in job management
3. Create new job postings
4. View candidate applications
5. Browse candidate profiles (if implemented)

### As a Recruiter:
1. Login with recruiter credentials
2. Access job management dashboard
3. View assigned jobs
4. Review candidate matches
5. Update job status

## Verifying the Data

### Check Database Directly:

```sql
-- Count records
SELECT 'Candidates' as table_name, COUNT(*) as count FROM candidate
UNION ALL
SELECT 'Job Preferences', COUNT(*) FROM candidatejobpreference
UNION ALL
SELECT 'Company Users', COUNT(*) FROM companyuser
UNION ALL
SELECT 'Job Postings', COUNT(*) FROM jobpost;

-- View candidate details
SELECT c.name, c.email, c.primary_role, c.years_experience, c.location
FROM candidate c;

-- View job postings
SELECT jp.title, jp.location, jp.work_type, jp.job_type, jp.status
FROM jobpost jp;
```

### Check via API:

```bash
# Get all candidates (requires authentication)
curl http://localhost:8000/candidates/

# Get all job postings
curl http://localhost:8000/jobs/list

# Get company profile (requires company user auth)
curl http://localhost:8000/company/profile
```

## Troubleshooting

### Script Fails to Run

**Problem:** Import errors or module not found
```
Solution: Ensure virtual environment is activated
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Problem:** Database connection error
```
Solution: Check PostgreSQL is running
docker ps  # Should show postgres container
# Or check DATABASE_URL in .env file
```

**Problem:** Foreign key constraint errors
```
Solution: Run the script with a fresh database
# Or manually clear tables in correct order
```

### Data Not Appearing in UI

**Problem:** Candidates not visible to recruiters
```
Solution: Check authentication token and company_id
# Ensure you're logged in as a company user
```

**Problem:** Job postings not showing
```
Solution: Verify job status is "active"
SELECT * FROM jobpost WHERE status = 'active';
```

**Problem:** Preferences not loading
```
Solution: Check is_active flag on preferences
SELECT * FROM candidatejobpreference WHERE is_active = true;
```

## Customizing Seed Data

You can modify [seed_data.py](d:\WORK\App\backend\seed_data.py) to:

- Add more candidates
- Change candidate profiles and skills
- Add different job postings
- Modify company information
- Adjust rate ranges and requirements

### Example: Adding a New Candidate

```python
{
    "email": "john.doe@email.com",
    "password": "password123",
    "name": "John Doe",
    "phone": "+1 (555) 000-0000",
    "location": "New York, NY",
    "primary_role": "Oracle DBA",
    "years_experience": 10,
    # ... add more fields
}
```

### Example: Adding a New Job Posting

```python
{
    "title": "Oracle Database Administrator",
    "product_author": "Oracle",
    "product": "Database",
    "role": "Oracle DBA",
    "job_type": "Permanent",
    "location": "New York, NY",
    "work_type": "Hybrid",
    "salary_min": 120000.0,
    "salary_max": 160000.0,
    # ... add more fields
}
```

## Clearing Seed Data

To remove all seed data:

```python
# Add this function to seed_data.py and run it
def clear_all_seed_data():
    with Session(engine) as session:
        clear_existing_data(session)
        print("✅ All seed data cleared")
```

Or run:
```powershell
python -c "from seed_data import clear_existing_data; from app.database import engine; from sqlmodel import Session; clear_existing_data(Session(engine))"
```

## Best Practices

1. **Run seed data on a clean database** - Avoid conflicts with existing data
2. **Use seed data for development** - Not recommended for production
3. **Backup before running** - If you have important data
4. **Update passwords** - Change default passwords in production
5. **Test thoroughly** - Verify all features work with seed data

## Integration Points

### Frontend Components Using Seed Data:

- **Job Listings:** Displays all 6 job postings
- **Candidate Dashboard:** Shows candidate profile and preferences
- **Recruiter Dashboard:** Lists jobs and candidates
- **Job Detail Page:** Shows detailed job information
- **Application Flow:** Uses job and candidate data

### API Endpoints Using Seed Data:

- `GET /jobs/list` - Returns job postings
- `GET /candidates/profile` - Returns candidate data
- `GET /company/profile` - Returns company information
- `POST /jobs/create` - Creates new jobs (tested with seed company users)
- `GET /preferences/candidate/{id}` - Returns candidate preferences

## Next Steps

After running the seed data:

1. ✅ **Test Candidate Portal**
   - Login as Sarah or Michael
   - View and edit profile
   - Browse and apply for jobs

2. ✅ **Test Recruiter Portal**
   - Login as Jennifer, Jane, or Robert
   - View job management dashboard
   - Create new job postings
   - Review applications

3. ✅ **Test Job Management**
   - View all active jobs
   - Filter and search jobs
   - Update job status
   - Assign jobs to recruiters

4. ✅ **Verify Data Sync**
   - Make changes in UI
   - Check database for updates
   - Create new records
   - Confirm bidirectional sync

## Support

If you encounter issues:

1. Check the error messages in terminal
2. Review PostgreSQL logs
3. Verify database connection settings
4. Ensure all migrations are applied
5. Check the troubleshooting section above

---

**Last Updated:** January 21, 2026
**Version:** 1.0
**Author:** TalentGraph Development Team
