import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { 
  ArrowLeft, Download, Edit, CreditCard, CheckCircle, 
  Building2, User, Calendar, X, Star
} from 'lucide-react';
import { toast } from 'sonner';
import { invoicesApi } from '@/lib/api/invoices';
import type { Invoice } from '@/lib/api/invoices';
import { ratingsApi, type ServiceProviderRating } from '@/lib/api/ratings';
import { RatingForm } from '@/components/RatingForm';
import { RatingStars } from '@/components/RatingStars';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [existingRating, setExistingRating] = useState<ServiceProviderRating | null>(null);
  const [loadingRating, setLoadingRating] = useState(false);

  useEffect(() => {
    const loadInvoice = async () => {
      if (!id) {
        setError('Invoice ID not found');
        setLoading(false);
        return;
      }

      const invoiceId = Number(id);
      if (isNaN(invoiceId)) {
        setError('Invalid invoice ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await invoicesApi.getById(invoiceId);
        
        if (response.data) {
          setInvoice(response.data);
        } else {
          setError(response.message || 'Invoice not found');
        }
      } catch (err: any) {
        console.error('Error loading invoice:', err);
        const errorMessage = err?.message || 'Failed to load invoice';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [id]);

  // Load existing rating for this invoice
  useEffect(() => {
    const loadRating = async () => {
      if (!id || !invoice) return;

      try {
        setLoadingRating(true);
        const response = await ratingsApi.getByInvoice(Number(id));
        // Backend returns { rating: {...} }, so extract the rating object
        const ratingData = (response.data as any)?.rating || response.data;
        if (ratingData && typeof ratingData === 'object' && ratingData.id && typeof ratingData.rating === 'number') {
          setExistingRating(ratingData);
        } else {
          setExistingRating(null);
        }
      } catch (error: any) {
        // Rating doesn't exist yet, that's fine
        console.log('No existing rating found:', error?.message);
        setExistingRating(null);
      } finally {
        setLoadingRating(false);
      }
    };

    if (invoice && invoice.status === 'paid') {
      loadRating();
    }
  }, [id, invoice]);

  const handleDownload = async () => {
    if (!id) {
      toast.error('Invoice ID not found');
      return;
    }
    
    try {
      const invoiceId = Number(id);
      toast.loading('Preparing PDF download...', { id: 'download' });
      await invoicesApi.download(invoiceId);
      toast.success('Invoice PDF downloaded!', { id: 'download' });
    } catch (error: any) {
      console.error('Download error:', error);
      let errorMessage = 'Failed to download invoice PDF';
      
      if (error?.message) {
        if (error.message.includes('Not Found') || error.message.includes('404')) {
          errorMessage = 'Invoice not found. Please make sure the invoice exists in the database.';
        } else if (error.message.includes('Unauthorized') || error.message.includes('403')) {
          errorMessage = 'You do not have permission to download this invoice.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage, { id: 'download' });
    }
  };

  const handleMarkAsPaid = async () => {
    if (!id) return;
    
    try {
      const invoiceId = Number(id);
      const response = await invoicesApi.markAsPaid(invoiceId);
      
      if (response.data) {
        setInvoice(response.data);
        toast.success('Invoice marked as paid!');
      } else {
        toast.error(response.message || 'Failed to mark invoice as paid');
      }
    } catch (error: any) {
      console.error('Error marking invoice as paid:', error);
      toast.error(error?.message || 'Failed to mark invoice as paid');
    }
  };

  const handleCancel = async () => {
    if (!id) {
      toast.error('Invoice ID not found');
      return;
    }

    try {
      setCancelling(true);
      const invoiceId = Number(id);
      const response = await invoicesApi.cancel(invoiceId, cancelReason || undefined);
      
      if (response.data) {
        toast.success('Invoice cancelled successfully!');
        setIsCancelDialogOpen(false);
        setCancelReason('');
        // Reload invoice to get updated status
        const updatedResponse = await invoicesApi.getById(invoiceId);
        if (updatedResponse.data) {
          setInvoice(updatedResponse.data);
        }
      } else {
        toast.error(response.message || 'Failed to cancel invoice');
      }
    } catch (error: any) {
      console.error('Error cancelling invoice:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to cancel invoice';
      toast.error(errorMessage);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold mb-2">Invoice not found</h2>
        <p className="text-muted-foreground mb-4">
          {error || "The invoice you're looking for doesn't exist."}
        </p>
        <Button onClick={() => navigate('/invoices')}>Go back to invoices</Button>
      </div>
    );
  }

  const payments = invoice.payments || [];
  const canCancel = invoice.status !== 'paid' && invoice.status !== 'cancelled';

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
              <StatusBadge status={invoice.status} size="lg" />
            </div>
            <p className="text-muted-foreground mt-1">{invoice.title}</p>
          </div>
        </div>
        <div className="flex gap-3 ml-12 sm:ml-0">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <>
              <Button variant="outline" asChild>
                <Link to={`/invoices/${id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <Button asChild>
                <Link to={`/payments/create?invoice=${id}`}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Now
                </Link>
              </Button>
              {canCancel && (
                <Button 
                  variant="destructive" 
                  onClick={() => setIsCancelDialogOpen(true)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Invoice
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-4">
                  <span className="text-primary-foreground font-bold text-lg">eB</span>
                </div>
                <h2 className="text-xl font-bold">eBill Platform</h2>
                <p className="text-sm text-muted-foreground">contact@ebill.com</p>
              </div>
              <div className="text-right">
                <h3 className="text-2xl font-bold">INVOICE</h3>
                <p className="text-muted-foreground">{invoice.invoice_number}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Bill From</p>
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {invoice.service_provider?.name || 
                       invoice.service_provider?.company_name || 
                       'Service Provider'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.service_provider?.email || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Bill To</p>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{invoice.user?.name || 'Customer'}</p>
                    <p className="text-sm text-muted-foreground">{invoice.user?.email || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Issue Date</p>
                  <p className="font-medium">
                    {invoice.issue_date ? format(new Date(invoice.issue_date), 'MMMM d, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">
                    {invoice.due_date ? format(new Date(invoice.due_date), 'MMMM d, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {invoice.description && (
              <div className="mb-8">
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p>{invoice.description}</p>
              </div>
            )}

            <div className="border-t border-border pt-6">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${invoice.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-muted-foreground">Tax</span>
                <span>${(invoice.tax_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-border">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold">${invoice.total_amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {invoice.status !== 'paid' && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button className="w-full" onClick={handleMarkAsPaid}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Paid
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">Payment History</h3>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet</p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment: any) => {
                  const paymentDate = payment.created_at || payment.createdAt;
                  return (
                    <div key={payment.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{payment.payment_reference || payment.reference || `Payment #${payment.id}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {paymentDate ? format(new Date(paymentDate), 'MMM d, yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-success">
                          +${(payment.amount || 0).toLocaleString()}
                        </p>
                        <StatusBadge status={payment.status || 'completed'} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">Invoice Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={invoice.status} size="sm" />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Number</span>
                <span className="font-mono">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{format(new Date(invoice.created_at), 'MMM d, yyyy')}</span>
              </div>
              {invoice.paid_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid Date</span>
                  <span>{format(new Date(invoice.paid_date), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </div>

          {invoice.status === 'paid' && invoice.service_provider_id && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Rate Service Provider</h3>
              {loadingRating ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : existingRating && typeof existingRating.rating === 'number' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <RatingStars rating={existingRating.rating} size="md" />
                    <span className="text-sm text-muted-foreground">
                      You rated {String(existingRating.rating)} out of 5
                    </span>
                  </div>
                  {existingRating.comment && (
                    <p className="text-sm text-muted-foreground">{String(existingRating.comment)}</p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRatingDialogOpen(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Update Rating
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Share your experience with this service provider
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setIsRatingDialogOpen(true)}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Rate Service Provider
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rating Dialog */}
      <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rate Service Provider</DialogTitle>
            <DialogDescription>
              {existingRating
                ? 'Update your rating for this service provider'
                : 'Share your experience with this service provider'}
            </DialogDescription>
          </DialogHeader>
          {invoice && invoice.service_provider_id && (
            <RatingForm
              serviceProviderId={invoice.service_provider_id}
              invoiceId={invoice.id}
              existingRating={existingRating && existingRating.id ? {
                id: existingRating.id,
                rating: existingRating.rating,
                comment: existingRating.comment || undefined,
              } : undefined}
              onSuccess={() => {
                setIsRatingDialogOpen(false);
                // Reload rating
                const loadRating = async () => {
                  try {
                    const response = await ratingsApi.getByInvoice(Number(id));
                    // Backend returns { rating: {...} }, so extract the rating object
                    const ratingData = (response.data as any)?.rating || response.data;
                    if (ratingData && typeof ratingData === 'object' && ratingData.id && typeof ratingData.rating === 'number') {
                      setExistingRating(ratingData);
                    } else {
                      setExistingRating(null);
                    }
                  } catch (error: any) {
                    console.log('Error reloading rating:', error?.message);
                    setExistingRating(null);
                  }
                };
                loadRating();
              }}
              onCancel={() => setIsRatingDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Invoice Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this invoice? This action cannot be undone. 
              You can optionally provide a reason for cancellation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Cancellation Reason (Optional)</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Enter reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {cancelReason.length}/500 characters
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelReason('')}>
              Keep Invoice
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Invoice'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

