const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  link: {
    type: String,
    required: [true, 'Resource link is required'],
    trim: true,
    maxlength: [1000, 'Link cannot be more than 1000 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [50, 'Category cannot be more than 50 characters']
  },
  linkType: {
    type: String,
    enum: ['external_url', 'file_upload', 'notes', 'document'],
    default: 'external_url'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot be more than 30 characters']
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  accessCount: {
    type: Number,
    default: 0,
    min: [0, 'Access count cannot be negative']
  },
  lastAccessedAt: {
    type: Date
  },
  isBookmarked: {
    type: Boolean,
    default: false
  },
  relatedBooks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  }],
  fileSize: {
    type: Number, // in bytes, for uploaded files
    min: [0, 'File size cannot be negative']
  },
  fileType: {
    type: String, // MIME type for uploaded files
    trim: true
  },
  originalFileName: {
    type: String, // Original name of uploaded file
    trim: true
  },
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

// Virtual for formatted file size
resourceSchema.virtual('formattedFileSize').get(function() {
  if (!this.fileSize) return null;
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = this.fileSize;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
});

// Virtual for link preview
resourceSchema.virtual('linkPreview').get(function() {
  if (this.linkType === 'external_url') {
    try {
      const url = new URL(this.link);
      return url.hostname;
    } catch {
      return this.link.substring(0, 50) + '...';
    }
  }
  return this.originalFileName || this.title;
});

// Method to increment access count
resourceSchema.methods.recordAccess = function() {
  this.accessCount += 1;
  this.lastAccessedAt = new Date();
  return this.save();
};

// Method to toggle bookmark status
resourceSchema.methods.toggleBookmark = function() {
  this.isBookmarked = !this.isBookmarked;
  return this.save();
};

// Method to link to books
resourceSchema.methods.linkToBooks = function(bookIds) {
  const uniqueBookIds = [...new Set([...this.relatedBooks, ...bookIds])];
  this.relatedBooks = uniqueBookIds;
  return this.save();
};

// Method to unlink from books
resourceSchema.methods.unlinkFromBooks = function(bookIds) {
  this.relatedBooks = this.relatedBooks.filter(
    bookId => !bookIds.includes(bookId.toString())
  );
  return this.save();
};

// Static method to get categories for a user
resourceSchema.statics.getUserCategories = function(userId) {
  return this.distinct('category', { user: userId, isActive: true });
};

// Static method to get popular tags for a user
resourceSchema.statics.getUserTags = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), isActive: true } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
    { $project: { tag: '$_id', count: 1, _id: 0 } }
  ]);
};

// Static method to get resource statistics for a user
resourceSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), isActive: true } },
    {
      $group: {
        _id: null,
        totalResources: { $sum: 1 },
        totalBookmarked: { $sum: { $cond: ['$isBookmarked', 1, 0] } },
        totalAccesses: { $sum: '$accessCount' },
        categoriesCount: { $addToSet: '$category' },
        linkTypes: { $push: '$linkType' },
        avgAccessCount: { $avg: '$accessCount' }
      }
    },
    {
      $project: {
        _id: 0,
        totalResources: 1,
        totalBookmarked: 1,
        totalAccesses: 1,
        categoriesCount: { $size: '$categoriesCount' },
        avgAccessCount: { $round: ['$avgAccessCount', 1] },
        linkTypeDistribution: {
          $reduce: {
            input: '$linkTypes',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [[
                    { k: '$$this', v: { $add: [{ $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] }, 1] } }
                  ]]
                }
              ]
            }
          }
        }
      }
    }
  ]);
};

// Pre-save middleware to validate URLs
resourceSchema.pre('save', function(next) {
  if (this.linkType === 'external_url' && this.link) {
    try {
      new URL(this.link);
    } catch (error) {
      // If URL is invalid but doesn't start with http/https, try adding https
      if (!this.link.startsWith('http://') && !this.link.startsWith('https://')) {
        this.link = 'https://' + this.link;
        try {
          new URL(this.link);
        } catch {
          return next(new Error('Invalid URL format'));
        }
      } else {
        return next(new Error('Invalid URL format'));
      }
    }
  }
  
  // Clean up tags - remove duplicates and empty tags
  if (this.tags) {
    this.tags = [...new Set(this.tags.filter(tag => tag && tag.trim()))];
  }
  
  next();
});

// Indexes for efficient queries
resourceSchema.index({ user: 1, isActive: 1 });
resourceSchema.index({ user: 1, category: 1 });
resourceSchema.index({ user: 1, tags: 1 });
resourceSchema.index({ user: 1, isBookmarked: 1 });
resourceSchema.index({ user: 1, priority: 1 });
resourceSchema.index({ user: 1, createdAt: -1 });
resourceSchema.index({ user: 1, accessCount: -1 });

// Text index for search functionality
resourceSchema.index({
  title: 'text',
  description: 'text',
  category: 'text',
  tags: 'text'
});

module.exports = mongoose.model('Resource', resourceSchema);
