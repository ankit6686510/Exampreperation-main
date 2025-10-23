const StudySession = require('../models/StudySession');
const User = require('../models/User');

// @desc    Create new study session
// @route   POST /api/sessions
// @access  Private
const createStudySession = async (req, res) => {
  try {
    const { subject, topic, startTime, endTime, duration, sessionType, productivity, notes, breaksTaken, mood } = req.body;

    const studySession = await StudySession.create({
      user: req.user.id,
      subject,
      topic,
      startTime,
      endTime,
      duration,
      sessionType,
      productivity,
      notes,
      breaksTaken,
      mood
    });

    // Update user progress stats
    const sessionDuration = studySession.duration;
    const user = await User.findById(req.user.id);
    user.progressStats.totalStudyHours += Math.round(sessionDuration / 60 * 100) / 100; // Convert to hours
    user.progressStats.lastStudyDate = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Study session created successfully',
      data: studySession
    });
  } catch (error) {
    console.error('Create study session error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all study sessions for user
// @route   GET /api/sessions
// @access  Private
const getStudySessions = async (req, res) => {
  try {
    const { page = 1, limit = 10, subject, startDate, endDate } = req.query;

    // Build filter
    const filter = { user: req.user.id };
    
    if (subject) {
      filter.subject = subject;
    }
    
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }

    const sessions = await StudySession.find(filter)
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await StudySession.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: sessions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get study sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get study session by ID
// @route   GET /api/sessions/:id
// @access  Private
const getStudySession = async (req, res) => {
  try {
    const session = await StudySession.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Get study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update study session
// @route   PUT /api/sessions/:id
// @access  Private
const updateStudySession = async (req, res) => {
  try {
    const session = await StudySession.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Study session updated successfully',
      data: session
    });
  } catch (error) {
    console.error('Update study session error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete study session
// @route   DELETE /api/sessions/:id
// @access  Private
const deleteStudySession = async (req, res) => {
  try {
    const session = await StudySession.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Study session deleted successfully'
    });
  } catch (error) {
    console.error('Delete study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get study analytics
// @route   GET /api/sessions/analytics
// @access  Private
const getStudyAnalytics = async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const sessions = await StudySession.find({
      user: req.user.id,
      startTime: { $gte: startDate }
    });

    // Calculate analytics
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
    const totalHours = Math.round(totalMinutes / 60 * 100) / 100;
    
    const subjectBreakdown = sessions.reduce((acc, session) => {
      acc[session.subject] = (acc[session.subject] || 0) + session.duration;
      return acc;
    }, {});

    const sessionTypeBreakdown = sessions.reduce((acc, session) => {
      acc[session.sessionType] = (acc[session.sessionType] || 0) + session.duration;
      return acc;
    }, {});

    const averageProductivity = sessions.length > 0 
      ? Math.round(sessions.reduce((sum, session) => sum + session.productivity, 0) / sessions.length * 100) / 100
      : 0;

    const dailyStudy = {};
    sessions.forEach(session => {
      const date = session.startTime.toISOString().split('T')[0];
      dailyStudy[date] = (dailyStudy[date] || 0) + session.duration;
    });

    res.status(200).json({
      success: true,
      data: {
        period,
        totalSessions,
        totalHours,
        averageProductivity,
        subjectBreakdown,
        sessionTypeBreakdown,
        dailyStudy
      }
    });
  } catch (error) {
    console.error('Get study analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  createStudySession,
  getStudySessions,
  getStudySession,
  updateStudySession,
  deleteStudySession,
  getStudyAnalytics
};
