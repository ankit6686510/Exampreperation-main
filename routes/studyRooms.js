const express = require('express');
const {
  createStudyRoom,
  getGroupStudyRooms,
  getStudyRoom,
  joinStudyRoom,
  leaveStudyRoom,
  startStudySession,
  endStudySession,
  nextPomodoroPhase,
  submitSessionFeedback,
  getUserStudyRoomHistory
} = require('../controllers/studyRoomController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Study room CRUD operations
router.post('/', createStudyRoom);
router.get('/my-sessions', getUserStudyRoomHistory);
router.get('/group/:groupId', getGroupStudyRooms);
router.get('/:id', getStudyRoom);

// Study room participation
router.post('/:id/join', joinStudyRoom);
router.post('/:id/leave', leaveStudyRoom);

// Study session management
router.post('/:id/start', startStudySession);
router.post('/:id/end', endStudySession);

// Pomodoro timer control
router.post('/:id/pomodoro/next', nextPomodoroPhase);

// Session feedback
router.post('/:id/feedback', submitSessionFeedback);

module.exports = router;
