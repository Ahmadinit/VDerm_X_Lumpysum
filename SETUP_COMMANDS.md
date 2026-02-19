# VDerm-X Project - Complete Setup and Run Commands

This document contains all the commands needed to set up and run the VDerm-X project, listed step by step.

## Prerequisites

Before starting, ensure you have:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (3.8 or higher) - [Download](https://python.org/)
- **MongoDB Atlas Account** (free tier) - [Sign up](https://www.mongodb.com/cloud/atlas/register)
- **Expo Go App** on your phone - [iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

## Quick Start (Automated)

If you want to run everything automatically, simply execute:

```powershell
.\run-project.ps1
```

This will handle all steps below automatically and start both backend and frontend.

---

## Manual Setup Commands (Step by Step)

### Step 1: Verify Prerequisites

```powershell
# Check Node.js installation
node --version
# Should show: v18.x.x or higher

# Check npm installation
npm --version
# Should show: 9.x.x or higher

# Check Python installation
python --version
# Should show: Python 3.8.x or higher

# Check pip installation
pip --version
# Should show pip version info
```

---

### Step 2: Install Backend Dependencies

```powershell
# Navigate to backend directory
cd backend

# Install Node.js dependencies
npm install

# Wait for installation to complete
# This may take 2-5 minutes
```

---

### Step 3: Create Python Virtual Environment

```powershell
# Make sure you're in the backend directory
cd backend

# Create virtual environment
python -m venv .venv

# This creates a .venv folder with Python environment
```

---

### Step 4: Activate Virtual Environment and Install Python Packages

```powershell
# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Your prompt should now show (.venv)

# Install Python dependencies
pip install tensorflow==2.20.0
pip install numpy==1.26.4
pip install Pillow==10.2.0

# Or use requirements.txt if available
pip install -r requirements.txt
```

---

### Step 5: Setup Environment Variables

#### Backend Environment Setup

```powershell
# Navigate to backend directory
cd backend

# Copy example env file
Copy-Item .env.example .env

# Edit .env file with your details
notepad .env
```

Update the `.env` file with:

```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/vderm-x?retryWrites=true&w=majority
GEMINI_API_KEY=your-gemini-api-key-here
PORT=3000
```

**To get MongoDB URI:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password

**To get Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key

#### Frontend Environment Setup

```powershell
# Navigate to frontend directory
cd VDerm-X

# Copy example env file (if exists)
Copy-Item .env.example .env

# Edit config.ts to set backend URL
notepad src\config.ts
```

Make sure `BASE_URL` in `src/config.ts` is:
```typescript
export const BASE_URL = 'http://localhost:3000';
```

---

### Step 6: Install Frontend Dependencies

```powershell
# Navigate to frontend directory
cd VDerm-X

# Install dependencies
npm install

# Wait for installation to complete
# This may take 2-5 minutes
```

---

### Step 7: Clean Up Existing Processes (if any)

```powershell
# Kill any Node processes on port 3000 (backend)
Get-Process -Name node | Where-Object {(Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort -eq 3000} | Stop-Process -Force

# Kill any Node processes on port 8081 (frontend/Expo)
Get-Process -Name node | Where-Object {(Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort -eq 8081} | Stop-Process -Force

# Wait a moment
Start-Sleep -Seconds 2
```

---

### Step 8: Start Backend Server

**Option A: Run in same terminal (blocking)**

```powershell
# Navigate to backend directory
cd backend

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Start backend in development mode
npm run start:dev

# Backend will start on http://localhost:3000
# You'll see: "Nest application successfully started"
```

**Option B: Run in new window (recommended)**

```powershell
# From project root, start backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'backend'; .\.venv\Scripts\Activate.ps1; npm run start:dev"
```

---

### Step 9: Verify Backend is Running

```powershell
# Test backend connection
curl http://localhost:3000

# Or use PowerShell
Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing

# Should return "Hello World!" response
```

---

### Step 10: Start Frontend with Expo Go (Tunnel Mode)

**Option A: Run in same terminal**

```powershell
# Navigate to frontend directory
cd VDerm-X

# Start Expo with tunnel mode
npx expo start --tunnel

# Wait for QR code to appear
# Scan QR code with Expo Go app on your phone
```

**Option B: Run in new window (recommended)**

```powershell
# From project root, start frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'VDerm-X'; npx expo start --tunnel"
```

---

## Testing the Application

### 1. Test Backend APIs

```powershell
# Test user registration
Invoke-RestMethod -Uri http://localhost:3000/user/register -Method POST -ContentType "application/json" -Body '{"username":"testuser","email":"test@example.com","password":"password123","role":"user"}'

# Test login
Invoke-RestMethod -Uri http://localhost:3000/user/login -Method POST -ContentType "application/json" -Body '{"email":"test@example.com","password":"password123"}'

# Test vets list
Invoke-RestMethod -Uri http://localhost:3000/vets -Method GET
```

### 2. Test Frontend with Expo Go

1. Open Expo Go app on your phone
2. Scan the QR code from the terminal
3. Wait for app to load
4. Test the following flows:
   - Register as a user or vet
   - Login with credentials
   - Upload an image for diagnosis
   - View vets list
   - Start a chat about diagnosis
   - View appointments

---

## Troubleshooting Common Issues

### Issue 1: Port Already in Use

```powershell
# Find process using port 3000
Get-Process -Name node | Where-Object {(Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort -eq 3000}

# Kill the process
Get-Process -Name node | Where-Object {(Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort -eq 3000} | Stop-Process -Force
```

### Issue 2: Virtual Environment Activation Fails

```powershell
# Enable script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then try activating again
.\.venv\Scripts\Activate.ps1
```

### Issue 3: Python Module Not Found

```powershell
# Make sure virtual environment is activated
.\.venv\Scripts\Activate.ps1

# Reinstall the specific package
pip install tensorflow==2.20.0 --upgrade

# Or reinstall all packages
pip install -r requirements.txt --force-reinstall
```

### Issue 4: MongoDB Connection Error

Check your `.env` file:
- Ensure MongoDB URI is correct
- Verify your IP is whitelisted in MongoDB Atlas (or use 0.0.0.0/0 for all IPs)
- Check database user password is correct
- Test connection string in MongoDB Compass

### Issue 5: Expo Tunnel Not Working

```powershell
# Clear Expo cache
cd VDerm-X
npx expo start --clear

# Or use localhost mode if tunnel fails
npx expo start

# You can also try LAN mode
npx expo start --lan
```

### Issue 6: Cannot Connect to Backend from Phone

If using `localhost:3000` in config.ts, the phone cannot reach it. Options:

**Option A: Use your computer's IP**
```powershell
# Get your IP address
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike '*Loopback*' -and $_.IPAddress -notlike '169.254.*'} | Select-Object -First 1).IPAddress

# Update VDerm-X/src/config.ts
# Change: BASE_URL = 'http://192.168.x.x:3000'  (use your IP)
```

**Option B: Use ngrok tunnel** (if backend needs to be accessible)
```powershell
# Install ngrok
npm install -g ngrok

# Tunnel to port 3000
ngrok http 3000

# Copy the https URL and update BASE_URL in config.ts
```

---

## Stopping the Application

### Stop Backend

```powershell
# If running in terminal, press Ctrl+C

# Or kill the process
Get-Process -Name node | Where-Object {(Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort -eq 3000} | Stop-Process -Force
```

### Stop Frontend

```powershell
# If running in terminal, press Ctrl+C

# Or kill the process
Get-Process -Name node | Where-Object {(Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort -eq 8081} | Stop-Process -Force
```

### Stop All Node Processes

```powershell
# Warning: This stops ALL Node.js processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

## Project Structure Reference

```
VDerm-X-master/
├── backend/                      # NestJS Backend
│   ├── .venv/                   # Python virtual environment
│   ├── src/                     # Source code
│   │   ├── main.ts             # Entry point
│   │   ├── app.module.ts       # Root module
│   │   ├── user/               # User module
│   │   ├── vet/                # Vet module
│   │   ├── appointments/       # Appointments module
│   │   ├── diagnosis/          # Diagnosis history module
│   │   ├── chat/               # Chat module
│   │   ├── ai/                 # Gemini AI service
│   │   ├── image/              # Image upload controller
│   │   └── model/              # ML model and prediction
│   ├── .env                    # Environment variables
│   ├── package.json            # Node dependencies
│   └── requirements.txt        # Python dependencies
│
├── VDerm-X/                     # React Native Frontend
│   ├── src/
│   │   ├── Screens/            # All screen components
│   │   ├── utils/              # Utility functions (auth)
│   │   └── config.ts           # Backend URL configuration
│   ├── App.tsx                 # Root component
│   └── package.json            # Dependencies
│
├── run-project.ps1             # Automated setup & run script
└── SETUP_COMMANDS.md           # This file
```

---

## Daily Development Workflow

Once everything is set up, you only need to run these commands daily:

### Quick Start (3 commands)

```powershell
# Terminal 1: Start Backend
cd backend; .\.venv\Scripts\Activate.ps1; npm run start:dev

# Terminal 2: Start Frontend
cd VDerm-X; npx expo start --tunnel

# Done! Scan QR code and start developing
```

### Or use the automated script

```powershell
.\run-project.ps1
```

---

## Useful Development Commands

### Backend Commands

```powershell
# Run backend in development mode (auto-reload)
npm run start:dev

# Run backend in production mode
npm run start:prod

# Build backend
npm run build

# Run tests
npm run test

# Format code
npm run format
```

### Frontend Commands

```powershell
# Start Expo (default mode)
npx expo start

# Start with tunnel (for remote devices)
npx expo start --tunnel

# Start with LAN (for local network)
npx expo start --lan

# Clear cache and start
npx expo start --clear

# Build for Android
npx expo build:android

# Build for iOS
npx expo build:ios
```

### Database Commands

```powershell
# Connect to MongoDB (if using local MongoDB)
mongosh "mongodb://localhost:27017/vderm-x"

# For MongoDB Atlas, use the connection string from your cluster
mongosh "mongodb+srv://your-connection-string"
```

---

## API Endpoints Reference

### Auth Endpoints
- `POST /user/register` - Register new user/vet
- `POST /user/login` - Login user/vet
- `GET /user/:id` - Get user details

### Vet Endpoints
- `GET /vets` - Get all vets
- `GET /vets/:id` - Get vet details

### Diagnosis Endpoints
- `POST /images/predicts` - Upload image for diagnosis
- `GET /diagnosis/user/:userId` - Get user's diagnosis history
- `GET /diagnosis/:id` - Get specific diagnosis

### Chat Endpoints
- `GET /chat/conversations/:userId` - Get user's conversations
- `GET /chat/messages/:conversationId` - Get conversation messages
- `POST /chat/conversations` - Create new conversation
- `POST /chat/messages` - Send message (gets AI response)
- `DELETE /chat/conversations/:id` - Delete conversation

### Appointment Endpoints
- `POST /appointments` - Create appointment
- `GET /appointments/user/:userId` - Get user's appointments
- `GET /appointments/vet/:vetId` - Get vet's appointments
- `PATCH /appointments/:id/status` - Update appointment status
- `DELETE /appointments/:id` - Cancel appointment

---

## Environment Variables Reference

### Backend .env

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vderm-x

# AI Service
GEMINI_API_KEY=your_gemini_api_key_here

# Server
PORT=3000
NODE_ENV=development

# Optional: JWT Secret (if implementing authentication)
JWT_SECRET=your_jwt_secret_here
```

### Frontend config.ts

```typescript
export const BASE_URL = 'http://localhost:3000';  // Development
// export const BASE_URL = 'http://192.168.x.x:3000';  // LAN mode
// export const BASE_URL = 'https://your-ngrok-url.ngrok.io';  // Tunnel mode
```

---

## Additional Resources

- **NestJS Documentation**: https://docs.nestjs.com/
- **React Native Documentation**: https://reactnative.dev/
- **Expo Documentation**: https://docs.expo.dev/
- **MongoDB Atlas**: https://www.mongodb.com/docs/atlas/
- **TensorFlow**: https://www.tensorflow.org/
- **Google Gemini AI**: https://ai.google.dev/

---

## Support

If you encounter any issues not covered in this guide:

1. Check the terminal output for error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Make sure ports 3000 and 8081 are not in use
5. Check that MongoDB Atlas IP whitelist includes your IP
6. Verify Python virtual environment is activated when running backend

For Expo Go specific issues:
- Make sure your phone and computer are on the same network (if not using tunnel)
- Try clearing Expo cache: `npx expo start --clear`
- Restart the Expo Go app on your phone
- Check that the BASE_URL in config.ts is accessible from your phone

---

**Happy Coding! 🚀**
