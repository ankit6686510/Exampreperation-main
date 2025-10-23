const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  summary: {
    type: String,
    required: true,
    trim: true,
  },
  keyPoints: [{
    type: String,
    trim: true,
  }],
  category: {
    type: String,
    required: true,
    enum: [
      'Polity & Governance',
      'Economy',
      'International Relations',
      'Environment & Ecology',
      'Science & Technology',
      'Social Issues',
      'Internal Security',
      'History & Culture',
      'Geography',
      'Agriculture',
      'Disaster Management',
      'Ethics',
      'Miscellaneous'
    ],
  },
  subCategory: {
    type: String,
    trim: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  examRelevance: [{
    type: String,
    enum: ['Prelims', 'Mains', 'Interview', 'Optional'],
  }],
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium',
  },
  url: {
    type: String,
    trim: true,
  },
  pageNumber: {
    type: Number,
  },
  linkedTopics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Syllabus',
  }],
  notes: {
    type: String,
    trim: true,
  },
  isBookmarked: {
    type: Boolean,
    default: false,
  },
  lastRevisedAt: {
    type: Date,
  },
  revisionCount: {
    type: Number,
    default: 0,
  },
  order: {
    type: Number,
    default: 0,
  },
});

const newspaperAnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  source: {
    type: String,
    required: true,
    enum: ['The Hindu', 'Indian Express', 'PIB', 'Livemint', 'Economic Times', 'Other'],
  },
  articles: [articleSchema],
  totalTimeSpent: {
    type: Number, // in minutes
    default: 0,
  },
  completionStatus: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started',
  },
  overallNotes: {
    type: String,
    trim: true,
  },
  importantEvents: [{
    event: String,
    significance: String,
    category: String,
  }],
  monthlyTheme: {
    type: String,
    trim: true,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient queries
newspaperAnalysisSchema.index({ user: 1, date: -1 });
newspaperAnalysisSchema.index({ user: 1, source: 1 });
newspaperAnalysisSchema.index({ user: 1, 'articles.category': 1 });
newspaperAnalysisSchema.index({ user: 1, 'articles.priority': 1 });
newspaperAnalysisSchema.index({ user: 1, 'articles.examRelevance': 1 });
newspaperAnalysisSchema.index({ user: 1, createdAt: -1 });

// Update the updatedAt field before saving
newspaperAnalysisSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Update completion status based on articles
  if (this.articles && this.articles.length > 0) {
    this.completionStatus = 'Completed';
  } else if (this.totalTimeSpent > 0) {
    this.completionStatus = 'In Progress';
  } else {
    this.completionStatus = 'Not Started';
  }
  
  next();
});

// Virtual for article count by category
newspaperAnalysisSchema.virtual('categoryStats').get(function() {
  const stats = {};
  
  if (this.articles) {
    this.articles.forEach(article => {
      if (stats[article.category]) {
        stats[article.category]++;
      } else {
        stats[article.category] = 1;
      }
    });
  }
  
  return stats;
});

// Static method to get monthly statistics
newspaperAnalysisSchema.statics.getMonthlyStats = async function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    { $unwind: '$articles' },
    {
      $group: {
        _id: '$articles.category',
        count: { $sum: 1 },
        highPriority: { $sum: { $cond: [{ $eq: ['$articles.priority', 'High'] }, 1, 0] } },
        prelimsRelevant: { $sum: { $cond: [{ $in: ['Prelims', '$articles.examRelevance'] }, 1, 0] } },
        mainsRelevant: { $sum: { $cond: [{ $in: ['Mains', '$articles.examRelevance'] }, 1, 0] } },
        totalTimeSpent: { $sum: '$totalTimeSpent' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get timeline data
newspaperAnalysisSchema.statics.getTimeline = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        },
        articleCount: { $sum: { $size: '$articles' } },
        timeSpent: { $sum: '$totalTimeSpent' },
        sources: { $addToSet: '$source' }
      }
    },
    {
      $project: {
        date: {
          $dateFromParts: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day'
          }
        },
        articleCount: 1,
        timeSpent: 1,
        sources: 1
      }
    },
    { $sort: { date: 1 } }
  ]);
};

// Static method to get category-wise trends
newspaperAnalysisSchema.statics.getCategoryTrends = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate }
      }
    },
    { $unwind: '$articles' },
    {
      $group: {
        _id: {
          category: '$articles.category',
          week: { $week: '$date' }
        },
        count: { $sum: 1 },
        highPriorityCount: { $sum: { $cond: [{ $eq: ['$articles.priority', 'High'] }, 1, 0] } }
      }
    },
    {
      $group: {
        _id: '$_id.category',
        weeklyData: {
          $push: {
            week: '$_id.week',
            count: '$count',
            highPriorityCount: '$highPriorityCount'
          }
        },
        totalCount: { $sum: '$count' }
      }
    },
    { $sort: { totalCount: -1 } }
  ]);
};

// Static method to get revision reminders
newspaperAnalysisSchema.statics.getRevisionReminders = async function(userId) {
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        $or: [
          { date: { $gte: oneWeekAgo, $lt: today } },
          { date: { $gte: twoWeeksAgo, $lt: oneWeekAgo } },
          { date: { $gte: oneMonthAgo, $lt: twoWeeksAgo } }
        ]
      }
    },
    { $unwind: '$articles' },
    {
      $match: {
        $or: [
          { 'articles.priority': 'High' },
          { 'articles.isBookmarked': true }
        ]
      }
    },
    {
      $addFields: {
        revisionUrgency: {
          $switch: {
            branches: [
              { case: { $gte: ['$date', oneWeekAgo] }, then: 'Due' },
              { case: { $gte: ['$date', twoWeeksAgo] }, then: 'Overdue' },
              { case: { $gte: ['$date', oneMonthAgo] }, then: 'Critical' }
            ],
            default: 'Low'
          }
        }
      }
    },
    {
      $project: {
        date: 1,
        source: 1,
        title: '$articles.title',
        category: '$articles.category',
        priority: '$articles.priority',
        lastRevisedAt: '$articles.lastRevisedAt',
        revisionCount: '$articles.revisionCount',
        revisionUrgency: 1
      }
    },
    { $sort: { revisionUrgency: 1, date: -1 } }
  ]);
};

// Static method to generate monthly compilation
newspaperAnalysisSchema.statics.generateMonthlyCompilation = async function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    { $unwind: '$articles' },
    {
      $group: {
        _id: '$articles.category',
        articles: {
          $push: {
            date: '$date',
            source: '$source',
            title: '$articles.title',
            summary: '$articles.summary',
            keyPoints: '$articles.keyPoints',
            priority: '$articles.priority',
            examRelevance: '$articles.examRelevance',
            tags: '$articles.tags'
          }
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        category: '$_id',
        articles: {
          $sortArray: {
            input: '$articles',
            sortBy: { priority: -1, date: -1 }
          }
        },
        count: 1
      }
    },
    { $sort: { count: -1 } }
  ]);
};

module.exports = mongoose.model('NewspaperAnalysis', newspaperAnalysisSchema);
