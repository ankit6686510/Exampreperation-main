const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  task: {
    type: String,
    required: [true, 'Please provide task description'],
    trim: true,
    maxlength: [200, 'Task description cannot be more than 200 characters']
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  estimatedTime: {
    type: Number, // in minutes
    min: [1, 'Estimated time must be at least 1 minute']
  }
});

const dailyGoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Please provide date'],
    index: true
  },
  tasks: [taskSchema],
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  totalStudyTime: {
    type: Number, // in minutes
    default: 0,
    min: [0, 'Study time cannot be negative']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for completion percentage
dailyGoalSchema.virtual('completionPercentage').get(function() {
  if (this.tasks.length === 0) return 0;
  const completedTasks = this.tasks.filter(task => task.completed).length;
  return Math.round((completedTasks / this.tasks.length) * 100);
});

// Compound index for user and date (unique combination)
dailyGoalSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyGoal', dailyGoalSchema);
