import axiosInstance from './axiosInstance';

export interface StudyGroup {
  _id: string;
  name: string;
  description?: string;
  examTypes: string[];
  targetDate: string;
  admin: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  members: Array<{
    user: {
      _id: string;
      name: string;
      profilePicture?: string;
    };
    role: 'admin' | 'moderator' | 'member';
    joinedAt: string;
    isActive: boolean;
  }>;
  privacy: 'public' | 'private' | 'invite-only';
  settings: {
    allowMemberInvites: boolean;
    requireApproval: boolean;
    maxMembers: number;
    allowDataSharing: boolean;
    allowLeaderboard: boolean;
  };
  stats: {
    totalMembers: number;
    averageStudyHours: number;
    groupStreak: number;
    lastActivity: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudyGroupData {
  name: string;
  description?: string;
  examTypes: string[];
  targetDate: string;
  privacy?: 'public' | 'private' | 'invite-only';
  settings?: {
    allowMemberInvites?: boolean;
    requireApproval?: boolean;
    maxMembers?: number;
    allowDataSharing?: boolean;
    allowLeaderboard?: boolean;
  };
  tags?: string[];
}

export interface GroupActivity {
  _id: string;
  group: string;
  user: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  activityType: string;
  data: {
    title?: string;
    description?: string;
    metadata?: any;
  };
  visibility: string;
  points: number;
  reactions: Array<{
    user: string;
    reaction: 'like' | 'love' | 'celebrate' | 'support' | 'motivate';
    reactedAt: string;
  }>;
  comments: Array<{
    user: {
      _id: string;
      name: string;
      profilePicture?: string;
    };
    comment: string;
    commentedAt: string;
  }>;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  profilePicture?: string;
  totalPoints: number;
  activityCount: number;
  lastActivity: string;
}

// Study Group API functions
export const studyGroupApi = {
  // Get public study groups
  getPublicGroups: async (params?: {
    page?: number;
    limit?: number;
    examType?: string;
    search?: string;
    sortBy?: 'members' | 'activity' | 'newest' | 'oldest';
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.examType) queryParams.append('examType', params.examType);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);

    const response = await axiosInstance.get(`/groups?${queryParams.toString()}`);
    return response.data;
  },

  // Get user's study groups
  getUserGroups: async () => {
    const response = await axiosInstance.get('/groups/my-groups');
    return response.data;
  },

  // Get single study group
  getStudyGroup: async (groupId: string) => {
    const response = await axiosInstance.get(`/groups/${groupId}`);
    return response.data;
  },

  // Create study group
  createStudyGroup: async (data: CreateStudyGroupData) => {
    const response = await axiosInstance.post('/groups', data);
    return response.data;
  },

  // Update study group
  updateStudyGroup: async (groupId: string, data: Partial<CreateStudyGroupData>) => {
    const response = await axiosInstance.put(`/groups/${groupId}`, data);
    return response.data;
  },

  // Join study group
  joinStudyGroup: async (groupId: string) => {
    const response = await axiosInstance.post(`/groups/${groupId}/join`);
    return response.data;
  },

  // Leave study group
  leaveStudyGroup: async (groupId: string) => {
    const response = await axiosInstance.post(`/groups/${groupId}/leave`);
    return response.data;
  },

  // Delete study group
  deleteStudyGroup: async (groupId: string) => {
    const response = await axiosInstance.delete(`/groups/${groupId}`);
    return response.data;
  },

  // Get group leaderboard
  getGroupLeaderboard: async (groupId: string, period: 'day' | 'week' | 'month' = 'week') => {
    const response = await axiosInstance.get(`/groups/${groupId}/leaderboard?period=${period}`);
    return response.data;
  },

  // Get group activities
  getGroupActivities: async (groupId: string, page: number = 1, limit: number = 20) => {
    const response = await axiosInstance.get(`/groups/${groupId}/activities?page=${page}&limit=${limit}`);
    return response.data;
  },

  // React to activity
  reactToActivity: async (activityId: string, reaction: 'like' | 'love' | 'celebrate' | 'support' | 'motivate') => {
    const response = await axiosInstance.post(`/groups/activities/${activityId}/react`, { reaction });
    return response.data;
  },

  // Comment on activity
  commentOnActivity: async (activityId: string, comment: string) => {
    const response = await axiosInstance.post(`/groups/activities/${activityId}/comment`, { comment });
    return response.data;
  }
};

export default studyGroupApi;
