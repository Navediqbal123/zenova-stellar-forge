import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Download, Flag, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApps } from '@/contexts/AppsContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AppDetail() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const { getAppById, categories } = useApps();
  const { toast } = useToast();

  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'done'>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);

  const app = appId ? getAppById(appId) : undefined;

  if (!app) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 max-w-md text-center"
        >
          <p className="text-xl text-muted-foreground mb-4">App not found</p>
          <Button onClick={() => navigate('/apps')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Apps
          </Button>
        </motion.div>
      </div>
    );
  }

  const category = categories.find(c => c.id === app.category || c.name === app.category);

  const formatDownloads = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M+`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K+`;
    return num.toString();
  };

  const handleInstall = async () => {
    // Priority: apk_url first, then aab_url fallback
    const downloadUrl = app.apk_url || (app as any).aab_url;

    if (!downloadUrl) {
      toast({
        title: 'No File Available',
        description: 'This app does not have a downloadable file yet.',
        variant: 'destructive',
      });
      return;
    }

    setDownloadState('downloading');
    setDownloadProgress(0);

    // Animate progress
    const duration = 2000;
    const interval = 30;
    const steps = duration / interval;
    let step = 0;

    const progressTimer = setInterval(() => {
      step++;
      const progress = Math.min((step / steps) * 100, 95);
      setDownloadProgress(progress);
      if (step >= steps) clearInterval(progressTimer);
    }, interval);

    try {
      // Trigger actual download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = app.name || 'app';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Complete progress
      clearInterval(progressTimer);
      setDownloadProgress(100);
      setDownloadState('done');

      toast({
        title: '✅ Download Started',
        description: `${app.name} is downloading...`,
      });

      setTimeout(() => {
        setDownloadState('idle');
        setDownloadProgress(0);
      }, 3000);
    } catch {
      clearInterval(progressTimer);
      setDownloadState('idle');
      setDownloadProgress(0);
      toast({
        title: 'Download Failed',
        description: 'Could not start the download. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-6 pb-8"
    >
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors p-2 -ml-2 rounded-lg hover:bg-muted/50">
        <ArrowLeft className="w-5 h-5" />
      </Link>

      {/* Top Section - Icon, Name, Developer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-start gap-5"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-4xl shrink-0 overflow-hidden">
          {app.icon_url && app.icon_url.startsWith('http') ? (
            <img src={app.icon_url} alt={app.name} className="w-full h-full object-cover rounded-2xl" />
          ) : (app.icon || '📱')}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold mb-0.5">{app.name}</h1>
          <p className="text-primary text-sm font-medium mb-1">{app.developer_name}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {app.contains_ads && <span>Contains ads</span>}
            {app.in_app_purchases && <span>• In-app purchases</span>}
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-around py-3 border-y border-border"
      >
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center">
            <span className="text-sm font-bold">{app.rating}</span>
            <Star className="w-3.5 h-3.5 text-warning fill-current" />
          </div>
          <p className="text-[10px] text-muted-foreground">{app.review_count.toLocaleString()} reviews</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <p className="text-sm font-bold">{formatDownloads(app.downloads)}</p>
          <p className="text-[10px] text-muted-foreground">Downloads</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <p className="text-sm font-bold">{app.size || 'N/A'}</p>
          <p className="text-[10px] text-muted-foreground">Size</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <p className="text-sm font-bold">4+</p>
          <p className="text-[10px] text-muted-foreground">Rated</p>
        </div>
      </motion.div>

      {/* Install Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex gap-3"
      >
        <motion.div className="flex-1 relative" whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleInstall}
            disabled={downloadState === 'downloading'}
            className={cn(
              "w-full py-6 text-base font-semibold rounded-xl relative overflow-hidden transition-all duration-500",
              downloadState === 'done'
                ? "bg-emerald-600 hover:bg-emerald-600"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {/* Progress bar overlay */}
            <AnimatePresence>
              {downloadState === 'downloading' && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: downloadProgress / 100 }}
                  className="absolute inset-0 bg-white/10 origin-left"
                  transition={{ duration: 0.1 }}
                />
              )}
            </AnimatePresence>

            <span className="relative z-10 flex items-center justify-center gap-2">
              {downloadState === 'idle' && (
                <>
                  <Download className="w-5 h-5" />
                  Install
                </>
              )}
              {downloadState === 'downloading' && (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Downloading... {Math.round(downloadProgress)}%
                </>
              )}
              {downloadState === 'done' && (
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Downloaded
                </motion.span>
              )}
            </span>
          </Button>
        </motion.div>
      </motion.div>

      {/* Screenshots */}
      {app.screenshots && (app.screenshots as string[]).length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-semibold mb-3">Screenshots</h3>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {(app.screenshots as string[]).map((url, i) => (
              <img key={i} src={url} alt={`Screenshot ${i + 1}`} className="h-48 rounded-xl border border-border shrink-0 object-cover" />
            ))}
          </div>
        </motion.div>
      )}

      {/* About this app */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">About this app</h2>
          <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {app.description || app.short_description}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link to={`/categories/${app.category}`}>
            <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium hover:bg-muted/80 transition-colors">
              {category?.icon} {category?.name || app.category}
            </span>
          </Link>
        </div>
      </motion.div>

      {/* Report */}
      <div className="flex justify-center pb-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag className="w-4 h-4 mr-2" />
          Flag as inappropriate
        </Button>
      </div>
    </motion.div>
  );
}
