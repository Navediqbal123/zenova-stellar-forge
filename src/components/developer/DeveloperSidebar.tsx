import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Upload,
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

interface DeveloperSidebarProps {
  onUploadClick: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function DeveloperSidebar({ onUploadClick, mobileOpen = false, onMobileClose }: DeveloperSidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/developer/dashboard' },
    { icon: Package, label: 'My Apps', path: '/developer/apps' },
    { icon: BarChart3, label: 'Analytics', path: '/developer/analytics' },
    { icon: Bell, label: 'Notifications', path: '/developer/notifications' },
    { icon: Settings, label: 'Settings', path: '/developer/settings' },
  ];

  const secondaryItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: HelpCircle, label: 'Help Center', path: '/help' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = () => {
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

      {/* Upload Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          onUploadClick();
          onMobileClose?.();
        }}
        className={cn(
          "relative overflow-hidden mb-6 rounded-xl p-3 font-semibold transition-all",
          "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
          "hover:shadow-[0_0_25px_hsl(var(--primary)/0.5)]",
          collapsed ? "px-2" : ""
        )}
      >
        <div className="flex items-center justify-center gap-2">
          <Upload className="w-5 h-5" />
          {!collapsed && <span>Upload App</span>}
        </div>
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      </motion.button>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <NavLink
              to={item.path}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                isActive(item.path)
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-all",
                isActive(item.path)
                  ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]"
                  : "group-hover:text-primary"
              )} />
              {!collapsed && (
                <span className="font-medium">{item.label}</span>
              )}
              {isActive(item.path) && !collapsed && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* Secondary Navigation */}
      <div className="border-t border-white/10 pt-4 mt-4 space-y-1">
        {secondaryItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
              "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            <item.icon className="w-5 h-5" />
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </NavLink>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar - hidden on mobile */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={cn(
          "fixed left-0 top-0 h-screen z-40 transition-all duration-300 hidden lg:block",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Glassmorphism Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-sidebar via-sidebar to-background/95 backdrop-blur-xl border-r border-white/10" />
        
        {/* Decorative glow */}
        <div className="absolute top-1/4 -right-20 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-10 w-20 h-20 rounded-full bg-secondary/10 blur-2xl pointer-events-none" />

        {sidebarContent}
      </motion.aside>

      {/* Mobile Overlay Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
              onClick={onMobileClose}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-screen w-72 z-50 lg:hidden"
            >
              {/* Glassmorphism Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-sidebar via-sidebar to-background/95 backdrop-blur-xl border-r border-white/10" />
              
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
