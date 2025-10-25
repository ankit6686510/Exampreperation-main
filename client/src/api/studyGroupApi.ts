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
    joinedAt: string;
    role: string;
    isActive: boolean;
  }>;
  privacy: string;
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
  memberCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudyGroupRequest {
  name: string;
  description?: string;
  examTypes: string[];
  targetDate: string;
  privacy?: string;
  settings?: {
    allowMemberInvites?: boolean;
    requireApproval?: boolean;
    maxMembers?: number;
    allowDataSharing?: boolean;
    allowLeaderboard?: boolean;
  };
  tags?: string[];
}

export interface GroupProgressSettings {
  _id: string;
  user: string;
  group: string;
  shareSettings: {
    studyHours: string;
    studyStreak: string;
    subjectProgress: string;
    goalCompletion: string;
    testScores: string;
    achievements: string;
    studySchedule: string;
  };
  displayPreferences: {
    showRealName: boolean;
    showInLeaderboard: boolean;
    allowDataComparison: boolean;
    showProgressMilestones: boolean;
  };
  partnerList: Array<{
    user: {
      _id: string;
      name: string;
      profilePicture?: string;
    };
    partnershipStatus: string;
    partneredAt: string;
  }>;
}

export interface GroupStats {
  _id: string;
  group: string;
  memberStats: {
    totalActiveMembers: number;
    averageStudyHours: number;
    totalStudyHours: number;
    averageStreak: number;
    longestGroupStreak: number;
    totalGoalsCompleted: number;
  };
  subjectStats: Array<{
    subject: string;
    totalHours: number;
    memberCount: number;
    averageProductivity: number;
    popularityRank: number;
  }>;
  leaderboardData: {
    topStudyHours: Array<{
      user: {
        _id: string;
        name: string;
        profilePicture?: string;
      };
      hours: number;
      rank: number;
    }>;
    topStreak: Array<{
      user: {
        _id: string;
        name: string;
        profilePicture?: string;
      };
      streak: number;
      rank: number;
    }>;
    topProductivity: Array<{
      user: {
        _id: string;
        name: string;
        profilePicture?: string;
      };
      productivity: number;
      rank: number;
    }>;
  };
  comparisonMetrics: {
    percentileRanks: {
      studyHours: {
        p25: number;
        p50: number;
        p75: number;
        p90: number;
      };
      streak: {
        p25: number;
        p50: number;
        p75: number;
        p90: number;
      };
      productivity: {
        p25: number;
        p50: number;
        p75: number;
        p90: number;
      };
    };
  };
}

// Study Groups API
export const studyGroupApi = {
  // Get public study groups
  getPublicGroups: async (params?: {
    page?: number;
    limit?: number;
    examType?: string;
    search?: string;
    sortBy?: string;
  }) => {
    const response = await axiosInstance.get('/groups', { params });
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
  createStudyGroup: async (data: CreateStudyGroupRequest) => {
    const response = await axiosInstance.post('/groups', data);
    return response.data;
  },

  // Update study group
  updateStudyGroup: async (groupId: string, data: Partial<CreateStudyGroupRequest>) => {
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
  getGroupLeaderboard: async (groupId: string, params?: {
    period?: string;
    category?: string;
  }) => {
    const response = await axiosInstance.get(`/groups/${groupId}/leaderboard`, { params });
    return response.data;
  },

  // Get group activities
  getGroupActivities: async (groupId: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const response = await axiosInstance.get(`/groups/${groupId}/activities`, { params });
    return response.data;
  },
};

// Group Progress API
export const groupProgressApi = {
  // Get progress settings
  getProgressSettings: async (groupId: string) => {
    const response = await axiosInstance.get(`/group-progress/${groupId}/progress-settings`);
    return response.data;
  },

  // Update progress settings
  updateProgressSettings: async (groupId: string, data: {
    shareSettings?: Partial<GroupProgressSettings['shareSettings']>;
    displayPreferences?: Partial<GroupProgressSettings['displayPreferences']>;
  }) => {
    const response = await axiosInstance.put(`/group-progress/${groupId}/progress-settings`, data);
    return response.data;
  },

  // Get group progress dashboard
  getGroupProgressDashboard: async (groupId: string, period?: string) => {
    const response = await axiosInstance.get(`/group-progress/${groupId}/progress-dashboard`, {
      params: { period }
    });
    return response.data;
  },

  // Get group leaderboards
  getGroupLeaderboards: async (groupId: string, params?: {
    period?: string;
    category?: string;
  }) => {
    const response = await axiosInstance.get(`/group-progress/${groupId}/leaderboards`, { params });
    return response.data;
  },

  // Request study partnership
  requestStudyPartnership: async (groupId: string, partnerId: string) => {
    const response = await axiosInstance.post(`/group-progress/${groupId}/request-partnership`, {
      partnerId
    });
    return response.data;
  },

  // Respond to partnership request
  respondToPartnership: async (groupId: string, requesterId: string, status: 'accepted' | 'declined') => {
    const response = await axiosInstance.put(`/group-progress/${groupId}/respond-partnership`, {
      requesterId,
      status
    });
    return response.data;
  },

  // Get study partners
  getStudyPartners: async (groupId: string) => {
    const response = await axiosInstance.get(`/group-progress/${groupId}/study-partners`);
    return response.data;
  },
};
