const express = require('express');
const {
  getNewspaperAnalyses,
  getNewspaperAnalysis,
  getAnalysisByDate,
  createOrUpdateAnalysis,
  addArticle,
  updateArticle,
  deleteArticle,
  getMonthlyStats,
  getTimeline,
  getCategoryTrends,
  getRevisionReminders,
  generateMonthlyCompilation,
  toggleBookmark,
  getBookmarkedArticles,
  searchArticles,
} = require('../controllers/newspaperAnalysisController');
const { protect: auth } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// GET /api/newspaper-analysis - Get all newspaper analyses with filters
router.get('/', getNewspaperAnalyses);

// GET /api/newspaper-analysis/timeline - Get timeline data
router.get('/timeline', getTimeline);

// GET /api/newspaper-analysis/trends - Get category trends
router.get('/trends', getCategoryTrends);

// GET /api/newspaper-analysis/reminders - Get revision reminders
router.get('/reminders', getRevisionReminders);

// GET /api/newspaper-analysis/bookmarks - Get bookmarked articles
router.get('/bookmarks', getBookmarkedArticles);

// GET /api/newspaper-analysis/search - Search articles
router.get('/search', searchArticles);

// GET /api/newspaper-analysis/stats/:year/:month - Get monthly statistics
router.get('/stats/:year/:month', getMonthlyStats);

// GET /api/newspaper-analysis/compilation/:year/:month - Generate monthly compilation
router.get('/compilation/:year/:month', generateMonthlyCompilation);

// GET /api/newspaper-analysis/date/:date - Get analysis for specific date
router.get('/date/:date', getAnalysisByDate);

// GET /api/newspaper-analysis/:id - Get single newspaper analysis
router.get('/:id', getNewspaperAnalysis);

// POST /api/newspaper-analysis - Create or update newspaper analysis
router.post('/', createOrUpdateAnalysis);

// POST /api/newspaper-analysis/:id/articles - Add article to existing analysis
router.post('/:id/articles', addArticle);

// PUT /api/newspaper-analysis/:id/articles/:articleId - Update specific article
router.put('/:id/articles/:articleId', updateArticle);

// PUT /api/newspaper-analysis/:id/articles/:articleId/bookmark - Toggle bookmark status
router.put('/:id/articles/:articleId/bookmark', toggleBookmark);

// DELETE /api/newspaper-analysis/:id/articles/:articleId - Delete article
router.delete('/:id/articles/:articleId', deleteArticle);

module.exports = router;
