import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  Search,
  DollarSign,
  Shield,
  Tag,
  Image,
  Send,
  AlertTriangle,
  Megaphone,
  ShoppingCart,
  RefreshCw,
  UploadCloud,
  Wifi,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useApps } from '@/contexts/AppsContext';
import { useToast } from '@/hooks/use-toast';
import { triggerConfetti } from '@/lib/confetti';
import { cn } from '@/lib/utils';
import { adminAPI } from '@/lib/axios';
import { supabase } from '@/lib/supabase';
import { CountryAvailabilitySelector, type AvailabilityMode } from '@/components/developer/CountryAvailabilitySelector';

interface ScanStep {
  id: string;
  icon: React.ElementType;
  message: string;
  status: 'pending' | 'running' | 'done';
  result?: string;
}

interface AIResult {
  description: string;
  short_description: string;
  category: string;
  tags: string[];
  contains_ads: boolean;
  in_app_purchases: boolean;
  risk_level: 'clean' | 'warning';
  ad_networks: string[];
  iap_sdks: string[];
  icon_url: string | null;
  screenshot_urls: Array<string | null>;
  privacy_summary: string;
  icon_analysis: unknown;
  screenshot_analysis: unknown;
  quality_score: number | null;
}

type AssetCache = {
  icon_url: string | null;
  screenshot_urls: Array<string | null>;
};

const ASSET_CACHE_PREFIX = 'elorax_ai_assets_';

const getAssetCacheKey = (name: string) => `${ASSET_CACHE_PREFIX}${name.trim().toLowerCase()}`;

const readAssetCache = (name: string): AssetCache | null => {
  try {
    const cached = sessionStorage.getItem(getAssetCacheKey(name));
    if (!cached) return null;
    const parsed = JSON.parse(cached) as Partial<AssetCache>;
    return {
      icon_url: typeof parsed.icon_url === 'string' ? parsed.icon_url : null,
      screenshot_urls: Array.from({ length: 4 }, (_, index) => parsed.screenshot_urls?.[index] ?? null),
    };
  } catch {
    return null;
  }
};

const writeAssetCache = (name: string, assets: AssetCache) => {
  try {
    sessionStorage.setItem(getAssetCacheKey(name), JSON.stringify(assets));
  } catch {
    // Previews remain available in memory when browser storage is unavailable.
  }
};

const getErrorStatus = (error: unknown) => {
  if (typeof error !== 'object' || error === null || !('response' in error)) return undefined;
  return (error as { response?: { status?: number } }).response?.status;
};

type ApiErrorDetails = {
  message: string;
  status: string;
  url: string;
};

const AI_UPLOAD_URL = 'https://app-store-backend-iodn.onrender.com/api/ai-upload';

type AIUploadResponse = {
  description?: unknown;
  tags?: unknown;
  privacy_summary?: unknown;
  icon_analysis?: unknown;
  screenshot_analysis?: unknown;
  quality_score?: unknown;
  generated_icon?: unknown;
  generated_screenshots?: unknown;
};

const getAssetUrl = (asset: unknown): string | null => {
  if (typeof asset === 'string' && asset.trim()) return asset;
  if (typeof asset !== 'object' || asset === null) return null;

  const value = asset as Record<string, unknown>;
  const url = value.url ?? value.image_url ?? value.imageUrl;
  return typeof url === 'string' && url.trim() ? url : null;
};

const getGeneratedScreenshots = (assets: unknown): string[] => {
  if (!Array.isArray(assets)) return [];
  return assets.map(getAssetUrl).filter((url): url is string => Boolean(url)).slice(0, 4);
};

const getApiErrorDetails = (error: unknown): ApiErrorDetails => {
  if (typeof error !== 'object' || error === null) {
    return { message: 'Unknown backend error', status: 'Unknown', url: AI_UPLOAD_URL };
  }

  const axiosError = error as {
    message?: string;
    response?: { status?: number; data?: { message?: string; error?: string } };
    config?: { baseURL?: string; url?: string };
  };
  const configuredUrl = axiosError.config?.baseURL && axiosError.config.url
    ? new URL(axiosError.config.url, axiosError.config.baseURL).toString()
    : AI_UPLOAD_URL;

  return {
    message: axiosError.response?.data?.message || axiosError.response?.data?.error || axiosError.message || 'Request failed',
    status: String(axiosError.response?.status ?? 'Network error'),
    url: configuredUrl,
  };
};

export default function AIUploadPage() {
  const navigate = useNavigate();
  const { developerProfile } = useAuth();
  const { categories, addApp, refreshApps } = useApps();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [appName, setAppName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<'input' | 'scanning' | 'review'>('input');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operationStatus, setOperationStatus] = useState<'Generating...' | 'Processing...' | 'Almost done...' | null>(null);
  const [regeneratingAsset, setRegeneratingAsset] = useState<'icon' | number | null>(null);
  const [uploadingAsset, setUploadingAsset] = useState<'icon' | number | null>(null);
  const [apiError, setApiError] = useState<ApiErrorDetails | null>(null);
  const [backendTestStatus, setBackendTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // Availability — never auto-selected by AI, developer picks manually
  const [availabilityMode, setAvailabilityMode] = useState<AvailabilityMode>('worldwide');
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);

  const [scanSteps, setScanSteps] = useState<ScanStep[]>([
    { id: 'manifest', icon: Search, message: 'Scanning APK Manifest for Permissions...', status: 'pending' },
    { id: 'ads', icon: Megaphone, message: 'Detecting Monetization SDKs...', status: 'pending' },
    { id: 'iap', icon: ShoppingCart, message: 'Checking for In-App Purchase SDKs...', status: 'pending' },
    { id: 'description', icon: FileText, message: 'Generating App Description & SEO Tags...', status: 'pending' },
    { id: 'icon', icon: Image, message: 'AI is generating your app icon and screenshots...', status: 'pending' },
    { id: 'security', icon: Shield, message: 'Running Security Assessment...', status: 'pending' },
  ]);

  const [aiResult, setAiResult] = useState<AIResult>({
    description: '',
    short_description: '',
    category: 'tools',
    tags: [],
    contains_ads: false,
    in_app_purchases: false,
    risk_level: 'clean',
    ad_networks: [],
    iap_sdks: [],
    icon_url: null,
    screenshot_urls: [null, null, null, null],
    privacy_summary: '',
    icon_analysis: null,
    screenshot_analysis: null,
    quality_score: null,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if (ext !== 'apk' && ext !== 'aab') {
        toast({ title: 'Invalid File', description: 'Please upload an APK or AAB file.', variant: 'destructive' });
        return;
      }
      setFile(selected);
    }
  };

  const testBackend = async () => {
    setBackendTestStatus('testing');
    setApiError(null);
    try {
      await adminAPI.testBackend();
      setBackendTestStatus('success');
    } catch (error) {
      const details = getApiErrorDetails(error);
      console.error('[AI Upload Backend Test Error]', details);
      setApiError(details);
      setBackendTestStatus('error');
    }
  };

  const runScan = async () => {
    if (!appName.trim() || !file) {
      toast({ title: 'Missing Info', description: 'Please enter app name and upload a file.', variant: 'destructive' });
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    setPhase('scanning');
    setApiError(null);
    setBackendTestStatus('idle');

    setOperationStatus('Generating...');
    setScanSteps(prev => prev.map(step => ({ ...step, status: 'running', result: undefined })));

    try {
      const categoryName = categories.find(category => category.id === 'tools')?.name || 'tools';
      const response = await adminAPI.aiUpload({
        appName,
        category: categoryName,
        permissions: [],
        fileType: file.name.split('.').pop()?.toLowerCase() || 'apk',
        iconUrl: aiResult.icon_url,
        screenshotUrls: aiResult.screenshot_urls.filter((url): url is string => Boolean(url)),
      });
      const data = (response.data || {}) as AIUploadResponse;
      const description = typeof data.description === 'string' ? data.description : '';
      const responseTags = Array.isArray(data.tags)
        ? data.tags.filter((tag): tag is string => typeof tag === 'string')
        : typeof data.tags === 'string'
          ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : [];
      const generatedIcon = getAssetUrl(data.generated_icon);
      const generatedScreenshots = getGeneratedScreenshots(data.generated_screenshots);
      const qualityScore = typeof data.quality_score === 'number' ? data.quality_score : null;

      setOperationStatus('Processing...');
      setAiResult(prev => ({
        ...prev,
        description,
        short_description: description.slice(0, 80),
        tags: responseTags,
        privacy_summary: typeof data.privacy_summary === 'string' ? data.privacy_summary : '',
        icon_url: generatedIcon || prev.icon_url,
        screenshot_urls: [...generatedScreenshots, null, null, null, null].slice(0, 4),
        icon_analysis: data.icon_analysis ?? null,
        screenshot_analysis: data.screenshot_analysis ?? null,
        quality_score: qualityScore,
      }));

      writeAssetCache(appName, {
        icon_url: generatedIcon,
        screenshot_urls: [...generatedScreenshots, null, null, null, null].slice(0, 4),
      });

      setOperationStatus('Almost done...');
      setScanSteps(prev => prev.map(step => ({
        ...step,
        status: 'done',
        result: step.id === 'icon'
          ? `Received ${generatedIcon ? 'icon' : 'no icon'} and ${generatedScreenshots.length} screenshot${generatedScreenshots.length === 1 ? '' : 's'} from AI.`
          : 'Completed from backend response.',
      })));
      setPhase('review');
    } catch (error) {
      const details = getApiErrorDetails(error);
      console.error('[AI Upload Scan Error]', details);
      setApiError(details);
      setPhase('input');
      toast({
        title: 'AI generation failed',
        description: details.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setOperationStatus(null);
    }
  };

  const regenerateIcon = async () => {
    setRegeneratingAsset('icon');
    try {
      const response = await adminAPI.aiGenerateImages({
        name: appName,
        description: aiResult.description,
        category: aiResult.category,
        assetType: 'icon',
      });
      const nextIcon = response.data?.icon_url;
      if (!nextIcon) throw new Error('The AI service did not return a new icon.');
      setAiResult(prev => ({ ...prev, icon_url: nextIcon }));
    } catch (error) {
      toast({ title: 'Icon regeneration failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setRegeneratingAsset(null);
    }
  };

  const regenerateScreenshot = async (index: number) => {
    setRegeneratingAsset(index);
    try {
      const response = await adminAPI.aiGenerateImages({
        name: appName,
        description: aiResult.description,
        category: aiResult.category,
        assetType: 'screenshot',
        screenshotIndex: index,
      });
      const nextScreenshot = response.data?.screenshot_url || response.data?.screenshot_urls?.[index] || response.data?.screenshot_urls?.[0];
      if (!nextScreenshot) throw new Error('The AI service did not return a new screenshot.');
      setAiResult(prev => ({
        ...prev,
        screenshot_urls: prev.screenshot_urls.map((url, screenshotIndex) => screenshotIndex === index ? nextScreenshot : url),
      }));
    } catch (error) {
      toast({ title: `Screenshot ${index + 1} regeneration failed`, description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setRegeneratingAsset(null);
    }
  };

  const uploadAsset = async (fileToUpload: File, type: 'icon' | 'screenshot', index?: number) => {
    const assetKey = type === 'icon' ? 'icon' : index ?? 0;
    setUploadingAsset(assetKey);
    try {
      const bucket = type === 'icon' ? 'app-icons' : 'app-screenshots';
      const safeName = fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `ai-upload/${Date.now()}-${safeName}`;
      const { data, error } = await supabase.storage.from(bucket).upload(path, fileToUpload, { upsert: true });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      if (type === 'icon') {
        setAiResult(prev => ({ ...prev, icon_url: publicUrlData.publicUrl }));
      } else if (typeof index === 'number') {
        setAiResult(prev => ({
          ...prev,
          screenshot_urls: prev.screenshot_urls.map((url, screenshotIndex) => screenshotIndex === index ? publicUrlData.publicUrl : url),
        }));
      }
    } catch (error) {
      toast({ title: 'Asset upload failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setUploadingAsset(null);
    }
  };

  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) void uploadAsset(selected, 'icon');
    event.target.value = '';
  };

  const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const selected = event.target.files?.[0];
    if (selected) void uploadAsset(selected, 'screenshot', index);
    event.target.value = '';
  };

  const handleSubmit = async () => {
    if (!developerProfile) return;
    if (availabilityMode === 'specific' && availableCountries.length === 0) {
      toast({
        title: 'Select countries',
        description: 'Pick at least one country or choose Worldwide.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);

    try {
      // Send category as text string directly (DB column is now TEXT)
      const categoryName = aiResult.category.charAt(0).toUpperCase() + aiResult.category.slice(1).toLowerCase();

      const aiScanReport = JSON.stringify({
        ad_networks: aiResult.ad_networks,
        iap_sdks: aiResult.iap_sdks,
        risk_level: aiResult.risk_level,
        ai_category: categoryName,
        ai_tags: aiResult.tags,
        icon_analysis: aiResult.icon_analysis,
        screenshot_analysis: aiResult.screenshot_analysis,
        quality_score: aiResult.quality_score,
        scanned_at: new Date().toISOString(),
      });

      // Upload file to 'apps' bucket and get public URL
      let apkUrl: string | null = null;
      let aabUrl: string | null = null;

      if (file) {
        const uniqueName = `releases/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('apps')
          .upload(uniqueName, file);

        if (uploadError) {
          console.error('File upload failed:', uploadError);
          throw new Error('File upload failed: ' + uploadError.message);
        }

        const { data: urlData } = supabase.storage.from('apps').getPublicUrl(uploadData.path);
        const publicUrl = urlData.publicUrl;
        console.log('Uploaded file public URL:', publicUrl);

        const fileExt = file.name.split('.').pop()?.toLowerCase();
        if (fileExt === 'aab') {
          aabUrl = publicUrl;
        } else {
          apkUrl = publicUrl;
        }
      }

      await addApp({
        name: appName,
        description: aiResult.description,
        short_description: aiResult.short_description,
        category: categoryName,
        version: '1.0.0',
        size: file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : 'N/A',
        icon_url: aiResult.icon_url || '📱',
        developer_id: developerProfile.id,
        screenshots: aiResult.screenshot_urls.length > 0 ? aiResult.screenshot_urls : [],
        featured: false,
        trending: false,
        is_paid: false,
        price: null,
        contains_ads: aiResult.contains_ads,
        in_app_purchases: aiResult.in_app_purchases,
        ai_scan_report: aiScanReport,
        apk_url: apkUrl,
        aab_url: aabUrl,
        available_countries: availabilityMode === 'worldwide' ? [] : availableCountries,
      } as any);

      triggerConfetti();
      toast({
        title: '🎉 App Submitted!',
        description: 'Your app has been submitted for admin review.',
      });

      await refreshApps();
      navigate('/developer/dashboard');
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error?.message || 'Failed to submit. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="gradient-orb gradient-orb-primary w-[500px] h-[500px] -top-48 -right-48" />
        <div className="gradient-orb gradient-orb-secondary w-[400px] h-[400px] bottom-0 -left-32" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/developer/dashboard')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">AI-Powered Upload</h1>
              <p className="text-sm text-muted-foreground">Just name & file — AI does the rest</p>
            </div>
          </div>
        </div>

        {apiError && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="min-w-0 space-y-1">
                <p className="font-semibold text-destructive">Backend connection failed</p>
                <p className="break-words text-foreground">Error: {apiError.message}</p>
                <p className="text-muted-foreground">Status: {apiError.status}</p>
                <p className="break-all text-muted-foreground">URL: {apiError.url}</p>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* PHASE 1: Input */}
          {phase === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="admin-glass-card p-6 sm:p-8 space-y-6">
                {/* App Name */}
                <div>
                  <label className="text-sm font-medium mb-2 block">App Name *</label>
                  <Input
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="Enter your app name"
                    maxLength={30}
                    className="bg-white/5 border-white/10 text-lg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{appName.length}/30</p>
                </div>

                {/* File Upload */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Upload APK/AAB File *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".apk,.aab"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "w-full p-8 rounded-2xl border-2 border-dashed transition-all text-center",
                      file
                        ? "border-success/50 bg-success/5"
                        : "border-white/20 bg-white/[0.02] hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    {file ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="w-10 h-10 text-success" />
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-10 h-10 text-muted-foreground" />
                        <p className="font-medium">Drag & drop or click to upload</p>
                        <p className="text-sm text-muted-foreground">APK or AAB files only</p>
                      </div>
                    )}
                  </motion.button>
                </div>
              </div>

              <Button
                onClick={runScan}
                disabled={isSubmitting || !appName.trim() || !file}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-12 text-lg"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                {isSubmitting ? operationStatus || 'Generating...' : 'Start AI Scan'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void testBackend()}
                disabled={backendTestStatus === 'testing'}
                className="w-full"
              >
                {backendTestStatus === 'testing' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : backendTestStatus === 'success' ? (
                  <CheckCircle className="mr-2 h-4 w-4 text-success" />
                ) : backendTestStatus === 'error' ? (
                  <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
                ) : (
                  <Wifi className="mr-2 h-4 w-4" />
                )}
                {backendTestStatus === 'testing' ? 'Testing Backend...' : backendTestStatus === 'success' ? 'Backend Working' : backendTestStatus === 'error' ? 'Test Backend Again' : 'Test Backend'}
              </Button>
            </motion.div>
          )}

          {/* PHASE 2: Scanning Terminal */}
          {phase === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="admin-glass-card p-6 sm:p-8 font-mono">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <div className="w-3 h-3 rounded-full bg-success" />
                   <span className="ml-2 text-sm text-muted-foreground">AI Scanner Terminal</span>
                   {operationStatus && <span className="ml-auto text-sm text-primary">{operationStatus}</span>}
                </div>

                <div className="space-y-4">
                  {scanSteps.map((step, i) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2 }}
                      className="space-y-1"
                    >
                      <div className="flex items-center gap-3">
                        {step.status === 'pending' && (
                          <div className="w-5 h-5 rounded-full border border-white/20" />
                        )}
                        {step.status === 'running' && (
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        )}
                        {step.status === 'done' && (
                          <CheckCircle className="w-5 h-5 text-success" />
                        )}
                        <span className={cn(
                          "text-sm",
                          step.status === 'pending' && "text-muted-foreground",
                          step.status === 'running' && "text-primary",
                          step.status === 'done' && "text-foreground"
                        )}>
                          {step.message}
                        </span>
                      </div>
                      {step.result && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="ml-8 text-xs text-muted-foreground"
                        >
                          {step.result}
                        </motion.p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* PHASE 3: Review Summary */}
          {phase === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="admin-glass-card p-6 sm:p-8 space-y-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  AI Scan Complete — Review Summary
                </h2>

                {/* App Info */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">App Name</span>
                    <span className="font-medium">{appName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <Badge variant="outline" className="capitalize">{aiResult.category}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">File Size</span>
                    <span>{file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : 'N/A'}</span>
                  </div>
                </div>

                 {/* Editable AI content */}
                 <div className="space-y-4">
                   <div>
                     <label className="text-sm font-medium mb-1 block">Description</label>
                     <textarea
                       value={aiResult.description}
                       onChange={(event) => setAiResult(prev => ({ ...prev, description: event.target.value, short_description: event.target.value.slice(0, 80) }))}
                       className="flex min-h-[120px] w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                     />
                   </div>
                   <div>
                     <label className="text-sm font-medium mb-1 block">Short Description</label>
                     <Input
                       value={aiResult.short_description}
                       onChange={(event) => setAiResult(prev => ({ ...prev, short_description: event.target.value }))}
                       className="bg-white/[0.03] border-white/10"
                     />
                   </div>
                   {aiResult.privacy_summary && (
                     <div>
                       <label className="text-sm font-medium mb-1 block">Privacy Summary</label>
                       <p className="text-sm text-muted-foreground p-3 rounded-xl bg-white/[0.03] border border-white/10">
                         {aiResult.privacy_summary}
                       </p>
                     </div>
                   )}
                 </div>

                {/* AI-Generated Assets Preview - Large Format */}
                 {(aiResult.icon_url || aiResult.screenshot_urls.some(Boolean)) && (
                  <div className="space-y-6">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Image className="w-4 h-4 text-primary" />
                      AI-Generated App Assets
                    </label>
                    
                     {/* Large Icon Preview */}
                    {aiResult.icon_url && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 border border-primary/20"
                      >
                         <div className="flex flex-col items-center gap-4">
                          <div className="relative">
                            <div className="absolute -inset-3 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-[2rem] blur-xl" />
                            <img
                              src={aiResult.icon_url}
                              alt="AI Generated Icon"
                              className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-[1.5rem] object-cover border-2 border-primary/30 shadow-2xl shadow-primary/20"
                            />
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                              AI Generated
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-lg">{appName}</p>
                            <p className="text-sm text-muted-foreground">App Icon • 512×512px</p>
                          </div>
                           <div className="flex flex-wrap justify-center gap-2">
                             <input ref={iconInputRef} type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
                             <Button type="button" variant="outline" size="sm" onClick={() => iconInputRef.current?.click()} disabled={uploadingAsset === 'icon'}>
                               {uploadingAsset === 'icon' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5 mr-1" />}
                               Upload Icon
                             </Button>
                             <Button type="button" variant="outline" size="sm" onClick={() => void regenerateIcon()} disabled={regeneratingAsset === 'icon'}>
                               {regeneratingAsset === 'icon' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                               Regenerate Icon
                             </Button>
                           </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Large Screenshots Preview */}
                     {aiResult.screenshot_urls.some(Boolean) && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">Screenshots</p>
                          <Badge variant="outline" className="bg-primary/10 border-primary/30">
                             {aiResult.screenshot_urls.filter(Boolean).length} Generated
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           {aiResult.screenshot_urls.slice(0, 4).map((url, i) => url && (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.15 }}
                              className="group relative"
                            >
                              <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="relative aspect-[9/16] rounded-xl overflow-hidden border-2 border-white/10 group-hover:border-primary/30 transition-colors bg-black/20">
                                <img
                                  src={url}
                                  alt={`Screenshot ${i + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                 <div className="absolute bottom-0 inset-x-0 p-3 flex items-end justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                                     <p className="text-sm font-medium text-white">Screenshot {i + 1}</p>
                                     <p className="text-xs text-white/70">AI Generated • 1080×1920px</p>
                                   </div>
                                   <div className="flex gap-1.5">
                                     <input
                                       ref={(element) => { screenshotInputRefs.current[i] = element; }}
                                       type="file"
                                       accept="image/*"
                                       className="hidden"
                                       onChange={(event) => handleScreenshotUpload(event, i)}
                                     />
                                     <Button type="button" size="icon" variant="secondary" className="h-8 w-8" onClick={() => screenshotInputRefs.current[i]?.click()} disabled={uploadingAsset === i} aria-label={`Upload screenshot ${i + 1}`}>
                                       {uploadingAsset === i ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                                     </Button>
                                     <Button type="button" size="icon" variant="secondary" className="h-8 w-8" onClick={() => void regenerateScreenshot(i)} disabled={regeneratingAsset === i} aria-label={`Regenerate screenshot ${i + 1}`}>
                                       {regeneratingAsset === i ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                     </Button>
                                   </div>
                                 </div>
                              </div>
                               <div className="absolute top-3 right-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full opacity-90">
                                 AI Generated
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {aiResult.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="capitalize">
                        <Tag className="w-3 h-3 mr-1" />{tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Monetization Flags - Read Only */}
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={cn(
                      "p-4 rounded-xl border text-left",
                      aiResult.contains_ads
                        ? "bg-warning/5 border-warning/30"
                        : "bg-white/[0.03] border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Megaphone className={cn("w-4 h-4", aiResult.contains_ads ? "text-warning" : "text-muted-foreground")} />
                      <span className="text-sm font-medium">Contains Ads</span>
                    </div>
                    <p className={cn("text-lg font-bold", aiResult.contains_ads ? "text-warning" : "text-success")}>
                      {aiResult.contains_ads ? 'Yes' : 'No Ads Detected'}
                    </p>
                    {aiResult.ad_networks.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Detected: {aiResult.ad_networks.join(', ')}
                      </p>
                    )}
                  </div>

                  <div
                    className={cn(
                      "p-4 rounded-xl border text-left",
                      aiResult.in_app_purchases
                        ? "bg-warning/5 border-warning/30"
                        : "bg-white/[0.03] border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingCart className={cn("w-4 h-4", aiResult.in_app_purchases ? "text-warning" : "text-muted-foreground")} />
                      <span className="text-sm font-medium">In-App Purchases</span>
                    </div>
                    <p className={cn("text-lg font-bold", aiResult.in_app_purchases ? "text-warning" : "text-success")}>
                      {aiResult.in_app_purchases ? 'Yes' : 'No Purchases Detected'}
                    </p>
                    {aiResult.iap_sdks.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Detected: {aiResult.iap_sdks.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Security */}
                <div className={cn(
                  "p-4 rounded-xl border flex items-center gap-3",
                  aiResult.risk_level === 'clean'
                    ? "bg-success/5 border-success/30"
                    : "bg-warning/5 border-warning/30"
                )}>
                  <Shield className={cn(
                    "w-6 h-6",
                    aiResult.risk_level === 'clean' ? "text-success" : "text-warning"
                  )} />
                  <div>
                    <p className="font-medium">
                      Security Assessment: {aiResult.risk_level === 'clean' ? 'Clean' : 'Warning'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {aiResult.risk_level === 'clean'
                        ? 'No malicious code or suspicious permissions detected.'
                        : 'Some permissions require additional review.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Available Countries — manual selection only */}
              <div className="glass-card p-5 rounded-2xl">
                <CountryAvailabilitySelector
                  mode={availabilityMode}
                  countries={availableCountries}
                  onChange={(mode, countries) => {
                    setAvailabilityMode(mode);
                    setAvailableCountries(countries);
                  }}
                />
              </div>

              {/* Submit */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-primary to-success hover:opacity-90 h-12 text-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}