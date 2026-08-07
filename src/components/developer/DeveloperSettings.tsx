import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon, Store, Pencil, Globe, ShieldCheck, Lock,
  Users as UsersIcon, CreditCard, FileText, HelpCircle, LogOut, Camera,
  BadgeCheck, Calendar, ChevronRight, X, Save, Loader2, Trash2, Image as ImageIcon,
  CheckCircle, XCircle, Clock, ExternalLink, Twitter, Github, Facebook, Instagram,
  Unlock, UploadCloud, Eye, EyeOff, Headphones, Palette, MessageCircle, Mail,
  Paperclip, Check, Building2, Phone, Languages, Send, Sparkles,
} from 'lucide-react';
import { PremiumSheet, GradientButton, SheetField, SheetCard } from './PremiumSheet';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, STORAGE_BUCKETS } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/imageCompression';
import { cn } from '@/lib/utils';

const ACCENT = '#0A84FF';
const TEXT = '#111111';
const MUTED = '#666666';
const cardBase =
  'bg-white rounded-[24px] border border-[#EAEAEA] shadow-[0_2px_12px_rgba(15,23,42,0.04)]';

type PanelId =
  | null
  | 'profile'
  | 'studio'
  | 'branding'
  | 'presence'
  | 'verification'
  | 'security'
  | 'access'
  | 'payments'
  | 'legal'
  | 'help';

interface SettingsRow {
  icon: React.ElementType;
  label: string;
  desc: string;
  onClick?: () => void;
  destructive?: boolean;
}

function SettingsGroup({ title, rows }: { title: string; rows: SettingsRow[] }) {
  return (
    <section>
      <h3 className="text-[13px] font-semibold px-1 mb-2" style={{ color: TEXT }}>{title}</h3>
      <div className={cn(cardBase, 'overflow-hidden divide-y divide-[#F1F1F3]')}>
        {rows.map((r) => (
          <button
            key={r.label}
            onClick={r.onClick}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left active:bg-[#F5F5F7] transition-colors"
          >
            <r.icon
              className="w-[22px] h-[22px] shrink-0"
              style={{ color: r.destructive ? '#EF4444' : TEXT }}
              strokeWidth={1.7}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold leading-tight" style={{ color: r.destructive ? '#EF4444' : TEXT }}>
                {r.label}
              </p>
              <p className="text-[12px] mt-0.5 truncate" style={{ color: MUTED }}>{r.desc}</p>
            </div>
            <ChevronRight className="w-[18px] h-[18px] shrink-0" style={{ color: '#C7C7CC' }} strokeWidth={2.2} />
          </button>
        ))}
      </div>
    </section>
  );
}

export function DeveloperSettings() {
  const navigate = useNavigate();
  const { user, developerProfile, refreshDeveloperProfile, logout } = useAuth();
  const { toast } = useToast();

  const [panel, setPanel] = useState<PanelId>(null);
  const [avatarSheetOpen, setAvatarSheetOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const meta = (user?.user_metadata as any) || {};
  const devAny = (developerProfile as any) || {};
  const [avatarUrl, setAvatarUrl] = useState<string | null>(devAny.profile_photo_url || meta.avatar_url || null);
  const [logoUrl, setLogoUrl] = useState<string | null>(devAny.studio_logo_url || meta.logo_url || null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(devAny.banner_url || meta.banner_url || null);

  useEffect(() => {
    const m = (user?.user_metadata as any) || {};
    const d = (developerProfile as any) || {};
    setAvatarUrl(d.profile_photo_url || m.avatar_url || null);
    setLogoUrl(d.studio_logo_url || m.logo_url || null);
    setBannerUrl(d.banner_url || m.banner_url || null);
  }, [user, developerProfile]);

  const displayName = developerProfile?.developer_name || user?.email?.split('@')[0] || 'Developer';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // ============ Avatar Upload ============
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<null | 'avatar' | 'logo' | 'banner'>(null);

  // Each asset has its own bucket + developers table column
  const ASSET_CONFIG = {
    avatar: { bucket: STORAGE_BUCKETS.DEVELOPER_IDS, column: 'profile_photo_url', metaKey: 'avatar_url', label: 'Profile photo' },
    logo: { bucket: STORAGE_BUCKETS.DEVELOPER_BRANDING, column: 'studio_logo_url', metaKey: 'logo_url', label: 'Studio logo' },
    banner: { bucket: STORAGE_BUCKETS.DEVELOPER_BRANDING, column: 'banner_url', metaKey: 'banner_url', label: 'Banner image' },
  } as const;

  const uploadImage = async (
    file: File,
    kind: 'avatar' | 'logo' | 'banner'
  ) => {
    if (!user) return;
    if (!file.type.startsWith('image/')) { toast({ title: 'Invalid file', description: 'Please pick an image.', variant: 'destructive' }); return; }
    if (file.size > 8 * 1024 * 1024) { toast({ title: 'Too large', description: 'Image must be under 8MB.', variant: 'destructive' }); return; }
    const cfg = ASSET_CONFIG[kind];
    setUploading(kind);
    try {
      const compressed = await compressImage(file, 1);
      const ext = (compressed.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${kind}s/${user.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(cfg.bucket)
        .upload(path, compressed, { upsert: true, cacheControl: '3600' });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(cfg.bucket).getPublicUrl(path);
      const publicUrl = data.publicUrl;

      // Persist to developers table
      if (developerProfile?.id) {
        const { error: dbErr } = await supabase
          .from('developers')
          .update({ [cfg.column]: publicUrl, updated_at: new Date().toISOString() } as any)
          .eq('id', developerProfile.id);
        if (dbErr) throw dbErr;
      }
      // Mirror into auth metadata so headers/avatars update instantly
      await supabase.auth.updateUser({ data: { [cfg.metaKey]: publicUrl } });

      if (kind === 'avatar') setAvatarUrl(publicUrl);
      if (kind === 'logo') setLogoUrl(publicUrl);
      if (kind === 'banner') setBannerUrl(publicUrl);

      await refreshDeveloperProfile();
      toast({ title: 'Uploaded', description: `${cfg.label} saved.` });
      setAvatarSheetOpen(false);
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  const removeAvatar = async () => {
    if (!user) return;
    setUploading('avatar');
    try {
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: null } });
      if (error) throw error;
      if (developerProfile?.id) {
        await supabase
          .from('developers')
          .update({ profile_photo_url: null, updated_at: new Date().toISOString() } as any)
          .eq('id', developerProfile.id);
        await refreshDeveloperProfile();
      }
      setAvatarUrl(null);
      toast({ title: 'Removed', description: 'Profile photo removed.' });
      setAvatarSheetOpen(false);
    } catch (err: any) {
      toast({ title: 'Failed', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  // ============ Developer Profile & Studio & Presence forms ============
  const [savingDev, setSavingDev] = useState(false);
  const [devForm, setDevForm] = useState({
    full_name: developerProfile?.full_name || '',
    phone: developerProfile?.phone || '',
    country: developerProfile?.country || '',
    developer_name: developerProfile?.developer_name || '',
    developer_type: developerProfile?.developer_type || 'individual',
    bio: developerProfile?.bio || '',
    website: developerProfile?.website || '',
    support_email: meta.support_email || '',

    twitter: meta.twitter || '',
    github: meta.github || '',
    facebook: meta.facebook || '',
    instagram: meta.instagram || '',
  });

  useEffect(() => {
    setDevForm((p) => ({
      ...p,
      full_name: developerProfile?.full_name || p.full_name,
      phone: developerProfile?.phone || p.phone,
      country: developerProfile?.country || p.country,
      developer_name: developerProfile?.developer_name || p.developer_name,
      developer_type: developerProfile?.developer_type || p.developer_type,
      bio: developerProfile?.bio || p.bio,
      website: developerProfile?.website || p.website,
    }));
  }, [developerProfile]);

  const saveDevFields = async (fields: Partial<typeof devForm>, metaFields?: Record<string, any>) => {
    if (!developerProfile) return;
    setSavingDev(true);
    try {
      if (Object.keys(fields).length > 0) {
        const { error } = await supabase
          .from('developers')
          .update({ ...fields, updated_at: new Date().toISOString() })
          .eq('id', developerProfile.id);
        if (error) throw error;
      }
      if (metaFields && Object.keys(metaFields).length > 0) {
        const { error } = await supabase.auth.updateUser({ data: metaFields });
        if (error) throw error;
      }
      await refreshDeveloperProfile();
      toast({ title: 'Saved', description: 'Your changes have been saved.' });
      setPanel(null);
    } catch (err: any) {
      toast({ title: 'Save failed', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSavingDev(false);
    }
  };

  // ============ Security: password change ============
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwVisible, setPwVisible] = useState({ current: false, next: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  // UI-only premium extras (persisted in auth metadata)
  const [prefs, setPrefs] = useState({
    language: meta.language || 'English',
    timezone: meta.timezone || '(GMT+05:30) Asia/Kolkata',
    accent: meta.brand_accent || '#6C4DFF',
  });
  const [savingBranding, setSavingBranding] = useState(false);

  const pwChecks = useMemo(() => ({
    length: pwForm.next.length >= 8,
    number: /\d/.test(pwForm.next),
    upper: /[A-Z]/.test(pwForm.next),
    special: /[^A-Za-z0-9]/.test(pwForm.next),
  }), [pwForm.next]);
  const pwScore = Object.values(pwChecks).filter(Boolean).length;

  const changePassword = async () => {
    if (pwForm.next.length < 8) { toast({ title: 'Weak password', description: 'Use at least 8 characters.', variant: 'destructive' }); return; }
    if (pwForm.next !== pwForm.confirm) { toast({ title: 'Mismatch', description: 'Passwords do not match.', variant: 'destructive' }); return; }
    setSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.next });
      if (error) throw error;
      toast({ title: 'Password changed', description: 'Your password has been updated.' });
      setPwForm({ current: '', next: '', confirm: '' });
      setPanel(null);
    } catch (err: any) {
      toast({ title: 'Update failed', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSavingPw(false);
    }
  };

  // ============ Help & Support ============
  const [help, setHelp] = useState({ subject: '', message: '' });
  const [sendingHelp, setSendingHelp] = useState(false);
  const submitHelp = async () => {
    if (!help.subject.trim() || !help.message.trim()) {
      toast({ title: 'Missing info', description: 'Add a subject and message.', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Not signed in', description: 'Please sign in to contact support.', variant: 'destructive' });
      return;
    }
    setSendingHelp(true);
    try {
      const { error } = await supabase.from('support_tickets' as any).insert([{
        user_id: user.id,
        email: user.email,
        subject: help.subject.trim(),
        message: help.message.trim(),
        status: 'open',
        created_at: new Date().toISOString(),
      }] as any);
      if (error) throw error;
      toast({ title: 'Message sent successfully!', description: 'Our team will reply within 24 hours.' });
      setHelp({ subject: '', message: '' });
      setPanel(null);
    } catch (err: any) {
      toast({ title: 'Could not send', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSendingHelp(false);
    }
  };

  const verificationStatus = developerProfile?.status || 'pending';

  const openPanel = (id: PanelId) => setPanel(id);
  const closePanel = () => setPanel(null);

  return (
    <div className="space-y-5">
      {/* Hidden file inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'avatar'); e.target.value = ''; }} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'avatar'); e.target.value = ''; }} />
      <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'logo'); e.target.value = ''; }} />
      <input ref={bannerInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'banner'); e.target.value = ''; }} />

      {/* Cover / banner */}
      <div className="relative -mx-4 sm:mx-0 sm:rounded-2xl overflow-visible">
        <div className="relative h-[160px] w-full sm:rounded-2xl overflow-hidden bg-[#EFEFF4]">
          {bannerUrl ? (
            <img src={bannerUrl} alt="Developer cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#F2F2F7] to-[#E5E5EA]" />
          )}
          <button
            onClick={() => bannerInputRef.current?.click()}
            className="absolute top-3 right-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/90 backdrop-blur border border-[#EAEAEA] text-[12px] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.12)] active:scale-95 transition-transform"
            style={{ color: TEXT }}
          >
            <Camera className="w-3.5 h-3.5" strokeWidth={1.8} />
            Edit Cover
          </button>
        </div>

        {/* Profile card overlapping banner */}
        <div className="px-4 sm:px-0 -mt-10 relative">
          <div className={cn(cardBase, 'p-4 sm:p-5 pt-0')}>
            <div className="relative -mt-10">
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <button
                    onClick={() => setAvatarSheetOpen(true)}
                    aria-label="Change profile photo"
                    className="w-[92px] h-[92px] rounded-full overflow-hidden ring-[3px] ring-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold active:scale-95 transition-transform"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{avatarLetter}</span>
                    )}
                  </button>
                  <button
                    onClick={() => setAvatarSheetOpen(true)}
                    aria-label="Change photo"
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] flex items-center justify-center border border-[#EAEAEA] active:scale-95 transition-transform"
                  >
                    <Camera className="w-4 h-4" style={{ color: TEXT }} strokeWidth={1.8} />
                  </button>
                </div>

                <div className="min-w-0 flex-1 pt-11">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-[19px] font-bold leading-tight truncate" style={{ color: TEXT }}>{displayName}</h3>
                      <p className="text-[13px] mt-0.5 truncate" style={{ color: MUTED }}>{developerProfile?.full_name || developerProfile?.email}</p>
                    </div>
                    <button
                      onClick={() => openPanel('profile')}
                      className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[#EAEAEA] bg-white text-[12px] font-semibold active:scale-95 transition-transform"
                      style={{ color: TEXT }}
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                      Edit
                    </button>
                  </div>

                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#EAEAEA] bg-white">
                    <BadgeCheck className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                    <span className="text-[11px] font-semibold" style={{ color: TEXT }}>Verified Developer</span>
                  </div>

                  <div className="flex items-center gap-2.5 mt-2 text-[12px] flex-wrap" style={{ color: MUTED }}>
                    <span className="inline-flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" strokeWidth={1.8} />{developerProfile?.country || 'N/A'}</span>
                    <span className="w-px h-3 bg-[#EAEAEA]" />
                    <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" strokeWidth={1.8} />
                      Joined {developerProfile?.created_at ? new Date(developerProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>



      <SettingsGroup
        title="Account & Profile"
        rows={[
          { icon: UserIcon, label: 'Developer Profile', desc: 'Manage your personal information', onClick: () => openPanel('profile') },
          { icon: Store, label: 'Studio Information', desc: 'Manage your developer or company details', onClick: () => openPanel('studio') },
          { icon: ImageIcon, label: 'Branding', desc: 'Update your logo, banner and profile image', onClick: () => openPanel('branding') },
          { icon: Globe, label: 'Store Presence', desc: 'Website, social links and store details', onClick: () => openPanel('presence') },
          { icon: ShieldCheck, label: 'Verification', desc: 'Manage verification status and documents', onClick: () => openPanel('verification') },
        ]}
      />

      <SettingsGroup
        title="Security & Access"
        rows={[
          { icon: Lock, label: 'Security', desc: 'Change password and account security', onClick: () => openPanel('security') },
          { icon: UsersIcon, label: 'Access & Permissions', desc: 'Manage team members and roles', onClick: () => openPanel('access') },
        ]}
      />

      <SettingsGroup
        title="Other"
        rows={[
          { icon: CreditCard, label: 'Payments & Payouts', desc: 'Manage payout methods and tax info', onClick: () => openPanel('payments') },
          { icon: FileText, label: 'Legal & Policies', desc: 'Agreements, policies and compliance', onClick: () => openPanel('legal') },
          { icon: HelpCircle, label: 'Help & Support', desc: 'Get help and contact support', onClick: () => openPanel('help') },
          { icon: LogOut, label: 'Logout', desc: 'Sign out from your developer account', destructive: true, onClick: () => setLogoutOpen(true) },
        ]}
      />

      {/* ============ Avatar Sheet ============ */}
      <Sheet open={avatarSheetOpen} onOpenChange={setAvatarSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-[28px] p-5 pb-8 border-none bg-white">
          <SheetHeader className="text-left mb-3">
            <SheetTitle style={{ color: '#0A0A0A' }}>Profile Photo</SheetTitle>
            <SheetDescription style={{ color: '#6B7280' }}>Choose how to update your photo</SheetDescription>
          </SheetHeader>
          <div className="space-y-1.5">
            {[
              { icon: Camera, label: 'Take Photo', onClick: () => cameraInputRef.current?.click() },
              { icon: ImageIcon, label: 'Choose from Gallery', onClick: () => galleryInputRef.current?.click() },
              ...(avatarUrl ? [{ icon: Trash2, label: 'Remove Current Photo', onClick: removeAvatar, destructive: true }] : []),
            ].map((a: any) => (
              <button
                key={a.label}
                disabled={!!uploading}
                onClick={a.onClick}
                className="w-full flex items-center gap-3 p-3 rounded-2xl active:bg-[#F5F5F7] transition-colors text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] flex items-center justify-center shrink-0">
                  <a.icon className="w-[18px] h-[18px]" style={{ color: a.destructive ? '#EF4444' : '#0A0A0A' }} strokeWidth={1.8} />
                </div>
                <p className="text-[15px] font-semibold" style={{ color: a.destructive ? '#EF4444' : '#0A0A0A' }}>{a.label}</p>
                {uploading && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* ============ Developer Profile Sheet ============ */}
      <PremiumSheet
        open={panel === 'profile'}
        onClose={closePanel}
        title="Developer Profile"
        description="Manage your personal information"
        icon={<UserIcon className="w-5 h-5 text-[#6C4DFF]" strokeWidth={1.9} />}
        footer={
          <GradientButton
            disabled={savingDev}
            onClick={() => saveDevFields(
              {
                full_name: devForm.full_name.trim(),
                phone: devForm.phone.trim(),
                country: devForm.country.trim(),
              },
              { language: prefs.language, timezone: prefs.timezone }
            )}
          >
            {savingDev ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Save className="w-[18px] h-[18px]" strokeWidth={2} />}
            Save Changes
          </GradientButton>
        }
      >
        {/* Avatar with glowing purple ring */}
        <div className="flex flex-col items-center pt-1 pb-6">
          <div className="relative">
            <div
              className="w-[132px] h-[132px] rounded-full p-[4px]"
              style={{
                background: 'linear-gradient(135deg, #6C4DFF 0%, #A78BFA 50%, #4F46E5 100%)',
                boxShadow: '0 0 0 8px rgba(108,77,255,0.10), 0 14px 34px -12px rgba(108,77,255,0.6)',
              }}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-white p-[3px]">
                <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-[#8B7CFF] to-[#4F46E5] flex items-center justify-center text-white text-4xl font-bold">
                  {avatarUrl ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" /> : <span>{avatarLetter}</span>}
                </div>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setAvatarSheetOpen(true)}
              aria-label="Change photo"
              className="absolute bottom-1 right-1 w-10 h-10 rounded-full flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #6C4DFF, #4F46E5)', boxShadow: '0 8px 20px -6px rgba(108,77,255,0.8)', border: '3px solid #FFFFFF' }}
            >
              {uploading === 'avatar' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-[18px] h-[18px]" strokeWidth={1.9} />}
            </motion.button>
          </div>
          <button
            onClick={() => setAvatarSheetOpen(true)}
            className="mt-4 h-9 px-4 rounded-full text-[13px] font-semibold bg-[#F5F3FF] text-[#4F46E5] border border-[#E9E4FF] active:scale-95 transition-transform"
          >
            Change Photo
          </button>
        </div>

        <div className="space-y-3">
          <InfoField icon={UserIcon} label="Full Name" value={devForm.full_name}
            onChange={(v) => setDevForm((p) => ({ ...p, full_name: v }))} placeholder="Your full name" />
          <InfoField icon={Mail} label="Email" value={developerProfile?.email || user?.email || ''} readOnly verified />
          <InfoField icon={Phone} label="Phone" value={devForm.phone}
            onChange={(v) => setDevForm((p) => ({ ...p, phone: v }))} placeholder="+91 00000 00000"
            verified={!!developerProfile?.phone} />
          <InfoField icon={Globe} label="Country" value={devForm.country}
            onChange={(v) => setDevForm((p) => ({ ...p, country: v }))} placeholder="Country" />
          <InfoField icon={Languages} label="Language" value={prefs.language}
            onChange={(v) => setPrefs((p) => ({ ...p, language: v }))} placeholder="English" />
          <InfoField icon={Clock} label="Time Zone" value={prefs.timezone}
            onChange={(v) => setPrefs((p) => ({ ...p, timezone: v }))} placeholder="(GMT+05:30) Asia/Kolkata" />
        </div>
      </PremiumSheet>

      {/* ============ Studio Information Sheet ============ */}
      <PremiumSheet
        open={panel === 'studio'}
        onClose={closePanel}
        title="Studio Information"
        description="Manage your developer or company details"
        icon={<Building2 className="w-5 h-5 text-[#6C4DFF]" strokeWidth={1.9} />}
        footer={
          <GradientButton
            disabled={savingDev}
            onClick={() => saveDevFields(
              {
                developer_name: devForm.developer_name.trim(),
                developer_type: devForm.developer_type as any,
                bio: devForm.bio.trim(),
                website: devForm.website.trim(),
              },
              { support_email: devForm.support_email.trim() }
            )}
          >
            {savingDev ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <ShieldCheck className="w-[18px] h-[18px]" strokeWidth={2} />}
            Save Studio
          </GradientButton>
        }
      >
        <div className="space-y-5">
          <SheetField label="Studio Logo">
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-square rounded-[20px] overflow-hidden border border-[#ECECEC] bg-[#0B1020] flex items-center justify-center">
                {logoUrl ? <img src={logoUrl} alt="Studio logo" className="w-full h-full object-cover" />
                  : <Sparkles className="w-8 h-8 text-white/40" strokeWidth={1.6} />}
              </div>
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploading === 'logo'}
                className="aspect-square rounded-[20px] border border-dashed border-[#DCD7FF] bg-[#FBFAFF] flex flex-col items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
              >
                {uploading === 'logo'
                  ? <Loader2 className="w-6 h-6 animate-spin text-[#6C4DFF]" />
                  : <UploadCloud className="w-7 h-7 text-[#6C4DFF]" strokeWidth={1.7} />}
                <span className="text-[13px] font-semibold text-[#4F46E5]">Upload / Replace</span>
                <span className="text-[11px] text-[#9CA3AF]">PNG, JPG • Max 2MB</span>
              </button>
            </div>
          </SheetField>

          <SheetField label="Studio / Developer Name">
            <PremiumInput icon={Store} value={devForm.developer_name}
              onChange={(v) => setDevForm((p) => ({ ...p, developer_name: v }))} placeholder="Elora X Studio" />
          </SheetField>

          <SheetField label="Type">
            <div className="grid grid-cols-2 gap-2 p-1 rounded-[18px] bg-[#F5F5F7] border border-[#ECECEC]">
              {([
                { id: 'individual', label: 'Individual', icon: UserIcon },
                { id: 'company', label: 'Company', icon: Building2 },
              ] as const).map((t) => {
                const active = devForm.developer_type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDevForm((p) => ({ ...p, developer_type: t.id }))}
                    className="relative h-12 rounded-[14px] text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors"
                    style={active
                      ? { background: 'linear-gradient(135deg, #6C4DFF, #4F46E5)', color: '#FFFFFF', boxShadow: '0 8px 18px -8px rgba(108,77,255,0.7)' }
                      : { color: '#111111' }}
                  >
                    <t.icon className="w-4 h-4" strokeWidth={1.9} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </SheetField>

          <SheetField label="Bio">
            <div className="relative">
              <Textarea
                rows={5}
                maxLength={200}
                value={devForm.bio}
                onChange={(e) => setDevForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Tell users about your studio..."
                className="rounded-[18px] border-[#ECECEC] bg-white text-[#111111] p-4 pb-8 text-[14px] resize-none focus-visible:ring-2 focus-visible:ring-[#6C4DFF]/30 focus-visible:border-[#6C4DFF]"
              />
              <span className="absolute bottom-3 right-4 text-[11px] font-medium text-[#9CA3AF]">{devForm.bio.length}/200</span>
            </div>
          </SheetField>

          <SheetField label="Website">
            <PremiumInput icon={Globe} value={devForm.website}
              onChange={(v) => setDevForm((p) => ({ ...p, website: v }))} placeholder="https://elorax.studio" />
          </SheetField>

          <SheetField label="Support Email">
            <PremiumInput icon={Mail} value={devForm.support_email}
              onChange={(v) => setDevForm((p) => ({ ...p, support_email: v }))} placeholder="support@elorax.studio" />
          </SheetField>
        </div>
      </PremiumSheet>

      {/* ============ Branding Sheet ============ */}
      <PremiumSheet
        open={panel === 'branding'}
        onClose={closePanel}
        title="Branding"
        description="Customize your brand identity"
        icon={<Palette className="w-5 h-5 text-[#EC4899]" strokeWidth={1.9} />}
        footer={
          <GradientButton
            gradient="pink"
            disabled={savingBranding}
            onClick={async () => {
              setSavingBranding(true);
              try {
                const { error } = await supabase.auth.updateUser({ data: { brand_accent: prefs.accent } });
                if (error) throw error;
                toast({ title: 'Branding saved', description: 'Your brand identity has been updated.' });
                setPanel(null);
              } catch (err: any) {
                toast({ title: 'Save failed', description: err?.message || 'Please try again.', variant: 'destructive' });
              } finally {
                setSavingBranding(false);
              }
            }}
          >
            {savingBranding ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Palette className="w-[18px] h-[18px]" strokeWidth={2} />}
            Save Branding
          </GradientButton>
        }
      >
        <div className="space-y-5">
          <SheetField label="Banner Image">
            <div className="relative h-[120px] rounded-[20px] overflow-hidden border border-[#ECECEC] bg-gradient-to-br from-[#0B1020] via-[#4F46E5] to-[#EC4899]">
              {bannerUrl && <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => bannerInputRef.current?.click()}
                aria-label="Replace banner"
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.22)]"
              >
                {uploading === 'banner' ? <Loader2 className="w-4 h-4 animate-spin text-[#4F46E5]" /> : <Pencil className="w-4 h-4 text-[#4F46E5]" strokeWidth={2} />}
              </motion.button>
            </div>
            <button
              onClick={() => bannerInputRef.current?.click()}
              className="mt-3 w-full h-[62px] rounded-[18px] border border-dashed border-[#DCD7FF] bg-[#FBFAFF] flex flex-col items-center justify-center active:scale-[0.99] transition-transform"
            >
              <span className="text-[13.5px] font-semibold text-[#4F46E5] inline-flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5" strokeWidth={2} /> Replace Banner
              </span>
              <span className="text-[11px] text-[#9CA3AF] mt-0.5">JPG, PNG • Recommended 1200x400</span>
            </button>
          </SheetField>

          <BrandAssetRow
            label="Studio Logo" hint="PNG, JPG • Max 2MB" url={logoUrl} shape="square"
            uploading={uploading === 'logo'} onPick={() => logoInputRef.current?.click()} cta={logoUrl ? 'Replace Logo' : 'Upload Logo'}
          />
          <BrandAssetRow
            label="Profile Photo" hint="PNG, JPG • Max 2MB" url={avatarUrl} shape="circle"
            uploading={uploading === 'avatar'} onPick={() => galleryInputRef.current?.click()} cta={avatarUrl ? 'Replace Photo' : 'Upload Photo'}
          />

          <SheetField label="Brand Accent Color">
            <div className="flex items-center gap-3">
              {['#6C4DFF', '#4F46E5', '#10B981', '#F97316', '#EC4899'].map((c) => (
                <motion.button
                  key={c}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setPrefs((p) => ({ ...p, accent: c }))}
                  aria-label={`Accent ${c}`}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: c, boxShadow: prefs.accent === c ? `0 0 0 4px ${c}33` : '0 4px 12px rgba(15,23,42,0.14)' }}
                >
                  {prefs.accent === c && <Check className="w-5 h-5 text-white" strokeWidth={3} />}
                </motion.button>
              ))}
            </div>
          </SheetField>

          <SheetField label="Brand Preview">
            <SheetCard className="p-4 flex items-center gap-3" >
              <div className="w-12 h-12 rounded-[14px] overflow-hidden bg-[#0B1020] flex items-center justify-center shrink-0">
                {logoUrl ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
                  : <Sparkles className="w-5 h-5 text-white/50" />}
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-[#111111] truncate">{devForm.developer_name || displayName}</p>
                <p className="text-[12.5px] inline-flex items-center gap-1.5" style={{ color: prefs.accent }}>
                  Premium Developer <BadgeCheck className="w-3.5 h-3.5" />
                </p>
              </div>
            </SheetCard>
          </SheetField>
        </div>
      </PremiumSheet>

      {/* ============ Store Presence Sheet ============ */}
      <PremiumSheet
        open={panel === 'presence'}
        onClose={closePanel}
        title="Store Presence"
        description="Website and social links"
        icon={<Globe className="w-5 h-5 text-[#6C4DFF]" strokeWidth={1.9} />}
        footer={
          <GradientButton
            disabled={savingDev}
            onClick={() => saveDevFields(
              { website: devForm.website.trim() },
              {
                twitter: devForm.twitter.trim(),
                github: devForm.github.trim(),
                instagram: devForm.instagram.trim(),
                facebook: devForm.facebook.trim(),
              }
            )}
          >
            {savingDev ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Save className="w-[18px] h-[18px]" strokeWidth={2} />}
            Save Changes
          </GradientButton>
        }
      >
        <div className="space-y-4">
          <SheetField label="Website">
            <PremiumInput icon={Globe} value={devForm.website} onChange={(v) => setDevForm((p) => ({ ...p, website: v }))} placeholder="https://yourstudio.com" />
          </SheetField>
          <SheetField label="Twitter / X">
            <PremiumInput icon={Twitter} value={devForm.twitter} onChange={(v) => setDevForm((p) => ({ ...p, twitter: v }))} placeholder="@handle" />
          </SheetField>
          <SheetField label="GitHub">
            <PremiumInput icon={Github} value={devForm.github} onChange={(v) => setDevForm((p) => ({ ...p, github: v }))} placeholder="username" />
          </SheetField>
          <SheetField label="Instagram">
            <PremiumInput icon={Instagram} value={devForm.instagram} onChange={(v) => setDevForm((p) => ({ ...p, instagram: v }))} placeholder="@handle" />
          </SheetField>
          <SheetField label="Facebook">
            <PremiumInput icon={Facebook} value={devForm.facebook} onChange={(v) => setDevForm((p) => ({ ...p, facebook: v }))} placeholder="page-name" />
          </SheetField>
        </div>
      </PremiumSheet>

      {/* ============ Verification Sheet ============ */}
      <PremiumSheet
        open={panel === 'verification'}
        onClose={closePanel}
        title="Verification"
        description="Your account verification status"
        icon={<ShieldCheck className="w-5 h-5 text-[#10B981]" strokeWidth={1.9} />}
      >
        <SheetCard className="p-5 flex flex-col items-center text-center">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center mb-3',
            verificationStatus === 'approved' ? 'bg-green-50' :
              verificationStatus === 'rejected' ? 'bg-red-50' : 'bg-amber-50'
          )}>
            {verificationStatus === 'approved' ? <CheckCircle className="w-8 h-8 text-green-600" strokeWidth={1.8} /> :
              verificationStatus === 'rejected' ? <XCircle className="w-8 h-8 text-red-500" strokeWidth={1.8} /> :
              <Clock className="w-8 h-8 text-amber-500" strokeWidth={1.8} />}
          </div>
          <p className="text-[17px] font-bold capitalize" style={{ color: TEXT }}>{verificationStatus}</p>
          <p className="text-[13px] mt-1" style={{ color: MUTED }}>
            {verificationStatus === 'approved'
              ? 'Your developer account has been verified.'
              : verificationStatus === 'rejected'
              ? developerProfile?.rejection_reason || 'Your application was not approved.'
              : 'Your application is being reviewed.'}
          </p>
        </SheetCard>

        <SheetCard className="mt-3 p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F1F3]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Verification Details</p>
              <p className="text-[15px] font-bold mt-0.5" style={{ color: TEXT }}>Account Overview</p>
            </div>
            {verificationStatus === 'approved' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" strokeWidth={2.2} />
                <span className="text-[11px] font-semibold text-green-700">Verified Developer</span>
              </span>
            )}
          </div>
          <div className="space-y-2.5 pt-1">
            <LightRow k="Verification Status" v={verificationStatus} highlight={verificationStatus === 'approved' ? 'green' : verificationStatus === 'rejected' ? 'red' : 'amber'} />
            <LightRow k="Developer Name" v={developerProfile?.developer_name || developerProfile?.full_name || '—'} />
            <LightRow k="Developer Type" v={developerProfile?.developer_type || '—'} />
            <LightRow k="Developer ID" v={developerProfile?.id ? developerProfile.id.slice(0, 8).toUpperCase() : '—'} mono />
            <LightRow k="Country" v={developerProfile?.country || '—'} />
            <LightRow k="Verified Email" v={developerProfile?.email || '—'} />
            <LightRow k="Verified Phone" v={developerProfile?.phone || '—'} />
            <LightRow
              k="Form Submitted On"
              v={developerProfile?.created_at
                ? `${new Date(developerProfile.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} • ${new Date(developerProfile.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                : '—'}
            />
            <LightRow
              k="Verified On"
              v={verificationStatus === 'approved' && developerProfile?.updated_at
                ? `${new Date(developerProfile.updated_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} • ${new Date(developerProfile.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                : 'Pending'}
            />
            <LightRow
              k="Verified Since"
              v={verificationStatus === 'approved' && developerProfile?.updated_at
                ? `${new Date(developerProfile.updated_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} • ${new Date(developerProfile.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                : 'Pending'}
            />
            <LightRow k="Verification Method" v="Government ID + Email" />
            <LightRow k="Account Status" v={verificationStatus === 'approved' ? 'Active' : 'Pending Review'} highlight={verificationStatus === 'approved' ? 'green' : 'amber'} />
          </div>
        </SheetCard>
      </PremiumSheet>

      {/* ============ Security Sheet ============ */}
      <PremiumSheet
        open={panel === 'security'}
        onClose={closePanel}
        title="Security"
        description="Change your account password"
        icon={<ShieldCheck className="w-5 h-5 text-[#10B981]" strokeWidth={1.9} />}
        footer={
          <GradientButton gradient="green" disabled={savingPw || !pwForm.next || !pwForm.confirm} onClick={changePassword}>
            {savingPw ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Lock className="w-[18px] h-[18px]" strokeWidth={2} />}
            Update Password
          </GradientButton>
        }
      >
        <div className="rounded-[20px] p-6 text-center mb-5" style={{ background: 'linear-gradient(160deg, #ECFDF5 0%, #F0FDFA 100%)', border: '1px solid #D1FAE5' }}>
          <div className="w-[74px] h-[74px] mx-auto rounded-[24px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #34D399, #059669)', boxShadow: '0 14px 30px -12px rgba(5,150,105,0.7)' }}>
            <Lock className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <p className="text-[16px] font-bold text-[#111111] mt-3">Keep your account secure</p>
          <p className="text-[13px] text-[#6B7280] mt-1">Use a strong password that you don't use on other websites.</p>
        </div>

        <div className="space-y-4">
          <SheetField label="Current Password">
            <PasswordInput value={pwForm.current} onChange={(v) => setPwForm((p) => ({ ...p, current: v }))}
              visible={pwVisible.current} toggle={() => setPwVisible((p) => ({ ...p, current: !p.current }))}
              placeholder="Enter current password" />
          </SheetField>
          <SheetField label="New Password">
            <PasswordInput value={pwForm.next} onChange={(v) => setPwForm((p) => ({ ...p, next: v }))}
              visible={pwVisible.next} toggle={() => setPwVisible((p) => ({ ...p, next: !p.next }))}
              placeholder="Enter new password" />
            <div className="flex items-center gap-2 mt-2.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[5px] flex-1 rounded-full overflow-hidden bg-[#EFEFF4]">
                  <motion.div
                    className="h-full rounded-full"
                    initial={false}
                    animate={{ width: pwScore > i ? '100%' : '0%' }}
                    transition={{ duration: 0.25 }}
                    style={{ background: pwScore <= 1 ? '#EF4444' : pwScore === 2 ? '#F59E0B' : pwScore === 3 ? '#84CC16' : '#10B981' }}
                  />
                </div>
              ))}
              <span className="text-[11.5px] font-semibold w-[52px] text-right"
                style={{ color: pwScore <= 1 ? '#EF4444' : pwScore === 2 ? '#F59E0B' : pwScore === 3 ? '#65A30D' : '#059669' }}>
                {pwForm.next ? (pwScore <= 1 ? 'Weak' : pwScore === 2 ? 'Fair' : pwScore === 3 ? 'Good' : 'Strong') : ''}
              </span>
            </div>
          </SheetField>
          <SheetField label="Confirm Password">
            <PasswordInput value={pwForm.confirm} onChange={(v) => setPwForm((p) => ({ ...p, confirm: v }))}
              visible={pwVisible.confirm} toggle={() => setPwVisible((p) => ({ ...p, confirm: !p.confirm }))}
              placeholder="Confirm new password" />
          </SheetField>

          <div className="rounded-[20px] p-4 space-y-2.5" style={{ background: '#F7FDF9', border: '1px solid #E4F5EA' }}>
            {[
              { ok: pwChecks.length, label: 'At least 8 characters' },
              { ok: pwChecks.number, label: 'Include a number' },
              { ok: pwChecks.upper, label: 'Include an uppercase letter' },
              { ok: pwChecks.special, label: 'Include a special character' },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-2.5">
                <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center transition-colors"
                  style={{ background: c.ok ? '#10B981' : '#E5E7EB' }}>
                  <Check className="w-3 h-3 text-white" strokeWidth={3.2} />
                </span>
                <span className="text-[13px] font-medium" style={{ color: c.ok ? '#111111' : '#9CA3AF' }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </PremiumSheet>

      {/* ============ Access & Permissions Sheet ============ */}
      <PremiumSheet open={panel === 'access'} onClose={closePanel} title="Access & Permissions" description="Team members and roles"
        icon={<UsersIcon className="w-5 h-5 text-[#6C4DFF]" strokeWidth={1.9} />}>
        <ComingSoon icon={UsersIcon} title="Team access coming soon"
          desc="Soon you'll be able to invite team members and assign granular roles like Admin, Editor, and Viewer to collaborate on your apps." />
      </PremiumSheet>

      {/* ============ Payments Sheet ============ */}
      <PremiumSheet open={panel === 'payments'} onClose={closePanel} title="Payments & Payouts" description="Payout methods and tax info"
        icon={<CreditCard className="w-5 h-5 text-[#6C4DFF]" strokeWidth={1.9} />}>
        <ComingSoon icon={CreditCard} title="Payouts coming soon"
          desc="Connect a bank account or payment provider to receive earnings from paid apps and in-app purchases." />
      </PremiumSheet>

      {/* ============ Legal Sheet ============ */}
      <PremiumSheet open={panel === 'legal'} onClose={closePanel} title="Legal & Policies" description="Agreements and compliance"
        icon={<FileText className="w-5 h-5 text-[#6C4DFF]" strokeWidth={1.9} />}>
        <SheetCard className="overflow-hidden divide-y divide-[#F1F1F3]">
          {[
            { label: 'Developer Agreement', url: 'https://elorax.app/legal/developer-agreement' },
            { label: 'Terms of Service', url: 'https://elorax.app/legal/terms' },
            { label: 'Privacy Policy', url: 'https://elorax.app/legal/privacy' },
            { label: 'Content Guidelines', url: 'https://elorax.app/legal/guidelines' },
          ].map((l) => (
            <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
              className="flex items-center justify-between px-4 py-3.5 active:bg-[#F5F5F7]">
              <span className="text-[15px] font-semibold" style={{ color: TEXT }}>{l.label}</span>
              <ExternalLink className="w-4 h-4" style={{ color: MUTED }} />
            </a>
          ))}
        </SheetCard>
      </PremiumSheet>

      {/* ============ Help & Support Sheet ============ */}
      <PremiumSheet
        open={panel === 'help'}
        onClose={closePanel}
        title="Help & Support"
        description="We usually respond within 24 hours"
        icon={<Headphones className="w-5 h-5 text-[#F97316]" strokeWidth={1.9} />}
        footer={
          <GradientButton gradient="orange" disabled={sendingHelp} onClick={submitHelp}>
            {sendingHelp ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Send className="w-[18px] h-[18px]" strokeWidth={2} />}
            Send Message
          </GradientButton>
        }
      >
        <div className="rounded-[20px] p-6 text-center mb-5" style={{ background: 'linear-gradient(160deg, #FFF7ED 0%, #FEF2F2 100%)', border: '1px solid #FFEDD5' }}>
          <div className="w-[74px] h-[74px] mx-auto rounded-[24px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FDBA74, #F97316)', boxShadow: '0 14px 30px -12px rgba(249,115,22,0.7)' }}>
            <Headphones className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <p className="text-[16px] font-bold text-[#111111] mt-3">How can we help?</p>
          <p className="text-[13px] text-[#6B7280] mt-1">Our support team replies within 24 hours.</p>
        </div>

        <div className="space-y-4">
          <SheetField label="Subject">
            <select
              value={help.subject}
              onChange={(e) => setHelp((p) => ({ ...p, subject: e.target.value }))}
              className="w-full h-[54px] rounded-[18px] border border-[#ECECEC] bg-white px-4 text-[14px] text-[#111111] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/25 appearance-none"
              style={{ backgroundImage: 'none' }}
            >
              <option value="">Select a subject</option>
              {['App review issue', 'Account & verification', 'Payments & payouts', 'Technical problem', 'Other'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </SheetField>

          <SheetField label="Message">
            <div className="relative">
              <Textarea
                rows={6}
                maxLength={1000}
                value={help.message}
                onChange={(e) => setHelp((p) => ({ ...p, message: e.target.value }))}
                placeholder="Describe your issue in detail..."
                className="rounded-[18px] border-[#ECECEC] bg-white text-[#111111] p-4 pb-8 text-[14px] resize-none focus-visible:ring-2 focus-visible:ring-[#F97316]/25 focus-visible:border-[#F97316]"
              />
              <span className="absolute bottom-3 right-4 text-[11px] font-medium text-[#9CA3AF]">{help.message.length}/1000</span>
            </div>
          </SheetField>

          <SheetField label="Attach Screenshot (Optional)">
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="w-full h-[62px] rounded-[18px] border border-dashed border-[#FFD8B5] bg-[#FFFBF7] flex flex-col items-center justify-center active:scale-[0.99] transition-transform"
            >
              <span className="text-[13.5px] font-semibold text-[#EA580C] inline-flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" strokeWidth={2} /> Tap to upload a screenshot
              </span>
              <span className="text-[11px] text-[#9CA3AF] mt-0.5">PNG, JPG • Max 5MB</span>
            </button>
          </SheetField>

          <SheetCard className="overflow-hidden divide-y divide-[#F1F1F3]">
            <SupportRow icon={HelpCircle} title="View FAQs" sub="Find answers to common questions" href="https://elorax.app/faq" />
            <SupportRow icon={MessageCircle} title="Live Chat" sub="Chat with our support team" badge="Online" href="https://elorax.app/chat" />
            <SupportRow icon={Mail} title="Email Us" sub="support@elorax.app" href="mailto:support@elorax.app" />
          </SheetCard>
        </div>
      </PremiumSheet>


      {/* ============ Logout Confirm ============ */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to sign in again to access your Developer Console.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-red-500 hover:bg-red-600 text-white"
              onClick={async () => {
                setLogoutOpen(false);
                try { await logout(); } catch { window.location.href = '/login'; }
              }}
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


// ============ Helpers ============
function LightRow({ k, v, mono, highlight }: { k: string; v: string; mono?: boolean; highlight?: 'green' | 'red' | 'amber' }) {
  const color =
    highlight === 'green' ? '#16A34A' :
    highlight === 'red' ? '#DC2626' :
    highlight === 'amber' ? '#B45309' : TEXT;
  return (
    <div className="flex items-start justify-between gap-3 text-[13px]">
      <span className="text-[#6B7280] shrink-0">{k}</span>
      <span
        className={cn('font-semibold text-right capitalize break-all', mono && 'font-mono tracking-wide uppercase')}
        style={{ color }}
      >
        {v}
      </span>
    </div>
  );
}

function PremiumInput({
  icon: Icon, value, onChange, placeholder, type = 'text', readOnly,
}: {
  icon?: React.ElementType; value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; readOnly?: boolean;
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#6B7280] z-10" strokeWidth={1.8} />
      )}
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full h-[54px] rounded-[18px] border border-[#ECECEC] bg-white text-[14px] text-[#111111] placeholder:text-[#9CA3AF] outline-none transition-all duration-200',
          'focus:border-[#6C4DFF] focus:ring-[3px] focus:ring-[#6C4DFF]/18 focus:shadow-[0_6px_18px_-10px_rgba(108,77,255,0.6)]',
          Icon ? 'pl-12 pr-4' : 'px-4',
          readOnly && 'bg-[#FAFAFB] text-[#6B7280]'
        )}
      />
    </div>
  );
}

function PasswordInput({
  value, onChange, visible, toggle, placeholder,
}: { value: string; onChange: (v: string) => void; visible: boolean; toggle: () => void; placeholder?: string }) {
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-[54px] rounded-[18px] border border-[#ECECEC] bg-white pl-4 pr-12 text-[14px] text-[#111111] placeholder:text-[#9CA3AF] outline-none transition-all duration-200 focus:border-[#10B981] focus:ring-[3px] focus:ring-[#10B981]/18"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-4 top-1/2 -translate-y-1/2 active:scale-90 transition-transform"
      >
        {visible
          ? <EyeOff className="w-[18px] h-[18px] text-[#6B7280]" strokeWidth={1.8} />
          : <Eye className="w-[18px] h-[18px] text-[#6B7280]" strokeWidth={1.8} />}
      </button>
    </div>
  );
}

function InfoField({
  icon: Icon, label, value, onChange, placeholder, readOnly, verified,
}: {
  icon: React.ElementType; label: string; value: string;
  onChange?: (v: string) => void; placeholder?: string; readOnly?: boolean; verified?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-[#ECECEC] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.04)] px-4 py-3 flex items-center gap-3.5 transition-shadow focus-within:border-[#6C4DFF] focus-within:shadow-[0_8px_22px_-12px_rgba(108,77,255,0.55)]">
      <div className="w-9 h-9 rounded-[12px] bg-[#F5F3FF] flex items-center justify-center shrink-0">
        <Icon className="w-[18px] h-[18px] text-[#4F46E5]" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11.5px] font-semibold text-[#9CA3AF]">{label}</p>
        <input
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-[15px] font-semibold text-[#111111] placeholder:font-normal placeholder:text-[#C7C7CC] mt-0.5"
        />
      </div>
      {verified && (
        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#ECFDF5] border border-[#D1FAE5]">
          <BadgeCheck className="w-3 h-3 text-[#059669]" strokeWidth={2.4} />
          <span className="text-[10.5px] font-semibold text-[#059669]">Verified</span>
        </span>
      )}
    </div>
  );
}

function BrandAssetRow({
  label, hint, url, shape, uploading, onPick, cta,
}: {
  label: string; hint: string; url: string | null; shape: 'circle' | 'square';
  uploading: boolean; onPick: () => void; cta: string;
}) {
  return (
    <div>
      <p className="text-[12.5px] font-semibold text-[#6B7280] mb-2">{label}</p>
      <div className="grid grid-cols-[104px_1fr] gap-3">
        <div className="relative">
          <div className={cn(
            'w-full h-[104px] overflow-hidden border border-[#ECECEC] bg-[#0B1020] flex items-center justify-center',
            shape === 'circle' ? 'rounded-full' : 'rounded-[20px]'
          )}>
            {url ? <img src={url} alt={label} className="w-full h-full object-cover" />
              : <ImageIcon className="w-6 h-6 text-white/40" strokeWidth={1.6} />}
          </div>
          <button
            onClick={onPick}
            aria-label={cta}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white border-[2.5px] border-white"
            style={{ background: 'linear-gradient(135deg, #6C4DFF, #4F46E5)' }}
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" strokeWidth={2.2} />}
          </button>
        </div>
        <button
          onClick={onPick}
          disabled={uploading}
          className="rounded-[20px] border border-dashed border-[#DCD7FF] bg-[#FBFAFF] flex flex-col items-center justify-center gap-1 active:scale-[0.99] transition-transform"
        >
          {uploading
            ? <Loader2 className="w-5 h-5 animate-spin text-[#6C4DFF]" />
            : <UploadCloud className="w-6 h-6 text-[#6C4DFF]" strokeWidth={1.7} />}
          <span className="text-[13.5px] font-semibold text-[#4F46E5]">{cta}</span>
          <span className="text-[11px] text-[#9CA3AF]">{hint}</span>
        </button>
      </div>
    </div>
  );
}

function SupportRow({
  icon: Icon, title, sub, badge, href,
}: { icon: React.ElementType; title: string; sub: string; badge?: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3.5 active:bg-[#F9F9FB]">
      <div className="w-9 h-9 rounded-[12px] bg-[#F5F5F7] flex items-center justify-center shrink-0">
        <Icon className="w-[18px] h-[18px] text-[#111111]" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14.5px] font-semibold text-[#111111] truncate">{title}</p>
        <p className="text-[12px] text-[#6B7280] truncate">{sub}</p>
      </div>
      {badge && (
        <span className="shrink-0 px-2 py-1 rounded-full bg-[#ECFDF5] border border-[#D1FAE5] text-[10.5px] font-semibold text-[#059669]">{badge}</span>
      )}
      <ChevronRight className="w-4 h-4 text-[#C7C7CC] shrink-0" strokeWidth={2.2} />
    </a>
  );
}

function ComingSoon({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="p-7 text-center rounded-[20px] border border-[#ECECEC] bg-white shadow-[0_2px_14px_rgba(15,23,42,0.05)]">
      <div className="w-16 h-16 rounded-[20px] mx-auto flex items-center justify-center mb-3"
        style={{ background: 'linear-gradient(135deg, #8B7CFF, #4F46E5)', boxShadow: '0 12px 26px -12px rgba(108,77,255,0.7)' }}>
        <Icon className="w-7 h-7 text-white" strokeWidth={1.8} />
      </div>
      <p className="text-[16.5px] font-bold text-[#111111]">{title}</p>
      <p className="text-[13px] mt-1.5 text-[#6B7280] leading-relaxed">{desc}</p>
    </div>
  );
}
