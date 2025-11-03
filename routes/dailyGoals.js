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
const { dailyGoalValidations, queryValidations } = require('../middleware/validation');

const router = express.Router();

// Protect all routes
router.use(protect);

router
  .route('/')
  .get(queryValidations.pagination, getDailyGoals)
  .post(dailyGoalValidations.create, createDailyGoal);

router.delete('/:goalId', dailyGoalValidations.update, deleteDailyGoal);

// Task specific routes
router.patch('/:goalId/tasks/:taskId', updateTaskStatus);
router.post('/:goalId/tasks', addTask);
router.delete('/:goalId/tasks/:taskId', deleteTask);

module.exports = router;
