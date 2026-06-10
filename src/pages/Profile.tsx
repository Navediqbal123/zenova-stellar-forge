import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  Rocket,
  LayoutDashboard,
  Shield,
  LogIn,
  UserPlus,
  ChevronRight,
  User as UserIcon,
  Star,
  Bookmark,
  DownloadCloud,
  Globe,
  Clock,
  XCircle,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApps } from '@/contexts/AppsContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const ACCENT = '#0A84FF';
const PAGE_BG = '#F2F2F7';

interface RowProps {
  icon: React.ElementType;
  label: string;
  to?: string;
  onClick?: () => void;
  iconColor?: string;
  trailing?: React.ReactNode;
  danger?: boolean;
  chevronColor?: string;
}

function Row({ icon: Icon, label, to, onClick, iconColor = '#1C1C1E', trailing, danger, chevronColor }: RowProps) {
  const content = (
    <div className="flex items-center gap-3 px-4 py-3.5 active:bg-slate-100 transition-colors">
      <Icon
        className="w-6 h-6 shrink-0"
        style={{ color: danger ? '#DC2626' : iconColor }}
        strokeWidth={1.8}
      />
      <span
        className="flex-1 text-[15px] font-semibold"
        style={{ color: danger ? '#DC2626' : '#1C1C1E' }}
      >
        {label}
      </span>
      {trailing}
      {!trailing && !danger && (
        <ChevronRight className="w-5 h-5" style={{ color: chevronColor || '#C7C7CC' }} strokeWidth={2.5} />
      )}
    </div>
  );
  if (to) return <Link to={to}>{content}</Link>;
  return (
    <button onClick={onClick} className="block w-full text-left">
      {content}
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 px-2 mb-2 mt-6">
      {children}
    </h3>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, developerProfile, logout } = useAuth();
  const { apps } = useApps();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    (user?.user_metadata as any)?.avatar_url || null,
  );
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState<string>(
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
  );
  const [editOpen, setEditOpen] = useState(false);
  const [editingName, setEditingName] = useState(name);
  const [savingName, setSavingName] = useState(false);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [savedCount, setSavedCount] = useState<number>(0);

  useEffect(() => {
    setAvatarUrl((user?.user_metadata as any)?.avatar_url || null);
    const n = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
    setName(n);
    setEditingName(n);
  }, [user]);

  useEffect(() => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem('elorax_wishlist') || '[]');
      setSavedCount(Array.isArray(ids) ? ids.length : 0);
    } catch { setSavedCount(0); }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { count } = await supabase
        .from('reviews' as any)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (typeof count === 'number') setReviewCount(count);
    })().catch(() => {});
  }, [user?.id]);

  const totalDownloads = (apps || []).reduce((s: number, a: any) => s + (a.downloads || 0), 0);
  const myApps = (apps || []).filter((a: any) => a.developer_id && developerProfile?.id && a.developer_id === developerProfile.id);
  const myDownloads = myApps.reduce((s: number, a: any) => s + (a.downloads || 0), 0);
  const downloadsDisplay = developerProfile ? myDownloads : 0;

  const handlePickFile = () => fileRef.current?.click();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `avatars/${user.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('app-icons').upload(path, file, { upsert: true, cacheControl: '3600' });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('app-icons').getPublicUrl(path);
      const publicUrl = data.publicUrl;
      const { error: updErr } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (updErr) throw updErr;
      setAvatarUrl(publicUrl);
      toast.success('Profile photo updated');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSaveName = async () => {
    if (!editingName.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: editingName.trim() } });
      if (error) throw error;
      setName(editingName.trim());
      toast.success('Profile updated');
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSavingName(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      window.location.href = '/login';
    }
  };

  const initials = (name || user?.email || '?').slice(0, 1).toUpperCase();
  const devStatus = developerProfile?.status;
  const isApprovedDev = devStatus === 'approved';

  return (
    <div
      className="min-h-screen w-full max-w-[100vw] overflow-x-hidden"
      style={{
        backgroundColor: PAGE_BG,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
        color: '#1C1C1E',
      }}
    >
      <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-28">
        <header className="flex items-center gap-2 mb-4">
          <button
            onClick={() => navigate('/')}
            aria-label="Back"
            className="p-2 -ml-2 rounded-full active:bg-slate-200/60 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>
          <h1 className="text-[22px] font-bold tracking-tight">Profile</h1>
        </header>

        {!isAuthenticated ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <UserIcon className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-lg font-bold mb-1">You're not signed in</h2>
            <p className="text-sm text-slate-500 mb-5">Sign in to manage your profile.</p>
            <div className="flex flex-col gap-2">
              <Link to="/login" className="inline-flex items-center justify-center gap-2 h-11 rounded-full text-white font-semibold text-sm" style={{ backgroundColor: ACCENT }}>
                <LogIn className="w-4 h-4" /> Sign In
              </Link>
              <Link to="/register" className="inline-flex items-center justify-center gap-2 h-11 rounded-full bg-slate-100 font-semibold text-sm text-slate-800">
                <UserPlus className="w-4 h-4" /> Create Account
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Avatar + name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 flex flex-col items-center text-center"
            >
              <div className="relative">
                <div
                  className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center text-white text-4xl font-bold ring-4 ring-white shadow-sm"
                  style={{ backgroundImage: `linear-gradient(135deg, ${ACCENT}, #0066CC)` }}
                >
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    : <span>{initials}</span>}
                </div>
                <button
                  onClick={handlePickFile}
                  disabled={uploading}
                  className="absolute -bottom-1 -left-1 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md ring-2 ring-white disabled:opacity-60"
                  style={{ backgroundColor: ACCENT }}
                  aria-label="Change photo"
                >
                  {uploading
                    ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <Camera className="w-4 h-4" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </div>

              <h2 className="mt-4 text-xl font-bold">{name || 'Add your name'}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>

              <button
                onClick={() => { setEditingName(name); setEditOpen(true); }}
                className="mt-4 inline-flex items-center justify-center px-6 h-9 rounded-full text-white text-sm font-semibold"
                style={{ backgroundColor: ACCENT }}
              >
                Edit Profile
              </button>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2.5 mt-4">
              <StatCard label="Reviews" value={reviewCount} Icon={Star} />
              <StatCard label="Saved Apps" value={savedCount} Icon={Bookmark} />
              <StatCard label="Downloads" value={formatNum(downloadsDisplay)} Icon={DownloadCloud} />
            </div>

            {/* ACCOUNT */}
            <SectionTitle>Account</SectionTitle>
            <div className="bg-white rounded-2xl overflow-hidden divide-y divide-slate-100">
              <Row icon={UserIcon} label="Edit Profile" onClick={() => { setEditingName(name); setEditOpen(true); }} />
              <Row icon={Star} label="My Reviews" onClick={() => toast.info('Your reviews will appear here.')} />
              <Row icon={Bookmark} label="Saved Apps / Wishlist" onClick={() => toast.info('Open an app and tap the bookmark to save it.')} />
            </div>

            {/* PREFERENCES */}
            <SectionTitle>Preferences</SectionTitle>
            <div className="bg-white rounded-2xl overflow-hidden divide-y divide-slate-100">
              <Row
                icon={Moon}
                label="Dark Mode"
                onClick={() => toggleDark(!darkMode)}
                trailing={<Switch checked={darkMode} onCheckedChange={toggleDark} />}
              />
              <Row
                icon={Globe}
                label="Language"
                onClick={() => toast.info('More languages coming soon')}
                trailing={<span className="text-sm text-slate-400 mr-1">English</span>}
              />
            </div>

            {/* DEVELOPER */}
            <SectionTitle>Developer</SectionTitle>
            <div className="bg-white rounded-2xl overflow-hidden divide-y divide-slate-100">
              {!developerProfile && (
                <Row icon={Rocket} label="Become a Developer" to="/developer/register" iconColor={ACCENT} chevronColor={ACCENT} />
              )}
              {developerProfile && devStatus === 'pending' && (
                <Row
                  icon={Clock}
                  label="Application Under Review"
                  onClick={() => toast.info("We'll notify you once approved.")}
                  iconColor="#D97706"
                  trailing={<span className="text-xs font-semibold text-amber-600 mr-1">Pending</span>}
                />
              )}
              {developerProfile && devStatus === 'rejected' && (
                <Row
                  icon={XCircle}
                  label="Application Rejected"
                  onClick={() => toast.error(developerProfile.rejection_reason || 'Please contact support.')}
                  iconColor="#DC2626"
                />
              )}
              {isApprovedDev && (
                <Row
                  icon={LayoutDashboard}
                  label="Developer Dashboard"
                  to="/developer/dashboard"
                  iconColor={ACCENT}
                  chevronColor={ACCENT}
                  trailing={<CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1" />}
                />
              )}
            </div>

            {/* ADMIN */}
            {isAdmin && (
              <>
                <SectionTitle>Admin</SectionTitle>
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#F3EEFF' }}>
                  <Row icon={Shield} label="Admin Panel" to="/admin" iconColor="#7C3AED" chevronColor="#7C3AED" />
                </div>
              </>
            )}

            {/* LOGOUT */}
            <div className="bg-white rounded-2xl overflow-hidden mt-6">
              <Row icon={LogOut} label="Logout" onClick={handleLogout} danger />
            </div>
          </>
        )}
      </div>

      {/* Edit Profile Sheet */}
      {editOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[80] bg-black/40 flex items-end sm:items-center justify-center"
          onClick={() => setEditOpen(false)}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
            <h3 className="text-lg font-bold mb-4">Edit Profile</h3>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name</label>
            <input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-slate-100 outline-none focus:bg-white focus:ring-2 focus:ring-sky-200 text-[15px]"
              placeholder="Your name"
            />
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditOpen(false)} className="flex-1 h-11 rounded-full bg-slate-100 font-semibold text-sm text-slate-800">Cancel</button>
              <button
                onClick={handleSaveName}
                disabled={savingName || !editingName.trim()}
                className="flex-1 h-11 rounded-full font-semibold text-sm text-white disabled:opacity-60"
                style={{ backgroundColor: ACCENT }}
              >
                {savingName ? 'Saving…' : 'Save'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function StatCard({ label, value, Icon }: { label: string; value: string | number; Icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-2xl p-3.5 flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-xl font-bold mt-0.5 truncate">{value}</p>
      </div>
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#E0EFFF' }}>
        <Icon className="w-5 h-5" style={{ color: ACCENT }} strokeWidth={2.2} />
      </div>
    </div>
  );
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}
