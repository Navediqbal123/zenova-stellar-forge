import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil, Search, SlidersHorizontal, ChevronLeft, FlaskConical, Rocket,
  Save, ShieldCheck, Loader2, Image as ImageIcon, Trash2, Plus, X,
  Smartphone, Apple, Package, Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useApps, type AppWithDeveloper } from '@/contexts/AppsContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, STORAGE_BUCKETS, getStorageUrl } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const ACCENT = '#2563EB';
const TEXT = '#111111';
const MUTED = '#6B7280';
const SURFACE = '#F8F9FC';
const BORDER = '#EAECEF';

const cardCls =
  'bg-white rounded-[18px] border shadow-[0_2px_10px_rgba(15,23,42,0.04)]';

type Filter = 'all' | 'approved' | 'pending' | 'rejected';
type EditTab = 'basic' | 'store' | 'media' | 'monetize';

interface EditForm {
  name: string;
  short_description: string;
  description: string;
  category: string;
  version: string;
  icon_url: string;
  screenshots: string[];
  contains_ads: boolean;
  in_app_purchases: boolean;
  website: string;
  support_email: string;
  privacy_url: string;
}

function timeAgo(iso?: string) {
  if (!iso) return '—';
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)} min ago`;
  if (d < 86400) return `${Math.floor(d / 3600)} hr ago`;
  return `${Math.floor(d / 86400)} days ago`;
}

export function EditAppsTab() {
  const { developerProfile } = useAuth();
  const { getAppsByDeveloper } = useApps();
  const [editingApp, setEditingApp] = useState<AppWithDeveloper | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const myApps = developerProfile ? getAppsByDeveloper(developerProfile.id) : [];

  const visible = useMemo(() => {
    let list = myApps;
    if (filter !== 'all') list = list.filter((a) => a.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) => a.name.toLowerCase().includes(q) || (a.short_description || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [myApps, filter, query]);

  if (editingApp) {
    return (
      <EditAppInner
        app={editingApp}
        onBack={() => setEditingApp(null)}
      />
    );
  }

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All Apps' },
    { id: 'approved', label: 'Approved' },
    { id: 'pending', label: 'In Review' },
    { id: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[26px] leading-tight font-bold tracking-tight" style={{ color: TEXT, letterSpacing: '-0.02em' }}>
            Manage Your Apps
          </h2>
          <p className="text-[13px] mt-1" style={{ color: MUTED }}>
            Edit, test and publish your applications.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search"
            className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center active:scale-95 transition-transform"
            style={{ borderColor: BORDER, color: searchOpen ? ACCENT : TEXT }}
          >
            <Search className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>
          <div className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              aria-label="Filter"
              className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center active:scale-95 transition-transform"
              style={{ borderColor: BORDER, color: filter !== 'all' ? ACCENT : TEXT }}
            >
              <SlidersHorizontal className="w-[18px] h-[18px]" strokeWidth={2} />
            </button>
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-44 bg-white rounded-2xl border shadow-lg z-20 overflow-hidden"
                  style={{ borderColor: BORDER }}
                >
                  {filters.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => { setFilter(f.id); setFilterOpen(false); }}
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-[14px] font-medium active:bg-[#F5F5F7]',
                        filter === f.id && 'bg-[#F5F8FF]',
                      )}
                      style={{ color: filter === f.id ? ACCENT : TEXT }}
                    >
                      {f.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Slide-down search */}
      <AnimatePresence initial={false}>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your apps…"
                className="w-full h-11 pl-10 pr-10 rounded-2xl bg-white border text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25"
                style={{ borderColor: BORDER, color: TEXT }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center active:bg-[#F5F5F7]"
                >
                  <X className="w-4 h-4" style={{ color: MUTED }} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {visible.length === 0 ? (
        <div className={cn(cardCls, 'p-10 text-center')} style={{ borderColor: BORDER }}>
          <Package className="w-12 h-12 mx-auto mb-3" style={{ color: '#C7C9CE' }} strokeWidth={1.5} />
          <p className="text-sm" style={{ color: MUTED }}>No apps match your filters.</p>
        </div>
      ) : (
        <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }} className="space-y-4">
          {visible.map((app) => (
            <motion.div
              key={app.id}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              whileTap={{ scale: 0.99 }}
              className={cn(cardCls, 'p-3.5 flex items-center gap-3.5')}
              style={{ borderColor: BORDER }}
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#EEF2FF] to-[#E0F2FE] flex items-center justify-center shrink-0 text-3xl">
                {app.icon_url && app.icon_url.startsWith('http') ? (
                  <img src={app.icon_url} alt={app.name} className="w-full h-full object-cover" />
                ) : (
                  app.icon || '📱'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-[15px] font-bold truncate" style={{ color: TEXT }}>{app.name}</h3>
                  {app.status === 'approved' && (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[10px] font-semibold" style={{ background: '#DCFCE7', color: '#166534' }}>
                      Approved
                    </span>
                  )}
                  {app.status === 'pending' && (
                    <span className="shrink-0 inline-flex px-2 py-[3px] rounded-full text-[10px] font-semibold" style={{ background: '#FEF3C7', color: '#92400E' }}>
                      In Review
                    </span>
                  )}
                  {app.status === 'rejected' && (
                    <span className="shrink-0 inline-flex px-2 py-[3px] rounded-full text-[10px] font-semibold" style={{ background: '#FEE2E2', color: '#991B1B' }}>
                      Rejected
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] mt-0.5 truncate" style={{ color: MUTED }}>
                  com.zenova.{app.name.toLowerCase().replace(/\s+/g, '')}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[10.5px]" style={{ color: MUTED }}>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#F1F5F9] font-medium" style={{ color: TEXT }}>
                    v{app.version || '1.0.0'}
                  </span>
                  <span>{timeAgo(app.updated_at)}</span>
                  <span>•</span>
                  <span>{(app.downloads || 0).toLocaleString()} DL</span>
                </div>
              </div>
              <button
                onClick={() => setEditingApp(app)}
                className="shrink-0 h-10 px-3.5 rounded-xl text-white text-[13px] font-semibold inline-flex items-center gap-1.5 active:scale-95 transition-transform shadow-[0_6px_16px_-6px_rgba(37,99,235,0.55)]"
                style={{ background: ACCENT }}
              >
                <Pencil className="w-3.5 h-3.5" strokeWidth={2.4} />
                Edit
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

/* ============================================================
   EDIT APP INNER SCREEN
============================================================ */
function EditAppInner({ app, onBack }: { app: AppWithDeveloper; onBack: () => void }) {
  const { categories, refreshApps } = useApps();
  const { toast } = useToast();
  const [tab, setTab] = useState<EditTab>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingShot, setUploadingShot] = useState(false);

  const [form, setForm] = useState<EditForm>({
    name: app.name,
    short_description: app.short_description,
    description: app.description,
    category: app.category || '',
    version: app.version || '1.0.0',
    icon_url: app.icon_url || '',
    screenshots: app.screenshots || [],
    contains_ads: app.contains_ads || false,
    in_app_purchases: app.in_app_purchases || false,
    website: (app as any).website || '',
    support_email: (app as any).support_email || '',
    privacy_url: (app as any).privacy_url || '',
  });

  const update = <K extends keyof EditForm>(k: K, v: EditForm[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    setIsDirty(true);
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIcon(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${app.id}/icon_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(STORAGE_BUCKETS.APP_ICONS).upload(path, file, { upsert: true });
      if (error) throw error;
      update('icon_url', getStorageUrl(STORAGE_BUCKETS.APP_ICONS, path));
      toast({ title: 'Icon uploaded' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err?.message, variant: 'destructive' });
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingShot(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const ext = f.name.split('.').pop();
        const path = `${app.id}/ss_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from(STORAGE_BUCKETS.APP_SCREENSHOTS).upload(path, f, { upsert: true });
        if (error) throw error;
        urls.push(getStorageUrl(STORAGE_BUCKETS.APP_SCREENSHOTS, path));
      }
      update('screenshots', [...form.screenshots, ...urls]);
      toast({ title: `${urls.length} screenshot(s) uploaded` });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err?.message, variant: 'destructive' });
    } finally {
      setUploadingShot(false);
    }
  };

  const removeScreenshot = (i: number) => {
    update('screenshots', form.screenshots.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('apps').update({
        name: form.name.trim(),
        short_description: form.short_description.trim(),
        description: form.description.trim(),
        category: form.category,
        version: form.version.trim(),
        icon_url: form.icon_url.trim() || '📱',
        screenshots: form.screenshots,
        contains_ads: form.contains_ads,
        in_app_purchases: form.in_app_purchases,
        updated_at: new Date().toISOString(),
      }).eq('id', app.id);
      if (error) throw error;
      await refreshApps();
      setIsDirty(false);
      toast({ title: '✅ Changes saved', description: 'Your app is up to date.' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err?.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { id: EditTab; label: string }[] = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'store', label: 'Store Details' },
    { id: 'media', label: 'Media & Assets' },
    { id: 'monetize', label: 'Monetization' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
      style={{ paddingBottom: 'calc(200px + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <button
            onClick={onBack}
            aria-label="Back"
            className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center active:scale-95 transition-transform shrink-0"
            style={{ borderColor: BORDER }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: TEXT }} />
          </button>
          <div className="min-w-0">
            <h2 className="text-[22px] font-bold tracking-tight leading-tight" style={{ color: TEXT, letterSpacing: '-0.02em' }}>
              Edit App
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>
              Update your app details and store information
            </p>
          </div>
        </div>
      </div>

      {/* Top right actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => toast({ title: 'Test build queued', description: 'We will notify you when it is ready.' })}
          className="flex-1 h-10 rounded-xl bg-white border inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold active:scale-[0.98] transition-transform"
          style={{ borderColor: '#DBEAFE', color: ACCENT }}
        >
          <FlaskConical className="w-4 h-4" strokeWidth={2} />
          Test Build
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="flex-1 h-10 rounded-xl inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold text-white active:scale-[0.98] transition-transform disabled:opacity-50 shadow-[0_6px_16px_-6px_rgba(37,99,235,0.55)]"
          style={{ background: ACCENT }}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" strokeWidth={2} />}
          Publish Update
        </button>
      </div>

      {/* App Summary Card */}
      <div className={cn(cardCls, 'p-4')} style={{ borderColor: BORDER }}>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-[#EEF2FF] to-[#E0F2FE] flex items-center justify-center shrink-0 text-2xl">
            {form.icon_url && form.icon_url.startsWith('http') ? (
              <img src={form.icon_url} alt={form.name} className="w-full h-full object-cover" />
            ) : '📱'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-bold truncate" style={{ color: TEXT }}>{form.name}</h3>
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[10px] font-semibold" style={{ background: '#DCFCE7', color: '#166534' }}>
                Approved
              </span>
            </div>
            <p className="text-[11px]" style={{ color: MUTED }}>com.zenova.{form.name.toLowerCase().replace(/\s+/g, '')}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Smartphone className="w-3.5 h-3.5" style={{ color: MUTED }} />
              <Apple className="w-3.5 h-3.5" style={{ color: MUTED }} />
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: '#EFF6FF', color: ACCENT }}>
                {form.category || 'Uncategorized'}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px]" style={{ color: MUTED }}>Version</p>
            <p className="text-[13px] font-bold" style={{ color: TEXT }}>{form.version}</p>
            <p className="text-[10px] mt-1" style={{ color: MUTED }}>Updated</p>
            <p className="text-[10px] font-medium" style={{ color: TEXT }}>{timeAgo(app.updated_at)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto -mx-1 px-1" style={{ borderColor: BORDER }}>
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="relative shrink-0 px-3 py-2.5 text-[13px] font-semibold transition-colors"
              style={{ color: active ? ACCENT : MUTED }}
            >
              {t.label}
              {active && (
                <motion.span
                  layoutId="edit-tab-underline"
                  className="absolute left-0 right-0 -bottom-[1px] h-[2.5px] rounded-full"
                  style={{ background: ACCENT }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* BASIC */}
        {tab === 'basic' && (
          <motion.div
            key="basic"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            <SectionCard title="Basic Information" desc="Provide the basic details about your app.">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>App Icon</FieldLabel>
                  <div className="flex gap-2">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#EEF2FF] to-[#E0F2FE] flex items-center justify-center border" style={{ borderColor: BORDER }}>
                      {form.icon_url && form.icon_url.startsWith('http')
                        ? <img src={form.icon_url} className="w-full h-full object-cover" alt="" />
                        : <ImageIcon className="w-5 h-5" style={{ color: MUTED }} />}
                    </div>
                    <label className="flex-1 cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center" style={{ borderColor: BORDER }}>
                      <input type="file" accept="image/*" hidden onChange={handleIconUpload} disabled={uploadingIcon} />
                      {uploadingIcon ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: MUTED }} /> : <Upload className="w-4 h-4" style={{ color: ACCENT }} />}
                      <span className="text-[10px] font-semibold mt-1" style={{ color: TEXT }}>Upload New</span>
                      <span className="text-[9px]" style={{ color: MUTED }}>512 × 512px</span>
                    </label>
                  </div>
                </div>
                <div>
                  <FieldLabel required>App Name</FieldLabel>
                  <PremiumInput value={form.name} maxLength={50} onChange={(v) => update('name', v.slice(0, 50))} />
                  <Counter value={form.name.length} max={50} />
                </div>
              </div>
              <div>
                <FieldLabel required>Short Description</FieldLabel>
                <Textarea
                  value={form.short_description}
                  onChange={(e) => update('short_description', e.target.value.slice(0, 100))}
                  maxLength={100}
                  rows={2}
                  className="rounded-2xl border resize-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/25"
                  style={{ borderColor: BORDER }}
                />
                <Counter value={form.short_description.length} max={100} />
              </div>
              <div>
                <FieldLabel required>Full Description</FieldLabel>
                <Textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value.slice(0, 4000))}
                  maxLength={4000}
                  rows={5}
                  className="rounded-2xl border resize-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/25"
                  style={{ borderColor: BORDER }}
                />
                <Counter value={form.description.length} max={4000} />
              </div>
            </SectionCard>

            <SectionCard title="Category & Version" desc="Choose the appropriate category and version.">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <Select value={form.category} onValueChange={(v) => update('category', v)}>
                    <SelectTrigger className="h-11 rounded-2xl border" style={{ borderColor: BORDER }}>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Version</FieldLabel>
                  <PremiumInput value={form.version} onChange={(v) => update('version', v)} placeholder="1.0.0" />
                </div>
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* STORE */}
        {tab === 'store' && (
          <motion.div key="store" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
            <SectionCard title="Store Details" desc="Contact and store presence information.">
              <div>
                <FieldLabel>Website</FieldLabel>
                <PremiumInput value={form.website} placeholder="https://yourapp.com" onChange={(v) => update('website', v)} />
              </div>
              <div>
                <FieldLabel>Support Email</FieldLabel>
                <PremiumInput value={form.support_email} placeholder="support@yourapp.com" onChange={(v) => update('support_email', v)} />
              </div>
              <div>
                <FieldLabel>Privacy Policy URL</FieldLabel>
                <PremiumInput value={form.privacy_url} placeholder="https://yourapp.com/privacy" onChange={(v) => update('privacy_url', v)} />
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* MEDIA */}
        {tab === 'media' && (
          <motion.div key="media" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
            <SectionCard title="Screenshots" desc="Add screenshots of your app (3–10 recommended)">
              <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
                {form.screenshots.map((url, i) => (
                  <div key={i} className="relative shrink-0 w-24 h-44 rounded-2xl overflow-hidden border snap-start" style={{ borderColor: BORDER }}>
                    <img src={url} alt={`ss-${i}`} className="w-full h-full object-cover" />
                    <button onClick={() => removeScreenshot(i)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/95 shadow flex items-center justify-center">
                      <X className="w-3.5 h-3.5" style={{ color: TEXT }} />
                    </button>
                  </div>
                ))}
                <label className="shrink-0 w-24 h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer snap-start" style={{ borderColor: BORDER }}>
                  <input type="file" accept="image/*" multiple hidden onChange={handleScreenshotUpload} disabled={uploadingShot} />
                  {uploadingShot ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: ACCENT }} /> : <Plus className="w-6 h-6" style={{ color: ACCENT }} />}
                  <span className="text-[11px] font-semibold mt-1.5" style={{ color: ACCENT }}>Add<br/>Screenshot</span>
                </label>
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* MONETIZE */}
        {tab === 'monetize' && (
          <motion.div key="monetize" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
            <SectionCard title="Monetization" desc="How your app makes money.">
              <div className="flex items-center justify-between p-3 rounded-2xl" style={{ background: SURFACE }}>
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: TEXT }}>Contains Ads</p>
                  <p className="text-[11px]" style={{ color: MUTED }}>Your app displays advertisements</p>
                </div>
                <Switch checked={form.contains_ads} onCheckedChange={(v) => update('contains_ads', v)} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl" style={{ background: SURFACE }}>
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: TEXT }}>In-App Purchases</p>
                  <p className="text-[11px]" style={{ color: MUTED }}>Offer paid content or subscriptions</p>
                </div>
                <Switch checked={form.in_app_purchases} onCheckedChange={(v) => update('in_app_purchases', v)} />
              </div>
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Save Bar */}
      <div
        className="fixed left-3 right-3 z-40 pointer-events-none"
        style={{ bottom: 'calc(112px + env(safe-area-inset-bottom, 0px))' }}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pointer-events-auto max-w-3xl mx-auto bg-white rounded-2xl border shadow-[0_10px_40px_-10px_rgba(15,23,42,0.18)] p-3 flex items-center gap-3"
          style={{ borderColor: BORDER }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: isDirty ? '#FEF3C7' : '#DCFCE7' }}>
            <ShieldCheck className="w-5 h-5" style={{ color: isDirty ? '#B45309' : '#166534' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold leading-tight" style={{ color: TEXT }}>
              {isDirty ? 'Unsaved changes' : 'All changes saved'}
            </p>
            <p className="text-[10.5px]" style={{ color: MUTED }}>
              {isDirty ? 'Tap save to publish updates' : 'Your changes are safely saved'}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="h-11 px-4 rounded-xl text-white text-[13px] font-semibold inline-flex items-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50 shadow-[0_6px_16px_-6px_rgba(37,99,235,0.55)]"
            style={{ background: ACCENT }}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   Small primitives
============================================================ */
function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className={cn(cardCls, 'p-4 space-y-3.5')} style={{ borderColor: BORDER }}>
      <div>
        <h3 className="text-[15px] font-bold" style={{ color: TEXT }}>{title}</h3>
        {desc && <p className="text-[11.5px] mt-0.5" style={{ color: MUTED }}>{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT }}>
      {children}{required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

function PremiumInput({ value, onChange, placeholder, maxLength }: { value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number }) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="h-11 rounded-2xl border bg-white focus-visible:ring-2 focus-visible:ring-[#2563EB]/25 text-[14px]"
      style={{ borderColor: BORDER, color: TEXT }}
    />
  );
}

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <p className="text-[10px] text-right mt-1" style={{ color: MUTED }}>{value}/{max}</p>
  );
}
