const mongoose = require('mongoose');

// Chapter schema for detailed tracking
const chapterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Chapter name is required'],
    trim: true,
    maxlength: [200, 'Chapter name cannot be more than 200 characters']
  },
  chapterNumber: {
    type: Number,
    required: true,
    min: [1, 'Chapter number must be at least 1']
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'needs_revision'],
    default: 'not_started'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  timeSpent: {
    type: Number,
    default: 0,
    min: [0, 'Time spent cannot be negative']
  },
  estimatedTime: {
    type: Number,
    default: 0,
    min: [0, 'Estimated time cannot be negative']
  },
  tests: [{
    testName: {
      type: String,
      trim: true,
      maxlength: [100, 'Test name cannot be more than 100 characters']
    },
    score: {
      type: Number,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot be more than 100']
    },
    totalMarks: {
      type: Number,
      min: [1, 'Total marks must be at least 1']
    },
    testDate: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Notes cannot be more than 300 characters']
    }
  }],
  revisions: [{
    revisionDate: {
      type: Date,
      default: Date.now
    },
    timeSpent: {
      type: Number,
      default: 0,
      min: [0, 'Revision time cannot be negative']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Revision notes cannot be more than 300 characters']
    },
    understanding: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent'],
      default: 'fair'
    }
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Chapter notes cannot be more than 500 characters']
  },
  lastStudiedDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  linkedSyllabusItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Syllabus'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Main book schema
const bookSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide book title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  author: {
    type: String,
    trim: true,
    maxlength: [100, 'Author name cannot be more than 100 characters']
  },
  subject: {
    type: String,
    required: [true, 'Please provide subject'],
    trim: true,
    maxlength: [50, 'Subject cannot be more than 50 characters']
  },
  isbn: {
    type: String,
    trim: true,
    maxlength: [20, 'ISBN cannot be more than 20 characters']
  },
  edition: {
    type: String,
    trim: true,
    maxlength: [50, 'Edition cannot be more than 50 characters']
  },
  publishedYear: {
    type: Number,
    min: [1000, 'Published year must be a valid year'],
    max: [new Date().getFullYear(), 'Published year cannot be in the future']
  },
  chapters: [chapterSchema],
  totalChapters: {
    type: Number,
    required: [true, 'Please provide total chapters'],
    min: [1, 'Total chapters must be at least 1']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot be more than 30 characters']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for completed chapters count
bookSchema.virtual('completedChapters').get(function() {
  if (!this.chapters) return 0;
  return this.chapters.filter(chapter => chapter.status === 'completed').length;
});

// Virtual for progress percentage
bookSchema.virtual('progressPercentage').get(function() {
  const completed = this.completedChapters;
  return this.totalChapters > 0 ? Math.round((completed / this.totalChapters) * 100) : 0;
});

// Virtual for total time spent
bookSchema.virtual('totalTimeSpent').get(function() {
  if (!this.chapters) return 0;
  return this.chapters.reduce((total, chapter) => {
    const chapterTime = chapter.timeSpent || 0;
    const revisionTime = chapter.revisions.reduce((revTotal, revision) => 
      revTotal + (revision.timeSpent || 0), 0);
    return total + chapterTime + revisionTime;
  }, 0);
});

// Virtual for total tests taken
bookSchema.virtual('totalTests').get(function() {
  if (!this.chapters) return 0;
  return this.chapters.reduce((total, chapter) => total + chapter.tests.length, 0);
});

// Virtual for average test score
bookSchema.virtual('averageTestScore').get(function() {
  if (!this.chapters) return 0;
  let totalScore = 0;
  let testCount = 0;
  
  this.chapters.forEach(chapter => {
    chapter.tests.forEach(test => {
      if (test.score !== undefined && test.totalMarks > 0) {
        totalScore += (test.score / test.totalMarks) * 100;
        testCount++;
      }
    });
  });
  
  return testCount > 0 ? Math.round(totalScore / testCount) : 0;
});

// Virtual for total revisions
bookSchema.virtual('totalRevisions').get(function() {
  if (!this.chapters) return 0;
  return this.chapters.reduce((total, chapter) => total + chapter.revisions.length, 0);
});

// Method to auto-generate chapters when totalChapters is set
bookSchema.methods.generateChapters = function() {
  if (this.chapters.length === 0 && this.totalChapters > 0) {
    for (let i = 1; i <= this.totalChapters; i++) {
      this.chapters.push({
        name: `Chapter ${i}`,
        chapterNumber: i,
        status: 'not_started',
        priority: 'medium',
        timeSpent: 0,
        estimatedTime: 0,
        tests: [],
        revisions: []
      });
    }
  }
};

// Method to add a test to a chapter
bookSchema.methods.addTestToChapter = function(chapterIndex, testData) {
  if (this.chapters[chapterIndex]) {
    this.chapters[chapterIndex].tests.push(testData);
    this.chapters[chapterIndex].lastStudiedDate = new Date();
  }
};

// Method to add a revision to a chapter
bookSchema.methods.addRevisionToChapter = function(chapterIndex, revisionData) {
  if (this.chapters[chapterIndex]) {
    this.chapters[chapterIndex].revisions.push(revisionData);
    this.chapters[chapterIndex].lastStudiedDate = new Date();
  }
};

// Method to update chapter status
bookSchema.methods.updateChapterStatus = function(chapterIndex, status) {
  if (this.chapters[chapterIndex]) {
    this.chapters[chapterIndex].status = status;
    this.chapters[chapterIndex].updatedAt = new Date();
    
    if (status === 'completed') {
      this.chapters[chapterIndex].completedAt = new Date();
    } else if (this.chapters[chapterIndex].completedAt) {
      this.chapters[chapterIndex].completedAt = undefined;
    }
  }
};

// Method to get chapters that need revision
bookSchema.methods.getChaptersNeedingRevision = function() {
  if (!this.chapters) return [];
  
  return this.chapters.filter(chapter => {
    if (chapter.status !== 'completed') return false;
    
    const lastStudied = chapter.lastStudiedDate || chapter.completedAt;
    if (!lastStudied) return true;
    
    const daysSinceLastStudy = (Date.now() - lastStudied.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastStudy >= 7; // Suggest revision after 7 days
  });
};

// Method to get study recommendations
bookSchema.methods.getStudyRecommendations = function() {
  if (!this.chapters) return [];
  
  return this.chapters
    .filter(chapter => chapter.status !== 'completed')
    .sort((a, b) => {
      // Prioritize by priority, then by chapter number
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 2;
      const bPriority = priorityOrder[b.priority] || 2;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return a.chapterNumber - b.chapterNumber;
    })
    .slice(0, 5);
};

// Pre-save middleware
bookSchema.pre('save', function(next) {
  // Auto-generate chapters if they don't exist
  if (this.isNew || this.isModified('totalChapters')) {
    if (this.chapters.length === 0) {
      this.generateChapters();
    }
    // Adjust chapters if totalChapters changed
    else if (this.chapters.length !== this.totalChapters) {
      if (this.chapters.length < this.totalChapters) {
        // Add missing chapters
        for (let i = this.chapters.length + 1; i <= this.totalChapters; i++) {
          this.chapters.push({
            name: `Chapter ${i}`,
            chapterNumber: i,
            status: 'not_started',
            priority: 'medium',
            timeSpent: 0,
            estimatedTime: 0,
            tests: [],
            revisions: []
          });
        }
      } else if (this.chapters.length > this.totalChapters) {
        // Remove extra chapters
        this.chapters = this.chapters.slice(0, this.totalChapters);
      }
    }
  }
  
  next();
});

// Index for efficient queries
bookSchema.index({ user: 1, subject: 1 });
bookSchema.index({ user: 1, isActive: 1 });
bookSchema.index({ user: 1, priority: 1 });

module.exports = mongoose.model('Book', bookSchema);
