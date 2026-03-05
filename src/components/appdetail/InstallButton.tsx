import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle, X } from 'lucide-react';
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

  const handleInstall = async () => {
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

    setState('downloading');
    setProgress(0);

    // Smooth eased progress animation
    const duration = 2200;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.min(eased * 100, 95));
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    try {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = appName || 'app';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setProgress(100);
      setState('done');

      toast({ title: '✅ Download Started', description: `${appName} is downloading...` });

      setTimeout(() => {
        setState('idle');
        setProgress(0);
      }, 3000);
    } catch {
      setState('idle');
      setProgress(0);
      toast({
        title: 'Download Failed',
        description: 'Could not start the download. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div className="w-full" whileTap={{ scale: 0.98 }}>
      <Button
        onClick={handleInstall}
        disabled={state === 'downloading'}
        className={cn(
          "w-full py-6 text-base font-semibold rounded-2xl relative overflow-hidden transition-all duration-500",
          "backdrop-blur-xl border border-white/10 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.4)]",
          state === 'done'
            ? "bg-emerald-600/90 hover:bg-emerald-600/90 shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)]"
            : "bg-primary/90 hover:bg-primary/80"
        )}
      >
        {/* Animated background shimmer */}
        <AnimatePresence>
          {state === 'downloading' && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />
          )}
        </AnimatePresence>

        {/* Progress bar at bottom */}
        {state === 'downloading' && (
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        )}

        <span className="relative z-10 flex items-center justify-center gap-3">
          {state === 'idle' && (
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Install
            </motion.span>
          )}
          {state === 'downloading' && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              {/* Circular progress */}
              <svg width="24" height="24" viewBox="0 0 40 40" className="rotate-[-90deg]">
                <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3" opacity={0.2} />
                <motion.circle
                  cx="20" cy="20" r="18" fill="none"
                  stroke="currentColor" strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transition={{ duration: 0.15 }}
                />
              </svg>
              <span className="tabular-nums">{Math.round(progress)}%</span>
              <button
                onClick={(e) => { e.stopPropagation(); setState('idle'); setProgress(0); }}
                className="ml-1 p-0.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.span>
          )}
          {state === 'done' && (
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Downloaded
            </motion.span>
          )}
        </span>
      </Button>
    </motion.div>
  );
}
