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
const { bookValidations, queryValidations, commonValidations } = require('../middleware/validation');
const { cache, invalidateCacheForUser } = require('../middleware/cache');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(cache(300), queryValidations.pagination, queryValidations.search, getBooks)
  .post(invalidateCacheForUser, bookValidations.create, createBook);

router
  .route('/:id')
  .get(cache(300), commonValidations.mongoId, getBook)
  .put(invalidateCacheForUser, commonValidations.mongoId, updateBook)
  .delete(invalidateCacheForUser, commonValidations.mongoId, deleteBook);

router.get('/:id/stats', cache(300), commonValidations.mongoId, getBookStats);
router.get('/:id/recommendations', cache(300), commonValidations.mongoId, getStudyRecommendations);

router.post('/:id/chapters', invalidateCacheForUser, addChapterToBook);
router.put('/:id/chapters/:chapterIndex', invalidateCacheForUser, updateChapter);
router.delete('/:id/chapters/:chapterIndex', invalidateCacheForUser, removeChapterFromBook);
router.patch('/:id/chapters/bulk', invalidateCacheForUser, bulkUpdateChapters);

router.post('/:id/chapters/:chapterIndex/tests', invalidateCacheForUser, addTestToChapter);
router.post('/:id/chapters/:chapterIndex/revisions', invalidateCacheForUser, addRevisionToChapter);

router.post('/:id/chapters/:chapterIndex/link-syllabus', invalidateCacheForUser, linkChapterToSyllabus);

module.exports = router;
