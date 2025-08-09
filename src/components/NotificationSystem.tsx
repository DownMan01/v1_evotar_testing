import { useState, useEffect } from 'react';
import {
  Bell, X, Check, Clock, AlertCircle, Vote, Users, UserCheck,
  Settings, TrendingUp, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';

export const NotificationSystem = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, profile } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll
  } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.notification-dropdown')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  const getNotificationIcon = (type: string) => {
    const iconProps = "h-4 w-4";
    const iconMap: Record<string, JSX.Element> = {
      election_upcoming: <Clock className={`${iconProps} text-amber-600`} />,
      election_active: <Vote className={`${iconProps} text-blue-600`} />,
      election_approved: <Check className={`${iconProps} text-green-600`} />,
      election_rejected: <X className={`${iconProps} text-red-600`} />,
      voter_registration: <UserCheck className={`${iconProps} text-purple-600`} />,
      profile_update_request: <Settings className={`${iconProps} text-indigo-600`} />,
      admin_task: <AlertCircle className={`${iconProps} text-orange-600`} />,
      results_published: <TrendingUp className={`${iconProps} text-emerald-600`} />,
      candidate_added: <Users className={`${iconProps} text-cyan-600`} />,
    };
    return iconMap[type] || <AlertCircle className={`${iconProps} text-gray-600`} />;
  };

  const getPriorityStyles = (priority: string) => {
    const styles: Record<string, string> = {
      high: 'border-l-4 border-l-red-500',
      medium: 'border-l-4 border-l-amber-500',
      low: 'border-l-4 border-l-blue-500'
    };
    return styles[priority] || styles.low;
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / 60000);

    if (diffInMinutes < 1) return `just now`;
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="relative notification-dropdown">
      <Button
        variant="ghost"
        size="icon"
        className="relative hover:bg-accent/50 transition-colors"
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading}
      >
        <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-pulse' : ''}`} />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs min-w-[20px] animate-in zoom-in-50"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {showDropdown && (
        <Card className="absolute right-0 top-12 w-96 z-50 shadow-lg border border-border/50 bg-background/95 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                {unreadCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="text-xs px-2 py-1 h-6"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs px-2 py-1 h-6"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary/20 border-t-primary mx-auto mb-2"></div>
                  <p className="text-sm">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm font-medium mb-1">No notifications</p>
                  <p className="text-xs">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 cursor-pointer hover:bg-accent/30 transition-colors relative ${
                        !notification.read ? 'bg-primary/5' : ''
                      } ${getPriorityStyles(notification.priority)}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm leading-tight text-foreground">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-xs px-2 py-0 h-5 ${
                                notification.priority === 'high'
                                  ? 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-950/30'
                                  : notification.priority === 'medium'
                                  ? 'border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:bg-amber-950/30'
                                  : 'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950/30'
                              }`}
                            >
                              {notification.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>

          {notifications.length > 0 && (
            <div className="border-t border-border/50 p-3">
              <p className="text-xs text-center text-muted-foreground">
                Showing {notifications.length} of {notifications.length} notifications
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
