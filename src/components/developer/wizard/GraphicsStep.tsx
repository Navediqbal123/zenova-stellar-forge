import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Upload, X, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/imageCompression';

export interface GraphicsData {
  icon: File | null;
  iconPreview: string | null;
  featureGraphic: File | null;
  featureGraphicPreview: string | null;
  phoneScreenshots: File[];
  phoneScreenshotPreviews: string[];
  tabletScreenshots: File[];
  tabletScreenshotPreviews: string[];
}

interface GraphicsStepProps {
  data: GraphicsData;
  onChange: (data: GraphicsData) => void;
}

function ImageUploadBox({
  label,
  hint,
  preview,
  onSelect,
  onRemove,
  accept = 'image/png,image/jpeg,image/webp',
  className,
}: {
  label: string;
  hint: string;
  preview: string | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  accept?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      <div
        onClick={() => !preview && inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-xl overflow-hidden transition-all cursor-pointer',
          'hover:border-primary/50 hover:bg-primary/5',
          preview ? 'border-success/30' : 'border-border'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelect(file);
            if (inputRef.current) inputRef.current.value = '';
          }}
        />

        {preview ? (
          <div className="relative group">
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <X className="w-4 h-4 mr-1" /> Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 min-h-[120px]">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{hint}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function GraphicsStep({ data, onChange }: GraphicsStepProps) {
  const { toast } = useToast();

  const processImage = useCallback(
    async (file: File): Promise<{ file: File; preview: string }> => {
      try {
        const processed = file.size > 1 * 1024 * 1024 ? await compressImage(file) : file;
        const preview = URL.createObjectURL(processed);
        return { file: processed, preview };
      } catch {
        const preview = URL.createObjectURL(file);
        return { file, preview };
      }
    },
    []
  );

  const handleIconSelect = async (file: File) => {
    const result = await processImage(file);
    onChange({
      ...data,
      icon: result.file,
      iconPreview: result.preview,
    });
  };

  const handleFeatureSelect = async (file: File) => {
    const result = await processImage(file);
    onChange({
      ...data,
      featureGraphic: result.file,
      featureGraphicPreview: result.preview,
    });
  };

  const handleScreenshotAdd = async (file: File, type: 'phone' | 'tablet') => {
    const key = type === 'phone' ? 'phoneScreenshots' : 'tabletScreenshots';
    const previewKey = type === 'phone' ? 'phoneScreenshotPreviews' : 'tabletScreenshotPreviews';

    if (data[key].length >= 8) {
      toast({
        title: 'Maximum Reached',
        description: 'You can upload up to 8 screenshots.',
        variant: 'destructive',
      });
      return;
    }

    const result = await processImage(file);
    onChange({
      ...data,
      [key]: [...data[key], result.file],
      [previewKey]: [...data[previewKey], result.preview],
    });
  };

  const removeScreenshot = (index: number, type: 'phone' | 'tablet') => {
    const key = type === 'phone' ? 'phoneScreenshots' : 'tabletScreenshots';
    const previewKey = type === 'phone' ? 'phoneScreenshotPreviews' : 'tabletScreenshotPreviews';

    const oldPreview = data[previewKey][index];
    if (oldPreview) URL.revokeObjectURL(oldPreview);

    onChange({
      ...data,
      [key]: data[key].filter((_, i) => i !== index),
      [previewKey]: data[previewKey].filter((_, i) => i !== index),
    });
  };

  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const tabletInputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-secondary/15">
          <Image className="w-5 h-5 text-secondary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Graphics</h2>
          <p className="text-sm text-muted-foreground">Visual assets for your store listing</p>
        </div>
      </div>

      {/* Icon + Feature side by side on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <ImageUploadBox
          label="App Icon (512×512)"
          hint="PNG or JPG, 512×512px"
          preview={data.iconPreview}
          onSelect={handleIconSelect}
          onRemove={() =>
            onChange({ ...data, icon: null, iconPreview: null })
          }
        />
        <ImageUploadBox
          label="Feature Graphic (1024×500)"
          hint="PNG or JPG, 1024×500px"
          preview={data.featureGraphicPreview}
          onSelect={handleFeatureSelect}
          onRemove={() =>
            onChange({ ...data, featureGraphic: null, featureGraphicPreview: null })
          }
        />
      </div>

      {/* Phone Screenshots */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Phone Screenshots (Min 2, Max 8)</Label>
          <span className="text-xs text-muted-foreground">
            {data.phoneScreenshots.length}/8
          </span>
        </div>

        {data.phoneScreenshots.length < 2 && (
          <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 border border-warning/20 p-2 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            At least 2 screenshots are required
          </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {data.phoneScreenshotPreviews.map((preview, i) => (
            <div key={i} className="relative aspect-[9/16] rounded-lg overflow-hidden border border-border group">
              <img src={preview} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removeScreenshot(i, 'phone')}
                className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {data.phoneScreenshots.length < 8 && (
            <div
              onClick={() => screenshotInputRef.current?.click()}
              className="aspect-[9/16] rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Add</span>
            </div>
          )}
        </div>

        <input
          ref={screenshotInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleScreenshotAdd(file, 'phone');
            if (screenshotInputRef.current) screenshotInputRef.current.value = '';
          }}
        />
      </div>

      {/* Tablet Screenshots - Optional */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Tablet Screenshots (Optional, Max 8)</Label>
          <span className="text-xs text-muted-foreground">
            {data.tabletScreenshots.length}/8
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.tabletScreenshotPreviews.map((preview, i) => (
            <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border group">
              <img src={preview} alt={`Tablet ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removeScreenshot(i, 'tablet')}
                className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {data.tabletScreenshots.length < 8 && (
            <div
              onClick={() => tabletInputRef.current?.click()}
              className="aspect-[4/3] rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Add</span>
            </div>
          )}
        </div>

        <input
          ref={tabletInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleScreenshotAdd(file, 'tablet');
            if (tabletInputRef.current) tabletInputRef.current.value = '';
          }}
        />
      </div>
    </motion.div>
  );
}
