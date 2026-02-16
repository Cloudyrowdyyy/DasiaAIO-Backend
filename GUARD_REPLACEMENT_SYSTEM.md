# Guard Replacement System - Implementation Guide

## Overview
The Automated Guard Replacement System detects security guard no-shows in real-time and automatically deploys replacement guards based on availability, proximity, and reliability scores.

## System Architecture

### Backend Components

#### 1. Core System (`guard-replacement-system.js`)
- **Database Collections**:
  - `shifts` - Scheduled shifts with guard assignments
  - `attendance` - Check-in/check-out records
  - `guard_availability` - Guard availability calendar
  - `replacements` - Replacement requests and status tracking

#### 2. API Routes (`routes/guard-replacement.routes.js`)
Key endpoints:

**Shift Management:**
- `POST /api/shifts` - Create a new shift
- `GET /api/no-shows` - Detect no-shows and auto-generate replacements

**Attendance Tracking:**
- `POST /api/attendance/check-in` - Guard checks in
- `POST /api/attendance/check-out` - Guard checks out

**Availability Management:**
- `POST /api/guard-availability` - Set guard availability

**Replacement Workflow:**
- `POST /api/replacements/:replacementId/accept` - Guard accepts replacement
- `POST /api/replacements/:replacementId/decline` - Guard declines replacement

## Workflow

### 1. Shift Creation
Admin creates shifts for morning, afternoon, evening, night shifts.
```bash
POST /api/shifts
{
  "guardId": "664f1a2b3c4d5e6f7g8h9i0j",
  "startTime": "2026-02-17T08:00:00Z",
  "endTime": "2026-02-17T16:00:00Z",
  "clientSite": "DASIA Tagum Head Office"
}
```

### 2. Guard Check-In
Guard checks in at shift start or within grace period (15 minutes):
```bash
POST /api/attendance/check-in
{
  "guardId": "664f1a2b3c4d5e6f7g8h9i0j",
  "shiftId": "664f1a2b3c4d5e6f7g8h9i0k"
}
```

### 3. No-Show Detection
System automatically detects no-shows if guard doesn't check in within 15 minutes:
```bash
GET /api/no-shows
```

Server automatically:
1. Detects missed check-ins
2. Finds available replacement candidates
3. Scores each candidate (reliability 50% + proximity 50%)
4. Sends notifications to top candidates (SMS + in-app)

### 4. Replacement Assignment
Guard accepts or declines replacement offer:
```bash
POST /api/replacements/{replacementId}/accept
{ "guardId": "..." }
```

When accepted:
- Original shift updated with replacement guard ID
- Replacement marked as "accepted"
- Admin notified of successful replacement

## Database Schemas

### shifts Collection
```javascript
{
  _id: ObjectId,
  guardId: ObjectId,           // Original assigned guard
  startTime: Date,
  endTime: Date,
  clientSite: String,
  status: "scheduled|in-progress|completed|no-show|replacement-assigned",
  replacementRequired: Boolean,
  replacementGuardId: ObjectId,
  createdAt: Date,
  createdBy: String
}
```

### attendance Collection
```javascript
{
  _id: ObjectId,
  guardId: ObjectId,
  shiftId: ObjectId,
  checkInTime: Date,
  checkOutTime: Date,
  location: { latitude, longitude },
  createdAt: Date
}
```

### guard_availability Collection
```javascript
{
  _id: ObjectId,
  guardId: ObjectId,
  date: Date,              // Midnight UTC (no time component)
  available: Boolean,
  reason: String,          // optional: "Off duty", "Training", etc.
  updatedAt: Date
}
```

### replacements Collection
```javascript
{
  _id: ObjectId,
  originalShiftId: ObjectId,
  originalGuardId: ObjectId,
  clientSite: String,
  shiftTime: Date,
  status: "pending|accepted|declined|expired",
  candidateGuards: [
    {
      guardId: ObjectId,
      guardName: String,
      score: Number,       // 0-100 final score
      notified: Boolean,
      responded: Boolean
    }
  ],
  acceptedGuardId: ObjectId,
  acceptedAt: Date,
  createdAt: Date,
  expiresAt: Date          // 30 minutes to respond
}
```

## Key Metrics

### Reliability Score Calculation
```
reliabilityScore = (attendedShifts / totalShifts) * 100
```

### Proximity Score Calculation
```
proximityScore = 100 - (distance_in_km / maxDistance) * 100
Base: 50 if location not available
```

### Final Candidate Score
```
finalScore = (reliabilityScore * 0.5) + (proximityScore * 0.5)
```

## No-Show Grace Period
- **15 minutes** - Tolerance window for check-in
- After 15 minutes without check-in, system marks as no-show and initiates replacement

## Notification System

### SMS Notifications
- Sent to qualified backup guards
- Format: "URGENT: Guard replacement needed at [CLIENT SITE]. Confirm: [LINK]"
- Expires after 30 minutes

### In-App Notifications
- Push notification badge showing pending replacements
- Detailed view with:
  - Client site name
  - Shift time (start & end)
  - Pay rate for this shift
  - Accept/Decline buttons

## Implementation Status

✅ **Completed:**
- Core replacement system module
- Database collection creation
- API endpoints
- No-show detection logic
- Guard scoring algorithm
- Replacement request generation

⏳ **In Progress:**
- Frontend components (shift calendar, check-in UI)
- SMS notification integration
- In-app notification system

📋 **TODO:**
- Cron job for periodic no-show detection
- SMS provider integration (Twilio/AWS SNS)
- Email confirmation system
- Real-time location tracking
- Admin dashboard for monitoring
- Guard performance analytics
- Shift history and reporting

## Next Steps

1. Create frontend Guard Schedule component
2. Create Check-In/Check-Out UI for mobile
3. Implement in-app notification system
4. Integrate SMS notifications (Twilio)
5. Create admin monitoring dashboard
6. Add cron job for automatic no-show detection

## Testing Guide

### Test No-Show Detection
```bash
# 1. Create a shift
POST http://localhost:5000/api/shifts
{
  "guardId": "USER_ID",
  "startTime": "2026-02-16T15:45:00Z",
  "endTime": "2026-02-16T23:45:00Z",
  "clientSite": "Test Site"
}

# 2. Wait 16+ minutes without checking in

# 3. Trigger no-show detection
GET http://localhost:5000/api/no-shows

# Should return replacement candidates
```

### Test Replacement Acceptance
```bash
# Accept replacement assignment
POST http://localhost:5000/api/replacements/{replacementId}/accept
{
  "guardId": "REPLACEMENT_GUARD_ID"
}
```

## Performance Targets

- **No-show detection**: < 1 minute from start time
- **Replacement identification**: < 2 minutes
- **Notification delivery**: < 1 minute
- **Guard response time**: Target 5-10 minutes
- **System downtime**: < 1% availability SLA

## Security Considerations

- Guard check-in logs verified against GPS location (future)
- Authentication required for all API calls
- SMS OTP confirmation for critical changes
- Audit trail for all replacements
- Only admin can view other guards' schedules

---

**Version**: 1.0  
**Last Updated**: February 16, 2026
