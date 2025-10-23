const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  profilePicture: {
    type: String,
    default: ''
  },
  examTypes: {
    type: [String],
    required: [true, 'Please specify at least one exam type'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Please select at least one exam type'
    },
    enum: ['UPSC', 'SSC', 'Banking', 'Railway', 'State PSC', 'Defense', 'Teaching', 'Other']
  },
  examDate: {
    type: Date,
    required: [true, 'Please provide exam date']
  },
  targetScore: {
    type: Number,
    min: 0,
    max: 100
  },
  studyPreferences: {
    dailyStudyHours: {
      type: Number,
      default: 6,
      min: 1,
      max: 16
    },
    preferredSubjects: [{
      type: String,
      trim: true
    }],
    studyTimeSlots: [{
      startTime: String,
      endTime: String,
      label: String
    }],
    breakDuration: {
      type: Number,
      default: 15,
      min: 5,
      max: 60
    }
  },
  progressStats: {
    totalStudyHours: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    totalGoalsCompleted: {
      type: Number,
      default: 0
    },
    totalBooksRead: {
      type: Number,
      default: 0
    },
    lastStudyDate: {
      type: Date
    }
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    dailyReminder: {
      type: Boolean,
      default: true
    },
    weeklyReport: {
      type: Boolean,
      default: true
    },
    goalDeadline: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  isEmailVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
