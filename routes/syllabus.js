const express = require('express');
const {
  getSyllabus,
  getSyllabusStats,
  getSyllabusItem,
  createSyllabusItem,
  updateSyllabusItem,
  deleteSyllabusItem,
  bulkUpdateSyllabus,
  getStudyRecommendations,
  linkBooksToSyllabus,
} = require('../controllers/syllabusController');
const { protect: auth } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// GET /api/syllabus - Get all syllabus items in tree structure
router.get('/', getSyllabus);

// GET /api/syllabus/stats - Get syllabus statistics
router.get('/stats', getSyllabusStats);

// GET /api/syllabus/recommendations - Get study recommendations
router.get('/recommendations', getStudyRecommendations);

// GET /api/syllabus/:id - Get single syllabus item
router.get('/:id', getSyllabusItem);

// POST /api/syllabus - Create new syllabus item
router.post('/', createSyllabusItem);

// PUT /api/syllabus/:id - Update syllabus item
router.put('/:id', updateSyllabusItem);

// DELETE /api/syllabus/:id - Delete syllabus item
router.delete('/:id', deleteSyllabusItem);

// PUT /api/syllabus/bulk/update - Bulk update syllabus items
router.put('/bulk/update', bulkUpdateSyllabus);

// PUT /api/syllabus/:id/link-books - Link books to syllabus item
router.put('/:id/link-books', linkBooksToSyllabus);

module.exports = router;
