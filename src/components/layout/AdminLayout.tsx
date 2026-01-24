import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield,
  LayoutDashboard, 
  Users, 
  Package, 
  Layers, 
  BarChart3,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export type AdminTab = 'dashboard' | 'developers' | 'apps' | 'categories' | 'stats';

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

const adminTabs: { id: AdminTab; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & metrics' },
  { id: 'developers', label: 'Developers', icon: Users, description: 'Manage developers' },
  { id: 'apps', label: 'Apps', icon: Package, description: 'App submissions' },
  { id: 'categories', label: 'Categories', icon: Layers, description: 'Store categories' },
  { id: 'stats', label: 'Stats', icon: BarChart3, description: 'Analytics & reports' },
];

export function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const [hoveredTab, setHoveredTab] = useState<AdminTab | null>(null);

  // Access control - only admin can access
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="admin-glass-card p-8 max-w-md text-center"
        >
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Shield className="w-16 h-16 mx-auto mb-4 text-destructive" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the Admin Panel
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="px-6 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            Go Home
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-[1600px] mx-auto"
    >
      <div className="flex gap-6">
        {/* Admin Sidebar - Nested */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="hidden lg:block w-64 shrink-0 sticky top-8 self-start"
        >
          <div className="admin-glass-card overflow-hidden">
            {/* Sidebar Header */}
            <div className="p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-warning" />
                  </motion.div>
                </div>
                <div>
                  <h2 className="font-bold text-lg">Admin Panel</h2>
                  <p className="text-xs text-muted-foreground">Zenova Store</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-3 space-y-1">
              {adminTabs.map((tab, index) => {
                const isActive = activeTab === tab.id;
                const isHovered = hoveredTab === tab.id;

                return (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onTabChange(tab.id)}
                    onMouseEnter={() => setHoveredTab(tab.id)}
                    onMouseLeave={() => setHoveredTab(null)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group",
                      isActive
                        ? "bg-gradient-to-r from-primary/20 to-secondary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeAdminTab"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}

                    {/* Icon with glow effect */}
                    <div className={cn(
                      "relative p-1.5 rounded-lg transition-all duration-200",
                      isActive ? "bg-primary/20" : "group-hover:bg-muted"
                    )}>
                      <tab.icon className={cn(
                        "w-4 h-4 transition-all duration-200",
                        isActive && "drop-shadow-[0_0_8px_hsl(var(--primary))]"
                      )} />
                    </div>

                    {/* Label */}
                    <div className="flex-1 text-left">
                      <span className="font-medium text-sm">{tab.label}</span>
                    </div>

                    {/* Arrow indicator */}
                    <motion.div
                      animate={{ x: isActive || isHovered ? 0 : -5, opacity: isActive || isHovered ? 1 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  </motion.button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 mt-4 border-t border-white/5">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Super Admin Access
                </p>
                <p className="text-xs text-primary/70 mt-1">
                  navedahmad9012@gmail.com
                </p>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Mobile Tab Bar */}
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
          <div className="admin-glass-card p-2 flex justify-around">
            {adminTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "p-3 rounded-xl transition-all relative",
                    isActive 
                      ? "bg-primary/20 text-primary" 
                      : "text-muted-foreground"
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  {isActive && (
                    <motion.div
                      layoutId="activeMobileAdminTab"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 pb-24 lg:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </motion.div>
  );
}
