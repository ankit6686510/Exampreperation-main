const Book = require('../models/Book');
const Syllabus = require('../models/Syllabus');

// @desc    Get all books for user
// @route   GET /api/books
// @access  Private
const getBooks = async (req, res) => {
  try {
    const { subject, priority, status } = req.query;
    let query = { user: req.user.id, isActive: true };

    // Apply filters
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (priority) query.priority = priority;

    const books = await Book.find(query)
      .populate('chapters.linkedSyllabusItems', 'title status')
      .sort({ createdAt: -1 });

    // Calculate additional stats for each book
    const booksWithStats = books.map(book => {
      const bookObj = book.toObject({ virtuals: true });
      return {
        ...bookObj,
        completedChapters: book.completedChapters,
        progressPercentage: book.progressPercentage,
        totalTimeSpent: book.totalTimeSpent,
        totalTests: book.totalTests,
        averageTestScore: book.averageTestScore,
        totalRevisions: book.totalRevisions,
        chaptersNeedingRevision: book.getChaptersNeedingRevision().length,
        studyRecommendations: book.getStudyRecommendations().length
      };
    });

    res.status(200).json({
      success: true,
      count: booksWithStats.length,
      data: booksWithStats
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single book with detailed chapter info
// @route   GET /api/books/:id
// @access  Private
const getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('chapters.linkedSyllabusItems', 'title status subject');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book belongs to user
    if (book.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this book'
      });
    }

    const bookWithStats = {
      ...book.toObject({ virtuals: true }),
      completedChapters: book.completedChapters,
      progressPercentage: book.progressPercentage,
      totalTimeSpent: book.totalTimeSpent,
      totalTests: book.totalTests,
      averageTestScore: book.averageTestScore,
      totalRevisions: book.totalRevisions,
      chaptersNeedingRevision: book.getChaptersNeedingRevision(),
      studyRecommendations: book.getStudyRecommendations()
    };

    res.status(200).json({
      success: true,
      data: bookWithStats
    });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new book
// @route   POST /api/books
// @access  Private
const createBook = async (req, res) => {
  try {
    const { 
      title, 
      author, 
      subject, 
      isbn, 
      edition, 
      publishedYear,
      totalChapters, 
      notes, 
      priority,
      tags,
      chapters 
    } = req.body;

    const book = await Book.create({
      user: req.user.id,
      title,
      author,
      subject,
      isbn,
      edition,
      publishedYear,
      totalChapters,
      notes,
      priority,
      tags,
      chapters: chapters || [] // Allow custom chapters or auto-generate
    });

    res.status(201).json({
      success: true,
      data: book
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private
const updateBook = async (req, res) => {
  try {
    let book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book belongs to user
    if (book.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this book'
      });
    }

    book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book belongs to user
    if (book.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this book'
      });
    }

    // Soft delete by setting isActive to false
    book.isActive = false;
    await book.save();

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update chapter details
// @route   PUT /api/books/:id/chapters/:chapterIndex
// @access  Private
const updateChapter = async (req, res) => {
  try {
    const { chapterIndex } = req.params;
    const { name, status, priority, timeSpent, estimatedTime, notes, tests, revisions } = req.body;

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book belongs to user
    if (book.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this book'
      });
    }

    const chapterIdx = parseInt(chapterIndex);
    if (chapterIdx < 0 || chapterIdx >= book.chapters.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chapter index'
      });
    }

    // Update chapter fields
    if (name !== undefined) book.chapters[chapterIdx].name = name;
    if (status !== undefined) {
      book.updateChapterStatus(chapterIdx, status);
    }
    if (priority !== undefined) book.chapters[chapterIdx].priority = priority;
    if (timeSpent !== undefined) book.chapters[chapterIdx].timeSpent = timeSpent;
    if (estimatedTime !== undefined) book.chapters[chapterIdx].estimatedTime = estimatedTime;
    if (notes !== undefined) book.chapters[chapterIdx].notes = notes;
    
    // Handle tests and revisions arrays
    if (tests !== undefined) book.chapters[chapterIdx].tests = tests;
    if (revisions !== undefined) book.chapters[chapterIdx].revisions = revisions;

    book.chapters[chapterIdx].updatedAt = new Date();
    await book.save();

    res.status(200).json({
      success: true,
      data: book.chapters[chapterIdx]
    });
  } catch (error) {
    console.error('Update chapter error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Add test to chapter
// @route   POST /api/books/:id/chapters/:chapterIndex/tests
// @access  Private
const addTestToChapter = async (req, res) => {
  try {
    const { chapterIndex } = req.params;
    const { testName, score, totalMarks, notes } = req.body;

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book belongs to user
    if (book.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this book'
      });
    }

    const chapterIdx = parseInt(chapterIndex);
    if (chapterIdx < 0 || chapterIdx >= book.chapters.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chapter index'
      });
    }

    const testData = {
      testName: testName || `Test ${book.chapters[chapterIdx].tests.length + 1}`,
      score,
      totalMarks,
      notes,
      testDate: new Date()
    };

    book.addTestToChapter(chapterIdx, testData);
    await book.save();

    res.status(201).json({
      success: true,
      data: testData,
      message: 'Test added successfully'
    });
  } catch (error) {
    console.error('Add test error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Add revision to chapter
// @route   POST /api/books/:id/chapters/:chapterIndex/revisions
// @access  Private
const addRevisionToChapter = async (req, res) => {
  try {
    const { chapterIndex } = req.params;
    const { timeSpent, notes, understanding } = req.body;

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book belongs to user
    if (book.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this book'
      });
    }

    const chapterIdx = parseInt(chapterIndex);
    if (chapterIdx < 0 || chapterIdx >= book.chapters.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chapter index'
      });
    }

    const revisionData = {
      revisionDate: new Date(),
      timeSpent: timeSpent || 0,
      notes,
      understanding: understanding || 'fair'
    };

    book.addRevisionToChapter(chapterIdx, revisionData);
    await book.save();

    res.status(201).json({
      success: true,
      data: revisionData,
      message: 'Revision recorded successfully'
    });
  } catch (error) {
    console.error('Add revision error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Bulk update chapter statuses
// @route   PATCH /api/books/:id/chapters/bulk
// @access  Private
const bulkUpdateChapters = async (req, res) => {
  try {
    const { chapterIndices, action, actionData } = req.body;

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book belongs to user
    if (book.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this book'
      });
    }

    if (!Array.isArray(chapterIndices) || chapterIndices.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chapter indices'
      });
    }

    let updatedCount = 0;

    chapterIndices.forEach(index => {
      if (index >= 0 && index < book.chapters.length) {
        switch (action) {
          case 'mark_completed':
            book.updateChapterStatus(index, 'completed');
            updatedCount++;
            break;
          case 'mark_in_progress':
            book.updateChapterStatus(index, 'in_progress');
            updatedCount++;
            break;
          case 'set_priority':
            if (actionData?.priority) {
              book.chapters[index].priority = actionData.priority;
              updatedCount++;
            }
            break;
          case 'add_time':
            if (actionData?.timeSpent) {
              book.chapters[index].timeSpent += actionData.timeSpent;
              updatedCount++;
            }
            break;
        }
      }
    });

    await book.save();

    res.status(200).json({
      success: true,
      message: `Updated ${updatedCount} chapters successfully`,
      updatedCount
    });
  } catch (error) {
    console.error('Bulk update chapters error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get book statistics
// @route   GET /api/books/:id/stats
// @access  Private
const getBookStats = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book belongs to user
    if (book.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this book'
      });
    }

    const stats = {
      totalChapters: book.totalChapters,
      completedChapters: book.completedChapters,
      progressPercentage: book.progressPercentage,
      totalTimeSpent: book.totalTimeSpent,
      totalTests: book.totalTests,
      averageTestScore: book.averageTestScore,
      totalRevisions: book.totalRevisions,
      chaptersNeedingRevision: book.getChaptersNeedingRevision().length,
      chapterStatusDistribution: {
        not_started: book.chapters.filter(c => c.status === 'not_started').length,
        in_progress: book.chapters.filter(c => c.status === 'in_progress').length,
        completed: book.chapters.filter(c => c.status === 'completed').length,
        needs_revision: book.chapters.filter(c => c.status === 'needs_revision').length
      },
      priorityDistribution: {
        high: book.chapters.filter(c => c.priority === 'high').length,
        medium: book.chapters.filter(c => c.priority === 'medium').length,
        low: book.chapters.filter(c => c.priority === 'low').length
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get book stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get study recommendations
// @route   GET /api/books/:id/recommendations
// @access  Private
const getStudyRecommendations = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book belongs to user
    if (book.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this book'
      });
    }

    const recommendations = {
      nextChaptersToStudy: book.getStudyRecommendations(),
      chaptersNeedingRevision: book.getChaptersNeedingRevision(),
      weakPerformanceChapters: book.chapters.filter(chapter => {
        if (chapter.tests.length === 0) return false;
        const avgScore = chapter.tests.reduce((sum, test) => {
          return sum + (test.totalMarks > 0 ? (test.score / test.totalMarks) * 100 : 0);
        }, 0) / chapter.tests.length;
        return avgScore < 60; // Chapters with less than 60% average
      }).slice(0, 5)
    };

    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add new chapter to book
// @route   POST /api/books/:id/chapters
// @access  Private
const addChapterToBook = async (req, res) => {
  try {
    const { name, priority, estimatedTime, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Chapter name is required'
      });
    }

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book belongs to user
    if (book.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this book'
      });
    }

    // Create new chapter with auto-generated chapter number
    const newChapter = {
      name: name.trim(),
      chapterNumber: book.chapters.length + 1,
      status: 'not_started',
      priority: priority || 'medium',
      timeSpent: 0,
      estimatedTime: estimatedTime || 0,
      tests: [],
      revisions: [],
      notes: notes || '',
      linkedSyllabusItems: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    book.chapters.push(newChapter);
    book.totalChapters = book.chapters.length;
    await book.save();

    const addedChapter = book.chapters[book.chapters.length - 1];

    res.status(201).json({
      success: true,
      data: addedChapter,
      message: 'Chapter added successfully'
    });
  } catch (error) {
    console.error('Add chapter error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Remove chapter from book
// @route   DELETE /api/books/:id/chapters/:chapterIndex
// @access  Private
const removeChapterFromBook = async (req, res) => {
  try {
    const { chapterIndex } = req.params;

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book belongs to user
    if (book.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this book'
      });
    }

    const chapterIdx = parseInt(chapterIndex);
    if (chapterIdx < 0 || chapterIdx >= book.chapters.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chapter index'
      });
    }

    // Remove the chapter
    const removedChapter = book.chapters[chapterIdx];
    book.chapters.splice(chapterIdx, 1);

    // Update chapter numbers for remaining chapters
    for (let i = chapterIdx; i < book.chapters.length; i++) {
      book.chapters[i].chapterNumber = i + 1;
      book.chapters[i].updatedAt = new Date();
    }

    book.totalChapters = book.chapters.length;
    await book.save();

    res.status(200).json({
      success: true,
      message: 'Chapter removed successfully',
      data: {
        removedChapter: removedChapter.name,
        remainingChapters: book.chapters.length
      }
    });
  } catch (error) {
    console.error('Remove chapter error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Link chapter to syllabus item
// @route   POST /api/books/:id/chapters/:chapterIndex/link-syllabus
// @access  Private
const linkChapterToSyllabus = async (req, res) => {
  try {
    const { chapterIndex } = req.params;
    const { syllabusItemId } = req.body;

    const book = await Book.findById(req.params.id);
    const syllabusItem = await Syllabus.findById(syllabusItemId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (!syllabusItem) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus item not found'
      });
    }

    // Check ownership
    if (book.user.toString() !== req.user.id || syllabusItem.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const chapterIdx = parseInt(chapterIndex);
    if (chapterIdx < 0 || chapterIdx >= book.chapters.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chapter index'
      });
    }

    // Add link if not already exists
    if (!book.chapters[chapterIdx].linkedSyllabusItems.includes(syllabusItemId)) {
      book.chapters[chapterIdx].linkedSyllabusItems.push(syllabusItemId);
    }

    // Add reverse link in syllabus
    if (!syllabusItem.linkedBooks.includes(book._id)) {
      syllabusItem.linkedBooks.push(book._id);
    }

    await book.save();
    await syllabusItem.save();

    res.status(200).json({
      success: true,
      message: 'Chapter linked to syllabus item successfully'
    });
  } catch (error) {
    console.error('Link chapter to syllabus error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

module.exports = {
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
};
