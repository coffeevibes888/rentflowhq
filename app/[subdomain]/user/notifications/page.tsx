'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, BellRing, Check, CheckCheck, Calendar, CreditCard, Wrench, FileText, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils/date-utils';
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/actions/notification.actions';

interface Notification {
  id: string;
  type: 'application' | 'message' | 'maintenance' | 'payment' | 'reminder';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export default function UserNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'application' | 'message' | 'maintenance' | 'payment' | 'reminder'>('all');

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const result = await getMyNotifications(50); // Get more notifications for the dedicated page
      const mappedNotifications = (result || []).map(notification => ({
        ...notification,
        createdAt: notification.createdAt.toISOString(),
        type: notification.type as Notification['type'],
        actionUrl: notification.actionUrl || undefined // Convert null to undefined
      }));
      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      alert('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      alert('Notification marked as read');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      alert('Failed to update notification');
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      alert('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      alert('Failed to update notifications');
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string, isRead: boolean) => {
    const iconColor = isRead ? '#94a3b8' : '#2563eb';
    
    switch (type) {
      case 'application':
        return <FileText className="h-4 w-4" style={{ color: iconColor }} />;
      case 'message':
        return <MessageCircle className="h-4 w-4" style={{ color: iconColor }} />;
      case 'maintenance':
        return <Wrench className="h-4 w-4" style={{ color: iconColor }} />;
      case 'payment':
        return <CreditCard className="h-4 w-4" style={{ color: iconColor }} />;
      case 'reminder':
        return <Calendar className="h-4 w-4" style={{ color: iconColor }} />;
      default:
        return <Bell className="h-4 w-4" style={{ color: iconColor }} />;
    }
  };

  // Get notification type color
  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'application':
        return 'bg-blue-100 text-blue-800';
      case 'message':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      case 'payment':
        return 'bg-red-100 text-red-800';
      case 'reminder':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    return notification.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-6 px-2">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          )}
          <Button onClick={fetchNotifications} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {/* Filters Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter By</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setFilter('all')}
            >
              All Notifications
              <Badge variant="secondary" className="ml-auto">
                {notifications.length}
              </Badge>
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setFilter('unread')}
            >
              Unread
              <Badge variant="secondary" className="ml-auto">
                {unreadCount}
              </Badge>
            </Button>
            
            <div className="pt-2 border-t">
              <Button
                variant={filter === 'application' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setFilter('application')}
              >
                <FileText className="mr-2 h-4 w-4" />
                Applications
              </Button>
              <Button
                variant={filter === 'message' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setFilter('message')}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Messages
              </Button>
              <Button
                variant={filter === 'maintenance' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setFilter('maintenance')}
              >
                <Wrench className="mr-2 h-4 w-4" />
                Maintenance
              </Button>
              <Button
                variant={filter === 'payment' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setFilter('payment')}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Payments
              </Button>
              <Button
                variant={filter === 'reminder' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setFilter('reminder')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Reminders
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {filter === 'unread' ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              {filter === 'all' && 'All Notifications'}
              {filter === 'unread' && 'Unread Notifications'}
              {filter !== 'all' && filter !== 'unread' && `${filter.charAt(0).toUpperCase() + filter.slice(1)} Notifications`}
            </CardTitle>
            <CardDescription>
              Stay updated with your rental activities and important announcements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-sm text-muted-foreground">Loading notifications...</div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <div className="text-sm text-muted-foreground">
                    {filter === 'unread' ? 'No unread notifications' : 
                     filter === 'all' ? 'No notifications yet' :
                     `No ${filter} notifications`}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type, notification.isRead)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`font-medium text-sm truncate ${
                                  !notification.isRead ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                  {notification.title}
                                </h4>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <p className={`text-sm mb-2 ${
                                !notification.isRead ? 'text-blue-800' : 'text-gray-600'
                              }`}>
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${getNotificationTypeColor(notification.type)}`}>
                                  {notification.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex-shrink-0">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Notification Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Preferences</CardTitle>
          <CardDescription>
            Manage how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Email Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Receive email updates for important activities
              </p>
              <Button variant="outline" size="sm">
                Configure Email Settings
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">SMS Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Get text messages for urgent updates (coming soon)
              </p>
              <Button variant="outline" size="sm" disabled>
                Configure SMS Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
