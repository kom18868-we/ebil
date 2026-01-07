import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { paymentMethodsApi, type PaymentMethod } from '@/lib/api/payment-methods';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function PaymentMethodEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingPaymentMethod, setLoadingPaymentMethod] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    expires_at: '',
    is_active: true,
  });

  useEffect(() => {
    const loadPaymentMethod = async () => {
      if (!id) {
        toast.error('Payment method ID not found');
        navigate('/payment-methods');
        return;
      }

      try {
        setLoadingPaymentMethod(true);
        const response = await paymentMethodsApi.getById(Number(id));
        
        if (response.data) {
          setPaymentMethod(response.data);
          setFormData({
            name: response.data.name || '',
            expires_at: response.data.expires_at 
              ? new Date(response.data.expires_at).toISOString().split('T')[0]
              : '',
            is_active: response.data.is_active ?? true,
          });
        } else {
          toast.error('Payment method not found');
          navigate('/payment-methods');
        }
      } catch (error: any) {
        console.error('Error loading payment method:', error);
        toast.error(error?.message || 'Failed to load payment method');
        navigate('/payment-methods');
      } finally {
        setLoadingPaymentMethod(false);
      }
    };

    loadPaymentMethod();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) {
      toast.error('Payment method ID not found');
      return;
    }

    setLoading(true);
    
    try {
      const updateData: any = {
        name: formData.name,
        is_active: formData.is_active,
      };

      if (formData.expires_at) {
        updateData.expires_at = formData.expires_at;
      }

      const response = await paymentMethodsApi.update(Number(id), updateData);
      
      if (response.data) {
        toast.success('Payment method updated successfully!');
        navigate('/payment-methods');
      } else {
        toast.error(response.message || 'Failed to update payment method');
      }
    } catch (error: any) {
      console.error('Error updating payment method:', error);
      toast.error(error?.message || 'Failed to update payment method');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPaymentMethod) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!paymentMethod) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold mb-2">Payment method not found</h2>
        <Button onClick={() => navigate('/payment-methods')}>
          Go back to payment methods
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Payment Method</h1>
          <p className="text-muted-foreground">Update payment method details</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="font-semibold">Payment Method Information</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Payment method name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {paymentMethod.type === 'credit_card' || paymentMethod.type === 'debit_card' ? (
              <div className="space-y-2">
                <Label htmlFor="expires_at">Expiry Date</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Update the expiration date for this card
                </p>
              </div>
            ) : null}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active (Payment method can be used for payments)
              </Label>
            </div>

            {/* Read-only information */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium capitalize">
                  {paymentMethod.type.replace('_', ' ')}
                </span>
              </div>
              {paymentMethod.brand && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brand:</span>
                  <span className="font-medium">{paymentMethod.brand}</span>
                </div>
              )}
              {paymentMethod.last_four && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Four:</span>
                  <span className="font-medium">•••• {paymentMethod.last_four}</span>
                </div>
              )}
              {paymentMethod.is_default && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium text-primary">Default Payment Method</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Payment Method'}
          </Button>
        </div>
      </form>
    </div>
  );
}

