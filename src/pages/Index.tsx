import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Search, ChevronRight, Code } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApps } from '@/contexts/AppsContext';
import { useAuth } from '@/contexts/AuthContext';
import { HeroBanner } from '@/components/storefront/HeroBanner';
import { AppCard } from '@/components/storefront/AppCard';

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

// Scroll-reveal wrapper component
function ScrollReveal({ children, index = 0 }: { children: React.ReactNode; index?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

export default function Index() {
  const { featuredApps, categories, getAppsByCategory, apps } = useApps();
  const { isAuthenticated, developerProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tools');

  // Get apps for selected category
  const approvedApps = apps.filter(app => app.status === 'approved');
  const categoryApps = approvedApps.filter(
    app => app.category?.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-6 pb-28"
    >
      {/* Hero Section */}
      {featuredApps[0] && (
        <motion.section variants={itemVariants}>
          <HeroBanner app={featuredApps[0]} />
        </motion.section>
      )}

      {/* Search Bar */}
      <motion.section variants={itemVariants} className="-mt-4 relative z-20">
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

      {/* Category Apps Section */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold">{selectedCategory}</h2>
          <span className="text-sm text-muted-foreground">({categoryApps.length} apps)</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {categoryApps.length > 0 ? (
              categoryApps.map((app, index) => (
                <ScrollReveal key={app.id} index={index}>
                  <AppCard app={app} index={index} variant="default" />
                </ScrollReveal>
              ))
            ) : (
              <div className="admin-glass-card p-8 text-center">
                <p className="text-muted-foreground">No apps in this category yet.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.section>

      {/* Become a Developer CTA */}
      {(!isAuthenticated || !developerProfile) && (
        <motion.section variants={itemVariants}>
          <div className="admin-glass-card p-6 relative overflow-hidden">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10"
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              style={{ backgroundSize: '200% 200%' }}
            />
            <div className="relative z-10 flex flex-col items-center gap-4 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
                <Code className="w-4 h-4 text-primary" />
                <span className="text-primary font-semibold text-sm">For Developers</span>
              </div>
              <h2 className="text-2xl font-bold">
                Share Your Apps with <span className="gradient-text">Millions</span>
              </h2>
              <p className="text-muted-foreground text-sm max-w-md">
                Join our developer community and publish your apps to reach millions of users worldwide.
              </p>
              <Link to={isAuthenticated ? "/developer/register" : "/register"}>
                <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80">
                  {isAuthenticated ? "Become a Developer" : "Get Started"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.section>
      )}

      {/* Sticky Bottom Category Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:left-72">
        <div className="bg-background/80 backdrop-blur-xl border-t border-border safe-bottom">
          <div className="flex overflow-x-auto gap-1 px-2 py-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[4.5rem] transition-all duration-200 shrink-0 ${
                  selectedCategory === category.name
                    ? 'bg-primary/15 border border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.3)]'
                    : 'bg-muted/30 border border-transparent hover:bg-muted/50'
                }`}
              >
                <span className="text-xl leading-none">{category.icon}</span>
                <span className={`text-[10px] font-medium leading-tight ${
                  selectedCategory === category.name ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
