'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle2,
  DollarSign,
  MessageSquare,
  FileText,
  AlertCircle,
  Star,
  Briefcase,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: Date;
  metadata?: any;
}

interface NotificationListProps {
  userId: string;
}

const getNotificationIcon = (type: string) => {
  const icons: Record<string, any> = {
    bid_received: Briefcase,
    bid_accepted: CheckCircle2,
    bid_rejected: AlertCircle,
    payment_received: DollarSign,
    payment_released: DollarSign,
    job_completed: CheckCircle2,
    review_received: Star,
    dispute_filed: AlertCircle,
    message_received: MessageSquare,
    quote_received: FileText,
    quote_accepted: CheckCircle2,
    quote_rejected: AlertCircle,
    lead_received: TrendingUp,
  };
  return icons[type] || Bell;
};

const getNotificationColor = (type: string) => {
  const colors: Record<string, string> = {
    bid_received: 'bg-blue-100 text-blue-600',
    bid_accepted: 'bg-emerald-100 text-emerald-600',
    bid_rejected: 'bg-red-100 text-red-600',
    payment_received: 'bg-green-100 text-green-600',
    payment_released: 'bg-emerald-100 text-emerald-600',
    job_completed: 'bg-blue-100 text-blue-600',
    review_received: 'bg-amber-100 text-amber-600',
    dispute_filed: 'bg-red-100 text-red-600',
    message_received: 'bg-violet-100 text-violet-600',
    quote_received: 'bg-indigo-100 text-indigo-600',
    quote_accepted: 'bg-emerald-100 text-emerald-600',
    quote_rejected: 'bg-red-100 text-red-600',
    lead_received: 'bg-purple-100 text-purple-600',
  };
  return colors[type] || 'bg-slate-100 text-slate-600';
};

export function NotificationList({ userId }: NotificationListProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await fetch(`/api/notifications/${notification.id}/read`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate to action URL
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-slate-900">Notifications</h3>
        {notifications.some(n => !n.read) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification List */}
      <ScrollArea className="flex-1 max-h-[400px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Bell className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 text-center">
              No notifications yet
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const colorClass = getNotificationColor(notification.type);

              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm text-slate-900">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/notifications')}
            className="w-full text-sm text-blue-600 hover:text-blue-700"
          >
            View all notifications
          </Button>
        </div>
      )}
    </div>
  );
}
