import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  Bell,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Home,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export type DeveloperTab = 'dashboard' | 'my-apps' | 'analytics' | 'notifications' | 'settings';

interface DeveloperSidebarProps {
  activeTab: DeveloperTab;
  onTabChange: (tab: DeveloperTab) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function DeveloperSidebar({ activeTab, onTabChange, mobileOpen = false, onMobileClose }: DeveloperSidebarProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navItems: { icon: React.ElementType; label: string; tab: DeveloperTab }[] = [
    { icon: LayoutDashboard, label: 'Dashboard', tab: 'dashboard' },
    { icon: Package, label: 'My Apps', tab: 'my-apps' },
    { icon: BarChart3, label: 'Analytics', tab: 'analytics' },
    { icon: Bell, label: 'Notifications', tab: 'notifications' },
    { icon: Settings, label: 'Settings', tab: 'settings' },
  ];

  const handleNavClick = (tab: DeveloperTab) => {
    onTabChange(tab);
    onMobileClose?.();
  };

  const sidebarContent = (
    <div className="relative z-10 h-full flex flex-col p-4">
      {/* Logo */}
      <div className="flex items-center justify-between mb-8 px-2">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Developer</h1>
              <p className="text-xs text-muted-foreground">Console</p>
            </div>
          </motion.div>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        )}

        {/* Mobile Close Button */}
        <button
          onClick={onMobileClose}
          className="p-1.5 rounded-lg hover:bg-muted lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Collapse Toggle - desktop only */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-muted border border-white/10 hover:bg-primary/20 z-50 hidden lg:flex"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </Button>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item, index) => {
          const isActive = activeTab === item.tab;
          return (
            <motion.div
              key={item.tab}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                onClick={() => handleNavClick(item.tab)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-all",
                  isActive
                    ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]"
                    : "group-hover:text-primary"
                )} />
                {!collapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                  />
                )}
              </button>
            </motion.div>
          );
        })}
      </nav>

      {/* Secondary Navigation */}
      <div className="border-t border-white/10 pt-4 mt-4 space-y-1">
        <button
          onClick={() => { navigate('/'); onMobileClose?.(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-muted-foreground hover:text-foreground hover:bg-white/5"
        >
          <Home className="w-5 h-5" />
          {!collapsed && <span className="text-sm">Home</span>}
        </button>
        <button
          onClick={() => { onMobileClose?.(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-muted-foreground hover:text-foreground hover:bg-white/5"
        >
          <HelpCircle className="w-5 h-5" />
          {!collapsed && <span className="text-sm">Help Center</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={cn(
          "fixed left-0 top-0 h-screen z-40 transition-all duration-300 hidden lg:block",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-sidebar via-sidebar to-background/95 backdrop-blur-xl border-r border-white/10" />
        <div className="absolute top-1/4 -right-20 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-10 w-20 h-20 rounded-full bg-secondary/10 blur-2xl pointer-events-none" />
        {sidebarContent}
      </motion.aside>

      {/* Mobile Overlay Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-screen w-72 z-50 lg:hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-sidebar via-sidebar to-background/95 backdrop-blur-xl border-r border-white/10" />
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}