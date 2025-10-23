const NewspaperAnalysis = require('../models/NewspaperAnalysis');

// Get all newspaper analyses with filters
const getNewspaperAnalyses = async (req, res) => {
  try {
    const { source, category, priority, startDate, endDate, search } = req.query;
    const filters = { user: req.user.id, isArchived: false };
    
    if (source) filters.source = source;
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }
    
    let analyses = await NewspaperAnalysis.find(filters)
      .sort({ date: -1 })
      .limit(100);
    
    // Filter by article category or priority if specified
    if (category || priority || search) {
      analyses = analyses.filter(analysis => {
        return analysis.articles.some(article => {
          let matches = true;
          
          if (category && article.category !== category) matches = false;
          if (priority && article.priority !== priority) matches = false;
          if (search) {
            const searchRegex = new RegExp(search, 'i');
            matches = matches && (
              searchRegex.test(article.title) ||
              searchRegex.test(article.summary) ||
              article.tags.some(tag => searchRegex.test(tag))
            );
          }
          
          return matches;
        });
      });
    }
    
    res.json({
      success: true,
      data: analyses,
    });
  } catch (error) {
    console.error('Get newspaper analyses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch newspaper analyses',
    });
  }
};

// Get single newspaper analysis
const getNewspaperAnalysis = async (req, res) => {
  try {
    const analysis = await NewspaperAnalysis.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate('articles.linkedTopics');
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Newspaper analysis not found',
      });
    }
    
    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Get newspaper analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch newspaper analysis',
    });
  }
};

// Get analysis for specific date
const getAnalysisByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    
    // Set to start and end of day
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
    
    const analyses = await NewspaperAnalysis.find({
      user: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay },
      isArchived: false,
    }).sort({ source: 1 });
    
    res.json({
      success: true,
      data: analyses,
    });
  } catch (error) {
    console.error('Get analysis by date error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analysis for date',
    });
  }
};

// Create or update newspaper analysis
const createOrUpdateAnalysis = async (req, res) => {
  try {
    const {
      date,
      source,
      articles,
      totalTimeSpent,
      overallNotes,
      importantEvents,
      monthlyTheme,
    } = req.body;
    
    const analysisDate = new Date(date);
    const startOfDay = new Date(analysisDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(analysisDate.setHours(23, 59, 59, 999));
    
    // Check if analysis already exists for this date and source
    let analysis = await NewspaperAnalysis.findOne({
      user: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay },
      source,
    });
    
    if (analysis) {
      // Update existing analysis
      if (articles) analysis.articles = articles;
      if (totalTimeSpent !== undefined) analysis.totalTimeSpent = totalTimeSpent;
      if (overallNotes !== undefined) analysis.overallNotes = overallNotes;
      if (importantEvents) analysis.importantEvents = importantEvents;
      if (monthlyTheme !== undefined) analysis.monthlyTheme = monthlyTheme;
      
      await analysis.save();
      
      res.json({
        success: true,
        data: analysis,
        message: 'Newspaper analysis updated successfully',
      });
    } else {
      // Create new analysis
      analysis = new NewspaperAnalysis({
        user: req.user.id,
        date: new Date(date),
        source,
        articles: articles || [],
        totalTimeSpent: totalTimeSpent || 0,
        overallNotes,
        importantEvents: importantEvents || [],
        monthlyTheme,
      });
      
      await analysis.save();
      
      res.status(201).json({
        success: true,
        data: analysis,
        message: 'Newspaper analysis created successfully',
      });
    }
  } catch (error) {
    console.error('Create/Update newspaper analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save newspaper analysis',
    });
  }
};

// Add article to existing analysis
const addArticle = async (req, res) => {
  try {
    const analysis = await NewspaperAnalysis.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Newspaper analysis not found',
      });
    }
    
    const newArticle = {
      ...req.body,
      order: analysis.articles.length,
    };
    
    analysis.articles.push(newArticle);
    await analysis.save();
    
    res.json({
      success: true,
      data: analysis,
      message: 'Article added successfully',
    });
  } catch (error) {
    console.error('Add article error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add article',
    });
  }
};

// Update specific article
const updateArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    
    const analysis = await NewspaperAnalysis.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Newspaper analysis not found',
      });
    }
    
    const article = analysis.articles.id(articleId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }
    
    // Update article fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        article[key] = req.body[key];
      }
    });
    
    // Update revision tracking if article was marked for revision
    if (req.body.lastRevisedAt) {
      article.revisionCount = (article.revisionCount || 0) + 1;
    }
    
    await analysis.save();
    
    res.json({
      success: true,
      data: analysis,
      message: 'Article updated successfully',
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update article',
    });
  }
};

// Delete article
const deleteArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    
    const analysis = await NewspaperAnalysis.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Newspaper analysis not found',
      });
    }
    
    analysis.articles.id(articleId).remove();
    await analysis.save();
    
    res.json({
      success: true,
      data: analysis,
      message: 'Article deleted successfully',
    });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete article',
    });
  }
};

// Get monthly statistics
const getMonthlyStats = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    const stats = await NewspaperAnalysis.getMonthlyStats(
      req.user.id,
      parseInt(year),
      parseInt(month)
    );
    
    // Get overall monthly summary
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const monthlySummary = await NewspaperAnalysis.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalDays: { $sum: 1 },
          totalArticles: { $sum: { $size: '$articles' } },
          totalTimeSpent: { $sum: '$totalTimeSpent' },
          avgArticlesPerDay: { $avg: { $size: '$articles' } },
          sources: { $addToSet: '$source' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        categoryStats: stats,
        summary: monthlySummary[0] || {
          totalDays: 0,
          totalArticles: 0,
          totalTimeSpent: 0,
          avgArticlesPerDay: 0,
          sources: []
        }
      },
    });
  } catch (error) {
    console.error('Get monthly stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly statistics',
    });
  }
};

// Get timeline data
const getTimeline = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const timeline = await NewspaperAnalysis.getTimeline(req.user.id, parseInt(days));
    
    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch timeline data',
    });
  }
};

// Get category trends
const getCategoryTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const trends = await NewspaperAnalysis.getCategoryTrends(req.user.id, parseInt(days));
    
    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error('Get category trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category trends',
    });
  }
};

// Get revision reminders
const getRevisionReminders = async (req, res) => {
  try {
    const reminders = await NewspaperAnalysis.getRevisionReminders(req.user.id);
    
    res.json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    console.error('Get revision reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revision reminders',
    });
  }
};

// Generate monthly compilation
const generateMonthlyCompilation = async (req, res) => {
  try {
    const { year, month } = req.params;
    const { format = 'json' } = req.query;
    
    const compilation = await NewspaperAnalysis.generateMonthlyCompilation(
      req.user.id,
      parseInt(year),
      parseInt(month)
    );
    
    if (format === 'pdf') {
      // TODO: Implement PDF generation
      return res.status(501).json({
        success: false,
        message: 'PDF generation not implemented yet',
      });
    }
    
    res.json({
      success: true,
      data: {
        month: parseInt(month),
        year: parseInt(year),
        categories: compilation,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Generate monthly compilation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly compilation',
    });
  }
};

// Bookmark/unbookmark article
const toggleBookmark = async (req, res) => {
  try {
    const { articleId } = req.params;
    
    const analysis = await NewspaperAnalysis.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Newspaper analysis not found',
      });
    }
    
    const article = analysis.articles.id(articleId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }
    
    article.isBookmarked = !article.isBookmarked;
    await analysis.save();
    
    res.json({
      success: true,
      data: analysis,
      message: article.isBookmarked ? 'Article bookmarked' : 'Bookmark removed',
    });
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle bookmark',
    });
  }
};

// Get bookmarked articles
const getBookmarkedArticles = async (req, res) => {
  try {
    const { category, days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const pipeline = [
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate },
          isArchived: false,
        }
      },
      { $unwind: '$articles' },
      { $match: { 'articles.isBookmarked': true } }
    ];
    
    if (category) {
      pipeline.push({ $match: { 'articles.category': category } });
    }
    
    pipeline.push(
      {
        $project: {
          date: 1,
          source: 1,
          title: '$articles.title',
          summary: '$articles.summary',
          category: '$articles.category',
          priority: '$articles.priority',
          examRelevance: '$articles.examRelevance',
          tags: '$articles.tags',
          notes: '$articles.notes',
          articleId: '$articles._id',
        }
      },
      { $sort: { date: -1 } }
    );
    
    const bookmarkedArticles = await NewspaperAnalysis.aggregate(pipeline);
    
    res.json({
      success: true,
      data: bookmarkedArticles,
    });
  } catch (error) {
    console.error('Get bookmarked articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookmarked articles',
    });
  }
};

// Search articles
const searchArticles = async (req, res) => {
  try {
    const { query, category, priority, examRelevance, startDate, endDate } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }
    
    const pipeline = [
      {
        $match: {
          user: req.user._id,
          isArchived: false,
        }
      }
    ];
    
    // Date filter
    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      pipeline[0].$match.date = dateFilter;
    }
    
    pipeline.push(
      { $unwind: '$articles' },
      {
        $match: {
          $or: [
            { 'articles.title': new RegExp(query, 'i') },
            { 'articles.summary': new RegExp(query, 'i') },
            { 'articles.keyPoints': new RegExp(query, 'i') },
            { 'articles.tags': new RegExp(query, 'i') },
          ]
        }
      }
    );
    
    // Additional filters
    if (category) {
      pipeline.push({ $match: { 'articles.category': category } });
    }
    if (priority) {
      pipeline.push({ $match: { 'articles.priority': priority } });
    }
    if (examRelevance) {
      pipeline.push({ $match: { 'articles.examRelevance': examRelevance } });
    }
    
    pipeline.push(
      {
        $project: {
          date: 1,
          source: 1,
          title: '$articles.title',
          summary: '$articles.summary',
          keyPoints: '$articles.keyPoints',
          category: '$articles.category',
          priority: '$articles.priority',
          examRelevance: '$articles.examRelevance',
          tags: '$articles.tags',
          notes: '$articles.notes',
          isBookmarked: '$articles.isBookmarked',
          articleId: '$articles._id',
        }
      },
      { $sort: { date: -1 } },
      { $limit: 100 }
    );
    
    const searchResults = await NewspaperAnalysis.aggregate(pipeline);
    
    res.json({
      success: true,
      data: searchResults,
      query,
    });
  } catch (error) {
    console.error('Search articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search articles',
    });
  }
};

module.exports = {
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
};
