# ============================================
# VDerm-X Deployment Checklist
# ============================================

## STEP 1: Railway Backend Deployment ✓ (Code pushed)

Your code is now on GitHub and ready to deploy!

### Action Items:

1. **Go to Railway** https://railway.app
   - Sign in with GitHub account
   
2. **Create New Project**
   - Click "New Project" 
   - Select "GitHub Repo"
   - Find: VDerm_X_Lumpysum repository
   - Click "Deploy"

3. **Configure Variables** (after Railway auto-detects Node.js)
   - Go to Variables tab
   - Add these variables from your backend/.env:
   
   ```
   MONGODB_URI=mongodb+srv://vdermx_admin:9EiP9JzJcEhOW7gJ@cluster0.uwnskbr.mongodb.net/vdermx?retryWrites=true&w=majority&appName=Cluster0
   GEMINI_API_KEY=AIzaSyC2uzCiJICfSAfyXgdOaKasAkK6e8-1C5E
   PORT=3000
   NODE_ENV=production
   ```

4. **Wait for Deployment**
   - Monitor in "Deployments" tab
   - Look for green checkmark (success)
   - Copy the public URL (looks like: vderm-x-backend.railway.app)

---

## STEP 2: Update Frontend Config ✓ (After Backend URL Ready)

Once Railway gives you your backend URL, run:

```powershell
cd "c:\Users\DeLL\AndroidStudioProjects\VdermX\VDerm_X_Lumpysum\VDerm-X"
# Edit src/config.ts and update BASE_URL with your Railway URL
```

Example: `export const BASE_URL = 'https://vderm-x-backend.railway.app';`

---

## STEP 3: Build Android APK ✓ (Expo)

### 3.1 Install EAS CLI

```powershell
npm install -g eas-cli
```

### 3.2 Login to Expo

```powershell
eas login
```

Enter your Expo credentials.

### 3.3 Configure EAS for Your Project

```powershell
cd "c:\Users\DeLL\AndroidStudioProjects\VdermX\VDerm_X_Lumpysum\VDerm-X"
eas build:configure
```

Select: Android

### 3.4 Build APK

```powershell
eas build --platform android --type apk
```

This will:
- Generate Android keystore (first time only)
- Build on Expo servers (~5-10 minutes)
- Give you download link when done

### 3.5 Download & Test

- Download the APK from link
- Transfer to Android phone
- Install and test

---

## ✅ Final Verification

```
[  ] Backend deployed on Railway (public URL working)
[  ] Frontend config updated with correct backend URL
[  ] EAS CLI installed globally
[  ] Expo account linked via eas login
[  ] APK built and downloaded
[  ] APK installed on Android device
[  ] App opens successfully
```

---

## 🆘 Quick Troubleshooting

### Railway Deployment Fails?
- Check: All environment variables are set
- Check: PORT is set to 3000
- Check: Node.js version compatible (v18+)

### APK Build Fails?
- Run: npm install (in VDerm-X folder)
- Check: app.json is valid JSON
- Check: All dependencies installed

### App Can't Connect?
- Verify Railway URL is accessible
- Check: frontend config.ts has correct URL
- Test: Open URL in browser first

