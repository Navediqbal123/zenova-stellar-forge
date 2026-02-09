import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useApps } from '@/contexts/AppsContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { triggerConfetti } from '@/lib/confetti';
import { cn } from '@/lib/utils';

import { WizardStepper } from '@/components/developer/wizard/WizardStepper';
import { StoreListingStep, type StoreListingData } from '@/components/developer/wizard/StoreListingStep';
import { GraphicsStep, type GraphicsData } from '@/components/developer/wizard/GraphicsStep';
import { MonetizationStep, type MonetizationData } from '@/components/developer/wizard/MonetizationStep';
import { AppReleaseStep, type ReleaseData } from '@/components/developer/wizard/AppReleaseStep';

const STEPS = [
  { id: 1, label: 'Store Listing', description: 'App details' },
  { id: 2, label: 'Graphics', description: 'Visual assets' },
  { id: 3, label: 'Monetization', description: 'Pricing & policy' },
  { id: 4, label: 'Release', description: 'Upload & submit' },
];

export default function AppUploadWizard() {
  const navigate = useNavigate();
  const { developerProfile } = useAuth();
  const { categories, addApp, refreshApps } = useApps();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step data
  const [storeListing, setStoreListing] = useState<StoreListingData>({
    name: '',
    short_description: '',
    description: '',
    category_id: '',
    tags: [],
    contact_email: '',
    contact_website: '',
  });

  const [graphics, setGraphics] = useState<GraphicsData>({
    icon: null,
    iconPreview: null,
    featureGraphic: null,
    featureGraphicPreview: null,
    phoneScreenshots: [],
    phoneScreenshotPreviews: [],
    tabletScreenshots: [],
    tabletScreenshotPreviews: [],
  });

  const [monetization, setMonetization] = useState<MonetizationData>({
    is_paid: false,
    price: '',
    contains_ads: false,
    in_app_purchases: false,
    privacy_policy_url: '',
  });

  const [release, setRelease] = useState<ReleaseData>({
    file: null,
    fileSize: '',
    releaseNotes: '',
  });

  // Validation per step
  const validateStep = (step: number): string | null => {
    switch (step) {
      case 1:
        if (!storeListing.name.trim()) return 'App name is required';
        if (!storeListing.short_description.trim()) return 'Short description is required';
        if (!storeListing.description.trim()) return 'Full description is required';
        if (!storeListing.category_id) return 'Category is required';
        return null;
      case 2:
        if (graphics.phoneScreenshots.length < 2) return 'At least 2 phone screenshots are required';
        return null;
      case 3:
        if (!monetization.privacy_policy_url.trim()) return 'Privacy policy URL is required';
        if (monetization.is_paid && (!monetization.price || Number(monetization.price) < 10))
          return 'Price must be at least ₹10';
        return null;
      case 4:
        if (!release.releaseNotes.trim()) return 'Release notes are required';
        return null;
      default:
        return null;
    }
  };

  const isAllValid =
    !validateStep(1) && !validateStep(2) && !validateStep(3) && !validateStep(4);

  const goNext = () => {
    const error = validateStep(currentStep);
    if (error) {
      toast({ title: 'Missing Info', description: error, variant: 'destructive' });
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, 4));
  };

  const goPrev = () => setCurrentStep((s) => Math.max(s - 1, 1));

  // Upload file to storage helper
  const uploadToStorage = useCallback(
    async (file: File, bucket: string, folder: string): Promise<string | null> => {
      const uniqueName = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data, error } = await supabase.storage.from(bucket).upload(uniqueName, file);
      if (error) {
        console.error(`Upload to ${bucket} failed:`, error);
        return null;
      }
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return urlData.publicUrl;
    },
    []
  );

  const handleSubmit = async () => {
    if (!developerProfile) {
      toast({ title: 'Error', description: 'Developer profile not found.', variant: 'destructive' });
      return;
    }

    const finalError = validateStep(1) || validateStep(2) || validateStep(3) || validateStep(4);
    if (finalError) {
      toast({ title: 'Incomplete', description: finalError, variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload icon
      let iconUrl = '📱';
      if (graphics.icon) {
        const url = await uploadToStorage(graphics.icon, 'app-assets', 'icons');
        if (url) iconUrl = url;
      }

      // Upload screenshots
      const screenshotUrls: string[] = [];
      for (const ss of graphics.phoneScreenshots) {
        const url = await uploadToStorage(ss, 'app-assets', 'screenshots');
        if (url) screenshotUrls.push(url);
      }

      // Upload APK/AAB
      let apkUrl: string | null = null;
      if (release.file) {
        apkUrl = await uploadToStorage(release.file, 'app-assets', 'releases');
      }

      // Insert to database
      await addApp({
        name: storeListing.name,
        description: storeListing.description,
        short_description: storeListing.short_description,
        category_id: storeListing.category_id,
        version: '1.0.0',
        size: release.fileSize || 'N/A',
        icon_url: iconUrl,
        developer_id: developerProfile.id,
        screenshots: screenshotUrls,
        featured: false,
        trending: false,
        is_paid: monetization.is_paid,
        price: monetization.is_paid ? Number(monetization.price) : null,
        apk_url: apkUrl,
      });

      triggerConfetti();

      toast({
        title: '🎉 App Submitted!',
        description: 'Your app has been submitted for review.',
      });

      await refreshApps();
      navigate('/developer/dashboard');
    } catch (error: any) {
      console.error('Wizard submit error:', error);
      toast({
        title: 'Submission Failed',
        description: error?.message || 'Failed to submit app. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="gradient-orb gradient-orb-primary w-[500px] h-[500px] -top-48 -right-48" />
        <div className="gradient-orb gradient-orb-secondary w-[400px] h-[400px] bottom-0 -left-32" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/developer/dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Create New App</h1>
            <p className="text-sm text-muted-foreground">Fill out each section to publish your app</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <WizardStepper steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Step Content */}
        <div className="admin-glass-card p-5 sm:p-8 mb-6">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <StoreListingStep
                key="step1"
                data={storeListing}
                onChange={setStoreListing}
                categories={categories}
              />
            )}
            {currentStep === 2 && (
              <GraphicsStep key="step2" data={graphics} onChange={setGraphics} />
            )}
            {currentStep === 3 && (
              <MonetizationStep key="step3" data={monetization} onChange={setMonetization} />
            )}
            {currentStep === 4 && (
              <AppReleaseStep key="step4" data={release} onChange={setRelease} />
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentStep === 1}
            className="border-border"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-3">
            {currentStep < 4 ? (
              <Button onClick={goNext} className="bg-primary hover:bg-primary/90">
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isAllValid}
                  className={cn(
                    'bg-gradient-to-r from-primary to-success hover:opacity-90 min-w-[160px]',
                    isSubmitting && 'opacity-70'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit for Review
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
