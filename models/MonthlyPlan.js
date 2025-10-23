const mongoose = require('mongoose');

const monthlyPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: [true, 'Please provide month'],
    min: [1, 'Month must be between 1-12'],
    max: [12, 'Month must be between 1-12']
  },
  year: {
    type: Number,
    required: [true, 'Please provide year'],
    min: [2020, 'Year must be valid']
  },
  subject: {
    type: String,
    required: [true, 'Please provide subject'],
    trim: true,
    maxlength: [50, 'Subject cannot be more than 50 characters']
  },
  targetType: {
    type: String,
    enum: ['pages', 'chapters', 'topics', 'hours'],
    required: [true, 'Please specify target type'],
    default: 'chapters'
  },
  targetAmount: {
    type: Number,
    required: [true, 'Please provide target amount'],
    min: [1, 'Target amount must be at least 1']
  },
  completedAmount: {
    type: Number,
    default: 0,
    min: [0, 'Completed amount cannot be negative']
  },
  deadline: {
    type: Date,
    required: [true, 'Please provide deadline']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Description cannot be more than 300 characters']
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'Paused'],
    default: 'Not Started'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for progress percentage
monthlyPlanSchema.virtual('progressPercentage').get(function() {
  return Math.round((this.completedAmount / this.targetAmount) * 100);
});

// Auto-update status based on progress
monthlyPlanSchema.pre('save', function(next) {
  if (this.completedAmount > this.targetAmount) {
    this.completedAmount = this.targetAmount;
  }
  
  if (this.completedAmount === 0) {
    this.status = 'Not Started';
  } else if (this.completedAmount === this.targetAmount) {
    this.status = 'Completed';
  } else if (this.completedAmount > 0) {
    this.status = 'In Progress';
  }
  
  next();
});

// Compound index for user, month, year, and subject
monthlyPlanSchema.index({ user: 1, month: 1, year: 1, subject: 1 });

module.exports = mongoose.model('MonthlyPlan', monthlyPlanSchema);
