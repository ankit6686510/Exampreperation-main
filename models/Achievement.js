const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Achievement name is required'],
    trim: true,
    maxLength: [100, 'Achievement name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Achievement description is required'],
    maxLength: [500, 'Description cannot exceed 500 characters'],
    trim: true
  },
  category: {
    type: String,
    enum: [
      'study_time',
      'consistency',
      'collaboration',
      'knowledge',
      'social',
      'milestone',
      'challenge',
      'special'
    ],
    required: true
  },
  type: {
    type: String,
    enum: ['badge', 'title', 'reward', 'points'],
    default: 'badge'
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  icon: {
    type: String,
    required: [true, 'Achievement icon is required']
  },
  color: {
    type: String,
    default: '#4F46E5'
  },
  criteria: {
    triggerType: {
      type: String,
      enum: [
        'study_hours_total',
        'study_hours_daily',
        'study_streak',
        'goals_completed',
        'sessions_attended',
        'resources_shared',
        'help_provided',
        'challenges_won',
        'group_contributions',
        'subject_mastery',
        'custom'
      ],
      required: true
    },
    targetValue: {
      type: Number,
      required: true,
      min: 1
    },
    timeframe: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'all-time'],
      default: 'all-time'
    },
    conditions: {
      subjects: [String],
      challengeTypes: [String],
      groupTypes: [String],
      minimumDuration: Number, // in minutes
      consecutiveDays: Number,
      additionalCriteria: mongoose.Schema.Types.Mixed
    }
  },
  rewards: {
    points: {
      type: Number,
      default: 0
    },
    title: String,
    badge: {
      name: String,
      icon: String,
      color: String
    },
    unlocks: [{
      type: String,
      description: String
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isGlobal: {
    type: Boolean,
    default: true // If false, it's group-specific
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  stats: {
    totalEarned: {
      type: Number,
      default: 0
    },
    firstEarnedBy: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      earnedAt: Date
    },
    recentEarners: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      earnedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true
});

// Separate schema for user achievements
const userAchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup'
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    currentValue: {
      type: Number,
      default: 0
    },
    targetValue: {
      type: Number,
      required: true
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  },
  context: {
    triggerEvent: String,
    relatedData: mongoose.Schema.Types.Mixed,
    sourceActivity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupActivity'
    }
  },
  visibility: {
    type: String,
    enum: ['public', 'group', 'private'],
    default: 'public'
  },
  isDisplayed: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
achievementSchema.index({ category: 1, isActive: 1 });
achievementSchema.index({ 'criteria.triggerType': 1 });
achievementSchema.index({ group: 1, isActive: 1 });
achievementSchema.index({ isGlobal: 1, isActive: 1 });

userAchievementSchema.index({ user: 1, earnedAt: -1 });
userAchievementSchema.index({ achievement: 1, earnedAt: -1 });
userAchievementSchema.index({ user: 1, group: 1 });
userAchievementSchema.index({ user: 1, 'progress.isCompleted': 1 });

// Virtual for achievement rarity points
achievementSchema.virtual('rarityPoints').get(function() {
  const rarityMultipliers = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 5,
    legendary: 10
  };
  return (this.rewards.points || 0) * (rarityMultipliers[this.rarity] || 1);
});

// Virtual for completion percentage
userAchievementSchema.virtual('progressPercentage').get(function() {
  if (this.progress.targetValue === 0) return 0;
  return Math.min(100, Math.round((this.progress.currentValue / this.progress.targetValue) * 100));
});

// Pre-save middleware for achievements
achievementSchema.pre('save', function(next) {
  // Ensure group-specific achievements have a group reference
  if (!this.isGlobal && !this.group) {
    return next(new Error('Group-specific achievements must have a group reference'));
  }
  next();
});

// Pre-save middleware for user achievements
userAchievementSchema.pre('save', function(next) {
  // Auto-complete if target reached
  if (this.progress.currentValue >= this.progress.targetValue && !this.progress.isCompleted) {
    this.progress.isCompleted = true;
    this.progress.completedAt = new Date();
  }
  next();
});

// Instance method to check if user meets criteria
achievementSchema.methods.checkUserProgress = async function(userId, groupId = null) {
  const StudySession = mongoose.model('StudySession');
  const User = mongoose.model('User');
  const GroupChallenge = mongoose.model('GroupChallenge');
  const SharedResource = mongoose.model('SharedResource');
  
  let currentValue = 0;
  const now = new Date();
  
  // Calculate date range based on timeframe
  let startDate;
  switch (this.criteria.timeframe) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      const weekStart = now.getDate() - now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), weekStart);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date('2020-01-01');
  }
  
  // Check progress based on trigger type
  switch (this.criteria.triggerType) {
    case 'study_hours_total':
    case 'study_hours_daily':
      const sessions = await StudySession.find({
        user: userId,
        startTime: { $gte: startDate },
        ...(this.criteria.conditions.subjects?.length && { 
          subject: { $in: this.criteria.conditions.subjects } 
        })
      });
      currentValue = sessions.reduce((total, session) => total + (session.duration / 60), 0);
      break;
      
    case 'study_streak':
      const user = await User.findById(userId);
      currentValue = user?.progressStats?.currentStreak || 0;
      break;
      
    case 'goals_completed':
      const userGoals = await User.findById(userId);
      currentValue = userGoals?.progressStats?.totalGoalsCompleted || 0;
      break;
      
    case 'sessions_attended':
      const attendedSessions = await StudySession.countDocuments({
        user: userId,
        startTime: { $gte: startDate }
      });
      currentValue = attendedSessions;
      break;
      
    case 'resources_shared':
      const sharedResources = await SharedResource.countDocuments({
        sharedBy: userId,
        createdAt: { $gte: startDate },
        ...(groupId && { group: groupId })
      });
      currentValue = sharedResources;
      break;
      
    case 'challenges_won':
      const wonChallenges = await GroupChallenge.countDocuments({
        'participants.user': userId,
        'participants.status': 'completed',
        'leaderboard.user': userId,
        'leaderboard.isWinner': true,
        updatedAt: { $gte: startDate }
      });
      currentValue = wonChallenges;
      break;
      
    default:
      currentValue = 0;
  }
  
  return {
    currentValue: Math.round(currentValue * 100) / 100,
    targetValue: this.criteria.targetValue,
    isCompleted: currentValue >= this.criteria.targetValue,
    progressPercentage: Math.min(100, Math.round((currentValue / this.criteria.targetValue) * 100))
  };
};

// Static method to check and award achievements for user
achievementSchema.statics.checkUserAchievements = async function(userId, groupId = null, triggerType = null) {
  const UserAchievement = mongoose.model('UserAchievement');
  
  let query = { isActive: true };
  
  // Filter by group context
  if (groupId) {
    query.$or = [
      { isGlobal: true },
      { group: groupId, isGlobal: false }
    ];
  } else {
    query.isGlobal = true;
  }
  
  // Filter by trigger type if specified
  if (triggerType) {
    query['criteria.triggerType'] = triggerType;
  }
  
  const achievements = await this.find(query);
  const newAchievements = [];
  
  for (const achievement of achievements) {
    // Check if user already has this achievement
    const existingUserAchievement = await UserAchievement.findOne({
      user: userId,
      achievement: achievement._id,
      'progress.isCompleted': true
    });
    
    if (existingUserAchievement) continue;
    
    // Check progress
    const progress = await achievement.checkUserProgress(userId, groupId);
    
    // Find or create user achievement record
    let userAchievement = await UserAchievement.findOne({
      user: userId,
      achievement: achievement._id,
      ...(groupId && { group: groupId })
    });
    
    if (!userAchievement) {
      userAchievement = new UserAchievement({
        user: userId,
        achievement: achievement._id,
        group: groupId,
        progress: {
          currentValue: progress.currentValue,
          targetValue: progress.targetValue,
          isCompleted: progress.isCompleted
        }
      });
    } else {
      userAchievement.progress.currentValue = progress.currentValue;
      if (progress.isCompleted && !userAchievement.progress.isCompleted) {
        userAchievement.progress.isCompleted = true;
        userAchievement.progress.completedAt = new Date();
      }
    }
    
    await userAchievement.save();
    
    // If newly completed, add to results and update achievement stats
    if (progress.isCompleted && !existingUserAchievement) {
      newAchievements.push({
        achievement,
        userAchievement,
        earnedAt: userAchievement.progress.completedAt
      });
      
      // Update achievement stats
      achievement.stats.totalEarned += 1;
      if (!achievement.stats.firstEarnedBy.user) {
        achievement.stats.firstEarnedBy = {
          user: userId,
          earnedAt: new Date()
        };
      }
      
      // Add to recent earners (keep last 10)
      achievement.stats.recentEarners.unshift({
        user: userId,
        earnedAt: new Date()
      });
      achievement.stats.recentEarners = achievement.stats.recentEarners.slice(0, 10);
      
      await achievement.save();
    }
  }
  
  return newAchievements;
};

// Static method to get user's achievements
userAchievementSchema.statics.getUserAchievements = function(userId, options = {}) {
  const {
    completed = null,
    groupId = null,
    category = null,
    limit = 50,
    skip = 0
  } = options;
  
  let query = { user: userId };
  
  if (completed !== null) {
    query['progress.isCompleted'] = completed;
  }
  
  if (groupId) {
    query.group = groupId;
  }
  
  if (category) {
    // We'll need to populate achievement and filter by category
  }
  
  return this.find(query)
    .populate('achievement')
    .populate('group', 'name')
    .sort({ earnedAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get achievement leaderboard
userAchievementSchema.statics.getAchievementLeaderboard = function(achievementId, limit = 10) {
  return this.find({
    achievement: achievementId,
    'progress.isCompleted': true
  })
  .populate('user', 'name profilePicture')
  .sort({ 'progress.completedAt': 1 })
  .limit(limit);
};

// Instance method for user achievement - mark as displayed
userAchievementSchema.methods.markAsDisplayed = function() {
  this.isDisplayed = true;
  return this.save();
};

const Achievement = mongoose.model('Achievement', achievementSchema);
const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);

module.exports = {
  Achievement,
  UserAchievement
};
