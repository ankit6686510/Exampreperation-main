# Real-Time WebSocket Integration Guide

## Overview

This guide documents the real-time WebSocket integration implemented for the Study Rooms feature using Socket.io. The system enables live collaboration, presence tracking, Pomodoro synchronization, and instant notifications.

## Architecture

### Backend Components

#### 1. Socket.io Server (`server.js`)
- HTTP server upgraded to support WebSocket connections
- CORS configured for allowed origins
- Global `io` instance accessible throughout the application

```javascript
const io = socketIo(server, {
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

global.io = io;
initializeSocketHandlers(io);
```

#### 2. Socket Configuration (`config/socket.js`)
**Authentication:**
- JWT token verification on socket connection
- User ID and email attached to socket instance
- Automatic disconnection on invalid token

**Event Handlers:**
- `join-study-room`: User joins a study room
- `leave-study-room`: User leaves a study room
- `update-presence`: User status change (online/studying/idle)
- `pomodoro-phase-change`: Pomodoro timer phase transitions
- `session-started`: Study session begins
- `session-ended`: Study session completes
- `send-message`: Chat message in study room
- `disconnect`: Cleanup on user disconnect

**State Management:**
- `userSockets`: Map of userId → socketId
- `roomParticipants`: Map of roomId → Map of userId → participant data

**Auto-Idle Detection:**
- Runs every 60 seconds
- Marks users idle after 5 minutes of inactivity
- Broadcasts presence updates automatically

#### 3. Notification System

**Model (`models/Notification.js`):**
- 13 notification types (study_room_reminder, pomodoro_break, etc.)
- Priority levels: low, medium, high, urgent
- Auto-expiration support
- Read/unread tracking
- Bulk operations support

**Controller (`controllers/notificationController.js`):**
- REST API endpoints for notifications
- Real-time emission via Socket.io
- Specialized notification creators:
  - `sendStudyRoomReminder()`: 15-minute session reminders
  - `sendSessionStartNotification()`: Session start alerts
  - `sendPomodoroNotification()`: Phase change notifications

**Scheduler (`utils/notificationScheduler.js`):**
- Cron job running every minute
- Finds sessions starting in 15-16 minutes
- Sends reminders to registered participants
- Marks rooms as `reminderSent` to prevent duplicates

### Frontend Components

#### 1. Socket Client (`client/src/lib/socket.ts`)
**Initialization:**
```typescript
const socket = io(SOCKET_URL, {
  auth: { token },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5
});
```

**Exported Functions:**
- Connection: `initializeSocket()`, `disconnectSocket()`, `getSocket()`
- Room Actions: `joinStudyRoom()`, `leaveStudyRoom()`
- Presence: `updatePresence()`
- Messaging: `sendMessage()`
- Pomodoro: `emitPomodoroPhaseChange()`
- Session: `emitSessionStarted()`, `emitSessionEnded()`
- Event Listeners: `onParticipantJoined()`, `onPomodoroUpdated()`, etc.

#### 2. React Hooks

**`useSocket()`:**
- Initializes socket connection when user logs in
- Cleans up on logout
- Returns socket instance

**`useStudyRoomSocket(roomId)`:**
- Manages room-specific WebSocket state
- Tracks participants, messages, Pomodoro state
- Auto-joins/leaves room on mount/unmount
- Returns: `{ participants, messages, pomodoroState, sessionActive, updateMyPresence, sendChatMessage }`

**`useNotifications()`:**
- Fetches notifications via React Query
- Listens for real-time notification events
- Shows toast for high/urgent priority notifications
- Returns: `{ notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification }`

#### 3. UI Components

**`NotificationBell`:**
- Dropdown menu with notification list
- Unread count badge
- Mark all as read button
- Click notification to navigate to actionUrl
- Priority color indicators
- Relative timestamps

**Integration in Layout:**
- Desktop: Notification bell in sidebar
- Mobile: Notification bell in header
- Socket initialized in Layout component via `useSocket()`

## Real-Time Features

### 1. Participant Tracking
**Flow:**
1. User joins room → `join-study-room` event
2. Server adds to `roomParticipants` map
3. Broadcasts `participant-joined` with full participant list
4. All clients update their participant UI

**Data Structure:**
```javascript
{
  userId: string,
  socketId: string,
  status: 'online' | 'studying' | 'idle',
  joinedAt: Date,
  lastActivity: Date
}
```

### 2. Presence Indicators
**Status Types:**
- `online`: Connected but not actively studying
- `studying`: Actively engaged in study session
- `idle`: No activity for 5+ minutes (auto-detected)

**Updates:**
- Manual: User calls `updatePresence(roomId, status)`
- Automatic: Server detects idle after 5 minutes
- Broadcast: All room participants receive `presence-updated` event

### 3. Pomodoro Synchronization
**Phase Types:**
- `work`: Focus time (default 25 min)
- `short-break`: Short rest (default 5 min)
- `long-break`: Long rest (default 15 min)

**Flow:**
1. Host triggers phase change
2. Backend updates room's `pomodoroState`
3. Emits `pomodoro-phase-change` event
4. Server broadcasts `pomodoro-updated` to all participants
5. Clients sync their timers
6. Notification sent to all participants

### 4. Session Notifications
**Types:**
1. **Reminder (15 min before):**
   - Cron job checks every minute
   - Finds sessions starting in 15-16 min window
   - Sends to registered participants
   - Marks `reminderSent: true`

2. **Session Start:**
   - Host starts session
   - Notification sent to all participants
   - Real-time `session-start-notification` event

3. **Session End:**
   - Host ends session
   - Stats included in notification
   - Cleanup: Remove from `roomParticipants`

4. **Pomodoro Phases:**
   - Work phase: "Time to focus!"
   - Short break: "Take a short break!"
   - Long break: "Long break time!"

## API Endpoints

### Notifications
```
GET    /api/notifications              - Get user notifications
GET    /api/notifications/unread-count - Get unread count
POST   /api/notifications/mark-read    - Mark specific as read
POST   /api/notifications/mark-all-read - Mark all as read
DELETE /api/notifications/:id          - Delete notification
```

### WebSocket Events

**Client → Server:**
- `join-study-room`: { roomId }
- `leave-study-room`: { roomId }
- `update-presence`: { roomId, status }
- `send-message`: { roomId, message }
- `pomodoro-phase-change`: { roomId, phase, startTime, endTime }
- `session-started`: { roomId, startTime }
- `session-ended`: { roomId, endTime, stats }

**Server → Client:**
- `participant-joined`: { userId, roomId, participants[] }
- `participant-left`: { userId, roomId }
- `presence-updated`: { userId, status, timestamp }
- `pomodoro-updated`: { phase, startTime, endTime, timestamp }
- `session-start-notification`: { roomId, startTime, timestamp }
- `session-end-notification`: { roomId, endTime, stats, timestamp }
- `new-message`: { userId, message, timestamp }
- `new-notification`: { notification }

## Usage Examples

### Backend: Send Notification
```javascript
const { createNotification } = require('../controllers/notificationController');

await createNotification(userId, {
  type: 'study_room_reminder',
  title: 'Study Room Starting Soon',
  message: '"UPSC Morning Session" starts in 15 minutes',
  data: { roomId: room._id },
  priority: 'high',
  actionUrl: `/study-rooms/${room._id}`
});
```

### Frontend: Join Room with Real-Time Updates
```typescript
import { useStudyRoomSocket } from '@/hooks/useStudyRoomSocket';

function StudyRoomPage({ roomId }) {
  const {
    participants,
    messages,
    pomodoroState,
    sessionActive,
    updateMyPresence,
    sendChatMessage
  } = useStudyRoomSocket(roomId);

  // Participants auto-update when users join/leave
  // Pomodoro state syncs across all clients
  // Messages appear in real-time
}
```

### Frontend: Display Notifications
```typescript
import { useNotifications } from '@/hooks/useNotifications';

function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  // Notifications auto-update via WebSocket
  // High-priority notifications show toast
}
```

## Configuration

### Environment Variables
```env
# CORS Origins (comma-separated)
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# JWT Secret
JWT_SECRET=your-secret-key

# API URL (frontend)
VITE_API_URL=http://localhost:5000
```

### Dependencies
**Backend:**
- `socket.io`: ^4.x
- `node-cron`: ^3.x

**Frontend:**
- `socket.io-client`: ^4.x

## Security Considerations

1. **Authentication:**
   - JWT token required for socket connection
   - Token verified on every connection
   - Invalid tokens rejected immediately

2. **Authorization:**
   - Room membership verified before join
   - Only hosts can trigger session start/end
   - Only hosts can change Pomodoro phases

3. **Rate Limiting:**
   - Socket.io has built-in backpressure
   - Consider adding rate limits for message sending

4. **Data Validation:**
   - Validate all incoming socket events
   - Sanitize user-generated content (messages)

## Monitoring & Debugging

### Logs
```javascript
// Socket connections
logger.info('Socket authenticated', { userId, socketId });
logger.info('User joined study room', { userId, roomId });

// Notifications
logger.info('Study room reminder sent', { roomId, participantCount });
logger.info('Pomodoro notifications sent', { roomId, phase });
```

### Debugging Tips
1. Check browser console for socket connection status
2. Monitor Network tab for WebSocket frames
3. Use `socket.id` to track specific connections
4. Check `roomParticipants` map for state issues
5. Verify cron job execution in server logs

## Performance Optimization

1. **Connection Pooling:**
   - Socket.io handles connection pooling automatically
   - Reconnection with exponential backoff

2. **Event Batching:**
   - Consider batching presence updates
   - Debounce frequent events

3. **Memory Management:**
   - Auto-cleanup on disconnect
   - Remove empty rooms from `roomParticipants`
   - Notification expiration via MongoDB TTL

4. **Scalability:**
   - For multiple servers, use Redis adapter:
     ```javascript
     const { createAdapter } = require('@socket.io/redis-adapter');
     io.adapter(createAdapter(redisClient, redisClient.duplicate()));
     ```

## Future Enhancements

1. **Typing Indicators:** Show when users are typing messages
2. **Voice/Video:** Integrate WebRTC for audio/video calls
3. **Screen Sharing:** Add screen sharing capability
4. **Whiteboard:** Collaborative drawing/writing
5. **File Sharing:** Real-time file uploads in sessions
6. **Reactions:** Emoji reactions to messages
7. **Polls:** Quick polls during sessions
8. **Breakout Rooms:** Split participants into smaller groups

## Troubleshooting

### Socket Not Connecting
- Check CORS configuration
- Verify JWT token is valid
- Check firewall/proxy settings
- Ensure WebSocket transport is allowed

### Notifications Not Appearing
- Verify cron job is running
- Check notification model for errors
- Ensure `reminderSent` flag is working
- Check socket connection status

### Presence Not Updating
- Verify `update-presence` events are sent
- Check auto-idle detection (60s interval)
- Ensure socket is connected
- Check `roomParticipants` map state

### Pomodoro Out of Sync
- Verify all clients receive `pomodoro-updated` event
- Check system time on server and clients
- Ensure phase transitions are broadcast
- Validate Pomodoro state in database

## Testing

### Manual Testing Checklist
- [ ] Socket connects on login
- [ ] Socket disconnects on logout
- [ ] Join room adds to participants list
- [ ] Leave room removes from participants list
- [ ] Presence updates broadcast to all
- [ ] Pomodoro phases sync across clients
- [ ] Notifications appear in real-time
- [ ] 15-min reminders sent correctly
- [ ] Session start/end notifications work
- [ ] Chat messages appear instantly
- [ ] Auto-idle detection works
- [ ] Reconnection after network loss

### Automated Testing
```javascript
// Example: Test socket authentication
describe('Socket Authentication', () => {
  it('should connect with valid token', async () => {
    const socket = io(SOCKET_URL, { auth: { token: validToken } });
    await new Promise(resolve => socket.on('connect', resolve));
    expect(socket.connected).toBe(true);
  });

  it('should reject invalid token', async () => {
    const socket = io(SOCKET_URL, { auth: { token: 'invalid' } });
    await new Promise(resolve => socket.on('connect_error', resolve));
    expect(socket.connected).toBe(false);
  });
});
```

## Conclusion

The real-time WebSocket integration provides a robust foundation for collaborative study features. The system is designed for scalability, security, and user experience, with comprehensive error handling and automatic reconnection.

For questions or issues, refer to the Socket.io documentation: https://socket.io/docs/v4/