const express = require('express');
const {
  getUpscResources,
  getSubjectStats,
  getUpscResource,
  createUpscResource,
  updateUpscResource,
  updateChapterStatus,
  deleteUpscResource,
  importUpscTemplate,
  getTemplates,
  bulkUpdateResources,
} = require('../controllers/upscResourceController');
const { protect: auth } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// GET /api/upsc-resources - Get all UPSC resources with filters
router.get('/', getUpscResources);

// GET /api/upsc-resources/stats - Get subject-wise statistics
router.get('/stats', getSubjectStats);

// GET /api/upsc-resources/templates - Get available templates
router.get('/templates', getTemplates);

// POST /api/upsc-resources/import-template - Import UPSC template
router.post('/import-template', importUpscTemplate);

// PUT /api/upsc-resources/bulk-update - Bulk update resources
router.put('/bulk-update', bulkUpdateResources);

// GET /api/upsc-resources/:id - Get single UPSC resource
router.get('/:id', getUpscResource);

// POST /api/upsc-resources - Create new UPSC resource
router.post('/', createUpscResource);

// PUT /api/upsc-resources/:id - Update UPSC resource
router.put('/:id', updateUpscResource);

// PUT /api/upsc-resources/:id/chapters - Update chapter status
router.put('/:id/chapters', updateChapterStatus);

// DELETE /api/upsc-resources/:id - Delete UPSC resource
router.delete('/:id', deleteUpscResource);

module.exports = router;
