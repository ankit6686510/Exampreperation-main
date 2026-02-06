const Notification = require('../models/Notification');
const NotificationPreferences = require('../models/NotificationPreferences');
const logger = require('../config/logger');

class NotificationAnalytics {
  /**
   * Track notification creation
   */
  static async trackNotificationCreated(userId, notificationType, priority, channel = 'inApp') {
    try {
      // Store analytics data in a simple format
      // In production, you might want to use a dedicated analytics database
      const analyticsData = {
        userId,
        event: 'notification_created',
        type: notificationType,
        priority,
        channel,
        timestamp: new Date()
      };

      logger.info('Notification created analytics', analyticsData);
      
      // You can extend this to store in a dedicated analytics collection
      // await AnalyticsEvent.create(analyticsData);
      
      return true;
    } catch (error) {
      logger.error('Error tracking notification creation', { error: error.message });
      return false;
    }
  }

  /**
   * Track notification interaction (opened, clicked)
   */
  static async trackNotificationInteraction(notificationId, userId, action = 'opened') {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        return false;
      }

      const analyticsData = {
        notificationId,
        userId,
        event: `notification_${action}`,
        type: notification.type,
        priority: notification.priority,
        timestamp: new Date(),
        timeToInteraction: new Date() - notification.createdAt
      };

      logger.info('Notification interaction analytics', analyticsData);
      
      // Update notification with interaction data
      if (!notification.analytics) {
        notification.analytics = {};
      }
      
      notification.analytics[action] = true;
      notification.analytics[`${action}At`] = new Date();
      await notification.save();

      return true;
    } catch (error) {
      logger.error('Error tracking notification interaction', { error: error.message });
      return false;
    }
  }

  /**
   * Get notification statistics for a user
   */
  static async getUserNotificationStats(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await Notification.aggregate([
        {
          $match: {
            user: userId,
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
                read: '$read',
                createdAt: '$createdAt'
              }
            },
            byPriority: {
              $push: {
                priority: '$priority',
                read: '$read'
              }
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          total: 0,
          read: 0,
          unread: 0,
          readRate: 0,
          byType: {},
          byPriority: {},
          dailyTrend: []
        };
      }

      const result = stats[0];
      
      // Process by type
      const typeStats = {};
      result.byType.forEach(item => {
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

      // Process by priority
      const priorityStats = {};
      result.byPriority.forEach(item => {
        if (!priorityStats[item.priority]) {
          priorityStats[item.priority] = { total: 0, read: 0, unread: 0 };
        }
        priorityStats[item.priority].total++;
        if (item.read) {
          priorityStats[item.priority].read++;
        } else {
          priorityStats[item.priority].unread++;
        }
      });

      // Generate daily trend
      const dailyTrend = await this.getDailyNotificationTrend(userId, days);

      return {
        total: result.total,
        read: result.read,
        unread: result.unread,
        readRate: result.total > 0 ? Math.round((result.read / result.total) * 100) : 0,
        byType: typeStats,
        byPriority: priorityStats,
        dailyTrend
      };
    } catch (error) {
      logger.error('Error getting user notification stats', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get daily notification trend
   */
  static async getDailyNotificationTrend(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const dailyStats = await Notification.aggregate([
        {
          $match: {
            user: userId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            total: { $sum: 1 },
            read: { $sum: { $cond: ['$read', 1, 0] } },
            unread: { $sum: { $cond: ['$read', 0, 1] } }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);

      // Fill in missing days with zero values
      const trend = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= new Date()) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayStats = dailyStats.find(stat => stat._id === dateStr);
        
        trend.push({
          date: dateStr,
          total: dayStats ? dayStats.total : 0,
          read: dayStats ? dayStats.read : 0,
          unread: dayStats ? dayStats.unread : 0
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return trend;
    } catch (error) {
      logger.error('Error getting daily notification trend', { userId, error: error.message });
      return [];
    }
  }

  /**
   * Get global notification statistics (admin)
   */
  static async getGlobalNotificationStats(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await Notification.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            read: { $sum: { $cond: ['$read', 1, 0] } },
            unread: { $sum: { $cond: ['$read', 0, 1] } },
            uniqueUsers: { $addToSet: '$user' },
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

      if (stats.length === 0) {
        return {
          total: 0,
          read: 0,
          unread: 0,
          uniqueUsers: 0,
          readRate: 0,
          byType: {}
        };
      }

      const result = stats[0];
      
      // Process by type
      const typeStats = {};
      result.byType.forEach(item => {
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

      return {
        total: result.total,
        read: result.read,
        unread: result.unread,
        uniqueUsers: result.uniqueUsers.length,
        readRate: result.total > 0 ? Math.round((result.read / result.total) * 100) : 0,
        byType: typeStats
      };
    } catch (error) {
      logger.error('Error getting global notification stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Get notification preferences statistics
   */
  static async getPreferencesStats() {
    try {
      const stats = await NotificationPreferences.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            pushEnabled: { $sum: { $cond: ['$pushNotifications.enabled', 1, 0] } },
            emailEnabled: { $sum: { $cond: ['$emailNotifications.enabled', 1, 0] } },
            smsEnabled: { $sum: { $cond: ['$smsNotifications.enabled', 1, 0] } },
            inAppEnabled: { $sum: { $cond: ['$inAppNotifications.enabled', 1, 0] } },
            quietHoursEnabled: { $sum: { $cond: ['$quietHours.enabled', 1, 0] } },
            analyticsEnabled: { $sum: { $cond: ['$analytics.enabled', 1, 0] } }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          totalUsers: 0,
          pushEnabled: 0,
          emailEnabled: 0,
          smsEnabled: 0,
          inAppEnabled: 0,
          quietHoursEnabled: 0,
          analyticsEnabled: 0
        };
      }

      const result = stats[0];
      
      return {
        totalUsers: result.totalUsers,
        pushEnabled: result.pushEnabled,
        emailEnabled: result.emailEnabled,
        smsEnabled: result.smsEnabled,
        inAppEnabled: result.inAppEnabled,
        quietHoursEnabled: result.quietHoursEnabled,
        analyticsEnabled: result.analyticsEnabled,
        pushEnabledRate: Math.round((result.pushEnabled / result.totalUsers) * 100),
        emailEnabledRate: Math.round((result.emailEnabled / result.totalUsers) * 100),
        smsEnabledRate: Math.round((result.smsEnabled / result.totalUsers) * 100),
        inAppEnabledRate: Math.round((result.inAppEnabled / result.totalUsers) * 100)
      };
    } catch (error) {
      logger.error('Error getting preferences stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Get notification delivery success rates
   */
  static async getDeliveryStats(days = 30) {
    try {
      // This would require storing delivery status in your notification records
      // For now, return mock data structure
      return {
        inApp: {
          sent: 1250,
          delivered: 1245,
          opened: 890,
          clicked: 450,
          deliveryRate: 99.6,
          openRate: 71.5,
          clickRate: 36.0
        },
        push: {
          sent: 800,
          delivered: 760,
          opened: 520,
          clicked: 280,
          deliveryRate: 95.0,
          openRate: 68.4,
          clickRate: 36.8
        },
        email: {
          sent: 600,
          delivered: 590,
          opened: 420,
          clicked: 180,
          deliveryRate: 98.3,
          openRate: 71.2,
          clickRate: 30.0
        },
        sms: {
          sent: 50,
          delivered: 48,
          opened: 45,
          clicked: 15,
          deliveryRate: 96.0,
          openRate: 93.8,
          clickRate: 31.3
        }
      };
    } catch (error) {
      logger.error('Error getting delivery stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate notification performance report
   */
  static async generatePerformanceReport(userId = null, days = 30) {
    try {
      const report = {
        period: `Last ${days} days`,
        generatedAt: new Date(),
        userId: userId
      };

      if (userId) {
        // User-specific report
        report.userStats = await this.getUserNotificationStats(userId, days);
        report.userPreferences = await NotificationPreferences.getUserPreferences(userId);
      } else {
        // Global report
        report.globalStats = await this.getGlobalNotificationStats(days);
        report.preferencesStats = await this.getPreferencesStats();
        report.deliveryStats = await this.getDeliveryStats(days);
      }

      return report;
    } catch (error) {
      logger.error('Error generating performance report', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get most effective notification times for a user
   */
  static async getOptimalNotificationTimes(userId) {
    try {
      const hourlyStats = await Notification.aggregate([
        {
          $match: {
            user: userId,
            read: true,
            readAt: { $exists: true }
          }
        },
        {
          $project: {
            hour: { $hour: '$readAt' },
            timeToRead: { $subtract: ['$readAt', '$createdAt'] }
          }
        },
        {
          $group: {
            _id: '$hour',
            count: { $sum: 1 },
            avgTimeToRead: { $avg: '$timeToRead' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      const recommendations = hourlyStats.slice(0, 3).map(stat => ({
        hour: stat._id,
        timeLabel: this.formatHourLabel(stat._id),
        readCount: stat.count,
        avgTimeToRead: Math.round(stat.avgTimeToRead / (1000 * 60)) // Convert to minutes
      }));

      return {
        optimalTimes: recommendations,
        analysis: this.generateTimeAnalysis(recommendations)
      };
    } catch (error) {
      logger.error('Error getting optimal notification times', { userId, error: error.message });
      return {
        optimalTimes: [],
        analysis: 'Unable to determine optimal times due to insufficient data'
      };
    }
  }

  /**
   * Format hour to readable label
   */
  static formatHourLabel(hour) {
    const period = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  /**
   * Generate time analysis text
   */
  static generateTimeAnalysis(recommendations) {
    if (recommendations.length === 0) {
      return 'No data available for analysis';
    }

    const topTime = recommendations[0];
    let analysis = `You're most responsive to notifications around ${topTime.timeLabel}, `;
    
    if (topTime.avgTimeToRead < 5) {
      analysis += 'typically reading them within 5 minutes.';
    } else if (topTime.avgTimeToRead < 30) {
      analysis += 'usually reading them within 30 minutes.';
    } else {
      analysis += 'though it may take longer to respond.';
    }

    return analysis;
  }
}

module.exports = NotificationAnalytics;
