const mongoose = require('mongoose');

const groupChallengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Challenge title is required'],
    trim: true,
    maxLength: [200, 'Challenge title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxLength: [1000, 'Description cannot exceed 1000 characters'],
    trim: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  challengeType: {
    type: String,
    enum: [
      'study_hours', 
      'daily_streak', 
      'goals_completed', 
      'resources_shared', 
      'sessions_attended',
      'subject_mastery',
      'consistency',
      'peer_help',
      'custom'
    ],
    required: true
  },
  challengeMode: {
    type: String,
    enum: ['individual', 'team', 'group_vs_group'],
    default: 'individual'
  },
  duration: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  targetMetrics: {
    // For study_hours challenge
    targetStudyHours: {
      type: Number,
      min: 0
    },
    
    // For daily_streak challenge
    targetStreakDays: {
      type: Number,
      min: 1
    },
    
    // For goals_completed challenge
    targetGoalsCount: {
      type: Number,
      min: 1
    },
    
    // For subject_mastery challenge
    targetSubjects: [{
      type: String,
      trim: true
    }],
    targetCompletionPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    
    // For sessions_attended challenge
    targetSessionsCount: {
      type: Number,
      min: 1
    },
    
    // For resources_shared challenge
    targetResourcesCount: {
      type: Number,
      min: 1
    },
    
    // For peer_help challenge
    targetHelpActions: {
      type: Number,
      min: 1
    },
    
    // For custom challenges
    customMetric: {
      name: String,
      unit: String,
      targetValue: Number
    }
  },
  rules: {
    type: String,
    maxLength: [2000, 'Rules cannot exceed 2000 characters']
  },
  rewards: {
    points: {
      type: Number,
      default: 0
    },
    badges: [{
      name: String,
      icon: String,
      description: String
    }],
    customRewards: [{
      type: String,
      maxLength: [200, 'Custom reward cannot exceed 200 characters']
    }]
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
      enum: ['registered', 'active', 'completed', 'withdrawn'],
      default: 'registered'
    },
    progress: {
      currentValue: {
        type: Number,
        default: 0
      },
      milestones: [{
        value: Number,
        achievedAt: Date,
        isCompleted: {
          type: Boolean,
          default: false
        }
      }],
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    },
    rank: {
      type: Number,
      default: 0
    },
    completedAt: Date,
    
    // For team challenges
    team: {
      name: String,
      members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }
  }],
  challengeStatus: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  settings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    allowLateJoin: {
      type: Boolean,
      default: false
    },
    maxParticipants: {
      type: Number,
      default: 100,
      min: 2
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    autoStart: {
      type: Boolean,
      default: true
    },
    showLeaderboard: {
      type: Boolean,
      default: true
    },
    allowTeams: {
      type: Boolean,
      default: false
    },
    teamSize: {
      type: Number,
      default: 2,
      min: 2,
      max: 10
    }
  },
  leaderboard: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    value: {
      type: Number,
      default: 0
    },
    rank: {
      type: Number,
      default: 0
    },
    isWinner: {
      type: Boolean,
      default: false
    },
    achievedAt: Date
  }],
  milestones: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    targetValue: {
      type: Number,
      required: true
    },
    reward: {
      points: Number,
      badge: String,
      description: String
    },
    achievers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      achievedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  stats: {
    totalParticipants: {
      type: Number,
      default: 0
    },
    activeParticipants: {
      type: Number,
      default: 0
    },
    completedParticipants: {
      type: Number,
      default: 0
    },
    averageProgress: {
      type: Number,
      default: 0
    },
    topScore: {
      type: Number,
      default: 0
    },
    engagementRate: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
groupChallengeSchema.index({ group: 1, challengeStatus: 1 });
groupChallengeSchema.index({ createdBy: 1, challengeStatus: 1 });
groupChallengeSchema.index({ challengeType: 1, challengeStatus: 1 });
groupChallengeSchema.index({ 'duration.startDate': 1, 'duration.endDate': 1 });
groupChallengeSchema.index({ 'participants.user': 1 });
groupChallengeSchema.index({ challengeStatus: 1, isActive: 1 });

// Virtual for challenge duration in days
groupChallengeSchema.virtual('durationDays').get(function() {
  const diffTime = this.duration.endDate - this.duration.startDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for time remaining
groupChallengeSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  if (now > this.duration.endDate) return 0;
  return Math.max(0, this.duration.endDate - now);
});

// Virtual for progress percentage
groupChallengeSchema.virtual('overallProgress').get(function() {
  if (this.participants.length === 0) return 0;
  
  const totalProgress = this.participants.reduce((sum, participant) => {
    const targetValue = this.getTargetValueForType();
    if (targetValue === 0) return sum;
    return sum + Math.min(100, (participant.progress.currentValue / targetValue) * 100);
  }, 0);
  
  return Math.round(totalProgress / this.participants.length);
});

// Pre-save middleware to update stats
groupChallengeSchema.pre('save', function(next) {
  // Update participant counts
  this.stats.totalParticipants = this.participants.length;
  this.stats.activeParticipants = this.participants.filter(p => p.status === 'active').length;
  this.stats.completedParticipants = this.participants.filter(p => p.status === 'completed').length;
  
  // Calculate average progress
  if (this.participants.length > 0) {
    const totalProgress = this.participants.reduce((sum, p) => sum + p.progress.currentValue, 0);
    this.stats.averageProgress = Math.round((totalProgress / this.participants.length) * 100) / 100;
  }
  
  // Update top score
  if (this.participants.length > 0) {
    this.stats.topScore = Math.max(...this.participants.map(p => p.progress.currentValue));
  }
  
  // Calculate engagement rate (active participants / total participants)
  this.stats.engagementRate = this.stats.totalParticipants > 0 
    ? Math.round((this.stats.activeParticipants / this.stats.totalParticipants) * 100) 
    : 0;
  
  next();
});

// Instance method to get target value based on challenge type
groupChallengeSchema.methods.getTargetValueForType = function() {
  switch (this.challengeType) {
    case 'study_hours':
      return this.targetMetrics.targetStudyHours || 0;
    case 'daily_streak':
      return this.targetMetrics.targetStreakDays || 0;
    case 'goals_completed':
      return this.targetMetrics.targetGoalsCount || 0;
    case 'sessions_attended':
      return this.targetMetrics.targetSessionsCount || 0;
    case 'resources_shared':
      return this.targetMetrics.targetResourcesCount || 0;
    case 'peer_help':
      return this.targetMetrics.targetHelpActions || 0;
    case 'subject_mastery':
      return this.targetMetrics.targetCompletionPercentage || 100;
    case 'custom':
      return this.targetMetrics.customMetric?.targetValue || 0;
    default:
      return 0;
  }
};

// Instance method to join challenge
groupChallengeSchema.methods.joinChallenge = function(userId, teamInfo = null) {
  // Check if user is already a participant
  const existingParticipant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  if (existingParticipant && existingParticipant.status !== 'withdrawn') {
    throw new Error('User is already participating in this challenge');
  }
  
  // Check capacity
  if (this.participants.filter(p => p.status !== 'withdrawn').length >= this.settings.maxParticipants) {
    throw new Error('Challenge is at maximum capacity');
  }
  
  // Check if late join is allowed
  const now = new Date();
  if (now > this.duration.startDate && !this.settings.allowLateJoin) {
    throw new Error('Late joining is not allowed for this challenge');
  }
  
  const participantData = {
    user: userId,
    joinedAt: new Date(),
    status: this.challengeStatus === 'active' ? 'active' : 'registered',
    progress: {
      currentValue: 0,
      milestones: [],
      lastUpdated: new Date()
    }
  };
  
  // Add team info if this is a team challenge
  if (this.settings.allowTeams && teamInfo) {
    participantData.team = teamInfo;
  }
  
  if (existingParticipant) {
    // Reactivate withdrawn participant
    Object.assign(existingParticipant, participantData);
  } else {
    this.participants.push(participantData);
  }
  
  return this.save();
};

// Instance method to update participant progress
groupChallengeSchema.methods.updateProgress = function(userId, newValue, milestone = null) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString() && p.status === 'active'
  );
  
  if (!participant) {
    throw new Error('User is not an active participant in this challenge');
  }
  
  participant.progress.currentValue = newValue;
  participant.progress.lastUpdated = new Date();
  
  // Add milestone if provided
  if (milestone) {
    participant.progress.milestones.push({
      value: milestone.value,
      achievedAt: new Date(),
      isCompleted: true
    });
  }
  
  // Check if challenge is completed
  const targetValue = this.getTargetValueForType();
  if (targetValue > 0 && newValue >= targetValue) {
    participant.status = 'completed';
    participant.completedAt = new Date();
  }
  
  // Update leaderboard
  this.updateLeaderboard();
  
  return this.save();
};

// Instance method to update leaderboard
groupChallengeSchema.methods.updateLeaderboard = function() {
  // Sort participants by progress value
  const sortedParticipants = this.participants
    .filter(p => p.status === 'active' || p.status === 'completed')
    .sort((a, b) => b.progress.currentValue - a.progress.currentValue);
  
  // Update leaderboard
  this.leaderboard = sortedParticipants.map((participant, index) => ({
    user: participant.user,
    value: participant.progress.currentValue,
    rank: index + 1,
    isWinner: index === 0 && participant.status === 'completed',
    achievedAt: participant.completedAt || participant.progress.lastUpdated
  }));
  
  // Update participant ranks
  sortedParticipants.forEach((participant, index) => {
    participant.rank = index + 1;
  });
};

// Instance method to start challenge
groupChallengeSchema.methods.startChallenge = function() {
  if (this.challengeStatus !== 'draft') {
    throw new Error('Challenge can only be started from draft status');
  }
  
  this.challengeStatus = 'active';
  
  // Set all registered participants to active
  this.participants.forEach(participant => {
    if (participant.status === 'registered') {
      participant.status = 'active';
    }
  });
  
  return this.save();
};

// Instance method to end challenge
groupChallengeSchema.methods.endChallenge = function() {
  if (this.challengeStatus !== 'active') {
    throw new Error('Only active challenges can be ended');
  }
  
  this.challengeStatus = 'completed';
  this.updateLeaderboard();
  
  // Mark winners
  const winners = this.leaderboard.filter(entry => entry.isWinner);
  winners.forEach(winner => {
    const participant = this.participants.find(p => 
      p.user.toString() === winner.user.toString()
    );
    if (participant && participant.status === 'active') {
      participant.status = 'completed';
      participant.completedAt = new Date();
    }
  });
  
  return this.save();
};

// Static method to find active challenges for a group
groupChallengeSchema.statics.findActiveGroupChallenges = function(groupId) {
  return this.find({
    group: groupId,
    challengeStatus: 'active',
    isActive: true
  })
  .populate('createdBy', 'name profilePicture')
  .populate('participants.user', 'name profilePicture')
  .sort({ 'duration.endDate': 1 });
};

// Static method to find user's challenges
groupChallengeSchema.statics.findUserChallenges = function(userId, status = 'all') {
  let query = {
    'participants.user': userId,
    isActive: true
  };
  
  if (status !== 'all') {
    query.challengeStatus = status;
  }
  
  return this.find(query)
    .populate('group', 'name')
    .populate('createdBy', 'name profilePicture')
    .sort({ 'duration.endDate': 1 });
};

// Static method to auto-end expired challenges
groupChallengeSchema.statics.autoEndExpiredChallenges = async function() {
  const now = new Date();
  const expiredChallenges = await this.find({
    challengeStatus: 'active',
    'duration.endDate': { $lt: now },
    isActive: true
  });
  
  for (const challenge of expiredChallenges) {
    await challenge.endChallenge();
  }
  
  return expiredChallenges.length;
};

module.exports = mongoose.model('GroupChallenge', groupChallengeSchema);
