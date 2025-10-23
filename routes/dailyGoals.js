const express = require('express');
const {
  getDailyGoals,
  createDailyGoal,
  updateTaskStatus,
  addTask,
  deleteTask,
  deleteDailyGoal
} = require('../controllers/dailyGoalController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

router
  .route('/')
  .get(getDailyGoals)
  .post(createDailyGoal);

router.delete('/:goalId', deleteDailyGoal);

// Task specific routes
router.patch('/:goalId/tasks/:taskId', updateTaskStatus);
router.post('/:goalId/tasks', addTask);
router.delete('/:goalId/tasks/:taskId', deleteTask);

module.exports = router;
