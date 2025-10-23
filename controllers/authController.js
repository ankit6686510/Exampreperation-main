const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// Update user activity
const updateUserActivity = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, { lastActiveAt: new Date() });
  } catch (error) {
    console.error('Error updating user activity:', error);
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

    // Generate token
    const token = generateToken(user._id);

    // Update user activity
    await updateUserActivity(user._id);

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
    console.error('Register error:', error);
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

    // Generate token
    const token = generateToken(user._id);

    // Update user activity
    await updateUserActivity(user._id);

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
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
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
    console.error('Get me error:', error);
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
    console.error('Update profile error:', error);
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
    console.error('Change password error:', error);
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
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  updateProgressStats
};
