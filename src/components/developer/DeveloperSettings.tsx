import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, User as UserIcon, Store, Pencil, Globe, ShieldCheck, Lock,
  Users as UsersIcon, CreditCard, FileText, HelpCircle, LogOut, Camera,
  BadgeCheck, Calendar, ChevronRight, X, Save, Loader2, Trash2, Image as ImageIcon,
  CheckCircle, XCircle, Clock, ExternalLink, Twitter, Github, Facebook, Instagram,
  Unlock,
} from 'lucide-react';
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(meta.avatar_url || null);
  const [logoUrl, setLogoUrl] = useState<string | null>(meta.logo_url || null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(meta.banner_url || null);

  useEffect(() => {
    const m = (user?.user_metadata as any) || {};
    setAvatarUrl(m.avatar_url || null);
    setLogoUrl(m.logo_url || null);
    setBannerUrl(m.banner_url || null);
  }, [user]);

  const displayName = developerProfile?.developer_name || user?.email?.split('@')[0] || 'Developer';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // ============ Avatar Upload ============
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (
    file: File,
    kind: 'avatar' | 'logo' | 'banner'
  ) => {
    if (!user) return;
    if (!file.type.startsWith('image/')) { toast({ title: 'Invalid file', description: 'Please pick an image.', variant: 'destructive' }); return; }
    if (file.size > 8 * 1024 * 1024) { toast({ title: 'Too large', description: 'Image must be under 8MB.', variant: 'destructive' }); return; }
    setUploading(true);
    try {
      const compressed = await compressImage(file, 1);
      const ext = (compressed.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${kind}s/${user.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKETS.APP_ICONS)
        .upload(path, compressed, { upsert: true, cacheControl: '3600' });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(STORAGE_BUCKETS.APP_ICONS).getPublicUrl(path);
      const publicUrl = data.publicUrl;

      const key = kind === 'avatar' ? 'avatar_url' : kind === 'logo' ? 'logo_url' : 'banner_url';
      const { error: updErr } = await supabase.auth.updateUser({ data: { [key]: publicUrl } });
      if (updErr) throw updErr;

      if (kind === 'avatar') setAvatarUrl(publicUrl);
      if (kind === 'logo') setLogoUrl(publicUrl);
      if (kind === 'banner') setBannerUrl(publicUrl);

      toast({ title: 'Updated', description: `${kind[0].toUpperCase() + kind.slice(1)} saved.` });
      setAvatarSheetOpen(false);
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!user) return;
    setUploading(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: null } });
      if (error) throw error;
      setAvatarUrl(null);
      toast({ title: 'Removed', description: 'Profile photo removed.' });
      setAvatarSheetOpen(false);
    } catch (err: any) {
      toast({ title: 'Failed', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setUploading(false);
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
  const [pwForm, setPwForm] = useState({ next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const changePassword = async () => {
    if (pwForm.next.length < 8) { toast({ title: 'Weak password', description: 'Use at least 8 characters.', variant: 'destructive' }); return; }
    if (pwForm.next !== pwForm.confirm) { toast({ title: 'Mismatch', description: 'Passwords do not match.', variant: 'destructive' }); return; }
    setSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.next });
      if (error) throw error;
      toast({ title: 'Password changed', description: 'Your password has been updated.' });
      setPwForm({ next: '', confirm: '' });
      setPanel(null);
    } catch (err: any) {
      toast({ title: 'Update failed', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSavingPw(false);
    }
  };

  // ============ Help & Support ============
  const [help, setHelp] = useState({ subject: '', message: '' });
  const submitHelp = () => {
    if (!help.subject.trim() || !help.message.trim()) {
      toast({ title: 'Missing info', description: 'Add a subject and message.', variant: 'destructive' });
      return;
    }
    const body = encodeURIComponent(`${help.message}\n\n— ${user?.email || 'developer'}`);
    const subject = encodeURIComponent(help.subject);
    window.location.href = `mailto:support@elorax.app?subject=${subject}&body=${body}`;
    toast({ title: 'Opening mail app', description: 'Your message is ready to send.' });
    setPanel(null);
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

      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5" style={{ color: TEXT }} strokeWidth={1.8} />
        <h2 className="text-[22px] font-bold tracking-tight" style={{ color: TEXT }}>Developer Settings</h2>
      </div>

      {/* Profile Header */}
      <div className={cn(cardBase, 'p-4 sm:p-5')}>
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <button
              onClick={() => setAvatarSheetOpen(true)}
              aria-label="Change profile photo"
              className="w-[92px] h-[92px] rounded-full overflow-hidden ring-2 ring-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold active:scale-95 transition-transform"
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

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-[20px] font-bold leading-tight truncate" style={{ color: TEXT }}>{displayName}</h3>
                <p className="text-sm mt-0.5 truncate" style={{ color: MUTED }}>{developerProfile?.full_name || developerProfile?.email}</p>
              </div>
              <button
                onClick={() => openPanel('profile')}
                className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[#EAEAEA] bg-white text-[12px] font-semibold active:scale-95 transition-transform"
                style={{ color: TEXT }}
              >
                <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                Edit Profile
              </button>
            </div>

            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#EAEAEA] bg-white">
              <BadgeCheck className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span className="text-[11px] font-semibold" style={{ color: TEXT }}>Verified Developer</span>
            </div>

            <div className="flex items-center gap-3 mt-3 text-[12px]" style={{ color: MUTED }}>
              <span className="inline-flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" strokeWidth={1.8} />{developerProfile?.country || 'N/A'}</span>
              <span className="w-px h-3 bg-[#EAEAEA]" />
              <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" strokeWidth={1.8} />
                Joined {developerProfile?.created_at ? new Date(developerProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
              </span>
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
        <SheetContent side="bottom" className="rounded-t-[28px] p-5 pb-8 border-none">
          <SheetHeader className="text-left mb-3">
            <SheetTitle style={{ color: TEXT }}>Profile Photo</SheetTitle>
            <SheetDescription>Choose how to update your photo</SheetDescription>
          </SheetHeader>
          <div className="space-y-1.5">
            {[
              { icon: Camera, label: 'Take Photo', onClick: () => cameraInputRef.current?.click() },
              { icon: ImageIcon, label: 'Choose from Gallery', onClick: () => galleryInputRef.current?.click() },
              ...(avatarUrl ? [{ icon: Trash2, label: 'Remove Current Photo', onClick: removeAvatar, destructive: true }] : []),
            ].map((a: any) => (
              <button
                key={a.label}
                disabled={uploading}
                onClick={a.onClick}
                className="w-full flex items-center gap-3 p-3 rounded-2xl active:bg-[#F5F5F7] transition-colors text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] flex items-center justify-center shrink-0">
                  <a.icon className="w-[18px] h-[18px]" style={{ color: a.destructive ? '#EF4444' : TEXT }} strokeWidth={1.8} />
                </div>
                <p className="text-[15px] font-semibold" style={{ color: a.destructive ? '#EF4444' : TEXT }}>{a.label}</p>
                {uploading && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* ============ Developer Profile Panel ============ */}
      <PanelSheet open={panel === 'profile'} onClose={closePanel} title="Developer Profile" description="Personal information">
        <FormField label="Full Name">
          <Input value={devForm.full_name} onChange={(e) => setDevForm((p) => ({ ...p, full_name: e.target.value }))} />
        </FormField>
        <FormField label="Email">
          <Input value={developerProfile?.email || ''} disabled />
        </FormField>
        <FormField label="Phone">
          <Input value={devForm.phone} onChange={(e) => setDevForm((p) => ({ ...p, phone: e.target.value }))} />
        </FormField>
        <FormField label="Country">
          <Input value={devForm.country} onChange={(e) => setDevForm((p) => ({ ...p, country: e.target.value }))} />
        </FormField>
        <SaveBar loading={savingDev} onSave={() => saveDevFields({
          full_name: devForm.full_name.trim(),
          phone: devForm.phone.trim(),
          country: devForm.country.trim(),
        })} />
      </PanelSheet>

      {/* ============ Studio Info Panel ============ */}
      <PanelSheet open={panel === 'studio'} onClose={closePanel} title="Studio Information" description="Your developer or company details">
        <FormField label="Studio / Developer Name">
          <Input value={devForm.developer_name} onChange={(e) => setDevForm((p) => ({ ...p, developer_name: e.target.value }))} />
        </FormField>
        <FormField label="Type">
          <div className="grid grid-cols-2 gap-2">
            {(['individual', 'company'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setDevForm((p) => ({ ...p, developer_type: t }))}
                className={cn(
                  'h-10 rounded-2xl border text-[13px] font-semibold capitalize transition-colors',
                  devForm.developer_type === t
                    ? 'border-transparent text-white'
                    : 'bg-white border-[#EAEAEA]'
                )}
                style={devForm.developer_type === t ? { background: ACCENT } : { color: TEXT }}
              >
                {t}
              </button>
            ))}
          </div>
        </FormField>
        <FormField label="Bio">
          <Textarea rows={4} value={devForm.bio} onChange={(e) => setDevForm((p) => ({ ...p, bio: e.target.value }))} placeholder="Tell users about your studio..." />
        </FormField>
        <SaveBar loading={savingDev} onSave={() => saveDevFields({
          developer_name: devForm.developer_name.trim(),
          developer_type: devForm.developer_type as any,
          bio: devForm.bio.trim(),
        })} />
      </PanelSheet>

      {/* ============ Branding Panel ============ */}
      <PanelSheet open={panel === 'branding'} onClose={closePanel} title="Branding" description="Upload your logo, banner and profile image">
        <BrandingRow label="Profile Photo" url={avatarUrl} onPick={() => galleryInputRef.current?.click()} uploading={uploading} shape="circle" />
        <BrandingRow label="Studio Logo" url={logoUrl} onPick={() => logoInputRef.current?.click()} uploading={uploading} shape="square" />
        <BrandingRow label="Banner Image" url={bannerUrl} onPick={() => bannerInputRef.current?.click()} uploading={uploading} shape="wide" />
      </PanelSheet>

      {/* ============ Store Presence Panel ============ */}
      <PanelSheet open={panel === 'presence'} onClose={closePanel} title="Store Presence" description="Your website and social links">
        <FormField label="Website">
          <Input placeholder="https://yourstudio.com" value={devForm.website} onChange={(e) => setDevForm((p) => ({ ...p, website: e.target.value }))} />
        </FormField>
        <FormField label="Twitter / X">
          <div className="relative">
            <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: MUTED }} />
            <Input className="pl-9" placeholder="@handle" value={devForm.twitter} onChange={(e) => setDevForm((p) => ({ ...p, twitter: e.target.value }))} />
          </div>
        </FormField>
        <FormField label="GitHub">
          <div className="relative">
            <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: MUTED }} />
            <Input className="pl-9" placeholder="username" value={devForm.github} onChange={(e) => setDevForm((p) => ({ ...p, github: e.target.value }))} />
          </div>
        </FormField>
        <FormField label="Instagram">
          <div className="relative">
            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: MUTED }} />
            <Input className="pl-9" placeholder="@handle" value={devForm.instagram} onChange={(e) => setDevForm((p) => ({ ...p, instagram: e.target.value }))} />
          </div>
        </FormField>
        <FormField label="Facebook">
          <div className="relative">
            <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: MUTED }} />
            <Input className="pl-9" placeholder="page-name" value={devForm.facebook} onChange={(e) => setDevForm((p) => ({ ...p, facebook: e.target.value }))} />
          </div>
        </FormField>
        <SaveBar loading={savingDev} onSave={() => saveDevFields(
          { website: devForm.website.trim() },
          {
            twitter: devForm.twitter.trim(),
            github: devForm.github.trim(),
            instagram: devForm.instagram.trim(),
            facebook: devForm.facebook.trim(),
          }
        )} />
      </PanelSheet>

      {/* ============ Verification Panel ============ */}
      <PanelSheet open={panel === 'verification'} onClose={closePanel} title="Verification" description="Your account verification status">
        <div className={cn(cardBase, 'p-5 flex flex-col items-center text-center')}>
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
        </div>
        <div className={cn(cardBase, 'p-4 mt-3 space-y-2')}>
          <RowKV k="Developer" v={developerProfile?.developer_name || '—'} />
          <RowKV k="Type" v={developerProfile?.developer_type || '—'} />
          <RowKV k="Email" v={developerProfile?.email || '—'} />
          <RowKV k="Country" v={developerProfile?.country || '—'} />
          <RowKV k="Submitted" v={developerProfile?.created_at ? new Date(developerProfile.created_at).toLocaleDateString() : '—'} />
        </div>
      </PanelSheet>

      {/* ============ Security Panel ============ */}
      <PanelSheet open={panel === 'security'} onClose={closePanel} title="Security" description="Change your account password">
        <FormField label="New Password">
          <Input type="password" value={pwForm.next} onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))} placeholder="At least 8 characters" />
        </FormField>
        <FormField label="Confirm Password">
          <Input type="password" value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} />
        </FormField>
        <Button
          disabled={savingPw || !pwForm.next || !pwForm.confirm}
          onClick={changePassword}
          className="w-full h-11 rounded-full text-white text-[15px] font-semibold"
          style={{ background: ACCENT }}
        >
          {savingPw ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
          Update Password
        </Button>
      </PanelSheet>

      {/* ============ Access & Permissions Panel ============ */}
      <PanelSheet open={panel === 'access'} onClose={closePanel} title="Access & Permissions" description="Team members and roles">
        <ComingSoon
          icon={UsersIcon}
          title="Team access coming soon"
          desc="Soon you'll be able to invite team members and assign granular roles like Admin, Editor, and Viewer to collaborate on your apps."
        />
      </PanelSheet>

      {/* ============ Payments Panel ============ */}
      <PanelSheet open={panel === 'payments'} onClose={closePanel} title="Payments & Payouts" description="Payout methods and tax info">
        <ComingSoon
          icon={CreditCard}
          title="Payouts coming soon"
          desc="Connect a bank account or payment provider to receive earnings from paid apps and in-app purchases."
        />
      </PanelSheet>

      {/* ============ Legal & Policies Panel ============ */}
      <PanelSheet open={panel === 'legal'} onClose={closePanel} title="Legal & Policies" description="Agreements and compliance">
        <div className={cn(cardBase, 'overflow-hidden divide-y divide-[#F1F1F3]')}>
          {[
            { label: 'Developer Agreement', url: 'https://elorax.app/legal/developer-agreement' },
            { label: 'Terms of Service', url: 'https://elorax.app/legal/terms' },
            { label: 'Privacy Policy', url: 'https://elorax.app/legal/privacy' },
            { label: 'Content Guidelines', url: 'https://elorax.app/legal/guidelines' },
          ].map((l) => (
            <a
              key={l.label}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-4 py-3.5 active:bg-[#F5F5F7]"
            >
              <span className="text-[15px] font-semibold" style={{ color: TEXT }}>{l.label}</span>
              <ExternalLink className="w-4 h-4" style={{ color: MUTED }} />
            </a>
          ))}
        </div>
      </PanelSheet>

      {/* ============ Help & Support Panel ============ */}
      <PanelSheet open={panel === 'help'} onClose={closePanel} title="Help & Support" description="We usually respond within 24 hours">
        <FormField label="Subject">
          <Input value={help.subject} onChange={(e) => setHelp((p) => ({ ...p, subject: e.target.value }))} placeholder="What do you need help with?" />
        </FormField>
        <FormField label="Message">
          <Textarea rows={5} value={help.message} onChange={(e) => setHelp((p) => ({ ...p, message: e.target.value }))} placeholder="Describe your issue..." />
        </FormField>
        <Button onClick={submitHelp} className="w-full h-11 rounded-full text-white text-[15px] font-semibold" style={{ background: ACCENT }}>
          <Save className="w-4 h-4 mr-1.5" /> Send Message
        </Button>
        <p className="text-[12px] text-center mt-3" style={{ color: MUTED }}>
          Or email us at <a className="underline" style={{ color: ACCENT }} href="mailto:support@elorax.app">support@elorax.app</a>
        </p>
      </PanelSheet>

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
function PanelSheet({
  open, onClose, title, description, children, lockable = false,
}: {
  open: boolean; onClose: () => void; title: string; description?: string;
  children: React.ReactNode | ((ctx: { locked: boolean }) => React.ReactNode);
  lockable?: boolean;
}) {
  const [locked, setLocked] = useState(true);

  // reset lock state whenever the panel opens
  useEffect(() => {
    if (open) setLocked(true);
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className="rounded-t-[28px] p-0 pb-8 border-none max-h-[92vh] overflow-hidden bg-[#111827] text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] data-[state=open]:duration-300 data-[state=closed]:duration-200"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* drag handle */}
        <div className="pt-3 pb-2 flex justify-center">
          <div className="w-10 h-[5px] rounded-full bg-white/20" />
        </div>

        <div className="px-6 overflow-y-auto max-h-[calc(92vh-48px)]">
          <SheetHeader className="text-left mb-5">
            <SheetTitle className="text-white text-[19px] font-bold tracking-tight">{title}</SheetTitle>
            {description && <SheetDescription className="text-white/60 text-[13px]">{description}</SheetDescription>}
          </SheetHeader>

          <fieldset
            disabled={lockable && locked}
            className={cn(
              "space-y-4 disabled:opacity-100 group",
              // Dark premium input styling inside the popup
              "[&_input]:bg-[#1F2937] [&_input]:border-white/10 [&_input]:text-white [&_input]:placeholder:text-white/40",
              "[&_input]:h-[52px] [&_input]:rounded-[16px] [&_input]:px-4 [&_input]:text-[14px]",
              "[&_input:focus-visible]:ring-2 [&_input:focus-visible]:ring-[#3B82F6]/40 [&_input:focus-visible]:border-[#3B82F6]",
              "[&_textarea]:bg-[#1F2937] [&_textarea]:border-white/10 [&_textarea]:text-white [&_textarea]:placeholder:text-white/40",
              "[&_textarea]:rounded-[16px] [&_textarea]:p-4 [&_textarea]:text-[14px]",
              "[&_textarea:focus-visible]:ring-2 [&_textarea:focus-visible]:ring-[#3B82F6]/40 [&_textarea:focus-visible]:border-[#3B82F6]",
              // disabled state visual
              "group-disabled:[&_input]:opacity-70 group-disabled:[&_input]:cursor-not-allowed",
              "group-disabled:[&_textarea]:opacity-70 group-disabled:[&_textarea]:cursor-not-allowed",
            )}
          >
            {typeof children === 'function' ? children({ locked: lockable && locked }) : children}
          </fieldset>

          {lockable && locked && (
            <button
              onClick={() => setLocked(false)}
              className="w-full mt-6 h-[54px] rounded-[14px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                boxShadow: '0 8px 20px -6px rgba(59,130,246,0.55)',
              }}
            >
              <Unlock className="w-4 h-4" />
              Enable Editing
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[12px] font-semibold mb-2 block text-white/70">{label}</label>
      {children}
    </div>
  );
}

function SaveBar({ loading, onSave, hidden }: { loading: boolean; onSave: () => void; hidden?: boolean }) {
  if (hidden) return null;
  return (
    <Button
      disabled={loading}
      onClick={onSave}
      className="w-full h-[54px] rounded-[14px] text-white text-[15px] font-semibold mt-2 border-0"
      style={{
        background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        boxShadow: '0 8px 20px -6px rgba(59,130,246,0.55)',
      }}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
      Save Changes
    </Button>
  );
}

function RowKV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-white/60">{k}</span>
      <span className="font-semibold capitalize text-white">{v}</span>
    </div>
  );
}

function BrandingRow({
  label, url, onPick, uploading, shape,
}: {
  label: string; url: string | null; onPick: () => void; uploading: boolean;
  shape: 'circle' | 'square' | 'wide';
}) {
  const box =
    shape === 'circle' ? 'w-16 h-16 rounded-full'
      : shape === 'square' ? 'w-16 h-16 rounded-2xl'
      : 'w-24 h-14 rounded-2xl';
  return (
    <div
      className="p-4 flex items-center gap-3 rounded-[18px] border transition-transform active:scale-[0.99]"
      style={{
        background: '#1F2937',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <div className={cn(box, 'overflow-hidden bg-white/5 flex items-center justify-center shrink-0 border border-white/10')}>
        {url ? (
          <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-5 h-5 text-white/50" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-white">{label}</p>
        <p className="text-[11px] text-white/50">{url ? 'Uploaded' : 'Not set'}</p>
      </div>
      <Button
        disabled={uploading}
        onClick={onPick}
        size="sm"
        className="rounded-full h-9 px-4 text-[12px] font-semibold border-0 text-white"
        style={{ background: 'rgba(59,130,246,0.18)', color: '#93C5FD' }}
      >
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : url ? 'Replace' : 'Upload'}
      </Button>
    </div>
  );
}

function ComingSoon({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div
      className="p-6 text-center rounded-[18px] border"
      style={{ background: '#1F2937', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: 'rgba(59,130,246,0.15)' }}>
        <Icon className="w-6 h-6" style={{ color: '#60A5FA' }} strokeWidth={1.8} />
      </div>
      <p className="text-[16px] font-bold text-white">{title}</p>
      <p className="text-[13px] mt-1.5 text-white/60">{desc}</p>
    </div>
  );
}

