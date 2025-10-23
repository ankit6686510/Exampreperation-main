const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxLength: [100, 'Group name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxLength: [500, 'Description cannot exceed 500 characters'],
    trim: true
  },
  examTypes: [{
    type: String,
    enum: ['UPSC', 'SSC', 'Banking', 'Railway', 'State PSC', 'Defense', 'Teaching', 'Other'],
    required: true
  }],
  targetDate: {
    type: Date,
    required: [true, 'Target exam date is required']
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  privacy: {
    type: String,
    enum: ['public', 'private', 'invite-only'],
    default: 'public'
  },
  settings: {
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxMembers: {
      type: Number,
      default: 50,
      min: 2,
      max: 100
    },
    allowDataSharing: {
      type: Boolean,
      default: true
    },
    allowLeaderboard: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    totalMembers: {
      type: Number,
      default: 1
    },
    averageStudyHours: {
      type: Number,
      default: 0
    },
    groupStreak: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
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

// Indexes for better performance
studyGroupSchema.index({ admin: 1 });
studyGroupSchema.index({ 'members.user': 1 });
studyGroupSchema.index({ examTypes: 1 });
studyGroupSchema.index({ privacy: 1, isActive: 1 });
studyGroupSchema.index({ createdAt: -1 });

// Virtual for member count
studyGroupSchema.virtual('memberCount').get(function() {
  return this.members.filter(member => member.isActive).length;
});

// Pre-save middleware to update member count
studyGroupSchema.pre('save', function(next) {
  if (this.isModified('members')) {
    this.stats.totalMembers = this.members.filter(member => member.isActive).length;
  }
  next();
});

// Instance method to check if user is a member
studyGroupSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString() && member.isActive
  );
};

// Instance method to check if user is admin or moderator
studyGroupSchema.methods.canModerate = function(userId) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString() && member.isActive
  );
  return member && (member.role === 'admin' || member.role === 'moderator');
};

// Instance method to add member
studyGroupSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (existingMember) {
    existingMember.isActive = true;
    existingMember.role = role;
    existingMember.joinedAt = new Date();
  } else {
    this.members.push({
      user: userId,
      role: role,
      joinedAt: new Date(),
      isActive: true
    });
  }
  
  this.stats.totalMembers = this.members.filter(member => member.isActive).length;
  this.stats.lastActivity = new Date();
};

// Instance method to remove member
studyGroupSchema.methods.removeMember = function(userId) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (member) {
    member.isActive = false;
    this.stats.totalMembers = this.members.filter(member => member.isActive).length;
    this.stats.lastActivity = new Date();
  }
};

// Static method to find groups by exam type
studyGroupSchema.statics.findByExamType = function(examType, limit = 10) {
  return this.find({
    examTypes: examType,
    privacy: 'public',
    isActive: true
  })
  .populate('admin', 'name')
  .sort({ 'stats.totalMembers': -1, createdAt: -1 })
  .limit(limit);
};

// Static method to search groups
studyGroupSchema.statics.searchGroups = function(query, examType = null) {
  const searchCriteria = {
    isActive: true,
    privacy: 'public',
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } }
    ]
  };
  
  if (examType) {
    searchCriteria.examTypes = examType;
  }
  
  return this.find(searchCriteria)
    .populate('admin', 'name')
    .sort({ 'stats.totalMembers': -1, createdAt: -1 });
};

module.exports = mongoose.model('StudyGroup', studyGroupSchema);
