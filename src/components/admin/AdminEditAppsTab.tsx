import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil,
  Save,
  X,
  Loader2,
  Package,
  ImagePlus,
  Trash2,
  Upload,
  Search,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useApps } from '@/contexts/AppsContext';
import { supabase, STORAGE_BUCKETS, getStorageUrl } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AdminEditForm {
  name: string;
  short_description: string;
  description: string;
  category: string;
  version: string;
  icon_url: string;
  screenshots: string[];
  is_paid: boolean;
  price: number | null;
  contains_ads: boolean;
  in_app_purchases: boolean;
  featured: boolean;
  trending: boolean;
  status: string;
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function AdminEditAppsTab() {
  const { apps, categories, refreshApps } = useApps();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AdminEditForm>({
    name: '', short_description: '', description: '', category: '', version: '',
    icon_url: '', screenshots: [], is_paid: false, price: null, contains_ads: false,
    in_app_purchases: false, featured: false, trending: false, status: 'pending',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (app.developer_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (app: any) => {
    setEditingAppId(app.id);
    setEditForm({
      name: app.name,
      short_description: app.short_description,
      description: app.description,
      category: app.category || '',
      version: app.version || '1.0.0',
      icon_url: app.icon_url || '',
      screenshots: app.screenshots || [],
      is_paid: app.is_paid || false,
      price: app.price,
      contains_ads: app.contains_ads || false,
      in_app_purchases: app.in_app_purchases || false,
      featured: app.featured || false,
      trending: app.trending || false,
      status: app.status,
    });
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIcon(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${editingAppId}/icon_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(STORAGE_BUCKETS.APP_ICONS).upload(path, file, { upsert: true });
      if (error) throw error;
      const url = getStorageUrl(STORAGE_BUCKETS.APP_ICONS, path);
      setEditForm(prev => ({ ...prev, icon_url: url }));
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err?.message, variant: 'destructive' });
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploadingScreenshot(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop();
        const path = `${editingAppId}/ss_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from(STORAGE_BUCKETS.APP_SCREENSHOTS).upload(path, file, { upsert: true });
        if (error) throw error;
        newUrls.push(getStorageUrl(STORAGE_BUCKETS.APP_SCREENSHOTS, path));
      }
      setEditForm(prev => ({ ...prev, screenshots: [...prev.screenshots, ...newUrls] }));
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err?.message, variant: 'destructive' });
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const removeScreenshot = (index: number) => {
    setEditForm(prev => ({ ...prev, screenshots: prev.screenshots.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    if (!editingAppId || !editForm.name.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('apps').update({
        name: editForm.name.trim(),
        short_description: editForm.short_description.trim(),
        description: editForm.description.trim(),
        category: editForm.category,
        version: editForm.version.trim(),
        icon_url: editForm.icon_url.trim() || '📱',
        screenshots: editForm.screenshots,
        is_paid: editForm.is_paid,
        price: editForm.is_paid ? editForm.price : null,
        contains_ads: editForm.contains_ads,
        in_app_purchases: editForm.in_app_purchases,
        featured: editForm.featured,
        trending: editForm.trending,
        status: editForm.status as any,
        updated_at: new Date().toISOString(),
      }).eq('id', editingAppId);
      if (error) throw error;
      await refreshApps();
      setEditingAppId(null);
      toast({ title: '✅ App Updated', description: 'Admin changes saved.' });
    } catch (err: any) {
      toast({ title: 'Update Failed', description: err?.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" /> Edit Apps
          </h1>
          <p className="text-muted-foreground">Full admin control over all apps</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search apps..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 w-full sm:w-64 bg-white/5 border-white/10"
          />
        </div>
      </div>

      {filteredApps.length === 0 ? (
        <div className="admin-glass-card p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">{searchQuery ? 'No apps found' : 'No apps yet'}</p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4">
          {filteredApps.map(app => {
            const isEditing = editingAppId === app.id;
            return (
              <motion.div key={app.id} variants={staggerItem} className="admin-glass-card overflow-hidden">
                <div className="p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                    {app.icon_url && app.icon_url.startsWith('http') ? (
                      <img src={app.icon_url} alt={app.name} className="w-full h-full object-cover" />
                    ) : (app.icon || '📱')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{app.name}</h3>
                      <StatusBadge status={app.status} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground">{app.developer_name || 'Unknown'}</p>
                  </div>
                  {!isEditing ? (
                    <Button size="sm" variant="outline" className="border-primary/30 text-primary" onClick={() => startEditing(app)}>
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setEditingAppId(null)}>
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                  )}
                </div>

                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-5 pt-2 border-t border-border/30 space-y-5">
                        {/* Icon Upload */}
                        <div className="space-y-2">
                          <Label>App Icon</Label>
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-xl bg-muted/50 border border-border flex items-center justify-center overflow-hidden">
                              {editForm.icon_url && editForm.icon_url.startsWith('http') ? (
                                <img src={editForm.icon_url} alt="icon" className="w-full h-full object-cover" />
                              ) : <ImagePlus className="w-8 h-8 text-muted-foreground" />}
                            </div>
                            <label className="cursor-pointer">
                              <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} disabled={uploadingIcon} />
                              <Button variant="outline" size="sm" className="border-primary/30" asChild>
                                <span>{uploadingIcon ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4 mr-1" /> Upload</>}</span>
                              </Button>
                            </label>
                          </div>
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                          <Label>App Name <span className="text-destructive">*</span></Label>
                          <Input value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value.slice(0, 30) }))} className="bg-white/5 border-white/10" maxLength={30} />
                        </div>

                        {/* Short Description */}
                        <div className="space-y-2">
                          <Label>Short Description</Label>
                          <Input value={editForm.short_description} onChange={e => setEditForm(prev => ({ ...prev, short_description: e.target.value.slice(0, 80) }))} className="bg-white/5 border-white/10" maxLength={80} />
                        </div>

                        {/* Full Description */}
                        <div className="space-y-2">
                          <Label>Full Description</Label>
                          <Textarea value={editForm.description} onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))} className="bg-white/5 border-white/10 min-h-[120px]" />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select value={editForm.category} onValueChange={v => setEditForm(prev => ({ ...prev, category: v }))}>
                            <SelectTrigger className="bg-white/5 border-white/10">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border z-50">
                              {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Version */}
                        <div className="space-y-2">
                          <Label>Version</Label>
                          <Input value={editForm.version} onChange={e => setEditForm(prev => ({ ...prev, version: e.target.value }))} className="bg-white/5 border-white/10" />
                        </div>

                        {/* Status - Admin Only */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2"><Shield className="w-4 h-4 text-warning" /> Status (Admin)</Label>
                          <Select value={editForm.status} onValueChange={v => setEditForm(prev => ({ ...prev, status: v }))}>
                            <SelectTrigger className="bg-white/5 border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border z-50">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Toggles - Admin has full control */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <Label className="text-sm">Contains Ads</Label>
                            <Switch checked={editForm.contains_ads} onCheckedChange={v => setEditForm(prev => ({ ...prev, contains_ads: v }))} />
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <Label className="text-sm">In-App Purchases</Label>
                            <Switch checked={editForm.in_app_purchases} onCheckedChange={v => setEditForm(prev => ({ ...prev, in_app_purchases: v }))} />
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <Label className="text-sm">Featured</Label>
                            <Switch checked={editForm.featured} onCheckedChange={v => setEditForm(prev => ({ ...prev, featured: v }))} />
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <Label className="text-sm">Trending</Label>
                            <Switch checked={editForm.trending} onCheckedChange={v => setEditForm(prev => ({ ...prev, trending: v }))} />
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <Label className="text-sm">Paid App</Label>
                            <Switch checked={editForm.is_paid} onCheckedChange={v => setEditForm(prev => ({ ...prev, is_paid: v }))} />
                          </div>
                          {editForm.is_paid && (
                            <div className="space-y-1">
                              <Label className="text-sm">Price ($)</Label>
                              <Input type="number" value={editForm.price || ''} onChange={e => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) || null }))} className="bg-white/5 border-white/10" />
                            </div>
                          )}
                        </div>

                        {/* Screenshots */}
                        <div className="space-y-2">
                          <Label>Screenshots</Label>
                          <div className="flex gap-3 overflow-x-auto pb-2">
                            {editForm.screenshots.map((url, i) => (
                              <div key={i} className="relative shrink-0 w-28 h-48 rounded-lg overflow-hidden border border-border group">
                                <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                                <button onClick={() => removeScreenshot(i)} className="absolute top-1 right-1 p-1 rounded-full bg-destructive/80 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <label className="shrink-0 w-28 h-48 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                              <input type="file" accept="image/*" multiple className="hidden" onChange={handleScreenshotUpload} disabled={uploadingScreenshot} />
                              {uploadingScreenshot ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : <ImagePlus className="w-6 h-6 text-muted-foreground" />}
                              <span className="text-xs text-muted-foreground mt-1">Add</span>
                            </label>
                          </div>
                        </div>

                        {/* Save */}
                        <Button className="w-full bg-primary hover:bg-primary/90" disabled={isSaving || !editForm.name.trim()} onClick={handleSave}>
                          {isSaving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-1" /> Save Changes</>}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}