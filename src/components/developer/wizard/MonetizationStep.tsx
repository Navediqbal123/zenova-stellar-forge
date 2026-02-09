import { motion } from 'framer-motion';
import { DollarSign, Shield, Megaphone, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface MonetizationData {
  is_paid: boolean;
  price: string;
  contains_ads: boolean;
  in_app_purchases: boolean;
  privacy_policy_url: string;
}

interface MonetizationStepProps {
  data: MonetizationData;
  onChange: (data: MonetizationData) => void;
}

export function MonetizationStep({ data, onChange }: MonetizationStepProps) {
  const update = <K extends keyof MonetizationData>(key: K, value: MonetizationData[K]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-warning/15">
          <DollarSign className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Monetization & Availability</h2>
          <p className="text-sm text-muted-foreground">Pricing, ads, and policies</p>
        </div>
      </div>

      {/* App Pricing */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">App Pricing</Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => update('is_paid', false)}
            className={cn(
              'p-4 rounded-xl border-2 text-left transition-all',
              !data.is_paid
                ? 'border-primary bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.2)]'
                : 'border-border bg-muted/30 hover:border-muted-foreground/30'
            )}
          >
            <div className="text-2xl mb-2">🆓</div>
            <p className="font-semibold">Free</p>
            <p className="text-xs text-muted-foreground mt-1">
              Available to everyone at no cost
            </p>
          </button>

          <button
            type="button"
            onClick={() => update('is_paid', true)}
            className={cn(
              'p-4 rounded-xl border-2 text-left transition-all',
              data.is_paid
                ? 'border-warning bg-warning/10 shadow-[0_0_15px_hsl(var(--warning)/0.2)]'
                : 'border-border bg-muted/30 hover:border-muted-foreground/30'
            )}
          >
            <div className="text-2xl mb-2">💎</div>
            <p className="font-semibold">Paid</p>
            <p className="text-xs text-muted-foreground mt-1">
              Set a price for your app
            </p>
          </button>
        </div>

        {/* Price input - shown when Paid is selected */}
        {data.is_paid && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <Label>
              Price (INR) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                ₹
              </span>
              <Input
                type="number"
                min="10"
                step="1"
                value={data.price}
                onChange={(e) => update('price', e.target.value)}
                placeholder="99"
                className="bg-muted/50 border-border pl-8"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Checkboxes */}
      <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border">
        <div className="flex items-start gap-3">
          <Checkbox
            id="contains-ads"
            checked={data.contains_ads}
            onCheckedChange={(checked) => update('contains_ads', !!checked)}
            className="mt-0.5"
          />
          <div>
            <label htmlFor="contains-ads" className="font-medium cursor-pointer flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-muted-foreground" />
              Contains Ads
            </label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Check if your app displays advertisements. An "Ads" badge will appear on the listing.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="in-app-purchases"
            checked={data.in_app_purchases}
            onCheckedChange={(checked) => update('in_app_purchases', !!checked)}
            className="mt-0.5"
          />
          <div>
            <label htmlFor="in-app-purchases" className="font-medium cursor-pointer flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
              In-App Purchases
            </label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Check if your app offers in-app purchases or subscriptions.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Policy */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Privacy Policy URL <span className="text-destructive">*</span>
        </Label>
        <Input
          type="url"
          value={data.privacy_policy_url}
          onChange={(e) => update('privacy_policy_url', e.target.value)}
          placeholder="https://yourapp.com/privacy-policy"
          className="bg-muted/50 border-border"
        />
        <p className="text-xs text-muted-foreground">
          Required for all apps. Must be a publicly accessible URL.
        </p>
      </div>
    </motion.div>
  );
}
