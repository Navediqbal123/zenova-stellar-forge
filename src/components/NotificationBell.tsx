import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function NotificationBell() {
  const { user, isAdmin, developerProfile } = useAuth();
  const navigate = useNavigate();
  const isDeveloper = !!developerProfile;
  const canSee = !!user && (isAdmin || isDeveloper);

  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('notifications' as any)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setUnreadCount(count || 0);
  };

  useEffect(() => {
    if (!canSee || !user) return;
    fetchUnread();
    const ch = supabase
      .channel(`notif_bell_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchUnread()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSee, user?.id]);

  if (!canSee) return null;

  return (
    <button
      onClick={() => navigate('/notifications')}
      className="relative p-2.5 rounded-full hover:bg-slate-200/60 transition-colors"
      aria-label="Notifications"
    >
      <Bell className="w-6 h-6 text-slate-700" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
