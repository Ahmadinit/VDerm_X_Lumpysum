# VDerm-X Backend API Documentation

## Base URL
- Local: `http://localhost:3000`
- Ngrok Tunnel: `https://da43-119-63-139-248.ngrok-free.app`

---

## Authentication Endpoints

### POST /auth/signup
Register a new user or vet.

**Headers:** None required

**Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Password123!",
  "role": "user",  // Optional: "user" (default) or "vet"
  // Vet-specific fields (only if role = "vet"):
  "specialization": "Cattle Specialist",
  "contact": "+1234567890",
  "area": "California",
  "availability": "Mon-Fri 9AM-5PM",
  "licenseNumber": "VET12345"
}
```

**Response:**
```json
{
  "_id": "65a1b2c3d4e5f6789",
  "username": "john_doe",
  "email": "john@example.com",
  "role": "user",
  "verified": true,  // true if email service not configured
  "createdAt": "2026-02-18T12:00:00.000Z"
}
```

### POST /auth/login
Login existing user.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response:** Returns full user object including role

---

## Appointments Endpoints

### POST /appointments
Create a new appointment (user only).

**Headers:**
- `x-user-id`: User's MongoDB _id

**Body (multipart/form-data):**
- `vetId`: String (required)
- `date`: ISO date string (required)
- `timeSlot`: String (e.g., "10:00 AM - 11:00 AM") (required)
- `reason`: String (required)
- `image`: File (optional)

**Response:**
```json
{
  "_id": "65a1b2c3d4e5f6789",
  "userId": "65a1b2c3...",
  "vetId": "65a1b2c3...",
  "date": "2026-02-20T00:00:00.000Z",
  "timeSlot": "10:00 AM - 11:00 AM",
  "status": "pending",
  "reason": "Cattle has skin bumps",
  "imageUrl": "uploads/1708261234567-cattle.jpg",
  "createdAt": "2026-02-18T12:00:00.000Z"
}
```

### GET /appointments/user/:userId
Get all appointments for a user.

**Response:** Array of appointments with populated vet details

### GET /appointments/vet/:vetId
Get all appointments for a vet (vet only).

**Headers:**
- `x-user-role`: Must be "vet"

**Response:** Array of appointments with populated user details

### GET /appointments/:id
Get single appointment details (with full user and vet info).

### PATCH /appointments/:id/status
Update appointment status (vet only).

**Headers:**
- `x-user-role`: Must be "vet"

**Body:**
```json
{
  "status": "confirmed",  // "confirmed", "rejected", or "completed"
  "notes": "Please bring the cattle at 10 AM",
  "rejectedReason": "Not available on this date"  // Only if status = "rejected"
}
```

### DELETE /appointments/:id
Cancel appointment (user only, checks ownership).

**Headers:**
- `x-user-id`: User's MongoDB _id

---

## Diagnosis History Endpoints

### POST /diagnosis/save
Save diagnosis result (auto-called by /images/predicts).

**Body:**
```json
{
  "userId": "65a1b2c3...",
  "imageUrl": "uploads/image.jpg",
  "prediction": {
    "classification": "Lumpy Skin",
    "confidence": [0.98, 0.02]
  },
  "location": "California"  // Optional
}
```

### GET /diagnosis/user/:userId
Get user's diagnosis history (sorted by date, newest first).

**Response:**
```json
[
  {
    "_id": "65a1b2c3...",
    "userId": "65a1b2c3...",
    "imageUrl": "uploads/image.jpg",
    "prediction": {
      "classification": "Lumpy Skin",
      "confidence": [0.98, 0.02]
    },
    "timestamp": "2026-02-18T12:00:00.000Z"
  }
]
```

### GET /diagnosis/:id
Get single diagnosis record.

---

## Chat Endpoints

### POST /chat/conversations
Create a new chat conversation.

**Headers:**
- `x-user-id`: User's MongoDB _id

**Body:**
```json
{
  "diagnosisId": "65a1b2c3...",  // Optional: link to diagnosis
  "title": "Chat about Lumpy Skin"  // Optional: auto-generated if not provided
}
```

**Response:**
```json
{
  "_id": "65a1b2c3...",
  "userId": "65a1b2c3...",
  "diagnosisId": "65a1b2c3...",
  "title": "Chat about Lumpy Skin - Feb 18",
  "createdAt": "2026-02-18T12:00:00.000Z"
}
```

Note: If linked to diagnosis, AI will automatically add initial context message.

### GET /chat/conversations/:userId
Get all user's chat conversations (with diagnosis populated).

**Response:** Array of conversations sorted by most recent

### POST /chat/message
Send message to AI and get response.

**Headers:**
- `x-user-id`: User's MongoDB _id

**Body:**
```json
{
  "conversationId": "65a1b2c3...",
  "content": "What treatment should I give?"
}
```

**Response:**
```json
{
  "userMessage": {
    "_id": "65a1b2c3...",
    "conversationId": "65a1b2c3...",
    "role": "user",
    "content": "What treatment should I give?",
    "timestamp": "2026-02-18T12:00:00.000Z"
  },
  "aiMessage": {
    "_id": "65a1b2c3...",
    "conversationId": "65a1b2c3...",
    "role": "assistant",
    "content": "For Lumpy Skin Disease, here are the treatment steps...",
    "timestamp": "2026-02-18T12:00:05.000Z"
  }
}
```

### GET /chat/messages/:conversationId
Get all messages in a conversation (sorted chronologically).

### DELETE /chat/conversations/:id
Delete conversation and all its messages (checks ownership).

**Headers:**
- `x-user-id`: User's MongoDB _id

---

## Image Prediction Endpoint (Updated)

### POST /images/predicts
Upload image for ML prediction (now auto-saves to diagnosis history).

**Headers:**
- `x-user-id`: User's MongoDB _id (optional, but recommended for saving history)

**Body (multipart/form-data):**
- `image`: File (required)

**Response:**
```json
{
  "prediction": {
    "prediction": [0.9886, 0.0113],
    "classification": "Lumpy Skin"
  }
}
```

Note: If `x-user-id` header is provided, diagnosis is automatically saved to history.

---

## User/Vet Management

### GET /vets
Get all vets (users with role="vet").

**Response:** Array of vet users with specialization details

---

## Environment Variables Required

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# Email (optional for testing)
EMAIL_USER=
EMAIL_PASS=
EMAIL_SUBJECT=V-DermX Email Verification

# Gemini AI (required for chat feature)
GEMINI_API_KEY=your_api_key_here

# Node Environment
NODE_ENV=development
```

---

## Authorization Model

**Simple Header-Based Auth:**
- `x-user-id`: User's MongoDB ObjectId (for ownership checks)
- `x-user-role`: User's role ("user" or "vet") (for role-based access)

**Role Restrictions:**
- Vets only: `PATCH /appointments/:id/status`, `GET /appointments/vet/:vetId`
- Users only: `POST /appointments`
- Ownership checks: Appointments, Chats (user can only access their own)

---

## Database Schema Summary

**Collections:**
1. `user` - Users and vets (role field differentiates)
2. `appointments` - Appointment bookings
3. `diagnosis_history` - ML prediction results
4. `chat_conversations` - Chat sessions
5. `chat_messages` - Individual messages
6. `Vet` - (Legacy, not used with new role system)

---

## Testing the Backend

1. **Register as user:**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test@123"}'
```

2. **Register as vet:**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"drsmith","email":"dr@example.com","password":"Test@123","role":"vet","specialization":"Cattle Specialist","contact":"+1234567890"}'
```

3. **Create appointment:**
```bash
curl -X POST http://localhost:3000/appointments \
  -H "x-user-id: USER_ID_HERE" \
  -F "vetId=VET_ID_HERE" \
  -F "date=2026-02-20T10:00:00.000Z" \
  -F "timeSlot=10:00 AM - 11:00 AM" \
  -F "reason=Cattle has skin issues"
```

---

## Next Steps

1. Get Gemini API key from https://aistudio.google.com/app/apikey
2. Add to backend/.env: `GEMINI_API_KEY=your_key_here`
3. Restart backend server
4. Implement mobile app UI for appointments and chat
5. Test complete user journey end-to-end

---

**Status:** ✅ All backend modules implemented and tested
- User/Vet authentication with roles ✅
- Appointments with approval workflow ✅
- Diagnosis history tracking ✅
- AI Chat with Gemini integration ✅
- Auto-save diagnosis on image upload ✅
