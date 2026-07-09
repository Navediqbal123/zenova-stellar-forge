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
    <div className="fixed bottom-3 left-0 right-0 z-50 px-4 pb-5 pt-2 pointer-events-none">
      <nav
        className="max-w-3xl mx-auto pointer-events-auto flex items-center justify-around px-4 py-3.5 rounded-[32px] bg-white safe-bottom"
        style={{
          boxShadow:
            '0 14px 48px -10px rgba(0, 0, 0, 0.16), 0 6px 18px rgba(0, 0, 0, 0.07), 0 0 1px rgba(0, 0, 0, 0.05)',
        }}
      >
        {items.map(({ id, label, icon: Icon }) => {
          const active = activeId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className="relative flex-1 flex flex-col items-center justify-center gap-1.5 px-3 py-2.5 rounded-[20px] min-w-[56px]"
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-active-pill"
                  className="absolute inset-0 rounded-[20px]"
                  style={{
                    backgroundColor: '#DFF3FF',
                    boxShadow: '0 0 24px rgba(10, 132, 255, 0.24)',
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
                className="relative text-[15px] font-medium leading-none transition-colors duration-200"
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
