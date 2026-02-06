const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const logger = require('../config/logger');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// Update user activity
const updateUserActivity = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, { lastActiveAt: new Date() });
  } catch (error) {
    logger.error('Error updating user activity:', {
      userId,
      error: error.message,
      stack: error.stack
    });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, examTypes, examDate } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      examTypes,
      examDate
    });

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Update user activity
    await updateUserActivity(user._id);

    // Set httpOnly cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          examTypes: user.examTypes,
          examDate: user.examDate,
          profilePicture: user.profilePicture,
          studyPreferences: user.studyPreferences,
          progressStats: user.progressStats,
          notifications: user.notifications
        },
        token
      }
    });

  } catch (error) {
    logger.error('Register error:', { error: error.message, stack: error.stack, context: 'Register' });
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user (include password)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Update user activity
    await updateUserActivity(user._id);

    // Set httpOnly cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          examTypes: user.examTypes,
          examDate: user.examDate,
          profilePicture: user.profilePicture,
          studyPreferences: user.studyPreferences,
          progressStats: user.progressStats,
          notifications: user.notifications
        },
        token
      }
    });

  } catch (error) {
    logger.error('Login error:', { error: error.message, stack: error.stack, context: 'Login' });
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

    // Generate new access token
    const newToken = generateToken(decoded.id);

    res.status(200).json({
      success: true,
      data: {
        token: newToken
      }
    });

  } catch (error) {
    logger.error('Refresh token error:', { error: error.message, stack: error.stack, context: 'Refresh token' });
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', { error: error.message, stack: error.stack, context: 'Logout' });
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Update user activity
    await updateUserActivity(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          examTypes: user.examTypes,
          examDate: user.examDate,
          profilePicture: user.profilePicture,
          targetScore: user.targetScore,
          studyPreferences: user.studyPreferences,
          progressStats: user.progressStats,
          notifications: user.notifications,
          createdAt: user.createdAt,
          lastActiveAt: user.lastActiveAt
        }
      }
    });
  } catch (error) {
    logger.error('Get me error:', { error: error.message, stack: error.stack, context: 'Get me' });
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      examTypes: req.body.examTypes,
      examDate: req.body.examDate,
      targetScore: req.body.targetScore,
      studyPreferences: req.body.studyPreferences,
      notifications: req.body.notifications
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => {
      if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          examTypes: user.examTypes,
          examDate: user.examDate,
          profilePicture: user.profilePicture,
          targetScore: user.targetScore,
          studyPreferences: user.studyPreferences,
          progressStats: user.progressStats,
          notifications: user.notifications
        }
      }
    });
  } catch (error) {
    logger.error('Update profile error:', { error: error.message, stack: error.stack, context: 'Update profile' });
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', { error: error.message, stack: error.stack, context: 'Change password' });
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update progress stats
// @route   PUT /api/auth/progress
// @access  Private
const updateProgressStats = async (req, res) => {
  try {
    const { action, value = 1 } = req.body;
    const user = await User.findById(req.user.id);

    switch (action) {
      case 'addStudyHours':
        user.progressStats.totalStudyHours += value;
        break;
      case 'completeGoal':
        user.progressStats.totalGoalsCompleted += value;
        break;
      case 'completeBook':
        user.progressStats.totalBooksRead += value;
        break;
      case 'updateStreak':
        user.progressStats.currentStreak = value;
        if (value > user.progressStats.longestStreak) {
          user.progressStats.longestStreak = value;
        }
        break;
      case 'resetStreak':
        user.progressStats.currentStreak = 0;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    user.progressStats.lastStudyDate = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Progress stats updated',
      data: { progressStats: user.progressStats }
    });
  } catch (error) {
    logger.error('Update progress error:', { error: error.message, stack: error.stack, context: 'Update progress' });
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
  updateProgressStats
};