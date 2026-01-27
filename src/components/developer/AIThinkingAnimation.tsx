import { motion } from 'framer-motion';
import { Brain, Sparkles, Zap, Cpu, Scan } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIThinkingAnimationProps {
  stage?: 'scanning' | 'analyzing' | 'generating';
}

export function AIThinkingAnimation({ stage = 'scanning' }: AIThinkingAnimationProps) {
  const stages = {
    scanning: { icon: Scan, text: 'Scanning app metadata...', color: 'primary' },
    analyzing: { icon: Brain, text: 'AI analyzing content...', color: 'secondary' },
    generating: { icon: Sparkles, text: 'Generating description...', color: 'primary' },
  };

  const currentStage = stages[stage];
  const Icon = currentStage.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center py-8"
    >
      {/* Main Brain Animation Container */}
      <div className="relative w-32 h-32 mb-6">
        {/* Outer rotating ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-dashed border-primary/40"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Second rotating ring (opposite direction) */}
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-dotted border-secondary/40"
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />

        {/* Inner pulsing glow */}
        <motion.div
          className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Scanning lines */}
        <motion.div
          className="absolute inset-4 rounded-full overflow-hidden"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
        >
          <motion.div
            className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
            animate={{ y: [0, 100, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Core icon */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-primary/30 to-secondary/30",
            "border border-white/20"
          )}>
            <Icon className={cn(
              "w-8 h-8",
              currentStage.color === 'primary' 
                ? "text-primary drop-shadow-[0_0_15px_hsl(var(--primary))]"
                : "text-secondary drop-shadow-[0_0_15px_hsl(var(--secondary))]"
            )} />
          </div>
        </motion.div>

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/60"
            style={{
              left: '50%',
              top: '50%',
            }}
            animate={{
              x: [0, Math.cos((i * 60) * Math.PI / 180) * 50],
              y: [0, Math.sin((i * 60) * Math.PI / 180) * 50],
              opacity: [1, 0],
              scale: [0.5, 1.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* Status text */}
      <motion.div
        className="text-center"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="flex items-center gap-2 text-lg font-medium mb-2">
          <Cpu className="w-5 h-5 text-primary animate-pulse" />
          <span className="gradient-text">{currentStage.text}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Our AI is processing your app information
        </p>
      </motion.div>

      {/* Progress dots */}
      <div className="flex gap-2 mt-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Neural network lines (decorative) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" viewBox="0 0 200 200">
        <motion.path
          d="M100,50 L150,100 L100,150 L50,100 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-primary"
          animate={{ 
            strokeDashoffset: [0, 100],
          }}
          style={{ strokeDasharray: '10 5' }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </svg>
    </motion.div>
  );
}
