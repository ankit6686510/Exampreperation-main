const Notification = require('../models/Notification');
const NotificationPreferences = require('../models/NotificationPreferences');
const PushNotificationService = require('../services/pushNotificationService');
const EmailNotificationService = require('../services/emailNotificationService');
const logger = require('../config/logger');
const { emitToUser } = require('../config/socket');

exports.getNotifications = async (req, res) => {
  try {
    const {
      limit = 20,
      skip = 0,
      unreadOnly = false,
      types
    } = req.query;

    const options = {
      limit: parseInt(limit),
      skip: parseInt(skip),
      unreadOnly: unreadOnly === 'true',
      types: types ? types.split(',') : null
    };

    const result = await Notification.getUserNotifications(req.user.id, options);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching notifications', { userId: req.user.id, error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      read: false
    });

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    logger.error('Error fetching unread count', { userId: req.user.id, error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: 'notificationIds must be an array'
      });
    }

    const result = await Notification.markAsRead(notificationIds, req.user.id);

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    logger.error('Error marking notifications as read', { userId: req.user.id, error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    logger.error('Error marking all notifications as read', { userId: req.user.id, error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting notification', { userId: req.user.id, error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

exports.createNotification = async (userId, notificationData) => {
  try {
    const notification = await Notification.createNotification(userId, notificationData);
    
    emitToUser(userId, 'new-notification', {
      notification: notification.toObject()
    });
    
    logger.info('Notification created', { userId, type: notificationData.type });
    
    return notification;
  } catch (error) {
    logger.error('Error creating notification', { userId, error: error.message });
    throw error;
  }
};

exports.createBulkNotifications = async (userIds, notificationData) => {
  try {
    const notifications = await Notification.createBulkNotifications(userIds, notificationData);
    
    userIds.forEach(userId => {
      emitToUser(userId, 'new-notification', {
        notification: notificationData
      });
    });
    
    logger.info('Bulk notifications created', { count: userIds.length, type: notificationData.type });
    
    return notifications;
  } catch (error) {
    logger.error('Error creating bulk notifications', { error: error.message });
    throw error;
  }
};

exports.sendStudyRoomReminder = async (roomId, roomData, participants) => {
  try {
    const userIds = participants.map(p => p.user);
    
    await exports.createBulkNotifications(userIds, {
      type: 'study_room_reminder',
      title: 'Study Room Starting Soon',
      message: `"${roomData.name}" starts in 15 minutes`,
      data: {
        roomId,
        metadata: {
          scheduledTime: roomData.scheduledTime.start
        }
      },
      priority: 'high',
      actionUrl: `/study-rooms/${roomId}`,
      expiresAt: new Date(roomData.scheduledTime.start)
    });
    
    logger.info('Study room reminders sent', { roomId, participantCount: userIds.length });
  } catch (error) {
    logger.error('Error sending study room reminders', { roomId, error: error.message });
  }
};

exports.sendSessionStartNotification = async (roomId, roomData, participants) => {
  try {
    const userIds = participants.map(p => p.user);
    
    await exports.createBulkNotifications(userIds, {
      type: 'study_room_started',
      title: 'Study Session Started',
      message: `"${roomData.name}" has started. Join now!`,
      data: {
        roomId
      },
      priority: 'high',
      actionUrl: `/study-rooms/${roomId}`
    });
    
    logger.info('Session start notifications sent', { roomId, participantCount: userIds.length });
  } catch (error) {
    logger.error('Error sending session start notifications', { roomId, error: error.message });
  }
};

exports.sendPomodoroNotification = async (roomId, phase, participants) => {
  try {
    const userIds = participants.map(p => p.user);
    
    const messages = {
      'work': 'Time to focus! Work phase started.',
      'short-break': 'Take a short break! You earned it.',
      'long-break': 'Long break time! Relax and recharge.'
    };
    
    await exports.createBulkNotifications(userIds, {
      type: phase === 'work' ? 'pomodoro_work' : 'pomodoro_break',
      title: `Pomodoro: ${phase.replace('-', ' ').toUpperCase()}`,
      message: messages[phase] || 'Phase changed',
      data: {
        roomId,
        metadata: { phase }
      },
      priority: 'medium',
      actionUrl: `/study-rooms/${roomId}`
    });
    
    logger.info('Pomodoro notifications sent', { roomId, phase, participantCount: userIds.length });
  } catch (error) {
    logger.error('Error sending pomodoro notifications', { roomId, error: error.message });
  }
};

module.exports = exports;
