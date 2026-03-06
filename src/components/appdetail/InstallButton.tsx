import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface InstallButtonProps {
  appId: string;
  appName: string;
}

export default function InstallButton({ appId, appName }: InstallButtonProps) {
  const { toast } = useToast();
  const [state, setState] = useState<'idle' | 'downloading' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const cancelledRef = useRef(false);
  const downloadUrlRef = useRef<string | null>(null);

  const handleInstall = async () => {
    cancelledRef.current = false;
    let downloadUrl: string | null = null;

    try {
      const { data } = await supabase
        .from('apps')
        .select('apk_url, aab_url')
        .eq('id', appId)
        .maybeSingle();

      if (data) {
        downloadUrl = data.apk_url || data.aab_url;
      }
    } catch (err) {
      console.error('Error fetching app URLs:', err);
    }

    if (!downloadUrl) {
      toast({
        title: 'No File Available',
        description: 'This app does not have a downloadable file yet.',
        variant: 'destructive',
      });
      return;
    }

    downloadUrlRef.current = downloadUrl;
    setState('downloading');
    setProgress(0);

    // Simulate smooth download progress
    const duration = 2500;
    const start = performance.now();

    const animate = (now: number) => {
      if (cancelledRef.current) return;
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const p = Math.min(eased * 100, 100);
      setProgress(p);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setState('done');
        toast({ title: '✅ Download Complete', description: `${appName} is ready.` });
      }
    };
    requestAnimationFrame(animate);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    cancelledRef.current = true;
    setState('idle');
    setProgress(0);
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
    setState('idle');
    setProgress(0);
  };

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div className="w-full" whileTap={{ scale: 0.98 }}>
      <AnimatePresence mode="wait">
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

        {state === 'downloading' && (
          <motion.div
            key="downloading"
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
              {/* Background track */}
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
              {/* Cancel icon inside */}
              <X className="w-5 h-5 text-primary group-hover:text-destructive transition-colors relative z-10" />
            </button>
          </motion.div>
        )}

        {state === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Button
              onClick={handleOpen}
              className={cn(
                "w-full py-6 text-base font-semibold rounded-2xl relative overflow-hidden transition-all duration-500",
                "backdrop-blur-xl border border-white/10",
                "bg-emerald-600/90 hover:bg-emerald-600/80 shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)]"
              )}
            >
              Open
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}