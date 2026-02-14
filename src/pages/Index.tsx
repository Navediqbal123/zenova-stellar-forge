import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Search, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApps } from '@/contexts/AppsContext';
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

// Bottom bar categories (filtered: no Entertainment, no Productivity)
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tools');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const approvedApps = apps.filter(app => app.status === 'approved');
  const categoryApps = approvedApps.filter(
    app => app.category?.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-4 pb-28"
    >
      {/* Header */}
      <motion.header variants={itemVariants} className="flex items-center gap-3 px-1">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-muted/40 border border-border hover:bg-muted/60 transition-colors"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold gradient-text tracking-tight">Vortex Apps</h1>
      </motion.header>

      {/* Search Bar - separate row */}
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
      </motion.section>

      {/* Category Apps */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold">{selectedCategory}</h2>
          <span className="text-sm text-muted-foreground">({categoryApps.length})</span>
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

      {/* Sticky Bottom Category Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-background/80 backdrop-blur-xl border-t border-border safe-bottom">
          <div className="flex overflow-x-auto gap-1 px-2 py-2 scrollbar-hide">
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
