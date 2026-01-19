# Backend Setup Guide

## Quick Start

### 1. Prerequisites
```bash
Python 3.10+
pip (Python package manager)
```

### 2. Create Virtual Environment
```bash
cd backend
python -m venv venv
```

### 3. Activate Virtual Environment
**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
venv\Scripts\activate.bat
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

### 5. Create .env File
```bash
# Create .env file in backend/ directory
APP_JWT_SECRET=your-super-secret-key-change-in-production
APP_JWT_EXP_HOURS=24

# SMTP Configuration (optional for OTP email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=TalentGraph
SMTP_FROM_EMAIL=noreply@talentgraph.com
```

### 6. Run Backend Server
```bash
uvicorn app.main:app --reload
```

Server will start at: `http://127.0.0.1:8000`
API docs available at: `http://127.0.0.1:8000/docs`

### 7. Reset Database (if needed)
```bash
# Delete the SQLite database
rm moblyze_poc.db

# Or on Windows:
del moblyze_poc.db

# Database will be recreated automatically on next startup
```

---

## Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `APP_JWT_SECRET` | Secret key for signing JWT tokens | `my-secret-key` |
| `APP_JWT_EXP_HOURS` | JWT token expiration in hours | `24` |
| `SMTP_HOST` | Email server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | Email server port | `587` |
| `SMTP_USERNAME` | Email account for sending OTPs | `your-email@gmail.com` |
| `SMTP_PASSWORD` | Email account password or app password | `your-password` |
| `SMTP_FROM_NAME` | Display name in emails | `TalentGraph` |
| `SMTP_FROM_EMAIL` | From email address | `noreply@talentgraph.com` |

### Gmail Setup (for SMTP)
1. Enable 2-Factor Authentication on Gmail
2. Generate "App Password" at https://myaccount.google.com/apppasswords
3. Use the 16-character app password as `SMTP_PASSWORD`

---

## API Endpoints Reference

### Health Check
- `GET /` - API status

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/login` - Login with password
- `POST /auth/send-otp` - Send OTP to email
- `POST /auth/verify-otp` - Verify OTP and get JWT

### Candidates
- `GET /candidates/me` - Get current candidate profile
- `PATCH /candidates/me` - Update profile
- `POST /candidates/skills` - Add skill
- `POST /candidates/certifications` - Add certification
- `POST /candidates/resumes/upload` - Upload resume

### Company
- `POST /company/create-account` - Create company
- `GET /company/profile` - Get company profile
- `POST /company/invite-employee` - Invite employee
- `GET /company/employees` - List employees

### Jobs
- `POST /jobs/create` - Create job posting
- `GET /jobs/` - List company jobs
- `GET /jobs/{id}` - Get job details
- `PATCH /jobs/{id}` - Update job
- `DELETE /jobs/{id}` - Delete job

### Swipes (Matching)
- `GET /swipes/feed/{job_id}` - Get candidate feed
- `POST /swipes/like` - Like candidate
- `POST /swipes/pass` - Pass on candidate
- `GET /swipes/shortlist/{job_id}` - Get liked candidates
- `GET /swipes/ranking/{job_id}` - Get ranking

### Ontology
- `GET /job-roles/` - List all product authors
- `GET /job-roles/{author}` - Get products for author
- `GET /job-roles/{author}/{product}` - Get roles for product

---

## Testing with FastAPI Docs

1. Open browser to: `http://127.0.0.1:8000/docs`
2. Use the interactive Swagger UI to test endpoints
3. For authenticated endpoints:
   - Click "Authorize" button
   - Paste your JWT token (after calling /auth/verify-otp)
   - Start with "Bearer " prefix

---

## Troubleshooting

### Database Locked Error
```
sqlite3.OperationalError: database is locked
```
**Solution:** Delete `moblyze_poc.db` and restart server

### Port Already in Use
```
OSError: [Errno 10048] Only one usage of each socket address
```
**Solution:** Use different port:
```bash
uvicorn app.main:app --reload --port 8001
```

### OTP Email Not Sending
- Check SMTP credentials in .env
- Verify email account has 2FA enabled (for Gmail)
- Check firewall not blocking port 587
- For development, check console output for OTP code

### JWT Token Issues
- Token expired? Call `/auth/verify-otp` again to get new token
- Token format: `Bearer {token}` in Authorization header
- Default expiry: 24 hours (configurable via `APP_JWT_EXP_HOURS`)

---

## Production Checklist

- [ ] Change `APP_JWT_SECRET` to a strong random value
- [ ] Migrate from SQLite to PostgreSQL
- [ ] Set up proper SMTP service (SendGrid, AWS SES, etc.)
- [ ] Enable HTTPS
- [ ] Add rate limiting middleware
- [ ] Add request logging
- [ ] Deploy behind reverse proxy (Nginx)
- [ ] Set up monitoring and alerting
- [ ] Add input validation and sanitization
- [ ] Implement CORS properly (restrict origins)
