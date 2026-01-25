import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Sparkles,
  FileUp,
  X,
  Check,
  Loader2,
  FileCode,
  Wand2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useApps } from '@/contexts/AppsContext';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/lib/axios';
import { cn } from '@/lib/utils';

interface AppUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UploadFormData {
  name: string;
  short_description: string;
  description: string;
  category_id: string;
  version: string;
  size: string;
  tags: string[];
  file: File | null;
}

const initialFormData: UploadFormData = {
  name: '',
  short_description: '',
  description: '',
  category_id: '',
  version: '1.0.0',
  size: '',
  tags: [],
  file: null,
};

export function AppUploadModal({ isOpen, onClose }: AppUploadModalProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('ai');
  const [formData, setFormData] = useState<UploadFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [aiGenerated, setAiGenerated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { categories, addApp, refreshApps } = useApps();
  const { developerProfile } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['.apk', '.aab'];
      const isValid = validTypes.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!isValid) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an APK or AAB file.",
          variant: "destructive",
        });
        return;
      }

      // Calculate size in MB
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      
      setFormData(prev => ({
        ...prev,
        file,
        size: `${sizeInMB} MB`,
      }));
    }
  }, [toast]);

  const handleAIGenerate = async () => {
    if (!formData.name) {
      toast({
        title: "App Name Required",
        description: "Please enter an app name before generating.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await adminAPI.aiGenerateDescription({
        name: formData.name,
        category: categories.find(c => c.id === formData.category_id)?.name || 'App',
      });

      if (response.data) {
        setFormData(prev => ({
          ...prev,
          description: response.data.description || prev.description,
          short_description: response.data.shortDescription || response.data.description?.slice(0, 100) || prev.short_description,
          tags: response.data.tags || prev.tags,
        }));
        setAiGenerated(true);
        
        toast({
          title: "✨ AI Generated!",
          description: "Description and tags have been filled automatically.",
        });
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast({
        title: "AI Generation Failed",
        description: error?.message || "Could not generate content. Please fill manually.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category_id) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!developerProfile) {
      toast({
        title: "Error",
        description: "Developer profile not found.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      // If we have a file, use backend API
      if (formData.file) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.file);
        uploadFormData.append('name', formData.name);
        uploadFormData.append('description', formData.description);
        uploadFormData.append('short_description', formData.short_description);
        uploadFormData.append('category_id', formData.category_id);
        uploadFormData.append('version', formData.version);
        uploadFormData.append('size', formData.size);
        uploadFormData.append('developer_id', developerProfile.id);
        
        await adminAPI.uploadApp(uploadFormData);
      } else {
        // Use local Supabase for non-file submissions
        await addApp({
          name: formData.name,
          description: formData.description,
          short_description: formData.short_description,
          category_id: formData.category_id,
          version: formData.version,
          size: formData.size || '50 MB',
          icon_url: '📱',
          developer_id: developerProfile.id,
          screenshots: [],
          featured: false,
          trending: false,
        });
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: "🎉 App Submitted!",
        description: "Your app has been submitted for review.",
      });

      // Reset and close
      setTimeout(() => {
        setFormData(initialFormData);
        setUploadProgress(0);
        setAiGenerated(false);
        refreshApps();
        onClose();
      }, 500);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error?.message || "Failed to upload app. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setAiGenerated(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="admin-glass-card border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Upload className="w-5 h-5 text-primary" />
            Upload New App
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'manual' | 'ai')} className="mt-4">
          <TabsList className="grid grid-cols-2 bg-white/5">
            <TabsTrigger 
              value="ai" 
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Assisted
            </TabsTrigger>
            <TabsTrigger 
              value="manual"
              className="data-[state=active]:bg-white/10"
            >
              <FileCode className="w-4 h-4 mr-2" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          {/* File Upload Section - Shared */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Label className="text-sm font-medium mb-2 block">App File (APK/AAB)</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                "hover:border-primary/50 hover:bg-primary/5",
                formData.file 
                  ? "border-success/50 bg-success/5" 
                  : "border-white/20"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".apk,.aab"
                onChange={handleFileSelect}
                className="hidden"
              />
              <AnimatePresence mode="wait">
                {formData.file ? (
                  <motion.div
                    key="file-selected"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center justify-center gap-3"
                  >
                    <div className="p-2 rounded-lg bg-success/20">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{formData.file.name}</p>
                      <p className="text-xs text-muted-foreground">{formData.size}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData(prev => ({ ...prev, file: null, size: '' }));
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-file"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <FileUp className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload <span className="text-primary">.apk</span> or{' '}
                      <span className="text-primary">.aab</span>
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Max 500 MB</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* AI-Assisted Tab */}
          <TabsContent value="ai" className="space-y-4 mt-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* App Name */}
              <div className="space-y-2">
                <Label>App Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Awesome App"
                  className="bg-white/5 border-white/10"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* AI Generate Button */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleAIGenerate}
                  disabled={isGeneratingAI || !formData.name}
                  className={cn(
                    "w-full h-12 relative overflow-hidden",
                    "bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-primary/90"
                  )}
                >
                  {isGeneratingAI ? (
                    <motion.div
                      className="flex items-center gap-2"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>AI is thinking...</span>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </motion.div>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-2" />
                      {aiGenerated ? 'Regenerate with AI' : 'Generate with AI'}
                      <Sparkles className="w-4 h-4 ml-2" />
                    </>
                  )}
                  
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </Button>
              </motion.div>

              {/* AI Generated Fields */}
              <AnimatePresence>
                {aiGenerated && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 text-success text-sm">
                      <Check className="w-4 h-4" />
                      AI-generated content ready!
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Short Description</Label>
                      <Input
                        value={formData.short_description}
                        onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                        className="bg-white/5 border-white/10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Full Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-white/5 border-white/10 min-h-[100px]"
                      />
                    </div>

                    {formData.tags.length > 0 && (
                      <div className="space-y-2">
                        <Label>Tags</Label>
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 rounded-lg bg-primary/20 text-primary text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </TabsContent>

          {/* Manual Entry Tab */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3 space-y-2">
                  <Label>App Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Awesome App"
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Version</Label>
                  <Input
                    value={formData.version}
                    onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="1.0.0"
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Input
                    value={formData.size}
                    onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                    placeholder="50 MB"
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Short Description *</Label>
                <Input
                  value={formData.short_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                  placeholder="A brief description of your app"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label>Full Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of your app features..."
                  className="bg-white/5 border-white/10 min-h-[120px]"
                />
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Upload Progress */}
        <AnimatePresence>
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-medium">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={resetForm} className="flex-1">
            Reset
          </Button>
          <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name || !formData.category_id}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Publish App
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
