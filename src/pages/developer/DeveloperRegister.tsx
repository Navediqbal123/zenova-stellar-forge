import { useState } from 'react';
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
  Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const countries = [
  "United States", "United Kingdom", "Canada", "Germany", "France", 
  "India", "Japan", "Australia", "Brazil", "Netherlands", "Other"
];

export default function DeveloperRegister() {
  const navigate = useNavigate();
  const { user, isAuthenticated, developerProfile, registerDeveloper, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    developerType: 'individual' as 'individual' | 'company',
    developerName: '',
    country: '',
    phone: '',
    website: '',
    bio: '',
  });

  // If not authenticated, show login prompt
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

  // If already registered as developer
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
                <p className="text-sm"><strong>Name:</strong> {developerProfile.developerName}</p>
                <p className="text-sm"><strong>Type:</strong> {developerProfile.developerType}</p>
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
              {developerProfile.rejectionReason && (
                <div className="p-4 rounded-lg bg-destructive/10 text-left mb-6">
                  <p className="text-sm text-destructive"><strong>Reason:</strong> {developerProfile.rejectionReason}</p>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.developerName || !formData.country || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await registerDeveloper(formData);
      toast({
        title: "Application Submitted!",
        description: "Your developer application is under review"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              value={formData.developerType}
              onValueChange={(value: 'individual' | 'company') => 
                setFormData(prev => ({ ...prev, developerType: value }))
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
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="pl-10 bg-muted/50 border-muted"
                  placeholder="Your full name"
                />
              </div>
            </div>

            {/* Developer/Company Name */}
            <div className="space-y-2">
              <Label htmlFor="developerName">
                {formData.developerType === 'company' ? 'Company Name' : 'Developer Name'} *
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="developerName"
                  value={formData.developerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, developerName: e.target.value }))}
                  className="pl-10 bg-muted/50 border-muted"
                  placeholder={formData.developerType === 'company' ? 'Company name' : 'Display name'}
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
