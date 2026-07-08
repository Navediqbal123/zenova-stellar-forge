import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface BottomNavigationProps {
  items: BottomNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Shared premium Apple + Stripe inspired floating bottom navigation.
 * Used on Home, Profile, and Developer Dashboard for a consistent feel.
 */
export function BottomNavigation({ items, activeId, onSelect }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-4 pt-2 pointer-events-none">
      <nav
        className="max-w-3xl mx-auto pointer-events-auto flex items-center justify-around px-2 py-3 rounded-[32px] bg-white safe-bottom"
        style={{
          boxShadow:
            '0 12px 44px -10px rgba(0, 0, 0, 0.14), 0 4px 12px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.05)',
        }}
      >
        {items.map(({ id, label, icon: Icon }) => {
          const active = activeId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-[18px]"
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-active-pill"
                  className="absolute inset-0 rounded-[18px]"
                  style={{
                    backgroundColor: '#DFF3FF',
                    boxShadow: '0 0 20px rgba(10, 132, 255, 0.22)',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32, duration: 0.22 }}
                />
              )}
              <Icon
                className="relative w-[26px] h-[26px] transition-colors duration-200"
                style={{ color: active ? '#0A84FF' : '#111111' }}
                strokeWidth={active ? 2.4 : 2}
              />
              <span
                className="relative text-[13px] font-medium leading-none transition-colors duration-200"
                style={{ color: active ? '#0A84FF' : '#111111' }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
