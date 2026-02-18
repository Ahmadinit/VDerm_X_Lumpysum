# VDermX - Lumpy Skin Disease Detection System

## Quick Setup for Client

### 1. MongoDB Atlas (Already Configured ✅)
- Free cloud database - no local installation needed
- Current configuration is ready to use

### 2. Gmail Configuration (Required for user registration)

**Steps to get Gmail App Password:**
1. Go to: https://myaccount.google.com/apppasswords
2. Sign in with your Gmail account
3. Select "Mail" as the app
4. Select "Windows Computer" as the device
5. Click "Generate"
6. Copy the 16-character password
7. Update `backend/.env` file:
   ```
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=xxxx-xxxx-xxxx-xxxx  (paste generated password)
   ```

**Note:** You need to have 2-Factor Authentication enabled on your Gmail account first.

### 3. Mobile App Network Configuration

Update the IP address in `VDerm-X/src/config.ts` to match your computer's IP:
- Current IP: `172.20.48.1`
- If not working, run `ipconfig` to find your IPv4 Address
- Update: `export const BASE_URL = 'http://YOUR_IP:3000';`

### 4. Running the Application

**Backend:**
```powershell
cd backend
npm run start:dev
```

**Mobile App:**
```powershell
cd VDerm-X
npm start
```
Then scan QR code with Expo Go app on your phone.

### What's Working:
✅ Backend server running on port 3000
✅ MongoDB Atlas connected
✅ ML model ready (TensorFlow)
✅ All dependencies installed

### What Needs Configuration:
⚠️ Gmail credentials in `.env` (for OTP email verification)
⚠️ IP address in mobile config (if testing on physical device)

### Client Deployment Notes:
- All configuration is in `.env` files (template: `.env.example`)
- MongoDB Atlas works from any machine (cloud-based)
- No local database installation required
- Easy to share - just provide `.env` configurations
