const mongoose = require('mongoose');

const groupPermissionSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  viewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permissions: {
    studyTime: {
      enabled: { type: Boolean, default: false },
      details: {
        dailyHours: { type: Boolean, default: false },
        weeklyTrends: { type: Boolean, default: false },
        studyStreak: { type: Boolean, default: false },
        sessionHistory: { type: Boolean, default: false }
      }
    },
    goals: {
      enabled: { type: Boolean, default: false },
      details: {
        dailyGoals: { type: Boolean, default: false },
        monthlyPlans: { type: Boolean, default: false },
        completionRate: { type: Boolean, default: false },
        targetProgress: { type: Boolean, default: false }
      }
    },
    books: {
      enabled: { type: Boolean, default: false },
      details: {
        bookList: { type: Boolean, default: false },
        readingProgress: { type: Boolean, default: false },
        chaptersCompleted: { type: Boolean, default: false },
        readingSpeed: { type: Boolean, default: false }
      }
    },
    syllabus: {
      enabled: { type: Boolean, default: false },
      details: {
        topicsCompleted: { type: Boolean, default: false },
        subjectProgress: { type: Boolean, default: false },
        overallCompletion: { type: Boolean, default: false },
        weakAreas: { type: Boolean, default: false }
      }
    },
    sessions: {
      enabled: { type: Boolean, default: false },
      details: {
        sessionDuration: { type: Boolean, default: false },
        focusTime: { type: Boolean, default: false },
        breakPatterns: { type: Boolean, default: false },
        studyMethods: { type: Boolean, default: false }
      }
    },
    performance: {
      enabled: { type: Boolean, default: false },
      details: {
        testScores: { type: Boolean, default: false },
        mockResults: { type: Boolean, default: false },
        improvementTrends: { type: Boolean, default: false },
        rankings: { type: Boolean, default: false }
      }
    },
    profile: {
      enabled: { type: Boolean, default: true },
      details: {
        name: { type: Boolean, default: true },
        examTypes: { type: Boolean, default: true },
        targetDate: { type: Boolean, default: true },
        profilePicture: { type: Boolean, default: true }
      }
    }
  },
  duration: {
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null // null means permanent
    },
    isPermanent: {
      type: Boolean,
      default: false
    },
    autoRenew: {
      type: Boolean,
      default: false
    },
    renewalPeriod: {
      type: String,
      enum: ['1week', '1month', '3months', '6months'],
      default: '1month'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'revoked', 'expired'],
    default: 'pending'
  },
  requestMessage: {
    type: String,
    maxLength: [200, 'Request message cannot exceed 200 characters'],
    trim: true
  },
  responseMessage: {
    type: String,
    maxLength: [200, 'Response message cannot exceed 200 characters'],
    trim: true
  },
  viewHistory: [{
    viewedAt: {
      type: Date,
      default: Date.now
    },
    dataType: {
      type: String,
      enum: ['studyTime', 'goals', 'books', 'syllabus', 'sessions', 'performance', 'profile']
    },
    details: String
  }],
  notifications: {
    notifyOnView: {
      type: Boolean,
      default: true
    },
    notifyOnExpiry: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    revokedAt: Date,
    lastViewedAt: Date,
    totalViews: {
      type: Number,
      default: 0
    },
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
groupPermissionSchema.index({ group: 1, owner: 1, viewer: 1 }, { unique: true });
groupPermissionSchema.index({ owner: 1, status: 1 });
groupPermissionSchema.index({ viewer: 1, status: 1 });
groupPermissionSchema.index({ group: 1, status: 1 });
groupPermissionSchema.index({ 'duration.endDate': 1, status: 1 });

// Virtual to check if permission is currently valid
groupPermissionSchema.virtual('isValid').get(function() {
  if (this.status !== 'active') return false;
  
  if (!this.duration.isPermanent && this.duration.endDate) {
    return new Date() <= this.duration.endDate;
  }
  
  return true;
});

// Pre-save middleware to handle expiration
groupPermissionSchema.pre('save', function(next) {
  // Auto-expire if past end date
  if (this.status === 'active' && 
      !this.duration.isPermanent && 
      this.duration.endDate && 
      new Date() > this.duration.endDate) {
    this.status = 'expired';
  }
  
  // Set end date if not permanent
  if (this.duration.isPermanent) {
    this.duration.endDate = null;
  } else if (!this.duration.endDate && this.status === 'active') {
    const endDate = new Date();
    switch (this.duration.renewalPeriod) {
      case '1week':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case '1month':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case '3months':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case '6months':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      default:
        endDate.setMonth(endDate.getMonth() + 1);
    }
    this.duration.endDate = endDate;
  }
  
  next();
});

// Instance method to check specific permission
groupPermissionSchema.methods.hasPermission = function(category, detail = null) {
  if (this.status !== 'active' || !this.isValid) return false;
  
  const categoryPermission = this.permissions[category];
  if (!categoryPermission || !categoryPermission.enabled) return false;
  
  if (detail) {
    return categoryPermission.details[detail] === true;
  }
  
  return true;
};

// Instance method to grant permission
groupPermissionSchema.methods.grantPermission = function(category, detail = null) {
  if (!this.permissions[category]) return false;
  
  this.permissions[category].enabled = true;
  
  if (detail && this.permissions[category].details[detail] !== undefined) {
    this.permissions[category].details[detail] = true;
  } else if (detail === null) {
    // Grant all details for this category
    Object.keys(this.permissions[category].details).forEach(key => {
      this.permissions[category].details[key] = true;
    });
  }
  
  return true;
};

// Instance method to revoke permission
groupPermissionSchema.methods.revokePermission = function(category, detail = null) {
  if (!this.permissions[category]) return false;
  
  if (detail) {
    this.permissions[category].details[detail] = false;
    
    // Check if any details are still enabled
    const hasEnabledDetails = Object.values(this.permissions[category].details).some(val => val === true);
    if (!hasEnabledDetails) {
      this.permissions[category].enabled = false;
    }
  } else {
    this.permissions[category].enabled = false;
    Object.keys(this.permissions[category].details).forEach(key => {
      this.permissions[category].details[key] = false;
    });
  }
  
  return true;
};

// Instance method to log view activity
groupPermissionSchema.methods.logView = function(dataType, details = null) {
  this.viewHistory.push({
    viewedAt: new Date(),
    dataType: dataType,
    details: details
  });
  
  this.metadata.lastViewedAt = new Date();
  this.metadata.totalViews += 1;
  
  // Keep only last 100 view records
  if (this.viewHistory.length > 100) {
    this.viewHistory = this.viewHistory.slice(-100);
  }
};

// Instance method to approve permission request
groupPermissionSchema.methods.approve = function(responseMessage = null) {
  this.status = 'active';
  this.metadata.approvedAt = new Date();
  if (responseMessage) {
    this.responseMessage = responseMessage;
  }
};

// Instance method to revoke permission
groupPermissionSchema.methods.revoke = function(responseMessage = null) {
  this.status = 'revoked';
  this.metadata.revokedAt = new Date();
  if (responseMessage) {
    this.responseMessage = responseMessage;
  }
};

// Static method to find permissions for a user in a group
groupPermissionSchema.statics.findGroupPermissions = function(groupId, userId) {
  return this.find({
    group: groupId,
    $or: [
      { owner: userId },
      { viewer: userId }
    ],
    status: 'active'
  }).populate('owner viewer', 'name profilePicture');
};

// Static method to check if user can view another user's data
groupPermissionSchema.statics.canView = function(groupId, ownerId, viewerId, category, detail = null) {
  return this.findOne({
    group: groupId,
    owner: ownerId,
    viewer: viewerId,
    status: 'active'
  }).then(permission => {
    if (!permission) return false;
    return permission.hasPermission(category, detail);
  });
};

// Static method to clean up expired permissions
groupPermissionSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    {
      status: 'active',
      'duration.isPermanent': false,
      'duration.endDate': { $lt: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
};

module.exports = mongoose.model('GroupPermission', groupPermissionSchema);
