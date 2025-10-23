const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  pageRange: {
    type: String,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
    trim: true,
  },
  completedAt: {
    type: Date,
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0,
  },
  order: {
    type: Number,
    default: 0,
  },
});

const upscResourceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.isTemplate;
    },
  },
  category: {
    type: String,
    enum: ['Book', 'NCERT', 'Magazine', 'Website', 'Document', 'Notes'],
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: String,
    trim: true,
  },
  publisher: {
    type: String,
    trim: true,
  },
  edition: {
    type: String,
    trim: true,
  },
  isbn: {
    type: String,
    trim: true,
  },
  chapters: [chapterSchema],
  priority: {
    type: String,
    enum: ['Must Read', 'Recommended', 'Optional', 'Reference'],
    default: 'Recommended',
  },
  examRelevance: [{
    type: String,
    enum: ['Prelims', 'Mains', 'Interview', 'Optional'],
  }],
  tags: [{
    type: String,
    trim: true,
  }],
  description: {
    type: String,
    trim: true,
  },
  url: {
    type: String,
    trim: true,
  },
  totalPages: {
    type: Number,
    min: 0,
  },
  estimatedHours: {
    type: Number,
    min: 0,
    default: 0,
  },
  actualHours: {
    type: Number,
    min: 0,
    default: 0,
  },
  startedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  lastReadAt: {
    type: Date,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  review: {
    type: String,
    trim: true,
  },
  isTemplate: {
    type: Boolean,
    default: false,
  },
  templateCategory: {
    type: String,
    enum: ['UPSC-General', 'UPSC-Optional', 'State-PCS', 'Banking', 'SSC'],
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'On Hold'],
    default: 'Not Started',
  },
  isActive: {
    type: Boolean,
    default: true,
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
upscResourceSchema.index({ user: 1, subject: 1 });
upscResourceSchema.index({ user: 1, category: 1 });
upscResourceSchema.index({ user: 1, priority: 1 });
upscResourceSchema.index({ user: 1, status: 1 });
upscResourceSchema.index({ isTemplate: 1, templateCategory: 1 });

// Virtual for completion percentage
upscResourceSchema.virtual('completionPercentage').get(function() {
  if (!this.chapters || this.chapters.length === 0) {
    return this.status === 'Completed' ? 100 : 0;
  }
  
  const completedChapters = this.chapters.filter(chapter => chapter.completed).length;
  return Math.round((completedChapters / this.chapters.length) * 100);
});

// Update the updatedAt field before saving
upscResourceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Update status based on chapter completion
  if (this.chapters && this.chapters.length > 0) {
    const completedChapters = this.chapters.filter(chapter => chapter.completed).length;
    const totalChapters = this.chapters.length;
    
    if (completedChapters === 0) {
      this.status = 'Not Started';
    } else if (completedChapters === totalChapters) {
      this.status = 'Completed';
      if (!this.completedAt) {
        this.completedAt = Date.now();
      }
    } else {
      this.status = 'In Progress';
      if (!this.startedAt) {
        this.startedAt = Date.now();
      }
    }
  }
  
  // Calculate actual hours from chapters
  if (this.chapters && this.chapters.length > 0) {
    this.actualHours = this.chapters.reduce((total, chapter) => total + (chapter.timeSpent || 0), 0) / 60;
  }
  
  next();
});

// Static method to get resources with statistics
upscResourceSchema.statics.getResourcesWithStats = async function(userId, filters = {}) {
  const pipeline = [
    { $match: { user: new mongoose.Types.ObjectId(userId), isActive: true, ...filters } },
    {
      $addFields: {
        completionPercentage: {
          $cond: [
            { $gt: [{ $size: '$chapters' }, 0] },
            {
              $multiply: [
                {
                  $divide: [
                    {
                      $size: {
                        $filter: {
                          input: '$chapters',
                          cond: { $eq: ['$$this.completed', true] }
                        }
                      }
                    },
                    { $size: '$chapters' }
                  ]
                },
                100
              ]
            },
            { $cond: [{ $eq: ['$status', 'Completed'] }, 100, 0] }
          ]
        }
      }
    },
    { $sort: { subject: 1, priority: 1, createdAt: 1 } }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to get subject-wise statistics
upscResourceSchema.statics.getSubjectStats = async function(userId) {
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), isActive: true } },
    {
      $group: {
        _id: '$subject',
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
        notStarted: { $sum: { $cond: [{ $eq: ['$status', 'Not Started'] }, 1, 0] } },
        totalHours: { $sum: '$actualHours' },
        estimatedHours: { $sum: '$estimatedHours' },
      }
    },
    {
      $addFields: {
        completionPercentage: {
          $cond: [
            { $gt: ['$total', 0] },
            { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
            0
          ]
        }
      }
    },
    { $sort: { completionPercentage: -1, _id: 1 } }
  ]);
};

module.exports = mongoose.model('UpscResource', upscResourceSchema);
