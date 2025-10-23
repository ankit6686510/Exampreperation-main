const express = require('express');
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  updateChapter,
  addTestToChapter,
  addRevisionToChapter,
  bulkUpdateChapters,
  getBookStats,
  getStudyRecommendations,
  addChapterToBook,
  removeChapterFromBook,
  linkChapterToSyllabus
} = require('../controllers/bookController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Main book routes
router
  .route('/')
  .get(getBooks)
  .post(createBook);

router
  .route('/:id')
  .get(getBook)
  .put(updateBook)
  .delete(deleteBook);

// Book statistics and recommendations
router.get('/:id/stats', getBookStats);
router.get('/:id/recommendations', getStudyRecommendations);

// Chapter management routes
router.post('/:id/chapters', addChapterToBook);
router.put('/:id/chapters/:chapterIndex', updateChapter);
router.delete('/:id/chapters/:chapterIndex', removeChapterFromBook);
router.patch('/:id/chapters/bulk', bulkUpdateChapters);

// Chapter tests and revisions
router.post('/:id/chapters/:chapterIndex/tests', addTestToChapter);
router.post('/:id/chapters/:chapterIndex/revisions', addRevisionToChapter);

// Syllabus integration
router.post('/:id/chapters/:chapterIndex/link-syllabus', linkChapterToSyllabus);

module.exports = router;
