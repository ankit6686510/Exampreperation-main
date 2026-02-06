const cron = require('node-cron');
const StudyRoom = require('../models/StudyRoom');
const logger = require('../config/logger');
const { sendStudyRoomReminder } = require('../controllers/notificationController');

let reminderJob = null;

const scheduleStudyRoomReminders = () => {
  if (reminderJob) {
    reminderJob.stop();
  }

  reminderJob = cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const reminderTime = new Date(now.getTime() + 15 * 60 * 1000);
      const reminderWindowEnd = new Date(now.getTime() + 16 * 60 * 1000);

      const upcomingRooms = await StudyRoom.find({
        sessionStatus: 'scheduled',
        'scheduledTime.start': {
          $gte: reminderTime,
          $lt: reminderWindowEnd
        },
        reminderSent: { $ne: true }
      }).populate('participants.user', 'name email');

      for (const room of upcomingRooms) {
        const registeredParticipants = room.participants.filter(
          p => p.status === 'registered' || p.status === 'joined'
        );

        if (registeredParticipants.length > 0) {
          await sendStudyRoomReminder(room._id, room, registeredParticipants);
          
          room.reminderSent = true;
          await room.save();
          
          logger.info('Study room reminder sent', {
            roomId: room._id,
            roomName: room.name,
            participantCount: registeredParticipants.length,
            scheduledTime: room.scheduledTime.start
          });
        }
      }
    } catch (error) {
      logger.error('Error in study room reminder scheduler', { error: error.message });
    }
  });

  logger.info('Study room reminder scheduler started');
};

const stopScheduler = () => {
  if (reminderJob) {
    reminderJob.stop();
    logger.info('Study room reminder scheduler stopped');
  }
};

module.exports = {
  scheduleStudyRoomReminders,
  stopScheduler
};