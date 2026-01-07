import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RatingStars } from '@/components/RatingStars';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { ratingsApi, type CreateRatingData, type UpdateRatingData } from '@/lib/api/ratings';
import { Star, Send } from 'lucide-react';

interface RatingFormProps {
  serviceProviderId: number;
  invoiceId?: number;
  existingRating?: {
    id: number;
    rating: number;
    comment?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RatingForm({
  serviceProviderId,
  invoiceId,
  existingRating,
  onSuccess,
  onCancel,
}: RatingFormProps) {
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [comment, setComment] = useState(existingRating?.comment || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);

    try {
      if (existingRating && existingRating.id) {
        // Update existing rating
        const response = await ratingsApi.update(existingRating.id, {
          rating,
          comment: comment || undefined,
        });

        if (response.errors) {
          const errorMessage = response.errors.general?.[0] || response.message || 'Failed to update rating';
          toast.error(errorMessage);
        } else if (response.data) {
          toast.success('Rating updated successfully!');
          onSuccess?.();
        }
      } else {
        // Create new rating
        const data: CreateRatingData = {
          service_provider_id: serviceProviderId,
          rating,
          comment: comment || undefined,
        };

        if (invoiceId) {
          data.invoice_id = invoiceId;
        }

        const response = await ratingsApi.create(data);

        if (response.errors) {
          const errorMessage = response.errors.general?.[0] || response.message || 'Failed to submit rating';
          toast.error(errorMessage);
        } else if (response.data) {
          toast.success('Rating submitted successfully!');
          onSuccess?.();
        }
      }
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast.error(error?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Rating *</Label>
        <div className="flex items-center gap-4">
          <RatingStars
            rating={rating}
            interactive
            onRatingChange={setRating}
            size="lg"
          />
          {rating > 0 && (
            <span className="text-sm text-muted-foreground">
              {rating} out of 5
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Comment (Optional)</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this service provider..."
          rows={4}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground">
          {comment.length}/1000 characters
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting || rating === 0}>
          {submitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {existingRating ? 'Updating...' : 'Submitting...'}
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {existingRating ? 'Update Rating' : 'Submit Rating'}
            </>
          )}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

