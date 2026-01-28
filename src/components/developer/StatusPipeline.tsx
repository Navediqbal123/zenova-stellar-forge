import { motion } from 'framer-motion';
import { Clock, Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppStatus } from '@/hooks/useAppsQuery';

interface StatusPipelineProps {
  status: AppStatus;
  lastUpdated?: string;
  compact?: boolean;
}

type Stage = {
  id: string;
  label: string;
  icon: typeof Clock;
};

const stages: Stage[] = [
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'reviewing', label: 'Reviewing', icon: Search },
  { id: 'published', label: 'Published', icon: CheckCircle },
];

function getActiveStageIndex(status: AppStatus): number {
  // Map backend status to pipeline stage
  switch (status) {
    case 'pending':
      return 0; // Pending stage active
    case 'approved':
      return 2; // All stages complete (Published)
    case 'rejected':
      return -1; // Special case - shows rejection
    default:
      return 0;
  }
}

export function StatusPipeline({ status, lastUpdated, compact = false }: StatusPipelineProps) {
  const activeIndex = getActiveStageIndex(status);
  const isRejected = status === 'rejected';

  if (isRejected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-4 rounded-xl bg-destructive/10 border border-destructive/30",
          compact && "p-3"
        )}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="p-2 rounded-full bg-destructive/20"
          >
            <XCircle className="w-5 h-5 text-destructive" />
          </motion.div>
          <div>
            <p className="font-medium text-destructive">Application Rejected</p>
            <p className="text-xs text-destructive/70">Check admin feedback for details</p>
          </div>
        </div>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: {new Date(lastUpdated).toLocaleDateString()}
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-3", compact && "space-y-2")}
    >
      {/* Pipeline */}
      <div className="flex items-center gap-1">
        {stages.map((stage, index) => {
          const isCompleted = index < activeIndex || (index === activeIndex && status === 'approved');
          const isCurrent = index === activeIndex && status !== 'approved';
          const isPending = index > activeIndex;

          return (
            <div key={stage.id} className="flex items-center flex-1">
              {/* Stage Node */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                  isCompleted && "bg-success/20 border-success text-success shadow-[0_0_15px_hsl(var(--success)/0.5)]",
                  isCurrent && "bg-warning/20 border-warning text-warning shadow-[0_0_15px_hsl(var(--warning)/0.5)]",
                  isPending && "bg-muted/20 border-muted-foreground/30 text-muted-foreground",
                  compact && "w-8 h-8"
                )}
              >
                {/* Pulse animation for current stage */}
                {isCurrent && (
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border-2 border-warning"
                  />
                )}
                
                <stage.icon className={cn("w-4 h-4", compact && "w-3.5 h-3.5")} />
              </motion.div>

              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div className="flex-1 h-1 mx-2 rounded-full overflow-hidden bg-muted/30">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: isCompleted || (isCurrent && index === 0) ? '100%' : '0%' 
                    }}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                    className={cn(
                      "h-full rounded-full",
                      isCompleted && "bg-success shadow-[0_0_8px_hsl(var(--success)/0.5)]",
                      isCurrent && "bg-gradient-to-r from-warning to-warning/50"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stage Labels */}
      <div className="flex justify-between px-2">
        {stages.map((stage, index) => {
          const isCompleted = index < activeIndex || (index === activeIndex && status === 'approved');
          const isCurrent = index === activeIndex && status !== 'approved';

          return (
            <span
              key={stage.id}
              className={cn(
                "text-xs font-medium transition-colors",
                isCompleted && "text-success",
                isCurrent && "text-warning",
                !isCompleted && !isCurrent && "text-muted-foreground",
                compact && "text-[10px]"
              )}
            >
              {stage.label}
            </span>
          );
        })}
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <p className="text-xs text-muted-foreground text-center">
          Last updated: {new Date(lastUpdated).toLocaleDateString()} at {new Date(lastUpdated).toLocaleTimeString()}
        </p>
      )}
    </motion.div>
  );
}

// Compact inline version for app cards
export function StatusPipelineInline({ status }: { status: AppStatus }) {
  const activeIndex = getActiveStageIndex(status);
  const isRejected = status === 'rejected';

  if (isRejected) {
    return (
      <div className="flex items-center gap-1.5 text-destructive">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Rejected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {stages.map((stage, index) => {
        const isCompleted = index < activeIndex || (index === activeIndex && status === 'approved');
        const isCurrent = index === activeIndex && status !== 'approved';

        return (
          <div key={stage.id} className="flex items-center">
            <motion.div
              className={cn(
                "w-2 h-2 rounded-full",
                isCompleted && "bg-success shadow-[0_0_6px_hsl(var(--success))]",
                isCurrent && "bg-warning shadow-[0_0_6px_hsl(var(--warning))]",
                !isCompleted && !isCurrent && "bg-muted-foreground/30"
              )}
              animate={isCurrent ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            {index < stages.length - 1 && (
              <div
                className={cn(
                  "w-4 h-0.5 mx-0.5",
                  isCompleted ? "bg-success/50" : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
