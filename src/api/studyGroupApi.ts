import axiosInstance from './axiosInstance';

export interface StudyGroupMember {
  user: {
    _id: string;
    name: string;
    email?: string;
  };
  joinedAt: string;
  role: 'admin' | 'moderator' | 'member';
  isActive: boolean;
}

export interface StudyGroup {
  _id: string;
  name: string;
  description?: string;
  examTypes: Array<'UPSC' | 'SSC' | 'Banking' | 'Railway' | 'State PSC' | 'Defense' | 'Teaching' | 'Other'>;
  targetDate: string;
  admin: {
    _id: string;
    name: string;
  };
  members: StudyGroupMember[];
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupPermission {
  _id: string;
  group: string;
  requester: string;
  approver?: string;
  permissionType: 'view_progress' | 'view_goals' | 'view_sessions' | 'share_resources';
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  respondedAt?: string;
  expiresAt?: string;
  message?: string;
}

export interface GroupActivity {
  _id: string;
  group: string;
  user: {
    _id: string;
    name: string;
  };
  activityType: string;
  description: string;
  metadata?: any;
  createdAt: string;
}

export interface Leaderboard {
  user: {
    _id: string;
    name: string;
  };
  rank: number;
  studyHours: number;
  goalsCompleted: number;
  currentStreak: number;
}

export const getPublicGroups = async (params?: {
  examType?: string;
  search?: string;
  limit?: number;
  skip?: number;
}): Promise<{ groups: StudyGroup[]; total: number }> => {
  const response = await axiosInstance.get('/study-groups', { params });
  return response.data;
};

export const getUserGroups = async (): Promise<StudyGroup[]> => {
  const response = await axiosInstance.get('/study-groups/my-groups');
  return response.data;
};

export const getStudyGroup = async (id: string): Promise<StudyGroup> => {
  const response = await axiosInstance.get(`/study-groups/${id}`);
  return response.data;
};

export const createStudyGroup = async (
  data: Partial<StudyGroup>
): Promise<StudyGroup> => {
  const response = await axiosInstance.post('/study-groups', data);
  return response.data;
};

export const updateStudyGroup = async (
  id: string,
  updates: Partial<StudyGroup>
): Promise<StudyGroup> => {
  const response = await axiosInstance.put(`/study-groups/${id}`, updates);
  return response.data;
};

export const deleteStudyGroup = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/study-groups/${id}`);
};

export const joinStudyGroup = async (id: string): Promise<StudyGroup> => {
  const response = await axiosInstance.post(`/study-groups/${id}/join`);
  return response.data;
};

export const leaveStudyGroup = async (id: string): Promise<StudyGroup> => {
  const response = await axiosInstance.post(`/study-groups/${id}/leave`);
  return response.data;
};

export const getGroupLeaderboard = async (id: string): Promise<Leaderboard[]> => {
  const response = await axiosInstance.get(`/study-groups/${id}/leaderboard`);
  return response.data;
};

export const getGroupActivities = async (
  id: string,
  params?: { limit?: number; skip?: number }
): Promise<{ activities: GroupActivity[]; total: number }> => {
  const response = await axiosInstance.get(`/study-groups/${id}/activities`, { params });
  return response.data;
};

// Permission APIs
export const getPendingPermissions = async (): Promise<GroupPermission[]> => {
  const response = await axiosInstance.get('/study-groups/permissions/pending');
  return response.data;
};

export const getGroupPermissions = async (groupId: string): Promise<GroupPermission[]> => {
  const response = await axiosInstance.get(`/study-groups/${groupId}/permissions`);
  return response.data;
};

export const checkPermission = async (
  groupId: string,
  permissionType: string
): Promise<{ hasPermission: boolean; permission?: GroupPermission }> => {
  const response = await axiosInstance.get(`/study-groups/${groupId}/permissions/check`, {
    params: { permissionType },
  });
  return response.data;
};

export const requestPermission = async (
  groupId: string,
  data: {
    permissionType: string;
    message?: string;
  }
): Promise<GroupPermission> => {
  const response = await axiosInstance.post(`/study-groups/${groupId}/permissions/request`, data);
  return response.data;
};

export const respondToPermission = async (
  groupId: string,
  permissionId: string,
  response: 'approve' | 'reject'
): Promise<GroupPermission> => {
  const result = await axiosInstance.put(
    `/study-groups/${groupId}/permissions/${permissionId}/respond`,
    { response }
  );
  return result.data;
};

export const updatePermission = async (
  permissionId: string,
  updates: Partial<GroupPermission>
): Promise<GroupPermission> => {
  const response = await axiosInstance.put(`/study-groups/permissions/${permissionId}`, updates);
  return response.data;
};

export const revokePermission = async (permissionId: string): Promise<void> => {
  await axiosInstance.delete(`/study-groups/permissions/${permissionId}`);
};

export const logPermissionView = async (permissionId: string): Promise<void> => {
  await axiosInstance.post(`/study-groups/permissions/${permissionId}/view`);
};

export const getPermissionHistory = async (
  permissionId: string
): Promise<any[]> => {
  const response = await axiosInstance.get(`/study-groups/permissions/${permissionId}/history`);
  return response.data;
};
