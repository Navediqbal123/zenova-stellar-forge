import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Search, Menu, X, Home, Code, LayoutDashboard, Shield, LogIn, UserPlus, LogOut, Gamepad2, AppWindow, Star, Download } from 'lucide-react';
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

// Hero carousel promo data
const heroSlides = [
  { title: 'Discover Amazing Apps', subtitle: 'Explore thousands of apps curated just for you', gradient: 'from-primary/30 via-card to-secondary/20', emoji: '🚀' },
  { title: 'Top Games This Week', subtitle: 'Play the most popular mobile games on EloraX', gradient: 'from-secondary/30 via-card to-primary/20', emoji: '🎮' },
  { title: 'New & Updated', subtitle: 'Fresh apps and updates landing every day', gradient: 'from-success/20 via-card to-primary/20', emoji: '✨' },
];

function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent(c => (c + 1) % heroSlides.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const slide = heroSlides[current];

  return (
    <div className="relative overflow-hidden rounded-2xl h-44">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.4 }}
          className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} flex items-center px-6`}
        >
          <div className="flex-1">
            <p className="text-3xl mb-1">{slide.emoji}</p>
            <h2 className="text-xl font-bold mb-1">{slide.title}</h2>
            <p className="text-sm text-muted-foreground">{slide.subtitle}</p>
          </div>
        </motion.div>
      </AnimatePresence>
      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {heroSlides.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-primary w-5' : 'bg-muted-foreground/40'}`} />
        ))}
      </div>
    </div>
  );
}

function HorizontalAppRow({ title, apps }: { title: string; apps: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  if (apps.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold">{title}</h3>
        <Link to="/apps" className="text-xs text-primary font-medium">See all</Link>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {apps.slice(0, 10).map((app, index) => (
          <Link key={app.id} to={`/apps/${app.id}`} className="shrink-0 w-28">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-3xl mb-2 group-hover:scale-110 transition-transform overflow-hidden">
                {app.icon_url && app.icon_url.startsWith('http') ? (
                  <img src={app.icon_url} alt={app.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (app.icon || '📱')}
              </div>
              <p className="text-xs font-medium truncate w-full group-hover:text-primary transition-colors">{app.name}</p>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Star className="w-2.5 h-2.5 text-warning fill-current" />
                <span>{app.rating}</span>
                <span>•</span>
                <span>{app.size || 'N/A'}</span>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Index() {
  const { apps } = useApps();
  const { isAuthenticated, isAdmin, developerProfile, isDeveloperApproved } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<'games' | 'apps' | 'search'>('apps');

  const approvedApps = apps.filter(app => app.status === 'approved');

  // Sections
  const suggestedApps = approvedApps.slice(0, 10);
  const newApps = [...approvedApps].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);
  const trendingApps = [...approvedApps].sort((a, b) => b.downloads - a.downloads).slice(0, 10);
  const gameApps = approvedApps.filter(a => (a.category || '').toLowerCase() === 'games');
  const nonGameApps = approvedApps.filter(a => (a.category || '').toLowerCase() !== 'games');

  const displayApps = bottomTab === 'games' ? gameApps : bottomTab === 'apps' ? nonGameApps : approvedApps;
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-5 pb-24"
      >
        {/* Header */}
        <motion.header variants={itemVariants} className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-lg bg-muted/40 border border-border hover:bg-muted/60 transition-colors"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-xl font-bold gradient-text tracking-tight">EloraX</h1>
          </div>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-lg bg-muted/40 border border-border hover:bg-muted/60 transition-colors"
          >
            <Search className="w-5 h-5 text-foreground" />
          </button>
        </motion.header>

        {/* Search Bar (toggled) */}
        <AnimatePresence>
          {showSearch && (
            <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="admin-glass-card p-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search apps, games..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-24 py-5 bg-transparent border-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                    autoFocus
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
          )}
        </AnimatePresence>

        {/* Hero Carousel */}
        <motion.section variants={itemVariants}>
          <HeroCarousel />
        </motion.section>

        {/* Horizontal Sections */}
        <motion.section variants={itemVariants} className="space-y-6">
          <HorizontalAppRow title="Suggested for You" apps={suggestedApps} />
          <HorizontalAppRow title="New & Updated" apps={newApps} />
          <HorizontalAppRow title="Trending" apps={trendingApps} />
        </motion.section>

        {/* Main app list based on bottom tab */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold">
              {bottomTab === 'games' ? 'Games' : bottomTab === 'apps' ? 'Apps' : 'All Apps'}
            </h2>
            <span className="text-sm text-muted-foreground">({displayApps.length})</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={bottomTab}
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

        {/* Sticky Bottom Navigation - Games / Apps / Search */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-background/80 backdrop-blur-xl border-t border-border safe-bottom">
            <div className="flex justify-around items-center px-4 py-2">
              <button
                onClick={() => { setBottomTab('games'); setShowSearch(false); }}
                className={`flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all duration-200 ${
                  bottomTab === 'games'
                    ? 'bg-primary/15 border border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.3)]'
                    : 'border border-transparent hover:bg-muted/50'
                }`}
              >
                <Gamepad2 className={`w-5 h-5 ${bottomTab === 'games' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] font-medium ${bottomTab === 'games' ? 'text-primary' : 'text-muted-foreground'}`}>Games</span>
              </button>
              <button
                onClick={() => { setBottomTab('apps'); setShowSearch(false); }}
                className={`flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all duration-200 ${
                  bottomTab === 'apps'
                    ? 'bg-primary/15 border border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.3)]'
                    : 'border border-transparent hover:bg-muted/50'
                }`}
              >
                <AppWindow className={`w-5 h-5 ${bottomTab === 'apps' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] font-medium ${bottomTab === 'apps' ? 'text-primary' : 'text-muted-foreground'}`}>Apps</span>
              </button>
              <button
                onClick={() => { setShowSearch(true); }}
                className="flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all duration-200 border border-transparent hover:bg-muted/50"
              >
                <Search className="w-5 h-5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Search</span>
              </button>
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
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-lg font-bold gradient-text">EloraX</h2>
                <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {[
                  { name: 'Home', path: '/', icon: Home, show: true },
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
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => {
                      localStorage.removeItem('token');
                      window.location.href = '/login';
                    }}
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
