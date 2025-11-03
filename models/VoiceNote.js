const mongoose = require('mongoose');

const voiceNoteSchema = new mongoose.Schema({
  studyRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyRoom',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  audioUrl: {
    type: String,
    required: true
  },
  cloudinaryPublicId: String,
  duration: {
    type: Number, // in seconds
    required: true
  },
  fileSize: {
    type: Number, // in bytes
    required: true
  },
  format: {
    type: String,
    enum: ['webm', 'mp3', 'wav', 'ogg'],
    default: 'webm'
  },
  waveformData: {
    type: [Number],
    default: []
  },
  transcript: {
    text: String,
    language: String,
    confidence: Number,
    generatedAt: Date
  },
  metadata: {
    title: {
      type: String,
      trim: true,
      maxLength: 200
    },
    description: {
      type: String,
      trim: true,
      maxLength: 1000
    },
    tags: [{
      type: String,
      trim: true
    }],
    relatedTopics: [{
      type: String,
      trim: true
    }],
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  playbackStats: {
    totalPlays: {
      type: Number,
      default: 0
    },
    uniqueListeners: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    averageCompletionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastPlayedAt: Date
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['helpful', 'like', 'insightful', 'confused'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxLength: 500
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    timestampInAudio: Number // specific point in audio where comment applies
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  recordingSettings: {
    sampleRate: Number,
    bitRate: Number,
    channels: Number
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
voiceNoteSchema.index({ studyRoom: 1, createdAt: -1 });
voiceNoteSchema.index({ creator: 1, createdAt: -1 });
voiceNoteSchema.index({ 'metadata.tags': 1 });
voiceNoteSchema.index({ isPinned: -1, createdAt: -1 });

// Virtual for formatted duration
voiceNoteSchema.virtual('formattedDuration').get(function() {
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for formatted file size
voiceNoteSchema.virtual('formattedFileSize').get(function() {
  const mb = this.fileSize / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }
  const kb = this.fileSize / 1024;
  return `${kb.toFixed(2)} KB`;
});

// Virtual for reaction counts
voiceNoteSchema.virtual('reactionCounts').get(function() {
  const counts = {
    helpful: 0,
    like: 0,
    insightful: 0,
    confused: 0
  };
  
  this.reactions.forEach(reaction => {
    if (counts.hasOwnProperty(reaction.type)) {
      counts[reaction.type]++;
    }
  });
  
  return counts;
});

// Instance method to track play
voiceNoteSchema.methods.trackPlay = function(userId, completionRate = 0) {
  this.playbackStats.totalPlays += 1;
  this.playbackStats.lastPlayedAt = new Date();
  
  // Add to unique listeners if not already present
  if (!this.playbackStats.uniqueListeners.includes(userId)) {
    this.playbackStats.uniqueListeners.push(userId);
  }
  
  // Update average completion rate
  const currentAvg = this.playbackStats.averageCompletionRate;
  const totalPlays = this.playbackStats.totalPlays;
  this.playbackStats.averageCompletionRate = 
    ((currentAvg * (totalPlays - 1)) + completionRate) / totalPlays;
  
  return this.save();
};

// Instance method to add reaction
voiceNoteSchema.methods.addReaction = function(userId, reactionType) {
  // Remove existing reaction from this user if any
  this.reactions = this.reactions.filter(r => 
    r.user.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    type: reactionType,
    timestamp: new Date()
  });
  
  return this.save();
};

// Instance method to remove reaction
voiceNoteSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => 
    r.user.toString() !== userId.toString()
  );
  
  return this.save();
};

// Instance method to add comment
voiceNoteSchema.methods.addComment = function(userId, text, timestampInAudio = null) {
  this.comments.push({
    user: userId,
    text,
    timestamp: new Date(),
    timestampInAudio
  });
  
  return this.save();
};

// Instance method to delete comment
voiceNoteSchema.methods.deleteComment = function(commentId) {
  this.comments = this.comments.filter(c => 
    c._id.toString() !== commentId.toString()
  );
  
  return this.save();
};

// Instance method to toggle pin
voiceNoteSchema.methods.togglePin = function() {
  this.isPinned = !this.isPinned;
  return this.save();
};

// Instance method to add transcript
voiceNoteSchema.methods.addTranscript = function(text, language = 'en', confidence = 0) {
  this.transcript = {
    text,
    language,
    confidence,
    generatedAt: new Date()
  };
  
  return this.save();
};

// Static method to get voice notes for a study room
voiceNoteSchema.statics.getForStudyRoom = function(studyRoomId, options = {}) {
  const {
    limit = 20,
    skip = 0,
    includeArchived = false,
    sortBy = 'createdAt',
    sortOrder = -1
  } = options;
  
  const query = { 
    studyRoom: studyRoomId,
    isArchived: includeArchived ? { $in: [true, false] } : false
  };
  
  return this.find(query)
    .populate('creator', 'name profilePicture')
    .populate('reactions.user', 'name')
    .populate('comments.user', 'name profilePicture')
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);
};

// Static method to get pinned voice notes
voiceNoteSchema.statics.getPinnedNotes = function(studyRoomId) {
  return this.find({
    studyRoom: studyRoomId,
    isPinned: true,
    isArchived: false
  })
  .populate('creator', 'name profilePicture')
  .sort({ createdAt: -1 });
};

// Static method to get user's voice notes
voiceNoteSchema.statics.getUserVoiceNotes = function(userId, limit = 20) {
  return this.find({
    creator: userId,
    isArchived: false
  })
  .populate('studyRoom', 'name subject')
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to search voice notes
voiceNoteSchema.statics.searchVoiceNotes = function(studyRoomId, searchTerm) {
  return this.find({
    studyRoom: studyRoomId,
    isArchived: false,
    $or: [
      { 'metadata.title': { $regex: searchTerm, $options: 'i' } },
      { 'metadata.description': { $regex: searchTerm, $options: 'i' } },
      { 'metadata.tags': { $regex: searchTerm, $options: 'i' } },
      { 'transcript.text': { $regex: searchTerm, $options: 'i' } }
    ]
  })
  .populate('creator', 'name profilePicture')
  .sort({ createdAt: -1 });
};

// Static method to get popular voice notes
voiceNoteSchema.statics.getPopularNotes = function(studyRoomId, limit = 10) {
  return this.find({
    studyRoom: studyRoomId,
    isArchived: false
  })
  .populate('creator', 'name profilePicture')
  .sort({ 'playbackStats.totalPlays': -1, createdAt: -1 })
  .limit(limit);
};

// Pre-save middleware to generate waveform data if not present
voiceNoteSchema.pre('save', function(next) {
  // If waveform data is empty and duration is set, generate simple placeholder
  if (this.waveformData.length === 0 && this.duration > 0) {
    // Generate 100 random points as placeholder
    this.waveformData = Array.from({ length: 100 }, () => 
      Math.random() * 0.8 + 0.2
    );
  }
  
  next();
});

module.exports = mongoose.model('VoiceNote', voiceNoteSchema);
