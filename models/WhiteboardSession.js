const mongoose = require('mongoose');

const whiteboardSessionSchema = new mongoose.Schema({
  studyRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyRoom',
    required: true
  },
  yDocState: {
    type: Buffer,
    required: true
  },
  contributors: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    cursorPosition: {
      x: Number,
      y: Number
    },
    elementCount: {
      type: Number,
      default: 0
    }
  }],
  snapshots: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    state: Buffer,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    label: String,
    description: String
  }],
  settings: {
    autoSaveInterval: {
      type: Number,
      default: 30000 // 30 seconds in milliseconds
    },
    maxSnapshots: {
      type: Number,
      default: 50
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    allowAnonymous: {
      type: Boolean,
      default: false
    }
  },
  stats: {
    totalElements: {
      type: Number,
      default: 0
    },
    totalEdits: {
      type: Number,
      default: 0
    },
    totalContributors: {
      type: Number,
      default: 0
    },
    lastEditAt: Date
  },
  metadata: {
    title: String,
    description: String,
    tags: [String],
    exportFormats: [{
      format: {
        type: String,
        enum: ['png', 'svg', 'json']
      },
      url: String,
      createdAt: Date
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
whiteboardSessionSchema.index({ studyRoom: 1, isActive: 1 });
whiteboardSessionSchema.index({ 'contributors.user': 1 });
whiteboardSessionSchema.index({ startedAt: -1 });

// Virtual for active contributors
whiteboardSessionSchema.virtual('activeContributors').get(function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.contributors.filter(c => c.lastActivity > fiveMinutesAgo).length;
});

// Virtual for session duration
whiteboardSessionSchema.virtual('sessionDuration').get(function() {
  const end = this.endedAt || new Date();
  return Math.floor((end - this.startedAt) / (1000 * 60));
});

// Instance method to add contributor
whiteboardSessionSchema.methods.addContributor = function(userId) {
  const existingContributor = this.contributors.find(c => 
    c.user.toString() === userId.toString()
  );
  
  if (!existingContributor) {
    this.contributors.push({
      user: userId,
      joinedAt: new Date(),
      lastActivity: new Date()
    });
    
    this.stats.totalContributors = this.contributors.length;
  } else {
    existingContributor.lastActivity = new Date();
  }
  
  return this.save();
};

// Instance method to update contributor cursor
whiteboardSessionSchema.methods.updateContributorCursor = function(userId, x, y) {
  const contributor = this.contributors.find(c => 
    c.user.toString() === userId.toString()
  );
  
  if (contributor) {
    contributor.cursorPosition = { x, y };
    contributor.lastActivity = new Date();
  }
  
  return this.save();
};

// Instance method to update Y.js document state
whiteboardSessionSchema.methods.updateYDocState = function(stateBuffer) {
  this.yDocState = stateBuffer;
  this.stats.totalEdits += 1;
  this.stats.lastEditAt = new Date();
  
  return this.save();
};

// Instance method to create snapshot
whiteboardSessionSchema.methods.createSnapshot = function(userId, label = '', description = '') {
  // Remove oldest snapshot if max limit reached
  if (this.snapshots.length >= this.settings.maxSnapshots) {
    this.snapshots.shift();
  }
  
  this.snapshots.push({
    timestamp: new Date(),
    state: Buffer.from(this.yDocState),
    createdBy: userId,
    label,
    description
  });
  
  return this.save();
};

// Instance method to restore from snapshot
whiteboardSessionSchema.methods.restoreFromSnapshot = function(snapshotIndex) {
  if (snapshotIndex >= 0 && snapshotIndex < this.snapshots.length) {
    const snapshot = this.snapshots[snapshotIndex];
    this.yDocState = Buffer.from(snapshot.state);
    this.stats.lastEditAt = new Date();
    
    return this.save();
  }
  
  throw new Error('Invalid snapshot index');
};

// Instance method to add export
whiteboardSessionSchema.methods.addExport = function(format, url) {
  if (!this.metadata.exportFormats) {
    this.metadata.exportFormats = [];
  }
  
  this.metadata.exportFormats.push({
    format,
    url,
    createdAt: new Date()
  });
  
  return this.save();
};

// Instance method to end session
whiteboardSessionSchema.methods.endSession = function() {
  this.isActive = false;
  this.endedAt = new Date();
  
  // Create final snapshot
  this.snapshots.push({
    timestamp: new Date(),
    state: Buffer.from(this.yDocState),
    label: 'Final State',
    description: 'Automatic snapshot when session ended'
  });
  
  return this.save();
};

// Instance method to update element count for contributor
whiteboardSessionSchema.methods.updateContributorElementCount = function(userId, count) {
  const contributor = this.contributors.find(c => 
    c.user.toString() === userId.toString()
  );
  
  if (contributor) {
    contributor.elementCount = count;
    contributor.lastActivity = new Date();
  }
  
  this.stats.totalElements = this.contributors.reduce((sum, c) => sum + (c.elementCount || 0), 0);
  
  return this.save();
};

// Static method to get active session for study room
whiteboardSessionSchema.statics.getActiveSession = function(studyRoomId) {
  return this.findOne({
    studyRoom: studyRoomId,
    isActive: true
  })
  .populate('contributors.user', 'name profilePicture')
  .populate('snapshots.createdBy', 'name')
  .populate('studyRoom', 'name subject');
};

// Static method to get session history
whiteboardSessionSchema.statics.getSessionHistory = function(studyRoomId, limit = 10) {
  return this.find({
    studyRoom: studyRoomId,
    isActive: false
  })
  .populate('studyRoom', 'name subject')
  .populate('contributors.user', 'name profilePicture')
  .sort({ startedAt: -1 })
  .limit(limit);
};

// Static method to get user's whiteboard sessions
whiteboardSessionSchema.statics.getUserSessions = function(userId, limit = 20) {
  return this.find({
    'contributors.user': userId
  })
  .populate('studyRoom', 'name subject')
  .sort({ startedAt: -1 })
  .limit(limit);
};

// Pre-save middleware to manage snapshots
whiteboardSessionSchema.pre('save', function(next) {
  // Keep only the max number of snapshots
  if (this.snapshots.length > this.settings.maxSnapshots) {
    this.snapshots = this.snapshots.slice(-this.settings.maxSnapshots);
  }
  
  next();
});

module.exports = mongoose.model('WhiteboardSession', whiteboardSessionSchema);
