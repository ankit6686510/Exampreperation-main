const jwt = require('jsonwebtoken');
const logger = require('./logger');
const WebRTCSignalingService = require('../services/webrtcSignalingService');

const userSockets = new Map();
const roomParticipants = new Map();

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userEmail = decoded.email;
    
    logger.info('Socket authenticated', { userId: decoded.id, socketId: socket.id });
    next();
  } catch (error) {
    logger.error('Socket authentication failed', { error: error.message });
    next(new Error('Authentication error: Invalid token'));
  }
};

const initializeSocketHandlers = (io) => {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const userId = socket.userId;
    
    userSockets.set(userId, socket.id);
    
    logger.info('User connected', { userId, socketId: socket.id });

    // Initialize WebRTC signaling handlers
    WebRTCSignalingService.initializeHandlers(socket, io);

    socket.on('join-study-room', async ({ roomId }) => {
      try {
        socket.join(`room:${roomId}`);
        
        if (!roomParticipants.has(roomId)) {
          roomParticipants.set(roomId, new Map());
        }
        
        roomParticipants.get(roomId).set(userId, {
          socketId: socket.id,
          status: 'online',
          joinedAt: new Date(),
          lastActivity: new Date()
        });

        const participants = Array.from(roomParticipants.get(roomId).entries()).map(([id, data]) => ({
          userId: id,
          status: data.status,
          joinedAt: data.joinedAt
        }));

        io.to(`room:${roomId}`).emit('participant-joined', {
          userId,
          roomId,
          participants
        });

        logger.info('User joined study room', { userId, roomId });
      } catch (error) {
        logger.error('Error joining study room', { userId, roomId, error: error.message });
        socket.emit('error', { message: 'Failed to join study room' });
      }
    });

    socket.on('leave-study-room', async ({ roomId }) => {
      try {
        socket.leave(`room:${roomId}`);
        
        if (roomParticipants.has(roomId)) {
          roomParticipants.get(roomId).delete(userId);
          
          if (roomParticipants.get(roomId).size === 0) {
            roomParticipants.delete(roomId);
          }
        }

        io.to(`room:${roomId}`).emit('participant-left', {
          userId,
          roomId
        });

        logger.info('User left study room', { userId, roomId });
      } catch (error) {
        logger.error('Error leaving study room', { userId, roomId, error: error.message });
      }
    });

    socket.on('update-presence', async ({ roomId, status }) => {
      try {
        if (roomParticipants.has(roomId) && roomParticipants.get(roomId).has(userId)) {
          const participant = roomParticipants.get(roomId).get(userId);
          participant.status = status;
          participant.lastActivity = new Date();

          io.to(`room:${roomId}`).emit('presence-updated', {
            userId,
            status,
            timestamp: new Date()
          });

          logger.debug('Presence updated', { userId, roomId, status });
        }
      } catch (error) {
        logger.error('Error updating presence', { userId, roomId, error: error.message });
      }
    });

    socket.on('pomodoro-phase-change', async ({ roomId, phase, startTime, endTime }) => {
      try {
        io.to(`room:${roomId}`).emit('pomodoro-updated', {
          phase,
          startTime,
          endTime,
          timestamp: new Date()
        });

        logger.info('Pomodoro phase changed', { roomId, phase });
      } catch (error) {
        logger.error('Error broadcasting pomodoro change', { roomId, error: error.message });
      }
    });

    socket.on('session-started', async ({ roomId, startTime }) => {
      try {
        io.to(`room:${roomId}`).emit('session-start-notification', {
          roomId,
          startTime,
          timestamp: new Date()
        });

        logger.info('Session started notification sent', { roomId });
      } catch (error) {
        logger.error('Error broadcasting session start', { roomId, error: error.message });
      }
    });

    socket.on('session-ended', async ({ roomId, endTime, stats }) => {
      try {
        io.to(`room:${roomId}`).emit('session-end-notification', {
          roomId,
          endTime,
          stats,
          timestamp: new Date()
        });

        if (roomParticipants.has(roomId)) {
          roomParticipants.delete(roomId);
        }

        logger.info('Session ended notification sent', { roomId });
      } catch (error) {
        logger.error('Error broadcasting session end', { roomId, error: error.message });
      }
    });

    socket.on('send-message', async ({ roomId, message }) => {
      try {
        io.to(`room:${roomId}`).emit('new-message', {
          userId,
          message,
          timestamp: new Date()
        });

        logger.debug('Message sent to room', { userId, roomId });
      } catch (error) {
        logger.error('Error sending message', { userId, roomId, error: error.message });
      }
    });

    socket.on('disconnect', () => {
      userSockets.delete(userId);
      
      roomParticipants.forEach((participants, roomId) => {
        if (participants.has(userId)) {
          participants.delete(userId);
          
          io.to(`room:${roomId}`).emit('participant-left', {
            userId,
            roomId
          });
          
          if (participants.size === 0) {
            roomParticipants.delete(roomId);
          }
        }
      });

      logger.info('User disconnected', { userId, socketId: socket.id });
    });
  });

  setInterval(() => {
    const now = new Date();
    roomParticipants.forEach((participants, roomId) => {
      participants.forEach((data, userId) => {
        const inactiveTime = now - data.lastActivity;
        if (inactiveTime > 5 * 60 * 1000 && data.status !== 'idle') {
          data.status = 'idle';
          io.to(`room:${roomId}`).emit('presence-updated', {
            userId,
            status: 'idle',
            timestamp: now
          });
        }
      });
    });
  }, 60000);
};

const emitToUser = (userId, event, data) => {
  const socketId = userSockets.get(userId);
  if (socketId && global.io) {
    global.io.to(socketId).emit(event, data);
    return true;
  }
  return false;
};

const emitToRoom = (roomId, event, data) => {
  if (global.io) {
    global.io.to(`room:${roomId}`).emit(event, data);
    return true;
  }
  return false;
};

const getRoomParticipants = (roomId) => {
  if (!roomParticipants.has(roomId)) {
    return [];
  }
  
  return Array.from(roomParticipants.get(roomId).entries()).map(([userId, data]) => ({
    userId,
    status: data.status,
    joinedAt: data.joinedAt,
    lastActivity: data.lastActivity
  }));
};

const isUserOnline = (userId) => {
  return userSockets.has(userId);
};

module.exports = {
  initializeSocketHandlers,
  emitToUser,
  emitToRoom,
  getRoomParticipants,
  isUserOnline
};
