const StudyRoom = require('../models/StudyRoom');
const StudyGroup = require('../models/StudyGroup');
const GroupActivity = require('../models/GroupActivity');
const User = require('../models/User');

// @desc    Create a new study room
// @route   POST /api/study-rooms
// @access  Private
const createStudyRoom = async (req, res) => {
  try {
    const {
      name,
      description,
      groupId,
      scheduledTime,
      subject,
      topics = [],
      roomSettings = {},
      tags = [],
      isRecurring = false,
      recurringSettings = {}
    } = req.body;

    // Validate required fields
    if (!name || !groupId || !scheduledTime.startTime || !scheduledTime.endTime || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Name, group, scheduled time, and subject are required'
      });
    }

    // Check if user has permission to create rooms in this group
    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of the group to create study rooms'
      });
    }

    // Only admin or moderators can create study rooms
    if (!group.canModerate(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Only group admin and moderators can create study rooms'
      });
    }

    // Validate time
    const startTime = new Date(scheduledTime.startTime);
    const endTime = new Date(scheduledTime.endTime);
    
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    if (startTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be in the future'
      });
    }

    // Create study room
    const studyRoom = await StudyRoom.create({
      name,
      description,
      group: groupId,
      host: req.user.id,
      scheduledTime: {
        startTime,
        endTime,
        timezone: scheduledTime.timezone || 'UTC'
      },
      subject,
      topics,
      roomSettings: {
        maxParticipants: roomSettings.maxParticipants || 10,
        isPublic: roomSettings.isPublic !== false,
        requireApproval: roomSettings.requireApproval === true,
        allowLateJoin: roomSettings.allowLateJoin !== false,
        enablePomodoro: roomSettings.enablePomodoro !== false,
        pomodoroSettings: {
          workDuration: roomSettings.pomodoroSettings?.workDuration || 25,
          shortBreak: roomSettings.pomodoroSettings?.shortBreak || 5,
          longBreak: roomSettings.pomodoroSettings?.longBreak || 15,
          cyclesBeforeLongBreak: roomSettings.pomodoroSettings?.cyclesBeforeLongBreak || 4
        }
      },
      tags,
      isRecurring,
      recurringSettings: isRecurring ? recurringSettings : undefined,
      participants: [{
        user: req.user.id,
        role: 'host',
        status: 'registered',
        joinedAt: new Date()
      }]
    });

    // Create group activity
    await GroupActivity.createActivity({
      group: groupId,
      user: req.user.id,
      activityType: 'study_session_scheduled',
      data: {
        title: 'Study Room Created',
        description: `${req.user.name} scheduled a study session: "${name}"`,
        metadata: {
          studyRoomId: studyRoom._id,
          subject: subject,
          startTime: startTime
        }
      }
    });

    await studyRoom.populate('host', 'name profilePicture');
    await studyRoom.populate('participants.user', 'name profilePicture');

    res.status(201).json({
      success: true,
      message: 'Study room created successfully',
      data: { studyRoom }
    });
  } catch (error) {
    console.error('Create study room error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create study room'
    });
  }
};

// @desc    Get study rooms for a group
// @route   GET /api/study-rooms/group/:groupId
// @access  Private
const getGroupStudyRooms = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { 
      status = 'all', 
      upcoming = 'false',
      limit = 20,
      page = 1 
    } = req.query;

    // Check if user is a member of the group
    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member of this group.'
      });
    }

    let query = { group: groupId, isActive: true };
    
    // Filter by status
    if (status !== 'all') {
      query.sessionStatus = status;
    }

    // Filter upcoming sessions
    if (upcoming === 'true') {
      query['scheduledTime.startTime'] = { $gte: new Date() };
      query.sessionStatus = 'scheduled';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const studyRooms = await StudyRoom.find(query)
      .populate('host', 'name profilePicture')
      .populate('participants.user', 'name profilePicture')
      .sort({ 'scheduledTime.startTime': upcoming === 'true' ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StudyRoom.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        studyRooms,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRooms: total,
          hasNext: skip + studyRooms.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get group study rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study rooms'
    });
  }
};

// @desc    Get single study room
// @route   GET /api/study-rooms/:id
// @access  Private
const getStudyRoom = async (req, res) => {
  try {
    const studyRoom = await StudyRoom.findById(req.params.id)
      .populate('host', 'name profilePicture')
      .populate('participants.user', 'name profilePicture')
      .populate('group', 'name');

    if (!studyRoom || !studyRoom.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study room not found'
      });
    }

    // Check if user has access to this study room
    const group = await StudyGroup.findById(studyRoom.group._id);
    if (!group || !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member of the group.'
      });
    }

    res.status(200).json({
      success: true,
      data: { studyRoom }
    });
  } catch (error) {
    console.error('Get study room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study room details'
    });
  }
};

// @desc    Join study room
// @route   POST /api/study-rooms/:id/join
// @access  Private
const joinStudyRoom = async (req, res) => {
  try {
    const studyRoom = await StudyRoom.findById(req.params.id);

    if (!studyRoom || !studyRoom.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study room not found'
      });
    }

    // Check if user is a member of the group
    const group = await StudyGroup.findById(studyRoom.group);
    if (!group || !group.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of the group to join this study room'
      });
    }

    // Check if already a participant
    const existingParticipant = studyRoom.participants.find(p => 
      p.user.toString() === req.user.id
    );

    if (existingParticipant && existingParticipant.status !== 'left') {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this study room'
      });
    }

    // Check capacity
    if (studyRoom.participants.filter(p => p.status === 'registered' || p.status === 'joined').length >= studyRoom.roomSettings.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Study room is at maximum capacity'
      });
    }

    // Check if session has started and late join is not allowed
    const now = new Date();
    if (studyRoom.scheduledTime.startTime <= now && !studyRoom.roomSettings.allowLateJoin) {
      return res.status(400).json({
        success: false,
        message: 'Late join is not allowed for this study room'
      });
    }

    // Add participant
    await studyRoom.addParticipant(req.user.id);

    // Create activity
    await GroupActivity.createActivity({
      group: studyRoom.group,
      user: req.user.id,
      activityType: 'study_room_joined',
      data: {
        title: 'Joined Study Room',
        description: `${req.user.name} joined the study room "${studyRoom.name}"`,
        metadata: {
          studyRoomId: studyRoom._id,
          subject: studyRoom.subject
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Successfully joined the study room'
    });
  } catch (error) {
    console.error('Join study room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join study room'
    });
  }
};

// @desc    Leave study room
// @route   POST /api/study-rooms/:id/leave
// @access  Private
const leaveStudyRoom = async (req, res) => {
  try {
    const studyRoom = await StudyRoom.findById(req.params.id);

    if (!studyRoom || !studyRoom.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study room not found'
      });
    }

    // Check if user is a participant
    const participant = studyRoom.participants.find(p => 
      p.user.toString() === req.user.id
    );

    if (!participant || participant.status === 'left') {
      return res.status(400).json({
        success: false,
        message: 'You are not a participant in this study room'
      });
    }

    // Host cannot leave, must transfer host or cancel session
    if (participant.role === 'host') {
      return res.status(400).json({
        success: false,
        message: 'Host cannot leave. Transfer host role first or cancel the session'
      });
    }

    // Leave session
    await studyRoom.leaveSession(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Successfully left the study room'
    });
  } catch (error) {
    console.error('Leave study room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave study room'
    });
  }
};

// @desc    Start study session
// @route   POST /api/study-rooms/:id/start
// @access  Private
const startStudySession = async (req, res) => {
  try {
    const studyRoom = await StudyRoom.findById(req.params.id);

    if (!studyRoom || !studyRoom.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study room not found'
      });
    }

    // Check if user is the host
    const participant = studyRoom.participants.find(p => 
      p.user.toString() === req.user.id
    );

    if (!participant || participant.role !== 'host') {
      return res.status(403).json({
        success: false,
        message: 'Only the host can start the study session'
      });
    }

    if (studyRoom.sessionStatus !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Study session cannot be started'
      });
    }

    // Start session
    studyRoom.sessionStatus = 'active';
    studyRoom.actualTimes.actualStartTime = new Date();

    // Start pomodoro if enabled
    if (studyRoom.roomSettings.enablePomodoro) {
      await studyRoom.startPomodoro();
    }

    await studyRoom.save();

    // Create activity
    await GroupActivity.createActivity({
      group: studyRoom.group,
      user: req.user.id,
      activityType: 'study_session_started',
      data: {
        title: 'Study Session Started',
        description: `Study room "${studyRoom.name}" is now active`,
        metadata: {
          studyRoomId: studyRoom._id,
          subject: studyRoom.subject
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Study session started successfully',
      data: { 
        sessionStatus: studyRoom.sessionStatus,
        pomodoroState: studyRoom.pomodoroState
      }
    });
  } catch (error) {
    console.error('Start study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start study session'
    });
  }
};

// @desc    End study session
// @route   POST /api/study-rooms/:id/end
// @access  Private
const endStudySession = async (req, res) => {
  try {
    const { sessionNotes = '' } = req.body;
    const studyRoom = await StudyRoom.findById(req.params.id);

    if (!studyRoom || !studyRoom.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study room not found'
      });
    }

    // Check if user is the host
    const participant = studyRoom.participants.find(p => 
      p.user.toString() === req.user.id
    );

    if (!participant || participant.role !== 'host') {
      return res.status(403).json({
        success: false,
        message: 'Only the host can end the study session'
      });
    }

    if (studyRoom.sessionStatus !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Study session is not currently active'
      });
    }

    // End session
    studyRoom.sessionNotes = sessionNotes;
    await studyRoom.endSession();

    // Create activity for session completion
    await GroupActivity.createActivity({
      group: studyRoom.group,
      user: req.user.id,
      activityType: 'study_session_completed',
      data: {
        title: 'Study Session Completed',
        description: `Study room "${studyRoom.name}" has ended`,
        metadata: {
          studyRoomId: studyRoom._id,
          subject: studyRoom.subject,
          duration: studyRoom.sessionDuration,
          participants: studyRoom.stats.totalParticipants
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Study session ended successfully',
      data: { 
        sessionStatus: studyRoom.sessionStatus,
        stats: studyRoom.stats,
        sessionDuration: studyRoom.sessionDuration
      }
    });
  } catch (error) {
    console.error('End study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end study session'
    });
  }
};

// @desc    Update pomodoro timer
// @route   POST /api/study-rooms/:id/pomodoro/next
// @access  Private
const nextPomodoroPhase = async (req, res) => {
  try {
    const studyRoom = await StudyRoom.findById(req.params.id);

    if (!studyRoom || !studyRoom.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study room not found'
      });
    }

    // Check if user is a participant
    const participant = studyRoom.participants.find(p => 
      p.user.toString() === req.user.id && p.status === 'joined'
    );

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You must be an active participant to control the timer'
      });
    }

    if (!studyRoom.roomSettings.enablePomodoro) {
      return res.status(400).json({
        success: false,
        message: 'Pomodoro timer is not enabled for this study room'
      });
    }

    await studyRoom.nextPomodoroPhase();

    res.status(200).json({
      success: true,
      message: 'Pomodoro phase updated',
      data: { pomodoroState: studyRoom.pomodoroState }
    });
  } catch (error) {
    console.error('Update pomodoro phase error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pomodoro phase'
    });
  }
};

// @desc    Submit session feedback
// @route   POST /api/study-rooms/:id/feedback
// @access  Private
const submitSessionFeedback = async (req, res) => {
  try {
    const { rating, comment, categories } = req.body;
    const studyRoom = await StudyRoom.findById(req.params.id);

    if (!studyRoom || !studyRoom.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study room not found'
      });
    }

    // Check if user was a participant
    const participant = studyRoom.participants.find(p => 
      p.user.toString() === req.user.id
    );

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Only participants can submit feedback'
      });
    }

    // Check if feedback already exists
    const existingFeedback = studyRoom.feedback.find(fb => 
      fb.user.toString() === req.user.id
    );

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this session'
      });
    }

    // Add feedback
    studyRoom.feedback.push({
      user: req.user.id,
      rating,
      comment,
      categories: categories || {},
      submittedAt: new Date()
    });

    await studyRoom.save();

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Submit session feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
};

// @desc    Get user's study room history
// @route   GET /api/study-rooms/my-sessions
// @access  Private
const getUserStudyRoomHistory = async (req, res) => {
  try {
    const { limit = 20, page = 1, status = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {
      'participants.user': req.user.id,
      isActive: true
    };

    if (status !== 'all') {
      query.sessionStatus = status;
    }

    const studyRooms = await StudyRoom.find(query)
      .populate('group', 'name')
      .populate('host', 'name profilePicture')
      .sort({ 'scheduledTime.startTime': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StudyRoom.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        studyRooms,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalSessions: total,
          hasNext: skip + studyRooms.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user study room history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study room history'
    });
  }
};

module.exports = {
  createStudyRoom,
  getGroupStudyRooms,
  getStudyRoom,
  joinStudyRoom,
  leaveStudyRoom,
  startStudySession,
  endStudySession,
  nextPomodoroPhase,
  submitSessionFeedback,
  getUserStudyRoomHistory
};
