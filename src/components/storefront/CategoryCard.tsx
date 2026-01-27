import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  id: string;
  name: string;
  icon: string;
  index: number;
  appCount?: number;
}

export function CategoryCard({ id, name, icon, index, appCount }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
    >
      <Link to={`/categories/${id}`}>
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300",
            "bg-gradient-to-br from-white/[0.08] to-white/[0.02]",
            "border border-white/10 hover:border-primary/40",
            "hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)]",
            "group"
          )}
        >
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Content */}
          <div className="relative z-10 text-center">
            {/* Icon with glow */}
            <motion.div
              className="text-5xl mb-4 relative inline-block"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <span className="relative z-10">{icon}</span>
              <div className="absolute inset-0 blur-xl opacity-40 group-hover:opacity-70 transition-opacity">
                {icon}
              </div>
            </motion.div>

            {/* Name */}
            <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
              {name}
            </h3>

            {/* App count */}
            {appCount !== undefined && (
              <p className="text-xs text-muted-foreground">
                {appCount} apps
              </p>
            )}

            {/* Arrow indicator */}
            <motion.div
              className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
              initial={false}
            >
              <ChevronRight className="w-5 h-5 text-primary" />
            </motion.div>
          </div>

          {/* Decorative corner accent */}
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      </Link>
    </motion.div>
  );
}
