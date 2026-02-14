import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Search, Menu, X, Home, Grid3X3, Layers, Code, LayoutDashboard, Shield, LogIn, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApps } from '@/contexts/AppsContext';
import { useAuth } from '@/contexts/AuthContext';
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

const bottomCategories = [
  { id: 'games', name: 'Games', icon: '🎮' },
  { id: 'social', name: 'Social', icon: '💬' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'finance', name: 'Finance', icon: '💰' },
  { id: 'health', name: 'Health & Fitness', icon: '💪' },
  { id: 'tools', name: 'Tools', icon: '🔧' },
];

export default function Index() {
  const { apps } = useApps();
  const { isAuthenticated, isAdmin, developerProfile, isDeveloperApproved } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const approvedApps = apps.filter(app => app.status === 'approved');
  const displayApps = selectedCategory
    ? approvedApps.filter(app => app.category?.toLowerCase() === selectedCategory.toLowerCase())
    : approvedApps;

  const displayTitle = selectedCategory || 'All Apps';

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-4 pb-28"
      >
        {/* Header */}
        <motion.header variants={itemVariants} className="flex items-center gap-3 px-1">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg bg-muted/40 border border-border hover:bg-muted/60 transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold gradient-text tracking-tight">Vortex Apps</h1>
        </motion.header>

        {/* Search Bar */}
        <motion.section variants={itemVariants}>
          <div className="admin-glass-card p-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search apps, games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-24 py-5 bg-transparent border-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {searchQuery && (
                <Link to={`/apps?search=${searchQuery}`}>
                  <Button size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90">
                    Search
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.section>

        {/* Apps List */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold">{displayTitle}</h2>
            <span className="text-sm text-muted-foreground">({displayApps.length})</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={displayTitle}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {displayApps.length > 0 ? (
                displayApps.map((app, index) => (
                  <ScrollReveal key={app.id} index={index}>
                    <AppCard app={app} index={index} variant="default" />
                  </ScrollReveal>
                ))
              ) : (
                <div className="admin-glass-card p-8 text-center">
                  <p className="text-muted-foreground">No apps available yet.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.section>

        {/* Sticky Bottom Category Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-background/80 backdrop-blur-xl border-t border-border safe-bottom">
            <div className="flex overflow-x-auto gap-1 px-2 py-2 scrollbar-hide">
              {/* All button */}
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[4.5rem] transition-all duration-200 shrink-0 ${
                  selectedCategory === null
                    ? 'bg-primary/15 border border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.3)]'
                    : 'bg-muted/30 border border-transparent hover:bg-muted/50'
                }`}
              >
                <span className="text-xl leading-none">🏠</span>
                <span className={`text-[10px] font-medium leading-tight ${
                  selectedCategory === null ? 'text-primary' : 'text-muted-foreground'
                }`}>All</span>
              </button>
              {bottomCategories.map((category) => (
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
                  }`}>{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[60]"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-72 z-[70] bg-card border-r border-border flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-lg font-bold gradient-text">Vortex Apps</h2>
                <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Drawer Nav */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {[
                  { name: 'Home', path: '/', icon: Home, show: true },
                  { name: 'Apps', path: '/apps', icon: Grid3X3, show: true },
                  { name: 'Categories', path: '/categories', icon: Layers, show: true },
                  { name: 'Become a Developer', path: isAuthenticated ? '/developer/register' : '/register', icon: Code, show: !developerProfile },
                  { name: 'Developer Dashboard', path: '/developer/dashboard', icon: LayoutDashboard, show: !!developerProfile },
                  { name: 'Admin Panel', path: '/admin', icon: Shield, show: isAdmin },
                ].filter(item => item.show).map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-muted/50 hover:text-primary transition-colors"
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </Link>
                ))}
              </nav>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-border space-y-2">
                {!isAuthenticated ? (
                  <>
                    <Link to="/login" onClick={() => setDrawerOpen(false)}>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <LogIn className="w-4 h-4" /> Sign In
                      </Button>
                    </Link>
                    <Link to="/register" onClick={() => setDrawerOpen(false)}>
                      <Button className="w-full justify-start gap-2 bg-primary hover:bg-primary/90">
                        <UserPlus className="w-4 h-4" /> Get Started
                      </Button>
                    </Link>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">Logged in</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
