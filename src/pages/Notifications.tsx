import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bell, CheckCheck, Inbox, Sparkles } from 'lucide-react';
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

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function groupByDay(items: NotificationRow[]) {
  const today: NotificationRow[] = [];
  const yesterday: NotificationRow[] = [];
  const earlier: NotificationRow[] = [];
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 86400000;
  for (const n of items) {
    const t = new Date(n.created_at).getTime();
    if (t >= startToday) today.push(n);
    else if (t >= startYesterday) yesterday.push(n);
    else earlier.push(n);
  }
  return { today, yesterday, earlier };
}

export default function Notifications() {
  const { user, isAdmin, developerProfile } = useAuth();
  const navigate = useNavigate();
  const canSee = !!user && (isAdmin || !!developerProfile);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const unread = items.filter(n => !n.is_read).length;

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setItems(data as any);
    setLoading(false);
  };

  useEffect(() => {
    if (!canSee) {
      setLoading(false);
      return;
    }
    fetchAll();
    if (!user) return;
    const ch = supabase
      .channel(`notif_page_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchAll()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSee, user?.id]);

  const markOne = async (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications' as any).update({ is_read: true } as any).eq('id', id);
  };

  const markAll = async () => {
    if (!user || unread === 0) return;
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase
      .from('notifications' as any)
      .update({ is_read: true } as any)
      .eq('user_id', user.id)
      .eq('is_read', false);
  };

  const groups = groupByDay(items);

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0.7 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.35 }}
      className="min-h-screen w-full overflow-x-hidden text-slate-900"
      style={{ backgroundColor: '#F2F2F7', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}
    >
      {/* Decorative ambient gradient */}
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-32 -left-20 w-72 h-72 rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #BAE6FD 0%, transparent 70%)' }}
        />
        <div
          aria-hidden
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #DDD6FE 0%, transparent 70%)' }}
        />

        <div className="relative w-full max-w-2xl mx-auto px-5 pt-5 pb-6">
          {/* Top bar */}
          <header className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-slate-200/60 active:bg-slate-300/60 transition"
              aria-label="Back"
            >
              <ArrowLeft className="w-6 h-6 text-slate-900" strokeWidth={2.5} />
            </button>

            {unread > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={markAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-md"
                style={{ backgroundColor: ACCENT }}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </motion.button>
            )}
          </header>

          {/* Hero */}
          <div className="mb-2">
            <div className="flex items-center gap-3 mb-1">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #6366F1 100%)` }}
              >
                <Bell className="w-6 h-6 text-white" strokeWidth={2.5} />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-none">Notifications</h1>
                <p className="text-sm text-slate-500 mt-1">
                  {unread > 0 ? (
                    <>You have <span className="font-bold" style={{ color: ACCENT }}>{unread}</span> unread</>
                  ) : 'You\'re all caught up'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="w-full max-w-2xl mx-auto px-5 pb-20">
        {!canSee ? (
          <EmptyState
            icon={<Bell className="w-8 h-8 text-slate-400" />}
            title="Notifications unavailable"
            subtitle="Sign in as a developer or admin to view notifications."
          />
        ) : loading ? (
          <div className="space-y-3 mt-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-white/70 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Inbox className="w-8 h-8 text-slate-400" />}
            title="No notifications yet"
            subtitle="When something important happens, you'll see it here."
          />
        ) : (
          <div className="space-y-6">
            {groups.today.length > 0 && (
              <Section title="Today" items={groups.today} onRead={markOne} />
            )}
            {groups.yesterday.length > 0 && (
              <Section title="Yesterday" items={groups.yesterday} onRead={markOne} />
            )}
            {groups.earlier.length > 0 && (
              <Section title="Earlier" items={groups.earlier} onRead={markOne} />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Section({
  title,
  items,
  onRead,
}: {
  title: string;
  items: NotificationRow[];
  onRead: (id: string) => void;
}) {
  return (
    <section>
      <h3 className="text-[11px] font-bold tracking-[0.15em] text-slate-500 uppercase mb-2 px-1">{title}</h3>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {items.map((n, idx) => (
            <motion.button
              key={n.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: Math.min(idx, 6) * 0.04, type: 'spring', stiffness: 240, damping: 22 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => !n.is_read && onRead(n.id)}
              className={`w-full text-left rounded-2xl px-4 py-3.5 flex items-start gap-3 border transition-colors ${
                n.is_read
                  ? 'bg-white border-slate-200'
                  : 'bg-white border-sky-200 shadow-[0_4px_20px_-8px_rgba(14,165,233,0.35)]'
              }`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: n.is_read
                    ? 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)'
                    : `linear-gradient(135deg, ${ACCENT} 0%, #6366F1 100%)`,
                }}
              >
                <Sparkles className={`w-5 h-5 ${n.is_read ? 'text-slate-400' : 'text-white'}`} strokeWidth={2.4} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${n.is_read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                  {n.message}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
              {!n.is_read && (
                <span
                  className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 shadow"
                  style={{ backgroundColor: ACCENT }}
                />
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 flex flex-col items-center text-center py-16 px-6 rounded-3xl bg-white border border-slate-200"
    >
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="text-sm text-slate-500 mt-1 max-w-xs">{subtitle}</p>
    </motion.div>
  );
}
