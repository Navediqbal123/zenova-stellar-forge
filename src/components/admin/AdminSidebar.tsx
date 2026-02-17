import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  UserCheck,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Zap,
  Home,
  Grid3X3,
  Layers,
  Brain,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { AdminTab } from '@/components/layout/AdminLayout';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onOpenChatbot?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  type: 'tab' | 'link' | 'action';
  tab?: AdminTab;
  path?: string;
  badge?: string;
  isSpecial?: boolean;
}

const adminNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, type: 'tab', tab: 'dashboard' },
  { id: 'developers', label: 'Developers', icon: UserCheck, type: 'tab', tab: 'developers', badge: 'Live' },
  { id: 'apps', label: 'Apps', icon: Box, type: 'tab', tab: 'apps' },
  { id: 'categories', label: 'Categories', icon: Layers, type: 'tab', tab: 'categories' },
  { id: 'ai-insights', label: 'AI Insights', icon: Brain, type: 'tab', tab: 'ai-insights', isSpecial: true },
  { id: 'stats', label: 'Statistics', icon: BarChart3, type: 'tab', tab: 'stats' },
  { id: 'security', label: 'Security Logs', icon: ShieldCheck, type: 'tab', tab: 'stats' },
  { id: 'support', label: 'Support Bot', icon: MessageCircle, type: 'action' },
];

const generalNavItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, type: 'link', path: '/' },
  { id: 'browse-apps', label: 'Browse Apps', icon: Grid3X3, type: 'link', path: '/apps' },
  { id: 'browse-categories', label: 'Categories', icon: Layers, type: 'link', path: '/categories' },
];

export function AdminSidebar({ activeTab, onTabChange, onOpenChatbot }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    logout();
    navigate('/login');
  };

  const handleItemClick = (item: NavItem) => {
    if (item.type === 'action' && item.id === 'support') {
      onOpenChatbot?.();
    } else if (item.type === 'link' && item.path) {
      navigate(item.path);
    } else if (item.type === 'tab' && item.tab) {
      onTabChange(item.tab);
    }
    setMobileOpen(false);
  };

  const renderNavItem = (item: NavItem, index: number) => {
    const isActive = item.type === 'tab' && activeTab === item.tab;
    const isHovered = hoveredItem === item.id;

    const NavButton = (
      <motion.button
        key={item.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.04 }}
        onClick={() => handleItemClick(item)}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "w-full flex items-center gap-3 rounded-xl transition-all duration-200 relative group",
          isCollapsed ? "p-3 justify-center" : "px-4 py-2.5",
          isActive
            ? "bg-gradient-to-r from-blue-600/20 to-blue-500/10 text-blue-400"
            : "text-slate-400 hover:text-white hover:bg-slate-800/50",
          item.isSpecial && !isActive && "text-purple-400 hover:text-purple-300"
        )}
      >
        {isActive && (
          <motion.div
            layoutId="adminActiveTab"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full bg-blue-500"
            style={{ boxShadow: '0 0 10px hsl(217 91% 60% / 0.5)' }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}

        <div className={cn(
          "relative p-1.5 rounded-lg transition-all duration-200",
          isActive ? "bg-blue-500/20" : "group-hover:bg-slate-700/50",
          item.isSpecial && !isActive && "bg-purple-500/10"
        )}>
          <item.icon className={cn(
            "w-4.5 h-4.5 transition-all duration-200",
            isActive && "drop-shadow-[0_0_8px_hsl(217_91%_60%)]",
            item.isSpecial && !isActive && "drop-shadow-[0_0_6px_hsl(280_100%_60%)]"
          )} />
        </div>

        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex-1 text-left overflow-hidden"
            >
              <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {item.badge && !isCollapsed && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30"
          >
            {item.badge}
          </motion.span>
        )}

        {!isCollapsed && (
          <motion.div
            animate={{ x: isActive || isHovered ? 0 : -5, opacity: isActive || isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.div>
        )}
      </motion.button>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.id} delayDuration={0}>
          <TooltipTrigger asChild>{NavButton}</TooltipTrigger>
          <TooltipContent side="right" className="bg-slate-900 border-slate-700">
            <p className="font-medium">{item.label}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return NavButton;
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className={cn("relative p-4 border-b border-slate-800/50 bg-gradient-to-r from-primary/5 to-secondary/5")}>
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div key="expanded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
              <motion.div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20" whileHover={{ scale: 1.05 }}>
                <Zap className="w-5 h-5 text-primary" />
              </motion.div>
              <div>
                <h2 className="font-bold text-base bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Admin Panel</h2>
                <p className="text-[11px] text-slate-500">Vortex Apps</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20">
                <Zap className="w-5 h-5 text-primary" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Admin Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {!isCollapsed && (
          <p className="text-[10px] uppercase tracking-wider text-slate-600 px-4 mb-2 font-semibold">Admin</p>
        )}
        {adminNavItems.map((item, i) => renderNavItem(item, i))}

        <div className="my-3 border-t border-slate-800/50" />

        {!isCollapsed && (
          <p className="text-[10px] uppercase tracking-wider text-slate-600 px-4 mb-2 font-semibold">Navigate</p>
        )}
        {generalNavItems.map((item, i) => renderNavItem(item, i + adminNavItems.length))}
      </nav>

      {/* Collapse Button (desktop only) */}
      <div className="hidden lg:block p-3 border-t border-slate-800/50">
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "w-full flex items-center gap-2 p-2 rounded-xl",
            "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all",
            isCollapsed && "justify-center"
          )}
        >
          <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronLeft className="w-4 h-4" />
          </motion.div>
          {!isCollapsed && <span className="text-sm">Collapse</span>}
        </motion.button>
      </div>

      {/* User Info */}
      <div className={cn("p-3 border-t border-slate-800/50 bg-gradient-to-r from-slate-900/50 to-slate-950/50")}>
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <div className="relative">
            <Avatar className="h-9 w-9 border-2 border-slate-700">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-sm">N</AvatarFallback>
            </Avatar>
            <motion.div
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ boxShadow: '0 0 8px hsl(145 100% 50% / 0.6)' }}
            />
          </div>

          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="flex-1 overflow-hidden">
                <p className="font-semibold text-sm text-white truncate">Naved</p>
                <p className="text-[11px] text-slate-500 truncate">Super Admin</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: isCollapsed ? 72 : 260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, width: { duration: 0.3 } }}
        className={cn(
          "hidden lg:flex flex-col h-[calc(100vh-4rem)] sticky top-8",
          "bg-slate-950/80 backdrop-blur-xl",
          "border border-slate-800/50 rounded-2xl overflow-hidden",
          "shadow-2xl shadow-black/20"
        )}
        style={{ background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 0.95) 100%)' }}
      >
        <div className="absolute inset-0 rounded-2xl p-[1px] pointer-events-none">
          <div className="absolute inset-0 rounded-2xl opacity-30" style={{ background: 'linear-gradient(135deg, hsl(185 100% 50% / 0.3) 0%, transparent 50%, hsl(280 100% 57% / 0.2) 100%)' }} />
        </div>
        {sidebarContent}
      </motion.aside>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setMobileOpen(true)}
          className="p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 text-white"
        >
          <Menu className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50 flex flex-col bg-slate-950 border-r border-slate-800/50"
            >
              <div className="absolute top-3 right-3">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMobileOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
