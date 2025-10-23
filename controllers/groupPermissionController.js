const GroupPermission = require('../models/GroupPermission');
const StudyGroup = require('../models/StudyGroup');
const GroupActivity = require('../models/GroupActivity');
const User = require('../models/User');

// @desc    Request permission to view someone's data
// @route   POST /api/groups/:groupId/permissions/request
// @access  Private
const requestPermission = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { 
      ownerId, 
      permissions, 
      duration = '1month',
      requestMessage,
      isPermanent = false 
    } = req.body;

    // Validate inputs
    if (!ownerId || !permissions) {
      return res.status(400).json({
        success: false,
        message: 'Owner ID and permissions are required'
      });
    }

    // Check if group exists and user is a member
    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found'
      });
    }

    if (!group.isMember(req.user.id) || !group.isMember(ownerId)) {
      return res.status(403).json({
        success: false,
        message: 'Both users must be members of the group'
      });
    }

    // Check if requesting permission from themselves
    if (req.user.id === ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot request permission from yourself'
      });
    }

    // Check if permission already exists
    const existingPermission = await GroupPermission.findOne({
      group: groupId,
      owner: ownerId,
      viewer: req.user.id
    });

    if (existingPermission && existingPermission.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Permission already granted'
      });
    }

    if (existingPermission && existingPermission.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Permission request already pending'
      });
    }

    // Create or update permission request
    const permissionData = {
      group: groupId,
      owner: ownerId,
      viewer: req.user.id,
      permissions,
      duration: {
        isPermanent,
        renewalPeriod: duration
      },
      requestMessage,
      status: 'pending',
      metadata: {
        requestedBy: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    };

    let permission;
    if (existingPermission) {
      // Update existing request
      Object.assign(existingPermission, permissionData);
      permission = await existingPermission.save();
    } else {
      // Create new request
      permission = await GroupPermission.create(permissionData);
    }

    await permission.populate('owner viewer', 'name profilePicture');

    // Create activity
    await GroupActivity.createActivity({
      group: groupId,
      user: req.user.id,
      activityType: 'permission_granted',
      data: {
        title: 'Permission Requested',
        description: `${req.user.name} requested permission to view data`,
        metadata: {
          sharedWith: [{ user: ownerId, permissions: Object.keys(permissions) }]
        }
      },
      visibility: 'private'
    });

    res.status(201).json({
      success: true,
      message: 'Permission request sent successfully',
      data: { permission }
    });
  } catch (error) {
    console.error('Request permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send permission request'
    });
  }
};

// @desc    Respond to permission request (approve/deny)
// @route   PUT /api/groups/:groupId/permissions/:permissionId/respond
// @access  Private
const respondToPermission = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const { action, responseMessage, updatedPermissions } = req.body;

    if (!['approve', 'deny'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approve" or "deny"'
      });
    }

    const permission = await GroupPermission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission request not found'
      });
    }

    // Check if user owns this permission
    if (permission.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only respond to your own permission requests'
      });
    }

    if (permission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This permission request has already been processed'
      });
    }

    if (action === 'approve') {
      // Update permissions if provided
      if (updatedPermissions) {
        permission.permissions = updatedPermissions;
      }
      
      permission.approve(responseMessage);
      
      // Create activity
      await GroupActivity.createActivity({
        group: permission.group,
        user: req.user.id,
        activityType: 'data_shared',
        data: {
          title: 'Permission Granted',
          description: `${req.user.name} shared data with ${permission.viewer.name}`,
          metadata: {
            sharedWith: [{ 
              user: permission.viewer, 
              permissions: Object.keys(permission.permissions).filter(key => 
                permission.permissions[key].enabled
              )
            }]
          }
        },
        visibility: 'group'
      });
    } else {
      permission.status = 'revoked';
      permission.responseMessage = responseMessage;
    }

    await permission.save();
    await permission.populate('owner viewer', 'name profilePicture');

    res.status(200).json({
      success: true,
      message: `Permission request ${action}d successfully`,
      data: { permission }
    });
  } catch (error) {
    console.error('Respond to permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process permission request'
    });
  }
};

// @desc    Get pending permission requests for user
// @route   GET /api/groups/permissions/pending
// @access  Private
const getPendingPermissions = async (req, res) => {
  try {
    const { type = 'received' } = req.query; // 'received' or 'sent'
    
    let query = { status: 'pending' };
    
    if (type === 'received') {
      query.owner = req.user.id;
    } else {
      query.viewer = req.user.id;
    }

    const permissions = await GroupPermission.find(query)
      .populate('owner viewer', 'name profilePicture')
      .populate('group', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { permissions, type }
    });
  } catch (error) {
    console.error('Get pending permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending permissions'
    });
  }
};

// @desc    Get user's active permissions in a group
// @route   GET /api/groups/:groupId/permissions
// @access  Private
const getGroupPermissions = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.query;

    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found'
      });
    }

    if (!group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member of this group'
      });
    }

    // If userId is provided, get permissions for that specific user
    // Otherwise, get all permissions where current user is involved
    let query = {
      group: groupId,
      status: 'active'
    };

    if (userId) {
      query.$or = [
        { owner: userId, viewer: req.user.id },
        { owner: req.user.id, viewer: userId }
      ];
    } else {
      query.$or = [
        { owner: req.user.id },
        { viewer: req.user.id }
      ];
    }

    const permissions = await GroupPermission.find(query)
      .populate('owner viewer', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { permissions }
    });
  } catch (error) {
    console.error('Get group permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group permissions'
    });
  }
};

// @desc    Update permission settings
// @route   PUT /api/groups/permissions/:permissionId
// @access  Private
const updatePermission = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const { permissions, duration, notifications } = req.body;

    const permission = await GroupPermission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    // Check if user owns this permission
    if (permission.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify your own permissions'
      });
    }

    if (permission.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Can only modify active permissions'
      });
    }

    // Update permission settings
    if (permissions) {
      permission.permissions = { ...permission.permissions, ...permissions };
    }
    
    if (duration) {
      permission.duration = { ...permission.duration, ...duration };
    }
    
    if (notifications) {
      permission.notifications = { ...permission.notifications, ...notifications };
    }

    await permission.save();
    await permission.populate('owner viewer', 'name profilePicture');

    res.status(200).json({
      success: true,
      message: 'Permission updated successfully',
      data: { permission }
    });
  } catch (error) {
    console.error('Update permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update permission'
    });
  }
};

// @desc    Revoke permission
// @route   DELETE /api/groups/permissions/:permissionId
// @access  Private
const revokePermission = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const { reason } = req.body;

    const permission = await GroupPermission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    // Check if user owns this permission or is the viewer
    const canRevoke = permission.owner.toString() === req.user.id || 
                     permission.viewer.toString() === req.user.id;
    
    if (!canRevoke) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only owner or viewer can revoke this permission'
      });
    }

    permission.revoke(reason);
    await permission.save();

    res.status(200).json({
      success: true,
      message: 'Permission revoked successfully'
    });
  } catch (error) {
    console.error('Revoke permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke permission'
    });
  }
};

// @desc    Log permission view (when someone views your data)
// @route   POST /api/groups/permissions/:permissionId/view
// @access  Private
const logPermissionView = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const { dataType, details } = req.body;

    const permission = await GroupPermission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    // Check if user is the viewer
    if (permission.viewer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!permission.isValid) {
      return res.status(403).json({
        success: false,
        message: 'Permission has expired or been revoked'
      });
    }

    // Check if user has permission for this data type
    if (!permission.hasPermission(dataType)) {
      return res.status(403).json({
        success: false,
        message: `No permission to view ${dataType} data`
      });
    }

    // Log the view
    permission.logView(dataType, details);
    await permission.save();

    res.status(200).json({
      success: true,
      message: 'View logged successfully'
    });
  } catch (error) {
    console.error('Log permission view error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log view'
    });
  }
};

// @desc    Get permission view history
// @route   GET /api/groups/permissions/:permissionId/history
// @access  Private
const getPermissionHistory = async (req, res) => {
  try {
    const { permissionId } = req.params;

    const permission = await GroupPermission.findById(permissionId)
      .populate('owner viewer', 'name profilePicture');
      
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    // Check if user is owner or viewer
    const canView = permission.owner.toString() === req.user.id || 
                   permission.viewer.toString() === req.user.id;
    
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        permission: {
          id: permission._id,
          status: permission.status,
          createdAt: permission.createdAt,
          viewHistory: permission.viewHistory,
          totalViews: permission.metadata.totalViews,
          lastViewedAt: permission.metadata.lastViewedAt
        }
      }
    });
  } catch (error) {
    console.error('Get permission history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permission history'
    });
  }
};

// @desc    Check if user can view specific data
// @route   GET /api/groups/:groupId/permissions/check
// @access  Private
const checkPermission = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { ownerId, dataType, detail } = req.query;

    if (!ownerId || !dataType) {
      return res.status(400).json({
        success: false,
        message: 'Owner ID and data type are required'
      });
    }

    const canView = await GroupPermission.canView(
      groupId, 
      ownerId, 
      req.user.id, 
      dataType, 
      detail
    );

    res.status(200).json({
      success: true,
      data: { canView }
    });
  } catch (error) {
    console.error('Check permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check permission'
    });
  }
};

module.exports = {
  requestPermission,
  respondToPermission,
  getPendingPermissions,
  getGroupPermissions,
  updatePermission,
  revokePermission,
  logPermissionView,
  getPermissionHistory,
  checkPermission
};
