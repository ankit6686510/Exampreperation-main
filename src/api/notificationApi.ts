import axiosInstance from './axiosInstance';

export interface Notification {
  _id: string;
  user: string;
  type: 'study_room_reminder' | 'study_room_started' | 'study_room_ended' | 'participant_joined' | 'participant_left' | 'pomodoro_break' | 'pomodoro_work' | 'group_invitation' | 'group_activity' | 'achievement_unlocked' | 'streak_milestone' | 'session_feedback_request' | 'general';
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
  readAt?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

export interface NotificationQueryParams {
  limit?: number;
  skip?: number;
  unreadOnly?: boolean;
  types?: string[];
}

export const getNotifications = async (params?: NotificationQueryParams): Promise<NotificationsResponse> => {
  const response = await axiosInstance.get('/notifications', { params });
  return response.data;
};

export const getUnreadCount = async (): Promise<{ unreadCount: number }> => {
  const response = await axiosInstance.get('/notifications/unread-count');
  return response.data;
};

export const markAsRead = async (notificationIds: string[]): Promise<void> => {
  await axiosInstance.post('/notifications/mark-read', { notificationIds });
};

export const markAllAsRead = async (): Promise<void> => {
  await axiosInstance.post('/notifications/mark-all-read');
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  await axiosInstance.delete(`/notifications/${notificationId}`);
};
