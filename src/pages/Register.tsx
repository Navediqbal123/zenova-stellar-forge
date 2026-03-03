import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    try {
      await register(email, password, name);
      toast({ title: "Account created!", description: "Welcome to Elora x — you're now signed in!" });
    } catch (error: any) {
      const msg = error?.message?.toLowerCase() || '';
      if (msg.includes('fetch') || msg.includes('network')) {
        toast({
          title: "Connection Error",
          description: "Unable to reach the server. Please check your internet and try again.",
          variant: "destructive"
        });
      } else if (msg.includes('already registered') || msg.includes('already exists')) {
        toast({ title: "Account Exists", description: "This email is already registered. Please sign in.", variant: "destructive" });
      } else {
        toast({ title: "Registration Failed", description: error?.message || "Something went wrong.", variant: "destructive" });
      }
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Redirecting...</p>
        </motion.div>
      </div>
    );
  }

  const inputClass = "pl-9 h-10 text-sm bg-muted/30 border-muted/50 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300";

  const AnimatedInput = ({ id, focused }: { id: string; focused: string | null }) => (
    <motion.div
      className="relative"
      animate={{ scale: focused === id ? 1.01 : 1 }}
      transition={{ type: "spring", stiffness: 300 }}
    />
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Ambient orbs */}
      <motion.div
        className="absolute top-[-100px] right-[-60px] w-[280px] h-[280px] rounded-full opacity-20 blur-[100px]"
        style={{ background: 'hsl(var(--primary))' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-80px] left-[-50px] w-[220px] h-[220px] rounded-full opacity-15 blur-[80px]"
        style={{ background: 'hsl(var(--accent))' }}
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="glass-card p-6 rounded-2xl border border-primary/10 shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.15)]">
          {/* Brand Header */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-center mb-6"
          >
            <motion.div 
              className="inline-flex items-center gap-1.5 mb-4"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                Elora x
              </span>
            </motion.div>
            <h1 className="text-xl font-bold text-foreground mb-1">Create Account</h1>
            <p className="text-xs text-muted-foreground">Join the Elora x community</p>
          </motion.div>

          {/* Form */}
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            onSubmit={handleSubmit} 
            className="space-y-3.5"
          >
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Full Name</Label>
              <motion.div className="relative" animate={{ scale: isFocused === 'name' ? 1.01 : 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="name" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} onFocus={() => setIsFocused('name')} onBlur={() => setIsFocused(null)} className={inputClass} />
              </motion.div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email</Label>
              <motion.div className="relative" animate={{ scale: isFocused === 'email' ? 1.01 : 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setIsFocused('email')} onBlur={() => setIsFocused(null)} className={inputClass} />
              </motion.div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Password</Label>
              <motion.div className="relative" animate={{ scale: isFocused === 'password' ? 1.01 : 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setIsFocused('password')} onBlur={() => setIsFocused(null)} className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </motion.div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-medium text-muted-foreground">Confirm Password</Label>
              <motion.div className="relative" animate={{ scale: isFocused === 'confirm' ? 1.01 : 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onFocus={() => setIsFocused('confirm')} onBlur={() => setIsFocused(null)} className={`${inputClass}`} />
              </motion.div>
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button 
                type="submit" 
                className="w-full h-10 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold text-sm shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.4)] transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
                ) : (
                  <span className="flex items-center gap-2">Create Account <ArrowRight className="w-4 h-4" /></span>
                )}
              </Button>
            </motion.div>
          </motion.form>

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-5 text-center"
          >
            <p className="text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
