# VDerm-X: Project Execution Guide

**Updated**: May 5, 2026  
**For**: Appointment Booking + Real-Time Chat System (Phase 1-3 Complete)

---

## 🚀 Quick Start (Automatic Setup)

### Run Everything Automatically
```powershell
.\run-project.ps1
```

This single command will:
✅ Install Node.js 18  
✅ Install Python 3.10  
✅ Install all backend dependencies (including WebSocket packages)  
✅ Install all frontend dependencies (including socket.io-client)  
✅ Set up Python virtual environment  
✅ Start backend server on port 3000  
✅ Start frontend with Expo  
✅ Create ngrok tunnel for LAN/mobile access  

**Duration**: ~15-20 minutes (first run)  
**Result**: 3 terminal windows open with backend, ngrok tunnel, and frontend

---

## 📦 Packages Added for New Features

### Backend (WebSocket Chat System)
```
✅ socket.io           - WebSocket server
✅ @nestjs/websockets - NestJS WebSocket adapter
✅ @nestjs/platform-socket.io - Socket.io integration
```

### Frontend (WebSocket Chat Client)
```
✅ socket.io-client@^4.7.0 - WebSocket client for real-time chat
```

---

## 🔧 Manual Commands (If Running Separately)

### Terminal 1: Backend Server

```powershell
# Navigate to backend
cd backend

# Activate Python virtual environment
.\.venv\Scripts\Activate.ps1

# Install dependencies (if not already done)
npm install

# Start backend development server
npm run start:dev
```

**Expected Output**:
```
[Nest] 12345  - 05/05/2026, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 05/05/2026, 10:30:01 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 05/05/2026, 10:30:02 AM     LOG [InstanceLoader] MongooseModule dependencies initialized
[Nest] 12345  - 05/05/2026, 10:30:03 AM     LOG [NestApplication] Nest application successfully started
VDerm-X Backend running on http://0.0.0.0:3000
WebSocket server available at ws://localhost:3000
```

**Available Endpoints**:
```
GET    http://localhost:3000/  (health check)
GET    http://localhost:3000/vets  (list veterinarians)
GET    http://localhost:3000/appointments/availability/:vetId  (available slots)
POST   http://localhost:3000/appointments/book  (create appointment)
GET    http://localhost:3000/appointments/user/:userId  (user appointments)
GET    http://localhost:3000/appointments/vet/:vetId  (vet appointments)
POST   http://localhost:3000/appointments/:id/confirm  (vet confirms)
POST   http://localhost:3000/appointments/:id/reject  (vet rejects)
POST   http://localhost:3000/appointments/:id/medical-records  (add records)
DELETE http://localhost:3000/appointments/:id  (cancel)
WS     ws://localhost:3000  (WebSocket for real-time chat)
```

---

### Terminal 2: Frontend (Expo)

```powershell
# Navigate to frontend
cd VDerm-X

# Install dependencies (if not already done)
npm install

# Start Expo development server
npx expo start --tunnel

# If tunnel fails, use LAN mode:
npx expo start --lan
```

**Expected Output**:
```
▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄
  Expo Go supports the new Expo Router. Learn more at https://expo.dev/routing
▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄

 expo start -- 🚀 starting...
Connecting to development server...

Choose an option:
  ▸ < Go back
    Android (via tunnel)
    iOS (via tunnel)
    Web
    Restart dev server
    Restart bundler
    Kill bundler
    Clear cache
    Reset dev server

Scan the QR code above with Expo Go (Android) or the Camera app (iOS) to open your project
```

**To Connect**:
1. Install **Expo Go** app on your phone (iOS App Store or Google Play)
2. Scan the QR code with:
   - **Android**: Expo Go app
   - **iOS**: Native Camera app
3. App opens on your phone!

---

### Terminal 3 (Optional): ngrok Tunnel

For external access (optional):
```powershell
ngrok http 3000
```

This creates a public URL for the backend (useful for testing on multiple devices).

---

## 🧪 Testing the Setup

### Test Backend is Running
```powershell
curl http://localhost:3000/
```

Expected: Response from server (or health check response)

### Test WebSocket Connection
```powershell
# Install wscat (WebSocket cat tool)
npm install -g wscat

# Connect to WebSocket
wscat -c "ws://localhost:3000?userId=test-user&userRole=user"
```

---

## 📱 Testing the Appointment Booking Flow

### 1. Create a Vet (via API)
```powershell
$body = @{
    userId = "vet-123"
    firstName = "John"
    lastName = "Doe"
    specializations = @("Orthopedics", "Surgery")
    licenseNumber = "LIC123"
    clinicName = "Best Vet Clinic"
    phone = "555-0100"
    email = "john@example.com"
    clinicCity = "New York"
    clinicState = "NY"
    clinicZipCode = "10001"
    averageRating = 4.8
    totalReviews = 45
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/vets" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"

Write-Host "Vet created: $($response._id)"
```

### 2. Get Available Slots
```powershell
# Replace VET_ID and DATE with actual values
$response = Invoke-RestMethod -Uri "http://localhost:3000/appointments/availability/VET_ID?date=2026-05-20&duration=30" `
  -Method GET

Write-Host "Available slots:"
$response.slots | ForEach-Object { Write-Host "  - $_" }
```

### 3. Book an Appointment
```powershell
$body = @{
    userId = "user-123"
    vetId = "VET_ID"
    appointmentDate = "2026-05-20"
    appointmentTime = "10:00"
    duration = 30
    reason = "Pet vaccination"
    userNotes = "Please have everything ready"
    dataSharing = @{
        enabled = $true
        diagnosisId = "diag-123"
        notes = "Allergy concerns"
    }
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/appointments/book" `
  -Method POST `
  -Body $body `
  -Headers @{ "x-user-id" = "user-123"; "x-user-role" = "user" } `
  -ContentType "application/json"

Write-Host "Appointment booked: $($response._id)"
Write-Host "Chat ID: $($response.linkedChatId)"
```

---

## 💬 Testing WebSocket Chat

### 1. Connect to Chat Room
```
WS connection: ws://localhost:3000?userId=user-123&userRole=user

Send: {
  "type": "join_appointment",
  "data": { "appointmentId": "apt-123" }
}

Receive: {
  "type": "chat_history",
  "data": { "messages": [...], "sharedDiagnosticData": {...} }
}
```

### 2. Send Message
```
Send: {
  "type": "send_message",
  "data": {
    "appointmentId": "apt-123",
    "message": "Hello doctor, I have a question",
    "attachments": []
  }
}

Broadcast to room: {
  "type": "new_message",
  "data": {
    "_id": "msg-123",
    "senderId": "user-123",
    "senderType": "user",
    "message": "Hello doctor, I have a question",
    "timestamp": "2026-05-05T10:30:00Z",
    "isRead": false
  }
}
```

### 3. Mark as Read
```
Send: {
  "type": "mark_read",
  "data": {
    "appointmentId": "apt-123",
    "messageId": "msg-123"
  }
}

Broadcast: {
  "type": "message_read",
  "data": {
    "messageId": "msg-123",
    "readBy": "user-123",
    "timestamp": "2026-05-05T10:30:05Z"
  }
}
```

---

## 🔄 Environment Setup

### Backend `.env` File
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vdermx
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
```

### Frontend Configuration
Stored in `VDerm-X/src/config.ts`:
```typescript
export const BASE_URL = 'http://localhost:3000';
// or if using ngrok:
// export const BASE_URL = 'https://your-ngrok-url.ngrok.io';
```

Stored in AsyncStorage at runtime:
```typescript
await AsyncStorage.setItem('userId', 'user-123');
await AsyncStorage.setItem('userRole', 'user'); // or 'vet'
await AsyncStorage.setItem('apiUrl', 'http://localhost:3000');
```

---

## 📊 Port Reference

| Service | Port | Purpose |
|---------|------|---------|
| Backend (NestJS) | 3000 | API endpoints + WebSocket |
| Expo Dev | 19000 | Bundler |
| ngrok | 4040 | Tunnel API |

---

## 🛠️ Troubleshooting

### Backend won't start
```powershell
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill process on port 3000
taskkill /PID <PID> /F

# Restart backend
cd backend
npm run start:dev
```

### Frontend won't connect to WebSocket
```
1. Check backend is running on port 3000
2. Check BASE_URL in VDerm-X/src/config.ts
3. Check AsyncStorage has correct apiUrl
4. Check network connectivity (firewall rules)
5. Test with: wscat -c "ws://localhost:3000"
```

### npm packages not installing
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -Recurse -Force node_modules
rm package-lock.json
npm install --force
```

### Python virtual environment issues
```powershell
# Delete and recreate venv
rm -Recurse -Force .\.venv
py -3.10 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

---

## 📝 Project Structure

```
VDerm-X/
├── backend/
│   ├── src/
│   │   ├── appointments/
│   │   │   ├── controllers/
│   │   │   │   ├── appointments.controller.ts
│   │   │   │   └── chat.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── appointments.service.ts
│   │   │   │   └── chat.service.ts
│   │   │   ├── gateways/
│   │   │   │   └── chat.gateway.ts
│   │   │   ├── schema/
│   │   │   │   ├── appointment.schema.ts
│   │   │   │   ├── appointment-chat.schema.ts
│   │   │   │   ├── vet-availability.schema.ts
│   │   │   │   └── vet.schema.ts
│   │   │   └── appointments.module.ts
│   │   ├── main.ts
│   │   └── app.module.ts
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── .venv/ (Python virtual environment)
│
├── VDerm-X/
│   ├── src/
│   │   ├── Screens/
│   │   │   ├── appointmentBookingScreen.tsx (NEW)
│   │   │   ├── appointmentChatScreen.tsx (NEW)
│   │   │   ├── appointmentsHistoryScreen.tsx (NEW)
│   │   │   ├── homeScreen.tsx
│   │   │   ├── loginScreen.tsx
│   │   │   └── [other screens]
│   │   ├── utils/
│   │   │   └── auth.ts
│   │   ├── config.ts (auto-generated)
│   │   └── App.tsx
│   ├── package.json
│   ├── app.json
│   ├── tsconfig.json
│   └── .env
│
├── run-project.ps1 (UPDATED - includes WebSocket packages)
├── RUN_PROJECT_GUIDE.md (THIS FILE)
└── PROJECT_COMPLETION_SUMMARY.md
```

---

## ✅ Checklist for New Features

- [x] Backend WebSocket gateway implemented
- [x] Chat service and controller created
- [x] Appointment booking screens created
- [x] Real-time chat interface created
- [x] Appointment history screen created
- [x] Socket.io packages added to run-project.ps1
- [x] Socket.io-client packages added for frontend
- [x] Type definitions fixed for WebSocket
- [x] All 3 phases complete and tested

---

## 🚀 Next Steps

1. **Run the project**: `.\run-project.ps1`
2. **Wait for all services to start** (~20 seconds after npm installs)
3. **Open Expo Go app** and scan QR code
4. **Test booking flow**: Login → Browse vets → Book appointment
5. **Test chat**: Open appointment chat → Send message
6. **Monitor terminals** for any errors

---

## 📞 Support

For issues:
1. Check terminal output for error messages
2. Review troubleshooting section above
3. Verify MongoDB connection string in `.env`
4. Check firewall/antivirus blocking ports
5. Review console logs in Expo Go app

---

**Status**: ✅ **READY TO RUN**

All packages configured, all features implemented. Run `.\run-project.ps1` to start!
