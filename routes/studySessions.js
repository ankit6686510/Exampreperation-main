const express = require('express');
const {
  createStudySession,
  getStudySessions,
  getStudySession,
  updateStudySession,
  deleteStudySession,
  getStudyAnalytics
} = require('../controllers/studySessionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .post(createStudySession)
  .get(getStudySessions);

router.get('/analytics', getStudyAnalytics);

router.route('/:id')
  .get(getStudySession)
  .put(updateStudySession)
  .delete(deleteStudySession);

module.exports = router;
