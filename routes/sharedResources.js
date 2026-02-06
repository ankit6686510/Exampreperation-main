const express = require('express');
const {
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
} = require('../controllers/sharedResourceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Resource CRUD operations
router.post('/', createSharedResource);
router.get('/my-bookmarks', getUserBookmarks);
router.get('/my-resources', getUserSharedResources);
router.get('/group/:groupId', getGroupResources);
router.get('/group/:groupId/trending', getTrendingResources);
router.get('/:id', getSharedResource);

// Resource interactions
router.post('/:id/download', downloadResource);
router.post('/:id/bookmark', toggleBookmark);
router.post('/:id/rate', rateResource);
router.post('/:id/flag', flagResource);

module.exports = router;
