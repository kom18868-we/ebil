import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ArrowLeft, Download, FileText, CheckCircle, CreditCard, Building2, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { paymentsApi, type Payment } from '@/lib/api/payments';
import { refundsApi, type Refund } from '@/lib/api/refunds';

export default function PaymentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loadingRefunds, setLoadingRefunds] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundForm, setRefundForm] = useState({
    refund_type: 'full' as 'full' | 'partial',
    amount: '',
    reason: '',
    notes: '',
  });
  const [processingRefund, setProcessingRefund] = useState(false);

  useEffect(() => {
    const loadPayment = async () => {
      if (!id) {
        setError('Payment ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await paymentsApi.getById(Number(id));
        
        if (response.data) {
          setPayment(response.data);
        } else {
          setError(response.message || 'Payment not found');
        }
      } catch (err: any) {
        console.error('Error loading payment:', err);
        const errorMessage = err?.message || 'Failed to load payment';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadPayment();
  }, [id]);

  useEffect(() => {
    if (payment?.id) {
      loadRefunds();
    }
  }, [payment?.id]);

  const loadRefunds = async () => {
    if (!payment?.id) return;
    
    try {
      setLoadingRefunds(true);
      const response = await refundsApi.getAll({ payment_id: payment.id });
      if (response.data) {
        setRefunds(Array.isArray(response.data) ? response.data : response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error loading refunds:', err);
    } finally {
      setLoadingRefunds(false);
    }
  };

  const handleRefund = async () => {
    if (!payment) return;

    if (refundForm.refund_type === 'partial' && (!refundForm.amount || parseFloat(refundForm.amount) <= 0)) {
      toast.error('Please enter a valid refund amount');
      return;
    }

    try {
      setProcessingRefund(true);
      const refundData = {
        payment_id: payment.id,
        amount: refundForm.refund_type === 'full' ? paymentAmount : parseFloat(refundForm.amount),
        refund_type: refundForm.refund_type,
        reason: refundForm.reason || undefined,
        notes: refundForm.notes || undefined,
      };

      const response = await refundsApi.create(refundData);
      if (response.data) {
        toast.success('Refund processed successfully');
        setShowRefundDialog(false);
        setRefundForm({ refund_type: 'full', amount: '', reason: '', notes: '' });
        // Reload payment and refunds
        const paymentResponse = await paymentsApi.getById(Number(id));
        if (paymentResponse.data) {
          setPayment(paymentResponse.data);
        }
        loadRefunds();
      }
    } catch (err: any) {
      console.error('Refund error:', err);
      let errorMessage = 'Failed to process refund';
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.response?.data?.errors) {
        const errors = err.response.data.errors;
        errorMessage = Object.values(errors).flat().join(', ');
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      toast.error(errorMessage);
    } finally {
      setProcessingRefund(false);
    }
  };

  const totalRefunded = refunds
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0), 0);
  
  const paymentAmount = payment ? (typeof payment.amount === 'number' ? payment.amount : parseFloat(payment.amount) || 0) : 0;
  const refundableAmount = paymentAmount - totalRefunded;
  const canRefund = payment?.status === 'completed' && refundableAmount > 0;

  const handleDownloadReceipt = async () => {
    if (!id) {
      toast.error('Payment ID not found');
      return;
    }

    try {
      await paymentsApi.downloadReceipt(Number(id));
      toast.success('Receipt downloaded!');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error?.message || 'Failed to download receipt');
    }
  };

  const getMethodIcon = (methodType: string) => {
    switch (methodType) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="h-4 w-4" />;
      case 'bank_account':
        return <Building2 className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getMethodName = (methodType: string) => {
    switch (methodType) {
      case 'credit_card':
        return 'Credit Card';
      case 'debit_card':
        return 'Debit Card';
      case 'bank_account':
        return 'Bank Account';
      case 'digital_wallet':
        return 'Digital Wallet';
      default:
        return methodType.replace('_', ' ');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold mb-2">Payment not found</h2>
        <p className="text-muted-foreground mb-4">
          {error || "The payment you're looking for doesn't exist."}
        </p>
        <Button onClick={() => navigate('/payments')}>Go back to payments</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{payment.payment_reference}</h1>
              <StatusBadge status={payment.status} size="lg" />
            </div>
            <p className="text-muted-foreground mt-1">Payment Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canRefund && (
            <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Request Refund
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Refund</DialogTitle>
                  <DialogDescription>
                    Process a refund for this payment. Refundable amount: ${refundableAmount.toFixed(2)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Refund Type</Label>
                    <Select
                      value={refundForm.refund_type}
                      onValueChange={(value: 'full' | 'partial') => {
                        setRefundForm({ ...refundForm, refund_type: value, amount: value === 'full' ? '' : refundForm.amount });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Refund (${paymentAmount.toFixed(2)})</SelectItem>
                        <SelectItem value="partial">Partial Refund</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {refundForm.refund_type === 'partial' && (
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={refundableAmount}
                        value={refundForm.amount}
                        onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                        placeholder={`Max: $${refundableAmount.toFixed(2)}`}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Reason (Optional)</Label>
                    <Input
                      value={refundForm.reason}
                      onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                      placeholder="Reason for refund"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={refundForm.notes}
                      onChange={(e) => setRefundForm({ ...refundForm, notes: e.target.value })}
                      placeholder="Additional notes"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleRefund} disabled={processingRefund}>
                    {processingRefund ? 'Processing...' : 'Process Refund'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {payment.status === 'completed' && (
            <Button onClick={handleDownloadReceipt}>
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
          )}
        </div>
      </div>

      {/* Payment Receipt */}
      <div className="rounded-xl border border-border bg-card p-8">
        {/* Success Header */}
        {payment.status === 'completed' && (
          <div className="text-center mb-8 pb-8 border-b border-border">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-success-light mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold">Payment Successful</h2>
            <p className="text-muted-foreground">
              {payment.processed_at 
                ? `Paid on ${format(new Date(payment.processed_at), 'MMMM d, yyyy')} at ${format(new Date(payment.processed_at), 'h:mm a')}`
                : `Created on ${format(new Date(payment.created_at), 'MMMM d, yyyy')} at ${format(new Date(payment.created_at), 'h:mm a')}`
              }
            </p>
          </div>
        )}

        {/* Amount */}
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
          <p className="text-4xl font-bold">
            ${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {payment.payment_type === 'partial' && (
            <p className="text-sm text-muted-foreground mt-2">Partial Payment</p>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="flex justify-between py-3 border-b border-border">
            <span className="text-muted-foreground">Payment Reference</span>
            <span className="font-medium">{payment.payment_reference}</span>
          </div>
          
          {payment.gateway_transaction_id && (
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono text-sm">{payment.gateway_transaction_id}</span>
            </div>
          )}
          
          <div className="flex justify-between py-3 border-b border-border items-center">
            <span className="text-muted-foreground">Invoice</span>
            {payment.invoice ? (
              <Link 
                to={`/invoices/${payment.invoice_id}`} 
                className="text-primary hover:underline flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {payment.invoice.invoice_number || `Invoice #${payment.invoice_id}`}
              </Link>
            ) : (
              <span className="text-muted-foreground">Invoice #{payment.invoice_id}</span>
            )}
          </div>
          
          <div className="flex justify-between py-3 border-b border-border items-center">
            <span className="text-muted-foreground">Payment Method</span>
            <div className="flex items-center gap-2">
              {payment.payment_method?.type 
                ? getMethodIcon(payment.payment_method.type)
                : <CreditCard className="h-4 w-4" />
              }
              <span className="capitalize">
                {payment.payment_method?.type 
                  ? getMethodName(payment.payment_method.type)
                  : 'N/A'}
              </span>
              {payment.payment_method?.last_four && (
                <span className="text-muted-foreground">
                  •••• {payment.payment_method.last_four}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex justify-between py-3 border-b border-border">
            <span className="text-muted-foreground">Customer</span>
            <span className="font-medium">{payment.user?.name || 'N/A'}</span>
          </div>

          {payment.gateway && (
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Gateway</span>
              <span className="font-medium capitalize">{payment.gateway}</span>
            </div>
          )}
          
          <div className="flex justify-between py-3 border-b border-border">
            <span className="text-muted-foreground">Created Date</span>
            <span className="font-medium">
              {format(new Date(payment.created_at), 'MMMM d, yyyy')}
            </span>
          </div>

          {payment.processed_at && (
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Processed Date</span>
              <span className="font-medium">
                {format(new Date(payment.processed_at), 'MMMM d, yyyy')}
              </span>
            </div>
          )}

          {payment.notes && (
            <div className="flex justify-between py-3">
              <span className="text-muted-foreground">Notes</span>
              <span className="font-medium text-right max-w-md">{payment.notes}</span>
            </div>
          )}
        </div>

        {/* Invoice Info */}
        {payment.invoice && (
          <div className="mt-8 pt-8 border-t border-border">
            <h3 className="font-semibold mb-4">Invoice Details</h3>
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Title</span>
                <span className="font-medium">{payment.invoice.title || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Total</span>
                <span className="font-medium">
                  ${payment.invoice.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={payment.invoice.status || 'pending'} size="sm" />
              </div>
            </div>
          </div>
        )}

        {/* Refunds Section */}
        {(refunds.length > 0 || canRefund) && (
          <div className="mt-8 pt-8 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Refunds</h3>
              {totalRefunded > 0 && (
                <span className="text-sm text-muted-foreground">
                  Total Refunded: ${totalRefunded.toFixed(2)}
                </span>
              )}
            </div>
            {loadingRefunds ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : refunds.length > 0 ? (
              <div className="space-y-3">
                {refunds.map((refund) => (
                  <div key={refund.id} className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{refund.refund_reference}</span>
                        <StatusBadge status={refund.status} size="sm" />
                      </div>
                      <span className="font-semibold text-primary">
                        ${(typeof refund.amount === 'number' ? refund.amount : parseFloat(refund.amount) || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Type: {refund.refund_type === 'full' ? 'Full' : 'Partial'}</div>
                      {refund.reason && <div>Reason: {refund.reason}</div>}
                      <div>
                        {refund.processed_at 
                          ? `Processed: ${format(new Date(refund.processed_at), 'MMM d, yyyy h:mm a')}`
                          : `Created: ${format(new Date(refund.created_at), 'MMM d, yyyy h:mm a')}`
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No refunds yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
