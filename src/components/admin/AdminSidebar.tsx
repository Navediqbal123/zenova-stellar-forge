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
  Settings,
  Bell,
  Zap,
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
  id: AdminTab | 'ai-tools' | 'security' | 'support';
  label: string;
  icon: React.ElementType;
  description: string;
  badge?: string;
  isSpecial?: boolean;
}

const navItems: NavItem[] = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard, 
    description: 'Overview & metrics' 
  },
  { 
    id: 'apps', 
    label: 'Manage Apps', 
    icon: Box, 
    description: 'App submissions' 
  },
  { 
    id: 'developers', 
    label: 'Developer Approvals', 
    icon: UserCheck, 
    description: 'Review developers',
    badge: 'New'
  },
  { 
    id: 'ai-tools' as AdminTab, 
    label: 'AI Content Tools', 
    icon: Sparkles, 
    description: 'Auto-generate content',
    isSpecial: true
  },
  { 
    id: 'security' as AdminTab, 
    label: 'Security Logs', 
    icon: ShieldCheck, 
    description: 'Virus scan reports' 
  },
  { 
    id: 'support' as AdminTab, 
    label: 'Support Bot', 
    icon: MessageCircle, 
    description: 'AI assistance' 
  },
];

export function AdminSidebar({ activeTab, onTabChange, onOpenChatbot }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    logout();
    navigate('/login');
  };

  const handleItemClick = (item: NavItem) => {
    if (item.id === 'support') {
      onOpenChatbot?.();
    } else if (item.id === 'ai-tools') {
      navigate('/ai-upload');
    } else if (item.id === 'security') {
      // Show security logs - could be a modal or section
      onTabChange('stats');
    } else {
      onTabChange(item.id as AdminTab);
    }
  };

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1,
        width: isCollapsed ? 80 : 280 
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 30,
        width: { duration: 0.3 }
      }}
      className={cn(
        "hidden lg:flex flex-col h-[calc(100vh-4rem)] sticky top-8",
        "bg-slate-950/80 backdrop-blur-xl",
        "border border-slate-800/50",
        "rounded-2xl overflow-hidden",
        "shadow-2xl shadow-black/20"
      )}
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 0.95) 100%)',
      }}
    >
      {/* Decorative gradient border */}
      <div className="absolute inset-0 rounded-2xl p-[1px] pointer-events-none">
        <div 
          className="absolute inset-0 rounded-2xl opacity-30"
          style={{
            background: 'linear-gradient(135deg, hsl(185 100% 50% / 0.3) 0%, transparent 50%, hsl(280 100% 57% / 0.2) 100%)',
          }}
        />
      </div>

      {/* Header */}
      <div className={cn(
        "relative p-5 border-b border-slate-800/50",
        "bg-gradient-to-r from-primary/5 to-secondary/5"
      )}>
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="relative">
                <motion.div 
                  className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Zap className="w-6 h-6 text-primary" />
                </motion.div>
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-warning" />
                </motion.div>
              </div>
              <div>
                <h2 className="font-bold text-lg bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Admin Panel
                </h2>
                <p className="text-xs text-slate-500">Zenova Store</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center"
            >
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20">
                <Zap className="w-6 h-6 text-primary" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item, index) => {
          const isActive = activeTab === item.id;
          const isHovered = hoveredItem === item.id;

          const NavButton = (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl transition-all duration-200 relative group",
                isCollapsed ? "p-3 justify-center" : "px-4 py-3",
                isActive
                  ? "bg-gradient-to-r from-blue-600/20 to-blue-500/10 text-blue-400"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50",
                item.isSpecial && !isActive && "text-purple-400 hover:text-purple-300"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-blue-500"
                  style={{
                    boxShadow: '0 0 10px hsl(217 91% 60% / 0.5), 0 0 20px hsl(217 91% 60% / 0.3)'
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              {/* Icon with glow */}
              <div className={cn(
                "relative p-2 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-blue-500/20" 
                  : "group-hover:bg-slate-700/50",
                item.isSpecial && !isActive && "bg-purple-500/10"
              )}>
                <item.icon className={cn(
                  "w-5 h-5 transition-all duration-200",
                  isActive && "drop-shadow-[0_0_8px_hsl(217_91%_60%)]",
                  item.isSpecial && !isActive && "drop-shadow-[0_0_6px_hsl(280_100%_60%)]"
                )} />
              </div>

              {/* Label */}
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

              {/* Badge */}
              {item.badge && !isCollapsed && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30"
                >
                  {item.badge}
                </motion.span>
              )}

              {/* Arrow indicator */}
              {!isCollapsed && (
                <motion.div
                  animate={{ 
                    x: isActive || isHovered ? 0 : -5, 
                    opacity: isActive || isHovered ? 1 : 0 
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              )}
            </motion.button>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.id} delayDuration={0}>
                <TooltipTrigger asChild>
                  {NavButton}
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-900 border-slate-700">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          return NavButton;
        })}
      </nav>

      {/* Collapse Button */}
      <div className="p-3 border-t border-slate-800/50">
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "w-full flex items-center gap-2 p-2.5 rounded-xl",
            "text-slate-500 hover:text-slate-300",
            "hover:bg-slate-800/50 transition-all",
            isCollapsed && "justify-center"
          )}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* User Profile Section */}
      <div className={cn(
        "p-4 border-t border-slate-800/50",
        "bg-gradient-to-r from-slate-900/50 to-slate-950/50"
      )}>
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && "justify-center"
        )}>
          {/* Avatar with status indicator */}
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-slate-700">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
                N
              </AvatarFallback>
            </Avatar>
            {/* Live status indicator */}
            <motion.div
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                boxShadow: '0 0 8px hsl(145 100% 50% / 0.6)'
              }}
            />
          </div>

          {/* User Info */}
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 overflow-hidden"
              >
                <p className="font-semibold text-sm text-white truncate">Naved</p>
                <p className="text-xs text-slate-500 truncate">Admin</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1"
              >
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/50 transition-colors"
                    >
                      <Bell className="w-4 h-4" />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Notifications</TooltipContent>
                </Tooltip>

                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Settings</TooltipContent>
                </Tooltip>

                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={handleLogout}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Logout</TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapsed Logout */}
        {isCollapsed && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-full mt-3 p-2.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex justify-center"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right">Logout</TooltipContent>
          </Tooltip>
        )}
      </div>
    </motion.aside>
  );
}
