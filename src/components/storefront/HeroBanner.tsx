import { motion } from 'framer-motion';
import { Star, Download, ChevronRight, Sparkles, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import type { AppWithDeveloper } from '@/contexts/AppsContext';

interface HeroBannerProps {
  app: AppWithDeveloper;
}

export function HeroBanner({ app }: HeroBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl"
    >
      {/* Background with gradient and glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-secondary/20" />
      
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute w-96 h-96 -top-48 -right-48 rounded-full bg-primary/30 blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <motion.div
        className="absolute w-64 h-64 bottom-0 left-1/4 rounded-full bg-secondary/20 blur-3xl"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      {/* Content */}
      <div className="relative z-10 p-8 lg:p-12">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Left side - Text content */}
          <div className="flex-1 text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 mb-6"
            >
              <Crown className="w-4 h-4 text-warning" />
              <span className="text-sm font-semibold gradient-text">App of the Day</span>
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl lg:text-6xl font-bold mb-4"
            >
              <span className="gradient-text">{app.name}</span>
            </motion.h1>

            {/* Developer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-muted-foreground mb-4"
            >
              by <span className="text-primary font-medium">{app.developer_name}</span>
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-foreground/80 mb-6 max-w-lg mx-auto lg:mx-0"
            >
              {app.short_description || app.description?.slice(0, 150)}
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center lg:justify-start gap-6 mb-8"
            >
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-warning fill-current" />
                <span className="font-bold text-lg">{app.rating}</span>
                <span className="text-muted-foreground text-sm">rating</span>
              </div>
              <div className="w-px h-6 bg-white/20" />
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                <span className="font-bold text-lg">
                  {app.downloads >= 1000000 
                    ? `${(app.downloads / 1000000).toFixed(1)}M`
                    : `${(app.downloads / 1000).toFixed(0)}K`}
                </span>
                <span className="text-muted-foreground text-sm">downloads</span>
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-center justify-center lg:justify-start gap-4"
            >
              <Link to={`/apps/${app.id}`}>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] transition-shadow px-8"
                >
                  Get App
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to={`/apps/${app.id}`}>
                <Button variant="outline" size="lg" className="border-white/20 hover:bg-white/5">
                  Learn More
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Right side - App preview card */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: -20 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
            className="relative"
          >
            {/* Glow behind card */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-30 blur-3xl transform scale-150" />
            
            <div className="relative admin-glass-card p-6 w-72">
              {/* App icon with glow */}
              <motion.div
                className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-5xl relative"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl" />
                <span className="relative z-10">{app.icon || '📱'}</span>
              </motion.div>

              <h3 className="text-center font-bold text-lg mb-2">{app.name}</h3>
              <p className="text-center text-sm text-muted-foreground mb-4">{app.category}</p>

              {/* Rating stars */}
              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.floor(app.rating)
                        ? 'text-warning fill-current'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90">
                Install
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
