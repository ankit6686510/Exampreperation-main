const Syllabus = require('../models/Syllabus');
const Book = require('../models/Book');
const StudySession = require('../models/StudySession');

// Get all syllabus items (tree structure)
const getSyllabus = async (req, res) => {
  try {
    const { subject, status, priority, search } = req.query;
    const filters = {};
    
    if (subject) filters.subject = new RegExp(subject, 'i');
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (search) {
      filters.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { subject: new RegExp(search, 'i') },
        { unit: new RegExp(search, 'i') },
        { topic: new RegExp(search, 'i') },
        { subtopic: new RegExp(search, 'i') },
      ];
    }
    
    const syllabusTree = await Syllabus.getSyllabusTree(req.user.id, filters);
    
    res.json({
      success: true,
      data: syllabusTree,
    });
  } catch (error) {
    console.error('Get syllabus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch syllabus',
    });
  }
};

// Get syllabus statistics
const getSyllabusStats = async (req, res) => {
  try {
    const { subject } = req.query;
    const filters = {};
    
    if (subject) filters.subject = new RegExp(subject, 'i');
    
    const stats = await Syllabus.getStats(req.user.id, filters);
    
    // Get subject-wise breakdown
    const subjectStats = await Syllabus.aggregate([
      { $match: { user: req.user._id, isActive: true } },
      {
        $group: {
          _id: '$subject',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          needsRevision: { $sum: { $cond: [{ $eq: ['$status', 'needs_revision'] }, 1, 0] } },
          totalHours: { $sum: '$actualHours' },
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
      { $sort: { completionPercentage: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        overall: stats,
        subjects: subjectStats,
      },
    });
  } catch (error) {
    console.error('Get syllabus stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch syllabus statistics',
    });
  }
};

// Get single syllabus item
const getSyllabusItem = async (req, res) => {
  try {
    const item = await Syllabus.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate('linkedBooks linkedSessions');
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus item not found',
      });
    }
    
    // Get children if any
    const children = await Syllabus.find({
      parentId: item._id,
      isActive: true,
    }).sort({ order: 1, createdAt: 1 });
    
    res.json({
      success: true,
      data: {
        ...item.toObject(),
        children,
      },
    });
  } catch (error) {
    console.error('Get syllabus item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch syllabus item',
    });
  }
};

// Create syllabus item
const createSyllabusItem = async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      unit,
      topic,
      subtopic,
      level,
      parentId,
      priority,
      estimatedHours,
      dueDate,
      tags,
      order,
    } = req.body;
    
    // Validate parent exists if parentId provided
    if (parentId) {
      const parent = await Syllabus.findOne({
        _id: parentId,
        user: req.user.id,
      });
      
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: 'Parent syllabus item not found',
        });
      }
    }
    
    const syllabusItem = new Syllabus({
      user: req.user.id,
      title,
      description,
      subject,
      unit,
      topic,
      subtopic,
      level,
      parentId: parentId || null,
      priority: priority || 'medium',
      estimatedHours: estimatedHours || 0,
      dueDate,
      tags: tags || [],
      order: order || 0,
    });
    
    await syllabusItem.save();
    
    res.status(201).json({
      success: true,
      data: syllabusItem,
      message: 'Syllabus item created successfully',
    });
  } catch (error) {
    console.error('Create syllabus item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create syllabus item',
    });
  }
};

// Update syllabus item
const updateSyllabusItem = async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      unit,
      topic,
      subtopic,
      status,
      priority,
      estimatedHours,
      actualHours,
      notes,
      dueDate,
      tags,
      order,
    } = req.body;
    
    const item = await Syllabus.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus item not found',
      });
    }
    
    // Update fields
    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    if (subject !== undefined) item.subject = subject;
    if (unit !== undefined) item.unit = unit;
    if (topic !== undefined) item.topic = topic;
    if (subtopic !== undefined) item.subtopic = subtopic;
    if (status !== undefined) {
      const oldStatus = item.status;
      item.status = status;
      
      // Update last studied date when marked as in progress or completed
      if (status === 'in_progress' || status === 'completed') {
        item.lastStudiedDate = new Date();
      }
      
      // Increment revision count when marked as needs revision
      if (status === 'needs_revision' && oldStatus !== 'needs_revision') {
        item.revisionCount = (item.revisionCount || 0) + 1;
      }
    }
    if (priority !== undefined) item.priority = priority;
    if (estimatedHours !== undefined) item.estimatedHours = estimatedHours;
    if (actualHours !== undefined) item.actualHours = actualHours;
    if (notes !== undefined) item.notes = notes;
    if (dueDate !== undefined) item.dueDate = dueDate;
    if (tags !== undefined) item.tags = tags;
    if (order !== undefined) item.order = order;
    
    await item.save();
    
    // Update parent status based on children completion
    await item.updateParentStatus();
    
    res.json({
      success: true,
      data: item,
      message: 'Syllabus item updated successfully',
    });
  } catch (error) {
    console.error('Update syllabus item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update syllabus item',
    });
  }
};

// Delete syllabus item (soft delete)
const deleteSyllabusItem = async (req, res) => {
  try {
    const item = await Syllabus.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus item not found',
      });
    }
    
    // Soft delete the item and all its children
    await Syllabus.updateMany(
      {
        $or: [
          { _id: item._id },
          { parentId: item._id }
        ]
      },
      { isActive: false }
    );
    
    // Update parent status after deletion
    if (item.parentId) {
      const parent = await Syllabus.findById(item.parentId);
      if (parent) {
        await parent.updateParentStatus();
      }
    }
    
    res.json({
      success: true,
      message: 'Syllabus item deleted successfully',
    });
  } catch (error) {
    console.error('Delete syllabus item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete syllabus item',
    });
  }
};

// Bulk update syllabus items
const bulkUpdateSyllabus = async (req, res) => {
  try {
    const { items, action, actionData } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required',
      });
    }
    
    const updateData = {};
    
    switch (action) {
      case 'mark_completed':
        updateData.status = 'completed';
        updateData.lastStudiedDate = new Date();
        break;
      case 'mark_in_progress':
        updateData.status = 'in_progress';
        updateData.lastStudiedDate = new Date();
        break;
      case 'set_priority':
        if (!actionData?.priority) {
          return res.status(400).json({
            success: false,
            message: 'Priority is required for set_priority action',
          });
        }
        updateData.priority = actionData.priority;
        break;
      case 'add_hours':
        if (!actionData?.hours || actionData.hours <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Valid hours value is required for add_hours action',
          });
        }
        // This will be handled differently as we need to increment
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action',
        });
    }
    
    let result;
    
    if (action === 'add_hours') {
      // Handle hours increment separately
      result = await Syllabus.updateMany(
        {
          _id: { $in: items },
          user: req.user.id,
        },
        {
          $inc: { actualHours: actionData.hours },
          $set: { lastStudiedDate: new Date() }
        }
      );
    } else {
      result = await Syllabus.updateMany(
        {
          _id: { $in: items },
          user: req.user.id,
        },
        { $set: updateData }
      );
    }
    
    // Update parent statuses for all affected items
    const affectedItems = await Syllabus.find({
      _id: { $in: items },
      user: req.user.id,
    });
    
    for (const item of affectedItems) {
      await item.updateParentStatus();
    }
    
    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
      },
      message: `${result.modifiedCount} items updated successfully`,
    });
  } catch (error) {
    console.error('Bulk update syllabus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update syllabus items',
    });
  }
};

// Get study recommendations
const getStudyRecommendations = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get items that need attention based on priority, last studied date, and status
    const recommendations = await Syllabus.aggregate([
      {
        $match: {
          user: req.user._id,
          isActive: true,
          status: { $in: ['not_started', 'in_progress', 'needs_revision'] }
        }
      },
      {
        $addFields: {
          priorityScore: {
            $switch: {
              branches: [
                { case: { $eq: ['$priority', 'high'] }, then: 3 },
                { case: { $eq: ['$priority', 'medium'] }, then: 2 },
                { case: { $eq: ['$priority', 'low'] }, then: 1 }
              ],
              default: 1
            }
          },
          statusScore: {
            $switch: {
              branches: [
                { case: { $eq: ['$status', 'needs_revision'] }, then: 3 },
                { case: { $eq: ['$status', 'not_started'] }, then: 2 },
                { case: { $eq: ['$status', 'in_progress'] }, then: 1 }
              ],
              default: 1
            }
          },
          daysSinceStudied: {
            $cond: [
              { $ne: ['$lastStudiedDate', null] },
              {
                $divide: [
                  { $subtract: [new Date(), '$lastStudiedDate'] },
                  1000 * 60 * 60 * 24
                ]
              },
              30 // Default to 30 days if never studied
            ]
          }
        }
      },
      {
        $addFields: {
          recommendationScore: {
            $add: [
              '$priorityScore',
              '$statusScore',
              { $min: [{ $divide: ['$daysSinceStudied', 7] }, 3] } // Max 3 points for days
            ]
          }
        }
      },
      { $sort: { recommendationScore: -1, dueDate: 1 } },
      { $limit: parseInt(limit) }
    ]);
    
    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('Get study recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study recommendations',
    });
  }
};

// Link books to syllabus item
const linkBooksToSyllabus = async (req, res) => {
  try {
    const { bookIds } = req.body;
    
    const item = await Syllabus.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus item not found',
      });
    }
    
    // Verify books exist and belong to user
    const books = await Book.find({
      _id: { $in: bookIds },
      user: req.user.id,
    });
    
    if (books.length !== bookIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some books not found or do not belong to user',
      });
    }
    
    item.linkedBooks = bookIds;
    await item.save();
    
    res.json({
      success: true,
      data: item,
      message: 'Books linked successfully',
    });
  } catch (error) {
    console.error('Link books to syllabus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link books to syllabus',
    });
  }
};

module.exports = {
  getSyllabus,
  getSyllabusStats,
  getSyllabusItem,
  createSyllabusItem,
  updateSyllabusItem,
  deleteSyllabusItem,
  bulkUpdateSyllabus,
  getStudyRecommendations,
  linkBooksToSyllabus,
};
