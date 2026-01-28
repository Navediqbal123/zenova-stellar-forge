import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useAppsQuery } from '@/hooks/useAppsQuery';
import { useRealTimeStats } from '@/hooks/useRealTimeStats';
import { StatsChart, TrendIndicator, MiniChart } from '@/components/admin/AdminStatsChart';
import { triggerConfetti, triggerCelebrationConfetti } from '@/lib/confetti';
import { LiveIndicator, DataFreshIndicator } from '@/components/ui/LiveIndicator';

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
      {activeTab === 'dashboard' && <AdminDashboard />}
      {activeTab === 'developers' && <AdminDevelopers />}
      {activeTab === 'apps' && <AdminApps />}
      {activeTab === 'categories' && <AdminCategories />}
      {activeTab === 'stats' && <AdminStats />}
    </AdminLayout>
  );
}

// Dashboard Tab with Charts and Trends
function AdminDashboard() {
  const { developers, refresh: refreshDevelopers, isRefreshing: isRefreshingDev } = useDevelopersQuery();
  const { pendingApps, refresh: refreshApps, isRefreshing: isRefreshingApps } = useAppsQuery();
  const { stats, isLive, lastUpdated, refresh: refreshStats } = useRealTimeStats(30000); // Auto-refresh every 30s
  const { toast } = useToast();

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
    { 
      label: 'Total Developers', 
      value: stats.totalDevelopers, 
      pending: stats.pendingDevelopers,
      icon: Users, 
      color: 'primary',
      trend: stats.totalDevelopers > 0 ? '+12%' : undefined,
      trendPositive: true,
    },
    { 
      label: 'Total Apps', 
      value: stats.totalApps, 
      pending: stats.pendingApps,
      icon: Package, 
      color: 'secondary',
      trend: stats.totalApps > 0 ? '+8%' : undefined,
      trendPositive: true,
    },
    { 
      label: 'Downloads', 
      value: formatDownloads(stats.totalDownloads), 
      icon: Download, 
      color: 'success',
      trend: stats.totalDownloads > 0 ? '+24%' : undefined,
      trendPositive: true,
    },
    { 
      label: 'Avg Rating', 
      value: stats.avgRating.toFixed(1), 
      icon: Star, 
      color: 'warning',
      trend: stats.avgRating > 0 ? '+0.3' : undefined,
      trendPositive: true,
    },
  ];

  const isRefreshing = isRefreshingDev || isRefreshingApps;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            Dashboard Overview
            <Zap className="w-5 h-5 text-warning" />
          </h1>
          <p className="text-muted-foreground">Welcome back, <span className="text-primary">Naved</span></p>
        </div>
        <div className="flex items-center gap-3">
          {/* Last updated indicator */}
          <DataFreshIndicator lastUpdated={lastUpdated} />
          
          {/* Refresh Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="bg-white/5 border-white/10 hover:bg-white/10"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </motion.div>
          
          {/* Live Indicator with green pulse */}
          {isLive && <LiveIndicator label="Live Data" />}
        </div>
      </motion.div>

      {/* Stats Grid with Trends */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={staggerItem}
            whileHover={{ scale: 1.02, y: -4 }}
            className="admin-glass-card p-5 relative overflow-hidden group"
          >
            {/* Decorative gradient on hover */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              stat.color === 'primary' && "bg-gradient-to-br from-primary/5 to-transparent",
              stat.color === 'secondary' && "bg-gradient-to-br from-secondary/5 to-transparent",
              stat.color === 'success' && "bg-gradient-to-br from-success/5 to-transparent",
              stat.color === 'warning' && "bg-gradient-to-br from-warning/5 to-transparent"
            )} />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  "p-2.5 rounded-xl",
                  stat.color === 'primary' && "bg-primary/15",
                  stat.color === 'secondary' && "bg-secondary/15",
                  stat.color === 'success' && "bg-success/15",
                  stat.color === 'warning' && "bg-warning/15"
                )}>
                  <stat.icon className={cn(
                    "w-5 h-5",
                    stat.color === 'primary' && "text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]",
                    stat.color === 'secondary' && "text-secondary drop-shadow-[0_0_8px_hsl(var(--secondary))]",
                    stat.color === 'success' && "text-success drop-shadow-[0_0_8px_hsl(var(--success))]",
                    stat.color === 'warning' && "text-warning drop-shadow-[0_0_8px_hsl(var(--warning))]"
                  )} />
                </div>
                {stat.trend && (
                  <TrendIndicator value={stat.trend} isPositive={stat.trendPositive} />
                )}
              </div>
              <span className="text-sm text-muted-foreground block mb-1">{stat.label}</span>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{stat.value}</p>
                <MiniChart color={stat.color as any} />
              </div>
              {stat.pending !== undefined && stat.pending > 0 && (
                <p className="text-sm text-warning mt-2 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {stat.pending} pending review
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Analytics Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="admin-glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Platform Growth
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-3 h-3 rounded-full bg-primary"></span>
            Downloads over time
          </div>
        </div>
        <StatsChart type="downloads" height={220} />
      </motion.div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="admin-glass-card p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            Pending Developers
          </h3>
          {developers.filter(d => d.status === 'pending').length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending developers</p>
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {developers.filter(d => d.status === 'pending').slice(0, 3).map((dev) => (
                <motion.div 
                  key={dev.id} 
                  variants={listItem}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <div>
                    <p className="font-medium">{dev.developer_name}</p>
                    <p className="text-sm text-muted-foreground">{dev.email}</p>
                  </div>
                  <StatusBadge status="pending" size="sm" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="admin-glass-card p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            Pending Apps
          </h3>
          {pendingApps.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending apps</p>
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {pendingApps.slice(0, 3).map((app) => (
                <motion.div 
                  key={app.id} 
                  variants={listItem}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{app.icon}</span>
                    <div>
                      <p className="font-medium">{app.name}</p>
                      <p className="text-sm text-muted-foreground">{app.developer_name}</p>
                    </div>
                  </div>
                  <StatusBadge status="pending" size="sm" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
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

  const filteredDevelopers = developers.filter(dev => 
    dev.developer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dev.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = async (developer: Developer) => {
    setIsProcessing(true);
    try {
      await updateStatus(developer.id, 'approved');
      
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Developers</h1>
          <p className="text-muted-foreground">{developers.length} registered developers</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="icon"
              onClick={refresh}
              disabled={isRefreshing}
              className="bg-white/5 border-white/10 hover:bg-white/10"
            >
              <RotateCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
          </motion.div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search developers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64 bg-white/5 border-white/10"
            />
          </div>
        </div>
      </div>

      {/* Developers List */}
      {filteredDevelopers.length === 0 ? (
        <div className="admin-glass-card p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-xl text-muted-foreground">
            {searchQuery ? 'No developers found' : 'No developers yet'}
          </p>
        </div>
      ) : (
        <motion.div 
          className="admin-glass-card overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Developer</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevelopers.map((developer, index) => (
                  <motion.tr 
                    key={developer.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <td>
                      <div>
                        <p className="font-medium">{developer.developer_name}</p>
                        <p className="text-sm text-muted-foreground">{developer.full_name}</p>
                      </div>
                    </td>
                    <td className="text-muted-foreground">{developer.email}</td>
                    <td>
                      <span className="capitalize text-sm px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                        {developer.developer_type}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={developer.status} showIcon />
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        {developer.status === 'pending' && (
                          <>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                size="sm"
                                disabled={isProcessing}
                                className="bg-success/20 text-success border border-success/30 hover:bg-success/30"
                                onClick={() => handleApprove(developer)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                size="sm"
                                disabled={isProcessing}
                                variant="outline"
                                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                                onClick={() => setRejectDialog({ open: true, developer })}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </motion.div>
                          </>
                        )}
                        {developer.status === 'approved' && (
                          <span className="text-sm text-success flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Active
                          </span>
                        )}
                        {developer.status === 'rejected' && (
                          <span className="text-sm text-destructive flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            Rejected
                          </span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
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

// Apps Tab with Pending Apps Section and Confetti
function AdminApps() {
  const { apps, pendingApps, updateStatus, refresh, isRefreshing } = useAppsQuery();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.developer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = async (app: any) => {
    setIsProcessing(true);
    try {
      await updateStatus(app.id, 'approved');
      
      // Trigger real confetti animation
      triggerConfetti();
      
      // Show confetti UI indicator
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      toast({
        title: "🎉 App Approved!",
        description: `${app.name} has been approved and is now visible in the store.`
      });
    } catch (error: any) {
      console.error('App approval error:', error);
      
      // Send error to chatbot for support
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Apps</h1>
          <p className="text-muted-foreground">{apps.length} total apps</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="icon"
              onClick={refresh}
              disabled={isRefreshing}
              className="bg-white/5 border-white/10 hover:bg-white/10"
            >
              <RotateCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
          </motion.div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search apps..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64 bg-white/5 border-white/10"
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
            {pendingApps.map((app) => (
              <motion.div
                key={app.id}
                variants={staggerItem}
                whileHover={{ scale: 1.01 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl shrink-0">
                  {app.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{app.name}</h3>
                    <StatusBadge status="pending" size="sm" />
                  </div>
                  <p className="text-sm text-muted-foreground">{app.developer_name || 'Unknown Developer'}</p>
                  {app.version && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5">v{app.version} • {app.size}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Download APK for Testing */}
                  {app.apk_url && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => window.open(app.apk_url, '_blank')}
                        title="Download APK for testing"
                      >
                        <FileDown className="w-4 h-4 mr-1" />
                        Test APK
                      </Button>
                    </motion.div>
                  )}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="sm"
                      disabled={isProcessing}
                      className="bg-success/20 text-success border border-success/30 hover:bg-success/30"
                      onClick={() => handleApprove(app)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="sm"
                      disabled={isProcessing}
                      variant="outline"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => handleReject(app)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
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
          {filteredApps.filter(a => a.status !== 'pending').map((app) => (
            <motion.div
              key={app.id}
              variants={staggerItem}
              whileHover={{ scale: 1.01 }}
              className="admin-glass-card p-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl shrink-0">
                  {app.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{app.name}</h3>
                    <StatusBadge status={app.status} size="sm" />
                  </div>
                  <p className="text-sm text-muted-foreground">{app.developer_name}</p>
                </div>
                <div className="hidden md:flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground">Downloads</p>
                    <p className="font-semibold">{app.downloads.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Rating</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Star className="w-4 h-4 text-warning fill-current" />
                      {app.rating || '-'}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-white/10">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
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
