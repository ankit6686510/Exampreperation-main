const MonthlyPlan = require('../models/MonthlyPlan');

// @desc    Get monthly plans for user
// @route   GET /api/goals/monthly?month=MM&year=YYYY
// @access  Private
const getMonthlyPlans = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let query = { user: req.user.id };
    
    if (month && year) {
      query.month = parseInt(month);
      query.year = parseInt(year);
    }

    const monthlyPlans = await MonthlyPlan.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: monthlyPlans.length,
      data: monthlyPlans
    });
  } catch (error) {
    console.error('Get monthly plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single monthly plan
// @route   GET /api/goals/monthly/:id
// @access  Private
const getMonthlyPlan = async (req, res) => {
  try {
    const monthlyPlan = await MonthlyPlan.findById(req.params.id);

    if (!monthlyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Monthly plan not found'
      });
    }

    // Check if plan belongs to user
    if (monthlyPlan.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this plan'
      });
    }

    res.status(200).json({
      success: true,
      data: monthlyPlan
    });
  } catch (error) {
    console.error('Get monthly plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new monthly plan
// @route   POST /api/goals/monthly
// @access  Private
const createMonthlyPlan = async (req, res) => {
  try {
    const {
      month,
      year,
      subject,
      targetType,
      targetAmount,
      deadline,
      description,
      priority
    } = req.body;

    const monthlyPlan = await MonthlyPlan.create({
      user: req.user.id,
      month,
      year,
      subject,
      targetType,
      targetAmount,
      deadline,
      description,
      priority
    });

    res.status(201).json({
      success: true,
      data: monthlyPlan
    });
  } catch (error) {
    console.error('Create monthly plan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update monthly plan
// @route   PUT /api/goals/monthly/:id
// @access  Private
const updateMonthlyPlan = async (req, res) => {
  try {
    let monthlyPlan = await MonthlyPlan.findById(req.params.id);

    if (!monthlyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Monthly plan not found'
      });
    }

    // Check if plan belongs to user
    if (monthlyPlan.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this plan'
      });
    }

    monthlyPlan = await MonthlyPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: monthlyPlan
    });
  } catch (error) {
    console.error('Update monthly plan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update monthly plan progress
// @route   PATCH /api/goals/monthly/:id/progress
// @access  Private
const updateProgress = async (req, res) => {
  try {
    const { completedAmount } = req.body;

    const monthlyPlan = await MonthlyPlan.findById(req.params.id);

    if (!monthlyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Monthly plan not found'
      });
    }

    // Check if plan belongs to user
    if (monthlyPlan.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this plan'
      });
    }

    monthlyPlan.completedAmount = completedAmount;
    await monthlyPlan.save();

    res.status(200).json({
      success: true,
      data: monthlyPlan
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete monthly plan
// @route   DELETE /api/goals/monthly/:id
// @access  Private
const deleteMonthlyPlan = async (req, res) => {
  try {
    const monthlyPlan = await MonthlyPlan.findById(req.params.id);

    if (!monthlyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Monthly plan not found'
      });
    }

    // Check if plan belongs to user
    if (monthlyPlan.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this plan'
      });
    }

    await MonthlyPlan.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Monthly plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete monthly plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get monthly stats
// @route   GET /api/goals/monthly/stats?month=MM&year=YYYY
// @access  Private
const getMonthlyStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Please provide month and year'
      });
    }

    const plans = await MonthlyPlan.find({
      user: req.user.id,
      month: parseInt(month),
      year: parseInt(year)
    });

    const stats = {
      totalPlans: plans.length,
      completedPlans: plans.filter(plan => plan.status === 'Completed').length,
      inProgressPlans: plans.filter(plan => plan.status === 'In Progress').length,
      notStartedPlans: plans.filter(plan => plan.status === 'Not Started').length,
      pausedPlans: plans.filter(plan => plan.status === 'Paused').length,
      overallProgress: plans.length > 0 
        ? Math.round(plans.reduce((acc, plan) => acc + plan.progressPercentage, 0) / plans.length)
        : 0
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get monthly stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Placeholder for Google Calendar integration
// @route   POST /api/goals/monthly/calendar-sync
// @access  Private
const syncWithCalendar = async (req, res) => {
  try {
    // Placeholder for future Google Calendar integration
    res.status(501).json({
      success: false,
      message: 'Google Calendar integration coming soon'
    });
  } catch (error) {
    console.error('Calendar sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getMonthlyPlans,
  getMonthlyPlan,
  createMonthlyPlan,
  updateMonthlyPlan,
  updateProgress,
  deleteMonthlyPlan,
  getMonthlyStats,
  syncWithCalendar
};
