import { motion } from 'framer-motion';

interface IOSSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * Premium iOS-style toggle.
 * OFF: light gray (#E5E7EB) track, white thumb with thin gray border, soft shadow.
 * ON: blue (#3B82F6) track with soft blue glow, white thumb, spring animation.
 */
export function IOSSwitch({ checked, onCheckedChange, label, disabled }: IOSSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className="relative shrink-0 rounded-full outline-none disabled:opacity-50"
      style={{
        width: 52,
        height: 32,
        padding: 2,
        background: checked ? '#3B82F6' : '#E5E7EB',
        border: `1px solid ${checked ? '#3B82F6' : '#D1D5DB'}`,
        boxShadow: checked
          ? '0 0 0 4px rgba(59,130,246,0.16), inset 0 1px 2px rgba(0,0,0,0.06)'
          : 'inset 0 1px 2px rgba(0,0,0,0.06)',
        transition: 'background 250ms ease, box-shadow 250ms ease, border-color 250ms ease',
      }}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="block rounded-full bg-white"
        style={{
          width: 26,
          height: 26,
          marginLeft: checked ? 20 : 0,
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.18), 0 1px 1px rgba(0,0,0,0.06)',
        }}
      />
    </button>
  );
}
