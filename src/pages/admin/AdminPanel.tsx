import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminEditAppsTab } from '@/components/admin/AdminEditAppsTab';
import { AdminSupportTickets } from '@/components/admin/AdminSupportTickets';
import { 
  Users, 
  Package, 
  Layers, 
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Download,
  Star,
  Eye,
  Plus,
  Search,
  ShieldCheck,
  Activity,
  Zap,
  RotateCw,
  PartyPopper,
  Sparkles,
  RefreshCw,
  FileDown,
  ExternalLink,
  Brain,
  Scan,
  AlertTriangle,
  Shield,
  Tag,
  Menu,
  CalendarDays,
  Smartphone,
  ArrowUpRight,
  PieChart,
  ChevronRight,
  Home,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth, Developer } from '@/contexts/AuthContext';
import { useApps, App } from '@/contexts/AppsContext';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout, AdminTab } from '@/components/layout/AdminLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { adminAPI } from '@/lib/axios';
import { useDevelopersQuery } from '@/hooks/useDevelopersQuery';
import { useAppsQuery, type AppData } from '@/hooks/useAppsQuery';
import { useRealTimeStats } from '@/hooks/useRealTimeStats';
import { StatsChart, TrendIndicator } from '@/components/admin/AdminStatsChart';
import { triggerConfetti, triggerCelebrationConfetti } from '@/lib/confetti';
import { LiveIndicator, DataFreshIndicator } from '@/components/ui/LiveIndicator';
import { notifyDeveloperApproved, notifyAppApproved, getDeveloperUserIdById } from '@/lib/notifications';
import { NotificationBell } from '@/components/NotificationBell';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const listItem = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
};

// Backend stats interface
interface BackendStats {
  totalDevelopers: number;
  pendingDevelopers: number;
  totalApps: number;
  pendingApps: number;
  totalDownloads: number;
  avgRating: string;
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && <AdminDashboard activeTab={activeTab} onTabChange={setActiveTab} />}
      {activeTab === 'developers' && <AdminDevelopers />}
      {activeTab === 'apps' && <AdminApps />}
      {activeTab === 'edit-apps' && <AdminEditAppsTab />}
      {activeTab === 'categories' && <AdminCategories />}
      {activeTab === 'stats' && <AdminStats />}
      {activeTab === 'ai-insights' && <AdminAIInsights />}
      {activeTab === 'support-tickets' && <AdminSupportTickets />}
    </AdminLayout>
  );
}

function DashboardAvatar({ src, name }: { src?: string; name: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const canLoadImage = Boolean(src && /^(https?:\/\/|\/)/i.test(src) && !imageFailed);

  useEffect(() => setImageFailed(false), [src]);

  if (canLoadImage && src) {
    return <img src={src} alt={`${name} profile`} className="h-full w-full object-cover" onError={() => setImageFailed(true)} />;
  }

  return <span aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>;
}

function DashboardAppIcon({ app }: { app: AppData }) {
  const imageSource = app.icon_url || app.icon;
  const [imageFailed, setImageFailed] = useState(false);
  const canLoadImage = Boolean(imageSource && /^(https?:\/\/|\/)/i.test(imageSource) && !imageFailed);

  useEffect(() => setImageFailed(false), [imageSource]);

  return (
    <div className="admin-clay-icon flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-primary/10 text-primary">
      {canLoadImage ? (
        <img src={imageSource} alt={`${app.name} icon`} className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
      ) : app.icon && !/^(https?:\/\/|\/)/i.test(app.icon) ? (
        <span className="text-xl" aria-hidden="true">{app.icon}</span>
      ) : (
        <Package className="h-5 w-5" aria-hidden="true" />
      )}
    </div>
  );
}

// Dashboard Tab with Charts and Trends
function AdminDashboard({ activeTab, onTabChange }: { activeTab: AdminTab; onTabChange: (tab: AdminTab) => void }) {
  const { developers, refresh: refreshDevelopers, isRefreshing: isRefreshingDev } = useDevelopersQuery();
  const { apps, pendingApps, refresh: refreshApps, isRefreshing: isRefreshingApps } = useAppsQuery();
  const { stats, isLoading: isStatsLoading, isLive, lastUpdated, refresh: refreshStats } = useRealTimeStats(30000); // Auto-refresh every 30s
  const { toast } = useToast();
  const { user } = useAuth();
  const [chartRange, setChartRange] = useState(6);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(clock);
  }, []);

  const growthData = useMemo(() => {
    const buckets = Array.from({ length: chartRange }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - chartRange + index + 1, 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        apps: 0,
        developers: 0,
      };
    });
    const bucketIndex = new Map(buckets.map((bucket, index) => [bucket.key, index]));

    const addToBucket = (createdAt: string | null | undefined, field: 'apps' | 'developers') => {
      if (!createdAt) return;
      const date = new Date(createdAt);
      if (Number.isNaN(date.getTime())) return;
      const index = bucketIndex.get(`${date.getFullYear()}-${date.getMonth()}`);
      if (index !== undefined) buckets[index][field] += 1;
    };

    apps.forEach((app) => addToBucket(app.created_at, 'apps'));
    developers.forEach((developer) => addToBucket(developer.created_at, 'developers'));
    return buckets;
  }, [apps, chartRange, developers, now]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    apps.forEach((app) => {
      const category = app.category?.trim() || 'Uncategorized';
      counts.set(category, (counts.get(category) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((first, second) => second.count - first.count)
      .slice(0, 4);
  }, [apps]);

  const platforms = useMemo(() => {
    const counts = new Map<string, number>();
    apps.forEach((app) => {
      const platform = String((app as typeof app & { platform?: string }).platform ?? '').toLowerCase();
      const label = platform.includes('android') ? 'Android'
        : platform === 'ios' || platform.includes('iphone') || platform.includes('ipad') ? 'iOS'
        : platform.includes('web') ? 'Web'
        : platform ? 'Other'
        : app.apk_url || app.aab_url ? 'Android'
        : 'Unspecified';
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    return [...counts.entries()].filter(([, count]) => count > 0).map(([name, value]) => ({ name, value }));
  }, [apps]);

  const recentActivity = useMemo(() => [
    ...developers.map((developer) => ({
      id: `developer-${developer.id}`,
      title: 'Developer registered',
      subject: developer.developer_name || developer.full_name || 'Developer',
      status: developer.status,
      createdAt: developer.created_at,
      kind: 'developer' as const,
    })),
    ...apps.map((app) => ({
      id: `app-${app.id}`,
      title: 'App submitted',
      subject: app.name || 'App',
      status: app.status,
      createdAt: app.created_at,
      kind: 'app' as const,
    })),
  ].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()).slice(0, 4), [apps, developers]);

  const pendingDevelopers = useMemo(
    () => developers.filter((developer) => developer.status === 'pending').slice(0, 3),
    [developers],
  );

  const handleRefreshAll = async () => {
    await Promise.all([refreshDevelopers(), refreshApps(), refreshStats()]);
    toast({
      title: "✓ Data Refreshed",
      description: "All statistics have been updated from the server.",
    });
  };

  // Format download number nicely
  const formatDownloads = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
  };

  const statCards = [
    { label: 'Total Developers', value: stats.totalDevelopers.toLocaleString(), detail: `${stats.pendingDevelopers} awaiting review`, icon: Users, color: 'primary' },
    { label: 'Total Apps', value: stats.totalApps.toLocaleString(), detail: `${stats.pendingApps} awaiting review`, icon: Package, color: 'secondary' },
    { label: 'Downloads', value: formatDownloads(stats.totalDownloads), detail: 'Reported across all apps', icon: Download, color: 'success' },
    { label: 'Avg Rating', value: stats.avgRating.toFixed(1), detail: 'Across rated apps', icon: Star, color: 'warning' },
  ];

  const isRefreshing = isRefreshingDev || isRefreshingApps;
  const adminName = typeof user?.user_metadata?.full_name === 'string'
    ? user.user_metadata.full_name.split(' ')[0]
    : 'Naved';
  const profileImage = typeof user?.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : undefined;
  const activityAgo = (createdAt: string) => {
    const elapsed = Math.max(0, now.getTime() - new Date(createdAt).getTime());
    const minutes = Math.floor(elapsed / 60_000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };
  const categoryColors: Record<string, string> = {
    Android: 'hsl(var(--primary))',
    iOS: 'hsl(var(--secondary))',
    Web: 'hsl(var(--warning))',
    Other: 'hsl(var(--success))',
    Unspecified: 'hsl(var(--muted-foreground))',
  };

  return (
    <div className="admin-dashboard min-h-screen px-3 pb-32 pt-3 text-foreground sm:px-5 sm:pb-32 lg:px-0 lg:pb-8 lg:pt-0">
      <div className="mx-auto max-w-[1500px] space-y-4 sm:space-y-5">
        <header className="flex min-h-14 items-center gap-3 sm:gap-4">
          <Button variant="outline" size="icon" onClick={() => window.dispatchEvent(new CustomEvent('admin-open-mobile-menu'))} className="admin-soft-button h-11 w-11 shrink-0 border-border bg-card text-foreground lg:hidden" aria-label="Open admin menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="admin-clay-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Zap className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold leading-tight sm:text-xl">Elora <span className="text-primary">X</span></p>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
          <DataFreshIndicator lastUpdated={lastUpdated} />
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <div className="admin-clay-icon flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary/15 text-sm font-bold text-secondary" aria-label={`${adminName} admin profile`}>
              <DashboardAvatar src={profileImage} name={adminName} />
            </div>
          </div>
        </header>

        <section className="admin-welcome-card relative overflow-hidden rounded-[24px] border border-primary/20 px-4 py-4 shadow-[var(--shadow-admin-card)] sm:px-6 sm:py-5">
          <div className="relative z-10 flex min-h-[132px] items-center justify-between gap-2 sm:min-h-[148px]">
            <div className="min-w-0 max-w-[62%] sm:max-w-[58%]">
              <p className="text-sm font-medium text-muted-foreground sm:text-base">Welcome back,</p>
              <h1 className="mt-1 break-words text-2xl font-bold leading-tight sm:text-4xl">{adminName} <span aria-hidden="true">👋</span></h1>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">Here&apos;s what&apos;s happening with your platform today.</p>
            </div>
            <div className="relative flex h-28 min-w-0 flex-1 items-center justify-center sm:h-32">
              <div className="admin-clay-icon absolute left-[8%] top-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-warning/15 text-warning sm:left-[18%] sm:h-14 sm:w-14">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div className="admin-clay-icon absolute right-[7%] top-1 flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary text-primary-foreground sm:right-[12%] sm:h-16 sm:w-16">
                <TrendingUp className="h-7 w-7 sm:h-9 sm:w-9" />
              </div>
              <div className="absolute bottom-2 left-[28%] flex h-12 items-end gap-1.5 sm:left-[32%] sm:h-16 sm:gap-2">
                {[growthData.at(-4)?.apps ?? 0, growthData.at(-3)?.apps ?? 0, growthData.at(-2)?.apps ?? 0, growthData.at(-1)?.apps ?? 0].map((count, index) => {
                  const maximum = Math.max(1, ...growthData.map((item) => item.apps));
                  return <span key={`${index}-${count}`} className="admin-clay-icon w-3 rounded-t-md bg-primary/75 sm:w-4" style={{ height: `${Math.max(14, (count / maximum) * 100)}%` }} />;
                })}
              </div>
              <div className="absolute bottom-1 right-0 rounded-2xl border border-border/70 bg-card/90 px-2.5 py-2 shadow-[var(--shadow-admin-card)] backdrop-blur-sm sm:right-2 sm:px-3.5">
                <p className="whitespace-nowrap text-[10px] font-semibold sm:text-xs">{now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">{now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />Live overview</span>
            {isLive && <span className="hidden sm:inline-flex"><LiveIndicator label="Connected" /></span>}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefreshAll} disabled={isRefreshing} className="admin-soft-button h-9 border-border bg-card text-foreground">
            <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', isRefreshing && 'animate-spin')} />Refresh
          </Button>
        </div>

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {statCards.map((stat) => (
            <motion.section key={stat.label} variants={staggerItem} whileHover={{ y: -2 }} className="admin-clay-card min-w-0 p-3.5 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div className={cn('admin-clay-icon flex h-10 w-10 items-center justify-center rounded-2xl sm:h-12 sm:w-12',
                  stat.color === 'primary' && 'bg-primary/10 text-primary',
                  stat.color === 'secondary' && 'bg-secondary/10 text-secondary',
                  stat.color === 'success' && 'bg-success/10 text-success',
                  stat.color === 'warning' && 'bg-warning/10 text-warning')}>
                  <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                {stat.color === 'primary' || stat.color === 'secondary' ? <ArrowUpRight className="h-4 w-4 text-success" /> : null}
              </div>
              <p className="mt-3 text-[11px] font-medium leading-tight text-muted-foreground sm:text-sm">{stat.label}</p>
              <p className="mt-0.5 truncate text-2xl font-bold tabular-nums sm:text-3xl">{isStatsLoading ? '—' : stat.value}</p>
              <p className="mt-1 truncate text-[10px] text-muted-foreground sm:text-xs">{stat.detail}</p>
            </motion.section>
          ))}
        </motion.div>

        <section className="admin-clay-card p-4 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 sm:mb-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold sm:text-lg"><TrendingUp className="h-5 w-5 text-primary" />Platform Growth</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">New app submissions and developer registrations</p>
            </div>
            <select aria-label="Growth chart date range" value={chartRange} onChange={(event) => setChartRange(Number(event.target.value))} className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground shadow-sm outline-none focus:ring-2 focus:ring-ring">
              <option value={3}>Last 3 months</option><option value={6}>Last 6 months</option><option value={12}>Last 12 months</option>
            </select>
          </div>
          <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground sm:text-xs">
            <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-primary" />Apps</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-secondary" />Developers</span>
          </div>
          <div className="h-[210px] w-full sm:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="admin-app-growth" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.28} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient>
                  <linearGradient id="admin-developer-growth" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.2} /><stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="4 5" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={34} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 14, color: 'hsl(var(--popover-foreground))', boxShadow: 'var(--shadow-admin-floating)' }} />
                <Area type="monotone" dataKey="apps" name="Apps submitted" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#admin-app-growth)" activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="developers" name="Developers registered" stroke="hsl(var(--secondary))" strokeWidth={2.5} fill="url(#admin-developer-growth)" activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <section className="admin-clay-card min-w-0 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="flex items-center gap-2 text-base font-bold"><Layers className="h-4 w-4 text-secondary" />Top Categories</h2><p className="mt-0.5 text-xs text-muted-foreground">Apps by store category</p></div><Button variant="ghost" size="icon" aria-label="Open categories" onClick={() => onTabChange('categories')} className="h-8 w-8 text-muted-foreground"><ChevronRight className="h-4 w-4" /></Button></div>
            {categories.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No categories to show yet</p> : <div className="space-y-3.5">{categories.map((category, index) => <div key={category.name}><div className="mb-1.5 flex items-center justify-between gap-2 text-xs"><span className="truncate font-medium">{category.name}</span><span className="shrink-0 tabular-nums text-muted-foreground">{Math.round((category.count / Math.max(1, apps.length)) * 100)}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className={cn('h-full rounded-full', ['bg-primary', 'bg-secondary', 'bg-warning', 'bg-success'][index])} style={{ width: `${Math.max(5, (category.count / Math.max(1, categories[0]?.count ?? 1)) * 100)}%` }} /></div></div>)}</div>}
          </section>

          <section className="admin-clay-card min-w-0 p-4 sm:p-5">
            <div className="mb-2"><h2 className="flex items-center gap-2 text-base font-bold"><Smartphone className="h-4 w-4 text-primary" />Device Platforms</h2><p className="mt-0.5 text-xs text-muted-foreground">Distribution across submitted apps</p></div>
            {platforms.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No platform data available</p> : <div className="flex min-h-[160px] items-center gap-2 sm:gap-4"><div className="h-[150px] min-w-0 flex-1"><ResponsiveContainer width="100%" height="100%"><RechartsPieChart><Pie data={platforms} dataKey="value" nameKey="name" innerRadius="48%" outerRadius="78%" paddingAngle={3} stroke="hsl(var(--card))" strokeWidth={3}>{platforms.map((platform) => <Cell key={platform.name} fill={categoryColors[platform.name] ?? 'hsl(var(--muted-foreground))'} />)}</Pie><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--popover-foreground))' }} /></RechartsPieChart></ResponsiveContainer></div><div className="min-w-[95px] flex-1 space-y-2.5">{platforms.map((platform) => <div key={platform.name} className="flex items-center justify-between gap-2 text-[11px] sm:text-xs"><span className="flex min-w-0 items-center gap-1.5"><i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColors[platform.name] ?? 'hsl(var(--muted-foreground))' }} /><span className="truncate">{platform.name}</span></span><span className="font-semibold tabular-nums">{Math.round((platform.value / Math.max(1, apps.length)) * 100)}%</span></div>)}</div></div>}
          </section>
        </div>

        <section className="admin-clay-card overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-4 sm:px-5">
            <div className="min-w-0"><h2 className="flex items-center gap-2 text-base font-bold"><Users className="h-4 w-4 text-secondary" />Pending Developers</h2><p className="mt-0.5 text-xs text-muted-foreground">Developers awaiting approval</p></div>
            <Button variant="ghost" size="sm" onClick={() => onTabChange('developers')} className="shrink-0 text-primary">View all <ChevronRight className="ml-1 h-4 w-4" /></Button>
          </div>
          {pendingDevelopers.length === 0 ? <p className="border-t border-border px-4 py-5 text-sm text-muted-foreground sm:px-5">No developers awaiting review</p> : <div className="divide-y divide-border border-t border-border">{pendingDevelopers.map((developer) => <div key={developer.id} className="flex min-w-0 items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-5"><div className="admin-clay-icon flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary/10 text-xs font-semibold text-secondary">{developer.profile_photo_url ? <img src={developer.profile_photo_url} alt="" className="h-full w-full object-cover" onError={(event) => event.currentTarget.remove()} /> : (developer.developer_name || developer.full_name || 'D').slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold sm:text-sm">{developer.developer_name || developer.full_name || 'Developer'}</p><p className="truncate text-[10px] text-muted-foreground sm:text-xs">{developer.email}</p><p className="text-[10px] text-muted-foreground sm:hidden">Submitted {new Date(developer.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div><p className="hidden shrink-0 text-[10px] text-muted-foreground sm:block sm:text-xs">{new Date(developer.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p><Button variant="outline" size="sm" onClick={() => onTabChange('developers')} className="admin-soft-button h-8 shrink-0 border-primary/20 bg-primary/5 px-2.5 text-xs text-primary sm:h-9 sm:px-4">Review</Button></div>)}</div>}
        </section>

        <section className="admin-clay-card overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-4 sm:px-5">
            <div className="min-w-0"><h2 className="flex items-center gap-2 text-base font-bold"><Package className="h-4 w-4 text-secondary" />Pending Apps</h2><p className="mt-0.5 text-xs text-muted-foreground">Apps waiting for review</p></div>
            <Button variant="ghost" size="sm" onClick={() => onTabChange('apps')} className="shrink-0 text-primary">View all <ChevronRight className="ml-1 h-4 w-4" /></Button>
          </div>
          {pendingApps.length === 0 ? <p className="border-t border-border px-4 py-5 text-sm text-muted-foreground sm:px-5">No apps awaiting review</p> : <div className="divide-y divide-border border-t border-border">{pendingApps.slice(0, 3).map((app) => <div key={app.id} className="flex min-w-0 items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-5"><DashboardAppIcon app={app} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold sm:text-sm">{app.name}</p><p className="truncate text-[10px] text-muted-foreground sm:text-xs">v{app.version || '—'} <span aria-hidden="true">·</span> {app.size || 'Size unavailable'}</p><p className="truncate text-[10px] text-muted-foreground">{app.developer_name || 'Unknown Developer'}</p></div><StatusBadge status="pending" size="sm" /><Button variant="outline" size="sm" onClick={() => onTabChange('apps')} className="admin-soft-button h-8 shrink-0 border-primary/20 bg-primary/5 px-2.5 text-xs text-primary sm:h-9 sm:px-4">Review</Button></div>)}</div>}
        </section>

        <section className="admin-clay-card overflow-hidden">
          <div className="px-4 pb-3 pt-4 sm:px-5"><h2 className="flex items-center gap-2 text-base font-bold"><Activity className="h-4 w-4 text-success" />Recent Activity</h2><p className="mt-0.5 text-xs text-muted-foreground">Latest app submissions and developer registrations</p></div>
          {recentActivity.length === 0 ? <p className="border-t border-border px-4 py-5 text-sm text-muted-foreground sm:px-5">No recent activity yet</p> : <div className="divide-y divide-border border-t border-border">{recentActivity.map((activity) => <div key={activity.id} className="flex min-w-0 items-center gap-2.5 px-4 py-3 sm:gap-3 sm:px-5"><span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', activity.kind === 'app' ? 'bg-primary' : 'bg-success')} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium sm:text-sm">{activity.title}</p><p className="truncate text-[10px] text-muted-foreground sm:text-xs">{activity.subject}</p></div><StatusBadge status={activity.status} size="sm" /><time className="shrink-0 text-[10px] text-muted-foreground sm:text-xs">{activityAgo(activity.createdAt)}</time></div>)}</div>}
        </section>
      </div>

      <nav aria-label="Admin dashboard navigation" className="admin-dashboard-nav fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/95 px-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[var(--shadow-admin-floating)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {[
            { label: 'Dashboard', icon: Home, tab: 'dashboard' as AdminTab },
            { label: 'Developers', icon: Users, tab: 'developers' as AdminTab },
            { label: 'Apps', icon: Package, tab: 'apps' as AdminTab },
            { label: 'Analytics', icon: PieChart, tab: 'stats' as AdminTab },
          ].map((item) => <Button key={item.label} variant="ghost" onClick={() => onTabChange(item.tab)} aria-current={activeTab === item.tab ? 'page' : undefined} className={cn('h-[58px] min-w-0 flex-col gap-1 rounded-2xl px-1 text-muted-foreground', activeTab === item.tab && 'bg-primary/10 text-primary shadow-[var(--shadow-admin-card)]')}><item.icon className="h-5 w-5" /><span className="w-full truncate text-[9px] font-medium sm:text-[10px]">{item.label}</span></Button>)}
          <Button variant="ghost" onClick={() => window.dispatchEvent(new CustomEvent('admin-open-mobile-menu'))} className="h-[58px] min-w-0 flex-col gap-1 rounded-2xl px-1 text-muted-foreground"><MoreHorizontal className="h-5 w-5" /><span className="w-full truncate text-[9px] font-medium sm:text-[10px]">More</span></Button>
        </div>
      </nav>
    </div>
  );
}

// Developers Tab
function AdminDevelopers() {
  const { developers, isLoading, isRefreshing, refresh, updateStatus } = useDevelopersQuery();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; developer: Developer | null }>({
    open: false,
    developer: null,
  });
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const filteredDevelopers = developers.filter(dev => {
    const query = searchQuery.toLowerCase();
    return (dev.developer_name || '').toLowerCase().includes(query) ||
      (dev.email || '').toLowerCase().includes(query) ||
      (dev.full_name || '').toLowerCase().includes(query);
  });

  const handleApprove = async (developer: Developer) => {
    setIsProcessing(true);
    try {
      await updateStatus(developer.id, 'approved');
      if (developer.user_id) await notifyDeveloperApproved(developer.user_id);
      
      // Trigger real confetti animation
      triggerCelebrationConfetti();
      
      // Show confetti UI indicator
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      toast({
        title: "🎉 Developer Approved!",
        description: `${developer.developer_name} has been approved and can now access their dashboard.`
      });
    } catch (error: any) {
      console.error('Approval error:', error);
      
      // Send error to chatbot for support
      try {
        await adminAPI.getChatbotHelpWithContext(
          error?.message || 'Developer approval failed',
          'Admin Panel - Developer Approvals'
        );
      } catch {}

      toast({
        title: "Failed to approve",
        description: error?.message || "An error occurred. Please check RLS policies and try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.developer) return;
    
    setIsProcessing(true);
    try {
      await updateStatus(rejectDialog.developer.id, 'rejected', rejectReason || undefined);
      toast({
        title: "Developer Rejected",
        description: `${rejectDialog.developer.developer_name} has been rejected.`
      });
      setRejectDialog({ open: false, developer: null });
      setRejectReason('');
    } catch (error: any) {
      console.error('Rejection error:', error);
      toast({
        title: "Failed to reject",
        description: error?.message || "An error occurred. Please check RLS policies and try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-success/20 border border-success/30 backdrop-blur-xl"
            >
              <PartyPopper className="w-8 h-8 text-success" />
              <span className="text-xl font-bold text-success">Developer Approved!</span>
              <Sparkles className="w-6 h-6 text-warning animate-pulse" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-bold">Developers</h1>
          <p className="text-xs text-muted-foreground">{developers.length} registered</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isRefreshing}
            className="bg-white/5 border-white/10 hover:bg-white/10 gap-1.5 h-8 text-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            {isRefreshing ? '...' : 'Refresh'}
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm bg-white/5 border-white/10"
            />
          </div>
        </div>
      </div>

      {/* Developers List */}
      {filteredDevelopers.length === 0 ? (
        <div className="admin-glass-card p-8 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-base text-muted-foreground">
            {searchQuery ? 'No developers found' : 'No developers yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDevelopers.map((developer, index) => (
            <motion.div
              key={developer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="admin-glass-card p-4 space-y-3"
            >
              {/* Developer Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{developer.developer_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground truncate">{developer.full_name || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{developer.email || 'N/A'}</p>
                </div>
                <StatusBadge status={developer.status || 'pending'} showIcon />
              </div>

              {/* Type Badge */}
              <div>
                <span className="capitalize text-xs px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">
                  {developer.developer_type || 'N/A'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {developer.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      disabled={isProcessing}
                      className="flex-1 h-8 text-xs bg-success/20 text-success border border-success/30 hover:bg-success/30"
                      onClick={() => handleApprove(developer)}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      disabled={isProcessing}
                      variant="outline"
                      className="flex-1 h-8 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => setRejectDialog({ open: true, developer })}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
                {developer.status === 'approved' && (
                  <span className="text-xs text-success flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Active
                  </span>
                )}
                {developer.status === 'rejected' && (
                  <span className="text-xs text-destructive flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    Rejected
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => !isProcessing && setRejectDialog({ open, developer: null })}>
        <DialogContent className="admin-glass-card border-white/10">
          <DialogHeader>
            <DialogTitle>Reject Developer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-muted-foreground">
              Are you sure you want to reject <strong className="text-foreground">{rejectDialog.developer?.developer_name}</strong>?
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                rows={3}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                disabled={isProcessing}
                onClick={() => setRejectDialog({ open: false, developer: null })}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                disabled={isProcessing}
                onClick={handleReject}
              >
                {isProcessing ? 'Processing...' : 'Reject Developer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Apps Tab with Pending Apps Section, AI Report, and Confetti
function AdminApps() {
  const { apps, pendingApps, updateStatus, refresh, isRefreshing } = useAppsQuery();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [aiReportAppId, setAiReportAppId] = useState<string | null>(null);

  const filteredApps = apps.filter(app =>
    (app.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (app.developer_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = async (app: any) => {
    setIsProcessing(true);
    try {
      await updateStatus(app.id, 'approved');
      if (app.developer_id) {
        const ownerUserId = await getDeveloperUserIdById(app.developer_id);
        if (ownerUserId) await notifyAppApproved(ownerUserId, app.name);
      }
      
      triggerConfetti();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      toast({
        title: "🎉 App Approved!",
        description: `${app.name} has been approved and is now visible in the store.`
      });
    } catch (error: any) {
      console.error('App approval error:', error);
      try {
        await adminAPI.getChatbotHelpWithContext(
          error?.message || 'App approval failed',
          'Admin Panel - App Management'
        );
      } catch {}
      toast({
        title: "Failed to approve app",
        description: error?.message || "An error occurred. Please check RLS policies.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (app: any) => {
    setIsProcessing(true);
    try {
      await updateStatus(app.id, 'rejected');
      toast({
        title: "App Rejected",
        description: `${app.name} has been rejected.`
      });
    } catch (error: any) {
      console.error('App rejection error:', error);
      toast({
        title: "Failed to reject app",
        description: error?.message || "An error occurred. Please check RLS policies.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse AI scan report from app data
  const getAiReport = (app: any) => {
    try {
      if (app.ai_scan_report) {
        return typeof app.ai_scan_report === 'string' 
          ? JSON.parse(app.ai_scan_report)
          : app.ai_scan_report;
      }
    } catch {}
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-success/20 border border-success/30 backdrop-blur-xl"
            >
              <PartyPopper className="w-8 h-8 text-success" />
              <span className="text-xl font-bold text-success">App Approved!</span>
              <Sparkles className="w-6 h-6 text-warning animate-pulse" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-bold">Apps</h1>
          <p className="text-xs text-muted-foreground">{apps.length} total apps</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isRefreshing}
            className="bg-white/5 border-white/10 hover:bg-white/10 gap-1.5 h-8 text-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            {isRefreshing ? '...' : 'Refresh'}
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm bg-white/5 border-white/10"
            />
          </div>
        </div>
      </div>

      {/* Pending Apps Section */}
      {pendingApps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="admin-glass-card p-6 border-warning/30"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-semibold">Pending Approval</h2>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-warning/20 text-warning text-sm font-medium">
              {pendingApps.length}
            </span>
          </div>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {pendingApps.map((app) => {
              const aiReport = getAiReport(app);
              const isReportOpen = aiReportAppId === app.id;
              return (
                <motion.div
                  key={app.id}
                  variants={staggerItem}
                  className="rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden"
                >
                  <div className="p-4 space-y-3">
                    {/* App Info Row */}
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                        {app.icon && (app.icon.startsWith('http') || app.icon.startsWith('/')) ? (
                          <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
                        ) : (app.icon || '📱')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-semibold text-sm truncate">{app.name}</h3>
                          <StatusBadge status="pending" size="sm" />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{app.developer_name || 'Unknown Developer'}</p>
                        {app.version && (
                          <p className="text-[11px] text-muted-foreground/70 mt-0.5">v{app.version} • {app.size}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {app.contains_ads && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/20 text-warning border border-warning/30">Ads</span>
                          )}
                          {app.in_app_purchases && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/30">IAP</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Action Buttons - stacked for mobile */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {aiReport && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-secondary/30 text-secondary hover:bg-secondary/10"
                          onClick={() => setAiReportAppId(isReportOpen ? null : app.id)}
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1" />
                          AI Report
                        </Button>
                      )}
                      {app.apk_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10"
                          onClick={() => window.open(app.apk_url, '_blank')}
                        >
                          <FileDown className="w-3.5 h-3.5 mr-1" />
                          APK
                        </Button>
                      )}
                      <div className="flex-1" />
                      <Button
                        size="sm"
                        disabled={isProcessing}
                        className="h-8 text-xs bg-success/20 text-success border border-success/30 hover:bg-success/30"
                        onClick={() => handleApprove(app)}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        disabled={isProcessing}
                        variant="outline"
                        className="h-8 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => handleReject(app)}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                  
                  {/* AI Scan Report Expandable */}
                  <AnimatePresence>
                    {isReportOpen && aiReport && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-2 border-t border-white/10">
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-secondary" />
                            AI Scan Report
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                              <p className="text-xs text-muted-foreground mb-1">Ad Networks</p>
                              <p className="text-sm font-medium">
                                {aiReport.ad_networks?.length > 0
                                  ? aiReport.ad_networks.join(', ')
                                  : 'None detected'}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                              <p className="text-xs text-muted-foreground mb-1">IAP SDKs</p>
                              <p className="text-sm font-medium">
                                {aiReport.iap_sdks?.length > 0
                                  ? aiReport.iap_sdks.join(', ')
                                  : 'None detected'}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                              <p className="text-xs text-muted-foreground mb-1">Category (AI)</p>
                              <p className="text-sm font-medium capitalize">{aiReport.ai_category || 'N/A'}</p>
                            </div>
                            <div className={cn(
                              "p-3 rounded-lg border",
                              aiReport.risk_level === 'clean'
                                ? "bg-success/5 border-success/30"
                                : "bg-warning/5 border-warning/30"
                            )}>
                              <p className="text-xs text-muted-foreground mb-1">Risk</p>
                              <p className={cn(
                                "text-sm font-bold",
                                aiReport.risk_level === 'clean' ? "text-success" : "text-warning"
                              )}>
                                {aiReport.risk_level === 'clean' ? '✅ Clean' : '⚠️ Warning'}
                              </p>
                            </div>
                          </div>
                          {aiReport.ai_tags && (
                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-muted-foreground">Tags:</span>
                              {aiReport.ai_tags.map((tag: string) => (
                                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 capitalize">{tag}</span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-3">
                            AI detected {aiReport.ad_networks?.length || 0} ad network(s) and {aiReport.iap_sdks?.length || 0} IAP SDK(s). 
                            Recommended Status: <span className={aiReport.risk_level === 'clean' ? 'text-success' : 'text-warning'}>{aiReport.risk_level === 'clean' ? 'Safe' : 'Review Required'}</span>
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      )}

      {/* All Apps List */}
      {filteredApps.length === 0 ? (
        <div className="admin-glass-card p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-xl text-muted-foreground">
            {searchQuery ? 'No apps found' : 'No apps yet'}
          </p>
        </div>
      ) : (
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {filteredApps.filter(a => a.status !== 'pending').map((app) => {
            const aiReport = getAiReport(app);
            const isReportOpen = aiReportAppId === app.id;
            return (
            <motion.div
              key={app.id}
              variants={staggerItem}
              className="admin-glass-card overflow-hidden"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                    {app.icon && (app.icon.startsWith('http') || app.icon.startsWith('/')) ? (
                      <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
                    ) : (app.icon || '📱')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-semibold text-sm truncate">{app.name}</h3>
                      <StatusBadge status={app.status} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{app.developer_name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {app.downloads.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-warning fill-current" />
                        {app.rating || '-'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {aiReport && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs border-secondary/30 text-secondary hover:bg-secondary/10"
                      onClick={() => setAiReportAppId(isReportOpen ? null : app.id)}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                      AI Report
                    </Button>
                  )}
                  <div className="flex-1" />
                  <Button size="sm" variant="outline" className="h-8 text-xs border-white/10">
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {/* AI Report Expandable */}
              <AnimatePresence>
                {isReportOpen && aiReport && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 border-t border-white/10">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-secondary" />
                        AI Scan Report
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                          <p className="text-xs text-muted-foreground mb-1">Ad Networks</p>
                          <p className="text-sm font-medium">{aiReport.ad_networks?.length > 0 ? aiReport.ad_networks.join(', ') : 'None detected'}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                          <p className="text-xs text-muted-foreground mb-1">IAP SDKs</p>
                          <p className="text-sm font-medium">{aiReport.iap_sdks?.length > 0 ? aiReport.iap_sdks.join(', ') : 'None detected'}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                          <p className="text-xs text-muted-foreground mb-1">Category (AI)</p>
                          <p className="text-sm font-medium capitalize">{aiReport.ai_category || 'N/A'}</p>
                        </div>
                        <div className={cn("p-3 rounded-lg border", aiReport.risk_level === 'clean' ? "bg-success/5 border-success/30" : "bg-warning/5 border-warning/30")}>
                          <p className="text-xs text-muted-foreground mb-1">Risk</p>
                          <p className={cn("text-sm font-bold", aiReport.risk_level === 'clean' ? "text-success" : "text-warning")}>
                            {aiReport.risk_level === 'clean' ? '✅ Clean' : '⚠️ Warning'}
                          </p>
                        </div>
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
    </div>
  );
}

// Categories Tab
function AdminCategories() {
  const { categories, getAppsByCategory } = useApps();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Categories</h1>
          <p className="text-muted-foreground">{categories.length} categories</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </motion.div>
      </div>

      {/* Categories Grid */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {categories.map((category) => {
          const appCount = getAppsByCategory(category.id).length;
          
          return (
            <motion.div 
              key={category.id} 
              variants={staggerItem}
              whileHover={{ scale: 1.02, y: -2 }}
              className="admin-glass-card p-6 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{category.icon}</div>
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{appCount} apps</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Edit
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{category.description}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

// Stats Tab with Enhanced Charts
function AdminStats() {
  const { apps } = useApps();
  const { developers } = useDevelopersQuery();

  const topApps = apps
    .filter(a => a.status === 'approved')
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">Statistics</h1>
        <p className="text-muted-foreground">Platform analytics and reports</p>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="admin-glass-card p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Downloads Trend
          </h3>
          <StatsChart type="downloads" height={180} />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="admin-glass-card p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-secondary" />
            Developer Growth
          </h3>
          <StatsChart type="developers" height={180} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="admin-glass-card p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Platform Growth
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03]">
              <span className="text-muted-foreground">Total Apps</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl">{apps.length}</span>
                <TrendIndicator value="+8%" isPositive />
              </div>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03]">
              <span className="text-muted-foreground">Total Developers</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl">{developers.length}</span>
                <TrendIndicator value="+12%" isPositive />
              </div>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03]">
              <span className="text-muted-foreground">Approved Developers</span>
              <span className="font-bold text-xl text-success">
                {developers.filter(d => d.status === 'approved').length}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="admin-glass-card p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-secondary" />
            Download Stats
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03]">
              <span className="text-muted-foreground">Total Downloads</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl">
                  {apps.reduce((sum, a) => sum + a.downloads, 0) >= 1000000
                    ? `${(apps.reduce((sum, a) => sum + a.downloads, 0) / 1000000).toFixed(1)}M`
                    : `${Math.floor(apps.reduce((sum, a) => sum + a.downloads, 0) / 1000)}K`
                  }
                </span>
                <TrendIndicator value="+24%" isPositive />
              </div>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03]">
              <span className="text-muted-foreground">Avg per App</span>
              <span className="font-bold text-xl">
                {apps.length > 0 
                  ? `${Math.floor(apps.reduce((sum, a) => sum + a.downloads, 0) / apps.length / 1000)}K`
                  : '0'
                }
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Apps */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="admin-glass-card p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Top Apps by Downloads</h3>
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {topApps.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No approved apps yet</p>
          ) : (
            topApps.map((app, index) => (
              <motion.div 
                key={app.id} 
                variants={listItem}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5"
              >
                <span className="text-lg font-bold text-primary w-8">#{index + 1}</span>
                <span className="text-2xl">{app.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{app.name}</p>
                  <p className="text-sm text-muted-foreground">{app.developer_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {app.downloads >= 1000000 
                      ? `${(app.downloads / 1000000).toFixed(1)}M`
                      : `${Math.floor(app.downloads / 1000)}K`
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">downloads</p>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

// AI Insights Tab - Shows AI scan data from all apps
function AdminAIInsights() {
  const { apps, refresh, isRefreshing } = useAppsQuery();

  const appsWithReports = apps.filter(app => {
    try {
      if (app.ai_scan_report) {
        const report = typeof app.ai_scan_report === 'string' ? JSON.parse(app.ai_scan_report) : app.ai_scan_report;
        return !!report;
      }
    } catch {}
    return false;
  }).map(app => {
    const report = typeof app.ai_scan_report === 'string' ? JSON.parse(app.ai_scan_report) : app.ai_scan_report;
    return { ...app, parsedReport: report };
  });

  const totalWithAds = appsWithReports.filter(a => a.parsedReport?.ad_networks?.length > 0).length;
  const totalWithIAP = appsWithReports.filter(a => a.parsedReport?.iap_sdks?.length > 0).length;
  const totalClean = appsWithReports.filter(a => a.parsedReport?.risk_level === 'clean').length;
  const totalWarning = appsWithReports.filter(a => a.parsedReport?.risk_level !== 'clean').length;

  const summaryCards = [
    { label: 'Apps Scanned', value: appsWithReports.length, icon: Scan, color: 'primary' },
    { label: 'Ads Detected', value: totalWithAds, icon: Tag, color: 'warning' },
    { label: 'IAP Detected', value: totalWithIAP, icon: Package, color: 'secondary' },
    { label: 'Clean Apps', value: totalClean, icon: Shield, color: 'success' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            AI Insights
          </h1>
          <p className="text-muted-foreground">AI-detected monetization, categories & risk analysis</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing} className="bg-white/5 border-white/10 hover:bg-white/10">
            <RotateCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </motion.div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <motion.div
            key={card.label}
            variants={staggerItem}
            whileHover={{ scale: 1.02, y: -4 }}
            className="admin-glass-card p-5 relative overflow-hidden"
          >
            <div className={cn("p-2.5 rounded-xl w-fit mb-3",
              card.color === 'primary' && "bg-primary/15",
              card.color === 'secondary' && "bg-secondary/15",
              card.color === 'success' && "bg-success/15",
              card.color === 'warning' && "bg-warning/15"
            )}>
              <card.icon className={cn("w-5 h-5",
                card.color === 'primary' && "text-primary",
                card.color === 'secondary' && "text-secondary",
                card.color === 'success' && "text-success",
                card.color === 'warning' && "text-warning"
              )} />
            </div>
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Warning Banner */}
      {totalWarning > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="admin-glass-card p-4 border-warning/30 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <p className="text-sm"><span className="font-semibold text-warning">{totalWarning} app(s)</span> flagged for review by AI scan</p>
        </motion.div>
      )}

      {/* App-wise AI Reports */}
      {appsWithReports.length === 0 ? (
        <div className="admin-glass-card p-12 text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-xl text-muted-foreground">No AI scan reports yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Reports will appear when developers upload apps with AI scanning</p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
          {appsWithReports.map((app) => {
            const report = app.parsedReport;
            return (
              <motion.div key={app.id} variants={staggerItem} className="admin-glass-card overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-xl shrink-0">
                    {app.icon || '📱'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{app.name}</h3>
                      <StatusBadge status={app.status} size="sm" />
                      {report.risk_level === 'clean' ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/20 text-success border border-success/30">✅ Clean</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/20 text-warning border border-warning/30">⚠️ Review</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{app.developer_name || 'Unknown'}</p>
                  </div>
                </div>
                <div className="px-4 pb-4 border-t border-white/5 pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                      <p className="text-xs text-muted-foreground mb-1">Ad Networks</p>
                      <p className="text-sm font-medium">{report.ad_networks?.length > 0 ? report.ad_networks.join(', ') : 'None'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                      <p className="text-xs text-muted-foreground mb-1">IAP SDKs</p>
                      <p className="text-sm font-medium">{report.iap_sdks?.length > 0 ? report.iap_sdks.join(', ') : 'None'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                      <p className="text-xs text-muted-foreground mb-1">AI Category</p>
                      <p className="text-sm font-medium capitalize">{report.ai_category || 'N/A'}</p>
                    </div>
                    <div className={cn("p-3 rounded-lg border", report.risk_level === 'clean' ? "bg-success/5 border-success/30" : "bg-warning/5 border-warning/30")}>
                      <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
                      <p className={cn("text-sm font-bold", report.risk_level === 'clean' ? "text-success" : "text-warning")}>
                        {report.risk_level === 'clean' ? 'Safe' : 'Review'}
                      </p>
                    </div>
                  </div>
                  {report.ai_tags && report.ai_tags.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <Tag className="w-3 h-3 text-muted-foreground" />
                      {report.ai_tags.map((tag: string) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 capitalize">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
