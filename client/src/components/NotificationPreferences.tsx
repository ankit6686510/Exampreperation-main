import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Moon, 
  TestTube, 
  BarChart3,
  Settings,
  Clock,
  Volume2,
  Vibrate
} from 'lucide-react';
import api from '@/api/axiosInstance';

interface NotificationPreferences {
  _id: string;
  pushNotifications: {
    enabled: boolean;
    subscription?: PushSubscription;
  };
  emailNotifications: {
    enabled: boolean;
    types: {
      [key: string]: boolean;
    };
    frequency: string;
  };
  smsNotifications: {
    enabled: boolean;
    phoneNumber?: string;
    types: {
      [key: string]: boolean;
    };
  };
  inAppNotifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    types: {
      [key: string]: boolean;
    };
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
    allowUrgent: boolean;
  };
  analytics: {
    enabled: boolean;
    trackOpens: boolean;
    trackClicks: boolean;
  };
}

interface NotificationStats {
  total: number;
  read: number;
  unread: number;
  readRate: number;
  byType: { [key: string]: { total: number; read: number; unread: number } };
}

export const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkPushSupport();
    loadPreferences();
    loadStats();
  }, []);

  const checkPushSupport = () => {
    setPushSupported('serviceWorker' in navigator && 'PushManager' in window);
  };

  const loadPreferences = async () => {
    try {
      const response = await api.get('/notification-preferences');
      setPreferences(response.data.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load notification preferences',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/notification-preferences/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to load notification stats:', error);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    setSaving(true);
    try {
      const response = await api.put('/notification-preferences', updates);
      setPreferences(response.data.data);
      toast({
        title: 'Success',
        description: 'Notification preferences updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const subscribeToPush = async () => {
    if (!pushSupported) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in this browser',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Get VAPID public key
      const keyResponse = await api.get('/notification-preferences/push/vapid-key');
      const publicKey = keyResponse.data.data.publicKey;

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: 'Permission Denied',
          description: 'Please allow notifications to enable push notifications',
          variant: 'destructive'
        });
        return;
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Send subscription to server
      await api.post('/notification-preferences/push/subscribe', { subscription });
      
      // Update local state
      setPreferences(prev => prev ? {
        ...prev,
        pushNotifications: { ...prev.pushNotifications, enabled: true, subscription }
      } : null);

      toast({
        title: 'Success',
        description: 'Push notifications enabled successfully'
      });
    } catch (error) {
      console.error('Push subscription error:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable push notifications',
        variant: 'destructive'
      });
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      await api.post('/notification-preferences/push/unsubscribe');
      
      setPreferences(prev => prev ? {
        ...prev,
        pushNotifications: { ...prev.pushNotifications, enabled: false, subscription: undefined }
      } : null);

      toast({
        title: 'Success',
        description: 'Push notifications disabled successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to disable push notifications',
        variant: 'destructive'
      });
    }
  };

  const sendTestNotification = async () => {
    try {
      await api.post('/notification-preferences/test', {
        title: 'Test Notification',
        message: 'This is a test notification to verify your settings are working correctly.',
        type: 'test',
        priority: 'medium'
      });

      toast({
        title: 'Test Sent',
        description: 'Test notification sent! Check your enabled notification channels.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test notification',
        variant: 'destructive'
      });
    }
  };

  const resetToDefaults = async () => {
    if (confirm('Are you sure you want to reset all notification preferences to defaults?')) {
      try {
        const response = await api.post('/notification-preferences/reset');
        setPreferences(response.data.data);
        toast({
          title: 'Reset Complete',
          description: 'Notification preferences reset to defaults'
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to reset preferences',
          variant: 'destructive'
        });
      }
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load notification preferences</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notification Preferences</h2>
          <p className="text-muted-foreground">
            Manage how and when you receive notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={sendTestNotification} variant="outline" size="sm">
            <TestTube className="h-4 w-4 mr-2" />
            Test
          </Button>
          <Button onClick={resetToDefaults} variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Notification Statistics
            </CardTitle>
            <CardDescription>Your notification activity over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.read}</div>
                <div className="text-sm text-muted-foreground">Read</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
                <div className="text-sm text-muted-foreground">Unread</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.readRate}%</div>
                <div className="text-sm text-muted-foreground">Read Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* In-App Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              In-App Notifications
            </CardTitle>
            <CardDescription>
              Notifications shown within the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="inapp-enabled">Enable in-app notifications</Label>
              <Switch
                id="inapp-enabled"
                checked={preferences.inAppNotifications.enabled}
                onCheckedChange={(checked) => 
                  updatePreferences({
                    inAppNotifications: { ...preferences.inAppNotifications, enabled: checked }
                  })
                }
              />
            </div>
            
            {preferences.inAppNotifications.enabled && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound" className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      Sound notifications
                    </Label>
                    <Switch
                      id="sound"
                      checked={preferences.inAppNotifications.sound}
                      onCheckedChange={(checked) => 
                        updatePreferences({
                          inAppNotifications: { ...preferences.inAppNotifications, sound: checked }
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="vibration" className="flex items-center gap-2">
                      <Vibrate className="h-4 w-4" />
                      Vibration (mobile)
                    </Label>
                    <Switch
                      id="vibration"
                      checked={preferences.inAppNotifications.vibration}
                      onCheckedChange={(checked) => 
                        updatePreferences({
                          inAppNotifications: { ...preferences.inAppNotifications, vibration: checked }
                        })
                      }
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Browser notifications even when the app is closed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Browser push notifications</Label>
                {!pushSupported && (
                  <Badge variant="destructive" className="ml-2">Not Supported</Badge>
                )}
              </div>
              {pushSupported && (
                <Switch
                  checked={preferences.pushNotifications.enabled}
                  onCheckedChange={(checked) => 
                    checked ? subscribeToPush() : unsubscribeFromPush()
                  }
                />
              )}
            </div>
            
            {!pushSupported && (
              <p className="text-sm text-muted-foreground">
                Push notifications are not supported in this browser. Try using Chrome, Firefox, or Safari.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Receive notifications via email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-enabled">Enable email notifications</Label>
              <Switch
                id="email-enabled"
                checked={preferences.emailNotifications.enabled}
                onCheckedChange={(checked) => 
                  updatePreferences({
                    emailNotifications: { ...preferences.emailNotifications, enabled: checked }
                  })
                }
              />
            </div>

            {preferences.emailNotifications.enabled && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="email-frequency">Email frequency</Label>
                    <select
                      id="email-frequency"
                      className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                      value={preferences.emailNotifications.frequency}
                      onChange={(e) => 
                        updatePreferences({
                          emailNotifications: { 
                            ...preferences.emailNotifications, 
                            frequency: e.target.value as 'instant' | 'hourly' | 'daily' | 'weekly'
                          }
                        })
                      }
                    >
                      <option value="instant">Instant</option>
                      <option value="hourly">Hourly digest</option>
                      <option value="daily">Daily digest</option>
                      <option value="weekly">Weekly digest</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Quiet Hours
            </CardTitle>
            <CardDescription>
              Reduce notifications during specific hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="quiet-enabled">Enable quiet hours</Label>
              <Switch
                id="quiet-enabled"
                checked={preferences.quietHours.enabled}
                onCheckedChange={(checked) => 
                  updatePreferences({
                    quietHours: { ...preferences.quietHours, enabled: checked }
                  })
                }
              />
            </div>

            {preferences.quietHours.enabled && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Start time
                    </Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={preferences.quietHours.startTime}
                      onChange={(e) => 
                        updatePreferences({
                          quietHours: { ...preferences.quietHours, startTime: e.target.value }
                        })
                      }
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="end-time">End time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={preferences.quietHours.endTime}
                      onChange={(e) => 
                        updatePreferences({
                          quietHours: { ...preferences.quietHours, endTime: e.target.value }
                        })
                      }
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="allow-urgent">Allow urgent notifications</Label>
                  <Switch
                    id="allow-urgent"
                    checked={preferences.quietHours.allowUrgent}
                    onCheckedChange={(checked) => 
                      updatePreferences({
                        quietHours: { ...preferences.quietHours, allowUrgent: checked }
                      })
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md">
          Saving preferences...
        </div>
      )}
    </div>
  );
};

export default NotificationPreferences;
