# TalentGraph – Candidate Profile & Talent Marketplace

This is a proof-of-concept for an enterprise talent marketplace focusing on the **candidate side**:

- Create a candidate profile
- Choose Product Author (Oracle, SAP, Salesforce, Microsoft, Other)
- Choose Product (e.g. Oracle E-Business Suite, SaaS, PeopleSoft, JDE)
- Add basic skills
- Upload a resume
- (POC) Enrich the profile with “AI-extracted” skills/certifications
- View a mock match score

Stack:

- Backend: FastAPI + SQLModel + SQLite
- Frontend: Streamlit
- AI: Placeholder (later replace with real LLM parsing)

## Run Instructions

### 1. Backend

```bash
cd backend
python -m venv venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1 # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

### 2. Frontend 

```bash
cd frontend
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
python -m venv venv
.\venv\Scripts\Activate.ps1 # Windows: venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
