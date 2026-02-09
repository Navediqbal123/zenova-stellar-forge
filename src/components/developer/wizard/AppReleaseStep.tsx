import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUp, CheckCircle2, X, Rocket, FileCode } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface ReleaseData {
  file: File | null;
  fileSize: string;
  releaseNotes: string;
}

interface AppReleaseStepProps {
  data: ReleaseData;
  onChange: (data: ReleaseData) => void;
}

export function AppReleaseStep({ data, onChange }: AppReleaseStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const validExts = ['.apk', '.aab'];
      const isValid = validExts.some((ext) => file.name.toLowerCase().endsWith(ext));

      if (!isValid) {
        toast({
          title: 'Invalid File',
          description: 'Please upload an APK or AAB file.',
          variant: 'destructive',
        });
        return;
      }

      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      onChange({
        ...data,
        file,
        fileSize: `${sizeInMB} MB`,
      });
    },
    [data, onChange, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-success/15">
          <Rocket className="w-5 h-5 text-success" />
        </div>
        <div>
          <h2 className="text-xl font-bold">App File & Release</h2>
          <p className="text-sm text-muted-foreground">Upload your app bundle and write release notes</p>
        </div>
      </div>

      {/* File Upload - Drag & Drop */}
      <div className="space-y-2">
        <Label>
          Upload AAB/APK <span className="text-destructive">*</span>
        </Label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !data.file && fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
            isDragging
              ? 'border-primary bg-primary/10 scale-[1.02]'
              : data.file
              ? 'border-success/40 bg-success/5'
              : 'border-border hover:border-primary/50 hover:bg-primary/5'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".apk,.aab"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />

          <AnimatePresence mode="wait">
            {data.file ? (
              <motion.div
                key="selected"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <div>
                  <p className="font-semibold">{data.file.name}</p>
                  <p className="text-sm text-muted-foreground">{data.fileSize}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ ...data, file: null, fileSize: '' });
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <X className="w-4 h-4 mr-1" /> Remove
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <motion.div
                  animate={isDragging ? { scale: 1.15, y: -5 } : { scale: 1, y: 0 }}
                  className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center"
                >
                  <FileUp className="w-8 h-8 text-muted-foreground" />
                </motion.div>
                <div>
                  <p className="font-medium">
                    Drag & drop your{' '}
                    <span className="text-primary">.apk</span> or{' '}
                    <span className="text-primary">.aab</span> file here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">or click to browse • Max 500 MB</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Release Notes */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <FileCode className="w-4 h-4" />
          Release Notes <span className="text-destructive">*</span>
        </Label>
        <Textarea
          value={data.releaseNotes}
          onChange={(e) => onChange({ ...data, releaseNotes: e.target.value })}
          placeholder="What's new in this release?&#10;&#10;• Bug fixes and performance improvements&#10;• New feature: Dark mode&#10;• Updated UI design"
          className="bg-muted/50 border-border min-h-[140px]"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">
          {data.releaseNotes.length}/500
        </p>
      </div>
    </motion.div>
  );
}
