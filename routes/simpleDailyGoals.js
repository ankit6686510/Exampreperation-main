const express = require('express');
const {
  getDailyGoals,
  addDailyGoal,
  toggleDailyGoal,
  deleteDailyGoal
} = require('../controllers/simpleDailyGoalController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

router
  .route('/')
  .get(getDailyGoals)
  .post(addDailyGoal);

router.patch('/:taskId/toggle', toggleDailyGoal);
router.delete('/:taskId', deleteDailyGoal);

module.exports = router;
