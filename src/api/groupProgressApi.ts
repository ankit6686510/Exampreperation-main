import axiosInstance from './axiosInstance';

export interface ProgressSettings {
  _id: string;
  group: string;
  user: string;
  shareStudyTime: boolean;
  shareDailyGoals: boolean;
  shareMonthlyPlans: boolean;
  shareBookProgress: boolean;
  shareSyllabusProgress: boolean;
  shareResources: boolean;
  visibilityLevel: 'all' | 'moderators' | 'partners';
  allowCompetition: boolean;
  allowStudyPartners: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupProgressDashboard {
  topPerformers: Array<{
    user: {
      _id: string;
      name: string;
    };
    studyHours: number;
    goalsCompleted: number;
    booksCompleted: number;
    rank: number;
  }>;
  groupStats: {
    totalMembers: number;
    activeMembers: number;
    totalStudyHours: number;
    averageStudyHours: number;
    totalGoalsCompleted: number;
    groupStreak: number;
  };
  recentActivities: Array<{
    user: {
      _id: string;
      name: string;
    };
    type: string;
    description: string;
    timestamp: string;
  }>;
  categoryProgress: Array<{
    category: string;
    totalItems: number;
    completedItems: number;
    percentage: number;
  }>;
}

export interface Leaderboard {
  name: string;
  description: string;
  type: 'study_hours' | 'goals_completed' | 'books_read' | 'streak' | 'custom';
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  rankings: Array<{
    rank: number;
    user: {
      _id: string;
      name: string;
    };
    score: number;
    metadata?: any;
  }>;
}

export interface StudyPartnership {
  _id: string;
  group: string;
  requester: {
    _id: string;
    name: string;
  };
  partner: {
    _id: string;
    name: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  sharedGoals: string[];
  sharedSubjects: string[];
  message?: string;
  requestedAt: string;
  respondedAt?: string;
}

export const getProgressSettings = async (
  groupId: string
): Promise<ProgressSettings> => {
  const response = await axiosInstance.get(`/group-progress/${groupId}/progress-settings`);
  return response.data;
};

export const updateProgressSettings = async (
  groupId: string,
  settings: Partial<ProgressSettings>
): Promise<ProgressSettings> => {
  const response = await axiosInstance.put(
    `/group-progress/${groupId}/progress-settings`,
    settings
  );
  return response.data;
};

export const getGroupProgressDashboard = async (
  groupId: string
): Promise<GroupProgressDashboard> => {
  const response = await axiosInstance.get(`/group-progress/${groupId}/progress-dashboard`);
  return response.data;
};

export const getGroupLeaderboards = async (
  groupId: string,
  params?: { type?: string; period?: string }
): Promise<Leaderboard[]> => {
  const response = await axiosInstance.get(`/group-progress/${groupId}/leaderboards`, {
    params,
  });
  return response.data;
};

export const requestStudyPartnership = async (
  groupId: string,
  data: {
    partnerId: string;
    sharedGoals?: string[];
    sharedSubjects?: string[];
    message?: string;
  }
): Promise<StudyPartnership> => {
  const response = await axiosInstance.post(
    `/group-progress/${groupId}/request-partnership`,
    data
  );
  return response.data;
};

export const respondToPartnership = async (
  groupId: string,
  partnershipId: string,
  response: 'accept' | 'reject'
): Promise<StudyPartnership> => {
  const result = await axiosInstance.put(`/group-progress/${groupId}/respond-partnership`, {
    partnershipId,
    response,
  });
  return result.data;
};

export const getStudyPartners = async (
  groupId: string
): Promise<StudyPartnership[]> => {
  const response = await axiosInstance.get(`/group-progress/${groupId}/study-partners`);
  return response.data;
};
