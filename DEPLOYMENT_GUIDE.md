# Deployment Guide - TalentGraph App

## Prerequisites for Deployment

- Server with Python 3.12+ and Node.js 16+
- PostgreSQL database (recommended for production)
- SSL certificate for HTTPS
- Domain name
- Email service (SMTP) for OTP delivery
- Cloud storage (optional, for resume backups)

---

## Database Migration (SQLite → PostgreSQL)

### Step 1: Install PostgreSQL Driver

```bash
pip install psycopg2-binary
```

### Step 2: Update database.py

```python
# Change from:
DATABASE_URL = "sqlite:///./moblyze_poc.db"

# To:
DATABASE_URL = "postgresql://user:password@localhost/talentgraph"
```

### Step 3: Create PostgreSQL Database

```bash
createdb talentgraph
```

### Step 4: Migrate Data (if needed)

```bash
python scripts/migrate_data.py
```

---

## Backend Deployment (Production)

### Option 1: Using Gunicorn + Nginx

#### Step 1: Install Gunicorn

```bash
pip install gunicorn
```

#### Step 2: Create Systemd Service File

Create `/etc/systemd/system/talentgraph-api.service`:

```ini
[Unit]
Description=TalentGraph API
After=network.target

[Service]
Type=notify
User=talentgraph
WorkingDirectory=/app/backend
ExecStart=/app/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:8000 app.main:app
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

#### Step 3: Start Service

```bash
sudo systemctl enable talentgraph-api
sudo systemctl start talentgraph-api
```

#### Step 4: Configure Nginx as Reverse Proxy

Create `/etc/nginx/sites-available/talentgraph`:

```nginx
upstream talentgraph_api {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name api.talentgraph.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.talentgraph.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://talentgraph_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API documentation
    location /docs {
        proxy_pass http://talentgraph_api;
    }
}
```

#### Step 5: Enable Nginx Site

```bash
sudo ln -s /etc/nginx/sites-available/talentgraph /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Using Docker

Create `Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app ./app

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app.main:app"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: talentgraph
      POSTGRES_USER: talentgraph
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://talentgraph:secure_password@postgres/talentgraph
      APP_JWT_SECRET: your-secret-key
    depends_on:
      - postgres

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## Frontend Deployment (Production)

### Step 1: Build React App

```bash
cd react-frontend
npm install
npm run build
```

### Step 2: Serve with Nginx

Copy build files to Nginx:

```bash
sudo cp -r build/* /var/www/talentgraph/
```

Create `/etc/nginx/sites-available/talentgraph-frontend`:

```nginx
server {
    listen 80;
    server_name talentgraph.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name talentgraph.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    root /var/www/talentgraph;
    index index.html;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # React Router SPA support
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://api.talentgraph.com/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Step 3: Set Environment Variables

Create `.env` in react-frontend:

```
REACT_APP_API_URL=https://api.talentgraph.com
```

---

## Environment Variables (Production)

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/talentgraph

# JWT
APP_JWT_SECRET=your-very-secure-random-secret-key-here

# Email/SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=noreply@talentgraph.com
SMTP_PASSWORD=your-app-password

# Application
DEBUG=False
ENVIRONMENT=production
ALLOWED_ORIGINS=https://talentgraph.com,https://api.talentgraph.com
```

### Frontend (.env)

```bash
REACT_APP_API_URL=https://api.talentgraph.com
REACT_APP_ENVIRONMENT=production
```

---

## Security Checklist

- [x] Use HTTPS/SSL for all connections
- [x] Set strong JWT secret (min 32 characters)
- [x] Use PostgreSQL with strong passwords
- [x] Enable CORS only for your domain
- [x] Implement rate limiting
- [x] Use environment variables for secrets
- [x] Enable CSRF protection
- [x] Implement logging and monitoring
- [x] Regular security updates for dependencies
- [x] Use strong password hashing (Argon2 ✓)
- [x] Implement audit logging
- [x] Use firewall rules
- [x] Regular backups

---

## Performance Optimization

### Backend

```python
# Add caching to frequently accessed endpoints
from fastapi_cache2 import FastAPICache2
from fastapi_cache2.backends.redis import RedisBackend

@router.get("/job-roles/authors")
@cached(expire=3600)
async def get_authors():
    # Cached for 1 hour
    ...
```

### Frontend

```javascript
// Use React.memo for expensive components
const CandidateCard = React.memo(({ candidate }) => {
    return <div>{candidate.name}</div>;
});

// Lazy load pages
const CandidateDashboard = React.lazy(() => 
    import('./pages/CandidateDashboard')
);
```

---

## Monitoring & Logging

### Logging Setup

```python
# In main.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)
```

### Health Check Endpoint

```python
@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
```

---

## Backup Strategy

### Automatic Database Backups

```bash
# Create backup script (backup.sh)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump talentgraph > /backups/talentgraph_$DATE.sql
gzip /backups/talentgraph_$DATE.sql

# Add to crontab for daily backups at 2 AM
0 2 * * * /home/talentgraph/backup.sh
```

### Resume File Backups

```bash
# Backup resumes to cloud storage (AWS S3 example)
aws s3 sync /app/backend/uploads/ s3://my-bucket/resumes/ \
    --delete \
    --region us-east-1
```

---

## Update Procedure

### Backend Updates

```bash
# 1. Pull latest code
git pull origin main

# 2. Install new dependencies
pip install -r requirements.txt

# 3. Run migrations (if any)
alembic upgrade head

# 4. Restart service
sudo systemctl restart talentgraph-api
```

### Frontend Updates

```bash
# 1. Pull latest code
git pull origin main

# 2. Build new version
npm run build

# 3. Copy to deployment
sudo cp -r build/* /var/www/talentgraph/

# 4. Clear cache (if using CDN)
# (Service worker cache in production)
```

---

## Rollback Procedure

### If Deployment Fails

```bash
# Backend rollback
git checkout main~1
pip install -r requirements.txt
sudo systemctl restart talentgraph-api

# Frontend rollback
git checkout main~1
npm run build
sudo cp -r build/* /var/www/talentgraph/
```

---

## Monitoring Dashboard Setup

### Using Prometheus + Grafana

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'talentgraph-api'
    static_configs:
      - targets: ['localhost:8000']
```

---

## Load Testing

### Using Apache Bench

```bash
# Test homepage
ab -n 1000 -c 10 https://talentgraph.com/

# Test API endpoint
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
    https://api.talentgraph.com/candidates/me
```

### Using Locust

```python
from locust import HttpUser, task

class TalentGraphUser(HttpUser):
    @task
    def get_candidate_feed(self):
        self.client.get("/swipes/feed/1")
```

---

## Email Configuration (Production)

### Using SendGrid

```python
# Update security.py
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

def send_otp_email(email: str, code: str):
    message = Mail(
        from_email="noreply@talentgraph.com",
        to_emails=email,
        subject="Your TalentGraph OTP Code",
        html_content=f"Your OTP code is: <strong>{code}</strong>"
    )
    sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
    sg.send(message)
```

---

## Disaster Recovery Plan

1. **Daily backups**: Database + resume files
2. **Weekly archives**: Full system backup to S3
3. **Monthly testing**: Test restore procedure
4. **Documentation**: Keep runbook updated
5. **Monitoring**: Set up alerts for failures

---

## Post-Deployment Checklist

- [x] Test signup/login flow
- [x] Test candidate dashboard functionality
- [x] Test recruiter dashboard functionality
- [x] Test file uploads
- [x] Verify email delivery
- [x] Check performance metrics
- [x] Monitor error logs
- [x] Test backup/restore
- [x] Verify SSL certificate
- [x] Test mobile responsiveness
- [x] Validate API endpoints
- [x] Check database connections
- [x] Monitor disk space
- [x] Review security logs

---

## Support & Maintenance

For issues or questions:
1. Check logs: `tail -f /var/log/talentgraph/app.log`
2. Health check: `curl https://api.talentgraph.com/health`
3. Database check: `psql talentgraph -c "SELECT 1"`
4. Restart services: `sudo systemctl restart talentgraph-api`

---

**Deployment Status**: Ready for production
**Last Updated**: [Current Date]
**Version**: 1.0.0
