import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Plus, 
  Eye, 
  Download, 
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  BarChart3,
  Lock,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useApps } from '@/contexts/AppsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/ui/StatusBadge';

// Animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function DeveloperDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, developerProfile, isDeveloperApproved } = useAuth();
  const { apps, categories, addApp, getAppsByDeveloper } = useApps();
  const { toast } = useToast();
  
  const [isAddingApp, setIsAddingApp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newApp, setNewApp] = useState({
    name: '',
    short_description: '',
    description: '',
    category_id: '',
    version: '1.0.0',
    size: '50 MB',
    icon_url: '📱',
  });

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 max-w-md text-center"
        >
          <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            Please sign in to access the Developer Dashboard
          </p>
          <Button onClick={() => navigate('/login')} className="bg-primary hover:bg-primary/90">
            Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  // Not a developer yet
  if (!developerProfile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 max-w-md text-center"
        >
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Become a Developer</h2>
          <p className="text-muted-foreground mb-6">
            Register as a developer to publish your apps
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => navigate('/developer/register')} className="bg-primary hover:bg-primary/90">
              Register Now
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Developer not approved - PREMIUM LOCKED SCREEN
  if (!isDeveloperApproved) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="admin-glass-card p-8 max-w-lg w-full text-center relative overflow-visible"
        >
          {developerProfile.status === 'pending' ? (
            <>
              {/* Animated lock icon with glow */}
              <div className="relative mx-auto w-24 h-24 mb-6">
                {/* Outer rotating ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-warning/30"
                  style={{ borderStyle: 'dashed' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
                {/* Middle pulsing ring */}
                <motion.div
                  className="absolute inset-2 rounded-full bg-warning/10"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Inner icon container */}
                <div className="absolute inset-4 rounded-full bg-warning/20 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Lock className="w-8 h-8 text-warning drop-shadow-[0_0_10px_hsla(35,100%,55%,0.5)]" />
                  </motion.div>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-2">Dashboard Locked</h2>
              <p className="text-muted-foreground mb-6">
                Your developer application is under review. The dashboard will unlock automatically once approved.
              </p>

              {/* Progress indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="w-4 h-4 text-warning" />
                  </motion.div>
                  <span className="text-sm text-warning font-medium">Review in progress...</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-warning via-warning/80 to-warning"
                    initial={{ width: '0%' }}
                    animate={{ width: ['0%', '70%', '40%', '90%', '60%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
              </div>

              {/* Developer info card */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Developer</span>
                  <span className="font-medium">{developerProfile.developer_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="capitalize text-sm px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">
                    {developerProfile.developer_type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <StatusBadge status="pending" showIcon />
                </div>
              </div>

              {/* Tips */}
              <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20 text-left">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-primary mb-1">What happens next?</p>
                    <p className="text-xs text-muted-foreground">
                      Our team typically reviews applications within 24-48 hours. Once approved, 
                      you'll have instant access to upload and manage your apps.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Rejected state */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6"
              >
                <XCircle className="w-10 h-10 text-destructive" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Application Rejected</h2>
              <p className="text-muted-foreground mb-4">
                Your developer application was not approved.
              </p>
              {developerProfile.rejection_reason && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-left mb-6">
                  <p className="text-sm font-medium text-destructive mb-1">Reason:</p>
                  <p className="text-sm text-destructive/80">{developerProfile.rejection_reason}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Please contact support for more information or to appeal this decision.
              </p>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  const myApps = getAppsByDeveloper(developerProfile.id);

  const handleAddApp = async () => {
    if (!newApp.name || !newApp.category_id || !newApp.short_description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addApp({
        name: newApp.name,
        description: newApp.description,
        short_description: newApp.short_description,
        category_id: newApp.category_id,
        version: newApp.version,
        size: newApp.size,
        icon_url: newApp.icon_url,
        developer_id: developerProfile.id,
        screenshots: [],
        featured: false,
        trending: false,
      });

      toast({
        title: "✅ App Submitted!",
        description: "Your app has been submitted for review"
      });

      setNewApp({
        name: '',
        short_description: '',
        description: '',
        category_id: '',
        version: '1.0.0',
        size: '50 MB',
        icon_url: '📱',
      });
      setIsAddingApp(false);
    } catch (error: any) {
      console.error('App submission error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to submit app. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
    { label: 'Downloads', value: stats.totalDownloads >= 1000000 
      ? `${(stats.totalDownloads / 1000000).toFixed(1)}M`
      : stats.totalDownloads >= 1000
        ? `${(stats.totalDownloads / 1000).toFixed(1)}K`
        : stats.totalDownloads, icon: Download, color: 'primary' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
              <LayoutDashboard className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Developer Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Welcome back, <span className="text-primary font-medium">{developerProfile.developer_name}</span>
          </p>
        </div>

        <Dialog open={isAddingApp} onOpenChange={setIsAddingApp}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-5 h-5 mr-2" />
                Upload New App
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="admin-glass-card border-white/10 max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload New App</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Input
                    value={newApp.icon_url}
                    onChange={(e) => setNewApp(prev => ({ ...prev, icon_url: e.target.value }))}
                    className="text-center text-2xl bg-white/5 border-white/10"
                    placeholder="📱"
                  />
                </div>
                <div className="space-y-2 col-span-3">
                  <Label>App Name *</Label>
                  <Input
                    value={newApp.name}
                    onChange={(e) => setNewApp(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white/5 border-white/10"
                    placeholder="My Awesome App"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={newApp.category_id}
                  onValueChange={(value) => setNewApp(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Short Description *</Label>
                <Input
                  value={newApp.short_description}
                  onChange={(e) => setNewApp(prev => ({ ...prev, short_description: e.target.value }))}
                  className="bg-white/5 border-white/10"
                  placeholder="A brief description"
                />
              </div>

              <div className="space-y-2">
                <Label>Full Description</Label>
                <Textarea
                  value={newApp.description}
                  onChange={(e) => setNewApp(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-white/5 border-white/10"
                  placeholder="Detailed description of your app..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Version</Label>
                  <Input
                    value={newApp.version}
                    onChange={(e) => setNewApp(prev => ({ ...prev, version: e.target.value }))}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Input
                    value={newApp.size}
                    onChange={(e) => setNewApp(prev => ({ ...prev, size: e.target.value }))}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>

              <Button 
                onClick={handleAddApp} 
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit App for Review'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat) => (
          <motion.div
            key={stat.label}
            variants={staggerItem}
            whileHover={{ scale: 1.02, y: -2 }}
            className="admin-glass-card p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl ${
                stat.color === 'primary' ? 'bg-primary/15' :
                stat.color === 'success' ? 'bg-success/15' : 'bg-secondary/15'
              }`}>
                <stat.icon className={`w-5 h-5 ${
                  stat.color === 'primary' ? 'text-primary' :
                  stat.color === 'success' ? 'text-success' : 'text-secondary'
                }`} />
              </div>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* My Apps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">My Apps</h2>
          <span className="text-sm text-muted-foreground">{myApps.length} apps</span>
        </div>

        {myApps.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="admin-glass-card p-12 text-center"
          >
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-xl text-muted-foreground mb-2">No apps yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Upload your first app to get started
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => setIsAddingApp(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="w-5 h-5 mr-2" />
                Upload App
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {myApps.map((app) => (
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{app.name}</h3>
                      <StatusBadge status={app.status} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{app.short_description}</p>
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
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" size="sm" className="border-white/10">
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
