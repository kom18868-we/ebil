import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Bell, CheckCheck, Trash2, Filter } from 'lucide-react';
import { notificationsApi, type Notification } from '@/lib/api/notifications';
import { toast } from 'sonner';

export default function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [readFilter, setReadFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 20,
  });

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [readFilter, typeFilter, pagination.current_page]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getAll({
        page: pagination.current_page,
        per_page: pagination.per_page,
        read: readFilter === 'all' ? undefined : readFilter === 'read',
        type: typeFilter === 'all' ? undefined : typeFilter,
      });

      if (response.data) {
        setNotifications(response.data.notifications.data || []);
        setUnreadCount(response.data.unread_count);
        setPagination({
          current_page: response.data.notifications.current_page || 1,
          last_page: response.data.notifications.last_page || 1,
          total: response.data.notifications.total || 0,
          per_page: response.data.notifications.per_page || 20,
        });
      }
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await notificationsApi.getUnreadCount();
      if (response.data) {
        setUnreadCount(response.data.unread_count);
      }
    } catch (error: any) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notification marked as read');
    } catch (error: any) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error: any) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (error: any) {
      toast.error('Failed to delete notification');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete all notifications?')) {
      return;
    }

    try {
      await notificationsApi.deleteAll();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications deleted');
    } catch (error: any) {
      toast.error('Failed to delete all notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('invoice')) {
      return '📄';
    } else if (type.includes('payment')) {
      return '💳';
    }
    return '🔔';
  };

  const getNotificationLink = (notification: Notification): string => {
    const data = notification.data;
    if (data.invoice_id) {
      return `/invoices/${data.invoice_id}`;
    } else if (data.payment_id) {
      return `/payments/${data.payment_id}`;
    } else if (data.action_url) {
      return data.action_url.replace(window.location.origin, '');
    }
    return '#';
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" onClick={handleDeleteAll}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete all
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filters:</span>
        </div>
        <Select value={readFilter} onValueChange={setReadFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="invoice">Invoices</SelectItem>
            <SelectItem value="payment">Payments</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No notifications</h3>
          <p className="text-muted-foreground">
            You're all caught up! New notifications will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const isRead = !!notification.read_at;
            const link = getNotificationLink(notification);

            return (
              <div
                key={notification.id}
                className={`rounded-xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors ${
                  !isRead ? 'bg-muted/50 border-primary/20' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl mt-1">
                    {getNotificationIcon(notification.data.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={link}
                      onClick={() => {
                        if (!isRead) {
                          handleMarkAsRead(notification.id);
                        }
                      }}
                      className="block"
                    >
                      <p className="text-sm font-medium mb-1">
                        {notification.data.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(notification.created_at), 'MMMM d, yyyy at h:mm a')}
                      </p>
                    </Link>
                  </div>
                  <div className="flex items-center gap-1">
                    {!isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(notification.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPagination({ ...pagination, current_page: pagination.current_page - 1 });
            }}
            disabled={pagination.current_page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.current_page} of {pagination.last_page}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPagination({ ...pagination, current_page: pagination.current_page + 1 });
            }}
            disabled={pagination.current_page === pagination.last_page}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

