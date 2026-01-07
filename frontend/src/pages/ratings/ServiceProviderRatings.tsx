import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { RatingStars } from '@/components/RatingStars';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Star, Filter } from 'lucide-react';
import { ratingsApi, type ServiceProviderRating, type RatingStatistics } from '@/lib/api/ratings';
import { serviceProvidersApi, type ServiceProvider } from '@/lib/api/service-providers';
import { toast } from 'sonner';

export default function ServiceProviderRatings() {
  const { id } = useParams<{ id: string }>();
  const [serviceProvider, setServiceProvider] = useState<ServiceProvider | null>(null);
  const [ratings, setRatings] = useState<ServiceProviderRating[]>([]);
  const [statistics, setStatistics] = useState<RatingStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });

  useEffect(() => {
    if (id) {
      loadServiceProvider();
      loadRatings();
    }
  }, [id, ratingFilter]);

  const loadServiceProvider = async () => {
    if (!id) return;

    try {
      const response = await serviceProvidersApi.getById(Number(id));
      if (response.data) {
        setServiceProvider(response.data);
      }
    } catch (error: any) {
      console.error('Error loading service provider:', error);
      toast.error('Failed to load service provider');
    }
  };

  const loadRatings = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await ratingsApi.getByServiceProvider(Number(id), {
        page: pagination.current_page,
        per_page: pagination.per_page,
        rating: ratingFilter !== 'all' ? Number(ratingFilter) : undefined,
      });

      if (response.data) {
        setRatings(response.data.ratings.data || []);
        setStatistics(response.data.statistics);
        setPagination({
          current_page: response.data.ratings.current_page || 1,
          last_page: response.data.ratings.last_page || 1,
          total: response.data.ratings.total || 0,
          per_page: response.data.ratings.per_page || 10,
        });
      }
    } catch (error: any) {
      console.error('Error loading ratings:', error);
      toast.error('Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !serviceProvider) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!serviceProvider) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold mb-2">Service provider not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{serviceProvider.company_name}</h1>
        <p className="text-muted-foreground">Customer Reviews & Ratings</p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {statistics.average_rating.toFixed(1)}
              </div>
              <RatingStars rating={statistics.average_rating} size="lg" />
              <p className="text-sm text-muted-foreground mt-2">
                Average Rating
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {statistics.total_ratings}
              </div>
              <p className="text-sm text-muted-foreground">
                Total Reviews
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium mb-2">Rating Distribution</p>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = statistics.rating_distribution[rating as keyof typeof statistics.rating_distribution];
                const percentage = statistics.total_ratings > 0
                  ? (count / statistics.total_ratings) * 100
                  : 0;
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-8">{rating}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter by rating:</span>
        </div>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All ratings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ratings List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : ratings.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No ratings yet</h3>
          <p className="text-muted-foreground">
            This service provider hasn't received any ratings yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ratings.map((rating) => (
            <div key={rating.id} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {rating.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{rating.user?.name || 'Anonymous'}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(rating.created_at), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <RatingStars rating={rating.rating} size="md" />
              </div>
              {rating.comment && (
                <p className="text-sm text-muted-foreground mt-3">{rating.comment}</p>
              )}
              {rating.invoice && (
                <p className="text-xs text-muted-foreground mt-2">
                  For invoice: {rating.invoice.invoice_number}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPagination({ ...pagination, current_page: pagination.current_page - 1 });
            }}
            disabled={pagination.current_page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.current_page} of {pagination.last_page}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPagination({ ...pagination, current_page: pagination.current_page + 1 });
            }}
            disabled={pagination.current_page === pagination.last_page}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

