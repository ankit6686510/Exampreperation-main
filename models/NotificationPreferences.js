const mongoose = require('mongoose');

const notificationPreferencesSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  pushNotifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    subscription: {
      endpoint: String,
      keys: {
        p256dh: String,
        auth: String
      }
    }
  },
  emailNotifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    types: {
      studyReminders: { type: Boolean, default: true },
      achievements: { type: Boolean, default: true },
      groupActivity: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: true },
      systemUpdates: { type: Boolean, default: false }
    },
    frequency: {
      type: String,
      enum: ['instant', 'hourly', 'daily', 'weekly'],
      default: 'instant'
    }
  },
  smsNotifications: {
    enabled: {
      type: Boolean,
      default: false
    },
    phoneNumber: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\+[1-9]\d{1,14}$/.test(v);
        },
        message: 'Phone number must be in international format'
      }
    },
    types: {
      urgentOnly: { type: Boolean, default: true },
      studyReminders: { type: Boolean, default: false },
      achievements: { type: Boolean, default: false }
    }
  },
  inAppNotifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    sound: {
      type: Boolean,
      default: true
    },
    vibration: {
      type: Boolean,
      default: true
    },
    types: {
      studyRoomReminder: { type: Boolean, default: true },
      studyRoomStarted: { type: Boolean, default: true },
      studyRoomEnded: { type: Boolean, default: true },
      participantJoined: { type: Boolean, default: true },
      participantLeft: { type: Boolean, default: false },
      pomodoroBreak: { type: Boolean, default: true },
      pomodoroWork: { type: Boolean, default: true },
      groupInvitation: { type: Boolean, default: true },
      groupActivity: { type: Boolean, default: true },
      achievementUnlocked: { type: Boolean, default: true },
      streakMilestone: { type: Boolean, default: true },
      sessionFeedbackRequest: { type: Boolean, default: true },
      general: { type: Boolean, default: true }
    }
  },
  quietHours: {
    enabled: {
      type: Boolean,
      default: false
    },
    startTime: {
      type: String,
      default: '22:00',
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Time must be in HH:MM format'
      }
    },
    endTime: {
      type: String,
      default: '07:00',
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Time must be in HH:MM format'
      }
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    allowUrgent: {
      type: Boolean,
      default: true
    }
  },
  analytics: {
    enabled: {
      type: Boolean,
      default: true
    },
    trackOpens: {
      type: Boolean,
      default: true
    },
    trackClicks: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Create default preferences for new user
notificationPreferencesSchema.statics.createDefault = async function(userId) {
  try {
    const defaultPrefs = new this({ user: userId });
    return await defaultPrefs.save();
  } catch (error) {
    if (error.code === 11000) {
      // Preferences already exist
      return await this.findOne({ user: userId });
    }
    throw error;
  }
};

// Get user preferences with defaults
notificationPreferencesSchema.statics.getUserPreferences = async function(userId) {
  let prefs = await this.findOne({ user: userId });
  if (!prefs) {
    prefs = await this.createDefault(userId);
  }
  return prefs;
};

// Check if notification should be sent based on preferences
notificationPreferencesSchema.methods.shouldSendNotification = function(type, channel = 'inApp') {
  const now = new Date();
  
  // Check quiet hours
  if (this.quietHours.enabled && channel !== 'inApp') {
    const currentTime = now.toTimeString().substring(0, 5);
    const { startTime, endTime, allowUrgent } = this.quietHours;
    
    const isQuietTime = startTime <= endTime 
      ? currentTime >= startTime && currentTime <= endTime
      : currentTime >= startTime || currentTime <= endTime;
    
    if (isQuietTime && (!allowUrgent || type !== 'urgent')) {
      return false;
    }
  }
  
  // Check channel-specific preferences
  switch (channel) {
    case 'push':
      return this.pushNotifications.enabled;
    case 'email':
      return this.emailNotifications.enabled && 
             (this.emailNotifications.types[type] !== false);
    case 'sms':
      return this.smsNotifications.enabled && 
             this.smsNotifications.phoneNumber &&
             (this.smsNotifications.types[type] !== false);
    case 'inApp':
    default:
      return this.inAppNotifications.enabled && 
             (this.inAppNotifications.types[type] !== false);
  }
};

module.exports = mongoose.model('NotificationPreferences', notificationPreferencesSchema);
