import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LifeBuoy, RefreshCw, CheckCircle, Clock, Loader2, Mail, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { SupportTicket } from '@/types/database.types';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'open' | 'resolved';

export function AdminSupportTickets() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Could not load tickets', description: error.message, variant: 'destructive' });
    } else {
      setTickets((data || []) as SupportTicket[]);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const setStatus = async (ticket: SupportTicket, status: 'open' | 'resolved') => {
    setUpdatingId(ticket.id);
    const { error } = await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticket.id);
    setUpdatingId(null);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      return;
    }
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, status } : t)));
    toast({ title: status === 'resolved' ? 'Marked as resolved' : 'Re-opened', description: ticket.subject });
  };

  const visible = tickets.filter((t) => {
    if (filter !== 'all' && t.status !== filter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      t.subject?.toLowerCase().includes(q) ||
      t.message?.toLowerCase().includes(q) ||
      (t.email || '').toLowerCase().includes(q)
    );
  });

  const openCount = tickets.filter((t) => t.status === 'open').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <LifeBuoy className="w-5 h-5 text-primary" strokeWidth={1.8} />
          <div>
            <h2 className="text-xl font-bold">Support Tickets</h2>
            <p className="text-xs text-muted-foreground">{openCount} open · {tickets.length} total</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTickets} disabled={isLoading}>
          <RefreshCw className={cn('w-4 h-4 mr-1.5', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'open', 'resolved'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-colors',
              filter === f
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground'
            )}
          >
            {f}
          </button>
        ))}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tickets..."
            className="pl-9 h-9 bg-white/5 border-white/10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : visible.length === 0 ? (
        <div className="admin-glass-card p-10 text-center">
          <LifeBuoy className="w-10 h-10 mx-auto mb-3 text-muted-foreground" strokeWidth={1.5} />
          <p className="font-semibold">No tickets found</p>
          <p className="text-sm text-muted-foreground mt-1">Developer support messages will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="admin-glass-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{t.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    {t.email || t.user_id?.slice(0, 8)}
                    <span className="mx-1">·</span>
                    {t.created_at ? new Date(t.created_at).toLocaleString() : '—'}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'shrink-0 capitalize gap-1',
                    t.status === 'resolved'
                      ? 'border-green-500/40 text-green-500 bg-green-500/10'
                      : 'border-amber-500/40 text-amber-500 bg-amber-500/10'
                  )}
                >
                  {t.status === 'resolved' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {t.status}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{t.message}</p>

              <div className="flex gap-2">
                {t.status === 'open' ? (
                  <Button
                    size="sm"
                    disabled={updatingId === t.id}
                    onClick={() => setStatus(t, 'resolved')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {updatingId === t.id ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1.5" />}
                    Mark Resolved
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updatingId === t.id}
                    onClick={() => setStatus(t, 'open')}
                  >
                    {updatingId === t.id ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Clock className="w-4 h-4 mr-1.5" />}
                    Re-open
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
