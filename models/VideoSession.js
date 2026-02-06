const mongoose = require('mongoose');

const videoSessionSchema = new mongoose.Schema({
  studyRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyRoom',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    peerId: {
      type: String,
      required: true
    },
    streamType: {
      type: String,
      enum: ['camera', 'screen', 'both'],
      default: 'camera'
    },
    audioEnabled: {
      type: Boolean,
      default: true
    },
    videoEnabled: {
      type: Boolean,
      default: true
    },
    screenShareEnabled: {
      type: Boolean,
      default: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: Date,
    connectionQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    networkStats: {
      latency: Number,
      jitter: Number,
      packetLoss: Number,
      bitrate: Number
    }
  }],
  sessionSettings: {
    maxParticipants: {
      type: Number,
      default: 10,
      min: 2,
      max: 50
    },
    recordingEnabled: {
      type: Boolean,
      default: false
    },
    audioOnly: {
      type: Boolean,
      default: false
    },
    screenShareAllowed: {
      type: Boolean,
      default: true
    },
    quality: {
      type: String,
      enum: ['low', 'medium', 'high', 'auto'],
      default: 'auto'
    }
  },
  recording: {
    isRecording: {
      type: Boolean,
      default: false
    },
    recordingUrl: String,
    recordingStartTime: Date,
    recordingEndTime: Date,
    recordingDuration: Number, // in seconds
    recordingSize: Number // in bytes
  },
  stats: {
    peakParticipants: {
      type: Number,
      default: 0
    },
    totalParticipants: {
      type: Number,
      default: 0
    },
    averageDuration: Number, // average participant duration in minutes
    totalDuration: Number // total session duration in minutes
  },
  status: {
    type: String,
    enum: ['initializing', 'active', 'ended'],
    default: 'initializing'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  errors: [{
    timestamp: Date,
    userId: mongoose.Schema.Types.ObjectId,
    errorType: String,
    errorMessage: String,
    details: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
videoSessionSchema.index({ studyRoom: 1, status: 1 });
videoSessionSchema.index({ 'participants.user': 1 });
videoSessionSchema.index({ startedAt: -1 });

// Virtual for active participants
videoSessionSchema.virtual('activeParticipants').get(function() {
  return this.participants.filter(p => !p.leftAt).length;
});

// Virtual for session duration
videoSessionSchema.virtual('sessionDuration').get(function() {
  if (this.endedAt) {
    return Math.floor((this.endedAt - this.startedAt) / (1000 * 60));
  }
  return Math.floor((new Date() - this.startedAt) / (1000 * 60));
});

// Instance method to add participant
videoSessionSchema.methods.addParticipant = function(userId, peerId) {
  const existingParticipant = this.participants.find(p => 
    p.user.toString() === userId.toString() && !p.leftAt
  );
  
  if (!existingParticipant) {
    this.participants.push({
      user: userId,
      peerId: peerId,
      joinedAt: new Date()
    });
    
    this.stats.totalParticipants = Math.max(
      this.stats.totalParticipants,
      this.participants.length
    );
    
    this.stats.peakParticipants = Math.max(
      this.stats.peakParticipants,
      this.activeParticipants
    );
  }
  
  return this.save();
};

// Instance method to remove participant
videoSessionSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString() && !p.leftAt
  );
  
  if (participant) {
    participant.leftAt = new Date();
  }
  
  return this.save();
};

// Instance method to update participant stream
videoSessionSchema.methods.updateParticipantStream = function(userId, updates) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString() && !p.leftAt
  );
  
  if (participant) {
    if (updates.audioEnabled !== undefined) {
      participant.audioEnabled = updates.audioEnabled;
    }
    if (updates.videoEnabled !== undefined) {
      participant.videoEnabled = updates.videoEnabled;
    }
    if (updates.screenShareEnabled !== undefined) {
      participant.screenShareEnabled = updates.screenShareEnabled;
      participant.streamType = updates.screenShareEnabled ? 'both' : 'camera';
    }
    if (updates.connectionQuality !== undefined) {
      participant.connectionQuality = updates.connectionQuality;
    }
    if (updates.networkStats !== undefined) {
      participant.networkStats = updates.networkStats;
    }
  }
  
  return this.save();
};

// Instance method to end session
videoSessionSchema.methods.endSession = function() {
  this.status = 'ended';
  this.endedAt = new Date();
  
  // Mark all active participants as left
  this.participants.forEach(p => {
    if (!p.leftAt) {
      p.leftAt = new Date();
    }
  });
  
  // Calculate average duration
  const participantDurations = this.participants.map(p => {
    const left = p.leftAt || new Date();
    return (left - p.joinedAt) / (1000 * 60);
  });
  
  this.stats.averageDuration = participantDurations.length > 0
    ? participantDurations.reduce((a, b) => a + b, 0) / participantDurations.length
    : 0;
  
  this.stats.totalDuration = this.sessionDuration;
  
  return this.save();
};

// Instance method to log error
videoSessionSchema.methods.logError = function(userId, errorType, errorMessage, details = {}) {
  this.errors.push({
    timestamp: new Date(),
    userId,
    errorType,
    errorMessage,
    details
  });
  
  return this.save();
};

// Static method to get active session for study room
videoSessionSchema.statics.getActiveSession = function(studyRoomId) {
  return this.findOne({
    studyRoom: studyRoomId,
    status: { $in: ['initializing', 'active'] }
  })
  .populate('participants.user', 'name profilePicture email')
  .populate('studyRoom', 'name subject');
};

// Static method to get user's session history
videoSessionSchema.statics.getUserSessionHistory = function(userId, limit = 20) {
  return this.find({
    'participants.user': userId,
    status: 'ended'
  })
  .populate('studyRoom', 'name subject')
  .sort({ startedAt: -1 })
  .limit(limit);
};

module.exports = mongoose.model('VideoSession', videoSessionSchema);
