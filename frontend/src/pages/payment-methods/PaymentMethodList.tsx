import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard, Building2, Star, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { paymentMethodsApi, PaymentMethod } from '@/lib/api/payment-methods';

export default function PaymentMethodList() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await paymentMethodsApi.getAll();
      if (response.data) {
        setPaymentMethods(response.data);
      }
    } catch (error: any) {
      console.error('Error loading payment methods:', error);
      toast.error(error?.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      const response = await paymentMethodsApi.makeDefault(id);
      if (response.data) {
        toast.success('Default payment method updated!');
        loadPaymentMethods(); // Reload to update the UI
      } else {
        toast.error(response.message || 'Failed to set default payment method');
      }
    } catch (error: any) {
      console.error('Error setting default:', error);
      toast.error(error?.message || 'Failed to set default payment method');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      const response = await paymentMethodsApi.delete(id);
      if (response.data !== undefined || !response.errors) {
        toast.success('Payment method removed!');
        loadPaymentMethods(); // Reload to update the UI
      } else {
        toast.error(response.message || 'Failed to delete payment method');
      }
    } catch (error: any) {
      console.error('Error deleting payment method:', error);
      toast.error(error?.message || 'Failed to delete payment method');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <p className="text-muted-foreground mt-1">Manage your saved payment methods</p>
        </div>
        <Button asChild>
          <Link to="/payment-methods/create">
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading payment methods...</p>
        </div>
      ) : paymentMethods.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No payment methods found</p>
          <Button asChild>
            <Link to="/payment-methods/create">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Payment Method
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => {
            const isCard = method.type === 'credit_card' || method.type === 'debit_card';
            const displayName = isCard 
              ? `${method.brand || 'Card'} •••• ${method.last_four || '****'}`
              : method.name;
            
            return (
              <div key={method.id} className="rounded-xl border border-border bg-card p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                  {isCard ? (
                    <CreditCard className="h-6 w-6 text-primary" />
                  ) : (
                    <Building2 className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{displayName}</p>
                    {method.is_default && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="h-3 w-3" /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{method.name}</p>
                  {method.expires_at && (
                    <p className="text-xs text-muted-foreground">
                      Expires {new Date(method.expires_at).toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {!method.is_default && (
                    <Button variant="outline" size="sm" onClick={() => handleSetDefault(method.id)}>
                      Set Default
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/payment-methods/${method.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(method.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
