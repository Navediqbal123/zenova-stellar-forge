import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
  label?: string;
  className?: string;
  showIcon?: boolean;
}

export function LiveIndicator({ 
  label = 'Live', 
  className,
  showIcon = true 
}: LiveIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
        "bg-success/10 border border-success/30",
        className
      )}
    >
      {/* Pulsing green dot */}
      <span className="relative flex h-2.5 w-2.5">
        <motion.span
          animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.4, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inline-flex h-full w-full rounded-full bg-success"
        />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success shadow-[0_0_8px_hsl(var(--success))]" />
      </span>
      
      {showIcon && (
        <Activity className="w-3.5 h-3.5 text-success" />
      )}
      
      <span className="text-xs font-medium text-success">{label}</span>
    </motion.div>
  );
}

export function DataFreshIndicator({ lastUpdated }: { lastUpdated: Date | null }) {
  if (!lastUpdated) return null;
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 5) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <span className="text-xs text-muted-foreground">
      Updated {formatTime(lastUpdated)}
    </span>
  );
}
