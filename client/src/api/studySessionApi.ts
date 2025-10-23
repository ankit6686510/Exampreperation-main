import axiosInstance from './axiosInstance';

export interface StudySession {
  _id: string;
  user: string;
  subject: string;
  topic?: string;
  startTime: string;
  endTime: string;
  duration: number;
  sessionType: 'Reading' | 'Practice' | 'Revision' | 'Test' | 'Notes';
  productivity: number;
  notes?: string;
  breaksTaken: number;
  completed: boolean;
  mood: 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Very Poor';
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudySessionRequest {
  subject: string;
  topic?: string;
  startTime: string;
  endTime: string;
  duration?: number;
  sessionType?: 'Reading' | 'Practice' | 'Revision' | 'Test' | 'Notes';
  productivity?: number;
  notes?: string;
  breaksTaken?: number;
  mood?: 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Very Poor';
}

export interface StudySessionsResponse {
  success: boolean;
  data: StudySession[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
  };
}

export interface StudyAnalytics {
  period: string;
  totalSessions: number;
  totalHours: number;
  averageProductivity: number;
  subjectBreakdown: Record<string, number>;
  sessionTypeBreakdown: Record<string, number>;
  dailyStudy: Record<string, number>;
}

export const studySessionApi = {
  // Create study session
  createSession: async (data: CreateStudySessionRequest): Promise<StudySession> => {
    const response = await axiosInstance.post('/sessions', data);
    return response.data.data;
  },

  // Get all study sessions
  getSessions: async (params?: {
    page?: number;
    limit?: number;
    subject?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<StudySessionsResponse> => {
    const response = await axiosInstance.get('/sessions', { params });
    return response.data;
  },

  // Get single study session
  getSession: async (id: string): Promise<StudySession> => {
    const response = await axiosInstance.get(`/sessions/${id}`);
    return response.data.data;
  },

  // Update study session
  updateSession: async (id: string, data: Partial<CreateStudySessionRequest>): Promise<StudySession> => {
    const response = await axiosInstance.put(`/sessions/${id}`, data);
    return response.data.data;
  },

  // Delete study session
  deleteSession: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/sessions/${id}`);
  },

  // Get study analytics
  getAnalytics: async (period: '7d' | '30d' | '90d' = '7d'): Promise<StudyAnalytics> => {
    const response = await axiosInstance.get('/sessions/analytics', {
      params: { period }
    });
    return response.data.data;
  },
};
