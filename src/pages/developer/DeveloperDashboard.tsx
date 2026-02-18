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
  Megaphone,
  DollarSign,
  Bell,
  Settings,
  User,
  Save,
  Pencil,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

// Animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function DeveloperDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, developerProfile, isDeveloperApproved } = useAuth();
  const { apps, getAppsByDeveloper, refreshApps } = useApps();
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
    myApps.forEach(app => {
      const prevStatus = prevStatusesRef.current[app.id];
      if (prevStatus && prevStatus !== 'approved' && app.status === 'approved') {
        triggerCelebrationConfetti();
      }
      prevStatusesRef.current[app.id] = app.status;
    });
  }, [myApps]);

  // Auth guards
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 max-w-md text-center">
          <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">Please sign in to access the Developer Dashboard</p>
          <Button onClick={() => navigate('/login')} className="bg-primary hover:bg-primary/90">Sign In</Button>
        </motion.div>
      </div>
    );
  }

  if (!developerProfile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 max-w-md text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Become a Developer</h2>
          <p className="text-muted-foreground mb-6">Register as a developer to publish your apps</p>
          <Button onClick={() => navigate('/developer/register')} className="bg-primary hover:bg-primary/90">Register Now</Button>
        </motion.div>
      </div>
    );
  }

  if (!isDeveloperApproved) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="admin-glass-card p-8 max-w-lg w-full text-center relative overflow-visible">
          {developerProfile.status === 'pending' ? (
            <>
              <div className="relative mx-auto w-24 h-24 mb-6">
                <motion.div className="absolute inset-0 rounded-full border-2 border-warning/30" style={{ borderStyle: 'dashed' }} animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />
                <motion.div className="absolute inset-2 rounded-full bg-warning/10" animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
                <div className="absolute inset-4 rounded-full bg-warning/20 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-warning drop-shadow-[0_0_10px_hsla(35,100%,55%,0.5)]" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Dashboard Locked</h2>
              <p className="text-muted-foreground mb-6">Your developer application is under review. The dashboard will unlock automatically once approved.</p>
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                    <Loader2 className="w-4 h-4 text-warning" />
                  </motion.div>
                  <span className="text-sm text-warning font-medium">Review in progress...</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-warning via-warning/80 to-warning" initial={{ width: '0%' }} animate={{ width: ['0%', '70%', '40%', '90%', '60%'] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Developer</span>
                  <span className="font-medium">{developerProfile.developer_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="capitalize text-sm px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">{developerProfile.developer_type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <StatusBadge status="pending" showIcon />
                </div>
              </div>
              <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20 text-left">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-primary mb-1">What happens next?</p>
                    <p className="text-xs text-muted-foreground">Our team typically reviews applications within 24-48 hours. Once approved, you'll have instant access to upload and manage your apps.</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }} className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-destructive" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Application Rejected</h2>
              <p className="text-muted-foreground mb-4">Your developer application was not approved.</p>
              {developerProfile.rejection_reason && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-left mb-6">
                  <p className="text-sm font-medium text-destructive mb-1">Reason:</p>
                  <p className="text-sm text-destructive/80">{developerProfile.rejection_reason}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">Please contact support for more information or to appeal this decision.</p>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  const stats = {
    totalApps: myApps.length,
    pendingApps: myApps.filter(a => a.status === 'pending').length,
    approvedApps: myApps.filter(a => a.status === 'approved').length,
    totalDownloads: myApps.reduce((sum, app) => sum + app.downloads, 0),
    totalViews: myApps.reduce((sum, app) => sum + (app.downloads * 3), 0),
  };

  const statCards = [
    { label: 'Total Apps', value: stats.totalApps, icon: Package, color: 'primary' },
    { label: 'Approved', value: stats.approvedApps, icon: CheckCircle, color: 'success' },
    { label: 'Total Views', value: stats.totalViews >= 1000 ? `${(stats.totalViews / 1000).toFixed(1)}K` : stats.totalViews, icon: Eye, color: 'secondary' },
    { label: 'Downloads', value: stats.totalDownloads >= 1000000 ? `${(stats.totalDownloads / 1000000).toFixed(1)}M` : stats.totalDownloads >= 1000 ? `${(stats.totalDownloads / 1000).toFixed(1)}K` : stats.totalDownloads, icon: Download, color: 'primary' },
  ];

  const uploadMethods = [
    {
      id: 'manual' as const,
      title: 'Manual Upload',
      description: 'Full control over all app details. Perfect for experienced developers.',
      icon: UploadCloud,
      secondaryIcon: UploadCloud,
      color: 'secondary',
      features: ['Complete field control', 'Custom descriptions', 'Manual tagging'],
    },
    {
      id: 'ai' as const,
      title: 'Upload with AI',
      description: 'Let AI generate descriptions and tags automatically. Fast and smart.',
      icon: Wand2,
      secondaryIcon: Sparkles,
      color: 'primary',
      features: ['AI-powered descriptions', 'Auto-generated tags', 'One-click setup'],
      premium: true,
    },
  ];

  const handleUploadMethodSelect = (method: 'manual' | 'ai') => {
    if (method === 'ai') {
      navigate('/developer/ai-upload');
    } else {
      navigate('/developer/upload');
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="gradient-orb gradient-orb-primary w-[600px] h-[600px] -top-48 -left-48" />
        <div className="gradient-orb gradient-orb-secondary w-[500px] h-[500px] top-1/2 -right-64" />
      </div>

      {/* Sidebar */}
      <DeveloperSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="fixed top-4 left-4 z-40 p-2.5 rounded-xl glass-card lg:hidden hover-glow"
      >
        <Menu className="w-5 h-5 text-primary" />
      </button>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 lg:ml-64 p-4 pt-16 lg:p-8 lg:pt-8 pb-24 lg:pb-8"
      >
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                  <LayoutDashboard className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
                </div>
                <h1 className="text-xl sm:text-3xl font-bold">Developer Console</h1>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base">
                Welcome back, <span className="text-primary font-medium">{developerProfile.developer_name}</span>
              </p>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                {/* Upload Method Cards */}
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  {uploadMethods.map((method, index) => (
                    <motion.button
                      key={method.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
                      whileHover={{ scale: 1.03, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleUploadMethodSelect(method.id)}
                      className={cn(
                        "relative p-4 sm:p-8 rounded-2xl text-left transition-all duration-300",
                        "border-2 border-transparent admin-glass-card group overflow-hidden",
                        method.color === 'primary' && "hover:border-primary/50 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)]",
                        method.color === 'secondary' && "hover:border-secondary/50 hover:shadow-[0_0_30px_hsl(var(--secondary)/0.2)]"
                      )}
                    >
                      {method.premium && (
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-gradient-to-r from-secondary to-primary text-[10px] sm:text-xs font-semibold text-primary-foreground">
                          Recommended
                        </div>
                      )}
                      <div className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                        method.color === 'primary' && "bg-gradient-to-br from-primary/15 via-transparent to-transparent",
                        method.color === 'secondary' && "bg-gradient-to-br from-secondary/15 via-transparent to-transparent"
                      )} />
                      <div className="relative z-10">
                        <div className={cn(
                          "w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-6 transition-all duration-300 group-hover:scale-110",
                          method.color === 'primary' && "bg-primary/15 group-hover:bg-primary/25",
                          method.color === 'secondary' && "bg-secondary/15 group-hover:bg-secondary/25"
                        )}>
                          <method.icon className={cn(
                            "w-6 h-6 sm:w-8 sm:h-8 transition-all duration-300",
                            method.color === 'primary' && "text-primary",
                            method.color === 'secondary' && "text-secondary"
                          )} />
                        </div>
                        <h3 className="text-sm sm:text-xl font-bold mb-1 sm:mb-2 flex items-center gap-2">
                          {method.title}
                          <ArrowRight className={cn(
                            "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block",
                            method.color === 'primary' && "text-primary",
                            method.color === 'secondary' && "text-secondary"
                          )} />
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-6 line-clamp-2">{method.description}</p>
                        <ul className="space-y-1.5 hidden sm:block">
                          {method.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className={cn("w-1.5 h-1.5 rounded-full", method.color === 'primary' && "bg-primary", method.color === 'secondary' && "bg-secondary")} />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <motion.div
                        className="absolute -bottom-6 -right-6 opacity-5 group-hover:opacity-10 transition-opacity"
                        animate={{ rotate: [0, 10, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <method.secondaryIcon className="w-24 h-24 sm:w-40 sm:h-40" />
                      </motion.div>
                    </motion.button>
                  ))}
                </div>

                {/* Stats Grid */}
                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {statCards.map((stat) => (
                    <motion.div key={stat.label} variants={staggerItem} whileHover={{ scale: 1.02, y: -2 }} className="admin-glass-card p-4 sm:p-6">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className={cn("p-1.5 sm:p-2 rounded-lg sm:rounded-xl", stat.color === 'primary' && 'bg-primary/15', stat.color === 'success' && 'bg-success/15', stat.color === 'secondary' && 'bg-secondary/15')}>
                          <stat.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", stat.color === 'primary' && 'text-primary', stat.color === 'success' && 'text-success', stat.color === 'secondary' && 'text-secondary')} />
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground">{stat.label}</span>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* My Apps Tab */}
            {activeTab === 'my-apps' && (
              <motion.div key="my-apps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">My Apps</h2>
                  <span className="text-sm text-muted-foreground">{myApps.length} apps</span>
                </div>
                {myApps.length === 0 ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="admin-glass-card p-8 sm:p-12 text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-xl text-muted-foreground mb-2">No apps yet</p>
                    <p className="text-sm text-muted-foreground mb-6">Upload your first app to get started</p>
                    <Button onClick={() => setActiveTab('dashboard')} className="bg-primary hover:bg-primary/90">
                      <Plus className="w-5 h-5 mr-2" /> Go to Upload
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
                    {myApps.map((app) => {
                      const isExpanded = expandedAppId === app.id;
                      return (
                        <motion.div key={app.id} variants={staggerItem} layout className="admin-glass-card overflow-hidden">
                          <motion.button
                            whileHover={{ scale: 1.005 }}
                            onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                            className="w-full p-3 sm:p-4 flex items-center gap-3 sm:gap-4 text-left"
                          >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xl sm:text-2xl shrink-0 overflow-hidden">
                              {app.icon_url && app.icon_url.startsWith('http') ? (
                                <img src={app.icon_url} alt={app.name} className="w-full h-full object-cover" />
                              ) : (app.icon || app.icon_url || '📱')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <h3 className="font-semibold truncate text-sm sm:text-base">{app.name}</h3>
                                <StatusBadge status={app.status} size="sm" />
                                {app.is_paid ? (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-warning/40 text-warning hidden sm:inline-flex">
                                    <DollarSign className="w-3 h-3 mr-0.5" />Paid
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-success/40 text-success hidden sm:inline-flex">Free</Badge>
                                )}
                                {(app as any).contains_ads && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-warning/40 text-warning hidden sm:inline-flex">
                                    <Megaphone className="w-3 h-3 mr-0.5" />Ads
                                  </Badge>
                                )}
                              </div>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{app.short_description}</p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 md:hidden">
                                <span>{app.size || 'N/A'}</span>
                                <span>•</span>
                                <span>{app.downloads.toLocaleString()} downloads</span>
                              </div>
                            </div>
                            <div className="hidden md:flex items-center gap-6 text-sm">
                              <div className="text-center">
                                <p className="text-muted-foreground">Size</p>
                                <p className="font-semibold">{app.size || 'N/A'}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-muted-foreground">Downloads</p>
                                <p className="font-semibold">{app.downloads.toLocaleString()}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-muted-foreground">Rating</p>
                                <p className="font-semibold flex items-center gap-1">
                                  <Star className="w-4 h-4 text-warning fill-current" />{app.rating || '-'}
                                </p>
                              </div>
                            </div>
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="p-1">
                              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                            </motion.div>
                          </motion.button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden">
                                <div className="px-3 sm:px-4 pb-4 sm:pb-5 pt-2 border-t border-border/30">
                                  {/* Edit Button */}
                                  <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-medium text-muted-foreground">Review Status Pipeline</h4>
                                    {editingAppId === app.id ? (
                                      <Button size="sm" variant="ghost" onClick={() => setEditingAppId(null)}>
                                        <X className="w-4 h-4 mr-1" /> Cancel
                                      </Button>
                                    ) : (
                                      <Button size="sm" variant="outline" className="border-primary/30 text-primary" onClick={() => {
                                        setEditingAppId(app.id);
                                        setEditForm({ name: app.name, description: app.description, icon_url: app.icon_url || '' });
                                      }}>
                                        <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                                      </Button>
                                    )}
                                  </div>

                                  {/* Inline Edit Form */}
                                  {editingAppId === app.id && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                                      <div>
                                        <label className="text-xs font-medium mb-1 block text-muted-foreground">App Name</label>
                                        <Input value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} className="bg-white/5 border-white/10" maxLength={30} />
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium mb-1 block text-muted-foreground">Description</label>
                                        <Textarea value={editForm.description} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} className="bg-white/5 border-white/10 min-h-[80px]" />
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium mb-1 block text-muted-foreground">Icon URL or Emoji</label>
                                        <Input value={editForm.icon_url} onChange={(e) => setEditForm(prev => ({ ...prev, icon_url: e.target.value }))} className="bg-white/5 border-white/10" placeholder="📱 or https://..." />
                                      </div>
                                      <Button
                                        size="sm"
                                        disabled={isSavingEdit || !editForm.name.trim()}
                                        className="w-full bg-primary hover:bg-primary/90"
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
                                  <div className="mt-4 pt-4 border-t border-border/30 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                                    <div><p className="text-xs text-muted-foreground">Version</p><p className="text-sm font-medium">{app.version || '1.0.0'}</p></div>
                                    <div><p className="text-xs text-muted-foreground">Size</p><p className="text-sm font-medium">{app.size || 'N/A'}</p></div>
                                    <div><p className="text-xs text-muted-foreground">Category</p><p className="text-sm font-medium">{app.category || 'General'}</p></div>
                                    <div><p className="text-xs text-muted-foreground">Submitted</p><p className="text-sm font-medium">{app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}</p></div>
                                  </div>

                                  {/* AI Scan Report (if available) */}
                                  {(app as any).ai_scan_report && (() => {
                                    try {
                                      const report = typeof (app as any).ai_scan_report === 'string' ? JSON.parse((app as any).ai_scan_report) : (app as any).ai_scan_report;
                                      return (
                                        <div className="mt-4 pt-4 border-t border-border/30">
                                          <h4 className="text-sm font-medium mb-3 text-muted-foreground flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-primary" /> AI Scan Report
                                          </h4>
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                                              <p className="text-[10px] text-muted-foreground">Ads</p>
                                              <p className="text-xs font-medium">{report.ad_networks?.length > 0 ? report.ad_networks.join(', ') : 'None'}</p>
                                            </div>
                                            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                                              <p className="text-[10px] text-muted-foreground">IAP</p>
                                              <p className="text-xs font-medium">{report.iap_sdks?.length > 0 ? report.iap_sdks.join(', ') : 'None'}</p>
                                            </div>
                                            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                                              <p className="text-[10px] text-muted-foreground">Category</p>
                                              <p className="text-xs font-medium capitalize">{report.ai_category || 'N/A'}</p>
                                            </div>
                                            <div className={cn("p-2 rounded-lg border", report.risk_level === 'clean' ? "bg-success/5 border-success/30" : "bg-warning/5 border-warning/30")}>
                                              <p className="text-[10px] text-muted-foreground">Security</p>
                                              <p className={cn("text-xs font-bold", report.risk_level === 'clean' ? "text-success" : "text-warning")}>
                                                {report.risk_level === 'clean' ? 'Clean' : 'Warning'}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    } catch { return null; }
                                  })()}

                                  {/* Edit History */}
                                  <div className="mt-4 pt-4 border-t border-border/30">
                                    <h4 className="text-sm font-medium mb-3 text-muted-foreground">Edit History</h4>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-3 text-xs">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <span className="text-muted-foreground">App submitted on {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}</span>
                                      </div>
                                      {app.updated_at && app.updated_at !== app.created_at && (
                                        <div className="flex items-center gap-3 text-xs">
                                          <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                          <span className="text-muted-foreground">Last updated on {new Date(app.updated_at).toLocaleDateString()}</span>
                                        </div>
                                      )}
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
              </motion.div>
            )}

            {/* Edit Apps Tab */}
            {activeTab === 'edit-apps' && (
              <motion.div key="edit-apps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <EditAppsTab />
              </motion.div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <h2 className="text-xl font-bold">Analytics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="admin-glass-card p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-xl bg-primary/15"><Download className="w-5 h-5 text-primary" /></div>
                      <span className="text-sm text-muted-foreground">Total Downloads</span>
                    </div>
                    <p className="text-3xl font-bold">{stats.totalDownloads.toLocaleString()}</p>
                  </div>
                  <div className="admin-glass-card p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-xl bg-secondary/15"><Eye className="w-5 h-5 text-secondary" /></div>
                      <span className="text-sm text-muted-foreground">Total Views</span>
                    </div>
                    <p className="text-3xl font-bold">{stats.totalViews.toLocaleString()}</p>
                  </div>
                  <div className="admin-glass-card p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-xl bg-success/15"><CheckCircle className="w-5 h-5 text-success" /></div>
                      <span className="text-sm text-muted-foreground">Approved Apps</span>
                    </div>
                    <p className="text-3xl font-bold">{stats.approvedApps}</p>
                  </div>
                  <div className="admin-glass-card p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-xl bg-warning/15"><Star className="w-5 h-5 text-warning" /></div>
                      <span className="text-sm text-muted-foreground">Avg Rating</span>
                    </div>
                    <p className="text-3xl font-bold">
                      {myApps.length > 0 ? (myApps.reduce((s, a) => s + a.rating, 0) / myApps.length).toFixed(1) : '—'}
                    </p>
                  </div>
                </div>

                {/* Per-app breakdown */}
                {myApps.length > 0 && (
                  <div className="admin-glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4">Per-App Breakdown</h3>
                    <div className="space-y-3">
                      {myApps.map(app => (
                        <div key={app.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                          <span className="text-xl">{app.icon || '📱'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{app.name}</p>
                          </div>
                          <div className="text-right text-sm">
                            <p className="font-semibold">{app.downloads.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">downloads</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" /> Notifications
                </h2>
                {myApps.length === 0 ? (
                  <div className="admin-glass-card p-12 text-center">
                    <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
                    {myApps.map(app => (
                      <motion.div key={app.id} variants={staggerItem} className="admin-glass-card p-4 flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-xl",
                          app.status === 'approved' ? "bg-success/15" : app.status === 'rejected' ? "bg-destructive/15" : "bg-warning/15"
                        )}>
                          {app.status === 'approved' ? <CheckCircle className="w-5 h-5 text-success" /> :
                           app.status === 'rejected' ? <XCircle className="w-5 h-5 text-destructive" /> :
                           <Loader2 className="w-5 h-5 text-warning" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">
                            {app.status === 'approved' ? `"${app.name}" has been approved! 🎉` :
                             app.status === 'rejected' ? `"${app.name}" was rejected.` :
                             `"${app.name}" is under review...`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
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

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" /> Developer Profile
                </h2>
                <div className="admin-glass-card p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Developer Name</label>
                      <Input value={developerProfile.developer_name} readOnly className="bg-white/5 border-white/10" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Full Name</label>
                      <Input value={developerProfile.full_name} readOnly className="bg-white/5 border-white/10" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Email</label>
                      <Input value={developerProfile.email} readOnly className="bg-white/5 border-white/10" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Type</label>
                      <Input value={developerProfile.developer_type} readOnly className="bg-white/5 border-white/10 capitalize" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Country</label>
                      <Input value={developerProfile.country} readOnly className="bg-white/5 border-white/10" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Website</label>
                      <Input value={developerProfile.website || 'N/A'} readOnly className="bg-white/5 border-white/10" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Bio</label>
                    <Textarea value={developerProfile.bio || ''} readOnly rows={3} className="bg-white/5 border-white/10" />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/10">
                    <div>
                      <p className="font-medium">Account Status</p>
                      <p className="text-sm text-muted-foreground">Your developer account status</p>
                    </div>
                    <StatusBadge status={developerProfile.status} showIcon />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

    </div>
  );
}