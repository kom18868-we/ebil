import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  Search, CreditCard, Download, Eye, Filter, Plus 
} from 'lucide-react';
import { format } from 'date-fns';
import { paymentsApi, type Payment } from '@/lib/api/payments';
import { toast } from 'sonner';

export default function PaymentList() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadPayments();
  }, [statusFilter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (search) {
        params.search = search;
      }

      const response = await paymentsApi.getAll(params);
      
      if (response.data) {
        // Handle paginated response
        if (Array.isArray(response.data)) {
          setPayments(response.data);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          setPayments(response.data.data);
        } else {
          setPayments([]);
        }
      } else {
        setPayments([]);
      }
    } catch (error: any) {
      console.error('Error loading payments:', error);
      toast.error(error?.message || 'Failed to load payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) {
        loadPayments();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const getMethodIcon = (methodType: string) => {
    switch (methodType) {
      case 'credit_card':
      case 'debit_card':
        return '💳';
      case 'bank_account':
        return '🏦';
      case 'digital_wallet':
        return '👛';
      default:
        return '💰';
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

  const handleDownloadReceipt = async (id: number) => {
    try {
      await paymentsApi.downloadReceipt(id);
      toast.success('Receipt downloaded');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to download receipt');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all payment transactions
          </p>
        </div>
        <Button asChild>
          <Link to="/payments/create">
            <Plus className="h-4 w-4 mr-2" />
            Make Payment
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments found"
          description="You haven't made any payments yet."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <p className="font-medium">{payment.payment_reference}</p>
                    </td>
                    <td>
                      {payment.invoice ? (
                        <Link 
                          to={`/invoices/${payment.invoice_id}`}
                          className="text-primary hover:underline"
                        >
                          {payment.invoice.invoice_number || `Invoice #${payment.invoice_id}`}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          Invoice #{payment.invoice_id}
                        </span>
                      )}
                    </td>
                    <td>
                      <p className="font-medium">{payment.user?.name || 'N/A'}</p>
                      {payment.user?.email && (
                        <p className="text-xs text-muted-foreground">{payment.user.email}</p>
                      )}
                    </td>
                    <td>
                      <p className="font-semibold">${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      {payment.payment_type === 'partial' && (
                        <p className="text-xs text-muted-foreground">Partial</p>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span>{getMethodIcon(payment.payment_method?.type || '')}</span>
                        <span className="capitalize">
                          {payment.payment_method?.type 
                            ? getMethodName(payment.payment_method.type)
                            : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={payment.status} />
                    </td>
                    <td>
                      <p className="text-sm">
                        {payment.processed_at 
                          ? format(new Date(payment.processed_at), 'MMM d, yyyy')
                          : format(new Date(payment.created_at), 'MMM d, yyyy')}
                      </p>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/payments/${payment.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {payment.status === 'completed' && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDownloadReceipt(payment.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
