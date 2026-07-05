import { motion, AnimatePresence } from 'framer-motion';
import { Home, Shield, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export type DeveloperTab = 'dashboard' | 'my-apps' | 'edit-apps' | 'analytics' | 'notifications' | 'settings';

interface DeveloperSidebarProps {
  activeTab: DeveloperTab;
  onTabChange: (tab: DeveloperTab) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function DeveloperSidebar({ mobileOpen = false, onMobileClose }: DeveloperSidebarProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!mobileOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    ...(isAdmin ? [{ icon: Shield, label: 'Admin Panel', path: '/admin' }] : []),
  ];

  const sidebarContent = (
    <div className="relative z-10 h-full flex flex-col p-4 bg-white">
      {/* Logo */}
      <div className="flex items-center justify-between mb-8 px-1 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-[0_4px_12px_rgba(14,165,233,0.35)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-[#0A0A0A]">EloraX</h1>
            <p className="text-[11px] text-[#6B7280]">Developer Console</p>
          </div>
        </div>
        <button
          onClick={onMobileClose}
          className="p-1.5 rounded-lg hover:bg-[#F5F5F7] lg:hidden"
        >
          <X className="w-5 h-5 text-[#0A0A0A]" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path);
              onMobileClose?.();
            }}
            className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors duration-150 text-[#0A0A0A] hover:bg-[#F5F5F7]"
          >
            <item.icon className="w-5 h-5 shrink-0" strokeWidth={1.8} />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={cn(
          "fixed left-0 top-0 h-screen z-40 hidden lg:block w-64 border-r border-[#E5E7EB] bg-white"
        )}
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Overlay Drawer */}
      <AnimatePresence initial={false}>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="fixed inset-0 bg-black/30 z-50 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-0 top-0 h-[100dvh] w-[80vw] max-w-[280px] z-50 lg:hidden overflow-y-auto border-r border-[#E5E7EB]"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
