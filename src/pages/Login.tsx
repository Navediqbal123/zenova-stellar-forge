import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowRight, ShieldCheck, Zap, Rocket } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const BrandHeader = () => (
  <div className="flex items-center gap-3 mb-8">
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" className="shrink-0">
      <path
        d="M24 2 L28.5 19.5 L46 24 L28.5 28.5 L24 46 L19.5 28.5 L2 24 L19.5 19.5 Z"
        stroke="#6D5AE6"
        strokeWidth="2.4"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
    <div>
      <h2 className="text-[26px] leading-none font-extrabold tracking-tight text-[#111111]">Elora X</h2>
      <p className="text-sm text-[#6B7280] mt-1">Discover. Build. Publish.</p>
    </div>
  </div>
);

const features = [
  { icon: ShieldCheck, title: 'Secure & Safe', desc: 'Your data is protected' },
  { icon: Zap, title: 'Fast & Simple', desc: 'Quick sign in experience' },
  { icon: Rocket, title: 'Build & Grow', desc: 'Publish and grow your apps' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated, isAdmin, isDeveloperApproved, isLoggingOut } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (isLoggingOut) return;
    if (isAuthenticated) {
      if (isAdmin) navigate('/admin', { replace: true });
      else if (isDeveloperApproved) navigate('/developer/dashboard', { replace: true });
      else navigate('/', { replace: true });
    }
  }, [isAuthenticated, isAdmin, isDeveloperApproved, isLoggingOut, navigate]);

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast({ title: 'Google Sign In failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    try {
      await login(email, password);
      toast({ title: 'Welcome back!', description: "You've successfully signed in" });
    } catch (error: any) {
      const msg = error?.message?.toLowerCase() || '';
      if (msg.includes('fetch') || msg.includes('network')) {
        toast({ title: 'Connection Error', description: 'Unable to reach the server. Please check your internet connection and try again.', variant: 'destructive' });
      } else if (msg.includes('invalid') || msg.includes('credentials')) {
        toast({ title: 'Invalid Credentials', description: 'Please check your email and password, or create a new account.', variant: 'destructive' });
      } else {
        toast({ title: 'Login Failed', description: error?.message || 'Something went wrong. Please try again.', variant: 'destructive' });
      }
    }
  };

  if (isAuthenticated && !isLoggingOut) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#3B82F6]" />
          <p className="text-[#6B7280]">Redirecting...</p>
        </div>
      </div>
    );
  }

  const inputClass =
    'h-[58px] !pl-12 pr-12 text-[15px] rounded-[18px] bg-white border border-[#E5E7EB] text-[#111111] placeholder:text-[#9CA3AF] shadow-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/25 focus-visible:border-[#3B82F6] transition-all duration-300';

  return (
    <div className="min-h-screen bg-white px-4 py-8 flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-[24px] bg-white border border-[#F1F1F4] shadow-[0_12px_40px_-16px_rgba(17,17,17,0.12)] p-6 sm:p-7">
          <div className="pointer-events-none absolute -top-14 -right-10 w-40 h-40 rounded-full bg-[#6D5AE6]/[0.07] blur-2xl" />

          <BrandHeader />

          <h1 className="text-[26px] font-extrabold tracking-tight text-[#111111]">Welcome Back</h1>
          <p className="text-sm text-[#6B7280] mt-1.5 mb-6">Sign in to continue your journey</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#111111]" strokeWidth={1.8} />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#111111]" strokeWidth={1.8} />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111111] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.8} /> : <Eye className="w-5 h-5" strokeWidth={1.8} />}
              </button>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="w-5 h-5 rounded-[6px] border-[#D1D5DB] data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]"
                />
                <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer text-[#111111]">
                  Remember me
                </Label>
              </div>
              <Link to="/login" className="text-sm font-medium text-[#3B82F6]">
                Forgot password?
              </Link>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-[58px] rounded-[18px] bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-semibold text-[16px] shadow-[0_10px_28px_-10px_rgba(59,130,246,0.65)] flex items-center justify-center gap-2 disabled:opacity-70 transition-all duration-300"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight className="w-5 h-5" strokeWidth={2} /></>
              )}
            </motion.button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <span className="h-px flex-1 bg-[#E5E7EB]" />
            <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-[#6B7280]">or continue with</span>
            <span className="h-px flex-1 bg-[#E5E7EB]" />
          </div>

          <motion.button
            type="button"
            onClick={handleGoogle}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full h-[54px] rounded-[16px] bg-white border border-[#E5E7EB] flex items-center justify-center gap-3 text-[15px] font-medium text-[#111111] hover:bg-[#FAFAFB] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-2.8-.4-4.1H24v8.1h12.5c-.3 2.1-1.6 5.2-4.7 7.3l7.6 5.9c4.5-4.2 6.7-10.3 6.7-17.2z" />
              <path fill="#FBBC05" d="M10.4 28.7A14.6 14.6 0 0 1 9.6 24c0-1.6.3-3.2.8-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z" />
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2 1.4-4.8 2.4-8.3 2.4-6.4 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
            </svg>
            Sign in with Google
          </motion.button>

          <p className="mt-6 text-center text-sm text-[#111111]">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#3B82F6]">
              Create One
            </Link>
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
              className="rounded-[18px] bg-white border border-[#F1F1F4] shadow-[0_8px_24px_-14px_rgba(17,17,17,0.14)] p-3.5 text-center"
            >
              <Icon className="w-[22px] h-[22px] mx-auto mb-2 text-[#111111]" strokeWidth={1.7} />
              <p className="text-[12.5px] font-semibold text-[#111111] leading-tight">{title}</p>
              <p className="text-[11px] text-[#6B7280] mt-1 leading-snug">{desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
