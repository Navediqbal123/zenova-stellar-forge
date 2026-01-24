import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Star, Download, ChevronRight, Sparkles, Code } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApps } from '@/contexts/AppsContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { featuredApps, trendingApps, categories } = useApps();
  const { isAuthenticated, developerProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-12"
    >
      {/* Hero Section */}
      <motion.section variants={itemVariants} className="relative">
        <div className="glass-card p-8 lg:p-12 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-96 h-96 -top-48 -right-48 rounded-full bg-primary/10 blur-3xl animate-pulse" />
            <div className="absolute w-64 h-64 bottom-0 left-1/4 rounded-full bg-secondary/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">Featured App of the Day</span>
              </motion.div>

              <h1 className="text-4xl lg:text-6xl font-bold mb-4">
                <span className="gradient-text">Discover</span>
                <br />
                <span className="text-foreground">Amazing Apps</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Explore thousands of premium applications curated for quality and performance. Your next favorite app awaits.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-md mx-auto lg:mx-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for apps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 bg-muted/50 border-muted text-lg rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
                {searchQuery && (
                  <Link to={`/apps?search=${searchQuery}`}>
                    <Button 
                      size="sm" 
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                    >
                      Search
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Featured App Card */}
            {featuredApps[0] && (
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full lg:w-80"
              >
                <div className="glass-card p-6 hover-glow transition-all duration-300">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-3xl animate-float">
                      {featuredApps[0].icon || '📱'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{featuredApps[0].name}</h3>
                      <p className="text-sm text-muted-foreground">{featuredApps[0].developer_name}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{featuredApps[0].short_description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-warning">
                        <Star className="w-4 h-4 fill-current" />
                        {featuredApps[0].rating}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Download className="w-4 h-4" />
                        {(featuredApps[0].downloads / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      Get
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Categories Grid */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Browse Categories</h2>
          <Link to="/categories" className="flex items-center gap-1 text-primary hover:gap-2 transition-all">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(0, 8).map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/categories/${category.id}`}>
                <div className="glass-card p-6 text-center hover-glow transition-all duration-300 group cursor-pointer">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Trending Apps */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Trending Now</h2>
          </div>
          <Link to="/apps?filter=trending" className="flex items-center gap-1 text-primary hover:gap-2 transition-all">
            See More <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingApps.slice(0, 6).map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/apps/${app.id}`}>
                <div className="glass-card p-4 hover-glow transition-all duration-300 group">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                      {app.icon || '📱'}
                    </div>
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
                    <Button size="sm" variant="outline" className="shrink-0 border-primary/30 text-primary hover:bg-primary/10">
                      Get
                    </Button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Become a Developer CTA */}
      {(!isAuthenticated || !developerProfile) && (
        <motion.section variants={itemVariants}>
          <div className="glass-card p-8 lg:p-12 relative overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 animate-shimmer" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 mb-4">
                  <Code className="w-6 h-6 text-primary" />
                  <span className="text-primary font-semibold">For Developers</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Share Your Apps with <span className="gradient-text">Millions</span>
                </h2>
                <p className="text-muted-foreground mb-6 max-w-lg">
                  Join our developer community and publish your applications to reach millions of users worldwide. Get analytics, feedback, and grow your audience.
                </p>
                <Link to={isAuthenticated ? "/developer/register" : "/register"}>
                  <Button size="lg" className="bg-primary hover:bg-primary/90 hover-glow">
                    {isAuthenticated ? "Become a Developer" : "Get Started"}
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="w-full lg:w-auto">
                <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                  <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold gradient-text">10M+</p>
                    <p className="text-sm text-muted-foreground">Downloads</p>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold gradient-text">5K+</p>
                    <p className="text-sm text-muted-foreground">Developers</p>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold gradient-text">15K+</p>
                    <p className="text-sm text-muted-foreground">Apps</p>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold gradient-text">190+</p>
                    <p className="text-sm text-muted-foreground">Countries</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
