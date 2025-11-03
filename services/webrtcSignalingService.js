const VideoSession = require('../models/VideoSession');
const WhiteboardSession = require('../models/WhiteboardSession');
const logger = require('../config/logger');
const { emitToRoom } = require('../config/socket');

// Store active peer connections per room
const roomPeers = new Map();
const peerToUser = new Map();

class WebRTCSignalingService {
  /**
   * Initialize WebRTC signaling handlers for a socket
   * @param {SocketIO.Socket} socket - Socket.io socket instance
   * @param {SocketIO.Server} io - Socket.io server instance
   */
  static initializeHandlers(socket, io) {
    const userId = socket.userId;

    // Join video room
    socket.on('webrtc-join-room', async ({ roomId, peerId }) => {
      try {
        socket.join(`webrtc:${roomId}`);
        
        // Initialize room peers map if not exists
        if (!roomPeers.has(roomId)) {
          roomPeers.set(roomId, new Map());
        }
        
        const peers = roomPeers.get(roomId);
        peers.set(peerId, {
          userId,
          socketId: socket.id,
          peerId,
          audioEnabled: true,
          videoEnabled: true,
          screenShareEnabled: false
        });
        
        peerToUser.set(peerId, userId);

        // Get or create video session
        let videoSession = await VideoSession.getActiveSession(roomId);
        if (!videoSession) {
          videoSession = await VideoSession.create({
            studyRoom: roomId,
            status: 'initializing'
          });
        }

        await videoSession.addParticipant(userId, peerId);

        // Notify other peers in the room
        const otherPeers = Array.from(peers.entries())
          .filter(([id]) => id !== peerId)
          .map(([id, data]) => ({
            peerId: id,
            userId: data.userId,
            audioEnabled: data.audioEnabled,
            videoEnabled: data.videoEnabled,
            screenShareEnabled: data.screenShareEnabled
          }));

        // Send existing peers to the new peer
        socket.emit('webrtc-existing-peers', { peers: otherPeers });

        // Notify others about the new peer
        socket.to(`webrtc:${roomId}`).emit('webrtc-peer-joined', {
          peerId,
          userId,
          audioEnabled: true,
          videoEnabled: true
        });

        logger.info('Peer joined WebRTC room', { roomId, peerId, userId });
      } catch (error) {
        logger.error('Error joining WebRTC room', { error: error.message, roomId, userId });
        socket.emit('webrtc-error', { message: 'Failed to join video room' });
      }
    });

    // Relay WebRTC offer
    socket.on('webrtc-offer', async ({ roomId, targetPeerId, offer }) => {
      try {
        const peers = roomPeers.get(roomId);
        if (!peers) {
          throw new Error('Room not found');
        }

        const targetPeer = peers.get(targetPeerId);
        if (!targetPeer) {
          throw new Error('Target peer not found');
        }

        // Send offer to target peer
        io.to(targetPeer.socketId).emit('webrtc-receive-offer', {
          fromPeerId: socket.handshake.query.peerId || socket.id,
          offer
        });

        logger.debug('WebRTC offer relayed', { roomId, targetPeerId });
      } catch (error) {
        logger.error('Error relaying WebRTC offer', { error: error.message, roomId });
        socket.emit('webrtc-error', { message: error.message });
      }
    });

    // Relay WebRTC answer
    socket.on('webrtc-answer', async ({ roomId, targetPeerId, answer }) => {
      try {
        const peers = roomPeers.get(roomId);
        if (!peers) {
          throw new Error('Room not found');
        }

        const targetPeer = peers.get(targetPeerId);
        if (!targetPeer) {
          throw new Error('Target peer not found');
        }

        // Send answer to target peer
        io.to(targetPeer.socketId).emit('webrtc-receive-answer', {
          fromPeerId: socket.handshake.query.peerId || socket.id,
          answer
        });

        logger.debug('WebRTC answer relayed', { roomId, targetPeerId });
      } catch (error) {
        logger.error('Error relaying WebRTC answer', { error: error.message, roomId });
        socket.emit('webrtc-error', { message: error.message });
      }
    });

    // Relay ICE candidate
    socket.on('webrtc-ice-candidate', async ({ roomId, targetPeerId, candidate }) => {
      try {
        const peers = roomPeers.get(roomId);
        if (!peers) {
          throw new Error('Room not found');
        }

        const targetPeer = peers.get(targetPeerId);
        if (!targetPeer) {
          throw new Error('Target peer not found');
        }

        // Send ICE candidate to target peer
        io.to(targetPeer.socketId).emit('webrtc-receive-ice-candidate', {
          fromPeerId: socket.handshake.query.peerId || socket.id,
          candidate
        });

        logger.debug('ICE candidate relayed', { roomId, targetPeerId });
      } catch (error) {
        logger.error('Error relaying ICE candidate', { error: error.message, roomId });
      }
    });

    // Toggle video
    socket.on('webrtc-toggle-video', async ({ roomId, peerId, enabled }) => {
      try {
        const peers = roomPeers.get(roomId);
        if (peers && peers.has(peerId)) {
          peers.get(peerId).videoEnabled = enabled;

          // Update video session
          const videoSession = await VideoSession.getActiveSession(roomId);
          if (videoSession) {
            await videoSession.updateParticipantStream(userId, { videoEnabled: enabled });
          }

          // Notify other peers
          socket.to(`webrtc:${roomId}`).emit('webrtc-peer-video-toggled', {
            peerId,
            enabled
          });

          logger.debug('Video toggled', { roomId, peerId, enabled });
        }
      } catch (error) {
        logger.error('Error toggling video', { error: error.message, roomId });
      }
    });

    // Toggle audio
    socket.on('webrtc-toggle-audio', async ({ roomId, peerId, enabled }) => {
      try {
        const peers = roomPeers.get(roomId);
        if (peers && peers.has(peerId)) {
          peers.get(peerId).audioEnabled = enabled;

          // Update video session
          const videoSession = await VideoSession.getActiveSession(roomId);
          if (videoSession) {
            await videoSession.updateParticipantStream(userId, { audioEnabled: enabled });
          }

          // Notify other peers
          socket.to(`webrtc:${roomId}`).emit('webrtc-peer-audio-toggled', {
            peerId,
            enabled
          });

          logger.debug('Audio toggled', { roomId, peerId, enabled });
        }
      } catch (error) {
        logger.error('Error toggling audio', { error: error.message, roomId });
      }
    });

    // Start screen share
    socket.on('webrtc-start-screen-share', async ({ roomId, peerId }) => {
      try {
        const peers = roomPeers.get(roomId);
        if (peers && peers.has(peerId)) {
          peers.get(peerId).screenShareEnabled = true;

          // Update video session
          const videoSession = await VideoSession.getActiveSession(roomId);
          if (videoSession) {
            await videoSession.updateParticipantStream(userId, { screenShareEnabled: true });
          }

          // Notify other peers
          socket.to(`webrtc:${roomId}`).emit('webrtc-peer-screen-share-started', {
            peerId,
            userId
          });

          logger.info('Screen share started', { roomId, peerId, userId });
        }
      } catch (error) {
        logger.error('Error starting screen share', { error: error.message, roomId });
      }
    });

    // Stop screen share
    socket.on('webrtc-stop-screen-share', async ({ roomId, peerId }) => {
      try {
        const peers = roomPeers.get(roomId);
        if (peers && peers.has(peerId)) {
          peers.get(peerId).screenShareEnabled = false;

          // Update video session
          const videoSession = await VideoSession.getActiveSession(roomId);
          if (videoSession) {
            await videoSession.updateParticipantStream(userId, { screenShareEnabled: false });
          }

          // Notify other peers
          socket.to(`webrtc:${roomId}`).emit('webrtc-peer-screen-share-stopped', {
            peerId
          });

          logger.info('Screen share stopped', { roomId, peerId });
        }
      } catch (error) {
        logger.error('Error stopping screen share', { error: error.message, roomId });
      }
    });

    // Update network stats
    socket.on('webrtc-network-stats', async ({ roomId, peerId, stats }) => {
      try {
        const videoSession = await VideoSession.getActiveSession(roomId);
        if (videoSession) {
          await videoSession.updateParticipantStream(userId, {
            networkStats: stats,
            connectionQuality: this.calculateConnectionQuality(stats)
          });
        }
      } catch (error) {
        logger.error('Error updating network stats', { error: error.message, roomId });
      }
    });

    // Leave video room
    socket.on('webrtc-leave-room', async ({ roomId, peerId }) => {
      await this.handlePeerLeave(io, roomId, peerId, userId);
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      // Find and remove peer from all rooms
      for (const [roomId, peers] of roomPeers.entries()) {
        for (const [peerId, peerData] of peers.entries()) {
          if (peerData.socketId === socket.id) {
            await this.handlePeerLeave(io, roomId, peerId, userId);
          }
        }
      }
    });
  }

  /**
   * Handle peer leaving a room
   * @param {SocketIO.Server} io - Socket.io server instance
   * @param {string} roomId - Room ID
   * @param {string} peerId - Peer ID
   * @param {string} userId - User ID
   */
  static async handlePeerLeave(io, roomId, peerId, userId) {
    try {
      const peers = roomPeers.get(roomId);
      if (peers && peers.has(peerId)) {
        peers.delete(peerId);
        peerToUser.delete(peerId);

        // If room is empty, clean up
        if (peers.size === 0) {
          roomPeers.delete(roomId);
        }

        // Update video session
        const videoSession = await VideoSession.getActiveSession(roomId);
        if (videoSession) {
          await videoSession.removeParticipant(userId);
          
          // End session if no active participants
          if (videoSession.activeParticipants === 0) {
            await videoSession.endSession();
          }
        }

        // Notify other peers
        io.to(`webrtc:${roomId}`).emit('webrtc-peer-left', { peerId });

        logger.info('Peer left WebRTC room', { roomId, peerId, userId });
      }
    } catch (error) {
      logger.error('Error handling peer leave', { error: error.message, roomId, peerId });
    }
  }

  /**
   * Calculate connection quality based on network stats
   * @param {Object} stats - Network statistics
   * @returns {string} Connection quality (excellent, good, fair, poor)
   */
  static calculateConnectionQuality(stats) {
    const { latency, packetLoss, jitter } = stats;
    
    if (latency < 100 && packetLoss < 1 && jitter < 30) {
      return 'excellent';
    } else if (latency < 200 && packetLoss < 3 && jitter < 50) {
      return 'good';
    } else if (latency < 300 && packetLoss < 5 && jitter < 80) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  /**
   * Get active peers in a room
   * @param {string} roomId - Room ID
   * @returns {Array} Array of peer objects
   */
  static getRoomPeers(roomId) {
    const peers = roomPeers.get(roomId);
    if (!peers) {
      return [];
    }

    return Array.from(peers.entries()).map(([peerId, data]) => ({
      peerId,
      userId: data.userId,
      audioEnabled: data.audioEnabled,
      videoEnabled: data.videoEnabled,
      screenShareEnabled: data.screenShareEnabled
    }));
  }

  /**
   * Clean up stale peer connections
   */
  static cleanupStalePeers() {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [roomId, peers] of roomPeers.entries()) {
      for (const [peerId, data] of peers.entries()) {
        if (now - data.lastActivity > timeout) {
          peers.delete(peerId);
          peerToUser.delete(peerId);
          logger.info('Cleaned up stale peer', { roomId, peerId });
        }
      }

      if (peers.size === 0) {
        roomPeers.delete(roomId);
      }
    }
  }
}

// Clean up stale peers every 5 minutes
setInterval(() => {
  WebRTCSignalingService.cleanupStalePeers();
}, 5 * 60 * 1000);

module.exports = WebRTCSignalingService;
