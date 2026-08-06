import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface PremiumSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  /** Sticky footer (save button) */
  footer?: ReactNode;
}

/**
 * Premium Apple x Linear x Stripe bottom sheet.
 * 90vh height, 24px top corners, blurred dark backdrop,
 * spring slide-up, drag-to-dismiss, sticky footer, scrollable body.
 */
export function PremiumSheet({
  open, onClose, title, description, icon, children, footer,
}: PremiumSheetProps) {
  const y = useMotionValue(0);

  useEffect(() => {
    if (open) {
      y.set(0);
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open, y]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-black/45 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full sm:max-w-[560px] h-[90vh] bg-white flex flex-col overflow-hidden"
            style={{
              y,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              boxShadow: '0 -20px 60px rgba(15,23,42,0.28)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%', transition: { duration: 0.22, ease: [0.32, 0, 0.67, 0] } }}
            transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.9 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.35 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 140 || info.velocity.y > 700) onClose();
              else animate(y, 0, { type: 'spring', stiffness: 400, damping: 36 });
            }}
          >
            {/* glass highlight */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-32"
              style={{ background: 'linear-gradient(180deg, rgba(108,77,255,0.06) 0%, rgba(255,255,255,0) 100%)' }}
            />

            {/* drag handle */}
            <div className="relative pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-[52px] h-[6px] rounded-full bg-[#E2E2E8]" />
            </div>

            {/* header */}
            <div className="relative px-6 pt-2 pb-4">
              <div className="flex items-center gap-3 pr-12">
                {icon && (
                  <div className="w-10 h-10 rounded-[14px] bg-[#F5F3FF] border border-[#ECECEC] flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-[21px] font-bold tracking-[-0.02em] text-[#111111] truncate">{title}</h2>
                  {description && <p className="text-[13px] text-[#6B7280] mt-0.5 truncate">{description}</p>}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-2 right-5 w-9 h-9 rounded-full bg-white border border-[#ECECEC] shadow-[0_4px_14px_rgba(15,23,42,0.10)] flex items-center justify-center active:scale-90 transition-transform"
              >
                <X className="w-[18px] h-[18px] text-[#111111]" strokeWidth={2.2} />
              </button>
            </div>

            {/* scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6">
              {children}
            </div>

            {/* sticky footer */}
            {footer && (
              <div
                className="shrink-0 px-6 pt-3 pb-[26px] border-t border-[#F1F1F4]"
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.86) 0%, #FFFFFF 40%)', backdropFilter: 'blur(8px)' }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function GradientButton({
  children, onClick, disabled, gradient = 'purple',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  gradient?: 'purple' | 'green' | 'orange' | 'pink';
}) {
  const bg =
    gradient === 'green' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
      : gradient === 'orange' ? 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)'
      : gradient === 'pink' ? 'linear-gradient(135deg, #EC4899 0%, #A855F7 100%)'
      : 'linear-gradient(135deg, #6C4DFF 0%, #4F46E5 100%)';
  const glow =
    gradient === 'green' ? '0 10px 26px -10px rgba(16,185,129,0.7)'
      : gradient === 'orange' ? '0 10px 26px -10px rgba(249,115,22,0.7)'
      : gradient === 'pink' ? '0 10px 26px -10px rgba(236,72,153,0.7)'
      : '0 10px 26px -10px rgba(108,77,255,0.7)';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.975 }}
      className="w-full h-[54px] rounded-[18px] text-white text-[15px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 relative overflow-hidden"
      style={{ background: bg, boxShadow: glow }}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/12" />
      <span className="relative flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

export function SheetField({
  label, children, hint,
}: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="text-[12.5px] font-semibold text-[#6B7280] mb-2 block">{label}</label>
      {children}
      {hint && <p className="text-[11.5px] text-[#9CA3AF] mt-1.5">{hint}</p>}
    </div>
  );
}

export function SheetCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded-[20px] border border-[#ECECEC] shadow-[0_2px_14px_rgba(15,23,42,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}
