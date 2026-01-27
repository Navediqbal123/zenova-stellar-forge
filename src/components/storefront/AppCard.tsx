import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, Download, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AppWithDeveloper } from '@/contexts/AppsContext';

interface AppCardProps {
  app: AppWithDeveloper;
  index: number;
  variant?: 'default' | 'compact' | 'featured';
}

export function AppCard({ app, index, variant = 'default' }: AppCardProps) {
  const formatDownloads = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Link to={`/apps/${app.id}`}>
          <motion.div
            whileHover={{ scale: 1.02, x: 5 }}
            className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-primary/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
              {app.icon || '📱'}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate group-hover:text-primary transition-colors">{app.name}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="w-3 h-3 text-warning fill-current" />
                <span>{app.rating}</span>
                <span>•</span>
                <span>{formatDownloads(app.downloads)}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </motion.div>
        </Link>
      </motion.div>
    );
  }

  if (variant === 'featured') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
      >
        <Link to={`/apps/${app.id}`}>
          <motion.div
            whileHover={{ scale: 1.03, y: -8 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative overflow-hidden rounded-2xl p-6 h-full",
              "bg-gradient-to-br from-white/[0.08] to-white/[0.02]",
              "border border-white/10 hover:border-primary/40",
              "hover:shadow-[0_0_40px_hsl(var(--primary)/0.25)]",
              "transition-all duration-300 group"
            )}
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              {/* Icon */}
              <motion.div
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-4xl mb-4 relative"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <span className="relative z-10">{app.icon || '📱'}</span>
                <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>

              {/* Info */}
              <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{app.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{app.developer_name}</p>
              <p className="text-sm text-foreground/70 line-clamp-2 mb-4">{app.short_description}</p>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-warning fill-current" />
                  <span className="font-medium">{app.rating}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Download className="w-4 h-4" />
                  <span>{formatDownloads(app.downloads)}</span>
                </div>
              </div>

              {/* Button */}
              <Button size="sm" className="w-full bg-primary/20 hover:bg-primary border border-primary/30 text-primary hover:text-primary-foreground transition-all">
                Get App
              </Button>
            </div>
          </motion.div>
        </Link>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/apps/${app.id}`}>
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className={cn(
            "relative overflow-hidden rounded-xl p-4",
            "bg-white/[0.03] border border-white/10 hover:border-primary/30",
            "hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)]",
            "transition-all duration-300 group"
          )}
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
              {app.icon || '📱'}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                {app.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">{app.category_id}</p>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="flex items-center gap-1 text-warning">
                  <Star className="w-3 h-3 fill-current" />
                  {app.rating}
                </span>
                <span className="text-muted-foreground">{app.size}</span>
              </div>
            </div>

            {/* Get button */}
            <Button 
              size="sm" 
              variant="outline" 
              className="shrink-0 border-primary/30 text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Get
            </Button>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
