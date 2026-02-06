const mongoose = require('mongoose');

const groupProgressShareSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true
  },
  shareSettings: {
    studyHours: {
      type: String,
      enum: ['private', 'group', 'partners'],
      default: 'group'
    },
    studyStreak: {
      type: String,
      enum: ['private', 'group', 'partners'],
      default: 'group'
    },
    subjectProgress: {
      type: String,
      enum: ['private', 'group', 'partners'],
      default: 'group'
    },
    goalCompletion: {
      type: String,
      enum: ['private', 'group', 'partners'],
      default: 'group'
    },
    testScores: {
      type: String,
      enum: ['private', 'group', 'partners'],
      default: 'partners'
    },
    achievements: {
      type: String,
      enum: ['private', 'group', 'partners'],
      default: 'group'
    },
    studySchedule: {
      type: String,
      enum: ['private', 'group', 'partners'],
      default: 'partners'
    }
  },
  displayPreferences: {
    showRealName: {
      type: Boolean,
      default: true
    },
    showInLeaderboard: {
      type: Boolean,
      default: true
    },
    allowDataComparison: {
      type: Boolean,
      default: true
    },
    showProgressMilestones: {
      type: Boolean,
      default: true
    }
  },
  partnerList: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    partnershipStatus: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    partneredAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
groupProgressShareSchema.index({ user: 1, group: 1 }, { unique: true });
groupProgressShareSchema.index({ group: 1 });
groupProgressShareSchema.index({ 'partnerList.user': 1 });

// Static method to get user's sharing settings for a group
groupProgressShareSchema.statics.getUserShareSettings = function(userId, groupId) {
  return this.findOne({ user: userId, group: groupId });
};

// Static method to check if data should be visible to another user
groupProgressShareSchema.statics.canViewData = async function(dataOwnerUserId, viewerUserId, groupId, dataType) {
  const shareSettings = await this.findOne({ 
    user: dataOwnerUserId, 
    group: groupId 
  }).populate('partnerList.user');
  
  if (!shareSettings) {
    // Default to group visibility if no settings found
    return dataType !== 'testScores';
  }
  
  const visibility = shareSettings.shareSettings[dataType];
  
  switch (visibility) {
    case 'private':
      return dataOwnerUserId.toString() === viewerUserId.toString();
    case 'group':
      return true;
    case 'partners':
      // Check if viewer is a study partner
      const isPartner = shareSettings.partnerList.some(partner => 
        partner.user._id.toString() === viewerUserId.toString() && 
        partner.partnershipStatus === 'accepted'
      );
      return isPartner || dataOwnerUserId.toString() === viewerUserId.toString();
    default:
      return false;
  }
};

// Instance method to add study partner
groupProgressShareSchema.methods.addPartner = function(partnerId) {
  const existingPartner = this.partnerList.find(partner => 
    partner.user.toString() === partnerId.toString()
  );
  
  if (!existingPartner) {
    this.partnerList.push({
      user: partnerId,
      partnershipStatus: 'pending',
      partneredAt: new Date()
    });
  }
  
  this.lastUpdated = new Date();
  return this.save();
};

// Instance method to update partnership status
groupProgressShareSchema.methods.updatePartnershipStatus = function(partnerId, status) {
  const partner = this.partnerList.find(partner => 
    partner.user.toString() === partnerId.toString()
  );
  
  if (partner) {
    partner.partnershipStatus = status;
    this.lastUpdated = new Date();
  }
  
  return this.save();
};

// Instance method to remove partner
groupProgressShareSchema.methods.removePartner = function(partnerId) {
  this.partnerList = this.partnerList.filter(partner => 
    partner.user.toString() !== partnerId.toString()
  );
  
  this.lastUpdated = new Date();
  return this.save();
};

module.exports = mongoose.model('GroupProgressShare', groupProgressShareSchema);
