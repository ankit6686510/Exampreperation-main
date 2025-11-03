import api from './axiosInstance';

export interface Notification {
  _id: string;
  user: string;
  type: string;
  title: string;
  message: string;
  data?: {
    roomId?: string;
    groupId?: string;
    userId?: string;
    achievementId?: string;
    metadata?: any;
  };
  read: boolean;
  readAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

export const notificationApi = {
  getNotifications: async (params?: {
    limit?: number;
    skip?: number;
    unreadOnly?: boolean;
    types?: string[];
  }): Promise<NotificationsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');
    if (params?.types) queryParams.append('types', params.types.join(','));

    const response = await api.get(`/notifications?${queryParams.toString()}`);
    return response.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread-count');
    return response.data.data.count;
  },

  markAsRead: async (notificationIds: string[]): Promise<void> => {
    await api.post('/notifications/mark-read', { notificationIds });
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post('/notifications/mark-all-read');
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
  }
};