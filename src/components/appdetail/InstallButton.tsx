import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Trash2, Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface InstallButtonProps {
  appId: string;
  appName: string;
}

type AppState = 'idle' | 'downloading' | 'installed' | 'updating';

const INSTALLED_APPS_KEY = 'zenova_installed_apps';

function getInstalledApps(): Record<string, { version: number; url: string }> {
  try {
    return JSON.parse(localStorage.getItem(INSTALLED_APPS_KEY) || '{}');
  } catch {
    return {};
  }
}

function setInstalledApp(appId: string, version: number, url: string) {
  const apps = getInstalledApps();
  apps[appId] = { version, url };
  localStorage.setItem(INSTALLED_APPS_KEY, JSON.stringify(apps));
}

function removeInstalledApp(appId: string) {
  const apps = getInstalledApps();
  delete apps[appId];
  localStorage.setItem(INSTALLED_APPS_KEY, JSON.stringify(apps));
}

export default function InstallButton({ appId, appName }: InstallButtonProps) {
  const { toast } = useToast();
  const [state, setState] = useState<AppState>('idle');
  const [progress, setProgress] = useState(0);
  const cancelledRef = useRef(false);
  const downloadUrlRef = useRef<string | null>(null);
  const dbVersionRef = useRef<number>(1);

  // Check if already installed
  useEffect(() => {
    const installed = getInstalledApps();
    if (installed[appId]) {
      setState('installed');
      downloadUrlRef.current = installed[appId].url;
    }
  }, [appId]);

  // Check for updates
  const [hasUpdate, setHasUpdate] = useState(false);
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const { data } = await supabase
          .from('apps')
          .select('version_code, apk_url, aab_url')
          .eq('id', appId)
          .maybeSingle();

        if (data) {
          const dbVersion = data.version_code ?? 1;
          dbVersionRef.current = dbVersion;
          const installed = getInstalledApps();
          if (installed[appId] && dbVersion > installed[appId].version) {
            setHasUpdate(true);
          }
          downloadUrlRef.current = data.apk_url || data.aab_url || null;
        }
      } catch (err) {
        console.error('Version check error:', err);
      }
    };
    checkUpdate();
  }, [appId]);

  const fetchDownloadUrl = async (): Promise<string | null> => {
    try {
      const { data } = await supabase
        .from('apps')
        .select('apk_url, aab_url, version_code')
        .eq('id', appId)
        .maybeSingle();

      if (data) {
        dbVersionRef.current = data.version_code ?? 1;
        return data.apk_url || data.aab_url || null;
      }
    } catch (err) {
      console.error('Error fetching app URLs:', err);
    }
    return null;
  };

  const runProgressAnimation = useCallback((onComplete: () => void) => {
    cancelledRef.current = false;
    setProgress(0);
    const duration = 2500;
    const start = performance.now();

    const animate = (now: number) => {
      if (cancelledRef.current) return;
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.min(eased * 100, 100));

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };
    requestAnimationFrame(animate);
  }, []);

  const handleInstall = async () => {
    const url = await fetchDownloadUrl();
    if (!url) {
      toast({ title: 'No File Available', description: 'This app does not have a downloadable file yet.', variant: 'destructive' });
      return;
    }
    downloadUrlRef.current = url;
    setState('downloading');
    runProgressAnimation(() => {
      setInstalledApp(appId, dbVersionRef.current, url);
      setHasUpdate(false);
      setState('installed');
      toast({ title: '✅ Installed', description: `${appName} is ready.` });
    });
  };

  const handleUpdate = async () => {
    const url = await fetchDownloadUrl();
    if (!url) {
      toast({ title: 'No File Available', description: 'Update file not found.', variant: 'destructive' });
      return;
    }
    downloadUrlRef.current = url;
    setState('updating');
    runProgressAnimation(() => {
      setInstalledApp(appId, dbVersionRef.current, url);
      setHasUpdate(false);
      setState('installed');
      toast({ title: '✅ Updated', description: `${appName} has been updated.` });
    });
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    cancelledRef.current = true;
    const installed = getInstalledApps();
    setState(installed[appId] ? 'installed' : 'idle');
    setProgress(0);
  };

  const handleUninstall = () => {
    removeInstalledApp(appId);
    setHasUpdate(false);
    setState('idle');
    setProgress(0);
    toast({ title: '🗑️ Uninstalled', description: `${appName} has been removed.` });
  };

  const handleOpen = () => {
    if (downloadUrlRef.current) {
      const link = document.createElement('a');
      link.href = downloadUrlRef.current;
      link.download = appName || 'app';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const CircularProgress = () => (
    <motion.div
      key="progress"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="flex items-center justify-center py-4"
    >
      <button
        onClick={handleCancel}
        className="relative w-16 h-16 flex items-center justify-center group"
      >
        <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
          <motion.circle
            cx="26" cy="26" r={radius} fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
          />
        </svg>
        <X className="w-5 h-5 text-primary group-hover:text-destructive transition-colors relative z-10" />
      </button>
    </motion.div>
  );

  return (
    <motion.div className="w-full" whileTap={{ scale: 0.98 }}>
      <AnimatePresence mode="wait">
        {/* IDLE — Install button */}
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={handleInstall}
              className={cn(
                "w-full py-6 text-base font-semibold rounded-2xl relative overflow-hidden transition-all duration-500",
                "backdrop-blur-xl border border-white/10 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.4)]",
                "bg-primary/90 hover:bg-primary/80"
              )}
            >
              <Download className="w-5 h-5 mr-2" />
              Install
            </Button>
          </motion.div>
        )}

        {/* DOWNLOADING — Circular progress */}
        {state === 'downloading' && <CircularProgress />}

        {/* UPDATING — Circular progress */}
        {state === 'updating' && <CircularProgress />}

        {/* INSTALLED — Uninstall / Open or Update */}
        {state === 'installed' && (
          <motion.div
            key="installed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex items-center gap-3"
          >
            {/* Uninstall */}
            <Button
              onClick={handleUninstall}
              variant="outline"
              className={cn(
                "flex-1 py-6 text-base font-semibold rounded-2xl transition-all duration-300",
                "backdrop-blur-xl border-border/60 hover:border-destructive/50",
                "hover:bg-destructive/10 hover:text-destructive"
              )}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Uninstall
            </Button>

            {/* Divider */}
            <div className="w-px h-10 bg-border/40" />

            {/* Open or Update */}
            {hasUpdate ? (
              <Button
                onClick={handleUpdate}
                className={cn(
                  "flex-1 py-6 text-base font-semibold rounded-2xl relative overflow-hidden transition-all duration-500",
                  "backdrop-blur-xl border border-white/10",
                  "bg-primary/90 hover:bg-primary/80 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.4)]"
                )}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Update
              </Button>
            ) : (
              <Button
                onClick={handleOpen}
                className={cn(
                  "flex-1 py-6 text-base font-semibold rounded-2xl relative overflow-hidden transition-all duration-500",
                  "backdrop-blur-xl border border-white/10",
                  "bg-[hsl(var(--success)/0.9)] hover:bg-[hsl(var(--success)/0.8)] shadow-[0_0_30px_-5px_hsl(var(--success)/0.5)]"
                )}
              >
                <Play className="w-4 h-4 mr-2" />
                Open
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
