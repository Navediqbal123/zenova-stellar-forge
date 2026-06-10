import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Plus,
  Eye,
  Download,
  Star,
  CheckCircle,
  XCircle,
  Package,
  BarChart3,
  Lock,
  Loader2,
  Sparkles,
  UploadCloud,
  Wand2,
  ArrowRight,
  ChevronDown,
  Menu,
  Bell,
  Settings,
  Save,
  Pencil,
  X,
  BadgeCheck,
  Info,
  TrendingUp,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useApps } from '@/contexts/AppsContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatusPipeline } from '@/components/developer/StatusPipeline';
import { DeveloperSidebar, type DeveloperTab } from '@/components/developer/DeveloperSidebar';
import { cn } from '@/lib/utils';
import { triggerCelebrationConfetti } from '@/lib/confetti';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { EditAppsTab } from '@/components/developer/EditAppsTab';

// Design tokens
const ACCENT = '#0EA5E9';
const TEXT = '#0A0A0A';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const PAGE_BG = '#F5F5F7';

const cardBase =
  'bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_2px_12px_rgba(15,23,42,0.04)]';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const staggerItem = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

// Tiny inline sparkline
function Sparkline({ color = ACCENT, points = [4, 9, 6, 12, 8, 14, 11] }: { color?: string; points?: number[] }) {
  const max = Math.max(...points, 1);
  const w = 60, h = 22;
  const step = w / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${h - (p / max) * h}`)
    .join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DeveloperDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, developerProfile, isDeveloperApproved } = useAuth();
  const { getAppsByDeveloper, refreshApps } = useApps();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<DeveloperTab>('dashboard');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; description: string; icon_url: string }>({ name: '', description: '', icon_url: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const prevStatusesRef = useRef<Record<string, string>>({});
  const myApps = developerProfile ? getAppsByDeveloper(developerProfile.id) : [];

  useEffect(() => {
    myApps.forEach((app) => {
      const prevStatus = prevStatusesRef.current[app.id];
      if (prevStatus && prevStatus !== 'approved' && app.status === 'approved') {
        triggerCelebrationConfetti();
      }
      prevStatusesRef.current[app.id] = app.status;
    });
  }, [myApps]);

  // ============ Auth Guards (Light Theme) ============
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: PAGE_BG }}>
        <div className={cn(cardBase, 'p-8 max-w-md text-center')}>
          <Lock className="w-14 h-14 mx-auto mb-4" style={{ color: TEXT }} strokeWidth={1.5} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: TEXT }}>Access Denied</h2>
          <p className="mb-6" style={{ color: MUTED }}>Please sign in to access the Developer Dashboard</p>
          <Button onClick={() => navigate('/login')} className="rounded-full text-white" style={{ background: ACCENT }}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (!developerProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: PAGE_BG }}>
        <div className={cn(cardBase, 'p-8 max-w-md text-center')}>
          <Package className="w-14 h-14 mx-auto mb-4" style={{ color: TEXT }} strokeWidth={1.5} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: TEXT }}>Become a Developer</h2>
          <p className="mb-6" style={{ color: MUTED }}>Register as a developer to publish your apps</p>
          <Button onClick={() => navigate('/developer/register')} className="rounded-full text-white" style={{ background: ACCENT }}>Register Now</Button>
        </div>
      </div>
    );
  }

  if (!isDeveloperApproved) {
    const isPending = developerProfile.status === 'pending';
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: PAGE_BG }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn(cardBase, 'p-8 max-w-lg w-full text-center')}>
          {isPending ? (
            <>
              <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5">
                <Loader2 className="w-9 h-9 text-amber-500 animate-spin" strokeWidth={1.8} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: TEXT }}>Dashboard Locked</h2>
              <p className="mb-6" style={{ color: MUTED }}>Your application is under review. The dashboard will unlock automatically once approved.</p>
              <div className="p-4 rounded-2xl bg-[#F5F5F7] text-left space-y-2">
                <div className="flex justify-between text-sm"><span style={{ color: MUTED }}>Developer</span><span className="font-medium" style={{ color: TEXT }}>{developerProfile.developer_name}</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: MUTED }}>Type</span><span className="font-medium capitalize" style={{ color: TEXT }}>{developerProfile.developer_type}</span></div>
                <div className="flex justify-between text-sm items-center"><span style={{ color: MUTED }}>Status</span><StatusBadge status="pending" showIcon /></div>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
                <XCircle className="w-10 h-10 text-red-500" strokeWidth={1.8} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: TEXT }}>Application Rejected</h2>
              <p className="mb-4" style={{ color: MUTED }}>Your developer application was not approved.</p>
              {developerProfile.rejection_reason && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-left mb-4">
                  <p className="text-sm font-medium text-red-600 mb-1">Reason</p>
                  <p className="text-sm text-red-500">{developerProfile.rejection_reason}</p>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    );
  }

  // ============ Stats ============
  const stats = {
    totalApps: myApps.length,
    pendingApps: myApps.filter((a) => a.status === 'pending').length,
    approvedApps: myApps.filter((a) => a.status === 'approved').length,
    totalDownloads: myApps.reduce((sum, app) => sum + app.downloads, 0),
    totalViews: myApps.reduce((sum, app) => sum + app.downloads * 3, 0),
  };

  const headerStats = [
    { icon: Package, label: 'Total Apps', value: stats.totalApps },
    { icon: CheckCircle, label: 'Approved', value: stats.approvedApps },
    { icon: Download, label: 'Downloads', value: stats.totalDownloads },
    { icon: Eye, label: 'Views', value: stats.totalViews },
  ];

  const overviewCards = [
    { icon: Package, label: 'Total Apps', value: stats.totalApps, trend: '+20%', color: ACCENT, bg: '#E0F2FE' },
    { icon: CheckCircle, label: 'Approved Apps', value: stats.approvedApps, trend: '+20%', color: '#10B981', bg: '#D1FAE5' },
    { icon: Download, label: 'Total Downloads', value: stats.totalDownloads, trend: '+0%', color: '#8B5CF6', bg: '#EDE9FE' },
    { icon: Eye, label: 'Total Views', value: stats.totalViews, trend: '+0%', color: '#F59E0B', bg: '#FEF3C7' },
  ];

  const handleUploadMethodSelect = (method: 'manual' | 'ai') => {
    if (method === 'ai') navigate('/developer/ai-upload');
    else navigate('/developer/upload');
  };

  const displayName = developerProfile.developer_name || user?.email?.split('@')[0] || 'there';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen" style={{ background: PAGE_BG }}>
      {/* Sidebar (existing) */}
      <DeveloperSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Mobile Menu */}
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="fixed top-3 left-3 z-40 w-11 h-11 rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.06)] lg:hidden flex items-center justify-center active:scale-95 transition-transform"
      >
        <Menu className="w-5 h-5" style={{ color: TEXT }} />
      </button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 flex-1 min-w-0 w-full overflow-x-hidden lg:ml-64 px-4 sm:px-6 pt-16 pb-28 lg:p-8"
      >
        <div className="max-w-6xl mx-auto space-y-6 min-w-0">
          {/* ============ Header ============ */}
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between gap-4"
          >
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: TEXT }}>
                Developer Console
              </h1>
              <p className="mt-1 text-sm sm:text-base" style={{ color: MUTED }}>
                Welcome back, <span className="font-semibold" style={{ color: ACCENT }}>{displayName} 👋</span>
              </p>
              <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                <BadgeCheck className="w-3.5 h-3.5" style={{ color: ACCENT }} fill={ACCENT + '20'} />
                <span className="text-[11px] font-medium" style={{ color: TEXT }}>Verified Developer</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('notifications')}
                className="relative w-11 h-11 rounded-full bg-white border border-[#E5E7EB] shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex items-center justify-center"
              >
                <Bell className="w-5 h-5" style={{ color: TEXT }} strokeWidth={1.8} />
                <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full" style={{ background: ACCENT }} />
              </button>
              <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-[0_2px_8px_rgba(14,165,233,0.3)]">
                {avatarLetter}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
              </div>
            </div>
          </motion.header>

          <AnimatePresence mode="wait">
            {/* ============ DASHBOARD TAB ============ */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-6"
              >
                {/* Upload Method Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'manual' as const, icon: UploadCloud, title: 'Manual Upload', desc: 'Full control over all app details and settings.', recommended: false },
                    { id: 'ai' as const, icon: Wand2, title: 'Upload with AI', desc: 'Let AI generate descriptions, tags and more for your app.', recommended: true },
                  ].map((m, i) => (
                    <motion.button
                      key={m.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleUploadMethodSelect(m.id)}
                      className={cn(cardBase, 'relative p-5 text-left overflow-hidden')}
                    >
                      {m.recommended && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ background: ACCENT }}>
                          Recommended
                        </span>
                      )}
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#E0F2FE' }}>
                        <m.icon className="w-6 h-6" style={{ color: ACCENT }} strokeWidth={1.8} />
                      </div>
                      <h3 className="text-base font-bold mb-1" style={{ color: TEXT }}>{m.title}</h3>
                      <p className="text-xs leading-relaxed mb-5" style={{ color: MUTED }}>{m.desc}</p>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(14,165,233,0.3)]" style={{ background: ACCENT }}>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Stats single horizontal card */}
                <div className={cn(cardBase, 'p-4 sm:p-6')}>
                  <div className="grid grid-cols-4 divide-x divide-[#E5E7EB]">
                    {headerStats.map((s) => (
                      <div key={s.label} className="flex flex-col items-center justify-center px-1 sm:px-3">
                        <s.icon className="w-5 h-5 mb-2" style={{ color: ACCENT }} strokeWidth={1.8} />
                        <p className="text-xl sm:text-2xl font-bold" style={{ color: TEXT }}>{s.value}</p>
                        <p className="text-[10px] sm:text-xs mt-0.5 text-center" style={{ color: MUTED }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Developer Score */}
                <div className={cn(cardBase, 'p-5')}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold" style={{ color: TEXT }}>Developer Score</p>
                      <Info className="w-3.5 h-3.5" style={{ color: MUTED }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold" style={{ color: ACCENT }}>85%</span>
                      <span className="text-[11px] font-medium text-green-600">Excellent</span>
                      <Sparkline color="#10B981" points={[3, 5, 4, 7, 6, 9, 11]} />
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '85%' }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: ACCENT }}
                    />
                  </div>
                </div>

                {/* Overview */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold" style={{ color: TEXT }}>Overview</h2>
                    <button className="text-xs font-medium flex items-center gap-1" style={{ color: MUTED }}>
                      This Month <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 sm:gap-4">
                    {overviewCards.map((c) => (
                      <motion.div key={c.label} variants={staggerItem} className={cn(cardBase, 'p-4')}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: c.bg }}>
                            <c.icon className="w-4.5 h-4.5" style={{ color: c.color }} strokeWidth={1.8} />
                          </div>
                          <Sparkline color={c.color} />
                        </div>
                        <p className="text-[11px] mb-1" style={{ color: MUTED }}>{c.label}</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold" style={{ color: TEXT }}>{c.value}</p>
                          <span className="text-[10px] font-semibold flex items-center gap-0.5" style={{ color: c.color }}>
                            <TrendingUp className="w-3 h-3" />{c.trend}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </section>

                {/* Recent Activity */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold" style={{ color: TEXT }}>Recent Activity</h2>
                    <button onClick={() => setActiveTab('my-apps')} className="text-xs font-semibold" style={{ color: ACCENT }}>View All</button>
                  </div>
                  <div className={cn(cardBase, 'divide-y divide-[#F1F5F9]')}>
                    {myApps.length === 0 ? (
                      <div className="p-8 text-center">
                        <Package className="w-10 h-10 mx-auto mb-3" style={{ color: MUTED }} strokeWidth={1.4} />
                        <p className="text-sm" style={{ color: MUTED }}>No apps uploaded yet</p>
                      </div>
                    ) : (
                      myApps.slice(0, 4).map((app) => (
                        <div key={app.id} className="p-3.5 flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-base shrink-0 overflow-hidden">
                            {app.icon_url && app.icon_url.startsWith('http') ? (
                              <img src={app.icon_url} alt={app.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold">{app.name.charAt(0)}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm truncate" style={{ color: TEXT }}>{app.name}</p>
                              <StatusBadge status={app.status} size="sm" />
                            </div>
                            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                              {app.created_at ? new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'} • {app.downloads} downloads
                            </p>
                          </div>
                          <button className="w-8 h-8 rounded-full hover:bg-[#F5F5F7] flex items-center justify-center">
                            <MoreHorizontal className="w-4 h-4" style={{ color: MUTED }} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </motion.div>
            )}

            {/* ============ MY APPS TAB ============ */}
            {activeTab === 'my-apps' && (
              <motion.div key="my-apps" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold" style={{ color: TEXT }}>My Apps</h2>
                  <span className="text-xs" style={{ color: MUTED }}>{myApps.length} apps</span>
                </div>
                {myApps.length === 0 ? (
                  <div className={cn(cardBase, 'p-10 text-center')}>
                    <Package className="w-14 h-14 mx-auto mb-3" style={{ color: MUTED }} strokeWidth={1.4} />
                    <p className="text-base mb-1" style={{ color: TEXT }}>No apps yet</p>
                    <p className="text-sm mb-5" style={{ color: MUTED }}>Upload your first app to get started</p>
                    <Button onClick={() => setActiveTab('dashboard')} className="rounded-full text-white" style={{ background: ACCENT }}>
                      <Plus className="w-4 h-4 mr-1" /> Go to Upload
                    </Button>
                  </div>
                ) : (
                  <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
                    {myApps.map((app) => {
                      const isExpanded = expandedAppId === app.id;
                      return (
                        <motion.div key={app.id} variants={staggerItem} layout className={cn(cardBase, 'overflow-hidden')}>
                          <button
                            onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                            className="w-full p-3.5 flex items-center gap-3 text-left"
                          >
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shrink-0 overflow-hidden">
                              {app.icon_url && app.icon_url.startsWith('http') ? (
                                <img src={app.icon_url} alt={app.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white font-bold">{app.name.charAt(0)}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-sm truncate" style={{ color: TEXT }}>{app.name}</h3>
                                <StatusBadge status={app.status} size="sm" />
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] mt-0.5" style={{ color: MUTED }}>
                                <span>{app.size || 'N/A'}</span><span>•</span>
                                <span>{app.downloads.toLocaleString()} ↓</span>
                                {app.rating ? (
                                  <><span>•</span><span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />{app.rating}</span></>
                                ) : null}
                              </div>
                            </div>
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronDown className="w-4 h-4" style={{ color: MUTED }} />
                            </motion.div>
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                                <div className="px-4 pb-4 pt-2 border-t border-[#F1F5F9]">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: MUTED }}>Review Pipeline</h4>
                                    {editingAppId === app.id ? (
                                      <Button size="sm" variant="ghost" onClick={() => setEditingAppId(null)}>
                                        <X className="w-4 h-4 mr-1" /> Cancel
                                      </Button>
                                    ) : (
                                      <Button size="sm" variant="outline" className="rounded-full border-[#E5E7EB]" style={{ color: ACCENT }} onClick={() => {
                                        setEditingAppId(app.id);
                                        setEditForm({ name: app.name, description: app.description, icon_url: app.icon_url || '' });
                                      }}>
                                        <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                                      </Button>
                                    )}
                                  </div>

                                  {editingAppId === app.id && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-4 rounded-2xl bg-[#F5F5F7] space-y-3">
                                      <div>
                                        <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>App Name</label>
                                        <Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="bg-white border-[#E5E7EB]" maxLength={30} />
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>Description</label>
                                        <Textarea value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} className="bg-white border-[#E5E7EB] min-h-[80px]" />
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>Icon URL or Emoji</label>
                                        <Input value={editForm.icon_url} onChange={(e) => setEditForm((p) => ({ ...p, icon_url: e.target.value }))} className="bg-white border-[#E5E7EB]" placeholder="📱 or https://..." />
                                      </div>
                                      <Button
                                        size="sm"
                                        disabled={isSavingEdit || !editForm.name.trim()}
                                        className="w-full rounded-full text-white"
                                        style={{ background: ACCENT }}
                                        onClick={async () => {
                                          setIsSavingEdit(true);
                                          try {
                                            const { error } = await supabase.from('apps').update({
                                              name: editForm.name.trim(),
                                              description: editForm.description.trim(),
                                              icon_url: editForm.icon_url.trim() || '📱',
                                              updated_at: new Date().toISOString(),
                                            }).eq('id', app.id);
                                            if (error) throw error;
                                            await refreshApps();
                                            setEditingAppId(null);
                                            toast({ title: 'App Updated', description: 'Your changes have been saved.' });
                                          } catch (err: any) {
                                            toast({ title: 'Update Failed', description: err?.message || 'Please try again.', variant: 'destructive' });
                                          } finally {
                                            setIsSavingEdit(false);
                                          }
                                        }}
                                      >
                                        {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                                        Save Changes
                                      </Button>
                                    </motion.div>
                                  )}

                                  <StatusPipeline status={app.status} lastUpdated={app.updated_at} />

                                  <div className="mt-4 pt-4 border-t border-[#F1F5F9] grid grid-cols-2 gap-3">
                                    <div><p className="text-[10px]" style={{ color: MUTED }}>Version</p><p className="text-xs font-semibold" style={{ color: TEXT }}>{app.version || '1.0.0'}</p></div>
                                    <div><p className="text-[10px]" style={{ color: MUTED }}>Size</p><p className="text-xs font-semibold" style={{ color: TEXT }}>{app.size || 'N/A'}</p></div>
                                    <div><p className="text-[10px]" style={{ color: MUTED }}>Category</p><p className="text-xs font-semibold" style={{ color: TEXT }}>{app.category || 'General'}</p></div>
                                    <div><p className="text-[10px]" style={{ color: MUTED }}>Submitted</p><p className="text-xs font-semibold" style={{ color: TEXT }}>{app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}</p></div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ============ EDIT APPS TAB ============ */}
            {activeTab === 'edit-apps' && (
              <motion.div key="edit-apps" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <EditAppsTab />
              </motion.div>
            )}

            {/* ============ ANALYTICS TAB ============ */}
            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                <h2 className="text-lg font-bold" style={{ color: TEXT }}>Analytics</h2>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {[
                    { icon: Download, label: 'Total Downloads', value: stats.totalDownloads.toLocaleString(), color: ACCENT, bg: '#E0F2FE' },
                    { icon: Eye, label: 'Total Views', value: stats.totalViews.toLocaleString(), color: '#F59E0B', bg: '#FEF3C7' },
                    { icon: CheckCircle, label: 'Approved Apps', value: stats.approvedApps, color: '#10B981', bg: '#D1FAE5' },
                    { icon: Star, label: 'Avg Rating', value: myApps.length > 0 ? (myApps.reduce((s, a) => s + a.rating, 0) / myApps.length).toFixed(1) : '—', color: '#8B5CF6', bg: '#EDE9FE' },
                  ].map((c) => (
                    <div key={c.label} className={cn(cardBase, 'p-4')}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: c.bg }}>
                        <c.icon className="w-4.5 h-4.5" style={{ color: c.color }} strokeWidth={1.8} />
                      </div>
                      <p className="text-[11px] mb-1" style={{ color: MUTED }}>{c.label}</p>
                      <p className="text-2xl font-bold" style={{ color: TEXT }}>{c.value}</p>
                    </div>
                  ))}
                </div>

                {myApps.length > 0 && (
                  <div className={cn(cardBase, 'p-4 sm:p-5')}>
                    <h3 className="text-sm font-bold mb-3" style={{ color: TEXT }}>Per-App Breakdown</h3>
                    <div className="space-y-2">
                      {myApps.map((app) => (
                        <div key={app.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F5F7]">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                            {app.icon_url && app.icon_url.startsWith('http') ? <img src={app.icon_url} alt={app.name} className="w-full h-full object-cover" /> : app.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate" style={{ color: TEXT }}>{app.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold" style={{ color: TEXT }}>{app.downloads.toLocaleString()}</p>
                            <p className="text-[10px]" style={{ color: MUTED }}>downloads</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ============ NOTIFICATIONS TAB ============ */}
            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: TEXT }}>
                  <Bell className="w-5 h-5" style={{ color: ACCENT }} strokeWidth={1.8} /> Notifications
                </h2>
                {myApps.length === 0 ? (
                  <div className={cn(cardBase, 'p-10 text-center')}>
                    <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: MUTED }} strokeWidth={1.4} />
                    <p className="text-sm" style={{ color: MUTED }}>No notifications yet</p>
                  </div>
                ) : (
                  <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-2.5">
                    {myApps.map((app) => (
                      <motion.div key={app.id} variants={staggerItem} className={cn(cardBase, 'p-4 flex items-center gap-3')}>
                        <div className={cn(
                          'w-10 h-10 rounded-2xl flex items-center justify-center',
                          app.status === 'approved' ? 'bg-green-50' : app.status === 'rejected' ? 'bg-red-50' : 'bg-amber-50'
                        )}>
                          {app.status === 'approved' ? <CheckCircle className="w-5 h-5 text-green-600" strokeWidth={1.8} /> :
                            app.status === 'rejected' ? <XCircle className="w-5 h-5 text-red-500" strokeWidth={1.8} /> :
                            <Loader2 className="w-5 h-5 text-amber-500" strokeWidth={1.8} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: TEXT }}>
                            {app.status === 'approved' ? `"${app.name}" has been approved! 🎉` :
                              app.status === 'rejected' ? `"${app.name}" was rejected.` :
                              `"${app.name}" is under review...`}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                            {app.updated_at ? new Date(app.updated_at).toLocaleString() : 'Recently'}
                          </p>
                        </div>
                        <StatusBadge status={app.status} size="sm" />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ============ SETTINGS TAB ============ */}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: TEXT }}>
                  <Settings className="w-5 h-5" style={{ color: ACCENT }} strokeWidth={1.8} /> Developer Profile
                </h2>
                <div className={cn(cardBase, 'p-5 sm:p-6 space-y-5')}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Developer Name', value: developerProfile.developer_name },
                      { label: 'Full Name', value: developerProfile.full_name },
                      { label: 'Email', value: developerProfile.email },
                      { label: 'Type', value: developerProfile.developer_type, capitalize: true },
                      { label: 'Country', value: developerProfile.country },
                      { label: 'Website', value: developerProfile.website || 'N/A' },
                    ].map((f) => (
                      <div key={f.label}>
                        <label className="text-xs font-medium mb-1.5 block" style={{ color: MUTED }}>{f.label}</label>
                        <Input value={f.value} readOnly className={cn('bg-[#F5F5F7] border-[#E5E7EB]', f.capitalize && 'capitalize')} style={{ color: TEXT }} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: MUTED }}>Bio</label>
                    <Textarea value={developerProfile.bio || ''} readOnly rows={3} className="bg-[#F5F5F7] border-[#E5E7EB]" style={{ color: TEXT }} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F5F5F7]">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: TEXT }}>Account Status</p>
                      <p className="text-xs" style={{ color: MUTED }}>Your developer account status</p>
                    </div>
                    <StatusBadge status={developerProfile.status} showIcon />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Action Button */}
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/developer/ai-upload')}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(14,165,233,0.45)]"
          style={{ background: ACCENT }}
          aria-label="Upload new app"
        >
          <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
        </motion.button>
      </motion.div>
    </div>
  );
}
