const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
require('dotenv').config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/exam-planner');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Create sample notifications
const createTestNotifications = async () => {
  try {
    console.log('🔔 Creating test notifications...');

    // Find the first user (you)
    const user = await User.findOne().sort({ createdAt: 1 });
    if (!user) {
      console.log('❌ No users found. Please create a user account first.');
      return;
    }

    console.log(`📧 Found user: ${user.email}`);

    // Sample notifications to create
    const notifications = [
      {
        user: user._id,
        type: 'system',
        title: '🎉 Welcome to the Notification System!',
        message: 'This is a test notification to show the system is working perfectly.',
        priority: 'high',
        read: false,
        actionUrl: '/dashboard',
        data: {
          metadata: {
            testType: 'welcome'
          }
        }
      },
      {
        user: user._id,
        type: 'study_reminder',
        title: '📚 Study Session Reminder',
        message: 'You have a study session starting in 15 minutes. Get ready!',
        priority: 'high',
        read: false,
        actionUrl: '/study-sessions',
        data: {
          metadata: {
            sessionType: 'focus',
            duration: 60
          }
        }
      },
      {
        user: user._id,
        type: 'achievement',
        title: '🏆 Achievement Unlocked!',
        message: 'Congratulations! You\'ve completed 5 study sessions this week.',
        priority: 'medium',
        read: false,
        actionUrl: '/profile',
        data: {
          achievementId: 'weekly_sessions_5',
          metadata: {
            sessionsCompleted: 5,
            week: 'current'
          }
        }
      },
      {
        user: user._id,
        type: 'daily_goal',
        title: '⭐ Daily Goal Progress',
        message: 'You\'re 80% complete with today\'s study goals. Keep it up!',
        priority: 'medium',
        read: false,
        actionUrl: '/daily-goals',
        data: {
          metadata: {
            progress: 80,
            remaining: 2
          }
        }
      },
      {
        user: user._id,
        type: 'resource_update',
        title: '📖 New Resource Added',
        message: 'A new study resource "Advanced Mathematics" has been added to your library.',
        priority: 'low',
        read: false,
        actionUrl: '/subjects',
        data: {
          metadata: {
            resourceName: 'Advanced Mathematics',
            category: 'Mathematics'
          }
        }
      },
      {
        user: user._id,
        type: 'pomodoro_break',
        title: '☕ Time for a Break!',
        message: 'Great work! Take a 5-minute break before the next study session.',
        priority: 'medium',
        read: false,
        actionUrl: '/study-rooms',
        data: {
          metadata: {
            breakType: 'short',
            duration: 5
          }
        }
      }
    ];

    // Create notifications one by one
    for (let i = 0; i < notifications.length; i++) {
      const notification = new Notification(notifications[i]);
      await notification.save();
      console.log(`✅ Created: ${notification.title}`);
      
      // Small delay to make them appear in different times
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n🎉 All test notifications created successfully!');
    console.log('\n📋 What to do next:');
    console.log('1. Go to http://localhost:8080');
    console.log('2. Login with your credentials');
    console.log('3. Look for the 🔔 bell icon in the sidebar');
    console.log('4. Click it to see your notifications!');
    console.log('\n🔴 You should see a red badge with "6" on the bell icon');

  } catch (error) {
    console.error('❌ Error creating notifications:', error.message);
  }
};

// Main function
const main = async () => {
  console.log('🚀 Starting notification test script...\n');
  
  await connectDB();
  await createTestNotifications();
  
  console.log('\n✨ Test complete! Check your notification bell in the app.');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

// Run the script
main();
