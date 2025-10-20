# MedSync Patient Portal - Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Development Deployment](#development-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Troubleshooting](#troubleshooting)
7. [Testing](#testing)

---

## 🎯 Prerequisites

### Required Software
- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Docker**: Version 20.x or higher (for containerized deployment)
- **Docker Compose**: Version 2.x or higher

### Backend Requirements
- MedSync Backend API must be running
- Database must be initialized with patient data
- Backend should be accessible at the configured API URL

### Check Prerequisites
```powershell
# Check Node.js version
node --version
# Expected: v18.x.x or higher

# Check npm version
npm --version
# Expected: 9.x.x or higher

# Check Docker version
docker --version
# Expected: Docker version 20.x.x or higher

# Check Docker Compose version
docker-compose --version
# Expected: Docker Compose version 2.x.x or higher
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)
```powershell
# From the project root directory
cd e:\Porjects\CATMS\medsync-clinic-management

# Build and start all services (including patient portal)
docker-compose up -d patient-portal

# Or start everything
docker-compose up -d

# Check if patient portal is running
docker ps | findstr patient_portal

# View logs
docker-compose logs -f patient-portal
```

**Access the application:**
- Patient Portal: http://localhost:3001
- Backend API: http://localhost:8000

### Option 2: Local Development
```powershell
# Navigate to new-frontend
cd e:\Porjects\CATMS\medsync-clinic-management\new-frontend

# Install dependencies
npm install

# Start development server
npm start
```

**Access the application:**
- Patient Portal: http://localhost:3000

---

## 💻 Development Deployment

### Step 1: Navigate to Project
```powershell
cd e:\Porjects\CATMS\medsync-clinic-management\new-frontend
```

### Step 2: Install Dependencies
```powershell
# Clean install (recommended for first time)
npm ci

# Or regular install
npm install
```

**Expected output:**
```
added 1500+ packages in 45s
```

### Step 3: Configure Environment
```powershell
# Copy environment template
copy .env.example .env

# Edit .env file (use notepad or your preferred editor)
notepad .env
```

**Update `.env` with your settings:**
```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=30000
REACT_APP_WEBSOCKET_URL=ws://localhost:8000
```

### Step 4: Start Development Server
```powershell
npm start
```

**Expected output:**
```
Compiled successfully!

You can now view medsync-patient-portal in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.x:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
```

### Step 5: Verify Application
1. Open browser: http://localhost:3000
2. You should see the login page
3. Try logging in with patient credentials

---

## 🐳 Docker Deployment

### Method 1: Using Docker Compose (Recommended)

#### Step 1: Build and Start
```powershell
# From project root
cd e:\Porjects\CATMS\medsync-clinic-management

# Build the patient portal image
docker-compose build patient-portal

# Start patient portal (and dependencies)
docker-compose up -d patient-portal
```

#### Step 2: Verify Container
```powershell
# Check if container is running
docker ps | findstr patient_portal

# Expected output:
# CONTAINER ID   IMAGE                    STATUS          PORTS
# abc123def456   medsync_patient_portal   Up 2 minutes    0.0.0.0:3001->80/tcp
```

#### Step 3: Check Logs
```powershell
# View logs
docker-compose logs -f patient-portal

# Last 100 lines
docker-compose logs --tail=100 patient-portal
```

#### Step 4: Test Health
```powershell
# Health check
docker inspect medsync_patient_portal | findstr Health

# Or use curl (if available)
curl http://localhost:3001
```

### Method 2: Standalone Docker

#### Build Image
```powershell
cd e:\Porjects\CATMS\medsync-clinic-management\new-frontend

docker build -t medsync-patient-portal:latest .
```

#### Run Container
```powershell
docker run -d `
  --name medsync_patient_portal `
  -p 3001:80 `
  -e REACT_APP_API_BASE_URL=http://backend:8000 `
  --network medsync_network `
  medsync-patient-portal:latest
```

### Managing Docker Containers

```powershell
# Stop container
docker-compose stop patient-portal

# Start container
docker-compose start patient-portal

# Restart container
docker-compose restart patient-portal

# Remove container (keeps image)
docker-compose down patient-portal

# Remove container and image
docker-compose down patient-portal --rmi local

# View container details
docker inspect medsync_patient_portal

# Execute command in container
docker exec -it medsync_patient_portal sh

# View nginx logs inside container
docker exec medsync_patient_portal cat /var/log/nginx/access.log
```

---

## 🏭 Production Deployment

### Step 1: Build Production Bundle
```powershell
cd e:\Porjects\CATMS\medsync-clinic-management\new-frontend

# Set production environment
$env:NODE_ENV="production"

# Build
npm run build
```

**Expected output:**
```
Creating an optimized production build...
Compiled successfully.

File sizes after gzip:

  150.23 kB  build\static\js\main.abc123.js
  25.45 kB   build\static\css\main.def456.css

The project was built assuming it is hosted at /.
You can control this with the homepage field in your package.json.

The build folder is ready to be deployed.
```

### Step 2: Docker Production Build
```powershell
# Build production image
docker build -t medsync-patient-portal:v1.0.0 .

# Tag for registry (optional)
docker tag medsync-patient-portal:v1.0.0 yourregistry/medsync-patient-portal:v1.0.0
```

### Step 3: Deploy to Production Server

#### Option A: Docker Compose on Server
```powershell
# Copy files to server
scp docker-compose.yml user@server:/path/to/app/
scp -r new-frontend user@server:/path/to/app/

# SSH to server
ssh user@server

# On server
cd /path/to/app
docker-compose up -d patient-portal
```

#### Option B: Standalone Nginx
```powershell
# Copy build files to nginx directory
copy build\* C:\nginx\html\patient-portal\

# Update nginx configuration
notepad C:\nginx\conf\nginx.conf
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name patient.medsync.com;
    root C:/nginx/html/patient-portal;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend-server:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🧪 Testing

### Test Patient Login
Use these test credentials (make sure they exist in your database):

```
Email: patient@medsync.com
Password: [your-patient-password]
```

### Verify Features

#### 1. Login
```powershell
# Navigate to login page
# Enter credentials
# Should redirect to dashboard
```

#### 2. Dashboard
- Should display patient statistics
- Should show upcoming appointments
- Should display medical alerts (if any)

#### 3. Appointments
- Should list all appointments
- Should be able to filter by status
- Should be able to book new appointment

#### 4. Medical Records
- Should display patient profile
- Should show consultations
- Should display vital signs

#### 5. Profile
- Should load patient information
- Should be able to update contact details
- Should save changes successfully

### API Connection Test
```powershell
# Test backend connectivity
curl http://localhost:8000/api/auth/health

# Expected response:
# {"status": "healthy", "timestamp": "2025-10-20T..."}
```

---

## 🔧 Troubleshooting

### Issue 1: "Cannot find module" Errors
**Problem:** TypeScript compilation errors about missing modules

**Solution:**
```powershell
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Issue 2: Port 3001 Already in Use
**Problem:** Port conflict when starting container

**Solution:**
```powershell
# Find process using port
netstat -ano | findstr :3001

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
# - "3002:80"  # Change 3001 to 3002
```

### Issue 3: Container Exits Immediately
**Problem:** Docker container starts but exits

**Solution:**
```powershell
# Check logs
docker-compose logs patient-portal

# Common issues:
# 1. Build failed - rebuild image
docker-compose build --no-cache patient-portal

# 2. Nginx config error - check nginx.conf syntax
docker run --rm -v ${PWD}/new-frontend/nginx.conf:/etc/nginx/conf.d/default.conf nginx nginx -t
```

### Issue 4: API Connection Failed
**Problem:** Frontend cannot connect to backend

**Solution:**
```powershell
# Check backend is running
docker ps | findstr backend

# Check network connectivity
docker exec medsync_patient_portal ping backend

# Update .env with correct backend URL
# For Docker: REACT_APP_API_BASE_URL=http://backend:8000
# For Local: REACT_APP_API_BASE_URL=http://localhost:8000
```

### Issue 5: "401 Unauthorized" After Login
**Problem:** Login succeeds but subsequent requests fail

**Solution:**
1. Clear browser localStorage
2. Check JWT token expiration in backend
3. Verify CORS settings in backend
4. Check browser console for errors

### Issue 6: Build Takes Too Long
**Problem:** `npm run build` is very slow

**Solution:**
```powershell
# Increase Node memory
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Or use Docker build with more resources
docker build --memory=4g -t medsync-patient-portal .
```

### Issue 7: White Screen After Deployment
**Problem:** Application shows blank white screen

**Solution:**
1. Check browser console for errors
2. Verify API URL in environment variables
3. Check nginx configuration
4. Ensure all static files are served correctly

```powershell
# Test static file serving
curl http://localhost:3001/static/js/main.*.js
```

---

## 📊 Monitoring

### Check Application Status
```powershell
# Container status
docker-compose ps patient-portal

# Resource usage
docker stats medsync_patient_portal

# Logs in real-time
docker-compose logs -f patient-portal
```

### Health Checks
```powershell
# Application health
curl http://localhost:3001/

# API health
curl http://localhost:8000/api/auth/health
```

---

## 🔄 Updates and Maintenance

### Update Application
```powershell
# Pull latest code
git pull origin feature/FrontendConnect

# Rebuild and restart
cd e:\Porjects\CATMS\medsync-clinic-management
docker-compose build patient-portal
docker-compose up -d patient-portal
```

### Clean Up
```powershell
# Remove old images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup (careful!)
docker system prune -a --volumes
```

---

## 📱 Access Points

### Development
- **Patient Portal**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Docker (Production-like)
- **Patient Portal**: http://localhost:3001
- **Backend API**: http://localhost:8000
- **Old Frontend**: http://localhost:3000 (if running)

### Network Access
- **Local Network**: http://192.168.1.x:3001
- **Custom Domain**: Configure in nginx.conf

---

## 🎯 Quick Commands Reference

```powershell
# Development
npm start                           # Start dev server
npm run build                       # Build for production
npm test                           # Run tests

# Docker Compose
docker-compose up -d patient-portal              # Start container
docker-compose down patient-portal               # Stop and remove
docker-compose restart patient-portal            # Restart
docker-compose logs -f patient-portal           # View logs
docker-compose build --no-cache patient-portal  # Rebuild from scratch

# Docker
docker ps                                        # List running containers
docker images                                    # List images
docker exec -it medsync_patient_portal sh       # Access container shell
docker inspect medsync_patient_portal           # Container details
```

---

## 📞 Support

### Common Issues
1. **Login fails**: Verify backend is running and credentials are correct
2. **Blank page**: Check browser console and nginx logs
3. **API errors**: Verify API_BASE_URL in .env
4. **Build fails**: Clear node_modules and reinstall

### Debug Mode
```powershell
# Enable verbose logging
$env:DEBUG="*"
npm start
```

### Get Help
- Check logs: `docker-compose logs patient-portal`
- Browser console: Press F12 and check Console tab
- Network tab: Check failed API requests
- Backend logs: `docker-compose logs backend`

---

## ✅ Deployment Checklist

- [ ] Node.js 18+ installed
- [ ] Backend API is running
- [ ] Database is initialized
- [ ] Environment variables configured
- [ ] Dependencies installed (`npm install`)
- [ ] Application builds successfully (`npm run build`)
- [ ] Docker image builds without errors
- [ ] Container starts and stays running
- [ ] Health check passes
- [ ] Can access login page
- [ ] Can login with patient credentials
- [ ] All pages load correctly
- [ ] API calls work properly
- [ ] No console errors in browser

---

## 🎉 Success!

Your MedSync Patient Portal should now be running successfully!

**Default Access:**
- URL: http://localhost:3001 (Docker) or http://localhost:3000 (Dev)
- Login with patient credentials from your database
- Explore all features: Dashboard, Appointments, Medical Records, etc.

**Next Steps:**
1. Create patient test accounts in database
2. Configure production domain and SSL
3. Set up monitoring and logging
4. Configure backup procedures
5. Train users on the new portal
