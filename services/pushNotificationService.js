const webpush = require('web-push');
const NotificationPreferences = require('../models/NotificationPreferences');
const logger = require('../config/logger');

// Configure web-push with VAPID keys
// Generate VAPID keys: npx web-push generate-vapid-keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

// Check if VAPID keys are configured
const isPushNotificationEnabled = vapidKeys.publicKey && vapidKeys.privateKey;

if (isPushNotificationEnabled) {
  try {
    webpush.setVapidDetails(
      'mailto:' + (process.env.VAPID_EMAIL || 'contact@examplanner.com'),
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
    logger.info('Push notification service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize push notification service', { error: error.message });
    logger.warn('Push notifications will be disabled. Generate VAPID keys with: npx web-push generate-vapid-keys');
  }
} else {
  logger.warn('VAPID keys not configured. Push notifications are disabled.');
  logger.info('To enable push notifications, generate VAPID keys with: npx web-push generate-vapid-keys');
}

class PushNotificationService {
  /**
   * Subscribe user to push notifications
   */
  static async subscribeUser(userId, subscription) {
    if (!isPushNotificationEnabled) {
      logger.warn('Push notifications not enabled - VAPID keys not configured');
      return { success: false, reason: 'push_notifications_disabled' };
    }

    try {
      const preferences = await NotificationPreferences.getUserPreferences(userId);
      preferences.pushNotifications.subscription = subscription;
      preferences.pushNotifications.enabled = true;
      await preferences.save();
      
      logger.info('User subscribed to push notifications', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Error subscribing user to push notifications', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  static async unsubscribeUser(userId) {
    try {
      const preferences = await NotificationPreferences.getUserPreferences(userId);
      preferences.pushNotifications.enabled = false;
      preferences.pushNotifications.subscription = undefined;
      await preferences.save();
      
      logger.info('User unsubscribed from push notifications', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Error unsubscribing user from push notifications', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Send push notification to a single user
   */
  static async sendToUser(userId, notification) {
    if (!isPushNotificationEnabled) {
      logger.debug('Push notifications not enabled - skipping', { userId });
      return { success: false, reason: 'push_notifications_disabled' };
    }

    try {
      const preferences = await NotificationPreferences.getUserPreferences(userId);
      
      if (!preferences.shouldSendNotification(notification.type, 'push')) {
        logger.debug('Push notification blocked by user preferences', { userId, type: notification.type });
        return { success: false, reason: 'blocked_by_preferences' };
      }

      const subscription = preferences.pushNotifications.subscription;
      if (!subscription || !subscription.endpoint) {
        logger.debug('No push subscription found for user', { userId });
        return { success: false, reason: 'no_subscription' };
      }

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.message,
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: notification.type,
        data: {
          notificationId: notification._id,
          type: notification.type,
          actionUrl: notification.actionUrl,
          userId: userId
        },
        actions: this.getNotificationActions(notification.type, notification.actionUrl),
        requireInteraction: notification.priority === 'urgent',
        silent: notification.priority === 'low'
      });

      const options = {
        TTL: 24 * 60 * 60, // 24 hours
        urgency: this.mapPriorityToUrgency(notification.priority),
        headers: {
          'Topic': notification.type
        }
      };

      await webpush.sendNotification(subscription, payload, options);
      
      logger.info('Push notification sent successfully', { 
        userId, 
        type: notification.type,
        priority: notification.priority 
      });
      
      return { success: true };
    } catch (error) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription is invalid, remove it
        logger.warn('Invalid push subscription, removing', { userId, error: error.message });
        await this.unsubscribeUser(userId);
        return { success: false, reason: 'invalid_subscription' };
      }
      
      logger.error('Error sending push notification', { 
        userId, 
        error: error.message,
        statusCode: error.statusCode 
      });
      throw error;
    }
  }

  /**
   * Send push notifications to multiple users
   */
  static async sendToUsers(userIds, notification) {
    const results = [];
    
    for (const userId of userIds) {
      try {
        const result = await this.sendToUser(userId, notification);
        results.push({ userId, ...result });
      } catch (error) {
        results.push({ 
          userId, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    logger.info('Bulk push notifications sent', { 
      total: userIds.length, 
      successful: successCount,
      failed: userIds.length - successCount
    });
    
    return results;
  }

  /**
   * Send study room reminder notifications
   */
  static async sendStudyRoomReminder(roomId, roomData, participants) {
    const userIds = participants.map(p => p.user);
    const notification = {
      type: 'study_room_reminder',
      title: 'Study Room Starting Soon',
      message: `"${roomData.name}" starts in 15 minutes. Get ready!`,
      priority: 'high',
      actionUrl: `/study-rooms/${roomId}`,
      _id: `reminder_${roomId}_${Date.now()}`
    };

    return await this.sendToUsers(userIds, notification);
  }

  /**
   * Send achievement notification
   */
  static async sendAchievementNotification(userId, achievement) {
    const notification = {
      type: 'achievement_unlocked',
      title: '🏆 Achievement Unlocked!',
      message: `Congratulations! You've earned: ${achievement.title}`,
      priority: 'medium',
      actionUrl: '/achievements',
      _id: `achievement_${achievement.id}_${Date.now()}`
    };

    return await this.sendToUser(userId, notification);
  }

  /**
   * Send pomodoro phase change notification
   */
  static async sendPomodoroNotification(roomId, phase, participants) {
    const userIds = participants.map(p => p.user);
    const messages = {
      'work': { title: '🍅 Focus Time!', message: 'Work phase started. Time to concentrate!' },
      'short-break': { title: '☕ Short Break', message: 'Take a 5-minute break. You earned it!' },
      'long-break': { title: '🧘 Long Break', message: 'Enjoy your 15-minute break. Relax and recharge!' }
    };

    const notification = {
      type: phase === 'work' ? 'pomodoro_work' : 'pomodoro_break',
      title: messages[phase]?.title || 'Pomodoro Update',
      message: messages[phase]?.message || 'Pomodoro phase changed',
      priority: 'medium',
      actionUrl: `/study-rooms/${roomId}`,
      _id: `pomodoro_${roomId}_${phase}_${Date.now()}`
    };

    return await this.sendToUsers(userIds, notification);
  }

  /**
   * Get notification actions based on type
   */
  static getNotificationActions(type, actionUrl) {
    const baseActions = [
      {
        action: 'open',
        title: 'Open',
        icon: '/icons/open.png'
      }
    ];

    switch (type) {
      case 'study_room_reminder':
      case 'study_room_started':
        return [
          {
            action: 'join',
            title: 'Join Room',
            icon: '/icons/join.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/icons/dismiss.png'
          }
        ];
      
      case 'pomodoro_break':
        return [
          {
            action: 'return',
            title: 'Return to Room',
            icon: '/icons/return.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/icons/dismiss.png'
          }
        ];
      
      case 'achievement_unlocked':
        return [
          {
            action: 'view',
            title: 'View Achievement',
            icon: '/icons/trophy.png'
          },
          {
            action: 'share',
            title: 'Share',
            icon: '/icons/share.png'
          }
        ];
      
      default:
        return baseActions;
    }
  }

  /**
   * Map notification priority to web push urgency
   */
  static mapPriorityToUrgency(priority) {
    switch (priority) {
      case 'urgent':
        return 'high';
      case 'high':
        return 'normal';
      case 'medium':
        return 'normal';
      case 'low':
        return 'low';
      default:
        return 'normal';
    }
  }

  /**
   * Get VAPID public key for client-side subscription
   */
  static getVapidPublicKey() {
    if (!isPushNotificationEnabled) {
      logger.warn('VAPID public key requested but push notifications not enabled');
      return null;
    }
    return vapidKeys.publicKey;
  }

  /**
   * Check if push notifications are enabled
   */
  static isPushNotificationEnabled() {
    return isPushNotificationEnabled;
  }

  /**
   * Clean up invalid subscriptions
   */
  static async cleanupInvalidSubscriptions() {
    try {
      const preferences = await NotificationPreferences.find({
        'pushNotifications.enabled': true,
        'pushNotifications.subscription.endpoint': { $exists: true }
      });

      let cleanedCount = 0;
      
      for (const pref of preferences) {
        try {
          // Test subscription with a dummy notification
          const testPayload = JSON.stringify({
            title: 'Test',
            body: 'Testing subscription validity',
            tag: 'test',
            silent: true
          });

          await webpush.sendNotification(
            pref.pushNotifications.subscription, 
            testPayload,
            { TTL: 1 }
          );
        } catch (error) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Invalid subscription, remove it
            pref.pushNotifications.enabled = false;
            pref.pushNotifications.subscription = undefined;
            await pref.save();
            cleanedCount++;
            
            logger.info('Cleaned up invalid push subscription', { 
              userId: pref.user 
            });
          }
        }
      }

      logger.info('Push subscription cleanup completed', { cleanedCount });
      return { cleanedCount };
    } catch (error) {
      logger.error('Error during subscription cleanup', { error: error.message });
      throw error;
    }
  }
}

module.exports = PushNotificationService;
