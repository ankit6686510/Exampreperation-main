const express = require('express');
const {
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
} = require('../controllers/resourceController');
const { protect } = require('../middleware/auth');
const { resourceValidations, queryValidations } = require('../middleware/validation');

const router = express.Router();

// Protect all routes
router.use(protect);

// Utility routes (must come before parameterized routes)
router.get('/categories', getCategories);
router.get('/tags', getTags);
router.get('/stats', getResourceStats);
router.post('/bulk', bulkOperations);

// Main resource routes
router
  .route('/')
  .get(queryValidations.pagination, queryValidations.search, getResources)
  .post(resourceValidations.create, createResource);

router
  .route('/:id')
  .get(resourceValidations.getById, getResource)
  .put(resourceValidations.update, updateResource)
  .delete(resourceValidations.delete, deleteResource);

// Resource interaction routes
router.post('/:id/access', resourceValidations.getById, recordAccess);
router.post('/:id/bookmark', resourceValidations.getById, toggleBookmark);

module.exports = router;
