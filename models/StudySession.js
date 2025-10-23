const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Please provide subject'],
    trim: true,
    maxlength: [50, 'Subject cannot be more than 50 characters']
  },
  topic: {
    type: String,
    trim: true,
    maxlength: [100, 'Topic cannot be more than 100 characters']
  },
  startTime: {
    type: Date,
    required: [true, 'Please provide start time']
  },
  endTime: {
    type: Date,
    required: [true, 'Please provide end time']
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  sessionType: {
    type: String,
    enum: ['Reading', 'Practice', 'Revision', 'Test', 'Notes'],
    default: 'Reading'
  },
  productivity: {
    type: Number, // 1-5 rating
    min: 1,
    max: 5,
    default: 3
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  breaksTaken: {
    type: Number,
    default: 0,
    min: 0
  },
  completed: {
    type: Boolean,
    default: true
  },
  mood: {
    type: String,
    enum: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'],
    default: 'Good'
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate duration
studySessionSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60)); // Convert to minutes
  }
  next();
});

// Index for better query performance
studySessionSchema.index({ user: 1, startTime: -1 });
studySessionSchema.index({ user: 1, subject: 1, startTime: -1 });

module.exports = mongoose.model('StudySession', studySessionSchema);
