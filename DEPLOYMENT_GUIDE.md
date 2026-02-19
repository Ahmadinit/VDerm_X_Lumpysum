# VDerm-X Deployment Guide

## 🚀 Part 1: Deploy Backend to Railway

### Step 1: Prepare Your Repository

First, ensure your code is pushed to GitHub:

```powershell
# Check git status
git status

# If not initialized, initialize and push
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/VDerm_X_Lumpysum.git
git push -u origin main
```

### Step 2: Create Railway Account

1. Go to https://railway.app
2. Click "Start Project"
3. Sign up with GitHub (easiest option)
4. Authorize Railway to access your GitHub repos

### Step 3: Create New Railway Project

1. In Railway dashboard, click "New Project"
2. Select "Deploy from GitHub repo"
3. Find and select `VDerm_X_Lumpysum`
4. Railway will auto-detect it's a Node.js project
5. Select the `backend` folder as the root (if there's an option)

### Step 4: Configure Environment Variables

1. In Railway project dashboard, go to **Variables** tab
2. Add the following environment variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vdermx?retryWrites=true&w=majority
GEMINI_API_KEY=your-gemini-api-key
PORT=3000
NODE_ENV=production
```

**Important:** Get these from your existing backend/.env file

### Step 5: Deploy

1. Railway auto-deploys when you push to GitHub
2. Go to **Deployments** tab to monitor
3. Once successful, you'll get a public URL like: `https://vderm-x-backend.railway.app`
4. Copy this URL - you'll need it for the frontend!

### Step 6: Update Frontend API URL

Update your frontend to use the Railway backend URL:

**File:** `VDerm-X/src/config.ts`
```typescript
export const BASE_URL = 'https://vderm-x-backend.railway.app';
```

---

## 📱 Part 2: Build Android APK with Expo

### Prerequisites

- Expo CLI installed
- Expo account (you have this ✓)
- Android building will be done on Expo servers (no local Android SDK needed)

### Step 1: Install EAS CLI

```powershell
npm install -g eas-cli
```

### Step 2: Verify Expo Configuration

The app.json is already configured. Check it's correct:

```powershell
cd VDerm-X
eas --version
```

### Step 3: Login to Expo

```powershell
eas login
```

Then enter your Expo credentials.

### Step 4: Configure Your App for EAS Build

Run this once:

```powershell
eas build:configure
```

This will ask you to choose which platform - select **Android**

### Step 5: Create Android Keystore

When building the APK, EAS will offer to manage the keystore. Choose the option to **generate a new keystore**.

### Step 6: Build the APK

```powershell
cd VDerm-X
eas build --platform android --type apk
```

This will:
- Create build credentials on EAS servers
- Generate a new keystore
- Build your APK on Expo's servers
- Take 5-10 minutes

### Step 7: Download and Install APK

1. After build completes, you'll get a download link
2. Download the APK file
3. Transfer it to your Android phone
4. Open file manager, find the APK, and tap to install
5. Grant permissions during installation

---

## ✅ Verification Checklist

- [ ] Backend deployed on Railway and accessible
- [ ] Frontend config.ts updated with new backend URL
- [ ] Expo account logged in via EAS CLI
- [ ] APK built and installed on Android device
- [ ] App can connect to backend (test login)
- [ ] AI chat works (requires Gemini API key)

---

## 🔗 Useful Links

- Railway Dashboard: https://railway.app/dashboard
- Expo Dashboard: https://expo.dev/projects
- EAS Documentation: https://docs.expo.dev/build/introduction/
- Railway Docs: https://docs.railway.app

---

## 🆘 Troubleshooting

### APK Build Fails
- Check that all dependencies are installed: `npm install`
- Ensure app.json has valid expo config
- Check Android SDK version in app.json (should be compatible)

### App Can't Connect to Backend
- Verify Railway deployment is successful
- Check BASE_URL in config.ts matches Railway URL
- Test backend URL in browser: `https://your-railway-url/`

### EAS Build Timeout
- This is normal, can take 5-15 minutes
- Check email for build completion notification
- Monitor progress at https://expo.dev/projects

