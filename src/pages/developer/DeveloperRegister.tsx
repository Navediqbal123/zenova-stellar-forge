import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Code, 
  User, 
  Building, 
  Globe, 
  Phone, 
  FileText, 
  Loader2,
  CheckCircle,
  Clock,
  Upload,
  CreditCard,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/axios';
import { triggerConfetti } from '@/lib/confetti';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/imageCompression';
import ErrorBoundary from '@/components/ErrorBoundary';

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB strict limit
const VALID_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const UPLOAD_TIMEOUT_MS = 15000; // 15s timeout — fail fast

const countries = [
  "United States", "United Kingdom", "Canada", "Germany", "France", 
  "India", "Japan", "Australia", "Brazil", "Netherlands", "Other"
];

/** Safe image thumbnail — shows fallback icon if the preview fails to render */
function SafeImagePreview({ file }: { file: File }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    try {
      const url = URL.createObjectURL(file);
      setSrc(url);
      return () => URL.revokeObjectURL(url);
    } catch {
      setFailed(true);
    }
  }, [file]);

  if (failed || !src) {
    return (
      <div className="p-2 rounded-lg bg-primary/20">
        <CreditCard className="w-5 h-5 text-primary" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="ID preview"
      className="w-10 h-10 rounded-lg object-cover border border-primary/30"
      onError={() => {
        setFailed(true);
        URL.revokeObjectURL(src);
      }}
    />
  );
}

function DeveloperRegisterForm() {
  const navigate = useNavigate();
  const { user, isAuthenticated, developerProfile, registerDeveloper, isLoading } = useAuth();
  const { toast } = useToast();
  const idFileRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    developer_type: 'individual' as 'individual' | 'company',
    developer_name: '',
    country: '',
    phone: '',
    website: '',
    bio: '',
  });

  // --- All hooks/callbacks BEFORE any early returns ---

  const handleIdFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!VALID_FILE_TYPES.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a JPG, PNG, or PDF file",
          variant: "destructive"
        });
        if (idFileRef.current) idFileRef.current.value = '';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        // Hard reject anything over 5MB — too large even after compression
        toast({
          title: "File Too Large",
          description: "Maximum file size is 5MB. Please use a smaller file.",
          variant: "destructive"
        });
        if (idFileRef.current) idFileRef.current.value = '';
        return;
      }

      if (file.size > MAX_FILE_SIZE && !file.type.startsWith('image/')) {
        // Non-images over 1MB are rejected (can't compress PDFs)
        toast({
          title: "File Too Large",
          description: "Please upload a PDF smaller than 1MB.",
          variant: "destructive"
        });
        if (idFileRef.current) idFileRef.current.value = '';
        return;
      }

      setIdFile(file);
    } catch (error: any) {
      console.error('[DeveloperRegister] File selection error:', error);
      toast({
        title: "File Error",
        description: error?.message || "Failed to process file. Please try again.",
        variant: "destructive"
      });
      if (idFileRef.current) idFileRef.current.value = '';
    }
  }, [toast]);

  const verifySession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Session Expired",
          description: "Please log in again to continue.",
          variant: "destructive"
        });
        navigate('/login');
        return false;
      }
      return true;
    } catch {
      toast({
        title: "Auth Error",
        description: "Could not verify your session. Please log in again.",
        variant: "destructive"
      });
      navigate('/login');
      return false;
    }
  }, [navigate, toast]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('[DeveloperRegister] Submit clicked');

    // --- Client-side validation ---
    if (!user) {
      console.error('[DeveloperRegister] No user found');
      toast({ title: "User Not Found", description: "You must be logged in. Please sign in again.", variant: "destructive" });
      navigate('/login');
      return;
    }

    if (!formData.developer_name.trim() || !formData.country || !formData.phone.trim()) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (!idFile) {
      toast({ title: "ID Required", description: "Please upload a government-issued ID", variant: "destructive" });
      return;
    }

    // Session check
    let isSessionValid = false;
    try {
      isSessionValid = await verifySession();
    } catch (sessionError) {
      console.error('[DeveloperRegister] Session verification crashed:', sessionError);
      toast({ title: "Auth Error", description: "Could not verify your session. Please log in again.", variant: "destructive" });
      return;
    }
    if (!isSessionValid) return;

    console.log('[DeveloperRegister] Validation passed, starting upload...');
    setIsSubmitting(true);
    setUploadProgress(10);

    try {
      // Step 1: Compress image if needed
      toast({ title: "Uploading ID...", description: "Please wait while we process your document." });
      let fileToUpload = idFile;
      
      if (idFile.type.startsWith('image/') && idFile.size > MAX_FILE_SIZE) {
        console.log('[DeveloperRegister] Compressing image...');
        setUploadProgress(15);
        try {
          fileToUpload = await compressImage(idFile, 1);
          console.log(`[DeveloperRegister] Compressed: ${(idFile.size / 1024 / 1024).toFixed(2)}MB → ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`);
        } catch (compressError) {
          console.warn('[DeveloperRegister] Compression failed, using original:', compressError);
          fileToUpload = idFile;
        }
      }

      // If still too large after compression — reject
      if (fileToUpload.size > MAX_FILE_SIZE && fileToUpload.type !== 'application/pdf') {
        toast({ title: "Image Too Heavy", description: "Image is still over 1MB after compression. Please use a different photo.", variant: "destructive" });
        setIsSubmitting(false);
        setUploadProgress(0);
        return;
      }

      // Step 2: Upload to Supabase Storage directly
      const uniqueName = `${user.id}/${Date.now()}-${fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      setUploadProgress(30);
      console.log('[DeveloperRegister] Uploading to Supabase Storage:', uniqueName);

      const uploadPromise = supabase.storage
        .from('developer-ids')
        .upload(uniqueName, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
        });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Upload is taking too long. Please check your internet and try again.')), UPLOAD_TIMEOUT_MS)
      );

      const { data: uploadData, error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]);

      if (uploadError) {
        console.error('[DeveloperRegister] Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      if (!uploadData?.path) {
        throw new Error('Upload completed but no file path was returned.');
      }

      console.log('[DeveloperRegister] File uploaded successfully:', uploadData.path);
      setUploadProgress(60);

      // Step 3: Get the public URL
      const { data: urlData } = supabase.storage
        .from('developer-ids')
        .getPublicUrl(uploadData.path);

      const idDocumentUrl = urlData?.publicUrl || uploadData.path;
      setUploadProgress(70);
      console.log('[DeveloperRegister] Public URL:', idDocumentUrl);

      // Step 4: Try backend API registration first
      try {
        const submitData = new FormData();
        submitData.append('developer_name', formData.developer_name.trim());
        submitData.append('full_name', formData.full_name.trim());
        submitData.append('developer_type', formData.developer_type);
        submitData.append('country', formData.country);
        submitData.append('phone', formData.phone.trim());
        submitData.append('email', user.email || '');
        submitData.append('id_document_url', idDocumentUrl);
        if (formData.website.trim()) submitData.append('website', formData.website.trim());
        if (formData.bio.trim()) submitData.append('bio', formData.bio.trim());

        setUploadProgress(80);
        const response = await adminAPI.registerDeveloper(submitData, () => {});
        setUploadProgress(95);

        if (response.data) {
          setUploadProgress(100);
          triggerConfetti();
          toast({ title: "🎉 Application Submitted!", description: "Your developer application is under review" });
          setTimeout(() => navigate('/developer/dashboard'), 1500);
          return;
        }
      } catch (backendError: any) {
        console.warn('[DeveloperRegister] Backend API failed, trying local fallback:', backendError?.message);
      }

      // Step 5: Fallback - register via local Supabase
      setUploadProgress(85);
      await registerDeveloper({
        full_name: formData.full_name.trim(),
        developer_type: formData.developer_type,
        developer_name: formData.developer_name.trim(),
        country: formData.country,
        phone: formData.phone.trim(),
        website: formData.website.trim(),
        bio: formData.bio.trim(),
      });

      setUploadProgress(100);
      console.log('[DeveloperRegister] Local registration succeeded');
      triggerConfetti();
      toast({ title: "🎉 Application Submitted!", description: "Your developer application is under review" });
      setTimeout(() => navigate('/developer/dashboard'), 1500);

    } catch (error: any) {
      console.error('[DeveloperRegister] Crash error:', error);
      toast({
        title: "Upload Failed",
        description: error?.message || "Upload failed. Please try a smaller image.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  }, [formData, idFile, user, toast, navigate, verifySession, registerDeveloper]);

  // --- Early returns AFTER all hooks ---

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 max-w-md text-center"
        >
          <Code className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to become a developer
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/register')} className="bg-primary hover:bg-primary/90">
              Create Account
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (developerProfile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 max-w-md text-center"
        >
          {developerProfile.status === 'pending' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-warning" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Application Under Review</h2>
              <p className="text-muted-foreground mb-6">
                Your developer application is being reviewed by our team. We'll notify you once it's approved.
              </p>
              <div className="p-4 rounded-lg bg-muted/50 text-left">
                <p className="text-sm"><strong>Name:</strong> {developerProfile.developer_name}</p>
                <p className="text-sm"><strong>Type:</strong> {developerProfile.developer_type}</p>
                <p className="text-sm"><strong>Status:</strong> <span className="text-warning">Pending</span></p>
              </div>
            </>
          ) : developerProfile.status === 'approved' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold mb-2">You're a Developer!</h2>
              <p className="text-muted-foreground mb-6">
                Your account is approved. Start publishing your apps!
              </p>
              <Button onClick={() => navigate('/developer/dashboard')} className="bg-primary hover:bg-primary/90">
                Go to Dashboard
              </Button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">❌</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Application Rejected</h2>
              <p className="text-muted-foreground mb-4">
                Unfortunately, your application was not approved.
              </p>
              {developerProfile.rejection_reason && (
                <div className="p-4 rounded-lg bg-destructive/10 text-left mb-6">
                  <p className="text-sm text-destructive"><strong>Reason:</strong> {developerProfile.rejection_reason}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Please contact support for more information.
              </p>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="glass-card p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-4">
            <Code className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Become a Developer</h1>
          <p className="text-muted-foreground">
            Join our developer program and publish your apps
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Developer Type */}
          <div className="space-y-3">
            <Label>Developer Type *</Label>
            <RadioGroup
              value={formData.developer_type}
              onValueChange={(value: 'individual' | 'company') => 
                setFormData(prev => ({ ...prev, developer_type: value }))
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  Individual
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="company" id="company" />
                <Label htmlFor="company" className="flex items-center gap-2 cursor-pointer">
                  <Building className="w-4 h-4" />
                  Company
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="pl-10 bg-muted/50 border-muted"
                  placeholder="Your full name"
                />
              </div>
            </div>

            {/* Developer/Company Name */}
            <div className="space-y-2">
              <Label htmlFor="developerName">
                {formData.developer_type === 'company' ? 'Company Name' : 'Developer Name'} *
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="developerName"
                  value={formData.developer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, developer_name: e.target.value }))}
                  className="pl-10 bg-muted/50 border-muted"
                  placeholder={formData.developer_type === 'company' ? 'Company name' : 'Display name'}
                />
              </div>
            </div>

            {/* Email (readonly) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted/30 border-muted"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="pl-10 bg-muted/50 border-muted"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
              >
                <SelectTrigger className="bg-muted/50 border-muted">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Website (Optional)</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="pl-10 bg-muted/50 border-muted"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio (Optional)</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="pl-10 bg-muted/50 border-muted min-h-[100px]"
                placeholder="Tell us about yourself or your company..."
              />
            </div>
          </div>

          {/* Government ID Upload */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Government-Issued ID *
            </Label>
            <p className="text-xs text-muted-foreground">
              Upload a clear photo or scan of your ID (Passport, Driver's License, or National ID)
            </p>
            
            <input
              ref={idFileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleIdFileChange}
              className="hidden"
            />

            {!idFile ? (
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => idFileRef.current?.click()}
                className="border-2 border-dashed border-muted rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">
                  Click to upload your ID
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, or PDF (under 1MB recommended, images auto-compressed)
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative p-4 rounded-xl bg-primary/10 border border-primary/30"
              >
                <div className="flex items-center gap-3">
                  {/* Safe image preview — falls back to icon on error */}
                  {idFile.type.startsWith('image/') ? (
                    <SafeImagePreview file={idFile} />
                  ) : (
                    <div className="p-2 rounded-lg bg-primary/20">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{idFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(idFile.size / 1024 / 1024).toFixed(2)} MB
                      {idFile.size > MAX_FILE_SIZE && idFile.type.startsWith('image/') && (
                        <span className="ml-1 text-warning"> — will be compressed</span>
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIdFile(null);
                      if (idFileRef.current) idFileRef.current.value = '';
                    }}
                    className="shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Upload Progress */}
          {isSubmitting && uploadProgress > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="text-primary font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </motion.div>
          )}

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By submitting, you agree to our Developer Terms of Service and Privacy Policy
          </p>
        </form>
      </div>
    </motion.div>
  );
}

// Wrap with ErrorBoundary to prevent white screen crashes
export default function DeveloperRegister() {
  return (
    <ErrorBoundary
      fallbackTitle="Registration Error"
      fallbackMessage="Something went wrong with the registration form. Please try again."
    >
      <DeveloperRegisterForm />
    </ErrorBoundary>
  );
}
