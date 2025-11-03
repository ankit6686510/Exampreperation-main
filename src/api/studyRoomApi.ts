import axiosInstance from './axiosInstance';

export interface PomodoroSettings {
  workDuration: number;
  shortBreak: number;
  longBreak: number;
  cyclesBeforeLongBreak: number;
}

export interface RoomSettings {
  maxParticipants: number;
  isPublic: boolean;
  requireApproval: boolean;
  allowLateJoin: boolean;
  enablePomodoro: boolean;
  pomodoroSettings: PomodoroSettings;
}

export interface Participant {
  user: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  joinedAt: string;
  status: 'registered' | 'joined' | 'left' | 'removed';
  role: 'host' | 'co-host' | 'participant';
  studyTime: number;
  breakTime: number;
  lastActivity: string;
}

export interface PomodoroState {
  currentCycle: number;
  currentPhase: 'work' | 'short-break' | 'long-break' | 'stopped';
  phaseStartTime?: string;
  phaseEndTime?: string;
  totalCycles: number;
}

export interface SessionFeedback {
  user: string;
  rating: number;
  comment?: string;
  categories?: {
    organization?: number;
    content?: number;
    interaction?: number;
    helpfulness?: number;
  };
  submittedAt: string;
}

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
  };
  scheduledTime: {
    startTime: string;
    endTime: string;
    timezone: string;
  };
  subject: string;
  topics: string[];
  roomSettings: RoomSettings;
  participants: Participant[];
  sessionStatus: 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  actualTimes: {
    actualStartTime?: string;
    actualEndTime?: string;
  };
  pomodoroState: PomodoroState;
  stats: {
    totalParticipants: number;
    averageAttendance: number;
    totalStudyTime: number;
    averageSessionRating: number;
  };
  sessionNotes?: string;
  tags: string[];
  isRecurring: boolean;
  recurringSettings?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
    endDate?: string;
    maxOccurrences?: number;
  };
  feedback: SessionFeedback[];
  isActive: boolean;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export const createStudyRoom = async (
  data: Partial<StudyRoom>
): Promise<StudyRoom> => {
  const response = await axiosInstance.post('/study-rooms', data);
  return response.data;
};

export const getGroupStudyRooms = async (
  groupId: string,
  params?: { status?: string; upcoming?: boolean }
): Promise<StudyRoom[]> => {
  const response = await axiosInstance.get(`/study-rooms/group/${groupId}`, { params });
  return response.data;
};

export const getStudyRoom = async (id: string): Promise<StudyRoom> => {
  const response = await axiosInstance.get(`/study-rooms/${id}`);
  return response.data;
};

export const joinStudyRoom = async (id: string): Promise<StudyRoom> => {
  const response = await axiosInstance.post(`/study-rooms/${id}/join`);
  return response.data;
};

export const leaveStudyRoom = async (id: string): Promise<StudyRoom> => {
  const response = await axiosInstance.post(`/study-rooms/${id}/leave`);
  return response.data;
};

export const startStudySession = async (id: string): Promise<StudyRoom> => {
  const response = await axiosInstance.post(`/study-rooms/${id}/start`);
  return response.data;
};

export const endStudySession = async (id: string): Promise<StudyRoom> => {
  const response = await axiosInstance.post(`/study-rooms/${id}/end`);
  return response.data;
};

export const nextPomodoroPhase = async (id: string): Promise<StudyRoom> => {
  const response = await axiosInstance.post(`/study-rooms/${id}/pomodoro/next`);
  return response.data;
};

export const submitSessionFeedback = async (
  id: string,
  feedback: {
    rating: number;
    comment?: string;
    categories?: {
      organization?: number;
      content?: number;
      interaction?: number;
      helpfulness?: number;
    };
  }
): Promise<StudyRoom> => {
  const response = await axiosInstance.post(`/study-rooms/${id}/feedback`, feedback);
  return response.data;
};

export const getUserStudyRoomHistory = async (params?: {
  limit?: number;
  skip?: number;
}): Promise<StudyRoom[]> => {
  const response = await axiosInstance.get('/study-rooms/my-sessions', { params });
  return response.data;
};
