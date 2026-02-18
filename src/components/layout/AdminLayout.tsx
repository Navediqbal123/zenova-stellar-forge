import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ChatbotSupport, ChatbotTrigger } from '@/components/admin/ChatbotSupport';

export type AdminTab = 'dashboard' | 'developers' | 'apps' | 'edit-apps' | 'categories' | 'stats' | 'ai-insights';

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

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
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          onOpenChatbot={() => setIsChatbotOpen(true)}
        />

        <main className="flex-1 min-w-0 pb-6 pt-14 lg:pt-0">
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

      <ChatbotTrigger onClick={() => setIsChatbotOpen(true)} />
      <ChatbotSupport 
        isOpen={isChatbotOpen} 
        onClose={() => setIsChatbotOpen(false)} 
      />
    </motion.div>
  );
}
