import { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const ACCENT = '#0EA5E9';

interface NotificationRow {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { user, isAdmin, developerProfile } = useAuth();
  const isDeveloper = !!developerProfile;
  const canSee = !!user && (isAdmin || isDeveloper);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter(n => !n.is_read).length;

  const fetchNotifications = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (!error && data) setItems(data as any);
  };

  useEffect(() => {
    if (!canSee || !user) return;
    fetchNotifications();
    const ch = supabase
      .channel(`notif_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchNotifications()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSee, user?.id]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const markAsRead = async (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications' as any).update({ is_read: true } as any).eq('id', id);
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase
      .from('notifications' as any)
      .update({ is_read: true } as any)
      .eq('user_id', user.id)
      .eq('is_read', false);
  };

  if (!canSee) return null;

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-semibold"
                  style={{ color: ACCENT }}
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">No notifications yet</div>
              ) : (
                items.map(n => (
                  <button
                    key={n.id}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                    className={`w-full text-left px-4 py-3 flex gap-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-sky-50/60' : ''}`}
                  >
                    <span
                      className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: n.is_read ? 'transparent' : ACCENT }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {n.message}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
