import { NavLink, useLocation } from 'react-router-dom';
import { Home, Package, Upload, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MobileBottomNavProps {
  onUploadClick: () => void;
}

export function MobileBottomNav({ onUploadClick }: MobileBottomNavProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Package, label: 'My Apps', path: '/developer/dashboard' },
    { icon: User, label: 'Profile', path: '/developer/settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-sidebar/95 backdrop-blur-xl border-t border-white/10" />

      <nav className="relative z-10 flex items-center justify-around px-2 py-2 safe-bottom">
        {navItems.slice(0, 2).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
              isActive(item.path)
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5",
              isActive(item.path) && "drop-shadow-[0_0_8px_hsl(var(--primary))]"
            )} />
            <span className="text-[10px] font-medium">{item.label}</span>
            {isActive(item.path) && (
              <motion.div
                layoutId="bottomNavActive"
                className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
              />
            )}
          </NavLink>
        ))}

        {/* Upload button - center, prominent */}
        <button
          onClick={onUploadClick}
          className="relative flex flex-col items-center gap-1 px-4 py-1"
        >
          <div className="w-12 h-12 -mt-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
            <Upload className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-[10px] font-medium text-primary">Upload</span>
        </button>

        {navItems.slice(2).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
              isActive(item.path)
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5",
              isActive(item.path) && "drop-shadow-[0_0_8px_hsl(var(--primary))]"
            )} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
