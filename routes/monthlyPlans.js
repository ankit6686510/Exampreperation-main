const express = require('express');
const {
  getMonthlyPlans,
  getMonthlyPlan,
  createMonthlyPlan,
  updateMonthlyPlan,
  updateProgress,
  deleteMonthlyPlan,
  getMonthlyStats,
  syncWithCalendar
} = require('../controllers/monthlyPlanController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

router
  .route('/')
  .get(getMonthlyPlans)
  .post(createMonthlyPlan);

router.get('/stats', getMonthlyStats);
router.post('/calendar-sync', syncWithCalendar);

router
  .route('/:id')
  .get(getMonthlyPlan)
  .put(updateMonthlyPlan)
  .delete(deleteMonthlyPlan);

router.patch('/:id/progress', updateProgress);

module.exports = router;
