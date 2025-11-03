# WebRTC Advanced Real-time Features Implementation Guide

## Overview
This guide documents the implementation of advanced real-time features including video conferencing, collaborative whiteboards, voice notes, and live doubt resolution.

## Architecture

### Technology Stack
- **WebRTC**: Peer-to-peer video/audio communication
- **simple-peer**: WebRTC wrapper for easier implementation
- **Excalidraw**: Collaborative whiteboard
- **Y.js**: CRDT for real-time synchronization
- **WaveSurfer.js**: Audio waveform visualization
- **RecordRTC**: Browser audio/video recording

## Phase 1: WebRTC Video Conferencing

### Backend Components

#### 1. WebRTC Signaling Service (`services/webrtcSignalingService.js`)
Handles WebRTC signaling via Socket.io:
- Peer discovery
- Offer/Answer exchange
- ICE candidate relay
- Room management

#### 2. Video Session Model (`models/VideoSession.js`)
Tracks active video sessions:
```javascript
{
  studyRoom: ObjectId,
  participants: [{
    user: ObjectId,
    peerId: String,
    streamType: 'camera' | 'screen',
    audioEnabled: Boolean,
    videoEnabled: Boolean
  }],
  startedAt: Date,
  endedAt: Date
}
```

### Frontend Components

#### 1. Video Conference Manager (`services/webrtcService.ts`)
Core WebRTC management:
- Peer connection creation
- Stream handling
- Signal processing
- Screen sharing

#### 2. Video Grid Component (`components/VideoConference/VideoGrid.tsx`)
UI for multi-participant video:
- Responsive grid layout
- Auto-scaling tiles
- Active speaker detection
- Pinning functionality

#### 3. Video Controls (`components/VideoConference/VideoControls.tsx`)
User controls:
- Mic mute/unmute
- Camera on/off
- Screen share toggle
- Leave room

## Phase 2: Collaborative Whiteboard

### Integration with Excalidraw

#### 1. Whiteboard Service (`services/whiteboardService.ts`)
Manages collaborative drawing:
- Y.js document synchronization
- Canvas state management
- Undo/redo coordination
- Export functionality

#### 2. Whiteboard Component (`components/Whiteboard/CollaborativeBoard.tsx`)
React wrapper for Excalidraw:
- Multi-user cursors
- Real-time synchronization
- Tool palette
- Export/import

### Database Schema
```javascript
WhiteboardSession {
  studyRoom: ObjectId,
  yDocState: Buffer, // Y.js encoded state
  contributors: [ObjectId],
  snapshots: [{
    timestamp: Date,
    state: Buffer,
    createdBy: ObjectId
  }]
}
```

## Phase 3: Voice Notes

### Recording Infrastructure

#### 1. Voice Note Service (`services/voiceNoteService.ts`)
Audio recording and playback:
- MediaRecorder API integration
- Audio blob handling
- Upload to Cloudinary
- Playback controls

#### 2. Voice Note Model (`models/VoiceNote.js`)
```javascript
{
  studyRoom: ObjectId,
  creator: ObjectId,
  audioUrl: String,
  duration: Number,
  waveformData: [Number],
  tags: [String],
  timestamp: Date
}
```

### Features
- Real-time waveform visualization
- Playback speed control (0.5x, 1x, 1.5x, 2x)
- Timestamped annotations
- Download capability

## Phase 4: Live Doubt Resolution

### Components

#### 1. Raise Hand System
Socket.io events:
- `raise-hand`: Student raises hand
- `lower-hand`: Student lowers hand
- `hand-queue-updated`: Broadcast queue changes

#### 2. Spotlight Mode
- Temporarily elevate permissions
- Grant whiteboard access
- Promote audio/video priority

#### 3. Q&A Panel
Real-time text questions:
- Question submission
- Upvoting mechanism
- Answer marking
- Search/filter

## Socket.io Events

### Video Conferencing
```javascript
// Client -> Server
'webrtc-offer': { roomId, targetPeerId, offer }
'webrtc-answer': { roomId, targetPeerId, answer }
'webrtc-ice-candidate': { roomId, targetPeerId, candidate }
'toggle-video': { roomId, enabled }
'toggle-audio': { roomId, enabled }
'start-screen-share': { roomId }
'stop-screen-share': { roomId }

// Server -> Client
'peer-joined': { peerId, userId, userName }
'peer-left': { peerId }
'receive-offer': { fromPeerId, offer }
'receive-answer': { fromPeerId, answer }
'receive-ice-candidate': { fromPeerId, candidate }
'peer-video-toggled': { peerId, enabled }
'peer-audio-toggled': { peerId, enabled }
```

### Whiteboard
```javascript
// Client -> Server
'whiteboard-update': { roomId, changes }
'whiteboard-cursor-move': { roomId, x, y }

// Server -> Client
'whiteboard-sync': { state }
'peer-cursor-moved': { userId, x, y }
```

### Voice Notes
```javascript
// Client -> Server
'voice-note-created': { roomId, audioUrl, duration }

// Server -> Client
'new-voice-note': { noteId, creator, audioUrl }
```

### Doubt Resolution
```javascript
// Client -> Server
'raise-hand': { roomId }
'lower-hand': { roomId }
'submit-question': { roomId, question }
'upvote-question': { roomId, questionId }

// Server -> Client
'hand-raised': { userId, userName, timestamp }
'hand-lowered': { userId }
'new-question': { question }
'question-upvoted': { questionId, votes }
```

## Security Considerations

### 1. Authentication
- JWT token validation on socket connection
- Room access verification
- Permission checks for actions

### 2. Rate Limiting
- Drawing events: 60 events/second
- Signaling messages: 100/minute
- Voice notes: 10/hour per user

### 3. Data Validation
- Audio file size: max 10MB
- Whiteboard data: max 5MB
- ICE candidates: format validation

### 4. Privacy
- SRTP encryption for media
- TLS for signaling
- Cloudinary signed uploads

## STUN/TURN Configuration

### Free Options
```javascript
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];
```

### Production (Twilio)
```javascript
// Get TURN credentials from Twilio
const iceServers = await twilioClient.tokens.create();
```

## Performance Optimization

### 1. Video Quality
- Adaptive bitrate (250kbps - 2.5Mbps)
- Resolution scaling (240p - 720p)
- Frame rate: 15-30fps based on network

### 2. Whiteboard
- Throttle drawing events to 60fps
- Delta compression for state sync
- Lazy load history snapshots

### 3. Scalability
- WebRTC mesh topology for ≤4 peers
- SFU (Selective Forwarding Unit) for >4 peers
- Consider MediaSoup or LiveKit for production scale

## Testing Strategy

### 1. Unit Tests
- WebRTC service methods
- Whiteboard synchronization
- Voice note recording/playback

### 2. Integration Tests
- Multi-peer connections
- Socket.io event flow
- Database operations

### 3. E2E Tests
- Full video session lifecycle
- Collaborative drawing
- Voice note creation

## Deployment Considerations

### 1. Backend
- WebSocket support required
- Sticky sessions for Socket.io
- HTTPS/WSS in production

### 2. Frontend
- Browser permissions (camera, mic)
- HTTPS required for getUserMedia
- Fallback for unsupported browsers

### 3. Infrastructure
- CDN for static assets
- Cloudinary for media storage
- Redis for Socket.io adapter (multi-instance)

## Browser Support

### Minimum Requirements
- Chrome 74+
- Firefox 66+
- Safari 13+
- Edge 79+

### Feature Detection
```javascript
const hasWebRTC = !!(
  navigator.mediaDevices &&
  navigator.mediaDevices.getUserMedia &&
  RTCPeerConnection
);
```

## Cost Estimation

### Free Tier (Development)
- STUN servers: Free
- Open TURN relay: Free (limited)
- Cloudinary: 25GB storage, 25GB bandwidth

### Production (Monthly)
- Twilio TURN: ~$0.0005/min (~$50-200)
- Cloudinary Pro: $99/month
- Increased server costs: +$20-50

## Next Steps

1. ✅ Review and approve this implementation plan
2. ⏳ Install dependencies
3. ⏳ Implement WebRTC signaling service
4. ⏳ Create video session model
5. ⏳ Build frontend video components
6. ⏳ Integrate collaborative whiteboard
7. ⏳ Implement voice notes
8. ⏳ Add doubt resolution system
9. ⏳ Testing and optimization
10. ⏳ Documentation and deployment

---

**Last Updated**: October 26, 2025
**Version**: 1.0.0
