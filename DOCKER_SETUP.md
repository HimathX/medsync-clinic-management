# 🐳 MedSync Clinic Management - Docker Setup Guide

Complete guide to run the MedSync Clinic Management System using Docker.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Accessing the Application](#accessing-the-application)
5. [Troubleshooting](#troubleshooting)
6. [Development Workflow](#development-workflow)
7. [Useful Commands](#useful-commands)

---

## ✅ Prerequisites

Before starting, ensure you have installed:

- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
  - Download: https://www.docker.com/products/docker-desktop
  - Version: 20.10 or higher
- **Docker Compose**
  - Included with Docker Desktop
  - Standalone: https://docs.docker.com/compose/install/
  - Version: 2.0 or higher
- **Git** (to clone the repository)
  - Download: https://git-scm.com/downloads

### Verify Installation

```bash
# Check Docker version
docker --version
# Expected: Docker version 20.10.x or higher

# Check Docker Compose version
docker-compose --version
# Expected: Docker Compose version 2.x.x or higher

# Check Docker is running
docker ps
# Should show empty list (no containers running yet)
```

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd medsync-clinic-management
```

### 2. Start All Services

```bash
# Start all services (MySQL, Backend, Frontend)
docker-compose up -d

# Watch logs (optional)
docker-compose logs -f
```

### 3. Wait for Initialization (First Run Only)

**Important:** The first run takes **2-3 minutes** to:
- Download Docker images
- Initialize MySQL database
- Install Python dependencies
- Install Node.js dependencies

**You'll see:**
```
medsync_mysql     | MySQL init process done. Ready for start up.
medsync_backend   | Application startup complete.
medsync_frontend  | webpack compiled successfully
```

### 4. Access the Application

- **Frontend (React):** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs (Swagger):** http://localhost:8000/docs
- **MySQL:** localhost:3307

---

## 📖 Detailed Setup

### Step 1: Project Structure

Ensure your project structure looks like this:

```
medsync-clinic-management/
├── docker-compose.yml       # ⬅️ Main Docker orchestration file
├── backend/
│   ├── Dockerfile
│   ├── .env                 # ⬅️ Backend environment variables
│   ├── requirements.txt
│   └── main.py
├── frontend/
│   ├── Dockerfile
│   ├── .env                 # ⬅️ Frontend environment variables
│   ├── package.json
│   └── src/
└── database/
    ├── 1_tables.sql         # ⬅️ Database schema
    ├── 2_functions.sql
    ├── 3_procedures.sql
    ├── 4_triggers.sql
    ├── 5_records.sql        # ⬅️ Sample data
    └── 6_branch_initialization.sql
```

### Step 2: Environment Configuration

#### **Backend Environment** (`backend/.env`)

```env
# Database Configuration (Docker internal network)
DB_HOST=mysql                    # ⬅️ Use container name, not localhost!
DB_USER=medsync_user
DB_PASSWORD=medsync_password
DB_NAME=medsync_db
DB_PORT=3306                     # ⬅️ Internal container port

# JWT Configuration
SECRET_KEY=group6
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

⚠️ **Important:** 
- Use `DB_HOST=mysql` (container name), NOT `localhost`
- Use `DB_PORT=3306` (internal port), NOT `3307`

#### **Frontend Environment** (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:8000
```

### Step 3: Start Services

```bash
# Start all services in detached mode
docker-compose up -d

# Or start specific services
docker-compose up -d mysql      # MySQL only
docker-compose up -d backend    # Backend only
docker-compose up -d frontend   # Frontend only
```

### Step 4: Check Service Health

```bash
# Check all containers are running
docker-compose ps

# Expected output:
# NAME               STATUS              PORTS
# medsync_mysql      Up (healthy)        0.0.0.0:3307->3306/tcp
# medsync_backend    Up                  0.0.0.0:8000->8000/tcp
# medsync_frontend   Up                  0.0.0.0:3000->3000/tcp
```

### Step 5: View Logs

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs -f mysql
docker-compose logs -f backend
docker-compose logs -f frontend

# View last 50 lines
docker-compose logs --tail 50
```

---

## 🌐 Accessing the Application

### Frontend (User Interface)

**URL:** http://localhost:3000

**Default Credentials:**
```
Email: admin@medsync.com
Password: admin123
```

### Backend API

**URL:** http://localhost:8000

**API Documentation (Swagger UI):** http://localhost:8000/docs

**Test API:**
```bash
# Windows PowerShell
Invoke-WebRequest -Uri http://localhost:8000

# Linux/Mac
curl http://localhost:8000
```

### MySQL Database

**Connection Details:**

| Parameter | Value |
|-----------|-------|
| Host | `localhost` |
| Port | `3307` ⚠️ |
| Username | `medsync_user` |
| Password | `medsync_password` |
| Database | `medsync_db` |

**Tools:**
- MySQL Workbench
- DBeaver
- phpMyAdmin
- CLI: `docker exec -it medsync_mysql mysql -u medsync_user -pmedsync_password medsync_db`

---

## 🐛 Troubleshooting

### Issue 1: Port Already in Use

**Error:**
```
Error: bind: address already in use
```

**Solution:**

```bash
# Windows: Find process using port
netstat -ano | findstr :3000
netstat -ano | findstr :8000
netstat -ano | findstr :3307

# Kill process (replace XXXX with PID)
taskkill /PID XXXX /F

# Linux/Mac: Find and kill process
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
lsof -ti:3307 | xargs kill -9
```

**Or change ports in `docker-compose.yml`:**
```yaml
ports:
  - "3001:3000"  # Use port 3001 instead
```

### Issue 2: MySQL Container Exits Immediately

**Check logs:**
```bash
docker-compose logs mysql
```

**Common causes:**
- SQL syntax error in initialization scripts
- Permission issues
- Corrupted volume data

**Solution:**
```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild and restart
docker-compose up --build
```

### Issue 3: Backend Can't Connect to Database

**Check `.env` file:**
```bash
# Windows
type backend\.env

# Linux/Mac
cat backend/.env
```

**Verify:**
- ✅ `DB_HOST=mysql` (not `localhost`)
- ✅ `DB_PORT=3306` (not `3307`)
- ✅ `DB_USER=medsync_user`
- ✅ `DB_PASSWORD=medsync_password`

**Test connection:**
```bash
docker exec -it medsync_backend python -c "
import mysql.connector
conn = mysql.connector.connect(
    host='mysql',
    user='medsync_user',
    password='medsync_password',
    database='medsync_db'
)
print('✅ Database connection successful!')
conn.close()
"
```

### Issue 4: Frontend Shows Network Error

**Check backend is running:**
```bash
docker-compose ps backend

# Test API manually
curl http://localhost:8000
```

**Check `frontend/.env`:**
```env
REACT_APP_API_URL=http://localhost:8000
```

**Restart frontend:**
```bash
docker-compose restart frontend
```

### Issue 5: ESLint Warnings in Frontend

**These are normal!** The warnings don't affect functionality.

**To suppress:**
```bash
# Add to frontend/.env
echo "ESLINT_NO_DEV_ERRORS=true" >> frontend/.env

# Restart
docker-compose restart frontend
```

---

## 💻 Development Workflow

### Making Code Changes

**Backend changes:**
```bash
# Code auto-reloads with uvicorn --reload
# Just edit files in backend/ folder
# Changes reflect automatically
```

**Frontend changes:**
```bash
# React hot-reload is enabled
# Edit files in frontend/src/
# Browser auto-refreshes
```

**Database changes:**
```bash
# Stop containers
docker-compose down -v

# Edit SQL files in database/

# Rebuild
docker-compose up --build
```

### Rebuilding Services

```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Force rebuild (no cache)
docker-compose build --no-cache

# Rebuild and restart
docker-compose up --build
```

### Accessing Container Shell

```bash
# Backend container
docker exec -it medsync_backend /bin/bash

# MySQL container
docker exec -it medsync_mysql /bin/bash

# Frontend container
docker exec -it medsync_frontend /bin/sh
```

### Database Backup & Restore

**Backup:**
```bash
# Backup entire database
docker exec medsync_mysql mysqldump -u medsync_user -pmedsync_password medsync_db > backup.sql

# Backup specific tables
docker exec medsync_mysql mysqldump -u medsync_user -pmedsync_password medsync_db user patient > backup_users.sql
```

**Restore:**
```bash
# Restore from backup
docker exec -i medsync_mysql mysql -u medsync_user -pmedsync_password medsync_db < backup.sql
```

---

## 🛠️ Useful Commands

### Container Management

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart all services
docker-compose restart

# Stop specific service
docker-compose stop backend

# Start specific service
docker-compose start backend

# Remove all containers and volumes (fresh start)
docker-compose down -v
```

### Logs & Debugging

```bash
# View all logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Last 50 lines
docker-compose logs --tail 50

# Specific service
docker-compose logs -f mysql
docker-compose logs -f backend
docker-compose logs -f frontend

# Filter logs
docker-compose logs | grep ERROR
docker-compose logs | findstr ERROR  # Windows
```

### System Cleanup

```bash
# Stop and remove all containers
docker-compose down

# Remove all containers, networks, volumes, images
docker-compose down -v --rmi all

# Remove unused Docker resources
docker system prune -a -f

# Check disk usage
docker system df
```

### Health Checks

```bash
# Check container status
docker-compose ps

# Check container health
docker inspect medsync_mysql | grep -i health
docker inspect medsync_mysql | findstr /i health  # Windows

# Check resource usage
docker stats

# Check specific container
docker stats medsync_backend
```

---

## 📊 Service Architecture

```
┌─────────────────┐
│   Frontend      │ http://localhost:3000
│   (React)       │
└────────┬────────┘
         │
         │ HTTP Requests
         ▼
┌─────────────────┐
│   Backend       │ http://localhost:8000
│   (FastAPI)     │
└────────┬────────┘
         │
         │ SQL Queries
         ▼
┌─────────────────┐
│   MySQL         │ localhost:3307
│   (Database)    │
└─────────────────┘
```

### Port Mapping

| Service | Container Port | Host Port | Access URL |
|---------|---------------|-----------|------------|
| Frontend | 3000 | 3000 | http://localhost:3000 |
| Backend | 8000 | 8000 | http://localhost:8000 |
| MySQL | 3306 | 3307 | localhost:3307 |

---

## 🔒 Security Notes

**For Production Deployment:**

1. **Change default passwords** in `docker-compose.yml`:
   ```yaml
   MYSQL_ROOT_PASSWORD: <strong-password>
   MYSQL_PASSWORD: <strong-password>
   ```

2. **Update JWT secret** in `backend/.env`:
   ```env
   SECRET_KEY=<generate-random-secret-key>
   ```

3. **Use environment-specific `.env` files:**
   - `.env.development`
   - `.env.production`

4. **Enable SSL/TLS** for MySQL connections

5. **Use Docker secrets** instead of environment variables

---

## 📞 Support

**Issues?** Check:
1. Docker is running: `docker ps`
2. Ports are available: `netstat -an | findstr "3000 8000 3307"`
3. Logs for errors: `docker-compose logs`

**Still stuck?** Contact the development team or check project documentation.

---

## 📝 Quick Reference Card

```bash
# START PROJECT
docker-compose up -d

# STOP PROJECT
docker-compose down

# VIEW LOGS
docker-compose logs -f

# RESTART SERVICE
docker-compose restart backend

# FRESH START (deletes data!)
docker-compose down -v && docker-compose up --build

# ACCESS MYSQL
docker exec -it medsync_mysql mysql -u medsync_user -pmedsync_password medsync_db

# CHECK STATUS
docker-compose ps
```

---

## ✅ Success Checklist

After running `docker-compose up -d`, verify:

- [ ] All 3 containers are running: `docker-compose ps`
- [ ] MySQL shows `(healthy)` status
- [ ] Backend logs show: `Application startup complete`
- [ ] Frontend logs show: `webpack compiled successfully`
- [ ] Can access http://localhost:3000 in browser
- [ ] Can access http://localhost:8000/docs (API docs)
- [ ] Can login with test credentials

**If all checked ✅ - You're ready to develop!** 🎉

---

**Version:** 1.0  
**Last Updated:** October 2025  
**Maintained by:** MedSync Development Team