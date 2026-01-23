import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Grid3X3, 
  Layers, 
  Code, 
  LayoutDashboard, 
  Shield,
  Menu,
  X,
  LogOut,
  User,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  requiresDeveloper?: boolean;
  locked?: boolean;
}

export function AppSidebar() {
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, isDeveloperApproved, developerProfile, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Apps', path: '/apps', icon: Grid3X3 },
    { name: 'Categories', path: '/categories', icon: Layers },
    { name: 'Become a Developer', path: '/developer/register', icon: Code, requiresAuth: true },
    { 
      name: 'Developer Dashboard', 
      path: '/developer/dashboard', 
      icon: LayoutDashboard, 
      requiresDeveloper: true,
      locked: !!developerProfile && !isDeveloperApproved
    },
    { name: 'Admin Panel', path: '/admin', icon: Shield, requiresAdmin: true },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.requiresAdmin && !isAdmin) return false;
    if (item.requiresDeveloper && !developerProfile) return false;
    if (item.requiresAuth && !isAuthenticated) return false;
    return true;
  });

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg glass-card lg:hidden hover-glow"
      >
        <Menu className="w-6 h-6 text-primary" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          x: isMobileOpen ? 0 : typeof window !== 'undefined' && window.innerWidth < 1024 ? -300 : 0 
        }}
        className={cn(
          "fixed left-0 top-0 h-full w-72 z-50 lg:z-30",
          "bg-sidebar border-r border-sidebar-border",
          "flex flex-col",
          "lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/" onClick={closeMobile} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse-glow">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">ZENOVA</h1>
              <p className="text-xs text-muted-foreground">STORE</p>
            </div>
          </Link>
          
          {/* Mobile Close Button */}
          <button
            onClick={closeMobile}
            className="absolute top-6 right-4 p-1 rounded-lg hover:bg-muted lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item, index) => {
            const active = isActive(item.path);
            const locked = item.locked;
            
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={locked ? '#' : item.path}
                  onClick={(e) => {
                    if (locked) {
                      e.preventDefault();
                    } else {
                      closeMobile();
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    "group relative overflow-hidden",
                    active 
                      ? "bg-primary/10 text-primary neon-border" 
                      : locked
                        ? "text-muted-foreground/50 cursor-not-allowed"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary"
                  )}
                >
                  {/* Glow effect on hover */}
                  {!locked && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-primary/5 to-transparent" />
                  )}
                  
                  <item.icon className={cn(
                    "w-5 h-5 relative z-10 transition-transform duration-200",
                    !locked && "group-hover:scale-110"
                  )} />
                  
                  <span className="relative z-10 font-medium">{item.name}</span>
                  
                  {locked && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning">
                      Locked
                    </span>
                  )}
                  
                  {active && !locked && (
                    <ChevronRight className="w-4 h-4 ml-auto text-primary" />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  {developerProfile && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full inline-block mt-1",
                      developerProfile.status === 'pending' && "status-pending",
                      developerProfile.status === 'approved' && "status-approved",
                      developerProfile.status === 'rejected' && "status-rejected"
                    )}>
                      {developerProfile.status === 'pending' && 'Dev: Under Review'}
                      {developerProfile.status === 'approved' && 'Developer'}
                      {developerProfile.status === 'rejected' && 'Dev: Rejected'}
                    </span>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  logout();
                  closeMobile();
                }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link to="/login" onClick={closeMobile}>
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={closeMobile}>
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
