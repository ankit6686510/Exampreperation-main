const NotificationPreferences = require('../models/NotificationPreferences');
const PushNotificationService = require('../services/pushNotificationService');
const EmailNotificationService = require('../services/emailNotificationService');
const logger = require('../config/logger');

exports.getPreferences = async (req, res) => {
  try {
    const preferences = await NotificationPreferences.getUserPreferences(req.user.id);
    
    res.status(200).json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('Error fetching notification preferences', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences'
    });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const preferences = await NotificationPreferences.getUserPreferences(req.user.id);
    
    // Update preferences with provided data
    Object.keys(req.body).forEach(key => {
      if (preferences[key] !== undefined) {
        if (typeof preferences[key] === 'object' && preferences[key] !== null) {
          // Merge objects
          preferences[key] = { ...preferences[key], ...req.body[key] };
        } else {
          preferences[key] = req.body[key];
        }
      }
    });

    await preferences.save();
    
    logger.info('Notification preferences updated', { userId: req.user.id });
    
    res.status(200).json({
      success: true,
      data: preferences,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    logger.error('Error updating notification preferences', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences'
    });
  }
};

exports.subscribeToPush = async (req, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Invalid push subscription data'
      });
    }

    await PushNotificationService.subscribeUser(req.user.id, subscription);
    
    res.status(200).json({
      success: true,
      message: 'Successfully subscribed to push notifications'
    });
  } catch (error) {
    logger.error('Error subscribing to push notifications', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe to push notifications'
    });
  }
};

exports.unsubscribeFromPush = async (req, res) => {
  try {
    await PushNotificationService.unsubscribeUser(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from push notifications'
    });
  } catch (error) {
    logger.error('Error unsubscribing from push notifications', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe from push notifications'
    });
  }
};

exports.getVapidPublicKey = async (req, res) => {
  try {
    const publicKey = PushNotificationService.getVapidPublicKey();
    
    res.status(200).json({
      success: true,
      data: { publicKey }
    });
  } catch (error) {
    logger.error('Error getting VAPID public key', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get VAPID public key'
    });
  }
};

exports.testNotification = async (req, res) => {
  try {
    const { type = 'test', title, message, priority = 'medium' } = req.body;
    
    const testNotification = {
      _id: `test_${Date.now()}`,
      type,
      title: title || 'Test Notification',
      message: message || 'This is a test notification to verify your settings.',
      priority,
      actionUrl: '/dashboard'
    };

    // Send push notification if enabled
    const preferences = await NotificationPreferences.getUserPreferences(req.user.id);
    const results = {};

    if (preferences.pushNotifications.enabled) {
      try {
        const pushResult = await PushNotificationService.sendToUser(req.user.id, testNotification);
        results.push = pushResult;
      } catch (error) {
        results.push = { success: false, error: error.message };
      }
    }

    if (preferences.emailNotifications.enabled && req.user.email) {
      try {
        const emailResult = await EmailNotificationService.sendToUser(
          req.user.id, 
          testNotification, 
          req.user.email
        );
        results.email = emailResult;
      } catch (error) {
        results.email = { success: false, error: error.message };
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      message: 'Test notifications sent'
    });
  } catch (error) {
    logger.error('Error sending test notification', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification'
    });
  }
};

exports.unsubscribeEmail = async (req, res) => {
  try {
    const { userId, token } = req.query;
    
    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId or token'
      });
    }

    const result = await EmailNotificationService.handleUnsubscribe(userId, token);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid unsubscribe token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from email notifications'
    });
  } catch (error) {
    logger.error('Error handling email unsubscribe', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to process unsubscribe request'
    });
  }
};

exports.getNotificationStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get notification statistics
    const Notification = require('../models/Notification');
    
    const stats = await Notification.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          read: { $sum: { $cond: ['$read', 1, 0] } },
          unread: { $sum: { $cond: ['$read', 0, 1] } },
          byType: {
            $push: {
              type: '$type',
              priority: '$priority',
              read: '$read'
            }
          }
        }
      }
    ]);

    const typeStats = {};
    if (stats.length > 0 && stats[0].byType) {
      stats[0].byType.forEach(item => {
        if (!typeStats[item.type]) {
          typeStats[item.type] = { total: 0, read: 0, unread: 0 };
        }
        typeStats[item.type].total++;
        if (item.read) {
          typeStats[item.type].read++;
        } else {
          typeStats[item.type].unread++;
        }
      });
    }

    const result = {
      period: `Last ${days} days`,
      summary: stats.length > 0 ? {
        total: stats[0].total,
        read: stats[0].read,
        unread: stats[0].unread,
        readRate: stats[0].total > 0 ? Math.round((stats[0].read / stats[0].total) * 100) : 0
      } : {
        total: 0,
        read: 0,
        unread: 0,
        readRate: 0
      },
      byType: typeStats
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching notification stats', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics'
    });
  }
};

exports.resetPreferences = async (req, res) => {
  try {
    // Delete existing preferences to trigger recreation with defaults
    await NotificationPreferences.findOneAndDelete({ user: req.user.id });
    
    // Create new default preferences
    const newPreferences = await NotificationPreferences.createDefault(req.user.id);
    
    logger.info('Notification preferences reset to defaults', { userId: req.user.id });
    
    res.status(200).json({
      success: true,
      data: newPreferences,
      message: 'Preferences reset to defaults'
    });
  } catch (error) {
    logger.error('Error resetting notification preferences', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(500).json({
      success: false,
      message: 'Failed to reset notification preferences'
    });
  }
};

exports.bulkUpdatePreferences = async (req, res) => {
  try {
    const { notifications } = req.body;
    
    if (!notifications || typeof notifications !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification preferences data'
      });
    }

    const preferences = await NotificationPreferences.getUserPreferences(req.user.id);
    
    // Update specific notification type preferences
    Object.keys(notifications).forEach(type => {
      if (preferences.inAppNotifications.types[type] !== undefined) {
        preferences.inAppNotifications.types[type] = notifications[type];
      }
      if (preferences.emailNotifications.types[type] !== undefined) {
        preferences.emailNotifications.types[type] = notifications[type];
      }
      if (preferences.smsNotifications.types[type] !== undefined) {
        preferences.smsNotifications.types[type] = notifications[type];
      }
    });

    await preferences.save();
    
    res.status(200).json({
      success: true,
      data: preferences,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    logger.error('Error bulk updating notification preferences', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences'
    });
  }
};

module.exports = exports;
