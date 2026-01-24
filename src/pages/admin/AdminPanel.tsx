import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  Package, 
  Layers, 
  MessageSquare,
  BarChart3,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Download,
  Star,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useDevelopers, Developer } from '@/contexts/AuthContext';
import { useApps, App } from '@/contexts/AppsContext';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type AdminTab = 'dashboard' | 'developers' | 'apps' | 'categories' | 'reviews' | 'stats' | 'settings';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 max-w-md text-center"
        >
          <Shield className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the Admin Panel
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            Go Home
          </Button>
        </motion.div>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'developers', label: 'Developers', icon: Users },
    { id: 'apps', label: 'Apps', icon: Package },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage your app store</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card p-2">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                activeTab === tab.id
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[60vh]">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'developers' && <AdminDevelopers />}
        {activeTab === 'apps' && <AdminApps />}
        {activeTab === 'categories' && <AdminCategories />}
        {activeTab === 'reviews' && <AdminReviews />}
        {activeTab === 'stats' && <AdminStats />}
        {activeTab === 'settings' && <AdminSettings />}
      </div>
    </motion.div>
  );
}

// Dashboard Tab
function AdminDashboard() {
  const { developers, isLoading } = useDevelopers();
  const { apps } = useApps();

  const stats = {
    totalDevelopers: developers.length,
    pendingDevelopers: developers.filter(d => d.status === 'pending').length,
    totalApps: apps.length,
    pendingApps: apps.filter(a => a.status === 'pending').length,
    totalDownloads: apps.reduce((sum, a) => sum + a.downloads, 0),
    avgRating: apps.length > 0 
      ? (apps.reduce((sum, a) => sum + a.rating, 0) / apps.length).toFixed(1)
      : '0.0',
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Developers</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalDevelopers}</p>
          {stats.pendingDevelopers > 0 && (
            <p className="text-sm text-warning mt-1">{stats.pendingDevelopers} pending</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Package className="w-5 h-5 text-secondary" />
            </div>
            <span className="text-sm text-muted-foreground">Apps</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalApps}</p>
          {stats.pendingApps > 0 && (
            <p className="text-sm text-warning mt-1">{stats.pendingApps} pending</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Download className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Downloads</span>
          </div>
          <p className="text-3xl font-bold">
            {stats.totalDownloads >= 1000000 
              ? `${(stats.totalDownloads / 1000000).toFixed(1)}M`
              : `${(stats.totalDownloads / 1000).toFixed(0)}K`
            }
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Star className="w-5 h-5 text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Avg Rating</span>
          </div>
          <p className="text-3xl font-bold">{stats.avgRating}</p>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            Pending Developers
          </h3>
          {developers.filter(d => d.status === 'pending').length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending developers</p>
          ) : (
            <div className="space-y-3">
              {developers.filter(d => d.status === 'pending').slice(0, 3).map((dev) => (
                <div key={dev.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">{dev.developer_name}</p>
                    <p className="text-sm text-muted-foreground">{dev.email}</p>
                  </div>
                  <span className="status-pending text-xs px-2 py-1 rounded-full">Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            Pending Apps
          </h3>
          {apps.filter(a => a.status === 'pending').length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending apps</p>
          ) : (
            <div className="space-y-3">
              {apps.filter(a => a.status === 'pending').slice(0, 3).map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{app.icon}</span>
                    <div>
                      <p className="font-medium">{app.name}</p>
                      <p className="text-sm text-muted-foreground">{app.developer_name}</p>
                    </div>
                  </div>
                  <span className="status-pending text-xs px-2 py-1 rounded-full">Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Developers Tab
function AdminDevelopers() {
  const { developers, isLoading } = useDevelopers();
  const { updateDeveloperStatus } = useAuth();
  const { toast } = useToast();
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; developer: Developer | null }>({
    open: false,
    developer: null,
  });
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async (developer: Developer) => {
    try {
      await updateDeveloperStatus(developer.id, 'approved');
      toast({
        title: "Developer Approved",
        description: `${developer.developer_name} has been approved`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve developer",
        variant: "destructive"
      });
    }
  };

  const handleReject = async () => {
    if (rejectDialog.developer) {
      try {
        await updateDeveloperStatus(rejectDialog.developer.id, 'rejected', rejectReason);
        toast({
          title: "Developer Rejected",
          description: `${rejectDialog.developer.developer_name} has been rejected`
        });
        setRejectDialog({ open: false, developer: null });
        setRejectReason('');
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to reject developer",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">All Developers</h2>
        <span className="text-sm text-muted-foreground">{developers.length} total</span>
      </div>

      {developers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-xl text-muted-foreground">No developers yet</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Developer</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {developers.map((developer) => (
                  <tr key={developer.id} className="border-b border-border/30 hover:bg-muted/20">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{developer.developer_name}</p>
                        <p className="text-sm text-muted-foreground">{developer.full_name}</p>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{developer.email}</td>
                    <td className="p-4">
                      <span className="capitalize text-sm px-2 py-1 rounded-full bg-muted">
                        {developer.developer_type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        developer.status === 'pending' ? 'status-pending' :
                        developer.status === 'approved' ? 'status-approved' : 'status-rejected'
                      }`}>
                        {developer.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {developer.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-success/30 text-success hover:bg-success/10"
                              onClick={() => handleApprove(developer)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive/30 text-destructive hover:bg-destructive/10"
                              onClick={() => setRejectDialog({ open: true, developer })}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, developer: null })}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle>Reject Developer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-muted-foreground">
              Are you sure you want to reject <strong>{rejectDialog.developer?.developer_name}</strong>?
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectDialog({ open: false, developer: null })}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject}
              >
                Reject Developer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Apps Tab
function AdminApps() {
  const { apps, updateAppStatus } = useApps();
  const { toast } = useToast();

  const handleApprove = async (app: App) => {
    try {
      await updateAppStatus(app.id, 'approved');
      toast({
        title: "App Approved",
        description: `${app.name} has been approved`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve app",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (app: App) => {
    try {
      await updateAppStatus(app.id, 'rejected');
      toast({
        title: "App Rejected",
        description: `${app.name} has been rejected`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject app",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">All Apps</h2>
        <span className="text-sm text-muted-foreground">{apps.length} total</span>
      </div>

      {apps.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-xl text-muted-foreground">No apps yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl shrink-0">
                  {app.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{app.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      app.status === 'pending' ? 'status-pending' :
                      app.status === 'approved' ? 'status-approved' : 'status-rejected'
                    }`}>
                      {app.status}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted capitalize">
                      {app.category}
                    </span>
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
                <div className="flex items-center gap-2">
                  {app.status === 'pending' ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-success/30 text-success hover:bg-success/10"
                        onClick={() => handleApprove(app)}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => handleReject(app)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Categories Tab
function AdminCategories() {
  const { categories, getAppsByCategory } = useApps();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Categories</h2>
        <Button variant="outline" size="sm">
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const appCount = getAppsByCategory(category.id).length;
          
          return (
            <div key={category.id} className="glass-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{category.icon}</div>
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{appCount} apps</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
              <p className="text-sm text-muted-foreground mt-3">{category.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Reviews Tab
function AdminReviews() {
  return (
    <div className="glass-card p-12 text-center">
      <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
      <p className="text-xl text-muted-foreground mb-2">Reviews Coming Soon</p>
      <p className="text-sm text-muted-foreground">
        Review management will be available in a future update
      </p>
    </div>
  );
}

// Stats Tab
function AdminStats() {
  const { apps } = useApps();
  const { developers } = useDevelopers();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Platform Growth
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Apps</span>
              <span className="font-bold text-xl">{apps.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Developers</span>
              <span className="font-bold text-xl">{developers.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Approved Developers</span>
              <span className="font-bold text-xl text-success">
                {developers.filter(d => d.status === 'approved').length}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-secondary" />
            Download Stats
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Downloads</span>
              <span className="font-bold text-xl">
                {(apps.reduce((sum, a) => sum + a.downloads, 0) / 1000000).toFixed(1)}M
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Avg per App</span>
              <span className="font-bold text-xl">
                {apps.length > 0 
                  ? `${(apps.reduce((sum, a) => sum + a.downloads, 0) / apps.length / 1000).toFixed(0)}K`
                  : '0'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Top Apps by Downloads</h3>
        <div className="space-y-3">
          {apps
            .filter(a => a.status === 'approved')
            .sort((a, b) => b.downloads - a.downloads)
            .slice(0, 5)
            .map((app, index) => (
              <div key={app.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                <span className="text-lg font-bold text-primary w-6">#{index + 1}</span>
                <span className="text-2xl">{app.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{app.name}</p>
                  <p className="text-sm text-muted-foreground">{app.developer_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{(app.downloads / 1000000).toFixed(1)}M</p>
                  <p className="text-sm text-muted-foreground">downloads</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// Settings Tab
function AdminSettings() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Store Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">Temporarily disable the store for maintenance</p>
            </div>
            <Button variant="outline">Disabled</Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div>
              <p className="font-medium">New Developer Signups</p>
              <p className="text-sm text-muted-foreground">Allow new developers to register</p>
            </div>
            <Button variant="outline" className="text-success border-success/30">Enabled</Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div>
              <p className="font-medium">App Submissions</p>
              <p className="text-sm text-muted-foreground">Allow developers to submit new apps</p>
            </div>
            <Button variant="outline" className="text-success border-success/30">Enabled</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
