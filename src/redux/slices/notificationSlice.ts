import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as notificationApi from '@/api/notificationApi';
import type { Notification, NotificationsResponse, NotificationQueryParams } from '@/api/notificationApi';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  filters: NotificationQueryParams;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  total: 0,
  hasMore: false,
  loading: false,
  error: null,
  filters: {
    limit: 20,
    skip: 0,
    unreadOnly: false,
  },
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params?: NotificationQueryParams) => {
    return await notificationApi.getNotifications(params);
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async () => {
    return await notificationApi.getUnreadCount();
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationIds: string[]) => {
    await notificationApi.markAsRead(notificationIds);
    return notificationIds;
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async () => {
    await notificationApi.markAllAsRead();
  }
);

export const deleteNotificationById = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId: string) => {
    await notificationApi.deleteNotification(notificationId);
    return notificationId;
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<NotificationQueryParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
      state.total += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<NotificationsResponse>) => {
        state.loading = false;
        const { notifications, total, unreadCount, hasMore } = action.payload;
        
        if (state.filters.skip === 0) {
          state.notifications = notifications;
        } else {
          state.notifications = [...state.notifications, ...notifications];
        }
        
        state.total = total;
        state.unreadCount = unreadCount;
        state.hasMore = hasMore;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch notifications';
      })
      
      // Fetch unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.unreadCount;
      })
      
      // Mark as read
      .addCase(markNotificationAsRead.fulfilled, (state, action: PayloadAction<string[]>) => {
        const notificationIds = action.payload;
        state.notifications = state.notifications.map((notification) =>
          notificationIds.includes(notification._id)
            ? { ...notification, read: true, readAt: new Date().toISOString() }
            : notification
        );
        state.unreadCount = Math.max(0, state.unreadCount - notificationIds.length);
      })
      
      // Mark all as read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((notification) => ({
          ...notification,
          read: true,
          readAt: new Date().toISOString(),
        }));
        state.unreadCount = 0;
      })
      
      // Delete notification
      .addCase(deleteNotificationById.fulfilled, (state, action: PayloadAction<string>) => {
        const deletedNotification = state.notifications.find((n) => n._id === action.payload);
        state.notifications = state.notifications.filter((n) => n._id !== action.payload);
        state.total -= 1;
        if (deletedNotification && !deletedNotification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
  },
});

export const { setFilters, clearFilters, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
