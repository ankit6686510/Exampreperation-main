import axiosInstance from './axiosInstance';

export interface NotificationChannels {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export interface NotificationCategory {
  studyReminders: boolean;
  groupActivities: boolean;
  achievements: boolean;
  sessionUpdates: boolean;
  dailyDigest: boolean;
}

export interface NotificationPreferences {
  _id: string;
  user: string;
  channels: NotificationChannels;
  categories: NotificationCategory;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  emailDigest: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'never';
  };
  pushSubscriptions: Array<{
    endpoint: string;
    expirationTime: string | null;
    keys: {
      p256dh: string;
      auth: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  totalSent: number;
  totalRead: number;
  byChannel: {
    email: number;
    push: number;
    inApp: number;
  };
  byCategory: {
    [key: string]: number;
  };
}

export const getPreferences = async (): Promise<NotificationPreferences> => {
  const response = await axiosInstance.get('/notification-preferences');
  return response.data;
};

export const updatePreferences = async (
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  const response = await axiosInstance.put('/notification-preferences', preferences);
  return response.data;
};

export const bulkUpdatePreferences = async (
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  const response = await axiosInstance.post('/notification-preferences/bulk-update', updates);
  return response.data;
};

export const resetPreferences = async (): Promise<NotificationPreferences> => {
  const response = await axiosInstance.post('/notification-preferences/reset');
  return response.data;
};

export const subscribeToPush = async (subscription: PushSubscription): Promise<void> => {
  await axiosInstance.post('/notification-preferences/push/subscribe', {
    subscription: subscription.toJSON(),
  });
};

export const unsubscribeFromPush = async (endpoint: string): Promise<void> => {
  await axiosInstance.post('/notification-preferences/push/unsubscribe', { endpoint });
};

export const getVapidPublicKey = async (): Promise<{ publicKey: string }> => {
  const response = await axiosInstance.get('/notification-preferences/push/vapid-key');
  return response.data;
};

export const testNotification = async (type: string): Promise<void> => {
  await axiosInstance.post('/notification-preferences/test', { type });
};

export const getNotificationStats = async (): Promise<NotificationStats> => {
  const response = await axiosInstance.get('/notification-preferences/stats');
  return response.data;
};
