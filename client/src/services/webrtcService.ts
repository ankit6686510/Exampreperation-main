import SimplePeer from 'simple-peer';
import { Socket } from 'socket.io-client';

interface PeerConnection {
  peer: SimplePeer.Instance;
  userId: string;
  stream?: MediaStream;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
}

interface PeerInfo {
  peerId: string;
  userId: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
}

interface WebRTCConfig {
  roomId: string;
  userId: string;
  userName: string;
  onPeerJoined?: (peerId: string, userId: string) => void;
  onPeerLeft?: (peerId: string) => void;
  onStreamAdded?: (peerId: string, stream: MediaStream) => void;
  onStreamRemoved?: (peerId: string) => void;
  onError?: (error: Error) => void;
  onConnectionQualityChange?: (peerId: string, quality: string) => void;
}

interface NetworkStats {
  latency: number;
  jitter: number;
  packetLoss: number;
  bitrate: number;
}

export class WebRTCService {
  private socket: Socket | null = null;
  private peers: Map<string, PeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private config: WebRTCConfig | null = null;
  private peerId: string;
  private statsIntervals: Map<string, NodeJS.Timeout> = new Map();

  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ];

  constructor() {
    this.peerId = this.generatePeerId();
  }

  private generatePeerId(): string {
    return `peer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize WebRTC service and join a room
   */
  async initialize(config: WebRTCConfig, socket: Socket): Promise<void> {
    this.config = config;
    this.socket = socket;

    // Set up socket event listeners
    this.setupSocketListeners();

    // Get local media stream
    await this.getLocalStream();

    // Join the WebRTC room
    this.socket.emit('webrtc-join-room', {
      roomId: config.roomId,
      peerId: this.peerId,
    });
  }

  /**
   * Get local media stream (camera and microphone)
   */
  private async getLocalStream(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    try {
      const defaultConstraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(
        constraints || defaultConstraints
      );

      return this.localStream;
    } catch (error) {
      console.error('Error getting local stream:', error);
      this.config?.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Get screen share stream
   */
  async startScreenShare(): Promise<MediaStream> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      // Handle screen share stop from browser UI
      this.screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopScreenShare();
      });

      // Notify peers about screen share
      this.socket?.emit('webrtc-start-screen-share', {
        roomId: this.config?.roomId,
        peerId: this.peerId,
      });

      // Replace video track in all peer connections
      this.peers.forEach((peerConnection) => {
        const sender = peerConnection.peer._pc
          ?.getSenders()
          .find((s) => s.track?.kind === 'video');
        
        if (sender && this.screenStream) {
          sender.replaceTrack(this.screenStream.getVideoTracks()[0]);
        }
      });

      return this.screenStream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      this.config?.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Stop screen sharing
   */
  stopScreenShare(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;

      // Revert to camera stream
      if (this.localStream) {
        this.peers.forEach((peerConnection) => {
          const sender = peerConnection.peer._pc
            ?.getSenders()
            .find((s) => s.track?.kind === 'video');
          
          if (sender && this.localStream) {
            sender.replaceTrack(this.localStream.getVideoTracks()[0]);
          }
        });
      }

      this.socket?.emit('webrtc-stop-screen-share', {
        roomId: this.config?.roomId,
        peerId: this.peerId,
      });
    }
  }

  /**
   * Setup socket event listeners for WebRTC signaling
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Existing peers in the room
    this.socket.on('webrtc-existing-peers', ({ peers }) => {
      peers.forEach((peerInfo: any) => {
        this.createPeerConnection(peerInfo.peerId, peerInfo.userId, true);
      });
    });

    // New peer joined
    this.socket.on('webrtc-peer-joined', ({ peerId, userId }) => {
      this.config?.onPeerJoined?.(peerId, userId);
    });

    // Peer left
    this.socket.on('webrtc-peer-left', ({ peerId }) => {
      this.removePeerConnection(peerId);
      this.config?.onPeerLeft?.(peerId);
    });

    // Receive offer from peer
    this.socket.on('webrtc-receive-offer', ({ fromPeerId, offer }) => {
      const peerConnection = this.peers.get(fromPeerId);
      if (peerConnection) {
        peerConnection.peer.signal(offer);
      }
    });

    // Receive answer from peer
    this.socket.on('webrtc-receive-answer', ({ fromPeerId, answer }) => {
      const peerConnection = this.peers.get(fromPeerId);
      if (peerConnection) {
        peerConnection.peer.signal(answer);
      }
    });

    // Receive ICE candidate
    this.socket.on('webrtc-receive-ice-candidate', ({ fromPeerId, candidate }) => {
      const peerConnection = this.peers.get(fromPeerId);
      if (peerConnection) {
        peerConnection.peer.signal(candidate);
      }
    });

    // Peer video toggled
    this.socket.on('webrtc-peer-video-toggled', ({ peerId, enabled }) => {
      const peerConnection = this.peers.get(peerId);
      if (peerConnection) {
        peerConnection.videoEnabled = enabled;
      }
    });

    // Peer audio toggled
    this.socket.on('webrtc-peer-audio-toggled', ({ peerId, enabled }) => {
      const peerConnection = this.peers.get(peerId);
      if (peerConnection) {
        peerConnection.audioEnabled = enabled;
      }
    });

    // Peer screen share started
    this.socket.on('webrtc-peer-screen-share-started', ({ peerId }) => {
      const peerConnection = this.peers.get(peerId);
      if (peerConnection) {
        peerConnection.screenShareEnabled = true;
      }
    });

    // Peer screen share stopped
    this.socket.on('webrtc-peer-screen-share-stopped', ({ peerId }) => {
      const peerConnection = this.peers.get(peerId);
      if (peerConnection) {
        peerConnection.screenShareEnabled = false;
      }
    });

    // WebRTC error
    this.socket.on('webrtc-error', ({ message }) => {
      this.config?.onError?.(new Error(message));
    });
  }

  /**
   * Create a peer connection
   */
  private createPeerConnection(peerId: string, userId: string, initiator: boolean): void {
    if (this.peers.has(peerId)) {
      return;
    }

    const peer = new SimplePeer({
      initiator,
      stream: this.localStream || undefined,
      config: {
        iceServers: this.iceServers,
      },
      trickle: true,
    });

    const peerConnection: PeerConnection = {
      peer,
      userId,
      audioEnabled: true,
      videoEnabled: true,
      screenShareEnabled: false,
    };

    // Handle signaling data
    peer.on('signal', (data) => {
      if (data.type === 'offer') {
        this.socket?.emit('webrtc-offer', {
          roomId: this.config?.roomId,
          targetPeerId: peerId,
          offer: data,
        });
      } else if (data.type === 'answer') {
        this.socket?.emit('webrtc-answer', {
          roomId: this.config?.roomId,
          targetPeerId: peerId,
          answer: data,
        });
      } else {
        // ICE candidate
        this.socket?.emit('webrtc-ice-candidate', {
          roomId: this.config?.roomId,
          targetPeerId: peerId,
          candidate: data,
        });
      }
    });

    // Handle incoming stream
    peer.on('stream', (stream) => {
      peerConnection.stream = stream;
      this.config?.onStreamAdded?.(peerId, stream);
    });

    // Handle peer connection
    peer.on('connect', () => {
      console.log('Peer connected:', peerId);
      this.startNetworkStatsCollection(peerId);
    });

    // Handle errors
    peer.on('error', (error) => {
      console.error('Peer connection error:', error);
      this.config?.onError?.(error);
    });

    // Handle close
    peer.on('close', () => {
      this.removePeerConnection(peerId);
    });

    this.peers.set(peerId, peerConnection);
  }

  /**
   * Remove a peer connection
   */
  private removePeerConnection(peerId: string): void {
    const peerConnection = this.peers.get(peerId);
    if (peerConnection) {
      peerConnection.peer.destroy();
      this.config?.onStreamRemoved?.(peerId);
      this.stopNetworkStatsCollection(peerId);
      this.peers.delete(peerId);
    }
  }

  /**
   * Toggle local video
   */
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });

      this.socket?.emit('webrtc-toggle-video', {
        roomId: this.config?.roomId,
        peerId: this.peerId,
        enabled,
      });
    }
  }

  /**
   * Toggle local audio
   */
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });

      this.socket?.emit('webrtc-toggle-audio', {
        roomId: this.config?.roomId,
        peerId: this.peerId,
        enabled,
      });
    }
  }

  /**
   * Start collecting network statistics for a peer
   */
  private startNetworkStatsCollection(peerId: string): void {
    const peerConnection = this.peers.get(peerId);
    if (!peerConnection) return;

    const interval = setInterval(async () => {
      try {
        const pc = peerConnection.peer._pc;
        if (!pc) return;

        const stats = await pc.getStats();
        const networkStats = this.parseStats(stats);

        if (networkStats) {
          this.socket?.emit('webrtc-network-stats', {
            roomId: this.config?.roomId,
            peerId: this.peerId,
            stats: networkStats,
          });

          // Calculate and emit connection quality
          const quality = this.calculateConnectionQuality(networkStats);
          this.config?.onConnectionQualityChange?.(peerId, quality);
        }
      } catch (error) {
        console.error('Error collecting network stats:', error);
      }
    }, 5000); // Collect stats every 5 seconds

    this.statsIntervals.set(peerId, interval);
  }

  /**
   * Stop collecting network statistics for a peer
   */
  private stopNetworkStatsCollection(peerId: string): void {
    const interval = this.statsIntervals.get(peerId);
    if (interval) {
      clearInterval(interval);
      this.statsIntervals.delete(peerId);
    }
  }

  /**
   * Parse WebRTC stats
   */
  private parseStats(stats: RTCStatsReport): NetworkStats | null {
    let latency = 0;
    let jitter = 0;
    let packetLoss = 0;
    let bitrate = 0;

    stats.forEach((report) => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        latency = report.currentRoundTripTime * 1000 || 0;
      }

      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        jitter = report.jitter || 0;
        const packetsLost = report.packetsLost || 0;
        const packetsReceived = report.packetsReceived || 1;
        packetLoss = (packetsLost / (packetsLost + packetsReceived)) * 100;
      }

      if (report.type === 'outbound-rtp') {
        bitrate = report.bytesSent || 0;
      }
    });

    return { latency, jitter, packetLoss, bitrate };
  }

  /**
   * Calculate connection quality based on network stats
   */
  private calculateConnectionQuality(stats: NetworkStats): string {
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
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get peer stream
   */
  getPeerStream(peerId: string): MediaStream | undefined {
    return this.peers.get(peerId)?.stream;
  }

  /**
   * Get all peers
   */
  getPeers(): Map<string, PeerConnection> {
    return this.peers;
  }

  /**
   * Get peer ID
   */
  getPeerId(): string {
    return this.peerId;
  }

  /**
   * Cleanup and disconnect
   */
  disconnect(): void {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    // Close all peer connections
    this.peers.forEach((peerConnection, peerId) => {
      this.removePeerConnection(peerId);
    });

    // Clear stats intervals
    this.statsIntervals.forEach((interval) => clearInterval(interval));
    this.statsIntervals.clear();

    // Emit leave event
    this.socket?.emit('webrtc-leave-room', {
      roomId: this.config?.roomId,
      peerId: this.peerId,
    });

    this.peers.clear();
  }
}

export default WebRTCService;
