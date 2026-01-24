import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

type StatusType = 'pending' | 'approved' | 'rejected';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-warning/10 text-warning border-warning/30',
    glowColor: 'shadow-[0_0_12px_hsla(35,100%,55%,0.4)]',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    className: 'bg-success/10 text-success border-success/30',
    glowColor: 'shadow-[0_0_12px_hsla(145,100%,50%,0.4)]',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/30',
    glowColor: 'shadow-[0_0_12px_hsla(0,100%,60%,0.4)]',
  },
};

const sizeConfig = {
  sm: {
    padding: 'px-2 py-0.5',
    text: 'text-xs',
    iconSize: 'w-3 h-3',
  },
  md: {
    padding: 'px-3 py-1',
    text: 'text-sm',
    iconSize: 'w-4 h-4',
  },
  lg: {
    padding: 'px-4 py-1.5',
    text: 'text-base',
    iconSize: 'w-5 h-5',
  },
};

export function StatusBadge({ 
  status, 
  size = 'sm', 
  showIcon = false,
  className 
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium capitalize",
        config.className,
        config.glowColor,
        sizeStyles.padding,
        sizeStyles.text,
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(sizeStyles.iconSize, "shrink-0")} />
      )}
      <span>{config.label}</span>
    </motion.span>
  );
}
