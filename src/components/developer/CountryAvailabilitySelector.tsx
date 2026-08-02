import { useMemo, useState } from 'react';
import { Globe2, MapPin, Search, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { COUNTRIES, countryName } from '@/lib/countries';
import { cn } from '@/lib/utils';

export type AvailabilityMode = 'worldwide' | 'specific';

interface CountryAvailabilitySelectorProps {
  mode: AvailabilityMode;
  countries: string[];
  onChange: (mode: AvailabilityMode, countries: string[]) => void;
  className?: string;
}

/**
 * Available Countries picker used by both the manual upload wizard
 * and the AI-powered upload flow. Nothing is auto-selected — the
 * developer always chooses manually.
 */
export function CountryAvailabilitySelector({
  mode,
  countries,
  onChange,
  className,
}: CountryAvailabilitySelectorProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [query]);

  const toggle = (code: string) => {
    const next = countries.includes(code)
      ? countries.filter((c) => c !== code)
      : [...countries, code];
    onChange('specific', next);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <p className="text-sm font-medium">Available Countries</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Choose where your app can be discovered and installed.
        </p>
      </div>

      {/* Mode options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange('worldwide', [])}
          className={cn(
            'p-4 rounded-2xl border text-left transition-all',
            mode === 'worldwide'
              ? 'border-primary bg-primary/10'
              : 'border-white/10 bg-white/[0.03] hover:border-primary/40'
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <Globe2 className="w-4 h-4 text-primary" strokeWidth={1.8} />
            <span className="text-sm font-semibold">Worldwide</span>
            {mode === 'worldwide' && <Check className="w-4 h-4 ml-auto text-primary" />}
          </div>
          <p className="text-xs text-muted-foreground">Available in every country (default)</p>
        </button>

        <button
          type="button"
          onClick={() => onChange('specific', countries)}
          className={cn(
            'p-4 rounded-2xl border text-left transition-all',
            mode === 'specific'
              ? 'border-primary bg-primary/10'
              : 'border-white/10 bg-white/[0.03] hover:border-primary/40'
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-primary" strokeWidth={1.8} />
            <span className="text-sm font-semibold">Select Specific Countries</span>
            {mode === 'specific' && <Check className="w-4 h-4 ml-auto text-primary" />}
          </div>
          <p className="text-xs text-muted-foreground">Pick countries manually</p>
        </button>
      </div>

      {mode === 'specific' && (
        <div className="space-y-3">
          {/* Selected chips */}
          {countries.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {countries.map((code) => (
                <Badge
                  key={code}
                  variant="secondary"
                  className="gap-1 pr-1 text-[11px]"
                >
                  {countryName(code)}
                  <button
                    type="button"
                    aria-label={`Remove ${countryName(code)}`}
                    onClick={() => toggle(code)}
                    className="rounded-full p-0.5 hover:bg-white/10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search countries..."
              className="pl-9 bg-white/5 border-white/10"
            />
          </div>

          {/* Checkbox list */}
          <div className="max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/5">
            {filtered.length === 0 && (
              <p className="p-4 text-xs text-muted-foreground text-center">No countries found</p>
            )}
            {filtered.map((c) => {
              const checked = countries.includes(c.code);
              return (
                <label
                  key={c.code}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/[0.04]"
                >
                  <span
                    className={cn(
                      'w-[18px] h-[18px] rounded-[6px] border flex items-center justify-center shrink-0 transition-colors',
                      checked ? 'bg-primary border-primary' : 'border-white/25'
                    )}
                  >
                    {checked && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggle(c.code)}
                  />
                  <span className="text-sm flex-1 min-w-0 truncate">{c.name}</span>
                  <span className="text-[11px] text-muted-foreground">{c.code}</span>
                </label>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            {countries.length} {countries.length === 1 ? 'country' : 'countries'} selected
          </p>
        </div>
      )}
    </div>
  );
}
