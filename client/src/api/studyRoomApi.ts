import axiosInstance from './axiosInstance';

export interface StudyRoom {
  _id: string;
  name: string;
  description?: string;
  group: {
    _id: string;
    name: string;
  };
  host: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  scheduledTime: {
    startTime: string;
    endTime: string;
    timezone: string;
  };
  actualTimes: {
    actualStartTime?: string;
    actualEndTime?: string;
  };
  subject: string;
  topics: string[];
  sessionStatus: 'scheduled' | 'active' | 'completed' | 'cancelled';
  roomSettings: {
    maxParticipants: number;
    isPublic: boolean;
    requireApproval: boolean;
    allowLateJoin: boolean;
    enablePomodoro: boolean;
    pomodoroSettings: {
      workDuration: number;
      shortBreak: number;
      longBreak: number;
      cyclesBeforeLongBreak: number;
    };
  };
  participants: Array<{
    user: {
      _id: string;
      name: string;
      profilePicture?: string;
    };
    role: 'host' | 'participant';
    status: 'registered' | 'joined' | 'left';
    joinedAt: string;
  }>;
  pomodoroState?: {
    isActive: boolean;
    currentPhase: 'work' | 'shortBreak' | 'longBreak';
    currentCycle: number;
    phaseStartTime?: string;
    timeRemaining: number;
  };
  stats: {
    totalParticipants: number;
    averageAttendance: number;
    sessionDuration: number;
    completionRate: number;
  };
  feedback: Array<{
    user: {
      _id: string;
      name: string;
    };
    rating: number;
    comment?: string;
    categories: {
      productivity?: number;
      focus?: number;
      collaboration?: number;
      organization?: number;
    };
    submittedAt: string;
  }>;
  tags: string[];
  isRecurring: boolean;
  recurringSettings?: {
    frequency: string;
    daysOfWeek: number[];
    endDate?: string;
  };
  sessionDuration?: number;
  sessionNotes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudyRoomRequest {
  name: string;
  description?: string;
  groupId: string;
  scheduledTime: {
    startTime: string;
    endTime: string;
    timezone?: string;
  };
  subject: string;
  topics?: string[];
  roomSettings?: {
    maxParticipants?: number;
    isPublic?: boolean;
    requireApproval?: boolean;
    allowLateJoin?: boolean;
    enablePomodoro?: boolean;
    pomodoroSettings?: {
      workDuration?: number;
      shortBreak?: number;
      longBreak?: number;
      cyclesBeforeLongBreak?: number;
    };
  };
  tags?: string[];
  isRecurring?: boolean;
  recurringSettings?: {
    frequency: string;
    daysOfWeek: number[];
    endDate?: string;
  };
}

export const studyRoomApi = {
  // Create study room
  createStudyRoom: async (data: CreateStudyRoomRequest) => {
    const response = await axiosInstance.post('/study-rooms', data);
    return response.data;
  },

  // Get study rooms for a group
  getGroupStudyRooms: async (groupId: string, params?: {
    status?: string;
    upcoming?: boolean;
    limit?: number;
    page?: number;
  }) => {
    const response = await axiosInstance.get(`/study-rooms/group/${groupId}`, { params });
    return response.data;
  },

  // Get single study room
  getStudyRoom: async (roomId: string) => {
    const response = await axiosInstance.get(`/study-rooms/${roomId}`);
    return response.data;
  },

  // Join study room
  joinStudyRoom: async (roomId: string) => {
    const response = await axiosInstance.post(`/study-rooms/${roomId}/join`);
    return response.data;
  },

  // Leave study room
  leaveStudyRoom: async (roomId: string) => {
    const response = await axiosInstance.post(`/study-rooms/${roomId}/leave`);
    return response.data;
  },

  // Start study session
  startStudySession: async (roomId: string) => {
    const response = await axiosInstance.post(`/study-rooms/${roomId}/start`);
    return response.data;
  },

  // End study session
  endStudySession: async (roomId: string, sessionNotes?: string) => {
    const response = await axiosInstance.post(`/study-rooms/${roomId}/end`, {
      sessionNotes
    });
    return response.data;
  },

  // Next pomodoro phase
  nextPomodoroPhase: async (roomId: string) => {
    const response = await axiosInstance.post(`/study-rooms/${roomId}/pomodoro/next`);
    return response.data;
  },

  // Submit session feedback
  submitSessionFeedback: async (roomId: string, data: {
    rating: number;
    comment?: string;
    categories?: {
      productivity?: number;
      focus?: number;
      collaboration?: number;
      organization?: number;
    };
  }) => {
    const response = await axiosInstance.post(`/study-rooms/${roomId}/feedback`, data);
    return response.data;
  },

  // Get user's study room history
  getUserStudyRoomHistory: async (params?: {
    limit?: number;
    page?: number;
    status?: string;
  }) => {
    const response = await axiosInstance.get('/study-rooms/my-sessions', { params });
    return response.data;
  },
};
