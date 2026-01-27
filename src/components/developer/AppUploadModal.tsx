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
  ArrowLeft,
  UploadCloud,
  Image,
  Camera,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useApps } from '@/contexts/AppsContext';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/lib/axios';
import { cn } from '@/lib/utils';
import { UploadModeSelector } from './UploadModeSelector';
import { triggerConfetti, triggerSuccessConfetti } from '@/lib/confetti';
import { AIThinkingAnimation } from './AIThinkingAnimation';

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
  const [uploadMode, setUploadMode] = useState<'select' | 'manual' | 'ai'>('select');
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
      // If we have a file, use backend API with progress tracking
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
        
        await adminAPI.uploadApp(uploadFormData, (progress) => {
          setUploadProgress(progress);
        });
      } else {
        // Simulate progress for local uploads
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + Math.random() * 15;
          });
        }, 200);

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

        clearInterval(progressInterval);
      }

      setUploadProgress(100);

      // Trigger success confetti animation
      triggerConfetti();

      toast({
        title: "🎉 App Submitted!",
        description: "Your app has been submitted for review.",
      });

      // Reset and close
      setTimeout(() => {
        resetForm();
        refreshApps();
        onClose();
      }, 500);
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Send error to chatbot for assistance
      try {
        await adminAPI.getChatbotHelpWithContext(
          error?.message || 'App upload failed',
          'Developer Dashboard - App Upload'
        );
      } catch {}

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
    setUploadMode('select');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleModeSelect = (mode: 'manual' | 'ai') => {
    setUploadMode(mode);
  };

  const handleBack = () => {
    setUploadMode('select');
    setFormData(initialFormData);
    setAiGenerated(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // File upload section shared between modes
  const FileUploadSection = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4"
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
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="admin-glass-card border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {uploadMode !== 'select' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mr-2 -ml-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Upload className="w-5 h-5 text-primary" />
            Upload New App
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Mode Selection */}
          {uploadMode === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="py-4"
            >
              <UploadModeSelector onSelectMode={handleModeSelect} />
            </motion.div>
          )}

          {/* AI-Assisted Upload */}
          {uploadMode === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 py-4"
            >
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">AI-Assisted Mode</span>
              </div>

              <FileUploadSection />

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

              {/* AI Generate Button or Animation */}
              <AnimatePresence mode="wait">
                {isGeneratingAI ? (
                  <AIThinkingAnimation stage="analyzing" />
                ) : (
                  <motion.div 
                    key="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleAIGenerate}
                      disabled={isGeneratingAI || !formData.name}
                      className={cn(
                        "w-full h-14 relative overflow-hidden text-lg",
                        "bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-primary/90"
                      )}
                    >
                      <Wand2 className="w-5 h-5 mr-2" />
                      {aiGenerated ? 'Regenerate with AI' : 'Magic Generate'}
                      <Sparkles className="w-4 h-4 ml-2" />
                      
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

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

              {/* Submit Button */}
              {(aiGenerated || formData.description) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 pt-2"
                >
                  {uploadProgress > 0 && (
                    <div className="space-y-1">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        {uploadProgress < 100 ? 'Uploading...' : 'Complete!'}
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.name || !formData.category_id}
                    className="w-full bg-success hover:bg-success/90"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4 mr-2" />
                        Publish App
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Manual Upload */}
          {uploadMode === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 py-4"
            >
              <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/10 border border-secondary/20">
                <FileCode className="w-5 h-5 text-secondary" />
                <span className="text-sm font-medium text-secondary">Manual Entry Mode</span>
              </div>

              <FileUploadSection />

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
                    disabled={!!formData.file}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Short Description</Label>
                <Input
                  value={formData.short_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                  placeholder="A brief description of your app"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label>Full Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your app in detail..."
                  rows={4}
                  className="bg-white/5 border-white/10"
                />
              </div>

              {/* Submit Button */}
              <div className="space-y-3 pt-2">
                {uploadProgress > 0 && (
                  <div className="space-y-1">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      {uploadProgress < 100 ? 'Uploading...' : 'Complete!'}
                    </p>
                  </div>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.name || !formData.category_id}
                  className="w-full bg-success hover:bg-success/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4 mr-2" />
                      Submit for Review
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
