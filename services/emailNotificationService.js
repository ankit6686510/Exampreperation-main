const nodemailer = require('nodemailer');
const NotificationPreferences = require('../models/NotificationPreferences');
const logger = require('../config/logger');
const path = require('path');
const fs = require('fs').promises;

class EmailNotificationService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  /**
   * Initialize email transporter
   */
  async init() {
    try {
      // Use Gmail SMTP (free with Gmail account)
      // For production, consider using services like SendGrid, Mailgun, or AWS SES
      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'your-email@gmail.com',
          pass: process.env.EMAIL_APP_PASSWORD || 'your-app-password' // Use App Password, not regular password
        }
      });

      // Alternative configuration for other SMTP services
      if (process.env.SMTP_HOST) {
        this.transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
      }

      // Verify connection
      await this.transporter.verify();
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service', { error: error.message });
      this.transporter = null;
    }
  }

  /**
   * Load email template
   */
  async loadTemplate(templateName) {
    try {
      const templatePath = path.join(__dirname, '../templates/email', `${templateName}.html`);
      const template = await fs.readFile(templatePath, 'utf-8');
      return template;
    } catch (error) {
      logger.warn(`Email template not found: ${templateName}`, { error: error.message });
      return this.getDefaultTemplate();
    }
  }

  /**
   * Get default email template
   */
  getDefaultTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{subject}}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px 20px; }
        .notification { background: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .notification h2 { margin: 0 0 10px 0; color: #667eea; font-size: 18px; }
        .notification p { margin: 0; color: #666; }
        .action-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        .action-button:hover { background: #5a6fd8; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; border-top: 1px solid #eee; }
        .footer a { color: #667eea; text-decoration: none; }
        .priority-urgent { border-left-color: #dc2626; }
        .priority-high { border-left-color: #ea580c; }
        .priority-medium { border-left-color: #0284c7; }
        .priority-low { border-left-color: #65a30d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 ExamPrep Notifications</h1>
        </div>
        <div class="content">
            <div class="notification priority-{{priority}}">
                <h2>{{title}}</h2>
                <p>{{message}}</p>
                {{#if actionUrl}}
                <a href="{{baseUrl}}{{actionUrl}}" class="action-button">Take Action</a>
                {{/if}}
            </div>
            {{#if additionalContent}}
            <div style="margin-top: 20px;">
                {{additionalContent}}
            </div>
            {{/if}}
        </div>
        <div class="footer">
            <p>You're receiving this because you subscribed to ExamPrep notifications.</p>
            <p><a href="{{baseUrl}}/profile/notifications">Manage your notification preferences</a> | <a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Replace template variables
   */
  replaceTemplateVariables(template, variables) {
    let result = template;
    
    // Simple template replacement (can be enhanced with Handlebars if needed)
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    });
    
    // Handle conditional blocks
    result = result.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, condition, content) => {
      return variables[condition] ? content : '';
    });
    
    return result;
  }

  /**
   * Send email notification to a single user
   */
  async sendToUser(userId, notification, userEmail) {
    try {
      if (!this.transporter) {
        logger.warn('Email service not available');
        return { success: false, reason: 'service_unavailable' };
      }

      const preferences = await NotificationPreferences.getUserPreferences(userId);
      
      if (!preferences.shouldSendNotification(notification.type, 'email')) {
        logger.debug('Email notification blocked by user preferences', { userId, type: notification.type });
        return { success: false, reason: 'blocked_by_preferences' };
      }

      const template = await this.loadTemplate(notification.type);
      const baseUrl = process.env.CLIENT_URL || 'http://localhost:8080';
      const unsubscribeUrl = `${baseUrl}/unsubscribe?userId=${userId}&token=${this.generateUnsubscribeToken(userId)}`;
      
      const templateVariables = {
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        actionUrl: notification.actionUrl,
        baseUrl,
        unsubscribeUrl,
        subject: notification.title,
        additionalContent: this.getAdditionalContent(notification.type, notification.data)
      };

      const htmlContent = this.replaceTemplateVariables(template, templateVariables);
      
      const mailOptions = {
        from: {
          name: 'ExamPrep Study Platform',
          address: process.env.EMAIL_FROM || process.env.EMAIL_USER
        },
        to: userEmail,
        subject: this.getSubjectLine(notification),
        html: htmlContent,
        text: this.generateTextVersion(notification),
        headers: {
          'X-Notification-Type': notification.type,
          'X-Priority': notification.priority === 'urgent' ? '1' : notification.priority === 'high' ? '2' : '3'
        }
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email notification sent successfully', { 
        userId, 
        email: userEmail,
        type: notification.type,
        messageId: result.messageId 
      });
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Error sending email notification', { 
        userId, 
        email: userEmail,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Send email notifications to multiple users
   */
  async sendToUsers(userIds, notification, getUserEmail) {
    const results = [];
    
    for (const userId of userIds) {
      try {
        const userEmail = await getUserEmail(userId);
        if (!userEmail) {
          results.push({ userId, success: false, reason: 'no_email' });
          continue;
        }
        
        const result = await this.sendToUser(userId, notification, userEmail);
        results.push({ userId, email: userEmail, ...result });
      } catch (error) {
        results.push({ 
          userId, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    logger.info('Bulk email notifications sent', { 
      total: userIds.length, 
      successful: successCount,
      failed: userIds.length - successCount
    });
    
    return results;
  }

  /**
   * Send study room reminder email
   */
  async sendStudyRoomReminder(roomId, roomData, participants, getUserEmail) {
    const userIds = participants.map(p => p.user);
    const notification = {
      type: 'study_room_reminder',
      title: 'Study Room Starting Soon',
      message: `Your study session "${roomData.name}" is starting in 15 minutes. Make sure you're ready to join!`,
      priority: 'high',
      actionUrl: `/study-rooms/${roomId}`,
      data: {
        roomName: roomData.name,
        scheduledTime: roomData.scheduledTime.start,
        participantCount: participants.length
      }
    };

    return await this.sendToUsers(userIds, notification, getUserEmail);
  }

  /**
   * Send weekly digest email
   */
  async sendWeeklyDigest(userId, digestData, userEmail) {
    const notification = {
      type: 'weekly_digest',
      title: 'Your Weekly Study Summary',
      message: 'Here\'s a summary of your study activities this week.',
      priority: 'low',
      actionUrl: '/dashboard',
      data: digestData
    };

    return await this.sendToUser(userId, notification, userEmail);
  }

  /**
   * Send achievement email
   */
  async sendAchievementNotification(userId, achievement, userEmail) {
    const notification = {
      type: 'achievement_unlocked',
      title: 'Congratulations! Achievement Unlocked',
      message: `You've earned a new achievement: "${achievement.title}". Keep up the great work!`,
      priority: 'medium',
      actionUrl: '/achievements',
      data: achievement
    };

    return await this.sendToUser(userId, notification, userEmail);
  }

  /**
   * Generate subject line based on notification type and priority
   */
  getSubjectLine(notification) {
    const priorityPrefixes = {
      urgent: '🚨 URGENT: ',
      high: '⚡ ',
      medium: '📚 ',
      low: ''
    };

    const prefix = priorityPrefixes[notification.priority] || '';
    return `${prefix}${notification.title}`;
  }

  /**
   * Generate plain text version of email
   */
  generateTextVersion(notification) {
    let text = `${notification.title}\n\n${notification.message}\n\n`;
    
    if (notification.actionUrl) {
      const baseUrl = process.env.CLIENT_URL || 'http://localhost:8080';
      text += `Take action: ${baseUrl}${notification.actionUrl}\n\n`;
    }
    
    text += '---\n';
    text += 'ExamPrep Study Platform\n';
    text += 'Manage your notification preferences: ' + (process.env.CLIENT_URL || 'http://localhost:8080') + '/profile/notifications';
    
    return text;
  }

  /**
   * Get additional content based on notification type
   */
  getAdditionalContent(type, data) {
    switch (type) {
      case 'study_room_reminder':
        return data ? `
          <div style="margin-top: 15px; padding: 15px; background: #f0f9ff; border-radius: 6px;">
            <h3 style="margin: 0 0 10px 0; color: #0284c7;">Session Details</h3>
            <p><strong>Room:</strong> ${data.roomName}</p>
            <p><strong>Start Time:</strong> ${new Date(data.scheduledTime).toLocaleString()}</p>
            <p><strong>Participants:</strong> ${data.participantCount} members</p>
          </div>
        ` : '';
      
      case 'weekly_digest':
        return data ? `
          <div style="margin-top: 15px;">
            <h3 style="color: #667eea;">This Week's Stats</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 15px 0;">
              <div style="text-align: center; padding: 15px; background: #f0f9ff; border-radius: 6px;">
                <div style="font-size: 24px; font-weight: bold; color: #667eea;">${data.studyHours || 0}</div>
                <div style="color: #666; font-size: 14px;">Study Hours</div>
              </div>
              <div style="text-align: center; padding: 15px; background: #f0fdf4; border-radius: 6px;">
                <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${data.completedSessions || 0}</div>
                <div style="color: #666; font-size: 14px;">Sessions</div>
              </div>
              <div style="text-align: center; padding: 15px; background: #fefce8; border-radius: 6px;">
                <div style="font-size: 24px; font-weight: bold; color: #ca8a04;">${data.achievements || 0}</div>
                <div style="color: #666; font-size: 14px;">New Achievements</div>
              </div>
            </div>
          </div>
        ` : '';
      
      case 'achievement_unlocked':
        return data ? `
          <div style="margin-top: 15px; padding: 20px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 8px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
            <h3 style="margin: 0; color: #92400e;">${data.title}</h3>
            <p style="margin: 10px 0 0 0; color: #a16207;">${data.description}</p>
          </div>
        ` : '';
      
      default:
        return '';
    }
  }

  /**
   * Generate unsubscribe token (simple version - enhance for production)
   */
  generateUnsubscribeToken(userId) {
    const crypto = require('crypto');
    const secret = process.env.JWT_SECRET || 'default-secret';
    return crypto.createHmac('sha256', secret).update(userId.toString()).digest('hex').substring(0, 16);
  }

  /**
   * Verify unsubscribe token
   */
  verifyUnsubscribeToken(userId, token) {
    const expectedToken = this.generateUnsubscribeToken(userId);
    return token === expectedToken;
  }

  /**
   * Handle unsubscribe request
   */
  async handleUnsubscribe(userId, token) {
    try {
      if (!this.verifyUnsubscribeToken(userId, token)) {
        return { success: false, reason: 'invalid_token' };
      }

      const preferences = await NotificationPreferences.getUserPreferences(userId);
      preferences.emailNotifications.enabled = false;
      await preferences.save();

      logger.info('User unsubscribed from email notifications', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Error handling unsubscribe', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  async testConfiguration() {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      await this.transporter.verify();
      return { success: true, message: 'Email configuration is working' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new EmailNotificationService();
