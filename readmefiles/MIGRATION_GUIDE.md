# SQLite to PostgreSQL Migration Guide

## Step 1: Start PostgreSQL with Docker

```powershell
# Navigate to project root
cd D:\WORK\App

# Start PostgreSQL container
docker-compose up -d

# Verify PostgreSQL is running
docker ps

# Check PostgreSQL logs
docker logs moblyze_postgres
```

## Step 2: Install PostgreSQL Driver

```powershell
cd backend
pip install psycopg2-binary
```

## Step 3: Update Environment Variables

Create a `.env` file in the `backend` directory (copy from `.env.example`):

```env
APP_JWT_SECRET=your-secret-key-here
DATABASE_URL=postgresql://moblyze_user:moblyze_pass@localhost:5432/moblyze_db
```

## Step 4: Initialize PostgreSQL Database

The database will be automatically created when you start the backend:

```powershell
cd D:\WORK\App\backend
uvicorn app.main:app --reload
```

The `init_db()` function will create all tables in PostgreSQL.

## Step 5: Migrate Data (if you have existing data in SQLite)

### Option A: Manual Migration (Small Dataset)
Since you just added visa/ethnicity fields, recreate test data:
1. Register new users
2. Create profiles
3. Post jobs

### Option B: Using pgloader (Large Dataset)

Install pgloader:
```powershell
# Using Chocolatey
choco install pgloader
```

Create migration script `migrate.load`:
```
load database
    from sqlite://D:/WORK/App/backend/moblyze_poc.db
    into postgresql://moblyze_user:moblyze_pass@localhost:5432/moblyze_db

with include drop, create tables, create indexes, reset sequences

set work_mem to '16MB', maintenance_work_mem to '512 MB';
```

Run migration:
```powershell
pgloader migrate.load
```

## Step 6: Verify Migration

```powershell
# Connect to PostgreSQL
docker exec -it moblyze_postgres psql -U moblyze_user -d moblyze_db

# List tables
\dt

# Check table schemas
\d candidate
\d candidatejobpreference

# Exit
\q
```

## Useful Docker Commands

```powershell
# Stop PostgreSQL
docker-compose down

# Stop and remove data
docker-compose down -v

# View logs
docker logs -f moblyze_postgres

# Access PostgreSQL shell
docker exec -it moblyze_postgres psql -U moblyze_user -d moblyze_db
```

## PostgreSQL Benefits Over SQLite

1. **Better Concurrency** - Multiple connections without locking
2. **Advanced Features** - Full-text search, JSON support, advanced indexing
3. **Production Ready** - Used by major applications
4. **Better Data Integrity** - Foreign key constraints always enforced
5. **Scalability** - Better performance with large datasets

## Troubleshooting

### Connection Refused
- Ensure Docker is running
- Check if port 5432 is available: `netstat -an | findstr 5432`
- Verify container is running: `docker ps`

### Authentication Failed
- Check credentials in docker-compose.yml match DATABASE_URL
- Restart container: `docker-compose restart`

### Migration Errors
- Ensure SQLite database exists before migrating
- Check pgloader logs for specific errors
- Verify table schemas match between SQLite and PostgreSQL
