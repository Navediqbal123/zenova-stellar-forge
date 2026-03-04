import { motion } from 'framer-motion';
import { UploadCloud, Sparkles, ArrowRight, Wand2, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadModeSelectorProps {
  onSelectMode: (mode: 'manual' | 'ai') => void;
}

export function UploadModeSelector({ onSelectMode }: UploadModeSelectorProps) {
  const cards = [
    {
      id: 'manual' as const,
      title: 'Manual Upload',
      description: 'Full control over all app details. Perfect for experienced developers.',
      icon: UploadCloud,
      secondaryIcon: FileCode,
      gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
      borderGlow: 'hover:shadow-[0_0_40px_rgba(6,182,212,0.15)]',
      accentColor: 'text-cyan-400',
      accentBg: 'bg-cyan-500/15 group-hover:bg-cyan-500/25',
      dotColor: 'bg-cyan-400',
      features: ['Complete field control', 'Custom descriptions', 'Manual tagging'],
    },
    {
      id: 'ai' as const,
      title: 'Upload with AI',
      description: 'Let AI generate descriptions and tags automatically. Fast and smart.',
      icon: Sparkles,
      secondaryIcon: Wand2,
      gradient: 'from-violet-500/20 via-primary/10 to-transparent',
      borderGlow: 'hover:shadow-[0_0_40px_rgba(139,92,246,0.2)]',
      accentColor: 'text-violet-400',
      accentBg: 'bg-violet-500/15 group-hover:bg-violet-500/25',
      dotColor: 'bg-violet-400',
      features: ['AI-powered descriptions', 'Auto-generated tags', 'One-click setup'],
      premium: true,
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-xl font-bold mb-2">Choose Upload Method</h2>
        <p className="text-muted-foreground text-sm">
          Select how you'd like to upload your app
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card, index) => (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.15, type: 'spring', stiffness: 300, damping: 25 }}
            whileHover={{ scale: 1.03, y: -6 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectMode(card.id)}
            className={cn(
              "relative p-6 rounded-2xl text-left transition-all duration-500",
              "border border-white/[0.08] hover:border-white/20",
              "bg-white/[0.02] backdrop-blur-xl",
              "group overflow-hidden",
              card.borderGlow
            )}
          >
            {/* Premium badge */}
            {card.premium && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-600 to-primary text-[10px] font-bold tracking-wider uppercase text-white shadow-lg shadow-violet-500/20"
              >
                ✨ Recommended
              </motion.div>
            )}

            {/* Background gradient on hover */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700",
              "bg-gradient-to-br",
              card.gradient
            )} />

            {/* Subtle glass shine */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent" />

            {/* Icon */}
            <div className="relative z-10">
              <motion.div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500",
                  card.accentBg
                )}
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <card.icon className={cn("w-7 h-7 transition-all duration-500", card.accentColor)} />
              </motion.div>

              {/* Title & Description */}
              <h3 className="text-lg font-bold mb-1.5 flex items-center gap-2">
                {card.title}
                <motion.div
                  className="opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1"
                  initial={false}
                >
                  <ArrowRight className={cn("w-4 h-4", card.accentColor)} />
                </motion.div>
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {card.description}
              </p>

              {/* Features */}
              <ul className="space-y-2">
                {card.features.map((feature, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.1 }}
                    className="flex items-center gap-2.5 text-xs text-muted-foreground"
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full", card.dotColor)} />
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Floating icon decoration */}
            <motion.div
              className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700"
              animate={{ rotate: [0, 10, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <card.secondaryIcon className="w-36 h-36" />
            </motion.div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
