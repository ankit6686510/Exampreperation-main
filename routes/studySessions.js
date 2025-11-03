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
const { studySessionValidations, queryValidations, commonValidations } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .post(studySessionValidations.create, createStudySession)
  .get(queryValidations.pagination, getStudySessions);

router.get('/analytics', getStudyAnalytics);

router.route('/:id')
  .get(commonValidations.mongoId, getStudySession)
  .put(studySessionValidations.update, updateStudySession)
  .delete(commonValidations.mongoId, deleteStudySession);

module.exports = router;
