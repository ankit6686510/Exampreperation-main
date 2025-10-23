import axiosInstance from './axiosInstance';

export interface PermissionDetails {
  dailyHours: boolean;
  weeklyTrends: boolean;
  studyStreak: boolean;
  sessionHistory: boolean;
  dailyGoals: boolean;
  monthlyPlans: boolean;
  completionRate: boolean;
  targetProgress: boolean;
  bookList: boolean;
  readingProgress: boolean;
  chaptersCompleted: boolean;
  readingSpeed: boolean;
  topicsCompleted: boolean;
  subjectProgress: boolean;
  overallCompletion: boolean;
  weakAreas: boolean;
  sessionDuration: boolean;
  focusTime: boolean;
  breakPatterns: boolean;
  studyMethods: boolean;
  testScores: boolean;
  mockResults: boolean;
  improvementTrends: boolean;
  rankings: boolean;
  name: boolean;
  examTypes: boolean;
  targetDate: boolean;
  profilePicture: boolean;
}

export interface PermissionCategory {
  enabled: boolean;
  details: Partial<PermissionDetails>;
}

export interface GroupPermission {
  _id: string;
  group: string;
  owner: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  viewer: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  permissions: {
    studyTime: PermissionCategory;
    goals: PermissionCategory;
    books: PermissionCategory;
    syllabus: PermissionCategory;
    sessions: PermissionCategory;
    performance: PermissionCategory;
    profile: PermissionCategory;
  };
  duration: {
    startDate: string;
    endDate?: string;
    isPermanent: boolean;
    autoRenew: boolean;
    renewalPeriod: '1week' | '1month' | '3months' | '6months';
  };
  status: 'pending' | 'active' | 'revoked' | 'expired';
  requestMessage?: string;
  responseMessage?: string;
  viewHistory: Array<{
    viewedAt: string;
    dataType: string;
    details?: string;
  }>;
  notifications: {
    notifyOnView: boolean;
    notifyOnExpiry: boolean;
    emailNotifications: boolean;
  };
  metadata: {
    requestedBy?: string;
    approvedAt?: string;
    revokedAt?: string;
    lastViewedAt?: string;
    totalViews: number;
    ipAddress?: string;
    userAgent?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PermissionRequest {
  ownerId: string;
  permissions: {
    studyTime?: PermissionCategory;
    goals?: PermissionCategory;
    books?: PermissionCategory;
    syllabus?: PermissionCategory;
    sessions?: PermissionCategory;
    performance?: PermissionCategory;
    profile?: PermissionCategory;
  };
  duration?: '1week' | '1month' | '3months' | '6months';
  requestMessage?: string;
  isPermanent?: boolean;
}

export interface PermissionResponse {
  action: 'approve' | 'deny';
  responseMessage?: string;
  updatedPermissions?: {
    studyTime?: PermissionCategory;
    goals?: PermissionCategory;
    books?: PermissionCategory;
    syllabus?: PermissionCategory;
    sessions?: PermissionCategory;
    performance?: PermissionCategory;
    profile?: PermissionCategory;
  };
}

// Group Permission API functions
export const groupPermissionApi = {
  // Request permission to view someone's data
  requestPermission: async (groupId: string, data: PermissionRequest) => {
    const response = await axiosInstance.post(`/groups/${groupId}/permissions/request`, data);
    return response.data;
  },

  // Respond to permission request (approve/deny)
  respondToPermission: async (groupId: string, permissionId: string, response: PermissionResponse) => {
    const responseData = await axiosInstance.put(`/groups/${groupId}/permissions/${permissionId}/respond`, response);
    return responseData.data;
  },

  // Get pending permission requests
  getPendingPermissions: async (type: 'received' | 'sent' = 'received') => {
    const response = await axiosInstance.get(`/groups/permissions/pending?type=${type}`);
    return response.data;
  },

  // Get user's active permissions in a group
  getGroupPermissions: async (groupId: string, userId?: string) => {
    const queryParams = userId ? `?userId=${userId}` : '';
    const response = await axiosInstance.get(`/groups/${groupId}/permissions${queryParams}`);
    return response.data;
  },

  // Update permission settings
  updatePermission: async (permissionId: string, data: {
    permissions?: {
      studyTime?: PermissionCategory;
      goals?: PermissionCategory;
      books?: PermissionCategory;
      syllabus?: PermissionCategory;
      sessions?: PermissionCategory;
      performance?: PermissionCategory;
      profile?: PermissionCategory;
    };
    duration?: {
      isPermanent?: boolean;
      autoRenew?: boolean;
      renewalPeriod?: '1week' | '1month' | '3months' | '6months';
    };
    notifications?: {
      notifyOnView?: boolean;
      notifyOnExpiry?: boolean;
      emailNotifications?: boolean;
    };
  }) => {
    const response = await axiosInstance.put(`/groups/permissions/${permissionId}`, data);
    return response.data;
  },

  // Revoke permission
  revokePermission: async (permissionId: string, reason?: string) => {
    const response = await axiosInstance.delete(`/groups/permissions/${permissionId}`, {
      data: { reason }
    });
    return response.data;
  },

  // Log permission view (when viewing someone's data)
  logPermissionView: async (permissionId: string, dataType: string, details?: string) => {
    const response = await axiosInstance.post(`/groups/permissions/${permissionId}/view`, {
      dataType,
      details
    });
    return response.data;
  },

  // Get permission view history
  getPermissionHistory: async (permissionId: string) => {
    const response = await axiosInstance.get(`/groups/permissions/${permissionId}/history`);
    return response.data;
  },

  // Check if user can view specific data
  checkPermission: async (groupId: string, ownerId: string, dataType: string, detail?: string) => {
    const queryParams = new URLSearchParams({
      ownerId,
      dataType
    });
    if (detail) queryParams.append('detail', detail);

    const response = await axiosInstance.get(`/groups/${groupId}/permissions/check?${queryParams.toString()}`);
    return response.data;
  },

  // Helper function to create permission request with common patterns
  createBasicPermissionRequest: (ownerId: string, categories: string[], duration: '1week' | '1month' | '3months' | '6months' = '1month', message?: string): PermissionRequest => {
    const permissions: PermissionRequest['permissions'] = {};
    
    categories.forEach(category => {
      switch (category) {
        case 'studyTime':
          permissions.studyTime = {
            enabled: true,
            details: {
              dailyHours: true,
              weeklyTrends: true,
              studyStreak: true,
              sessionHistory: false
            }
          };
          break;
        case 'goals':
          permissions.goals = {
            enabled: true,
            details: {
              dailyGoals: true,
              monthlyPlans: true,
              completionRate: true,
              targetProgress: true
            }
          };
          break;
        case 'books':
          permissions.books = {
            enabled: true,
            details: {
              bookList: true,
              readingProgress: true,
              chaptersCompleted: true,
              readingSpeed: false
            }
          };
          break;
        case 'syllabus':
          permissions.syllabus = {
            enabled: true,
            details: {
              topicsCompleted: true,
              subjectProgress: true,
              overallCompletion: true,
              weakAreas: false
            }
          };
          break;
        case 'performance':
          permissions.performance = {
            enabled: true,
            details: {
              testScores: false,
              mockResults: false,
              improvementTrends: true,
              rankings: false
            }
          };
          break;
      }
    });

    return {
      ownerId,
      permissions,
      duration,
      requestMessage: message,
      isPermanent: false
    };
  },

  // Helper function to check if user has specific permission
  hasPermission: (permission: GroupPermission, category: string, detail?: string): boolean => {
    if (permission.status !== 'active') return false;
    
    const categoryPermission = permission.permissions[category as keyof typeof permission.permissions];
    if (!categoryPermission?.enabled) return false;
    
    if (detail) {
      return categoryPermission.details[detail as keyof PermissionDetails] === true;
    }
    
    return true;
  },

  // Helper function to get permission summary
  getPermissionSummary: (permission: GroupPermission): {
    enabledCategories: string[];
    totalPermissions: number;
    expiresAt?: string;
  } => {
    const enabledCategories = Object.keys(permission.permissions).filter(
      key => permission.permissions[key as keyof typeof permission.permissions]?.enabled
    );
    
    const totalPermissions = enabledCategories.reduce((total, category) => {
      const categoryPermission = permission.permissions[category as keyof typeof permission.permissions];
      return total + Object.values(categoryPermission?.details || {}).filter(Boolean).length;
    }, 0);

    return {
      enabledCategories,
      totalPermissions,
      expiresAt: permission.duration.endDate
    };
  }
};

export default groupPermissionApi;
