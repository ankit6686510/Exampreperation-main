const mongoose = require('mongoose');

const studyRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Study room name is required'],
    trim: true,
    maxLength: [100, 'Study room name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxLength: [500, 'Description cannot exceed 500 characters'],
    trim: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledTime: {
    startTime: {
      type: Date,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required']
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  topics: [{
    type: String,
    trim: true
  }],
  roomSettings: {
    maxParticipants: {
      type: Number,
      default: 10,
      min: 2,
      max: 50
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    allowLateJoin: {
      type: Boolean,
      default: true
    },
    enablePomodoro: {
      type: Boolean,
      default: true
    },
    pomodoroSettings: {
      workDuration: {
        type: Number,
        default: 25 // minutes
      },
      shortBreak: {
        type: Number,
        default: 5 // minutes
      },
      longBreak: {
        type: Number,
        default: 15 // minutes
      },
      cyclesBeforeLongBreak: {
        type: Number,
        default: 4
      }
    }
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'joined', 'left', 'removed'],
      default: 'registered'
    },
    role: {
      type: String,
      enum: ['host', 'co-host', 'participant'],
      default: 'participant'
    },
    studyTime: {
      type: Number,
      default: 0 // minutes of active study time
    },
    breakTime: {
      type: Number,
      default: 0 // minutes of break time
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }],
  sessionStatus: {
    type: String,
    enum: ['scheduled', 'active', 'paused', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  actualTimes: {
    actualStartTime: Date,
    actualEndTime: Date
  },
  pomodoroState: {
    currentCycle: {
      type: Number,
      default: 0
    },
    currentPhase: {
      type: String,
      enum: ['work', 'short-break', 'long-break', 'stopped'],
      default: 'stopped'
    },
    phaseStartTime: Date,
    phaseEndTime: Date,
    totalCycles: {
      type: Number,
      default: 0
    }
  },
  stats: {
    totalParticipants: {
      type: Number,
      default: 0
    },
    averageAttendance: {
      type: Number,
      default: 0
    },
    totalStudyTime: {
      type: Number,
      default: 0 // total minutes studied by all participants
    },
    averageSessionRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },
  sessionNotes: {
    type: String,
    maxLength: [2000, 'Session notes cannot exceed 2000 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringSettings: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    daysOfWeek: [Number], // 0-6, where 0 is Sunday
    endDate: Date,
    maxOccurrences: Number
  },
  feedback: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      maxLength: [500, 'Feedback comment cannot exceed 500 characters']
    },
    categories: {
      organization: Number,
      content: Number,
      interaction: Number,
      helpfulness: Number
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
studyRoomSchema.index({ group: 1, scheduledTime: 1 });
studyRoomSchema.index({ host: 1, sessionStatus: 1 });
studyRoomSchema.index({ 'participants.user': 1 });
studyRoomSchema.index({ subject: 1 });
studyRoomSchema.index({ 'scheduledTime.startTime': 1 });
studyRoomSchema.index({ sessionStatus: 1, isActive: 1 });

// Virtual for session duration
studyRoomSchema.virtual('sessionDuration').get(function() {
  if (this.actualTimes.actualStartTime && this.actualTimes.actualEndTime) {
    return Math.floor((this.actualTimes.actualEndTime - this.actualTimes.actualStartTime) / (1000 * 60));
  }
  return Math.floor((this.scheduledTime.endTime - this.scheduledTime.startTime) / (1000 * 60));
});

// Virtual for current participant count
studyRoomSchema.virtual('currentParticipantCount').get(function() {
  return this.participants.filter(p => p.status === 'joined').length;
});

// Pre-save middleware to update stats
studyRoomSchema.pre('save', function(next) {
  // Update total participants
  this.stats.totalParticipants = this.participants.length;
  
  // Calculate average rating if feedback exists
  if (this.feedback.length > 0) {
    const totalRating = this.feedback.reduce((sum, fb) => sum + fb.rating, 0);
    this.stats.averageSessionRating = Math.round((totalRating / this.feedback.length) * 100) / 100;
  }
  
  next();
});

// Instance method to add participant
studyRoomSchema.methods.addParticipant = function(userId, role = 'participant') {
  const existingParticipant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  if (!existingParticipant) {
    this.participants.push({
      user: userId,
      role: role,
      status: 'registered',
      joinedAt: new Date(),
      lastActivity: new Date()
    });
  } else {
    existingParticipant.status = 'registered';
    existingParticipant.lastActivity = new Date();
  }
  
  return this.save();
};

// Instance method to join session
studyRoomSchema.methods.joinSession = function(userId) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.status = 'joined';
    participant.lastActivity = new Date();
    
    // Start session if this is the first participant and session is scheduled
    if (this.sessionStatus === 'scheduled' && this.currentParticipantCount === 1) {
      this.sessionStatus = 'active';
      this.actualTimes.actualStartTime = new Date();
    }
  }
  
  return this.save();
};

// Instance method to leave session
studyRoomSchema.methods.leaveSession = function(userId) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.status = 'left';
    participant.lastActivity = new Date();
  }
  
  return this.save();
};

// Instance method to start pomodoro timer
studyRoomSchema.methods.startPomodoro = function() {
  if (!this.roomSettings.enablePomodoro) return this;
  
  const now = new Date();
  const workDuration = this.roomSettings.pomodoroSettings.workDuration * 60 * 1000; // convert to milliseconds
  
  this.pomodoroState.currentPhase = 'work';
  this.pomodoroState.phaseStartTime = now;
  this.pomodoroState.phaseEndTime = new Date(now.getTime() + workDuration);
  this.pomodoroState.currentCycle += 1;
  
  return this.save();
};

// Instance method to handle pomodoro phase transition
studyRoomSchema.methods.nextPomodoroPhase = function() {
  if (!this.roomSettings.enablePomodoro) return this;
  
  const now = new Date();
  const { workDuration, shortBreak, longBreak, cyclesBeforeLongBreak } = this.roomSettings.pomodoroSettings;
  let nextPhaseDuration;
  let nextPhase;
  
  if (this.pomodoroState.currentPhase === 'work') {
    // Transition to break
    const isLongBreak = this.pomodoroState.currentCycle % cyclesBeforeLongBreak === 0;
    nextPhase = isLongBreak ? 'long-break' : 'short-break';
    nextPhaseDuration = (isLongBreak ? longBreak : shortBreak) * 60 * 1000;
    
    if (this.pomodoroState.currentCycle % cyclesBeforeLongBreak === 0) {
      this.pomodoroState.totalCycles += 1;
    }
  } else {
    // Transition back to work
    nextPhase = 'work';
    nextPhaseDuration = workDuration * 60 * 1000;
  }
  
  this.pomodoroState.currentPhase = nextPhase;
  this.pomodoroState.phaseStartTime = now;
  this.pomodoroState.phaseEndTime = new Date(now.getTime() + nextPhaseDuration);
  
  return this.save();
};

// Instance method to end session
studyRoomSchema.methods.endSession = function() {
  this.sessionStatus = 'completed';
  this.actualTimes.actualEndTime = new Date();
  this.pomodoroState.currentPhase = 'stopped';
  
  // Calculate total study time
  this.stats.totalStudyTime = this.participants.reduce((total, p) => total + p.studyTime, 0);
  
  return this.save();
};

// Static method to find upcoming sessions
studyRoomSchema.statics.findUpcomingSessions = function(groupId, limit = 10) {
  const now = new Date();
  return this.find({
    group: groupId,
    'scheduledTime.startTime': { $gte: now },
    sessionStatus: 'scheduled',
    isActive: true
  })
  .populate('host', 'name profilePicture')
  .populate('participants.user', 'name profilePicture')
  .sort({ 'scheduledTime.startTime': 1 })
  .limit(limit);
};

// Static method to find active sessions
studyRoomSchema.statics.findActiveSessions = function(groupId) {
  return this.find({
    group: groupId,
    sessionStatus: 'active',
    isActive: true
  })
  .populate('host', 'name profilePicture')
  .populate('participants.user', 'name profilePicture')
  .sort({ 'actualTimes.actualStartTime': -1 });
};

// Static method to get user's session history
studyRoomSchema.statics.getUserSessionHistory = function(userId, limit = 20) {
  return this.find({
    'participants.user': userId,
    sessionStatus: { $in: ['completed', 'cancelled'] }
  })
  .populate('group', 'name')
  .populate('host', 'name')
  .sort({ 'scheduledTime.startTime': -1 })
  .limit(limit);
};

module.exports = mongoose.model('StudyRoom', studyRoomSchema);
