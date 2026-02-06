# Notification System Testing Guide

## 🔔 Complete Testing Guide for Notification System

### Prerequisites
- Backend running on port 5000 ✅
- Frontend running on port 8080 ✅
- User logged in to the application

---

## 1. 🖱️ Manual UI Testing

### Test the Notification Bell
1. **Login** to the application at `http://localhost:8080`
2. **Look for the Bell Icon** in the sidebar user section
3. **Click the Bell** to see the dropdown
4. **Check initial state**: Should show "No notifications"

### Expected UI Elements
- 🔔 Bell icon in sidebar
- 📍 Red badge with count (when unread notifications exist)
- 📋 Dropdown with notifications list
- ⚡ "Mark all read" button
- 🗑️ Delete options

---

## 2. 🧪 API Testing (Using curl/Postman)

### Get Auth Token First
```bash
# Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ankit6686510@gmail.com",
    "password": "ankitjha@22"
  }'
```

### Test Notification Endpoints
```bash
# Get all notifications
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get unread count
curl -X GET http://localhost:5000/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Mark notifications as read
curl -X POST http://localhost:5000/api/notifications/mark-read \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"notificationIds": ["NOTIFICATION_ID_HERE"]}'

# Mark all as read
curl -X POST http://localhost:5000/api/notifications/mark-all-read \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 3. 🎯 Test Script - Create Sample Notifications

### Using Node.js Console
```javascript
// Run this in Node.js console or create a test file
const mongoose = require('mongoose');
const Notification = require('./models/Notification');

// Connect to database
mongoose.connect('mongodb://localhost:27017/exam-planner');

// Create test notification
const createTestNotification = async (userId) => {
  const notification = new Notification({
    user: userId, // Your user ID here
    type: 'system',
    title: 'Test Notification',
    message: 'This is a test notification to verify the system works!',
    priority: 'high',
    read: false,
    actionUrl: '/dashboard'
  });
  
  await notification.save();
  console.log('Test notification created!');
};

// Call the function with your user ID
createTestNotification('YOUR_USER_ID_HERE');
```

---

## 4. 🚀 Automated Test Script

### Create Test Notifications Script
```bash
# I'll create a test script for you
node scripts/createTestNotifications.js
```

---

## 5. ⚡ Real-time Testing (WebSocket)

### Test Socket Notifications
1. **Open Browser Developer Tools**
2. **Go to Network Tab → WS (WebSocket)**
3. **Look for socket connection**
4. **Create notification via API**
5. **Watch for real-time update in UI**

---

## 6. 🧪 Study-Specific Notification Testing

### Test Study Room Notifications
```bash
# Create a study room that starts soon
curl -X POST http://localhost:5000/api/study-rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Test Study Room",
    "description": "Testing notifications",
    "scheduledTime": {
      "start": "2025-10-26T03:00:00.000Z",
      "end": "2025-10-26T04:00:00.000Z"
    },
    "maxParticipants": 10
  }'
```

### Test Pomodoro Notifications
1. **Join a study room**
2. **Start a Pomodoro session**
3. **Wait for phase transitions**
4. **Check notifications for work/break alerts**

---

## 7. 📱 Testing Notification Types

### Priority Levels
- 🔴 **Urgent**: Red indicator, immediate toast
- 🟠 **High**: Orange indicator, toast notification
- 🔵 **Medium**: Blue indicator
- ⚫ **Low**: Gray indicator

### Notification Types
- 📚 **Study Room Reminders**: 15 minutes before session
- ▶️ **Session Started**: When room becomes active
- ⏰ **Pomodoro Phases**: Work/break transitions
- 🏆 **Achievements**: Study milestones
- 📢 **System Alerts**: Important announcements

---

## 8. 🔍 Debugging & Verification

### Check Database
```bash
# Connect to MongoDB
mongosh exam-planner

# View notifications
db.notifications.find().pretty()

# Count unread notifications for user
db.notifications.countDocuments({user: ObjectId("YOUR_USER_ID"), read: false})
```

### Check Browser Console
- Look for WebSocket connection
- Check for notification API calls
- Verify real-time updates

### Check Server Logs
- Monitor backend terminal for notification logs
- Look for socket emission logs
- Check for any errors

---

## 9. ✅ Test Checklist

### Basic Functionality
- [ ] Bell icon appears in sidebar
- [ ] Dropdown opens when clicked
- [ ] Empty state shows "No notifications"
- [ ] Badge appears with unread count
- [ ] Mark as read functionality works
- [ ] Mark all as read works
- [ ] Delete notification works

### Real-time Features
- [ ] New notifications appear instantly
- [ ] Unread count updates in real-time
- [ ] Toast notifications for high priority
- [ ] WebSocket connection established

### Study Features
- [ ] Study room reminders work
- [ ] Session start notifications work
- [ ] Pomodoro phase notifications work
- [ ] Priority levels display correctly

### API Endpoints
- [ ] GET /api/notifications
- [ ] GET /api/notifications/unread-count
- [ ] POST /api/notifications/mark-read
- [ ] POST /api/notifications/mark-all-read
- [ ] DELETE /api/notifications/:id

---

## 🎉 Expected Results

When working correctly, you should see:
1. **Bell icon** with optional red badge
2. **Dropdown** with notification list
3. **Real-time updates** without page refresh
4. **Toast notifications** for important alerts
5. **Proper styling** with priority colors
6. **Navigation** when clicking notifications
7. **Database updates** when marking as read

---

## 🐛 Troubleshooting

### Common Issues
- **No bell icon**: Check if NotificationBell component is imported
- **No notifications**: Create test data using the script
- **No real-time updates**: Check WebSocket connection
- **API errors**: Verify authentication token
- **Database issues**: Check MongoDB connection

### Quick Fixes
```bash
# Restart servers if needed
npm start          # Backend
cd client && npm run dev  # Frontend

# Check MongoDB connection
mongosh exam-planner

# Clear browser cache and cookies
