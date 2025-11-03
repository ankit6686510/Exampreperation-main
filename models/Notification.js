const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'study_room_reminder',
      'study_room_started',
      'study_room_ended',
      'participant_joined',
      'participant_left',
      'pomodoro_break',
      'pomodoro_work',
      'group_invitation',
      'group_activity',
      'achievement_unlocked',
      'streak_milestone',
      'session_feedback_request',
      'general'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  data: {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyRoom'
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    achievementId: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  actionUrl: {
    type: String
  },
  expiresAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true
});

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

notificationSchema.statics.createNotification = async function(userId, notificationData) {
  const notification = await this.create({
    user: userId,
    ...notificationData
  });
  
  return notification;
};

notificationSchema.statics.createBulkNotifications = async function(userIds, notificationData) {
  const notifications = userIds.map(userId => ({
    user: userId,
    ...notificationData
  }));
  
  return await this.insertMany(notifications);
};

notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    limit = 20,
    skip = 0,
    unreadOnly = false,
    types = null
  } = options;
  
  const query = { user: userId };
  
  if (unreadOnly) {
    query.read = false;
  }
  
  if (types && types.length > 0) {
    query.type = { $in: types };
  }
  
  const notifications = await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('data.roomId', 'name scheduledTime')
    .populate('data.groupId', 'name')
    .populate('data.userId', 'name email');
  
  const total = await this.countDocuments(query);
  const unreadCount = await this.countDocuments({ user: userId, read: false });
  
  return {
    notifications,
    total,
    unreadCount,
    hasMore: total > skip + limit
  };
};

notificationSchema.statics.markAsRead = async function(notificationIds, userId) {
  return await this.updateMany(
    {
      _id: { $in: notificationIds },
      user: userId,
      read: false
    },
    {
      $set: {
        read: true,
        readAt: new Date()
      }
    }
  );
};

notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    {
      user: userId,
      read: false
    },
    {
      $set: {
        read: true,
        readAt: new Date()
      }
    }
  );
};

notificationSchema.statics.deleteOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    read: true
  });
};

notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = new Date();
  return await this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);