import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Code, LayoutDashboard, Shield, LogIn, UserPlus, LogOut, Pencil, CheckCircle2, Clock, XCircle, ChevronRight, Mail, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ACCENT = '#0EA5E9';

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, developerProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    (user?.user_metadata as any)?.avatar_url || null
  );
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState<string>(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    setAvatarUrl((user?.user_metadata as any)?.avatar_url || null);
    setName(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
  }, [user]);

  const handlePickFile = () => fileRef.current?.click();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `avatars/${user.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('app-icons')
        .upload(path, file, { upsert: true, cacheControl: '3600' });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('app-icons').getPublicUrl(path);
      const publicUrl = data.publicUrl;
      const { error: updErr } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });
      if (updErr) throw updErr;
      setAvatarUrl(publicUrl);
      toast.success('Profile photo updated');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
      if (error) throw error;
      toast.success('Name updated');
      setEditingName(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSavingName(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const initials = (name || user?.email || '?').slice(0, 1).toUpperCase();

  const devStatus = developerProfile?.status;

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden text-slate-900" style={{ backgroundColor: '#F2F2F7', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
      <div className="w-full max-w-2xl mx-auto px-5 pt-6 pb-28">
        {/* Header */}
        <header className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate('/')}
            aria-label="Back"
            className="p-2 -ml-2 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-900" strokeWidth={2.5} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        </header>

        {!isAuthenticated ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <UserIcon className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-lg font-bold mb-1">You're not signed in</h2>
            <p className="text-sm text-slate-500 mb-5">Sign in to manage your profile and become a developer.</p>
            <div className="flex flex-col gap-2">
              <Link to="/login">
                <Button className="w-full justify-center gap-2 text-white" style={{ backgroundColor: ACCENT }}>
                  <LogIn className="w-4 h-4" /> Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" className="w-full justify-center gap-2">
                  <UserPlus className="w-4 h-4" /> Create Account
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Avatar card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col items-center text-center mb-4"
            >
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br flex items-center justify-center text-white text-3xl font-bold"
                  style={{ backgroundImage: `linear-gradient(135deg, ${ACCENT}, #0284C7)` }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <button
                  onClick={handlePickFile}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md disabled:opacity-60"
                  style={{ backgroundColor: ACCENT }}
                  aria-label="Change photo"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
              </div>

              <div className="mt-4 w-full">
                {editingName ? (
                  <div className="flex items-center gap-2 justify-center">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-center font-semibold text-slate-900 outline-none focus:border-sky-400"
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="text-sm font-semibold px-3 py-1.5 rounded-lg text-white"
                      style={{ backgroundColor: ACCENT }}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingName(true)}
                    className="inline-flex items-center gap-1.5 group"
                  >
                    <h2 className="text-xl font-bold text-slate-900">{name || 'Add your name'}</h2>
                    <Pencil className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                  </button>
                )}
                <p className="text-sm text-slate-500 mt-1 flex items-center justify-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {user?.email}
                </p>
              </div>

              <button
                onClick={handlePickFile}
                className="mt-4 text-sm font-semibold"
                style={{ color: ACCENT }}
              >
                {avatarUrl ? 'Change photo' : 'Add photo'}
              </button>
            </motion.div>

            {/* Developer section */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-4">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Developer</h3>
              </div>

              {!developerProfile && (
                <Link
                  to="/developer/register"
                  className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E0EAFF', color: ACCENT }}>
                    <Code className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">Become a Developer</p>
                    <p className="text-xs text-slate-500">Publish your own apps on EloraX</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </Link>
              )}

              {developerProfile && devStatus === 'pending' && (
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">Application Under Review</p>
                    <p className="text-xs text-slate-500">We'll notify you once approved.</p>
                  </div>
                </div>
              )}

              {developerProfile && devStatus === 'rejected' && (
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 text-red-600">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">Application Rejected</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{developerProfile.rejection_reason || 'Please contact support.'}</p>
                  </div>
                </div>
              )}

              {developerProfile && devStatus === 'approved' && (
                <Link
                  to="/developer/dashboard"
                  className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                      Developer Dashboard <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </p>
                    <p className="text-xs text-slate-500">Manage your published apps</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </Link>
              )}
            </div>

            {isAdmin && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-4">
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">Admin Panel</p>
                    <p className="text-xs text-slate-500">Manage users, apps and developers</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </Link>
              </div>
            )}

            <Button
              onClick={handleLogout}
              className="w-full justify-center gap-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20"
            >
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
