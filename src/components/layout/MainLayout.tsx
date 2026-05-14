import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[hsl(var(--app-store-background))]">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
        <div className="gradient-orb gradient-orb-primary w-[400px] h-[400px] -top-48 -left-48 opacity-20" />
        <div className="gradient-orb gradient-orb-secondary w-[300px] h-[300px] top-1/2 -right-48 opacity-15" />
      </div>

      {/* Main Content - no sidebar offset */}
      <main className="min-h-screen w-full relative overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full min-h-screen p-0"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
