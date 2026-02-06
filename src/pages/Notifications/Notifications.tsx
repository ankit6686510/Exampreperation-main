import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationById,
  setFilters,
} from '@/redux/slices/notificationSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, CheckCheck, Trash2, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, loading, hasMore, filters } = useAppSelector(
    (state) => state.notifications
  );
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    dispatch(fetchNotifications(filters));
    dispatch(fetchUnreadCount());
  }, [dispatch, filters]);

  const handleTabChange = (value: string) => {
    setSelectedTab(value as 'all' | 'unread');
    dispatch(setFilters({ unreadOnly: value === 'unread', skip: 0 }));
  };

  const handleMarkAsRead = (notificationId: string) => {
    dispatch(markNotificationAsRead([notificationId]));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleDelete = (notificationId: string) => {
    dispatch(deleteNotificationById(notificationId));
  };

  const handleLoadMore = () => {
    dispatch(setFilters({ skip: notifications.length }));
    dispatch(fetchNotifications({ ...filters, skip: notifications.length }));
  };

  const getPriorityBadge = (priority: string) => {
    const classes = 'px-2 py-0.5 text-xs font-medium rounded-full';
    switch (priority) {
      case 'urgent':
        return <span className={`${classes} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`}>{priority}</span>;
      case 'high':
        return <span className={`${classes} bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200`}>{priority}</span>;
      case 'medium':
        return <span className={`${classes} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`}>{priority}</span>;
      default:
        return <span className={`${classes} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`}>{priority}</span>;
    }
  };

  const getNotificationIcon = (type: string) => {
    // You can customize icons based on notification type
    return <Bell className="h-5 w-5" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      <Tabs value={selectedTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">
            All Notifications
            {notifications.length > 0 && (
              <span className="ml-2 bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs">
                {notifications.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <span className="ml-2 bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {loading && notifications.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Loading notifications...</p>
              </CardContent>
            </Card>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {selectedTab === 'unread'
                      ? "You're all caught up! No unread notifications."
                      : 'No notifications yet.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification._id}
                  className={`transition-colors ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-950' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{notification.title}</h3>
                            {getPriorityBadge(notification.priority)}
                            {!notification.read && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                New
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsRead(notification._id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark as Read
                            </Button>
                          )}
                          {notification.actionUrl && (
                            <Button size="sm" variant="default">
                              View Details
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(notification._id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {hasMore && (
                <div className="text-center pt-4">
                  <Button onClick={handleLoadMore} variant="outline" disabled={loading}>
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Notifications;
