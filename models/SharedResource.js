const mongoose = require('mongoose');

const sharedResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    trim: true,
    maxLength: [200, 'Resource title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxLength: [1000, 'Description cannot exceed 1000 characters'],
    trim: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true
  },
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resourceType: {
    type: String,
    enum: ['file', 'link', 'note', 'book', 'video', 'article', 'practice-test', 'other'],
    required: true
  },
  contentData: {
    // For file uploads
    fileUrl: String,
    fileName: String,
    fileSize: Number, // in bytes
    mimeType: String,
    
    // For links
    url: String,
    urlPreview: {
      title: String,
      description: String,
      image: String,
      siteName: String
    },
    
    // For notes/text content
    textContent: String,
    
    // For books
    bookInfo: {
      title: String,
      author: String,
      isbn: String,
      publisher: String,
      publicationYear: Number,
      pages: Number
    },
    
    // For videos
    videoInfo: {
      duration: Number, // in seconds
      platform: String, // youtube, vimeo, etc.
      videoId: String
    }
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  topics: [{
    type: String,
    trim: true
  }],
  examTypes: [{
    type: String,
    enum: ['UPSC', 'SSC', 'Banking', 'Railway', 'State PSC', 'Defense', 'Teaching', 'Other']
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  visibility: {
    type: String,
    enum: ['group', 'partners', 'private'],
    default: 'group'
  },
  tags: [{
    type: String,
    trim: true,
    maxLength: [50, 'Tag cannot exceed 50 characters']
  }],
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    review: {
      type: String,
      maxLength: [500, 'Review cannot exceed 500 characters']
    },
    categories: {
      quality: {
        type: Number,
        min: 1,
        max: 5
      },
      relevance: {
        type: Number,
        min: 1,
        max: 5
      },
      clarity: {
        type: Number,
        min: 1,
        max: 5
      },
      usefulness: {
        type: Number,
        min: 1,
        max: 5
      }
    },
    ratedAt: {
      type: Date,
      default: Date.now
    }
  }],
  bookmarks: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bookmarkedAt: {
      type: Date,
      default: Date.now
    },
    personalNotes: {
      type: String,
      maxLength: [500, 'Personal notes cannot exceed 500 characters']
    }
  }],
  downloads: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    downloadedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    duration: Number // time spent viewing in seconds
  }],
  stats: {
    totalViews: {
      type: Number,
      default: 0
    },
    totalDownloads: {
      type: Number,
      default: 0
    },
    totalBookmarks: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    popularityScore: {
      type: Number,
      default: 0
    }
  },
  accessibility: {
    isPublic: {
      type: Boolean,
      default: false
    },
    requiresApproval: {
      type: Boolean,
      default: false
    },
    allowDownload: {
      type: Boolean,
      default: true
    },
    allowBookmark: {
      type: Boolean,
      default: true
    },
    allowRating: {
      type: Boolean,
      default: true
    }
  },
  uploadInfo: {
    uploadDate: {
      type: Date,
      default: Date.now
    },
    lastModified: {
      type: Date,
      default: Date.now
    },
    version: {
      type: String,
      default: '1.0'
    },
    updateHistory: [{
      version: String,
      updatedAt: Date,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      changes: String
    }]
  },
  flags: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'copyright', 'spam', 'misleading', 'outdated', 'other'],
      required: true
    },
    description: {
      type: String,
      maxLength: [500, 'Flag description cannot exceed 500 characters']
    },
    flaggedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
sharedResourceSchema.index({ group: 1, createdAt: -1 });
sharedResourceSchema.index({ sharedBy: 1, resourceType: 1 });
sharedResourceSchema.index({ subject: 1, difficulty: 1 });
sharedResourceSchema.index({ resourceType: 1, 'stats.averageRating': -1 });
sharedResourceSchema.index({ tags: 1 });
sharedResourceSchema.index({ 'stats.popularityScore': -1 });
sharedResourceSchema.index({ 'bookmarks.user': 1 });
sharedResourceSchema.index({ visibility: 1, isActive: 1 });

// Virtual for bookmark count
sharedResourceSchema.virtual('bookmarkCount').get(function() {
  return this.bookmarks.length;
});

// Virtual for recent activity score
sharedResourceSchema.virtual('recentActivityScore').get(function() {
  const now = new Date();
  const daysSinceCreation = (now - this.createdAt) / (1000 * 60 * 60 * 24);
  
  // Recent views and downloads weighted more heavily
  const recentViews = this.views.filter(view => 
    (now - view.viewedAt) / (1000 * 60 * 60 * 24) <= 7
  ).length;
  
  const recentDownloads = this.downloads.filter(download => 
    (now - download.downloadedAt) / (1000 * 60 * 60 * 24) <= 7
  ).length;
  
  // Calculate score based on recency and engagement
  let score = (recentViews * 2) + (recentDownloads * 5) + (this.stats.totalBookmarks * 3);
  
  // Apply decay based on age
  if (daysSinceCreation > 0) {
    score = score / Math.log(daysSinceCreation + 1);
  }
  
  return Math.round(score * 100) / 100;
});

// Pre-save middleware to update stats
sharedResourceSchema.pre('save', function(next) {
  // Update statistics
  this.stats.totalViews = this.views.length;
  this.stats.totalDownloads = this.downloads.length;
  this.stats.totalBookmarks = this.bookmarks.length;
  this.stats.totalRatings = this.ratings.length;
  
  // Calculate average rating
  if (this.ratings.length > 0) {
    const totalRating = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
    this.stats.averageRating = Math.round((totalRating / this.ratings.length) * 100) / 100;
  }
  
  // Calculate popularity score
  this.stats.popularityScore = this.recentActivityScore;
  
  next();
});

// Instance method to add view
sharedResourceSchema.methods.addView = function(userId, duration = 0) {
  // Don't count multiple views from same user within 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentView = this.views.find(view => 
    view.user.toString() === userId.toString() && view.viewedAt > oneHourAgo
  );
  
  if (!recentView) {
    this.views.push({
      user: userId,
      viewedAt: new Date(),
      duration: duration
    });
  }
  
  return this.save();
};

// Instance method to add download
sharedResourceSchema.methods.addDownload = function(userId, ipAddress = '', userAgent = '') {
  this.downloads.push({
    user: userId,
    downloadedAt: new Date(),
    ipAddress: ipAddress,
    userAgent: userAgent
  });
  
  return this.save();
};

// Instance method to toggle bookmark
sharedResourceSchema.methods.toggleBookmark = function(userId, personalNotes = '') {
  const existingBookmark = this.bookmarks.find(bookmark => 
    bookmark.user.toString() === userId.toString()
  );
  
  if (existingBookmark) {
    // Remove bookmark
    this.bookmarks = this.bookmarks.filter(bookmark => 
      bookmark.user.toString() !== userId.toString()
    );
  } else {
    // Add bookmark
    this.bookmarks.push({
      user: userId,
      bookmarkedAt: new Date(),
      personalNotes: personalNotes
    });
  }
  
  return this.save();
};

// Instance method to add or update rating
sharedResourceSchema.methods.addRating = function(userId, ratingData) {
  const existingRating = this.ratings.find(rating => 
    rating.user.toString() === userId.toString()
  );
  
  if (existingRating) {
    // Update existing rating
    existingRating.rating = ratingData.rating;
    existingRating.review = ratingData.review || existingRating.review;
    existingRating.categories = { ...existingRating.categories, ...ratingData.categories };
    existingRating.ratedAt = new Date();
  } else {
    // Add new rating
    this.ratings.push({
      user: userId,
      rating: ratingData.rating,
      review: ratingData.review || '',
      categories: ratingData.categories || {},
      ratedAt: new Date()
    });
  }
  
  return this.save();
};

// Instance method to add flag
sharedResourceSchema.methods.addFlag = function(userId, reason, description = '') {
  // Check if user has already flagged this resource
  const existingFlag = this.flags.find(flag => 
    flag.user.toString() === userId.toString()
  );
  
  if (!existingFlag) {
    this.flags.push({
      user: userId,
      reason: reason,
      description: description,
      flaggedAt: new Date(),
      status: 'pending'
    });
  }
  
  return this.save();
};

// Static method to search resources
sharedResourceSchema.statics.searchResources = function(groupId, searchParams = {}) {
  const {
    query = '',
    resourceType,
    subject,
    difficulty,
    tags = [],
    sortBy = 'popularity',
    sortOrder = 'desc',
    limit = 20,
    skip = 0
  } = searchParams;
  
  let searchCriteria = {
    group: groupId,
    isActive: true,
    visibility: { $in: ['group', 'public'] }
  };
  
  // Add text search
  if (query) {
    searchCriteria.$or = [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } },
      { 'contentData.textContent': { $regex: query, $options: 'i' } }
    ];
  }
  
  // Add filters
  if (resourceType) searchCriteria.resourceType = resourceType;
  if (subject) searchCriteria.subject = subject;
  if (difficulty) searchCriteria.difficulty = difficulty;
  if (tags.length > 0) searchCriteria.tags = { $in: tags };
  
  // Determine sort order
  let sortCriteria = {};
  switch (sortBy) {
    case 'popularity':
      sortCriteria = { 'stats.popularityScore': sortOrder === 'desc' ? -1 : 1 };
      break;
    case 'rating':
      sortCriteria = { 'stats.averageRating': sortOrder === 'desc' ? -1 : 1 };
      break;
    case 'downloads':
      sortCriteria = { 'stats.totalDownloads': sortOrder === 'desc' ? -1 : 1 };
      break;
    case 'recent':
      sortCriteria = { createdAt: sortOrder === 'desc' ? -1 : 1 };
      break;
    default:
      sortCriteria = { 'stats.popularityScore': -1 };
  }
  
  return this.find(searchCriteria)
    .populate('sharedBy', 'name profilePicture')
    .sort(sortCriteria)
    .skip(skip)
    .limit(limit);
};

// Static method to get user's bookmarked resources
sharedResourceSchema.statics.getUserBookmarks = function(userId, groupId = null) {
  let criteria = {
    'bookmarks.user': userId,
    isActive: true
  };
  
  if (groupId) {
    criteria.group = groupId;
  }
  
  return this.find(criteria)
    .populate('sharedBy', 'name profilePicture')
    .populate('group', 'name')
    .sort({ 'bookmarks.bookmarkedAt': -1 });
};

// Static method to get trending resources
sharedResourceSchema.statics.getTrendingResources = function(groupId, days = 7, limit = 10) {
  const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.find({
    group: groupId,
    createdAt: { $gte: dateThreshold },
    isActive: true,
    visibility: { $in: ['group', 'public'] }
  })
  .populate('sharedBy', 'name profilePicture')
  .sort({ 'stats.popularityScore': -1 })
  .limit(limit);
};

module.exports = mongoose.model('SharedResource', sharedResourceSchema);
