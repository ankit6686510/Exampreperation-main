const express = require('express');
const {
  getProgressSettings,
  updateProgressSettings,
  getGroupProgressDashboard,
  getGroupLeaderboards,
  requestStudyPartnership,
  respondToPartnership,
  getStudyPartners
} = require('../controllers/groupProgressController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Progress sharing settings routes
router.route('/:groupId/progress-settings')
  .get(getProgressSettings)
  .put(updateProgressSettings);

// Group progress dashboard
router.get('/:groupId/progress-dashboard', getGroupProgressDashboard);

// Group leaderboards
router.get('/:groupId/leaderboards', getGroupLeaderboards);

// Study partnership routes
router.post('/:groupId/request-partnership', requestStudyPartnership);
router.put('/:groupId/respond-partnership', respondToPartnership);
router.get('/:groupId/study-partners', getStudyPartners);

module.exports = router;
