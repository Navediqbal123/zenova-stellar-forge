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
      color: 'secondary',
      features: ['Complete field control', 'Custom descriptions', 'Manual tagging'],
    },
    {
      id: 'ai' as const,
      title: 'Upload with AI',
      description: 'Let AI generate descriptions and tags automatically. Fast and smart.',
      icon: Sparkles,
      secondaryIcon: Wand2,
      color: 'primary',
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
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectMode(card.id)}
            className={cn(
              "relative p-6 rounded-2xl text-left transition-all duration-300",
              "border-2 border-transparent",
              "bg-white/[0.03] hover:bg-white/[0.06]",
              "group overflow-hidden",
              card.color === 'primary' && "hover:border-primary/50 hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.15)]",
              card.color === 'secondary' && "hover:border-secondary/50 hover:shadow-[0_0_30px_rgba(var(--secondary-rgb),0.15)]"
            )}
          >
            {/* Premium badge */}
            {card.premium && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500 to-primary text-xs font-semibold text-white"
              >
                Recommended
              </motion.div>
            )}

            {/* Background gradient on hover */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
              card.color === 'primary' && "bg-gradient-to-br from-primary/10 via-transparent to-transparent",
              card.color === 'secondary' && "bg-gradient-to-br from-secondary/10 via-transparent to-transparent"
            )} />

            {/* Icon */}
            <div className="relative z-10">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300",
                "group-hover:scale-110",
                card.color === 'primary' && "bg-primary/15 group-hover:bg-primary/25",
                card.color === 'secondary' && "bg-secondary/15 group-hover:bg-secondary/25"
              )}>
                <card.icon className={cn(
                  "w-8 h-8 transition-all duration-300",
                  card.color === 'primary' && "text-primary group-hover:drop-shadow-[0_0_12px_hsl(var(--primary))]",
                  card.color === 'secondary' && "text-secondary group-hover:drop-shadow-[0_0_12px_hsl(var(--secondary))]"
                )} />
              </div>

              {/* Title & Description */}
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                {card.title}
                <motion.div
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={false}
                >
                  <ArrowRight className={cn(
                    "w-4 h-4",
                    card.color === 'primary' && "text-primary",
                    card.color === 'secondary' && "text-secondary"
                  )} />
                </motion.div>
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {card.description}
              </p>

              {/* Features */}
              <ul className="space-y-2">
                {card.features.map((feature, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      card.color === 'primary' && "bg-primary",
                      card.color === 'secondary' && "bg-secondary"
                    )} />
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Floating icon decoration */}
            <motion.div
              className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity"
              animate={{ rotate: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <card.secondaryIcon className="w-32 h-32" />
            </motion.div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
