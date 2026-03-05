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
    const { error } = await supabase.from('reviews').upsert(
      { app_id: appId, user_id: userId, rating: userRating, comment: comment || null },
      { onConflict: 'app_id,user_id' }
    );

    if (error) {
      console.error('Review error:', error);
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
      className="glass-card p-5 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Ratings & Reviews</h2>
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-bold">{avgRating}</span>
          <Star className="w-5 h-5 text-warning fill-current" />
          <span className="text-xs text-muted-foreground">({reviews.length})</span>
        </div>
      </div>

      {/* Star rating input */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Rate this app</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setUserRating(star)}
              className="p-1 transition-colors"
            >
              <Star
                className={cn(
                  "w-8 h-8 transition-all duration-200",
                  star <= displayRating
                    ? "text-warning fill-warning drop-shadow-[0_0_6px_hsl(var(--warning)/0.5)]"
                    : "text-muted-foreground/30"
                )}
              />
            </motion.button>
          ))}
        </div>

        <Textarea
          placeholder="Write a review (optional)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="bg-background/50 backdrop-blur-sm border-white/10 resize-none min-h-[70px] text-sm"
        />

        <Button
          onClick={handleSubmit}
          disabled={submitting || userRating === 0}
          size="sm"
          className="rounded-xl gap-2 bg-primary/80 backdrop-blur-sm hover:bg-primary/70"
        >
          <Send className="w-4 h-4" />
          Submit Review
        </Button>
      </div>

      {/* Reviews list */}
      {reviews.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-white/5">
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
                    className={cn(
                      "w-3 h-3",
                      s <= review.rating ? "text-warning fill-warning" : "text-muted-foreground/20"
                    )}
                  />
                ))}
                <span className="text-[10px] text-muted-foreground ml-2">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {review.comment && (
                <p className="text-xs text-muted-foreground/80 leading-relaxed">{review.comment}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
