const Resource = require('../models/Resource');
const Book = require('../models/Book');
const asyncHandler = require('express-async-handler');

// @desc    Get all resources for user
// @route   GET /api/resources
// @access  Private
const getResources = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    tags,
    priority,
    linkType,
    isBookmarked,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 50
  } = req.query;

  // Build filter object
  const filter = { user: req.user.id, isActive: true };

  // Add search functionality
  if (search) {
    filter.$text = { $search: search };
  }

  // Add category filter
  if (category) {
    filter.category = new RegExp(category, 'i');
  }

  // Add tags filter
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    filter.tags = { $in: tagArray };
  }

  // Add priority filter
  if (priority) {
    filter.priority = priority;
  }

  // Add link type filter
  if (linkType) {
    filter.linkType = linkType;
  }

  // Add bookmark filter
  if (isBookmarked !== undefined) {
    filter.isBookmarked = isBookmarked === 'true';
  }

  // Build sort object
  const sortObj = {};
  if (sortBy === 'title') {
    sortObj.title = sortOrder === 'desc' ? -1 : 1;
  } else if (sortBy === 'category') {
    sortObj.category = sortOrder === 'desc' ? -1 : 1;
  } else if (sortBy === 'priority') {
    // Custom priority sorting: high -> medium -> low
    sortObj.priority = sortOrder === 'desc' ? -1 : 1;
  } else if (sortBy === 'accessCount') {
    sortObj.accessCount = sortOrder === 'desc' ? -1 : 1;
  } else if (sortBy === 'lastAccessedAt') {
    sortObj.lastAccessedAt = sortOrder === 'desc' ? -1 : 1;
  } else {
    sortObj.createdAt = sortOrder === 'desc' ? -1 : 1;
  }

  // If searching by text, add text score sorting
  if (search) {
    sortObj.score = { $meta: 'textScore' };
  }

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  try {
    // Get resources with pagination
    const resourcesQuery = Resource.find(filter)
      .populate('relatedBooks', 'title subject')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // If searching, add text score projection
    if (search) {
      resourcesQuery.select({ score: { $meta: 'textScore' } });
    }

    const resources = await resourcesQuery;

    // Get total count for pagination
    const total = await Resource.countDocuments(filter);

    // Calculate pagination info
    const hasNextPage = skip + limitNum < total;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: resources,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalResources: total,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resources',
      error: error.message
    });
  }
});

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Private
const getResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findOne({
    _id: req.params.id,
    user: req.user.id,
    isActive: true
  }).populate('relatedBooks', 'title subject author');

  if (!resource) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  res.json({
    success: true,
    data: resource
  });
});

// @desc    Create new resource
// @route   POST /api/resources
// @access  Private
const createResource = asyncHandler(async (req, res) => {
  const {
    title,
    link,
    description,
    category,
    linkType = 'external_url',
    tags = [],
    priority = 'medium',
    relatedBooks = []
  } = req.body;

  // Validate required fields
  if (!title || !link || !category) {
    return res.status(400).json({
      success: false,
      message: 'Title, link, and category are required'
    });
  }

  try {
    // Validate related books if provided
    if (relatedBooks.length > 0) {
      const validBooks = await Book.find({
        _id: { $in: relatedBooks },
        user: req.user.id
      });

      if (validBooks.length !== relatedBooks.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more related books not found'
        });
      }
    }

    const resource = await Resource.create({
      user: req.user.id,
      title,
      link,
      description,
      category,
      linkType,
      tags,
      priority,
      relatedBooks
    });

    // Populate related books for response
    await resource.populate('relatedBooks', 'title subject');

    res.status(201).json({
      success: true,
      data: resource,
      message: 'Resource created successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create resource',
      error: error.message
    });
  }
});

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private
const updateResource = asyncHandler(async (req, res) => {
  const {
    title,
    link,
    description,
    category,
    linkType,
    tags,
    priority,
    relatedBooks,
    isBookmarked
  } = req.body;

  try {
    const resource = await Resource.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true
    });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Validate related books if provided
    if (relatedBooks && relatedBooks.length > 0) {
      const validBooks = await Book.find({
        _id: { $in: relatedBooks },
        user: req.user.id
      });

      if (validBooks.length !== relatedBooks.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more related books not found'
        });
      }
    }

    // Update fields
    if (title !== undefined) resource.title = title;
    if (link !== undefined) resource.link = link;
    if (description !== undefined) resource.description = description;
    if (category !== undefined) resource.category = category;
    if (linkType !== undefined) resource.linkType = linkType;
    if (tags !== undefined) resource.tags = tags;
    if (priority !== undefined) resource.priority = priority;
    if (relatedBooks !== undefined) resource.relatedBooks = relatedBooks;
    if (isBookmarked !== undefined) resource.isBookmarked = isBookmarked;

    await resource.save();
    await resource.populate('relatedBooks', 'title subject');

    res.json({
      success: true,
      data: resource,
      message: 'Resource updated successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update resource',
      error: error.message
    });
  }
});

// @desc    Delete resource (soft delete)
// @route   DELETE /api/resources/:id
// @access  Private
const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findOne({
    _id: req.params.id,
    user: req.user.id,
    isActive: true
  });

  if (!resource) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  // Soft delete
  resource.isActive = false;
  await resource.save();

  res.json({
    success: true,
    message: 'Resource deleted successfully'
  });
});

// @desc    Record resource access
// @route   POST /api/resources/:id/access
// @access  Private
const recordAccess = asyncHandler(async (req, res) => {
  const resource = await Resource.findOne({
    _id: req.params.id,
    user: req.user.id,
    isActive: true
  });

  if (!resource) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  await resource.recordAccess();

  res.json({
    success: true,
    data: {
      accessCount: resource.accessCount,
      lastAccessedAt: resource.lastAccessedAt
    },
    message: 'Access recorded'
  });
});

// @desc    Toggle bookmark status
// @route   POST /api/resources/:id/bookmark
// @access  Private
const toggleBookmark = asyncHandler(async (req, res) => {
  const resource = await Resource.findOne({
    _id: req.params.id,
    user: req.user.id,
    isActive: true
  });

  if (!resource) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  await resource.toggleBookmark();

  res.json({
    success: true,
    data: {
      isBookmarked: resource.isBookmarked
    },
    message: `Resource ${resource.isBookmarked ? 'bookmarked' : 'unbookmarked'}`
  });
});

// @desc    Get user's resource categories
// @route   GET /api/resources/categories
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Resource.getUserCategories(req.user.id);

  res.json({
    success: true,
    data: categories
  });
});

// @desc    Get user's resource tags
// @route   GET /api/resources/tags
// @access  Private
const getTags = asyncHandler(async (req, res) => {
  const tags = await Resource.getUserTags(req.user.id);

  res.json({
    success: true,
    data: tags
  });
});

// @desc    Get user's resource statistics
// @route   GET /api/resources/stats
// @access  Private
const getResourceStats = asyncHandler(async (req, res) => {
  const stats = await Resource.getUserStats(req.user.id);

  res.json({
    success: true,
    data: stats[0] || {
      totalResources: 0,
      totalBookmarked: 0,
      totalAccesses: 0,
      categoriesCount: 0,
      avgAccessCount: 0,
      linkTypeDistribution: {}
    }
  });
});

// @desc    Bulk operations on resources
// @route   POST /api/resources/bulk
// @access  Private
const bulkOperations = asyncHandler(async (req, res) => {
  const { operation, resourceIds, data } = req.body;

  if (!operation || !resourceIds || !Array.isArray(resourceIds)) {
    return res.status(400).json({
      success: false,
      message: 'Operation and resource IDs are required'
    });
  }

  try {
    let result;

    switch (operation) {
      case 'delete':
        result = await Resource.updateMany(
          {
            _id: { $in: resourceIds },
            user: req.user.id,
            isActive: true
          },
          { isActive: false }
        );
        break;

      case 'bookmark':
        result = await Resource.updateMany(
          {
            _id: { $in: resourceIds },
            user: req.user.id,
            isActive: true
          },
          { isBookmarked: true }
        );
        break;

      case 'unbookmark':
        result = await Resource.updateMany(
          {
            _id: { $in: resourceIds },
            user: req.user.id,
            isActive: true
          },
          { isBookmarked: false }
        );
        break;

      case 'updateCategory':
        if (!data.category) {
          return res.status(400).json({
            success: false,
            message: 'Category is required for category update'
          });
        }
        result = await Resource.updateMany(
          {
            _id: { $in: resourceIds },
            user: req.user.id,
            isActive: true
          },
          { category: data.category }
        );
        break;

      case 'updatePriority':
        if (!data.priority) {
          return res.status(400).json({
            success: false,
            message: 'Priority is required for priority update'
          });
        }
        result = await Resource.updateMany(
          {
            _id: { $in: resourceIds },
            user: req.user.id,
            isActive: true
          },
          { priority: data.priority }
        );
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid operation'
        });
    }

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      },
      message: `Bulk ${operation} completed successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to perform bulk ${operation}`,
      error: error.message
    });
  }
});

module.exports = {
  getResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  recordAccess,
  toggleBookmark,
  getCategories,
  getTags,
  getResourceStats,
  bulkOperations
};
