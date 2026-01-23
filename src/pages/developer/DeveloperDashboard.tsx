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
  Lock
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

export default function DeveloperDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, developerProfile, isDeveloperApproved } = useAuth();
  const { apps, categories, addApp, getAppsByDeveloper } = useApps();
  const { toast } = useToast();
  
  const [isAddingApp, setIsAddingApp] = useState(false);
  const [newApp, setNewApp] = useState({
    name: '',
    shortDescription: '',
    description: '',
    category: '',
    version: '1.0.0',
    size: '50 MB',
    icon: '📱',
  });

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 max-w-md text-center"
        >
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Become a Developer</h2>
          <p className="text-muted-foreground mb-6">
            Register as a developer to publish your apps
          </p>
          <Button onClick={() => navigate('/developer/register')} className="bg-primary hover:bg-primary/90">
            Register Now
          </Button>
        </motion.div>
      </div>
    );
  }

  // Developer not approved - LOCKED
  if (!isDeveloperApproved) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 max-w-md text-center"
        >
          {developerProfile.status === 'pending' ? (
            <>
              <div className="w-20 h-20 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Lock className="w-10 h-10 text-warning" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Dashboard Locked</h2>
              <p className="text-muted-foreground mb-6">
                Your developer application is under review. The dashboard will unlock automatically once approved.
              </p>
              <div className="p-4 rounded-lg bg-muted/50 text-left space-y-2">
                <p className="text-sm"><strong>Developer:</strong> {developerProfile.developerName}</p>
                <p className="text-sm"><strong>Type:</strong> {developerProfile.developerType}</p>
                <p className="text-sm flex items-center gap-2">
                  <strong>Status:</strong> 
                  <span className="flex items-center gap-1 text-warning">
                    <Clock className="w-4 h-4" />
                    Under Review
                  </span>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Application Rejected</h2>
              <p className="text-muted-foreground mb-4">
                Your developer application was not approved.
              </p>
              {developerProfile.rejectionReason && (
                <div className="p-4 rounded-lg bg-destructive/10 text-left mb-6">
                  <p className="text-sm text-destructive"><strong>Reason:</strong> {developerProfile.rejectionReason}</p>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    );
  }

  const myApps = getAppsByDeveloper(developerProfile.id);

  const handleAddApp = () => {
    if (!newApp.name || !newApp.category || !newApp.shortDescription) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    addApp({
      ...newApp,
      developerId: developerProfile.id,
      developerName: developerProfile.developerName,
      screenshots: [],
      featured: false,
      trending: false,
    });

    toast({
      title: "App Submitted!",
      description: "Your app has been submitted for review"
    });

    setNewApp({
      name: '',
      shortDescription: '',
      description: '',
      category: '',
      version: '1.0.0',
      size: '50 MB',
      icon: '📱',
    });
    setIsAddingApp(false);
  };

  const stats = {
    totalApps: myApps.length,
    pendingApps: myApps.filter(a => a.status === 'pending').length,
    approvedApps: myApps.filter(a => a.status === 'approved').length,
    totalDownloads: myApps.reduce((sum, app) => sum + app.downloads, 0),
    totalViews: myApps.reduce((sum, app) => sum + (app.downloads * 3), 0), // Mock views
  };

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
            <LayoutDashboard className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Developer Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Welcome back, <span className="text-primary">{developerProfile.developerName}</span>
          </p>
        </div>

        <Dialog open={isAddingApp} onOpenChange={setIsAddingApp}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-5 h-5 mr-2" />
              Upload New App
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload New App</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Input
                    value={newApp.icon}
                    onChange={(e) => setNewApp(prev => ({ ...prev, icon: e.target.value }))}
                    className="text-center text-2xl"
                    placeholder="📱"
                  />
                </div>
                <div className="space-y-2 col-span-3">
                  <Label>App Name *</Label>
                  <Input
                    value={newApp.name}
                    onChange={(e) => setNewApp(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Awesome App"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={newApp.category}
                  onValueChange={(value) => setNewApp(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
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
                  value={newApp.shortDescription}
                  onChange={(e) => setNewApp(prev => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="A brief description"
                />
              </div>

              <div className="space-y-2">
                <Label>Full Description</Label>
                <Textarea
                  value={newApp.description}
                  onChange={(e) => setNewApp(prev => ({ ...prev, description: e.target.value }))}
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Input
                    value={newApp.size}
                    onChange={(e) => setNewApp(prev => ({ ...prev, size: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={handleAddApp} className="w-full bg-primary hover:bg-primary/90">
                Submit App for Review
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
              <Package className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total Apps</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalApps}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Approved</span>
          </div>
          <p className="text-3xl font-bold">{stats.approvedApps}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Eye className="w-5 h-5 text-secondary" />
            </div>
            <span className="text-sm text-muted-foreground">Total Views</span>
          </div>
          <p className="text-3xl font-bold">
            {stats.totalViews >= 1000 ? `${(stats.totalViews / 1000).toFixed(1)}K` : stats.totalViews}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Downloads</span>
          </div>
          <p className="text-3xl font-bold">
            {stats.totalDownloads >= 1000000 
              ? `${(stats.totalDownloads / 1000000).toFixed(1)}M`
              : stats.totalDownloads >= 1000
                ? `${(stats.totalDownloads / 1000).toFixed(1)}K`
                : stats.totalDownloads
            }
          </p>
        </motion.div>
      </div>

      {/* My Apps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">My Apps</h2>
          <span className="text-sm text-muted-foreground">{myApps.length} apps</span>
        </div>

        {myApps.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-xl text-muted-foreground mb-2">No apps yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Upload your first app to get started
            </p>
            <Button onClick={() => setIsAddingApp(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-5 h-5 mr-2" />
              Upload App
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {myApps.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl shrink-0">
                    {app.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{app.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        app.status === 'pending' ? 'status-pending' :
                        app.status === 'approved' ? 'status-approved' : 'status-rejected'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{app.shortDescription}</p>
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
                  <Button variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
