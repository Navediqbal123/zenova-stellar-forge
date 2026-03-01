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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useApps, type AppWithDeveloper } from '@/contexts/AppsContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, STORAGE_BUCKETS, getStorageUrl } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface EditForm {
  name: string;
  short_description: string;
  description: string;
  category: string;
  version: string;
  icon_url: string;
  screenshots: string[];
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function EditAppsTab() {
  const { developerProfile } = useAuth();
  const { apps, categories, refreshApps, getAppsByDeveloper } = useApps();
  const { toast } = useToast();

  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '', short_description: '', description: '', category: '', version: '', icon_url: '', screenshots: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  const myApps = developerProfile ? getAppsByDeveloper(developerProfile.id) : [];

  const startEditing = (app: AppWithDeveloper) => {
    setEditingAppId(app.id);
    setEditForm({
      name: app.name,
      short_description: app.short_description,
      description: app.description,
      category: app.category || '',
      version: app.version || '1.0.0',
      icon_url: app.icon_url || '',
      screenshots: app.screenshots || [],
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
      toast({ title: 'Icon uploaded' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err?.message, variant: 'destructive' });
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
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
      toast({ title: `${newUrls.length} screenshot(s) uploaded` });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err?.message, variant: 'destructive' });
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const removeScreenshot = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index),
    }));
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
        updated_at: new Date().toISOString(),
      }).eq('id', editingAppId);
      if (error) throw error;
      await refreshApps();
      setEditingAppId(null);
      toast({ title: '✅ App Updated', description: 'Changes saved successfully.' });
    } catch (err: any) {
      toast({ title: 'Update Failed', description: err?.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Pencil className="w-4 h-4 text-primary" /> Edit Apps
          </h2>
          <p className="text-xs text-muted-foreground">{myApps.length} apps available to edit</p>
        </div>
      </div>

      {myApps.length === 0 ? (
        <div className="admin-glass-card p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">No apps to edit. Upload an app first.</p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4">
          {myApps.map(app => {
            const isEditing = editingAppId === app.id;
            return (
              <motion.div key={app.id} variants={staggerItem} className="admin-glass-card overflow-hidden">
                {/* App Header */}
                <div className="p-3 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                    {app.icon_url && app.icon_url.startsWith('http') ? (
                      <img src={app.icon_url} alt={app.name} className="w-full h-full object-cover" />
                    ) : (app.icon || '📱')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-semibold text-sm truncate">{app.name}</h3>
                      <StatusBadge status={app.status} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{app.short_description}</p>
                  </div>
                  {!isEditing ? (
                    <Button size="sm" variant="outline" className="border-primary/30 text-primary h-8 text-xs px-2.5" onClick={() => startEditing(app)}>
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" className="h-8 text-xs px-2.5" onClick={() => setEditingAppId(null)}>
                      <X className="w-3.5 h-3.5 mr-1" /> Cancel
                    </Button>
                  )}
                </div>

                {/* Edit Form */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-4 pt-2 border-t border-border/30 space-y-4">
                        {/* Icon Upload */}
                        <div className="space-y-2">
                          <Label className="text-xs">App Icon</Label>
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-xl bg-muted/50 border border-border flex items-center justify-center overflow-hidden shrink-0">
                              {editForm.icon_url && editForm.icon_url.startsWith('http') ? (
                                <img src={editForm.icon_url} alt="icon" className="w-full h-full object-cover" />
                              ) : (
                                <ImagePlus className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <label className="cursor-pointer">
                                <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} disabled={uploadingIcon} />
                                <Button variant="outline" size="sm" className="border-primary/30 h-8 text-xs" asChild>
                                  <span>{uploadingIcon ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Uploading...</> : <><Upload className="w-3.5 h-3.5 mr-1" /> Upload Icon</>}</span>
                                </Button>
                              </label>
                              <p className="text-[10px] text-muted-foreground mt-1">512x512 recommended</p>
                            </div>
                          </div>
                        </div>

                        {/* Name */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">App Name <span className="text-destructive">*</span></Label>
                          <Input value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value.slice(0, 30) }))} className="bg-white/5 border-white/10 h-9 text-sm" maxLength={30} />
                          <p className="text-[10px] text-muted-foreground text-right">{editForm.name.length}/30</p>
                        </div>

                        {/* Short Description */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Short Description</Label>
                          <Input value={editForm.short_description} onChange={e => setEditForm(prev => ({ ...prev, short_description: e.target.value.slice(0, 80) }))} className="bg-white/5 border-white/10 h-9 text-sm" maxLength={80} />
                        </div>

                        {/* Full Description */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Full Description</Label>
                          <Textarea value={editForm.description} onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))} className="bg-white/5 border-white/10 min-h-[100px] text-sm" />
                        </div>

                        {/* Category & Version - stacked on mobile */}
                        <div className="grid grid-cols-1 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Category</Label>
                            <Select value={editForm.category} onValueChange={v => setEditForm(prev => ({ ...prev, category: v }))}>
                              <SelectTrigger className="bg-white/5 border-white/10 h-9 text-sm">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent className="bg-popover border-border z-50">
                                {categories.map(cat => (
                                  <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs">Version</Label>
                            <Input value={editForm.version} onChange={e => setEditForm(prev => ({ ...prev, version: e.target.value }))} className="bg-white/5 border-white/10 h-9 text-sm" placeholder="1.0.0" />
                          </div>
                        </div>

                        {/* Tags - Disabled */}
                        <div className="space-y-1.5 opacity-50 pointer-events-none">
                          <Label className="flex items-center gap-2 text-xs">Tags <Badge variant="outline" className="text-[10px]">Disabled</Badge></Label>
                          <Input disabled placeholder="Tags are auto-generated" className="bg-white/5 border-white/10 h-9 text-sm" />
                        </div>

                        {/* Ads & IAP - Disabled */}
                        <div className="grid grid-cols-1 gap-3 opacity-50 pointer-events-none">
                          <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-xs">Contains Ads <Badge variant="outline" className="text-[10px]">Disabled</Badge></Label>
                            <Input disabled value={app.contains_ads ? 'Yes' : 'No'} className="bg-white/5 border-white/10 h-9 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-xs">In-App Purchases <Badge variant="outline" className="text-[10px]">Disabled</Badge></Label>
                            <Input disabled value={app.in_app_purchases ? 'Yes' : 'No'} className="bg-white/5 border-white/10 h-9 text-sm" />
                          </div>
                        </div>

                        {/* Screenshots Upload */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Screenshots</Label>
                          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                            {editForm.screenshots.map((url, i) => (
                              <div key={i} className="relative shrink-0 w-20 h-36 rounded-lg overflow-hidden border border-border group">
                                <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                                <button
                                  onClick={() => removeScreenshot(i)}
                                  className="absolute top-1 right-1 p-0.5 rounded-full bg-destructive/80 text-white opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ))}
                            <label className="shrink-0 w-20 h-36 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                              <input type="file" accept="image/*" multiple className="hidden" onChange={handleScreenshotUpload} disabled={uploadingScreenshot} />
                              {uploadingScreenshot ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <ImagePlus className="w-5 h-5 text-muted-foreground" />}
                              <span className="text-[10px] text-muted-foreground mt-1">Add</span>
                            </label>
                          </div>
                        </div>

                        {/* Save Button */}
                        <Button
                          className="w-full bg-primary hover:bg-primary/90 h-9 text-sm"
                          disabled={isSaving || !editForm.name.trim()}
                          onClick={handleSave}
                        >
                          {isSaving ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Saving...</> : <><Save className="w-3.5 h-3.5 mr-1" /> Save Changes</>}
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