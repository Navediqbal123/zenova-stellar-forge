import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Menu,
  Home,
  Smartphone,
  BarChart3,
  Download,
  Eye,
  Star,
  Wallet,
  Users,
  Globe,
  MonitorSmartphone,
  AlertTriangle,
  Zap,
  FileText,
  FileDown,
  Settings as SettingsIcon,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Calendar,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApps } from '@/contexts/AppsContext';
import { useAuth } from '@/contexts/AuthContext';

const TEXT = '#111111';
const MUTED = '#6B7280';
const ACCENT = '#3B82F6';
const BORDER = '#EEF0F3';
const SURFACE = '#F8F9FC';

const card =
  'bg-white rounded-[22px] border border-[#EEF0F3] shadow-[0_2px_14px_rgba(15,23,42,0.04)]';

const FILTERS = ['Today', '7 Days', '30 Days', '3 Months', '1 Year'] as const;

function Sparkline({ color = ACCENT, points = [4, 7, 5, 9, 7, 11, 9, 13] }: { color?: string; points?: number[] }) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const w = 100, h = 32;
  const step = w / (points.length - 1);
  const y = (p: number) => h - ((p - min) / (max - min || 1)) * (h - 2) - 1;
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${y(p)}`).join(' ');
  const area = `${d} L ${w} ${h} L 0 ${h} Z`;
  const id = `sg-${color.replace('#', '')}`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HealthRing({ score = 92 }: { score?: number }) {
  const size = 128;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#EEF2FF" strokeWidth={stroke} fill="none" />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor={ACCENT} />
          </linearGradient>
        </defs>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-bold tracking-tight" style={{ color: TEXT }}>{score}</span>
        <span className="text-[10px] font-medium" style={{ color: MUTED }}>/100</span>
      </div>
    </div>
  );
}

interface AnalyticsTabProps {
  onOpenMenu?: () => void;
}

const SIDEBAR_ITEMS = [
  { icon: Home, label: 'Overview', desc: 'Dashboard summary' },
  { icon: Smartphone, label: 'Apps', desc: 'Manage all applications' },
  { icon: BarChart3, label: 'Performance', desc: 'Performance insights' },
  { icon: Download, label: 'Downloads', desc: 'Install analytics' },
  { icon: Eye, label: 'Views', desc: 'App visibility' },
  { icon: Star, label: 'Ratings', desc: 'Ratings & reviews' },
  { icon: Wallet, label: 'Revenue', desc: 'Revenue analytics' },
  { icon: Users, label: 'Users', desc: 'User engagement' },
  { icon: Globe, label: 'Countries', desc: 'Traffic by country' },
  { icon: MonitorSmartphone, label: 'Devices', desc: 'Device analytics' },
  { icon: AlertTriangle, label: 'Crash Reports', desc: 'App crash logs' },
  { icon: Zap, label: 'Performance Monitor', desc: 'CPU, Memory & Speed' },
  { icon: Bell, label: 'Notifications', desc: 'Developer alerts' },
  { icon: FileText, label: 'Reports', desc: 'Generate reports' },
  { icon: FileDown, label: 'Export', desc: 'Export analytics' },
  { icon: SettingsIcon, label: 'Settings', desc: 'Developer preferences' },
];

export function AnalyticsTab({ onOpenMenu }: AnalyticsTabProps) {
  const { developerProfile } = useAuth();
  const { getAppsByDeveloper } = useApps();
  const myApps = developerProfile ? getAppsByDeveloper(developerProfile.id) : [];

  const [activeFilter, setActiveFilter] = useState<string>('Today');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const totalDownloads = myApps.reduce((s, a) => s + (a.downloads || 0), 0);
  const approvedApps = myApps.filter((a) => a.status === 'approved').length;
  const pendingApps = myApps.filter((a) => a.status === 'pending').length;
  const rejectedApps = myApps.filter((a) => a.status === 'rejected').length;
  const avgRating = myApps.length
    ? (myApps.reduce((s, a) => s + (a.rating || 0), 0) / myApps.length).toFixed(1)
    : '—';

  const topApp = [...myApps].sort((a, b) => (b.downloads || 0) - (a.downloads || 0))[0];

  const quickStats = [
    {
      icon: Download,
      label: 'Total Downloads',
      value: totalDownloads >= 1000 ? `${(totalDownloads / 1000).toFixed(1)}K` : String(totalDownloads),
      trend: '+18.6%',
      color: ACCENT,
      points: [3, 5, 4, 7, 6, 9, 8, 11],
    },
    {
      icon: Users,
      label: 'Active Users',
      value: '8.4K',
      trend: '+14.2%',
      color: '#10B981',
      points: [4, 6, 5, 7, 8, 9, 10, 12],
    },
    {
      icon: Wallet,
      label: 'Revenue',
      value: '₹12.6L',
      trend: '+22.5%',
      color: '#F59E0B',
      points: [3, 4, 5, 6, 7, 9, 10, 13],
    },
    {
      icon: Star,
      label: 'Avg Rating',
      value: String(avgRating),
      trend: '+0.2',
      color: '#8B5CF6',
      points: [5, 6, 6, 7, 7, 8, 8, 9],
    },
  ];

  const recentActivity = [
    { icon: CheckCircle2, label: 'Published', app: topApp?.name || 'Your App', time: '2m ago', color: '#10B981' },
    { icon: Star, label: 'New Review', app: '5-star review', time: '1h ago', color: '#F59E0B' },
    { icon: TrendingUp, label: 'App Updated', app: 'v2.4.1 released', time: '3h ago', color: ACCENT },
    { icon: AlertTriangle, label: 'Crash Fixed', app: 'Stability +12%', time: '1d ago', color: '#EF4444' },
  ];

  const recentNotifications = [
    { icon: CheckCircle2, title: 'App Approved', desc: 'Live on the store', time: '2m ago', tint: '#ECFDF5', color: '#10B981' },
    { icon: Wallet, title: 'Subscription Renewed', desc: 'Pro plan active', time: '1h ago', tint: '#EFF6FF', color: ACCENT },
    { icon: Star, title: 'New Review', desc: '"Absolutely brilliant."', time: '3h ago', tint: '#FEF3C7', color: '#F59E0B' },
    { icon: Download, title: 'Update Available', desc: 'SDK v4.2 ready', time: '1d ago', tint: '#EDE9FE', color: '#8B5CF6' },
  ];

  return (
    <div className="space-y-5 pb-6">
      {/* ===== Header ===== */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <button
            onClick={() => (onOpenMenu ? onOpenMenu() : setDrawerOpen(true))}
            aria-label="Open menu"
            className="w-10 h-10 -ml-1 flex items-center justify-center rounded-xl active:bg-[#F1F3F7] transition-colors shrink-0"
          >
            <Menu className="w-6 h-6" style={{ color: TEXT }} strokeWidth={1.9} />
          </button>
          <div className="min-w-0">
            <h1 className="text-[26px] font-bold tracking-tight leading-tight" style={{ color: TEXT }}>Overview</h1>
            <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>Monitor your apps and developer account</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search"
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#EEF0F3] bg-white active:bg-[#F8F9FC]"
          >
            <Search className="w-[18px] h-[18px]" style={{ color: TEXT }} strokeWidth={1.9} />
          </button>
          <button
            aria-label="Notifications"
            className="relative w-10 h-10 flex items-center justify-center rounded-xl border border-[#EEF0F3] bg-white active:bg-[#F8F9FC]"
          >
            <Bell className="w-[18px] h-[18px]" style={{ color: TEXT }} strokeWidth={1.9} />
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ background: ACCENT }}>3</span>
          </button>
        </div>
      </div>

      {/* Search field */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 h-11 rounded-2xl bg-[#F8F9FC] border border-[#EEF0F3]">
              <Search className="w-4 h-4" style={{ color: MUTED }} />
              <input
                autoFocus
                placeholder="Search apps, metrics, reports…"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#9CA3AF]"
                style={{ color: TEXT }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Filter chips ===== */}
      <div className="-mx-4 px-4 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 min-w-max">
          {FILTERS.map((f) => {
            const active = f === activeFilter;
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={cn(
                  'h-9 px-4 rounded-full text-[13px] font-medium transition-all',
                  active
                    ? 'text-white shadow-[0_4px_14px_rgba(59,130,246,0.35)]'
                    : 'bg-white border border-[#EEF0F3] text-[#111]'
                )}
                style={active ? { background: ACCENT } : {}}
              >
                {f}
              </button>
            );
          })}
          <button className="h-9 w-9 rounded-full bg-white border border-[#EEF0F3] flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" style={{ color: TEXT }} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* ===== Hero Card — App Health ===== */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(card, 'p-5')}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold" style={{ color: TEXT }}>App Health</h2>
          <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
            <TrendingUp className="w-4 h-4" style={{ color: ACCENT }} strokeWidth={2} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <HealthRing score={92} />
          <div className="flex-1 min-w-0">
            <p className="text-[18px] font-bold leading-tight" style={{ color: ACCENT }}>Excellent</p>
            <p className="text-[12px] mt-1" style={{ color: MUTED }}>Your apps are performing great!</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { dot: '#10B981', label: 'Healthy', value: approvedApps || 8 },
                { dot: '#F59E0B', label: 'In Review', value: pendingApps || 2 },
                { dot: '#EF4444', label: 'Rejected', value: rejectedApps || 0 },
              ].map((s) => (
                <div key={s.label} className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                    <span className="text-[16px] font-bold" style={{ color: TEXT }}>{s.value}</span>
                  </div>
                  <p className="text-[10.5px] mt-0.5 truncate" style={{ color: MUTED }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 -mx-1">
          <Sparkline color={ACCENT} points={[6, 8, 7, 10, 9, 12, 11, 14, 13, 15]} />
        </div>
      </motion.section>

      {/* ===== Quick Stats (2×2) ===== */}
      <section className="grid grid-cols-2 gap-3">
        {quickStats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(card, 'p-4')}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl border border-[#EEF0F3] bg-white flex items-center justify-center">
                <s.icon className="w-[18px] h-[18px]" style={{ color: TEXT }} strokeWidth={1.8} />
              </div>
            </div>
            <p className="text-[11px] font-medium" style={{ color: MUTED }}>{s.label}</p>
            <p className="text-[22px] font-bold leading-tight mt-0.5" style={{ color: TEXT }}>{s.value}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-[11px] font-semibold text-emerald-500">{s.trend}</span>
            </div>
            <div className="mt-2 -mx-1">
              <Sparkline color={s.color} points={s.points} />
            </div>
          </motion.div>
        ))}
      </section>

      {/* ===== Top Performing App ===== */}
      {topApp && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[22px] p-5 text-white"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 60%, #1D4ED8 100%)' }}
        >
          <div className="absolute -right-8 -top-6 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-white/90">Top Performing App</h3>
              <button className="text-[11px] font-medium bg-white/15 hover:bg-white/25 transition-colors px-2.5 py-1 rounded-full">
                View All
              </button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center overflow-hidden shrink-0">
                {topApp.icon_url?.startsWith('http') ? (
                  <img src={topApp.icon_url} alt={topApp.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-white">{topApp.name.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold truncate">{topApp.name}</p>
                  <span className="text-[10px] font-semibold bg-emerald-400/90 text-emerald-950 px-2 py-0.5 rounded-full">Live</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Downloads', value: '12.4K', trend: '+20.4%' },
                { label: 'Views', value: '32.6K', trend: '+18.7%' },
                { label: 'Revenue', value: '₹4.2L', trend: '+24.6%' },
                { label: 'Rating', value: '4.9', trend: '+0.3' },
              ].map((m) => (
                <div key={m.label} className="min-w-0">
                  <p className="text-[10px] text-white/70 truncate">{m.label}</p>
                  <p className="text-[15px] font-bold mt-0.5">{m.value}</p>
                  <p className="text-[10px] text-emerald-200 mt-0.5">↑ {m.trend}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* ===== Recent Activity ===== */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold" style={{ color: TEXT }}>Recent Activity</h2>
          <button className="text-[12px] font-semibold" style={{ color: ACCENT }}>View All</button>
        </div>
        <div className={cn(card, 'divide-y divide-[#F1F5F9]')}>
          {recentActivity.map((a) => (
            <div key={a.label} className="flex items-center gap-3 p-3.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${a.color}14` }}
              >
                <a.icon className="w-[18px] h-[18px]" style={{ color: a.color }} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: TEXT }}>{a.label}</p>
                <p className="text-[11.5px] truncate" style={{ color: MUTED }}>{a.app}</p>
              </div>
              <span className="text-[11px]" style={{ color: MUTED }}>{a.time}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Recent Notifications ===== */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold" style={{ color: TEXT }}>Recent Notifications</h2>
          <button className="text-[12px] font-semibold" style={{ color: ACCENT }}>View All</button>
        </div>
        <div className={cn(card, 'divide-y divide-[#F1F5F9]')}>
          {recentNotifications.map((n) => (
            <div key={n.title} className="flex items-center gap-3 p-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: n.tint }}>
                <n.icon className="w-[18px] h-[18px]" style={{ color: n.color }} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: TEXT }}>{n.title}</p>
                <p className="text-[11.5px] truncate" style={{ color: MUTED }}>{n.desc}</p>
              </div>
              <span className="text-[11px]" style={{ color: MUTED }}>{n.time}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Sidebar Drawer (fallback if no parent handler) ===== */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/35"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-0 top-0 h-[100dvh] w-[84vw] max-w-[320px] z-[81] bg-white overflow-y-auto border-r border-[#EEF0F3]"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: MUTED }}>Developer</p>
                  <p className="text-[17px] font-bold" style={{ color: TEXT }}>Analytics</p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center active:bg-[#F1F3F7]"
                >
                  <X className="w-5 h-5" style={{ color: TEXT }} />
                </button>
              </div>
              <nav className="px-3 pb-6">
                {SIDEBAR_ITEMS.map((it) => (
                  <button
                    key={it.label}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl active:bg-[#F8F9FC] transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl border border-[#EEF0F3] flex items-center justify-center shrink-0">
                      <it.icon className="w-[18px] h-[18px]" style={{ color: TEXT }} strokeWidth={1.7} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold truncate" style={{ color: TEXT }}>{it.label}</p>
                      <p className="text-[11px] truncate" style={{ color: MUTED }}>{it.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: MUTED }} />
                  </button>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
