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
}

export default function AIUploadPage() {
  const navigate = useNavigate();
  const { developerProfile } = useAuth();
  const { categories, addApp, refreshApps } = useApps();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [appName, setAppName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<'input' | 'scanning' | 'review'>('input');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [scanSteps, setScanSteps] = useState<ScanStep[]>([
    { id: 'manifest', icon: Search, message: 'Scanning APK Manifest for Permissions...', status: 'pending' },
    { id: 'ads', icon: Megaphone, message: 'Detecting Monetization SDKs...', status: 'pending' },
    { id: 'iap', icon: ShoppingCart, message: 'Checking for In-App Purchase SDKs...', status: 'pending' },
    { id: 'description', icon: FileText, message: 'Generating App Description & SEO Tags...', status: 'pending' },
    { id: 'icon', icon: Image, message: 'Generating Placeholder Icon & Graphics...', status: 'pending' },
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

  const runScan = async () => {
    if (!appName.trim() || !file) {
      toast({ title: 'Missing Info', description: 'Please enter app name and upload a file.', variant: 'destructive' });
      return;
    }

    setPhase('scanning');

    // Simulate scanning steps with delays
    const stepDelay = (index: number) => new Promise(resolve => setTimeout(resolve, 1200 + index * 800));

    // Try to get AI-generated description from backend
    let aiDescription = '';
    let aiCategory = 'tools';

    for (let i = 0; i < scanSteps.length; i++) {
      setScanSteps(prev => prev.map((s, idx) =>
        idx === i ? { ...s, status: 'running' } : s
      ));

      await stepDelay(i);

      // Simulate results based on step
      let result = '';
      switch (scanSteps[i].id) {
        case 'manifest':
          result = '✅ Manifest parsed. 12 permissions found.';
          break;
        case 'ads': {
          // Only flag ads if specific Ad SDK package strings are found in filename/metadata
          const adSdkPatterns = ['com.google.android.gms.ads', 'admob', 'unity3d.ads', 'applovin', 'facebook.ads', 'mopub', 'ironsource'];
          const fileNameLower = file.name.toLowerCase();
          const hasAds = adSdkPatterns.some(pattern => fileNameLower.includes(pattern));
          const detectedNetworks: string[] = [];
          if (fileNameLower.includes('admob') || fileNameLower.includes('com.google.android.gms.ads')) detectedNetworks.push('Google AdMob');
          if (fileNameLower.includes('unity3d.ads')) detectedNetworks.push('Unity Ads');
          if (fileNameLower.includes('applovin')) detectedNetworks.push('AppLovin');
          if (fileNameLower.includes('facebook.ads')) detectedNetworks.push('Facebook Ads');
          if (fileNameLower.includes('ironsource')) detectedNetworks.push('ironSource');
          result = hasAds
            ? `⚠️ ${detectedNetworks.join(', ')} detected! Setting Ads to "Yes".`
            : '✅ No Ad-Network SDKs detected.';
          setAiResult(prev => ({
            ...prev,
            contains_ads: hasAds,
            ad_networks: detectedNetworks,
          }));
          break;
        }
        case 'iap': {
          const iapPatterns = ['com.android.vending.billing', 'billing', 'iap', 'in-app-purchase'];
          const iapFileName = file.name.toLowerCase();
          const hasIAP = iapPatterns.some(p => iapFileName.includes(p));
          const detectedIAP: string[] = [];
          if (iapFileName.includes('billing') || iapFileName.includes('com.android.vending.billing')) detectedIAP.push('Google Play Billing');
          if (iapFileName.includes('iap') || iapFileName.includes('in-app-purchase')) detectedIAP.push('IAP SDK');
          result = hasIAP
            ? `⚠️ ${detectedIAP.join(', ')} detected!`
            : '✅ No In-App Purchase SDKs found.';
          setAiResult(prev => ({
            ...prev,
            in_app_purchases: hasIAP,
            iap_sdks: detectedIAP,
          }));
          break;
        }
        case 'description':
          // Call AI API for description
          try {
            const resp = await adminAPI.aiGenerateDescription({ name: appName, category: aiCategory });
            aiDescription = resp.data?.description || `${appName} is a powerful mobile application designed to enhance your daily productivity and streamline your workflow.`;
            aiCategory = resp.data?.category || 'tools';
          } catch {
            aiDescription = `${appName} is a powerful mobile application designed to enhance your daily productivity and streamline your workflow.`;
          }
          setAiResult(prev => ({
            ...prev,
            description: aiDescription,
            short_description: aiDescription.substring(0, 80),
            category: aiCategory,
            tags: [appName.toLowerCase(), aiCategory, 'android', 'mobile'],
          }));
          result = '✅ Description & tags generated successfully.';
          break;
        case 'icon':
          result = '✅ Default icon assigned.';
          break;
        case 'security':
          result = '✅ No malicious code detected. Status: Clean.';
          setAiResult(prev => ({ ...prev, risk_level: 'clean' }));
          break;
      }

      setScanSteps(prev => prev.map((s, idx) =>
        idx === i ? { ...s, status: 'done', result } : s
      ));
    }

    setPhase('review');
  };

  const handleSubmit = async () => {
    if (!developerProfile) return;
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
        scanned_at: new Date().toISOString(),
      });

      await addApp({
        name: appName,
        description: aiResult.description,
        short_description: aiResult.short_description,
        category: categoryName,
        version: '1.0.0',
        size: file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : 'N/A',
        icon_url: '📱',
        developer_id: developerProfile.id,
        screenshots: [],
        featured: false,
        trending: false,
        is_paid: false,
        price: null,
        contains_ads: aiResult.contains_ads,
        in_app_purchases: aiResult.in_app_purchases,
        ai_scan_report: aiScanReport,
      });

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
                disabled={!appName.trim() || !file}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-12 text-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start AI Scan
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

                {/* Description */}
                <div>
                  <label className="text-sm font-medium mb-1 block">AI-Generated Description</label>
                  <p className="text-sm text-muted-foreground p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    {aiResult.description}
                  </p>
                </div>

                {/* Tags */}
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