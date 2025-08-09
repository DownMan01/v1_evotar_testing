import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 
    | 'election_upcoming'
    | 'election_active'
    | 'election_submitted'
    | 'election_approved'
    | 'election_rejected'
    | 'voter_registration'
    | 'profile_update_request'
    | 'admin_task'
    | 'candidate_added'
    | 'results_published';
  read: boolean;
  created_at: string;
  data?: any;
  priority: 'low' | 'medium' | 'high';
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const hasFetched = useRef(false);
  const seenIds = useRef<Set<string>>(new Set());

  const addNotification = (notification: Notification) => {
    if (seenIds.current.has(notification.id)) return;

    seenIds.current.add(notification.id);
    setNotifications(prev => [notification, ...prev.slice(0, 19)]);

    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => {
        if (notif.id === id && !notif.read) {
          setUnreadCount(count => Math.max(0, count - 1));
          return { ...notif, read: true };
        }
        return notif;
      })
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    seenIds.current.clear();
  };

  const fetchInitialNotifications = async () => {
    if (!user || !profile) return;

    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      if (profile.role === 'Voter') {
        const { data: upcomingElections } = await supabase
          .from('elections')
          .select('*')
          .eq('status', 'Upcoming')
          .lte('start_date', sevenDaysFromNow.toISOString())
          .order('start_date', { ascending: true });

        const { data: activeElections } = await supabase
          .from('elections')
          .select('*')
          .eq('status', 'Active')
          .order('start_date', { ascending: false })
          .limit(3);

        upcomingElections?.forEach(election => {
          const startDate = new Date(election.start_date);
          const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          addNotification({
            id: `upcoming-${election.id}`,
            title: 'Election Starting Soon',
            message: `"${election.title}" starts in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
            type: 'election_upcoming',
            read: false,
            created_at: new Date().toISOString(),
            data: { election_id: election.id, start_date: election.start_date },
            priority: daysUntil <= 1 ? 'high' : 'medium'
          });
        });

        activeElections?.forEach(election => {
          addNotification({
            id: `active-${election.id}`,
            title: 'Election Now Active',
            message: `You can now vote in "${election.title}"`,
            type: 'election_active',
            read: false,
            created_at: new Date().toISOString(),
            data: { election_id: election.id },
            priority: 'high'
          });
        });
      }

      if (profile.role === 'Administrator') {
        const { data: pendingActions } = await supabase
          .from('pending_actions')
          .select('*')
          .eq('status', 'Pending');

        const { data: pendingRegistrations } = await supabase
          .from('profiles')
          .select('*')
          .eq('registration_status', 'Pending');

        pendingActions?.forEach(action => {
          addNotification({
            id: `pending-action-${action.id}`,
            title: 'Pending Action',
            message: `Action "${action.action_type}" is awaiting your review`,
            type: 'election_submitted',
            read: false,
            created_at: new Date().toISOString(),
            data: { action_id: action.id },
            priority: 'high'
          });
        });

        pendingRegistrations?.forEach(user => {
          addNotification({
            id: `pending-registration-${user.id}`,
            title: 'User Registration Pending',
            message: `${user.full_name || 'A user'} is waiting for approval`,
            type: 'voter_registration',
            read: false,
            created_at: new Date().toISOString(),
            data: { user_id: user.id },
            priority: 'medium'
          });
        });
      }

      if (profile.role === 'Staff') {
        const { data: profileRequests } = await supabase
          .from('profile_update_requests')
          .select('*')
          .eq('status', 'Pending');

        profileRequests?.forEach(request => {
          addNotification({
            id: `profile-request-${request.id}`,
            title: 'Profile Update Request',
            message: 'A user has requested to update their profile',
            type: 'profile_update_request',
            read: false,
            created_at: new Date().toISOString(),
            data: { request_id: request.id },
            priority: 'medium'
          });
        });
      }

    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupListeners = () => {
    const channels: any[] = [];
    if (!user || !profile) return channels;

    const channelName = `notifications-${profile.role.toLowerCase()}`;
    const channel = supabase.channel(channelName);

    if (profile.role === 'Administrator') {
      channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pending_actions' }, payload => {
          addNotification({
            id: `pending-action-${payload.new.id}`,
            title: 'New Action Request',
            message: `A ${payload.new.action_type.replace('_', ' ')} request needs your review`,
            type: 'election_submitted',
            read: false,
            created_at: new Date().toISOString(),
            data: { action_id: payload.new.id, action_type: payload.new.action_type },
            priority: 'high'
          });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, payload => {
          if (payload.new.registration_status === 'Pending') {
            addNotification({
              id: `pending-registration-${payload.new.id}`,
              title: 'New User Registration',
              message: `${payload.new.full_name || 'A user'} has registered and needs approval`,
              type: 'voter_registration',
              read: false,
              created_at: new Date().toISOString(),
              data: { user_id: payload.new.user_id },
              priority: 'medium'
            });
          }
        });
    }

    if (profile.role === 'Voter') {
      channel
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'elections' }, payload => {
          if (payload.new.status === 'Active' && payload.old.status !== 'Active') {
            addNotification({
              id: `active-${payload.new.id}`,
              title: 'Election Now Active',
              message: `You can now vote in "${payload.new.title}"`,
              type: 'election_active',
              read: false,
              created_at: new Date().toISOString(),
              data: { election_id: payload.new.id },
              priority: 'high'
            });
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'elections' }, payload => {
          if (payload.new.status === 'Upcoming') {
            addNotification({
              id: `upcoming-${payload.new.id}`,
              title: 'New Election Announced',
              message: `"${payload.new.title}" has been scheduled`,
              type: 'election_upcoming',
              read: false,
              created_at: new Date().toISOString(),
              data: { election_id: payload.new.id, start_date: payload.new.start_date },
              priority: 'medium'
            });
          }
        });
    }

    if (profile.role === 'Staff') {
      channel
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pending_actions' }, payload => {
          if (payload.new.requested_by === user.id && payload.new.status !== 'Pending') {
            const isApproved = payload.new.status === 'Approved';
            addNotification({
              id: `action-update-${payload.new.id}`,
              title: isApproved ? 'Action Approved' : 'Action Rejected',
              message: `Your ${payload.new.action_type.replace('_', ' ')} request was ${payload.new.status.toLowerCase()}`,
              type: isApproved ? 'election_approved' : 'election_rejected',
              read: false,
              created_at: new Date().toISOString(),
              data: { action_id: payload.new.id, notes: payload.new.admin_notes },
              priority: isApproved ? 'medium' : 'high'
            });
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profile_update_requests' }, payload => {
          addNotification({
            id: `profile-request-${payload.new.id}`,
            title: 'New Profile Update Request',
            message: 'A user has requested to update their profile',
            type: 'profile_update_request',
            read: false,
            created_at: new Date().toISOString(),
            data: { request_id: payload.new.id },
            priority: 'medium'
          });
        });
    }

    channel.subscribe();
    channels.push(channel);
    return channels;
  };

  useEffect(() => {
    const channels = setupListeners();
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, profile]);

  useEffect(() => {
    if (user && profile && !hasFetched.current) {
      hasFetched.current = true;
      fetchInitialNotifications();
    }
  }, [user, profile]);

  return {
    notifications,
    unreadCount,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    refetch: fetchInitialNotifications,
    hasUnread: unreadCount > 0
  };
};
