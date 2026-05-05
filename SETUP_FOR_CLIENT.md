# VDerm-X - Complete Setup Guide for Client

## 🚀 Quick Start (Easiest Method)

### Option 1: Automated Setup (Recommended)

Run the automated setup script that handles everything:

```powershell
.\run-project.ps1
```

This single script will:
- ✅ Check all prerequisites (Node.js, Python)
- ✅ Install all backend dependencies (npm + Python)
- ✅ Create and activate Python virtual environment
- ✅ Install all frontend dependencies
- ✅ Setup environment files
- ✅ Start backend server (http://localhost:3000)
- ✅ Start Expo frontend with tunnel mode
- ✅ Display QR code for Expo Go app

**That's it!** Just scan the QR code with Expo Go app on your phone and start using the app.

---

## 📖 Alternative: Manual Setup

If you prefer to run commands step-by-step manually, see the complete guide:
👉 **[SETUP_COMMANDS.md](SETUP_COMMANDS.md)** - Detailed step-by-step instructions with all commands

---

## 📋 Prerequisites (Must Have)

Before running the automated script, ensure you have installed:

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **Python** (3.8 or higher)
   - Download: https://python.org/
   - Verify: `python --version`

3. **Expo Go App** on your phone
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

4. **MongoDB Atlas Account** (free tier)
   - Sign up: https://www.mongodb.com/cloud/atlas/register
   - Get your connection string

5. **Google Gemini API Key** (free)
   - Get key: https://makersuite.google.com/app/apikey

---

## 🔧 Configuration Required

### Backend Environment Variables

After running the script, edit `backend/.env` with your credentials:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vderm-x?retryWrites=true&w=majority

# Google Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Server Port
PORT=3000
```

**How to get MongoDB URI:**
1. Login to MongoDB Atlas
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password

**How to get Gemini API Key:**
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the generated key

### Frontend Configuration (Optional)

The app uses tunnel mode by default, so no IP configuration needed!

If you want to use LAN mode instead, update `VDerm-X/src/config.ts`:

```typescript
// Get your computer's IP first
// Run in PowerShell: ipconfig

export const BASE_URL = 'http://YOUR_IP_ADDRESS:3000';
// Example: export const BASE_URL = 'http://192.168.1.100:3000';
```

---

## 📱 Using the App with Expo Go

1. Run the setup script: `.\run-project.ps1`
2. Wait for the QR code to appear (in the Expo window)
3. Open **Expo Go** app on your phone
4. Tap **"Scan QR Code"**
5. Point camera at the QR code on screen
6. Wait for app to load (may take 1-2 minutes first time)
7. Start using the app!

### Testing the App

Try these features:
- ✅ Register as a user or veterinarian
- ✅ Login with your credentials
- ✅ Upload a pet skin image for ML diagnosis
- ✅ Chat with AI about the diagnosis
- ✅ Browse available veterinarians
- ✅ Book an appointment with a vet

---

## 🐛 Troubleshooting

### Issue: Port Already in Use

```powershell
# Kill process on port 3000 (backend)
Get-Process -Name node | Where-Object {(Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort -eq 3000} | Stop-Process -Force

# Kill process on port 8081 (Expo)
Get-Process -Name node | Where-Object {(Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort -eq 8081} | Stop-Process -Force
```

### Issue: Cannot Activate Virtual Environment

```powershell
# Enable PowerShell script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then run the setup script again
.\run-project.ps1
```

### Issue: MongoDB Connection Failed

Check your `backend/.env` file:
- Verify MongoDB URI is correct
- Check your IP is whitelisted in MongoDB Atlas
  - Go to Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
- Verify database password is correct

### Issue: Expo Not Showing QR Code

```powershell
# Clear Expo cache and restart
cd VDerm-X
npx expo start --clear --tunnel
```

### Issue: Phone Cannot Connect

If using tunnel mode (default), no configuration needed!

If you changed to LAN mode:
1. Make sure phone and computer are on the **same WiFi network**
2. Get your computer's IP:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)
3. Update `VDerm-X/src/config.ts` with that IP
4. Restart the Expo server

### More Troubleshooting

See [SETUP_COMMANDS.md](SETUP_COMMANDS.md) for detailed troubleshooting steps.

---

## 📂 Project Files Reference

| File | Purpose |
|------|---------|
| `run-project.ps1` | **Automated setup & run script** (use this!) |
| `SETUP_COMMANDS.md` | Step-by-step manual setup commands |
| `README.md` | Project overview and documentation |
| `BACKEND_API_DOCS.md` | Complete API endpoint documentation |
| `backend/.env` | Backend configuration (MongoDB, Gemini API) |
| `VDerm-X/src/config.ts` | Frontend backend URL configuration |
| `backend/requirements.txt` | Python dependencies (auto-installed) |

---

## 🔄 Daily Development Workflow

After initial setup, you only need to:

```powershell
# Option A: Use automated script
.\run-project.ps1

# Option B: Run manually (2 terminals)
# Terminal 1 - Backend:
cd backend; .\.venv\Scripts\Activate.ps1; & "$NODE18_PATH\npm.cmd" run start:dev

# Terminal 2 - Frontend:
cd VDerm-X; & "$NODE18_PATH\npx.cmd" expo start --tunnel
```

---

## ✅ What's Already Working

- ✅ Backend server with NestJS
- ✅ MongoDB Atlas cloud database (no local DB needed)
- ✅ TensorFlow ML model for skin disease detection
- ✅ Google Gemini AI for chat consultations
- ✅ User and Vet authentication
- ✅ Image upload and diagnosis
- ✅ AI chat about diagnoses
- ✅ Veterinarian listing and search
- ✅ Appointment booking system (backend)
- ✅ All dependencies configured

## ⚠️ What Needs Your Configuration

- ⚠️ MongoDB Atlas URI in `backend/.env`
- ⚠️ Gemini API Key in `backend/.env`
- ⚠️ (Optional) IP address in `VDerm-X/src/config.ts` if using LAN mode

---

## 📞 Need Help?

1. **Setup Issues**: See [SETUP_COMMANDS.md](SETUP_COMMANDS.md) for detailed instructions
2. **API Questions**: See [BACKEND_API_DOCS.md](BACKEND_API_DOCS.md) for API details
3. **Project Info**: See [README.md](README.md) for overview
4. **Implementation Details**: See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

---

## 🎯 Quick Command Reference

```powershell
# Run everything automatically
.\run-project.ps1

# Or run manually:
# Backend
cd backend
.\.venv\Scripts\Activate.ps1
& "$NODE18_PATH\npm.cmd" run start:dev

# Frontend (new terminal)
cd VDerm-X
& "$NODE18_PATH\npx.cmd" expo start --tunnel

# Get your IP address (if needed)
ipconfig

# Clean up processes
Get-Process -Name node | Stop-Process -Force

# Clear Expo cache
npx expo start --clear
```

---

**Ready to Start? Run `.\run-project.ps1` and you're good to go! 🚀**
