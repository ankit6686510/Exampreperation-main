const DailyGoal = require('../models/DailyGoal');

// @desc    Get daily goals as individual tasks (simplified for frontend)
// @route   GET /api/daily-goals?date=YYYY-MM-DD
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

    // Return individual tasks as separate goals
    const tasks = dailyGoal ? dailyGoal.tasks.map(task => ({
      id: task._id,
      task: task.task,
      completed: task.completed,
      date: date,
      createdAt: task.createdAt || dailyGoal.createdAt
    })) : [];

    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Get daily goals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add a single daily goal
// @route   POST /api/daily-goals
// @access  Private
const addDailyGoal = async (req, res) => {
  try {
    const { task, date } = req.body;

    if (!task || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide task and date'
      });
    }

    const goalDate = new Date(date);
    
    // Find or create daily goal for this date
    let dailyGoal = await DailyGoal.findOne({
      user: req.user.id,
      date: goalDate
    });

    if (!dailyGoal) {
      dailyGoal = await DailyGoal.create({
        user: req.user.id,
        date: goalDate,
        tasks: []
      });
    }

    // Add new task
    dailyGoal.tasks.push({
      task,
      completed: false
    });

    await dailyGoal.save();

    // Return the newly added task
    const newTask = dailyGoal.tasks[dailyGoal.tasks.length - 1];
    const responseTask = {
      id: newTask._id,
      task: newTask.task,
      completed: newTask.completed,
      date: date,
      createdAt: newTask.createdAt
    };

    res.status(201).json({
      success: true,
      data: responseTask
    });
  } catch (error) {
    console.error('Add daily goal error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Toggle daily goal completion
// @route   PATCH /api/daily-goals/:taskId/toggle
// @access  Private
const toggleDailyGoal = async (req, res) => {
  try {
    const { taskId } = req.params;

    const dailyGoal = await DailyGoal.findOne({
      user: req.user.id,
      'tasks._id': taskId
    });

    if (!dailyGoal) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Find and toggle the task
    const task = dailyGoal.tasks.id(taskId);
    task.completed = !task.completed;
    
    await dailyGoal.save();

    // Return the updated task
    const responseTask = {
      id: task._id,
      task: task.task,
      completed: task.completed,
      date: dailyGoal.date.toISOString().split('T')[0],
      createdAt: task.createdAt
    };

    res.status(200).json({
      success: true,
      data: responseTask
    });
  } catch (error) {
    console.error('Toggle daily goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete daily goal
// @route   DELETE /api/daily-goals/:taskId
// @access  Private
const deleteDailyGoal = async (req, res) => {
  try {
    const { taskId } = req.params;

    const dailyGoal = await DailyGoal.findOne({
      user: req.user.id,
      'tasks._id': taskId
    });

    if (!dailyGoal) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Remove the task
    dailyGoal.tasks.pull(taskId);
    await dailyGoal.save();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
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
  addDailyGoal,
  toggleDailyGoal,
  deleteDailyGoal
};
