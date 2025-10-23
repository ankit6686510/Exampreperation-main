const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/studyGroupController');

const {
  requestPermission,
  respondToPermission,
  getPendingPermissions,
  getGroupPermissions,
  updatePermission,
  revokePermission,
  logPermissionView,
  getPermissionHistory,
  checkPermission
} = require('../controllers/groupPermissionController');

const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getPublicGroups);

// Protected routes
router.use(protect);

// Group CRUD operations
router.get('/my-groups', getUserGroups);
router.post('/', createStudyGroup);
router.get('/:id', getStudyGroup);
router.put('/:id', updateStudyGroup);
router.delete('/:id', deleteStudyGroup);

// Group membership
router.post('/:id/join', joinStudyGroup);
router.post('/:id/leave', leaveStudyGroup);

// Group analytics
router.get('/:id/leaderboard', getGroupLeaderboard);
router.get('/:id/activities', getGroupActivities);

// Permission management routes
router.get('/permissions/pending', getPendingPermissions);
router.get('/:groupId/permissions', getGroupPermissions);
router.get('/:groupId/permissions/check', checkPermission);
router.post('/:groupId/permissions/request', requestPermission);
router.put('/:groupId/permissions/:permissionId/respond', respondToPermission);
router.put('/permissions/:permissionId', updatePermission);
router.delete('/permissions/:permissionId', revokePermission);
router.post('/permissions/:permissionId/view', logPermissionView);
router.get('/permissions/:permissionId/history', getPermissionHistory);

module.exports = router;
