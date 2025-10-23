const DailyGoal = require('../models/DailyGoal');

// @desc    Get daily goals by date
// @route   GET /api/goals/daily?date=YYYY-MM-DD
// @access  Private
const getDailyGoals = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a date in YYYY-MM-DD format'
      });
    }

    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const dailyGoal = await DailyGoal.findOne({
      user: req.user.id,
      date: {
        $gte: startDate,
        $lt: endDate
      }
    });

    res.status(200).json({
      success: true,
      data: dailyGoal
    });
  } catch (error) {
    console.error('Get daily goals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create or update daily goals
// @route   POST /api/goals/daily
// @access  Private
const createDailyGoal = async (req, res) => {
  try {
    const { date, tasks, notes, totalStudyTime } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a date'
      });
    }

    const goalDate = new Date(date);
    
    // Check if daily goal already exists for this date
    let dailyGoal = await DailyGoal.findOne({
      user: req.user.id,
      date: goalDate
    });

    if (dailyGoal) {
      // Update existing goal
      dailyGoal.tasks = tasks || dailyGoal.tasks;
      dailyGoal.notes = notes || dailyGoal.notes;
      dailyGoal.totalStudyTime = totalStudyTime || dailyGoal.totalStudyTime;
      
      await dailyGoal.save();
    } else {
      // Create new goal
      dailyGoal = await DailyGoal.create({
        user: req.user.id,
        date: goalDate,
        tasks: tasks || [],
        notes,
        totalStudyTime: totalStudyTime || 0
      });
    }

    res.status(201).json({
      success: true,
      data: dailyGoal
    });
  } catch (error) {
    console.error('Create daily goal error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update task completion status
// @route   PATCH /api/goals/daily/:goalId/tasks/:taskId
// @access  Private
const updateTaskStatus = async (req, res) => {
  try {
    const { goalId, taskId } = req.params;
    const { completed } = req.body;

    const dailyGoal = await DailyGoal.findById(goalId);

    if (!dailyGoal) {
      return res.status(404).json({
        success: false,
        message: 'Daily goal not found'
      });
    }

    // Check if goal belongs to user
    if (dailyGoal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this goal'
      });
    }

    // Find and update the task
    const task = dailyGoal.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.completed = completed;
    await dailyGoal.save();

    res.status(200).json({
      success: true,
      data: dailyGoal
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add new task to daily goal
// @route   POST /api/goals/daily/:goalId/tasks
// @access  Private
const addTask = async (req, res) => {
  try {
    const { goalId } = req.params;
    const { task, priority, estimatedTime } = req.body;

    const dailyGoal = await DailyGoal.findById(goalId);

    if (!dailyGoal) {
      return res.status(404).json({
        success: false,
        message: 'Daily goal not found'
      });
    }

    // Check if goal belongs to user
    if (dailyGoal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this goal'
      });
    }

    dailyGoal.tasks.push({
      task,
      priority,
      estimatedTime,
      completed: false
    });

    await dailyGoal.save();

    res.status(200).json({
      success: true,
      data: dailyGoal
    });
  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete task from daily goal
// @route   DELETE /api/goals/daily/:goalId/tasks/:taskId
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const { goalId, taskId } = req.params;

    const dailyGoal = await DailyGoal.findById(goalId);

    if (!dailyGoal) {
      return res.status(404).json({
        success: false,
        message: 'Daily goal not found'
      });
    }

    // Check if goal belongs to user
    if (dailyGoal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this goal'
      });
    }

    // Remove the task
    dailyGoal.tasks.pull(taskId);
    await dailyGoal.save();

    res.status(200).json({
      success: true,
      data: dailyGoal
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete daily goal
// @route   DELETE /api/goals/daily/:goalId
// @access  Private
const deleteDailyGoal = async (req, res) => {
  try {
    const dailyGoal = await DailyGoal.findById(req.params.goalId);

    if (!dailyGoal) {
      return res.status(404).json({
        success: false,
        message: 'Daily goal not found'
      });
    }

    // Check if goal belongs to user
    if (dailyGoal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this goal'
      });
    }

    await DailyGoal.findByIdAndDelete(req.params.goalId);

    res.status(200).json({
      success: true,
      message: 'Daily goal deleted successfully'
    });
  } catch (error) {
    console.error('Delete daily goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getDailyGoals,
  createDailyGoal,
  updateTaskStatus,
  addTask,
  deleteTask,
  deleteDailyGoal
};
