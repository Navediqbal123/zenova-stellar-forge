import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { motion } from 'framer-motion';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="gradient-orb gradient-orb-primary w-[600px] h-[600px] -top-48 -left-48" />
        <div className="gradient-orb gradient-orb-secondary w-[500px] h-[500px] top-1/2 -right-64" />
        <div className="gradient-orb gradient-orb-primary w-[400px] h-[400px] -bottom-32 left-1/3" />
      </div>

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <main className="lg:pl-72 min-h-screen relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="p-4 lg:p-8 pt-16 lg:pt-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
