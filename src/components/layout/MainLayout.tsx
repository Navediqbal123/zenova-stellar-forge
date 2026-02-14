import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
        <div className="gradient-orb gradient-orb-primary w-[400px] h-[400px] -top-48 -left-48 opacity-20" />
        <div className="gradient-orb gradient-orb-secondary w-[300px] h-[300px] top-1/2 -right-48 opacity-15" />
      </div>

      {/* Main Content - no sidebar offset */}
      <main className="min-h-screen relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="p-4 pt-4"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
