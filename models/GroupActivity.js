const mongoose = require('mongoose');

const groupActivitySchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activityType: {
    type: String,
    enum: [
      // Study Activities
      'study_session_completed',
      'daily_goal_completed',
      'book_chapter_completed',
      'book_finished',
      'syllabus_topic_completed',
      'study_streak_achieved',
      
      // Performance Activities
      'mock_test_completed',
      'score_improved',
      'rank_achieved',
      'milestone_reached',
      
      // Group Activities
      'member_joined',
      'member_left',
      'group_challenge_completed',
      'leaderboard_position_changed',
      
      // Achievement Activities
      'badge_earned',
      'level_up',
      'personal_record',
      'consistency_achievement',
      
      // Social Activities
      'permission_granted',
      'data_shared',
      'help_provided',
      'motivation_given'
    ],
    required: true
  },
  data: {
    // Flexible data structure based on activity type
    title: String,
    description: String,
    value: mongoose.Schema.Types.Mixed, // Number, String, Object
    metadata: {
      // Study session data
      duration: Number, // in minutes
      subject: String,
      topics: [String],
      efficiency: Number, // percentage
      
      // Goal data
      goalType: String,
      targetValue: Number,
      achievedValue: Number,
      
      // Book data
      bookTitle: String,
      chapterName: String,
      totalChapters: Number,
      completedChapters: Number,
      
      // Performance data
      testType: String,
      score: Number,
      maxScore: Number,
      percentile: Number,
      previousScore: Number,
      improvement: Number,
      
      // Achievement data
      badgeType: String,
      level: Number,
      previousLevel: Number,
      streakCount: Number,
      
      // Group data
      challengeName: String,
      position: Number,
      previousPosition: Number,
      participantCount: Number,
      
      // Social data
      sharedWith: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        permissions: [String]
      }],
      helpType: String,
      motivationType: String
    }
  },
  visibility: {
    type: String,
    enum: ['public', 'group', 'friends', 'private'],
    default: 'group'
  },
  points: {
    type: Number,
    default: 0 // Points awarded for this activity
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reaction: {
      type: String,
      enum: ['like', 'love', 'celebrate', 'support', 'motivate'],
      default: 'like'
    },
    reactedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: {
      type: String,
      maxLength: [500, 'Comment cannot exceed 500 characters'],
      trim: true
    },
    commentedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'milestone'],
    default: 'normal'
  },
  isHighlight: {
    type: Boolean,
    default: false // For featuring important activities
  },
  achievementData: {
    isAchievement: { type: Boolean, default: false },
    badgeIcon: String,
    celebrationMessage: String,
    shareText: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
groupActivitySchema.index({ group: 1, createdAt: -1 });
groupActivitySchema.index({ user: 1, createdAt: -1 });
groupActivitySchema.index({ activityType: 1, createdAt: -1 });
groupActivitySchema.index({ visibility: 1, createdAt: -1 });
groupActivitySchema.index({ priority: 1, createdAt: -1 });
groupActivitySchema.index({ group: 1, visibility: 1, createdAt: -1 });
groupActivitySchema.index({ user: 1, activityType: 1 });
groupActivitySchema.index({ 'data.metadata.subject': 1 });

// Virtual for reaction count
groupActivitySchema.virtual('reactionCount').get(function() {
  return this.reactions.length;
});

// Virtual for comment count
groupActivitySchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for activity score (used for ranking)
groupActivitySchema.virtual('activityScore').get(function() {
  let score = this.points;
  
  // Add bonus points for engagement
  score += this.reactions.length * 2;
  score += this.comments.length * 5;
  
  // Add priority multiplier
  const priorityMultiplier = {
    'low': 1,
    'normal': 1.2,
    'high': 1.5,
    'milestone': 2
  };
  
  score *= priorityMultiplier[this.priority] || 1;
  
  // Highlight bonus
  if (this.isHighlight) score *= 1.5;
  
  return Math.round(score);
});

// Instance method to add reaction
groupActivitySchema.methods.addReaction = function(userId, reactionType = 'like') {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    reaction: reactionType,
    reactedAt: new Date()
  });
  
  return this.save();
};

// Instance method to remove reaction
groupActivitySchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  return this.save();
};

// Instance method to add comment
groupActivitySchema.methods.addComment = function(userId, commentText) {
  this.comments.push({
    user: userId,
    comment: commentText,
    commentedAt: new Date()
  });
  
  return this.save();
};

// Instance method to remove comment
groupActivitySchema.methods.removeComment = function(commentId) {
  this.comments = this.comments.filter(c => c._id.toString() !== commentId.toString());
  return this.save();
};

// Instance method to generate display text
groupActivitySchema.methods.getDisplayText = function() {
  const { activityType, data, user } = this;
  const userName = user.name || 'Someone';
  
  switch (activityType) {
    case 'study_session_completed':
      return `${userName} completed a ${data.metadata.duration}min study session on ${data.metadata.subject}`;
    
    case 'daily_goal_completed':
      return `${userName} completed their daily goal: "${data.title}"`;
    
    case 'book_chapter_completed':
      return `${userName} finished chapter "${data.metadata.chapterName}" in ${data.metadata.bookTitle}`;
    
    case 'book_finished':
      return `${userName} completed reading "${data.metadata.bookTitle}" 📚`;
    
    case 'study_streak_achieved':
      return `${userName} achieved a ${data.metadata.streakCount}-day study streak! 🔥`;
    
    case 'mock_test_completed':
      return `${userName} scored ${data.metadata.score}/${data.metadata.maxScore} in ${data.metadata.testType}`;
    
    case 'badge_earned':
      return `${userName} earned the "${data.metadata.badgeType}" badge! 🏆`;
    
    case 'milestone_reached':
      return `${userName} reached a new milestone: ${data.title}`;
    
    case 'member_joined':
      return `${userName} joined the group! Welcome! 👋`;
    
    case 'leaderboard_position_changed':
      return `${userName} moved to position #${data.metadata.position} on the leaderboard!`;
    
    default:
      return data.description || `${userName} achieved something great!`;
  }
};

// Static method to create activity
groupActivitySchema.statics.createActivity = function(activityData) {
  // Calculate points based on activity type
  const pointsMap = {
    'study_session_completed': 10,
    'daily_goal_completed': 15,
    'book_chapter_completed': 20,
    'book_finished': 50,
    'syllabus_topic_completed': 25,
    'study_streak_achieved': 30,
    'mock_test_completed': 40,
    'badge_earned': 100,
    'milestone_reached': 75,
    'member_joined': 5,
    'permission_granted': 5,
    'help_provided': 20
  };
  
  const points = pointsMap[activityData.activityType] || 10;
  
  return this.create({
    ...activityData,
    points
  });
};

// Static method to get group feed
groupActivitySchema.statics.getGroupFeed = function(groupId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    group: groupId,
    visibility: { $in: ['public', 'group'] }
  })
  .populate('user', 'name profilePicture')
  .populate('reactions.user', 'name')
  .populate('comments.user', 'name profilePicture')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to get user activities
groupActivitySchema.statics.getUserActivities = function(userId, groupId = null, limit = 10) {
  const query = { user: userId };
  if (groupId) query.group = groupId;
  
  return this.find(query)
    .populate('group', 'name')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get leaderboard data
groupActivitySchema.statics.getGroupLeaderboard = function(groupId, period = 'week') {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      const weekStart = now.getDate() - now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), weekStart);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  }
  
  return this.aggregate([
    {
      $match: {
        group: mongoose.Types.ObjectId(groupId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$user',
        totalPoints: { $sum: '$points' },
        activityCount: { $sum: 1 },
        lastActivity: { $max: '$createdAt' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        userId: '$_id',
        name: '$user.name',
        profilePicture: '$user.profilePicture',
        totalPoints: 1,
        activityCount: 1,
        lastActivity: 1
      }
    },
    {
      $sort: { totalPoints: -1, lastActivity: -1 }
    }
  ]);
};

// Static method to get activity stats
groupActivitySchema.statics.getActivityStats = function(groupId, userId = null) {
  const matchCondition = { group: mongoose.Types.ObjectId(groupId) };
  if (userId) matchCondition.user = mongoose.Types.ObjectId(userId);
  
  return this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: '$activityType',
        count: { $sum: 1 },
        totalPoints: { $sum: '$points' },
        avgPoints: { $avg: '$points' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

module.exports = mongoose.model('GroupActivity', groupActivitySchema);
