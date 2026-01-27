import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Star, Download, ChevronRight, Sparkles, Code } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApps } from '@/contexts/AppsContext';
import { useAuth } from '@/contexts/AuthContext';
import { HeroBanner } from '@/components/storefront/HeroBanner';
import { CategoryCard } from '@/components/storefront/CategoryCard';
import { AppCard } from '@/components/storefront/AppCard';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Index() {
  const { featuredApps, trendingApps, categories } = useApps();
  const { isAuthenticated, developerProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-12"
    >
      {/* Hero Section - App of the Day */}
      {featuredApps[0] && (
        <motion.section variants={itemVariants}>
          <HeroBanner app={featuredApps[0]} />
        </motion.section>
      )}

      {/* Search Bar - Floating */}
      <motion.section variants={itemVariants} className="-mt-6 relative z-20">
        <div className="max-w-2xl mx-auto">
          <div className="admin-glass-card p-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for apps, games, and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-24 py-6 bg-transparent border-0 text-lg focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {searchQuery && (
                <Link to={`/apps?search=${searchQuery}`}>
                  <Button 
                    size="sm" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90"
                  >
                    Search
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Categories Grid - Premium Design */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-secondary/15">
              <Sparkles className="w-5 h-5 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold">Browse Categories</h2>
          </div>
          <Link to="/categories" className="flex items-center gap-1 text-primary hover:gap-2 transition-all group">
            View All 
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(0, 8).map((category, index) => (
            <CategoryCard
              key={category.id}
              id={category.id}
              name={category.name}
              icon={category.icon}
              index={index}
            />
          ))}
        </div>
      </motion.section>

      {/* Trending Apps - Premium Cards */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/15">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Trending Now</h2>
          </div>
          <Link to="/apps?filter=trending" className="flex items-center gap-1 text-primary hover:gap-2 transition-all group">
            See More 
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingApps.slice(0, 6).map((app, index) => (
            <AppCard
              key={app.id}
              app={app}
              index={index}
              variant="featured"
            />
          ))}
        </div>
      </motion.section>

      {/* Top Charts Section */}
      <motion.section variants={itemVariants}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Free Apps */}
          <div className="admin-glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-success/15">
                <Download className="w-5 h-5 text-success" />
              </div>
              <h3 className="text-xl font-bold">Top Free Apps</h3>
            </div>
            <div className="space-y-2">
              {trendingApps.slice(0, 5).map((app, index) => (
                <div key={app.id} className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-muted-foreground w-8">{index + 1}</span>
                  <AppCard app={app} index={index} variant="compact" />
                </div>
              ))}
            </div>
          </div>

          {/* Top Rated Apps */}
          <div className="admin-glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-warning/15">
                <Star className="w-5 h-5 text-warning" />
              </div>
              <h3 className="text-xl font-bold">Top Rated</h3>
            </div>
            <div className="space-y-2">
              {[...trendingApps].sort((a, b) => b.rating - a.rating).slice(0, 5).map((app, index) => (
                <div key={app.id} className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-muted-foreground w-8">{index + 1}</span>
                  <AppCard app={app} index={index} variant="compact" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Become a Developer CTA - Enhanced */}
      {(!isAuthenticated || !developerProfile) && (
        <motion.section variants={itemVariants}>
          <div className="admin-glass-card p-8 lg:p-12 relative overflow-hidden">
            {/* Animated gradient background */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              style={{ backgroundSize: '200% 200%' }}
            />

            {/* Floating orbs */}
            <motion.div
              className="absolute w-64 h-64 -top-32 -left-32 rounded-full bg-primary/20 blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            <motion.div
              className="absolute w-64 h-64 -bottom-32 -right-32 rounded-full bg-secondary/20 blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 5, repeat: Infinity, delay: 2 }}
            />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
                  <Code className="w-5 h-5 text-primary" />
                  <span className="text-primary font-semibold">For Developers</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Share Your Apps with <span className="gradient-text">Millions</span>
                </h2>
                <p className="text-muted-foreground mb-6 max-w-lg">
                  Join our developer community and publish your applications to reach millions of users worldwide. Get analytics, feedback, and grow your audience.
                </p>
                <Link to={isAuthenticated ? "/developer/register" : "/register"}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]">
                      {isAuthenticated ? "Become a Developer" : "Get Started"}
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </Link>
              </div>

              <div className="w-full lg:w-auto">
                <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                  {[
                    { value: '10M+', label: 'Downloads' },
                    { value: '5K+', label: 'Developers' },
                    { value: '15K+', label: 'Apps' },
                    { value: '190+', label: 'Countries' },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -4 }}
                      className="admin-glass-card p-4 text-center"
                    >
                      <p className="text-3xl font-bold gradient-text">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
