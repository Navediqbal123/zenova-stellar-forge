import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
}

interface RatingReviewProps {
  appId: string;
}

const STAR_COLOR = '#FFB800';
const ACCENT = '#0EA5E9';

export default function RatingReview({ appId }: RatingReviewProps) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    fetchReviews();
  }, [appId]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('app_id', appId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setReviews(data);
  };

  const handleSubmit = async () => {
    if (!userId) {
      toast({ title: 'Login Required', description: 'Please login to rate this app.', variant: 'destructive' });
      return;
    }
    if (userRating === 0) {
      toast({ title: 'Select Rating', description: 'Please select at least 1 star.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      app_id: appId,
      user_id: userId,
      rating: userRating,
      comment: comment || null,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '⭐ Review Submitted', description: 'Thank you for your feedback!' });
      setComment('');
      fetchReviews();
    }
    setSubmitting(false);
  };

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const displayRating = hoverRating || userRating;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="p-5 space-y-5"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 12 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Ratings & Reviews</h2>
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-bold text-slate-900">{avgRating}</span>
          <Star className="w-5 h-5" style={{ color: STAR_COLOR, fill: STAR_COLOR }} />
          <span className="text-xs text-slate-500">({reviews.length})</span>
        </div>
      </div>

      {/* 5-star breakdown */}
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = reviews.filter((r) => r.rating === star).length;
          const pct = reviews.length ? (count / reviews.length) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600 w-3 text-right">{star}</span>
              <Star className="w-3 h-3 shrink-0" style={{ color: STAR_COLOR, fill: STAR_COLOR }} />
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E5EA' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: (5 - star) * 0.05 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: STAR_COLOR }}
                />
              </div>
              <span className="text-xs text-slate-500 w-8 text-right tabular-nums">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <p className="text-sm text-slate-500">Rate this app</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setUserRating(star)}
              className="p-1"
            >
              <Star
                className="w-8 h-8 transition-all duration-200"
                style={
                  star <= displayRating
                    ? { color: STAR_COLOR, fill: STAR_COLOR }
                    : { color: '#D1D1D6' }
                }
              />
            </motion.button>
          ))}
        </div>

        <Textarea
          placeholder="Write a review (optional)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="resize-none min-h-[70px] text-sm border-0 text-slate-900 placeholder:text-slate-400"
          style={{ backgroundColor: '#F2F2F7' }}
        />

        <Button
          onClick={handleSubmit}
          disabled={submitting || userRating === 0}
          size="sm"
          className="rounded-xl gap-2 text-white hover:opacity-90"
          style={{ backgroundColor: ACCENT }}
        >
          <Send className="w-4 h-4" />
          Submit Review
        </Button>
      </div>

      {reviews.length > 0 && (
        <div className="space-y-3 pt-2 border-t" style={{ borderColor: '#E5E5EA' }}>
          {reviews.slice(0, 5).map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="space-y-1"
            >
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="w-3 h-3"
                    style={s <= review.rating ? { color: STAR_COLOR, fill: STAR_COLOR } : { color: '#D1D1D6' }}
                  />
                ))}
                <span className="text-[10px] text-slate-400 ml-2">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {review.comment && (
                <p className="text-xs text-slate-600 leading-relaxed">{review.comment}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
