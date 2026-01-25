import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ChatbotSupport, ChatbotTrigger } from '@/components/admin/ChatbotSupport';

export type AdminTab = 'dashboard' | 'developers' | 'apps' | 'categories' | 'stats';

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

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
      className="max-w-[1800px] mx-auto"
    >
      <div className="flex gap-6">
        {/* Premium Admin Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          onOpenChatbot={() => setIsChatbotOpen(true)}
        />

        {/* Mobile Tab Bar */}
        <MobileTabBar activeTab={activeTab} onTabChange={onTabChange} />

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

      {/* Floating Chatbot */}
      <ChatbotTrigger onClick={() => setIsChatbotOpen(true)} />
      <ChatbotSupport 
        isOpen={isChatbotOpen} 
        onClose={() => setIsChatbotOpen(false)} 
      />
    </motion.div>
  );
}

// Mobile Tab Bar Component
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Layers, 
  BarChart3 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileTabConfig: { id: AdminTab; icon: React.ElementType }[] = [
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'developers', icon: Users },
  { id: 'apps', icon: Package },
  { id: 'categories', icon: Layers },
  { id: 'stats', icon: BarChart3 },
];

function MobileTabBar({ activeTab, onTabChange }: { activeTab: AdminTab; onTabChange: (tab: AdminTab) => void }) {
  return (
    <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="admin-glass-card p-2 flex justify-around backdrop-blur-xl"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)',
        }}
      >
        {mobileTabConfig.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "p-3 rounded-xl transition-all relative",
                isActive 
                  ? "bg-blue-600/20 text-blue-400" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <tab.icon className={cn(
                "w-5 h-5",
                isActive && "drop-shadow-[0_0_8px_hsl(217_91%_60%)]"
              )} />
              {isActive && (
                <motion.div
                  layoutId="activeMobileTab"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500"
                  style={{
                    boxShadow: '0 0 8px hsl(217 91% 60% / 0.8)'
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
