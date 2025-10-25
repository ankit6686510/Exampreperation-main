const SharedResource = require('../models/SharedResource');
const StudyGroup = require('../models/StudyGroup');
const GroupActivity = require('../models/GroupActivity');
const GroupProgressShare = require('../models/GroupProgressShare');
const User = require('../models/User');

// @desc    Create/upload a new shared resource
// @route   POST /api/shared-resources
// @access  Private
const createSharedResource = async (req, res) => {
  try {
    const {
      title,
      description,
      groupId,
      resourceType,
      contentData,
      subject,
      topics = [],
      examTypes = [],
      difficulty = 'intermediate',
      visibility = 'group',
      tags = [],
      accessibility = {}
    } = req.body;

    // Validate required fields
    if (!title || !groupId || !resourceType || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Title, group, resource type, and subject are required'
      });
    }

    // Check if user is a member of the group
    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of the group to share resources'
      });
    }

    // Validate content data based on resource type
    if (!contentData || Object.keys(contentData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Content data is required'
      });
    }

    // Create shared resource
    const sharedResource = await SharedResource.create({
      title,
      description,
      group: groupId,
      sharedBy: req.user.id,
      resourceType,
      contentData,
      subject,
      topics,
      examTypes,
      difficulty,
      visibility,
      tags,
      accessibility: {
        isPublic: accessibility.isPublic === true,
        requiresApproval: accessibility.requiresApproval === true,
        allowDownload: accessibility.allowDownload !== false,
        allowBookmark: accessibility.allowBookmark !== false,
        allowRating: accessibility.allowRating !== false
      }
    });

    // Create group activity
    await GroupActivity.createActivity({
      group: groupId,
      user: req.user.id,
      activityType: 'data_shared',
      data: {
        title: 'Resource Shared',
        description: `${req.user.name} shared a ${resourceType}: "${title}"`,
        metadata: {
          resourceId: sharedResource._id,
          resourceType: resourceType,
          subject: subject
        }
      }
    });

    await sharedResource.populate('sharedBy', 'name profilePicture');

    res.status(201).json({
      success: true,
      message: 'Resource shared successfully',
      data: { resource: sharedResource }
    });
  } catch (error) {
    console.error('Create shared resource error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to share resource'
    });
  }
};

// @desc    Get shared resources for a group
// @route   GET /api/shared-resources/group/:groupId
// @access  Private
const getGroupResources = async (req, res) => {
  try {
    const { groupId } = req.params;
    const {
      resourceType,
      subject,
      difficulty,
      tags,
      search,
      sortBy = 'popularity',
      sortOrder = 'desc',
      limit = 20,
      page = 1
    } = req.query;

    // Check if user is a member of the group
    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member of this group.'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build search parameters
    const searchParams = {
      query: search || '',
      resourceType,
      subject,
      difficulty,
      tags: tags ? tags.split(',') : [],
      sortBy,
      sortOrder,
      limit: parseInt(limit),
      skip
    };

    // Get filtered resources
    const resources = await SharedResource.searchResources(groupId, searchParams);
    
    // Filter based on visibility and user permissions
    const filteredResources = [];
    for (const resource of resources) {
      let canView = false;
      
      if (resource.visibility === 'group') {
        canView = true;
      } else if (resource.visibility === 'partners') {
        // Check if viewer is a study partner with the resource owner
        canView = await GroupProgressShare.canViewData(
          resource.sharedBy._id, 
          req.user.id, 
          groupId, 
          'studySchedule'
        );
      } else if (resource.visibility === 'private') {
        canView = resource.sharedBy._id.toString() === req.user.id;
      }
      
      if (canView) {
        filteredResources.push(resource);
      }
    }

    // Get total count for pagination
    const totalQuery = {
      group: groupId,
      isActive: true,
      visibility: { $in: ['group'] } // Simplified for count
    };
    
    if (resourceType) totalQuery.resourceType = resourceType;
    if (subject) totalQuery.subject = subject;
    if (difficulty) totalQuery.difficulty = difficulty;
    
    const total = await SharedResource.countDocuments(totalQuery);

    res.status(200).json({
      success: true,
      data: {
        resources: filteredResources,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalResources: total,
          hasNext: skip + filteredResources.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get group resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group resources'
    });
  }
};

// @desc    Get single shared resource
// @route   GET /api/shared-resources/:id
// @access  Private
const getSharedResource = async (req, res) => {
  try {
    const resource = await SharedResource.findById(req.params.id)
      .populate('sharedBy', 'name profilePicture')
      .populate('group', 'name')
      .populate('ratings.user', 'name profilePicture')
      .populate('bookmarks.user', 'name');

    if (!resource || !resource.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Check if user has access to this resource
    const group = await StudyGroup.findById(resource.group._id);
    if (!group || !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member of the group.'
      });
    }

    // Check visibility permissions
    let canView = false;
    if (resource.visibility === 'group') {
      canView = true;
    } else if (resource.visibility === 'partners') {
      canView = await GroupProgressShare.canViewData(
        resource.sharedBy._id, 
        req.user.id, 
        resource.group._id, 
        'studySchedule'
      );
    } else if (resource.visibility === 'private') {
      canView = resource.sharedBy._id.toString() === req.user.id;
    }

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this resource'
      });
    }

    // Add view if not the owner
    if (resource.sharedBy._id.toString() !== req.user.id) {
      await resource.addView(req.user.id);
    }

    // Check if user has bookmarked this resource
    const isBookmarked = resource.bookmarks.some(bookmark => 
      bookmark.user._id.toString() === req.user.id
    );

    // Check if user has rated this resource
    const userRating = resource.ratings.find(rating => 
      rating.user._id.toString() === req.user.id
    );

    res.status(200).json({
      success: true,
      data: { 
        resource,
        userInteractions: {
          isBookmarked,
          userRating: userRating || null
        }
      }
    });
  } catch (error) {
    console.error('Get shared resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resource details'
    });
  }
};

// @desc    Download/access shared resource
// @route   POST /api/shared-resources/:id/download
// @access  Private
const downloadResource = async (req, res) => {
  try {
    const resource = await SharedResource.findById(req.params.id);

    if (!resource || !resource.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Check group membership
    const group = await StudyGroup.findById(resource.group);
    if (!group || !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member of the group.'
      });
    }

    // Check if downloads are allowed
    if (!resource.accessibility.allowDownload) {
      return res.status(403).json({
        success: false,
        message: 'Downloads are not allowed for this resource'
      });
    }

    // Check visibility permissions
    let canDownload = false;
    if (resource.visibility === 'group') {
      canDownload = true;
    } else if (resource.visibility === 'partners') {
      canDownload = await GroupProgressShare.canViewData(
        resource.sharedBy, 
        req.user.id, 
        resource.group, 
        'studySchedule'
      );
    } else if (resource.visibility === 'private') {
      canDownload = resource.sharedBy.toString() === req.user.id;
    }

    if (!canDownload) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to download this resource'
      });
    }

    // Add download record (except for owner)
    if (resource.sharedBy.toString() !== req.user.id) {
      await resource.addDownload(
        req.user.id,
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent']
      );
    }

    // Return download information
    res.status(200).json({
      success: true,
      message: 'Download access granted',
      data: {
        resourceType: resource.resourceType,
        contentData: resource.contentData,
        downloadUrl: resource.contentData.fileUrl || resource.contentData.url,
        fileName: resource.contentData.fileName || resource.title
      }
    });
  } catch (error) {
    console.error('Download resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process download request'
    });
  }
};

// @desc    Toggle bookmark for a resource
// @route   POST /api/shared-resources/:id/bookmark
// @access  Private
const toggleBookmark = async (req, res) => {
  try {
    const { personalNotes = '' } = req.body;
    const resource = await SharedResource.findById(req.params.id);

    if (!resource || !resource.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Check group membership
    const group = await StudyGroup.findById(resource.group);
    if (!group || !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member of the group.'
      });
    }

    // Check if bookmarks are allowed
    if (!resource.accessibility.allowBookmark) {
      return res.status(403).json({
        success: false,
        message: 'Bookmarks are not allowed for this resource'
      });
    }

    const wasBookmarked = resource.bookmarks.some(bookmark => 
      bookmark.user.toString() === req.user.id
    );

    await resource.toggleBookmark(req.user.id, personalNotes);

    res.status(200).json({
      success: true,
      message: wasBookmarked ? 'Bookmark removed' : 'Resource bookmarked',
      data: { isBookmarked: !wasBookmarked }
    });
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle bookmark'
    });
  }
};

// @desc    Rate a shared resource
// @route   POST /api/shared-resources/:id/rate
// @access  Private
const rateResource = async (req, res) => {
  try {
    const { rating, review, categories } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const resource = await SharedResource.findById(req.params.id);

    if (!resource || !resource.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Check group membership
    const group = await StudyGroup.findById(resource.group);
    if (!group || !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member of the group.'
      });
    }

    // Check if ratings are allowed
    if (!resource.accessibility.allowRating) {
      return res.status(403).json({
        success: false,
        message: 'Ratings are not allowed for this resource'
      });
    }

    // Cannot rate own resource
    if (resource.sharedBy.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot rate your own resource'
      });
    }

    const wasExistingRating = resource.ratings.some(r => 
      r.user.toString() === req.user.id
    );

    await resource.addRating(req.user.id, {
      rating,
      review: review || '',
      categories: categories || {}
    });

    res.status(200).json({
      success: true,
      message: wasExistingRating ? 'Rating updated successfully' : 'Rating added successfully',
      data: { 
        averageRating: resource.stats.averageRating,
        totalRatings: resource.stats.totalRatings
      }
    });
  } catch (error) {
    console.error('Rate resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate resource'
    });
  }
};

// @desc    Report/flag a resource
// @route   POST /api/shared-resources/:id/flag
// @access  Private
const flagResource = async (req, res) => {
  try {
    const { reason, description = '' } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason for flagging is required'
      });
    }

    const resource = await SharedResource.findById(req.params.id);

    if (!resource || !resource.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Check group membership
    const group = await StudyGroup.findById(resource.group);
    if (!group || !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member of the group.'
      });
    }

    // Cannot flag own resource
    if (resource.sharedBy.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot flag your own resource'
      });
    }

    // Check if already flagged by this user
    const existingFlag = resource.flags.find(flag => 
      flag.user.toString() === req.user.id
    );

    if (existingFlag) {
      return res.status(400).json({
        success: false,
        message: 'You have already flagged this resource'
      });
    }

    await resource.addFlag(req.user.id, reason, description);

    res.status(200).json({
      success: true,
      message: 'Resource flagged successfully. It will be reviewed by moderators.'
    });
  } catch (error) {
    console.error('Flag resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to flag resource'
    });
  }
};

// @desc    Get user's bookmarked resources
// @route   GET /api/shared-resources/my-bookmarks
// @access  Private
const getUserBookmarks = async (req, res) => {
  try {
    const { groupId, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookmarkedResources = await SharedResource.getUserBookmarks(
      req.user.id, 
      groupId || null
    )
    .skip(skip)
    .limit(parseInt(limit));

    const total = await SharedResource.countDocuments({
      'bookmarks.user': req.user.id,
      isActive: true,
      ...(groupId && { group: groupId })
    });

    res.status(200).json({
      success: true,
      data: {
        resources: bookmarkedResources,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalBookmarks: total,
          hasNext: skip + bookmarkedResources.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user bookmarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookmarked resources'
    });
  }
};

// @desc    Get user's shared resources
// @route   GET /api/shared-resources/my-resources
// @access  Private
const getUserSharedResources = async (req, res) => {
  try {
    const { groupId, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {
      sharedBy: req.user.id,
      isActive: true
    };

    if (groupId) {
      query.group = groupId;
    }

    const sharedResources = await SharedResource.find(query)
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SharedResource.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        resources: sharedResources,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalResources: total,
          hasNext: skip + sharedResources.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user shared resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your shared resources'
    });
  }
};

// @desc    Get trending resources for a group
// @route   GET /api/shared-resources/group/:groupId/trending
// @access  Private
const getTrendingResources = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { days = 7, limit = 10 } = req.query;

    // Check if user is a member of the group
    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member of this group.'
      });
    }

    const trendingResources = await SharedResource.getTrendingResources(
      groupId, 
      parseInt(days), 
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: { 
        resources: trendingResources,
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Get trending resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending resources'
    });
  }
};

module.exports = {
  createSharedResource,
  getGroupResources,
  getSharedResource,
  downloadResource,
  toggleBookmark,
  rateResource,
  flagResource,
  getUserBookmarks,
  getUserSharedResources,
  getTrendingResources
};
