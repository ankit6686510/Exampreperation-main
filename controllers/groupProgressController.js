const GroupProgressShare = require('../models/GroupProgressShare');
const GroupStats = require('../models/GroupStats');
const StudyGroup = require('../models/StudyGroup');
const StudySession = require('../models/StudySession');
const User = require('../models/User');

// @desc    Get user's progress sharing settings for a group
// @route   GET /api/groups/:groupId/progress-settings
// @access  Private
const getProgressSettings = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Check if user is a member of the group
    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member of this group.'
      });
    }

    let progressSettings = await GroupProgressShare.findOne({
      user: req.user.id,
      group: groupId
    }).populate('partnerList.user', 'name profilePicture');

    // Create default settings if none exist
    if (!progressSettings) {
      progressSettings = await GroupProgressShare.create({
        user: req.user.id,
        group: groupId
      });
      
      // Populate the newly created document
      progressSettings = await GroupProgressShare.findById(progressSettings._id)
        .populate('partnerList.user', 'name profilePicture');
    }

    res.status(200).json({
      success: true,
      data: { progressSettings }
    });
  } catch (error) {
    console.error('Get progress settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress settings'
    });
  }
};

// @desc    Update user's progress sharing settings
// @route   PUT /api/groups/:groupId/progress-settings
// @access  Private
const updateProgressSettings = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { shareSettings, displayPreferences } = req.body;
    
    // Check if user is a member of the group
    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member of this group.'
      });
    }

    let progressSettings = await GroupProgressShare.findOne({
      user: req.user.id,
      group: groupId
    });

    if (!progressSettings) {
      progressSettings = new GroupProgressShare({
        user: req.user.id,
        group: groupId
      });
    }

    // Update settings
    if (shareSettings) {
      progressSettings.shareSettings = { ...progressSettings.shareSettings, ...shareSettings };
    }

    if (displayPreferences) {
      progressSettings.displayPreferences = { ...progressSettings.displayPreferences, ...displayPreferences };
    }

    progressSettings.lastUpdated = new Date();
    await progressSettings.save();

    await progressSettings.populate('partnerList.user', 'name profilePicture');

    res.status(200).json({
      success: true,
      message: 'Progress settings updated successfully',
      data: { progressSettings }
    });
  } catch (error) {
    console.error('Update progress settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress settings'
    });
  }
};

// @desc    Get group progress dashboard
// @route   GET /api/groups/:groupId/progress-dashboard
// @access  Private
const getGroupProgressDashboard = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { period = 'weekly' } = req.query;
    
    // Check if user is a member of the group
    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member of this group.'
      });
    }

    // Get or calculate group stats
    let groupStats = await GroupStats.findOne({ group: groupId, periodType: period });
    
    if (!groupStats || groupStats.needsRefresh()) {
      groupStats = await GroupStats.calculateGroupStats(groupId, period);
    }

    // Get member progress data with privacy controls
    const memberProgressData = await getMemberProgressData(groupId, req.user.id, period);

    // Get user's personal stats for comparison
    const personalStats = await getUserPersonalStats(req.user.id, groupId, period);

    res.status(200).json({
      success: true,
      data: {
        groupStats,
        memberProgress: memberProgressData,
        personalStats,
        period
      }
    });
  } catch (error) {
    console.error('Get group progress dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group progress dashboard'
    });
  }
};

// @desc    Get group leaderboards with privacy controls
// @route   GET /api/groups/:groupId/leaderboards
// @access  Private
const getGroupLeaderboards = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { period = 'weekly', category = 'all' } = req.query;
    
    // Check if user is a member of the group
    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member of this group.'
      });
    }

    // Get group stats
    let groupStats = await GroupStats.findOne({ group: groupId, periodType: period });
    
    if (!groupStats || groupStats.needsRefresh()) {
      groupStats = await GroupStats.calculateGroupStats(groupId, period);
    }

    // Filter leaderboards based on user privacy settings
    const filteredLeaderboards = await filterLeaderboardsByPrivacy(
      groupStats.leaderboardData, 
      groupId, 
      req.user.id,
      category
    );

    res.status(200).json({
      success: true,
      data: {
        leaderboards: filteredLeaderboards,
        period,
        category
      }
    });
  } catch (error) {
    console.error('Get group leaderboards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group leaderboards'
    });
  }
};

// @desc    Request study partnership
// @route   POST /api/groups/:groupId/request-partnership
// @access  Private
const requestStudyPartnership = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { partnerId } = req.body;
    
    // Check if user is a member of the group
    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isMember(req.user.id) || !group.isMember(partnerId)) {
      return res.status(403).json({
        success: false,
        message: 'Both users must be members of this group.'
      });
    }

    if (req.user.id === partnerId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot partner with yourself.'
      });
    }

    // Get or create progress settings for requesting user
    let progressSettings = await GroupProgressShare.findOne({
      user: req.user.id,
      group: groupId
    });

    if (!progressSettings) {
      progressSettings = await GroupProgressShare.create({
        user: req.user.id,
        group: groupId
      });
    }

    // Check if partnership already exists
    const existingPartner = progressSettings.partnerList.find(partner => 
      partner.user.toString() === partnerId
    );

    if (existingPartner) {
      return res.status(400).json({
        success: false,
        message: 'Partnership request already exists or is active.'
      });
    }

    // Add partnership request
    await progressSettings.addPartner(partnerId);

    // Get partner's name for response
    const partner = await User.findById(partnerId, 'name');

    res.status(200).json({
      success: true,
      message: `Partnership request sent to ${partner.name}`,
      data: { partnerId, status: 'pending' }
    });
  } catch (error) {
    console.error('Request study partnership error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send partnership request'
    });
  }
};

// @desc    Respond to study partnership request
// @route   PUT /api/groups/:groupId/respond-partnership
// @access  Private
const respondToPartnership = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { requesterId, status } = req.body; // status: 'accepted' or 'declined'
    
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "accepted" or "declined".'
      });
    }

    // Check if user is a member of the group
    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member of this group.'
      });
    }

    // Find the partnership request in requester's settings
    const requesterSettings = await GroupProgressShare.findOne({
      user: requesterId,
      group: groupId
    });

    if (!requesterSettings) {
      return res.status(404).json({
        success: false,
        message: 'Partnership request not found.'
      });
    }

    const partnershipRequest = requesterSettings.partnerList.find(partner => 
      partner.user.toString() === req.user.id && partner.partnershipStatus === 'pending'
    );

    if (!partnershipRequest) {
      return res.status(404).json({
        success: false,
        message: 'No pending partnership request found.'
      });
    }

    // Update partnership status in requester's settings
    await requesterSettings.updatePartnershipStatus(req.user.id, status);

    if (status === 'accepted') {
      // Add reciprocal partnership in current user's settings
      let userSettings = await GroupProgressShare.findOne({
        user: req.user.id,
        group: groupId
      });

      if (!userSettings) {
        userSettings = await GroupProgressShare.create({
          user: req.user.id,
          group: groupId
        });
      }

      await userSettings.addPartner(requesterId);
      await userSettings.updatePartnershipStatus(requesterId, 'accepted');
    }

    // Get requester's name for response
    const requester = await User.findById(requesterId, 'name');

    res.status(200).json({
      success: true,
      message: status === 'accepted' 
        ? `You are now study partners with ${requester.name}!`
        : `Partnership request from ${requester.name} declined.`,
      data: { requesterId, status }
    });
  } catch (error) {
    console.error('Respond to partnership error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to partnership request'
    });
  }
};

// @desc    Get study partners list
// @route   GET /api/groups/:groupId/study-partners
// @access  Private
const getStudyPartners = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Check if user is a member of the group
    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member of this group.'
      });
    }

    const progressSettings = await GroupProgressShare.findOne({
      user: req.user.id,
      group: groupId
    }).populate('partnerList.user', 'name profilePicture progressStats');

    if (!progressSettings) {
      return res.status(200).json({
        success: true,
        data: { partners: [], pendingRequests: [] }
      });
    }

    const partners = progressSettings.partnerList.filter(partner => 
      partner.partnershipStatus === 'accepted'
    );

    const pendingRequests = progressSettings.partnerList.filter(partner => 
      partner.partnershipStatus === 'pending'
    );

    res.status(200).json({
      success: true,
      data: { partners, pendingRequests }
    });
  } catch (error) {
    console.error('Get study partners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study partners'
    });
  }
};

// Helper function to get member progress data with privacy controls
const getMemberProgressData = async (groupId, viewerUserId, period) => {
  const group = await StudyGroup.findById(groupId).populate('members.user', 'name profilePicture progressStats');
  const activeMembers = group.members.filter(member => member.isActive);
  
  const memberProgressData = [];

  for (const member of activeMembers) {
    const userId = member.user._id;
    const userData = {
      userId,
      name: member.user.name,
      profilePicture: member.user.profilePicture,
      isCurrentUser: userId.toString() === viewerUserId.toString()
    };

    // Check privacy settings for each data type
    const canViewStudyHours = await GroupProgressShare.canViewData(userId, viewerUserId, groupId, 'studyHours');
    const canViewStreak = await GroupProgressShare.canViewData(userId, viewerUserId, groupId, 'studyStreak');
    const canViewSubjects = await GroupProgressShare.canViewData(userId, viewerUserId, groupId, 'subjectProgress');
    const canViewGoals = await GroupProgressShare.canViewData(userId, viewerUserId, groupId, 'goalCompletion');

    if (canViewStudyHours) {
      userData.studyHours = await getUserStudyHours(userId, period);
    }

    if (canViewStreak) {
      userData.currentStreak = member.user.progressStats?.currentStreak || 0;
    }

    if (canViewSubjects) {
      userData.subjectProgress = await getUserSubjectProgress(userId, period);
    }

    if (canViewGoals) {
      userData.goalsCompleted = member.user.progressStats?.totalGoalsCompleted || 0;
    }

    memberProgressData.push(userData);
  }

  return memberProgressData;
};

// Helper function to get user's personal stats
const getUserPersonalStats = async (userId, groupId, period) => {
  const now = new Date();
  let startDate, endDate;
  
  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      break;
    case 'weekly':
      const weekStart = now.getDate() - now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), weekStart);
      endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    default:
      startDate = new Date('2020-01-01');
      endDate = new Date('2030-12-31');
  }

  const studySessions = await StudySession.find({
    user: userId,
    startTime: { $gte: startDate, $lte: endDate }
  });

  const totalHours = studySessions.reduce((sum, session) => sum + (session.duration / 60), 0);
  const averageProductivity = studySessions.length > 0 
    ? studySessions.reduce((sum, session) => sum + session.productivity, 0) / studySessions.length
    : 0;

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    totalSessions: studySessions.length,
    averageProductivity: Math.round(averageProductivity * 100) / 100
  };
};

// Helper function to get user's study hours for a period
const getUserStudyHours = async (userId, period) => {
  const personalStats = await getUserPersonalStats(userId, null, period);
  return personalStats.totalHours;
};

// Helper function to get user's subject progress
const getUserSubjectProgress = async (userId, period) => {
  const personalStats = await getUserPersonalStats(userId, null, period);
  const studySessions = await StudySession.find({
    user: userId,
    startTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
  });

  const subjectData = {};
  studySessions.forEach(session => {
    if (!subjectData[session.subject]) {
      subjectData[session.subject] = 0;
    }
    subjectData[session.subject] += session.duration / 60;
  });

  return Object.entries(subjectData).map(([subject, hours]) => ({
    subject,
    hours: Math.round(hours * 100) / 100
  }));
};

// Helper function to filter leaderboards by privacy settings
const filterLeaderboardsByPrivacy = async (leaderboardData, groupId, viewerUserId, category) => {
  const filteredLeaderboards = {};

  for (const [leaderboardType, leaderboard] of Object.entries(leaderboardData)) {
    if (category !== 'all' && leaderboardType !== category) continue;

    const filteredLeaderboard = [];
    
    for (const entry of leaderboard) {
      const dataType = getDataTypeForLeaderboard(leaderboardType);
      const canView = await GroupProgressShare.canViewData(entry.user, viewerUserId, groupId, dataType);
      
      if (canView) {
        // Populate user data
        const user = await User.findById(entry.user, 'name profilePicture');
        filteredLeaderboard.push({
          ...entry.toObject(),
          user: {
            _id: entry.user,
            name: user?.name || 'Unknown User',
            profilePicture: user?.profilePicture
          }
        });
      } else {
        // Add anonymous entry
        filteredLeaderboard.push({
          ...entry.toObject(),
          user: {
            _id: entry.user,
            name: 'Private User',
            profilePicture: null
          }
        });
      }
    }
    
    filteredLeaderboards[leaderboardType] = filteredLeaderboard;
  }

  return filteredLeaderboards;
};

// Helper function to map leaderboard types to data types
const getDataTypeForLeaderboard = (leaderboardType) => {
  const mapping = {
    topStudyHours: 'studyHours',
    topStreak: 'studyStreak',
    topProductivity: 'subjectProgress',
    topGoalsCompleted: 'goalCompletion'
  };
  
  return mapping[leaderboardType] || 'studyHours';
};

module.exports = {
  getProgressSettings,
  updateProgressSettings,
  getGroupProgressDashboard,
  getGroupLeaderboards,
  requestStudyPartnership,
  respondToPartnership,
  getStudyPartners
};
