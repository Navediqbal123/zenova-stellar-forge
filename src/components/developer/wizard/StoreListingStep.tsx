import { motion } from 'framer-motion';
import { FileText, Tag, Mail, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { Category } from '@/types/database.types';

export interface StoreListingData {
  name: string;
  short_description: string;
  description: string;
  category_id: string;
  tags: string[];
  contact_email: string;
  contact_website: string;
}

interface StoreListingStepProps {
  data: StoreListingData;
  onChange: (data: StoreListingData) => void;
  categories: Category[];
}

export function StoreListingStep({ data, onChange, categories }: StoreListingStepProps) {
  const [tagInput, setTagInput] = useState('');

  const update = <K extends keyof StoreListingData>(key: K, value: StoreListingData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !data.tags.includes(tag) && data.tags.length < 10) {
      update('tags', [...data.tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    update('tags', data.tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-primary/15">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Store Listing</h2>
          <p className="text-sm text-muted-foreground">How your app appears on the store</p>
        </div>
      </div>

      {/* App Name */}
      <div className="space-y-2">
        <Label>
          App Name <span className="text-destructive">*</span>
        </Label>
        <Input
          value={data.name}
          onChange={(e) => update('name', e.target.value.slice(0, 30))}
          placeholder="My Awesome App"
          className="bg-muted/50 border-border"
          maxLength={30}
        />
        <p className="text-xs text-muted-foreground text-right">{data.name.length}/30</p>
      </div>

      {/* Short Description */}
      <div className="space-y-2">
        <Label>
          Short Description <span className="text-destructive">*</span>
        </Label>
        <Input
          value={data.short_description}
          onChange={(e) => update('short_description', e.target.value.slice(0, 80))}
          placeholder="A brief summary of your app"
          className="bg-muted/50 border-border"
          maxLength={80}
        />
        <p className="text-xs text-muted-foreground text-right">{data.short_description.length}/80</p>
      </div>

      {/* Full Description */}
      <div className="space-y-2">
        <Label>
          Full Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          value={data.description}
          onChange={(e) => update('description', e.target.value.slice(0, 4000))}
          placeholder="Describe your app in detail. What problem does it solve? What features does it have?"
          className="bg-muted/50 border-border min-h-[160px]"
          maxLength={4000}
        />
        <p className="text-xs text-muted-foreground text-right">{data.description.length}/4000</p>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>
          Category <span className="text-destructive">*</span>
        </Label>
        <Select value={data.category_id} onValueChange={(v) => update('category_id', v)}>
          <SelectTrigger className="bg-muted/50 border-border">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Tag className="w-4 h-4" /> Tags
        </Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Add a tag and press Enter"
            className="bg-muted/50 border-border"
          />
        </div>
        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors"
                onClick={() => removeTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">{data.tags.length}/10 tags</p>
      </div>

      {/* Contact Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Mail className="w-4 h-4" /> Contact Email
          </Label>
          <Input
            type="email"
            value={data.contact_email}
            onChange={(e) => update('contact_email', e.target.value)}
            placeholder="support@yourapp.com"
            className="bg-muted/50 border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Globe className="w-4 h-4" /> Website URL
          </Label>
          <Input
            type="url"
            value={data.contact_website}
            onChange={(e) => update('contact_website', e.target.value)}
            placeholder="https://yourapp.com"
            className="bg-muted/50 border-border"
          />
        </div>
      </div>
    </motion.div>
  );
}
