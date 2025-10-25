const StudyGroup = require('../models/StudyGroup');
const GroupPermission = require('../models/GroupPermission');
const GroupActivity = require('../models/GroupActivity');
const User = require('../models/User');

// @desc    Get discoverable study groups (groups created by others)
// @route   GET /api/groups
// @access  Private
const getPublicGroups = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      examType, 
      search, 
      sortBy = 'members' 
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { 
      privacy: 'public', 
      isActive: true
      // Removed exclusion so creators can see their own groups in discover
    };

    // Add exam type filter
    if (examType && examType !== 'all') {
      query.examTypes = examType;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // Determine sort order
    let sortCriteria = {};
    switch (sortBy) {
      case 'members':
        sortCriteria = { 'stats.totalMembers': -1 };
        break;
      case 'activity':
        sortCriteria = { 'stats.lastActivity': -1 };
        break;
      case 'newest':
        sortCriteria = { createdAt: -1 };
        break;
      case 'oldest':
        sortCriteria = { createdAt: 1 };
        break;
      default:
        sortCriteria = { 'stats.totalMembers': -1 };
    }

    const groups = await StudyGroup.find(query)
      .populate('admin', 'name profilePicture')
      .populate('members.user', 'name profilePicture')
      .sort(sortCriteria)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StudyGroup.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        groups,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalGroups: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get public groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch groups'
    });
  }
};

// @desc    Get user's study groups (groups where user is a member - admin or regular member)
// @route   GET /api/groups/my-groups
// @access  Private
const getUserGroups = async (req, res) => {
  try {
    const groups = await StudyGroup.find({
      $or: [
        { admin: req.user.id }, // Groups owned by current user
        { 
          'members.user': req.user.id,
          'members.isActive': true
        } // Groups where user is an active member
      ],
      isActive: true
    })
    .populate('admin', 'name profilePicture')
    .populate('members.user', 'name profilePicture')
    .sort({ 'stats.lastActivity': -1 });

    res.status(200).json({
      success: true,
      data: { groups }
    });
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your groups'
    });
  }
};

// @desc    Get single study group
// @route   GET /api/groups/:id
// @access  Private
const getStudyGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id)
      .populate('admin', 'name profilePicture examTypes')
      .populate('members.user', 'name profilePicture examTypes progressStats');

    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found'
      });
    }

    // Check if user has access to this group
    const isPublic = group.privacy === 'public';
    const isMember = group.isMember(req.user.id);
    const isAdmin = group.admin._id.toString() === req.user.id;

    if (!isPublic && !isMember && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this group'
      });
    }

    // Get recent activities for this group
    const recentActivities = await GroupActivity.getGroupFeed(group._id, 1, 10);

    // Get leaderboard data
    const leaderboard = await GroupActivity.getGroupLeaderboard(group._id, 'week');

    res.status(200).json({
      success: true,
      data: {
        group,
        recentActivities,
        leaderboard,
        userRole: isMember ? group.members.find(m => m.user._id.toString() === req.user.id)?.role : null
      }
    });
  } catch (error) {
    console.error('Get study group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group details'
    });
  }
};

// @desc    Create study group
// @route   POST /api/groups
// @access  Private
const createStudyGroup = async (req, res) => {
  try {
    const {
      name,
      description,
      examTypes,
      targetDate,
      privacy = 'public',
      settings = {},
      tags = []
    } = req.body;

    // Validate required fields
    if (!name || !examTypes || examTypes.length === 0 || !targetDate) {
      return res.status(400).json({
        success: false,
        message: 'Name, exam types, and target date are required'
      });
    }

    // Create the group
    const group = await StudyGroup.create({
      name,
      description,
      examTypes,
      targetDate: new Date(targetDate),
      admin: req.user.id,
      privacy,
      settings: {
        allowMemberInvites: settings.allowMemberInvites !== false,
        requireApproval: settings.requireApproval === true,
        maxMembers: settings.maxMembers || 50,
        allowDataSharing: settings.allowDataSharing !== false,
        allowLeaderboard: settings.allowLeaderboard !== false
      },
      tags,
      members: [{
        user: req.user.id,
        role: 'admin',
        joinedAt: new Date(),
        isActive: true
      }]
    });

    // Create initial activity
    await GroupActivity.createActivity({
      group: group._id,
      user: req.user.id,
      activityType: 'member_joined',
      data: {
        title: 'Group Created',
        description: `${req.user.name} created the group "${name}"`
      }
    });

    // Populate the response
    await group.populate('admin', 'name profilePicture');
    await group.populate('members.user', 'name profilePicture');

    res.status(201).json({
      success: true,
      message: 'Study group created successfully',
      data: { group }
    });
  } catch (error) {
    console.error('Create study group error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create study group'
    });
  }
};

// @desc    Update study group
// @route   PUT /api/groups/:id
// @access  Private
const updateStudyGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);

    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found'
      });
    }

    // Check if user can moderate this group
    if (!group.canModerate(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins and moderators can update this group'
      });
    }

    const {
      name,
      description,
      examTypes,
      targetDate,
      privacy,
      settings,
      tags
    } = req.body;

    // Update fields
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (examTypes) group.examTypes = examTypes;
    if (targetDate) group.targetDate = new Date(targetDate);
    if (privacy) group.privacy = privacy;
    if (settings) {
      group.settings = { ...group.settings, ...settings };
    }
    if (tags) group.tags = tags;

    group.stats.lastActivity = new Date();
    await group.save();

    await group.populate('admin', 'name profilePicture');
    await group.populate('members.user', 'name profilePicture');

    res.status(200).json({
      success: true,
      message: 'Study group updated successfully',
      data: { group }
    });
  } catch (error) {
    console.error('Update study group error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update study group'
    });
  }
};

// @desc    Join study group
// @route   POST /api/groups/:id/join
// @access  Private
const joinStudyGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);

    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found'
      });
    }

    // Check if already a member
    if (group.isMember(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group'
      });
    }

    // Check group capacity
    if (group.stats.totalMembers >= group.settings.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Group is at maximum capacity'
      });
    }

    // Check privacy settings
    if (group.privacy === 'private') {
      return res.status(403).json({
        success: false,
        message: 'This is a private group. You need an invitation to join'
      });
    }

    // Add member
    group.addMember(req.user.id);
    await group.save();

    // Create activity
    await GroupActivity.createActivity({
      group: group._id,
      user: req.user.id,
      activityType: 'member_joined',
      data: {
        title: 'New Member',
        description: `${req.user.name} joined the group`
      }
    });

    res.status(200).json({
      success: true,
      message: 'Successfully joined the study group',
      data: { groupId: group._id }
    });
  } catch (error) {
    console.error('Join study group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join study group'
    });
  }
};

// @desc    Leave study group
// @route   POST /api/groups/:id/leave
// @access  Private
const leaveStudyGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);

    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found'
      });
    }

    // Check if user is a member
    if (!group.isMember(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Check if user is the admin
    if (group.admin.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Group admin cannot leave. Transfer admin rights first or delete the group'
      });
    }

    // Remove member
    group.removeMember(req.user.id);
    await group.save();

    // Create activity
    await GroupActivity.createActivity({
      group: group._id,
      user: req.user.id,
      activityType: 'member_left',
      data: {
        title: 'Member Left',
        description: `${req.user.name} left the group`
      }
    });

    res.status(200).json({
      success: true,
      message: 'Successfully left the study group'
    });
  } catch (error) {
    console.error('Leave study group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave study group'
    });
  }
};

// @desc    Delete study group
// @route   DELETE /api/groups/:id
// @access  Private
const deleteStudyGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);

    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found'
      });
    }

    // Check if user is the admin
    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only group admin can delete the group'
      });
    }

    // Import models for cascade delete
    const StudyRoom = require('../models/StudyRoom');
    const SharedResource = require('../models/SharedResource');

    // Cascade delete: Remove all associated study rooms
    await StudyRoom.updateMany(
      { group: group._id },
      { isActive: false }
    );

    // Cascade delete: Remove all associated shared resources
    await SharedResource.updateMany(
      { groupId: group._id },
      { isActive: false }
    );

    // Cascade delete: Remove all group activities
    await GroupActivity.updateMany(
      { group: group._id },
      { visibility: 'private' } // Hide activities instead of deleting for audit trail
    );

    // Soft delete the group (mark as inactive)
    group.isActive = false;
    await group.save();

    // Create final activity log
    await GroupActivity.createActivity({
      group: group._id,
      user: req.user.id,
      activityType: 'member_left', // Using existing enum value
      data: {
        title: 'Group Deleted',
        description: `${req.user.name} deleted the group "${group.name}"`
      },
      visibility: 'private'
    });

    res.status(200).json({
      success: true,
      message: 'Study group and all associated content deleted successfully'
    });
  } catch (error) {
    console.error('Delete study group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete study group'
    });
  }
};

// @desc    Get group leaderboard
// @route   GET /api/groups/:id/leaderboard
// @access  Private
const getGroupLeaderboard = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const group = await StudyGroup.findById(req.params.id);

    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found'
      });
    }

    // Check access
    if (group.privacy !== 'public' && !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const leaderboard = await GroupActivity.getGroupLeaderboard(group._id, period);

    res.status(200).json({
      success: true,
      data: { leaderboard, period }
    });
  } catch (error) {
    console.error('Get group leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard'
    });
  }
};

// @desc    Get group activity feed
// @route   GET /api/groups/:id/activities
// @access  Private
const getGroupActivities = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const group = await StudyGroup.findById(req.params.id);

    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found'
      });
    }

    // Check access
    if (group.privacy !== 'public' && !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const activities = await GroupActivity.getGroupFeed(group._id, parseInt(page), parseInt(limit));

    res.status(200).json({
      success: true,
      data: { activities }
    });
  } catch (error) {
    console.error('Get group activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group activities'
    });
  }
};

module.exports = {
  getPublicGroups,
  getUserGroups,
  getStudyGroup,
  createStudyGroup,
  updateStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  deleteStudyGroup,
  getGroupLeaderboard,
  getGroupActivities
};
