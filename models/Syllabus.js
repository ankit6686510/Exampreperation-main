const mongoose = require('mongoose');

const syllabusItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  unit: {
    type: String,
    trim: true,
  },
  topic: {
    type: String,
    trim: true,
  },
  subtopic: {
    type: String,
    trim: true,
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 4, // 1: Subject, 2: Unit, 3: Topic, 4: Subtopic
    default: 1,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Syllabus',
    default: null,
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'needs_revision'],
    default: 'not_started',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
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
  notes: {
    type: String,
    trim: true,
  },
  lastStudiedDate: {
    type: Date,
  },
  revisionCount: {
    type: Number,
    min: 0,
    default: 0,
  },
  dueDate: {
    type: Date,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  linkedBooks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
  }],
  linkedSessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudySession',
  }],
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  completedAt: {
    type: Date,
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

// Index for efficient queries
syllabusItemSchema.index({ user: 1, subject: 1 });
syllabusItemSchema.index({ user: 1, status: 1 });
syllabusItemSchema.index({ user: 1, priority: 1 });
syllabusItemSchema.index({ user: 1, parentId: 1 });

// Update the updatedAt field before saving
syllabusItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Set completedAt when status changes to completed
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = Date.now();
  }
  
  // Clear completedAt if status changes from completed
  if (this.status !== 'completed' && this.completedAt) {
    this.completedAt = undefined;
  }
  
  next();
});

// Virtual for completion percentage of children
syllabusItemSchema.virtual('completionPercentage').get(function() {
  // This will be calculated in the controller for efficiency
  return this._completionPercentage || 0;
});

// Method to calculate total hours spent including children
syllabusItemSchema.methods.calculateTotalHours = async function() {
  const children = await this.constructor.find({ parentId: this._id });
  let totalHours = this.actualHours || 0;
  
  for (const child of children) {
    totalHours += await child.calculateTotalHours();
  }
  
  return totalHours;
};

// Method to update parent completion status
syllabusItemSchema.methods.updateParentStatus = async function() {
  if (!this.parentId) return;
  
  const parent = await this.constructor.findById(this.parentId);
  if (!parent) return;
  
  // Get all siblings (children of the same parent)
  const siblings = await this.constructor.find({ parentId: this.parentId, isActive: true });
  
  // Calculate completion percentage
  const completedSiblings = siblings.filter(s => s.status === 'completed').length;
  const totalSiblings = siblings.length;
  const completionPercentage = totalSiblings > 0 ? (completedSiblings / totalSiblings) * 100 : 0;
  
  // Update parent status based on children completion
  if (completionPercentage === 100) {
    parent.status = 'completed';
  } else if (completionPercentage > 0) {
    parent.status = 'in_progress';
  } else {
    parent.status = 'not_started';
  }
  
  await parent.save();
  
  // Recursively update grandparent
  await parent.updateParentStatus();
};

// Static method to get syllabus tree structure
syllabusItemSchema.statics.getSyllabusTree = async function(userId, filters = {}) {
  const pipeline = [
    { $match: { user: new mongoose.Types.ObjectId(userId), isActive: true, ...filters } },
    { $sort: { level: 1, order: 1, createdAt: 1 } },
  ];
  
  const items = await this.aggregate(pipeline);
  
  // Build tree structure
  const itemMap = new Map();
  const rootItems = [];
  
  // First pass: create map
  items.forEach(item => {
    item.children = [];
    itemMap.set(item._id.toString(), item);
  });
  
  // Second pass: build tree
  items.forEach(item => {
    if (item.parentId) {
      const parent = itemMap.get(item.parentId.toString());
      if (parent) {
        parent.children.push(item);
      }
    } else {
      rootItems.push(item);
    }
  });
  
  return rootItems;
};

// Static method to get statistics
syllabusItemSchema.statics.getStats = async function(userId, filters = {}) {
  const match = { user: new mongoose.Types.ObjectId(userId), isActive: true, ...filters };
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        notStarted: { $sum: { $cond: [{ $eq: ['$status', 'not_started'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        needsRevision: { $sum: { $cond: [{ $eq: ['$status', 'needs_revision'] }, 1, 0] } },
        totalEstimatedHours: { $sum: '$estimatedHours' },
        totalActualHours: { $sum: '$actualHours' },
        highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
      }
    }
  ]);
  
  const result = stats[0] || {
    total: 0,
    notStarted: 0,
    inProgress: 0,
    completed: 0,
    needsRevision: 0,
    totalEstimatedHours: 0,
    totalActualHours: 0,
    highPriority: 0,
  };
  
  result.completionPercentage = result.total > 0 ? Math.round((result.completed / result.total) * 100) : 0;
  
  return result;
};

module.exports = mongoose.model('Syllabus', syllabusItemSchema);
