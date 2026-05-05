# Enhanced Appointment Booking & Chat System - Implementation Plan

## 📋 Executive Overview

This document outlines a comprehensive redesign of the appointment booking system to include real-time communication, data sharing, medical records management, and conflict-free scheduling.

---

## 🎯 Core Features Breakdown

### 1. **Advanced Appointment Booking System**

#### User Flow (Pet Owner)
```
Browse Vets → Select Vet → Pick Availability (Calendar) 
→ Share Diagnostic Data (Optional) → Confirm Booking 
→ Real-time Confirmation → Add to Calendar
```

#### Vet Flow (Veterinarian)
```
View Dashboard → See Pending Appointments 
→ View Shared Diagnostic Data → Confirm/Reject Booking 
→ Send Response to User → Manage Medical Records
```

#### Database Schema Changes
```typescript
// Enhanced Appointment Schema
interface Appointment {
  _id: ObjectId
  userId: ObjectId (User)
  vetId: ObjectId (Vet)
  
  // Booking Details
  appointmentDate: Date
  appointmentTime: Time
  duration: number (minutes, default 30)
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled'
  
  // Data Sharing
  dataSharing: {
    enabled: boolean
    sharedDiagnosisId: ObjectId (Reference to Diagnosis)
    sharedImages: Array<String> (URLs)
    sharedAnalysisText: String
    sharedAt: Date
  }
  
  // Medical Records (Added by vet after booking)
  medicalRecords: {
    notes: String
    prescription: String
    medications: Array<{
      name: String
      dosage: String
      frequency: String
      duration: String
    }>
    followUpDate: Date (Optional)
    addedAt: Date
    addedBy: ObjectId (Vet)
  }
  
  // Meeting/Chat Context
  linkedChatId: ObjectId (Chat Conversation)
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

// New: Vet Availability Schema (For Calendar)
interface VetAvailability {
  _id: ObjectId
  vetId: ObjectId
  
  // Recurring schedule
  weeklySchedule: {
    monday: { startTime: Time, endTime: Time, isAvailable: boolean }
    tuesday: { startTime: Time, endTime: Time, isAvailable: boolean }
    // ... etc
  }
  
  // Individual slots
  slots: Array<{
    date: Date
    startTime: Time
    endTime: Time
    isBooked: boolean
    appointmentId: ObjectId (If booked)
  }>
  
  // Break times and holidays
  breaks: Array<{ date: Date, reason: String }>
  
  updatedAt: Date
}

// New: Appointment-linked Chat
interface AppointmentChat {
  _id: ObjectId
  appointmentId: ObjectId
  userId: ObjectId
  vetId: ObjectId
  
  messages: Array<{
    _id: ObjectId
    senderId: ObjectId
    senderType: 'user' | 'vet'
    message: String
    attachments: Array<String> (URLs, images, etc)
    timestamp: Date
    isRead: boolean
  }>
  
  // For data sharing context
  sharedDiagnosticData: {
    image: String (URL)
    analysisText: String
    timestamp: Date
  }
  
  createdAt: Date
  updatedAt: Date
}
```

---

### 2. **Real-time Chat System**

#### Features
- **Persistent Messaging**: Messages stay after logout
- **Appointment-Linked Chat**: One chat per appointment
- **Read Receipts**: Track if messages are read
- **Typing Indicators**: Real-time typing status
- **Message Attachments**: Share images, documents
- **Search & History**: Search old messages

#### Implementation
```typescript
// WebSocket Events
Socket Events:
  - 'appointment:chat:send' → Send message
  - 'appointment:chat:receive' → Receive message (real-time)
  - 'appointment:chat:typing' → Typing indicator
  - 'appointment:chat:read' → Mark as read
  - 'appointment:data:shared' → Data sharing notification

// Fallback for disconnections
- Store messages locally (AsyncStorage)
- Sync when connection restored
- Queue messages for retry
```

---

### 3. **Data Sharing System**

#### During Booking
User can optionally share:
- ✅ Diagnostic image (from previous diagnosis)
- ✅ AI analysis results (from ML model)
- ✅ Symptom description
- ✅ Relevant medical history

#### Access Control
```
User Perspective:
  - Can see shared data status
  - Can modify sharing preferences
  - Can view vet's comments on shared data

Vet Perspective:
  - Can only view if user shared data
  - Can add med notes on the shared data
  - Can reference specific images/results in notes
```

#### Vet Medical Records (Med Notes & Prescription)
```
Workflow:
1. User books appointment with data sharing enabled
2. Vet receives notification about shared data
3. Vet reviews diagnostic image + analysis
4. During/After appointment:
   - Vet adds consultation notes
   - Vet adds diagnosis
   - Vet adds prescription
5. User receives notification
6. User can view in their account under:
   - Medical History
   - Appointments → View Details → Medical Records
```

---

### 4. **Calendar & Conflict Resolution**

#### Calendar Features
```typescript
// Show available time slots
1. Fetch vet's availability schedule
2. Filter out booked slots
3. Display as interactive calendar
4. Color coding:
   - Green: Available
   - Red: Booked
   - Gray: Closed/Break time
   - Yellow: Last spots

// Prevent Double-Booking
- Lock slot when user starts booking
- Release after 10 minutes if not completed
- Real-time slot status updates
- Show "Booked" immediately after confirmation
```

---

### 5. **Vet Account Visibility to Users**

#### Current Issue
- Vets created in app don't appear on user side

#### Solution
```typescript
// Enhanced Vet Profile Schema
interface VetProfile {
  _id: ObjectId
  userId: ObjectId (Link to auth user)
  
  // Public Profile
  profile: {
    firstName: String
    lastName: String
    specialization: String (Array of specializations)
    licenseNumber: String
    clinic: String
    bio: String
    profileImage: String
    
    // Ratings & Reviews
    averageRating: Number (1-5)
    totalReviews: Number
    reviews: Array<{
      userId: ObjectId
      rating: Number
      comment: String
      appointmentId: ObjectId
      date: Date
    }>
  }
  
  // Public Availability
  availability: {
    isActive: Boolean
    responseTime: Number (avg in minutes)
    appointmentsThisMonth: Number
  }
  
  // Contact
  contact: {
    phone: String
    email: String
    clinicAddress: String
    website: String
  }
  
  // Status
  isVerified: Boolean
  isActive: Boolean
  
  createdAt: Date
  updatedAt: Date
}

// API Endpoint - User Side
GET /vets/available
- Returns all active vets with availability info
- Includes specializations, ratings, availability status
- Filterable by specialization, location, rating
```

---

## 📱 Frontend Components Needed

### User/Pet Owner App

#### New Screens
```
1. VetsScreen (Enhanced)
   ├── Vet List with Filters
   ├── Vet Detail Card
   │  ├── Profile Info
   │  ├── Ratings & Reviews
   │  ├── Availability Status
   │  └── "Book Appointment" Button
   │
   └── VetSearchScreen
      ├── Search by name/specialization
      ├── Filter by rating
      └── Sort by availability

2. AppointmentBookingScreen (New - Multi-step)
   ├── Step 1: Select Vet
   ├── Step 2: Pick Date/Time (Calendar)
   ├── Step 3: Share Diagnostic Data (Optional)
   │  ├── Toggle data sharing
   │  ├── Select diagnosis to share
   │  ├── Preview shared data
   │  └── Add notes to vet
   ├── Step 4: Review & Confirm
   └── Step 5: Confirmation + Add to Calendar

3. AppointmentDetailsScreen (New)
   ├── Appointment Status
   ├── Shared Data (if enabled)
   ├── Medical Records Section
   │  ├── Med Notes (if vet added)
   │  ├── Prescription (if vet added)
   │  └── Follow-up Date
   ├── Chat Button
   └── Reschedule/Cancel Options

4. AppointmentChatScreen (New)
   ├── Chat Messages (with shared data context)
   ├── Appointment Info Header
   ├── Shared Diagnostic Data Preview
   ├── Message Input
   ├── Typing Indicator
   └── Message History/Search

5. AppointmentsListScreen (Enhanced)
   ├── Upcoming Appointments
   ├── Past Appointments
   ├── Appointment Status badges
   ├── Quick Chat Access
   └── Medical Records Preview
```

### Vet App

#### New Screens
```
1. DashboardScreen (Enhanced)
   ├── Today's Appointments
   ├── Pending Booking Requests
   ├── New Appointments Notifications
   ├── Messages Count
   └── Quick Stats

2. AppointmentsScreen (Enhanced)
   ├── Calendar View of Appointments
   ├── Appointment Details Panel
   ├── Status Management (Confirm/Reject)
   ├── Shared Data Visibility
   └── Medical Records Editor

3. AppointmentManagementScreen (New)
   ├── Shared Diagnostic Data
   │  ├── Image Preview
   │  ├── Analysis Results
   │  └── User's Notes
   ├── Add Medical Records Section
   │  ├── Med Notes Input
   │  ├── Prescription Builder
   │  │  ├── Medication Name
   │  │  ├── Dosage
   │  │  ├── Frequency
   │  │  └── Duration
   │  └── Follow-up Date Picker
   ├── Save Button
   └── Submit Confirmation

4. AvailabilityScreen (Enhanced)
   ├── Set Weekly Schedule
   ├── Add Break Times
   ├── Holiday Management
   ├── View Booked Slots
   └── Sync to Calendar

5. AppointmentChatScreen (New - Vet Version)
   ├── Chat with User
   ├── Reference to Appointment
   ├── Shared Data Context
   ├── Quick Actions (Add Med Notes, etc)
   └── Chat History

6. PatientHistoryScreen (New)
   ├── List of all appointments with user
   ├── Medical history
   ├── Previous med notes & prescriptions
   ├── Communication timeline
```

---

## 🔌 Backend API Endpoints

### Appointments API
```
POST   /appointments/book
       - Create new appointment
       - Params: vetId, date, time, dataSharing, notes

GET    /appointments/:userId/upcoming
       - Get user's upcoming appointments

GET    /appointments/:vetId/incoming
       - Get vet's incoming appointment requests

PATCH  /appointments/:appointmentId/confirm
       - Vet confirms appointment

PATCH  /appointments/:appointmentId/reject
       - Vet rejects appointment with reason

DELETE /appointments/:appointmentId
       - Cancel appointment (by user or vet)

PATCH  /appointments/:appointmentId/medical-records
       - Add/Update medical records (vet only)
       - Body: { medicalNotes, prescription, medications, followUpDate }
```

### Vet Availability API
```
GET    /vets/:vetId/availability
       - Get vet's schedule/availability

POST   /vets/:vetId/availability/set-schedule
       - Set weekly schedule

POST   /vets/:vetId/availability/add-break
       - Add break time/holiday

GET    /vets/:vetId/booked-slots
       - Get all booked appointment slots
```

### Data Sharing API
```
POST   /appointments/:appointmentId/share-data
       - Enable/update data sharing

GET    /appointments/:appointmentId/shared-data
       - Get shared diagnostic data (vet only)

POST   /appointments/:appointmentId/shared-data/comment
       - Add vet comment on shared data
```

### Chat API
```
POST   /appointments/:appointmentId/chat/message
       - Send message

GET    /appointments/:appointmentId/chat/messages
       - Get all messages

PATCH  /appointments/:appointmentId/chat/message/:messageId/read
       - Mark message as read

POST   /appointments/:appointmentId/chat/typing
       - Indicate typing status

DELETE /appointments/:appointmentId/chat/message/:messageId
       - Delete message
```

### Vet Profile API
```
GET    /vets/available
       - Get list of all available vets with profiles

GET    /vets/:vetId
       - Get vet profile details

PUT    /vets/:vetId/profile
       - Update vet profile

GET    /vets/:vetId/reviews
       - Get vet reviews

POST   /appointments/:appointmentId/review
       - Add appointment review & rating (user only)
```

---

## 🔐 Security & Permissions

### Access Control Matrix
```
User can:
  ✅ View own appointments
  ✅ View shared data from vet (after data sharing enabled)
  ✅ View medical records (only if shared by vet)
  ✅ Chat with assigned vet for appointment
  ✅ Cancel own appointment
  ❌ View other user's data
  ❌ Modify vet data

Vet can:
  ✅ View own appointments
  ✅ View shared diagnostic data (if user enabled)
  ✅ Add medical records to appointment
  ✅ Chat with user
  ✅ Confirm/Reject appointments
  ✅ Manage own availability
  ✅ View reviews
  ❌ View user's personal data beyond appointment context
  ❌ Access other vet's appointments

Admin can:
  ✅ Verify vet credentials
  ✅ Manage disputes
  ✅ View all data (admin panel)
```

### Data Encryption
- Chat messages: Store encrypted, decrypt on retrieval
- Diagnostic images: Encrypt at rest
- Medical records: Audit log for access

---

## 🎨 UI/UX Improvements & Fixes

### Current Issues to Address
1. ❌ **No visual feedback during booking** → Add progress bar & status
2. ❌ **No conflict resolution** → Calendar prevents double-booking
3. ❌ **No data persistence** → Messages stay in DB after logout
4. ❌ **Unclear appointment status** → Color-coded badges + timeline
5. ❌ **No mobile optimization** → Responsive calendar component
6. ❌ **No notification system** → Push notifications for appointments
7. ❌ **No way to rate vets** → Post-appointment review system

### Recommended Enhancements
1. **Smart Vet Recommendations**
   - Suggest vets based on previous diagnosis
   - Show similar cases successfully handled
   
2. **Appointment Reminders**
   - Send 24h, 1h, 15m reminders
   - Reminder for vet too

3. **Medical History Timeline**
   - Visual timeline of appointments, notes, prescriptions
   - Easy to track progression

4. **Document Management**
   - Store prescriptions as PDF
   - Download/share capability
   - Print for pharmacy

5. **Prescription Integration**
   - Share prescription with local pharmacy
   - Track prescription status

6. **Follow-up Automation**
   - Auto-create follow-up appointment reminder
   - Track if follow-up done

7. **Real-time Notifications**
   - Appointment confirmed/rejected
   - Medical records added
   - New message in chat
   - Appointment reminders

---

## 📊 Database Relationship Diagram

```
User (Pet Owner)
  ├─── Appointment ──── Vet
  │        ├─── Diagnosis (optional, shared)
  │        ├─── MedicalRecords (vet-added)
  │        └─── AppointmentChat ──── Messages
  │
  └─── Review (of Vet)

Vet
  ├─── VetProfile
  ├─── VetAvailability
  │    └─── Slots (booked/available)
  ├─── Appointment (receives)
  └─── Review (receives)
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [x] Database schema creation
- [x] API endpoints (appointments, availability)
- [ ] Calendar component (UI)
- [ ] Booking screen (UI)
- [ ] Conflict resolution logic

### Phase 2: Data Sharing (Week 2-3)
- [ ] Data sharing toggle during booking
- [ ] Diagnostic data preview
- [ ] Medical records management (vet side)
- [ ] API for med notes & prescription

### Phase 3: Chat System (Week 3-4)
- [ ] WebSocket setup
- [ ] Chat UI (user & vet)
- [ ] Message persistence
- [ ] Typing indicators & read receipts

### Phase 4: Vet Visibility (Week 4)
- [ ] Vet profile completion
- [ ] Vet list with filters
- [ ] Ratings & review system
- [ ] Enhanced vet search

### Phase 5: Polish & Testing (Week 5)
- [ ] Notifications (push, in-app)
- [ ] Performance optimization
- [ ] Security audit
- [ ] E2E testing

---

## 🔧 Technology Stack

### Backend Enhancements
- **WebSocket**: Socket.io for real-time chat
- **Background Jobs**: Agenda.js for appointment reminders
- **File Storage**: AWS S3 for images/documents
- **Search**: Elasticsearch for vet search optimization

### Frontend Enhancements
- **Calendar**: React-Calendar or React-Big-Calendar
- **Real-time**: Socket.io-client
- **Forms**: React Hook Form for multi-step booking
- **Notifications**: Firebase Cloud Messaging (FCM)
- **Storage**: AsyncStorage for local persistence

---

## ✅ Validation Checklist

Before implementation, ensure:
- [ ] All endpoints properly secured
- [ ] Data sharing is truly optional (user can opt-out)
- [ ] Medical records editable only by vet
- [ ] Chat messages encrypted
- [ ] Calendar prevents double-booking
- [ ] Notifications working on both platforms
- [ ] Messages persist after logout
- [ ] Vet availability updated real-time
- [ ] Performance tested with 1000+ appointments
- [ ] Mobile responsiveness verified

---

## 📝 Next Steps

1. **Create database migrations** for new schemas
2. **Set up WebSocket server** for real-time features
3. **Build calendar component** with conflict detection
4. **Implement booking workflow** with data sharing
5. **Create chat UI** and persistence layer
6. **Test end-to-end** user and vet flows
7. **Deploy notifications** system
8. **Monitor & iterate** based on feedback

---

**Document Version**: 1.0  
**Last Updated**: May 5, 2026  
**Status**: Ready for Development
