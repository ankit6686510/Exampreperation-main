const cron = require('node-cron');
const Notification = require('../models/Notification');
const NotificationPreferences = require('../models/NotificationPreferences');
const PushNotificationService = require('./pushNotificationService');
const EmailNotificationService = require('./emailNotificationService');
const { createNotification, createBulkNotifications } = require('../controllers/notificationController');
const logger = require('../config/logger');
const User = require('../models/User');
const StudyRoom = require('../models/StudyRoom');

class NotificationScheduler {
  constructor() {
    this.scheduledJobs = new Map();
    this.init();
  }

  /**
   * Initialize scheduler with predefined jobs
   */
  init() {
    // Clean up expired notifications every hour
    cron.schedule('0 * * * *', () => {
      this.cleanupExpiredNotifications();
    });

    // Clean up old read notifications daily at 2 AM
    cron.schedule('0 2 * * *', () => {
      this.cleanupOldNotifications();
    });

    // Send weekly digests on Sundays at 9 AM
    cron.schedule('0 9 * * 0', () => {
      this.sendWeeklyDigests();
    });

    // Check for study room reminders every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.checkStudyRoomReminders();
    });

    // Clean up invalid push subscriptions daily
    cron.schedule('0 3 * * *', () => {
      this.cleanupInvalidSubscriptions();
    });

    // Send daily motivation notifications at 8 AM
    cron.schedule('0 8 * * *', () => {
      this.sendDailyMotivation();
    });

    logger.info('Notification scheduler initialized with cron jobs');
  }

  /**
   * Schedule a one-time notification
   */
  async scheduleNotification(userId, notification, scheduledTime) {
    try {
      const jobId = `scheduled_${userId}_${Date.now()}`;
      const delay = new Date(scheduledTime).getTime() - Date.now();

      if (delay <= 0) {
        // If scheduled time is in the past, send immediately
        await createNotification(userId, notification);
        return { success: true, jobId: null, sentImmediately: true };
      }

      const timeoutId = setTimeout(async () => {
        try {
          await createNotification(userId, notification);
          this.scheduledJobs.delete(jobId);
          logger.info('Scheduled notification sent', { userId, jobId });
        } catch (error) {
          logger.error('Error sending scheduled notification', { 
            userId, 
            jobId, 
            error: error.message 
          });
        }
      }, delay);

      this.scheduledJobs.set(jobId, {
        timeoutId,
        userId,
        notification,
        scheduledTime
      });

      logger.info('Notification scheduled', { 
        userId, 
        jobId, 
        scheduledTime, 
        delay: Math.round(delay / 1000) + 's' 
      });

      return { success: true, jobId };
    } catch (error) {
      logger.error('Error scheduling notification', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Schedule bulk notifications
   */
  async scheduleBulkNotifications(userIds, notification, scheduledTime) {
    const results = [];
    
    for (const userId of userIds) {
      try {
        const result = await this.scheduleNotification(userId, notification, scheduledTime);
        results.push({ userId, ...result });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Cancel a scheduled notification
   */
  cancelScheduledNotification(jobId) {
    const job = this.scheduledJobs.get(jobId);
    if (job) {
      clearTimeout(job.timeoutId);
      this.scheduledJobs.delete(jobId);
      logger.info('Scheduled notification cancelled', { jobId });
      return true;
    }
    return false;
  }

  /**
   * Schedule study room reminders
   */
  async scheduleStudyRoomReminders(roomId, roomData, participants) {
    try {
      const startTime = new Date(roomData.scheduledTime.start);
      const reminderTimes = [
        { minutes: 60, label: '1 hour' },
        { minutes: 15, label: '15 minutes' },
        { minutes: 5, label: '5 minutes' }
      ];

      const userIds = participants.map(p => p.user);
      const scheduleResults = [];

      for (const reminder of reminderTimes) {
        const reminderTime = new Date(startTime.getTime() - reminder.minutes * 60 * 1000);
        
        if (reminderTime > new Date()) {
          const notification = {
            type: 'study_room_reminder',
            title: `Study Room Starting in ${reminder.label}`,
            message: `"${roomData.name}" starts in ${reminder.label}. Get ready!`,
            priority: reminder.minutes <= 15 ? 'high' : 'medium',
            actionUrl: `/study-rooms/${roomId}`,
            data: {
              roomId,
              reminderType: `${reminder.minutes}min`,
              scheduledTime: roomData.scheduledTime.start
            },
            expiresAt: startTime
          };

          const results = await this.scheduleBulkNotifications(userIds, notification, reminderTime);
          scheduleResults.push({
            reminderTime: reminderTime,
            minutes: reminder.minutes,
            results
          });
        }
      }

      logger.info('Study room reminders scheduled', { 
        roomId, 
        remindersCount: scheduleResults.length,
        participantsCount: userIds.length 
      });

      return scheduleResults;
    } catch (error) {
      logger.error('Error scheduling study room reminders', { roomId, error: error.message });
      throw error;
    }
  }

  /**
   * Schedule recurring notifications (like daily streaks)
   */
  scheduleRecurringNotification(userId, notification, cronPattern) {
    try {
      const jobId = `recurring_${userId}_${Date.now()}`;
      
      const task = cron.schedule(cronPattern, async () => {
        try {
          await createNotification(userId, notification);
          logger.debug('Recurring notification sent', { userId, jobId });
        } catch (error) {
          logger.error('Error sending recurring notification', { 
            userId, 
            jobId, 
            error: error.message 
          });
        }
      }, {
        scheduled: false
      });

      this.scheduledJobs.set(jobId, {
        task,
        userId,
        notification,
        cronPattern,
        type: 'recurring'
      });

      task.start();

      logger.info('Recurring notification scheduled', { userId, jobId, cronPattern });
      return { success: true, jobId };
    } catch (error) {
      logger.error('Error scheduling recurring notification', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Check for upcoming study room reminders
   */
  async checkStudyRoomReminders() {
    try {
      const now = new Date();
      const reminderTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now

      const upcomingRooms = await StudyRoom.find({
        'scheduledTime.start': {
          $gte: now,
          $lte: reminderTime
        },
        status: 'scheduled'
      }).populate('participants.user', 'email');

      for (const room of upcomingRooms) {
        if (room.participants && room.participants.length > 0) {
          // Check if reminder already sent
          const existingReminder = await Notification.findOne({
            type: 'study_room_reminder',
            'data.roomId': room._id,
            'data.reminderType': '15min',
            createdAt: { $gte: new Date(now.getTime() - 10 * 60 * 1000) } // Last 10 minutes
          });

          if (!existingReminder) {
            const userIds = room.participants.map(p => p.user._id);
            const notification = {
              type: 'study_room_reminder',
              title: 'Study Room Starting Soon',
              message: `"${room.name}" starts in 15 minutes. Get ready!`,
              priority: 'high',
              actionUrl: `/study-rooms/${room._id}`,
              data: {
                roomId: room._id,
                reminderType: '15min'
              }
            };

            await createBulkNotifications(userIds, notification);

            // Send push and email notifications
            for (const participant of room.participants) {
              try {
                await PushNotificationService.sendToUser(participant.user._id, notification);
                if (participant.user.email) {
                  await EmailNotificationService.sendToUser(
                    participant.user._id, 
                    notification, 
                    participant.user.email
                  );
                }
              } catch (error) {
                logger.error('Error sending reminder notification', { 
                  userId: participant.user._id, 
                  error: error.message 
                });
              }
            }

            logger.info('Study room reminder sent', { 
              roomId: room._id, 
              participantsCount: userIds.length 
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error checking study room reminders', { error: error.message });
    }
  }

  /**
   * Send weekly digest notifications
   */
  async sendWeeklyDigests() {
    try {
      const users = await User.find({ 
        'notifications.weeklyDigest': { $ne: false } 
      });

      for (const user of users) {
        try {
          const preferences = await NotificationPreferences.getUserPreferences(user._id);
          
          if (!preferences.emailNotifications.enabled || 
              !preferences.emailNotifications.types.weeklyDigest) {
            continue;
          }

          // Generate weekly stats (you can enhance this with actual data)
          const weeklyStats = await this.generateWeeklyStats(user._id);
          
          if (user.email) {
            await EmailNotificationService.sendWeeklyDigest(user._id, weeklyStats, user.email);
          }

        } catch (error) {
          logger.error('Error sending weekly digest', { 
            userId: user._id, 
            error: error.message 
          });
        }
      }

      logger.info('Weekly digests sent');
    } catch (error) {
      logger.error('Error sending weekly digests', { error: error.message });
    }
  }

  /**
   * Send daily motivation notifications
   */
  async sendDailyMotivation() {
    try {
      const motivationalMessages = [
        "Start your day with purpose! Your studies today bring you closer to your goals. 📚✨",
        "Every small step counts! What will you achieve in your studies today? 🎯",
        "Consistency beats perfection. Your daily effort is building something amazing! 💪",
        "Today is a new opportunity to learn and grow. Make it count! 🌟",
        "Your future self will thank you for the effort you put in today. Keep going! 🚀",
        "Success is not just about the destination, but the daily journey. Happy studying! 📖",
        "Believe in your ability to learn and grow. Today is full of possibilities! ⭐"
      ];

      const users = await User.find({
        'preferences.dailyMotivation': { $ne: false }
      });

      for (const user of users) {
        try {
          const preferences = await NotificationPreferences.getUserPreferences(user._id);
          
          if (!preferences.inAppNotifications.enabled) {
            continue;
          }

          const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
          
          const notification = {
            type: 'general',
            title: 'Daily Motivation 🌅',
            message: randomMessage,
            priority: 'low',
            actionUrl: '/dashboard'
          };

          await createNotification(user._id, notification);

        } catch (error) {
          logger.error('Error sending daily motivation', { 
            userId: user._id, 
            error: error.message 
          });
        }
      }

      logger.info('Daily motivation notifications sent');
    } catch (error) {
      logger.error('Error sending daily motivation', { error: error.message });
    }
  }

  /**
   * Generate weekly stats for a user
   */
  async generateWeeklyStats(userId) {
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      // You can enhance this with actual aggregation from your study sessions
      const stats = {
        studyHours: Math.floor(Math.random() * 20) + 5, // Placeholder
        completedSessions: Math.floor(Math.random() * 10) + 2, // Placeholder
        achievements: Math.floor(Math.random() * 3), // Placeholder
        streak: Math.floor(Math.random() * 7) + 1, // Placeholder
        weekStart: weekStart.toISOString(),
        weekEnd: new Date().toISOString()
      };

      return stats;
    } catch (error) {
      logger.error('Error generating weekly stats', { userId, error: error.message });
      return {
        studyHours: 0,
        completedSessions: 0,
        achievements: 0,
        streak: 0
      };
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications() {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      if (result.deletedCount > 0) {
        logger.info('Expired notifications cleaned up', { count: result.deletedCount });
      }
    } catch (error) {
      logger.error('Error cleaning up expired notifications', { error: error.message });
    }
  }

  /**
   * Clean up old read notifications
   */
  async cleanupOldNotifications() {
    try {
      const result = await Notification.deleteOldNotifications(30); // 30 days
      
      if (result.deletedCount > 0) {
        logger.info('Old notifications cleaned up', { count: result.deletedCount });
      }
    } catch (error) {
      logger.error('Error cleaning up old notifications', { error: error.message });
    }
  }

  /**
   * Clean up invalid push subscriptions
   */
  async cleanupInvalidSubscriptions() {
    try {
      const result = await PushNotificationService.cleanupInvalidSubscriptions();
      
      if (result.cleanedCount > 0) {
        logger.info('Invalid push subscriptions cleaned up', { count: result.cleanedCount });
      }
    } catch (error) {
      logger.error('Error cleaning up invalid subscriptions', { error: error.message });
    }
  }

  /**
   * Get scheduled jobs info
   */
  getScheduledJobs() {
    const jobs = [];
    
    this.scheduledJobs.forEach((job, jobId) => {
      jobs.push({
        jobId,
        userId: job.userId,
        type: job.type || 'one-time',
        scheduledTime: job.scheduledTime,
        cronPattern: job.cronPattern,
        notificationType: job.notification?.type
      });
    });

    return jobs;
  }

  /**
   * Cancel all scheduled jobs for a user
   */
  cancelUserJobs(userId) {
    let cancelledCount = 0;
    
    this.scheduledJobs.forEach((job, jobId) => {
      if (job.userId === userId) {
        if (job.timeoutId) {
          clearTimeout(job.timeoutId);
        }
        if (job.task) {
          job.task.stop();
        }
        this.scheduledJobs.delete(jobId);
        cancelledCount++;
      }
    });

    logger.info('User scheduled jobs cancelled', { userId, count: cancelledCount });
    return cancelledCount;
  }

  /**
   * Stop all scheduled jobs
   */
  shutdown() {
    this.scheduledJobs.forEach((job, jobId) => {
      if (job.timeoutId) {
        clearTimeout(job.timeoutId);
      }
      if (job.task) {
        job.task.stop();
      }
    });

    this.scheduledJobs.clear();
    logger.info('Notification scheduler shut down');
  }
}

// Export singleton instance
module.exports = new NotificationScheduler();
