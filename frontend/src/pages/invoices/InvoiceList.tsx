import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { invoicesApi } from '@/lib/api/invoices';
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
  Plus, Search, FileText, Download, Eye, Edit, Trash2, Filter 
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Invoice {
  id: number;
  invoice_number: string;
  title: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'overdue';
  due_date: string;
  issue_date: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  service_provider?: {
    id: number;
    name?: string;
    company_name?: string;
  };
}

export default function InvoiceList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const canCreate = user?.role === 'admin' || user?.role === 'service_provider' || user?.roles?.some((r: any) => r.name === 'service_provider');

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (search) {
        params.search = search;
      }

      const response = await invoicesApi.getAll(params);
      
      if (response.data) {
        // Handle paginated response
        if (Array.isArray(response.data)) {
          setInvoices(response.data);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          setInvoices(response.data.data);
        } else {
          setInvoices([]);
        }
      } else {
        setInvoices([]);
      }
    } catch (error: any) {
      console.error('Error loading invoices:', error);
      toast.error(error?.message || 'Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) {
        loadInvoices();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Client-side filtering only for search (status filtering is done on backend)
  const filteredInvoices = invoices.filter((invoice) => {
    if (!search) return true;
    
    return (
      invoice.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.title?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.user?.name?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      await invoicesApi.delete(id);
      toast.success('Invoice deleted successfully');
      loadInvoices();
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      toast.error(error?.message || 'Failed to delete invoice');
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
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your invoices
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link to="/invoices/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices found"
          description={invoices.length === 0 
            ? "You haven't created any invoices yet. Create your first invoice to get started."
            : "No invoices match your search criteria. Try adjusting your filters."}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">{invoice.title}</p>
                      </div>
                    </td>
                    <td>
                      <p className="font-medium">{invoice.user?.name || 'N/A'}</p>
                      {invoice.user?.email && (
                        <p className="text-xs text-muted-foreground">{invoice.user.email}</p>
                      )}
                    </td>
                    <td>
                      <p className="font-semibold">${invoice.total_amount.toLocaleString()}</p>
                      {invoice.tax_amount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Tax: ${invoice.tax_amount.toLocaleString()}
                        </p>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td>
                      <p className="text-sm">
                        {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : 'N/A'}
                      </p>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/invoices/${invoice.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {canCreate && invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/invoices/${invoice.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        {canCreate && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(invoice.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={async () => {
                            try {
                              await invoicesApi.download(invoice.id);
                              toast.success('Invoice downloaded');
                            } catch (error: any) {
                              toast.error(error?.message || 'Failed to download invoice');
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
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
