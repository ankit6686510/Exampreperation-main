const express = require('express');
const router = express.Router();
const {
  getPreferences,
  updatePreferences,
  subscribeToPush,
  unsubscribeFromPush,
  getVapidPublicKey,
  testNotification,
  unsubscribeEmail,
  getNotificationStats,
  resetPreferences,
  bulkUpdatePreferences
} = require('../controllers/notificationPreferencesController');
const { protect } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// Notification preferences routes
router.get('/', getPreferences);
router.put('/', updatePreferences);
router.post('/bulk-update', bulkUpdatePreferences);
router.post('/reset', resetPreferences);

// Push notification routes
router.post('/push/subscribe', subscribeToPush);
router.post('/push/unsubscribe', unsubscribeFromPush);
router.get('/push/vapid-key', getVapidPublicKey);

// Testing and analytics routes
router.post('/test', testNotification);
router.get('/stats', getNotificationStats);

// Email unsubscribe (doesn't require auth as it uses token)
router.get('/email/unsubscribe', unsubscribeEmail);

module.exports = router;
