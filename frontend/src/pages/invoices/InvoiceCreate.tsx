import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { invoicesApi, type Customer } from '@/lib/api/invoices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ArrowLeft, CalendarIcon, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isServiceProvider = user?.role === 'service_provider' || user?.roles?.some((r: any) => r.name === 'service_provider');
  const [loading, setLoading] = useState(false);
  const [fetchingCustomers, setFetchingCustomers] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customerId: '',
    amount: '',
    taxAmount: '',
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setFetchingCustomers(true);
        console.log('Fetching customers...');
        const response = await invoicesApi.getCustomers();
        console.log('Customers response:', response);
        if (response.data) {
          // Handle both array and object with data property
          const customersList = Array.isArray(response.data) ? response.data : (response.data.data || []);
          setCustomers(customersList);
          console.log('Customers loaded:', customersList.length);
        } else {
          console.warn('No customers data in response:', response);
          setCustomers([]);
        }
      } catch (error: any) {
        console.error('Failed to fetch customers:', error);
        const errorMessage = error?.message || error?.response?.data?.message || 'Failed to load customers';
        toast.error(errorMessage);
        setCustomers([]);
      } finally {
        setFetchingCustomers(false);
      }
    };

    // Load customers for both service providers and admins
    const isAdmin = user?.roles?.some((r: any) => r.name === 'admin');
    if (isServiceProvider || isAdmin) {
      fetchCustomers();
    } else {
      setFetchingCustomers(false);
    }
  }, [isServiceProvider, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Frontend validation
    if (!formData.customerId) {
      setErrors({ user_id: ['Please select a customer'] });
      toast.error('Please select a customer');
      return;
    }
    
    if (!formData.title.trim()) {
      setErrors({ title: ['Invoice title is required'] });
      toast.error('Please enter an invoice title');
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setErrors({ amount: ['Amount must be greater than 0'] });
      toast.error('Please enter a valid amount');
      return;
    }
    
    setLoading(true);

    try {
      const invoiceData: any = {
        user_id: parseInt(formData.customerId),
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        amount: parseFloat(formData.amount),
        tax_amount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
        due_date: format(formData.dueDate, 'yyyy-MM-dd'),
        issue_date: format(formData.issueDate, 'yyyy-MM-dd'),
        status: 'pending',
      };

      // Service providers don't need to send service_provider_id - backend will auto-set it
      if (!isServiceProvider) {
        // Admin must specify service provider (if needed in future)
        // For now, we'll let backend handle it
      }

      const response = await invoicesApi.create(invoiceData);

      console.log('Invoice creation response:', response);

      if (response.errors) {
        setErrors(response.errors);
        const errorMessage = response.errors.general?.[0] || 
                            response.errors.user_id?.[0] ||
                            response.errors.title?.[0] ||
                            response.errors.amount?.[0] ||
                            response.errors.due_date?.[0] ||
                            response.message || 
                            'Failed to create invoice';
        toast.error(errorMessage);
      } else if (response.data) {
        toast.success('Invoice created successfully!');
        navigate(`/invoices/${response.data.id}`);
      } else {
        // Handle case where response might be the invoice directly or empty
        console.warn('Unexpected response format:', response);
        if (response.message) {
          toast.error(response.message);
        } else {
          toast.error('Invoice creation failed. Please check the console for details.');
        }
      }
    } catch (error: any) {
      console.error('Invoice creation error:', error);
      const errorMessage = error?.message || 
                          error?.response?.data?.message ||
                          'An error occurred while creating the invoice';
      toast.error(errorMessage);
      
      // Set validation errors if available
      if (error?.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const amount = parseFloat(formData.amount) || 0;
  const taxAmount = parseFloat(formData.taxAmount) || 0;
  const totalAmount = amount + taxAmount;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Invoice</h1>
          <p className="text-muted-foreground">Create a new invoice for your customer</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="font-semibold">Invoice Details</h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Invoice Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Web Development Services"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the services or products..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select 
                value={formData.customerId} 
                onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                disabled={fetchingCustomers}
              >
                <SelectTrigger>
                  <SelectValue placeholder={fetchingCustomers ? "Loading customers..." : "Select a customer"} />
                </SelectTrigger>
                <SelectContent>
                  {fetchingCustomers ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading customers...</div>
                  ) : customers.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No customers available</div>
                  ) : (
                    customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name} ({customer.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.user_id && (
                <p className="text-sm text-error">{errors.user_id[0]}</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="font-semibold">Amount & Dates</h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="pl-10"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxAmount">Tax Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="taxAmount"
                  type="number"
                  placeholder="0.00"
                  value={formData.taxAmount}
                  onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                  className="pl-10"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.issueDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.issueDate}
                    onSelect={(date) => date && setFormData({ ...formData, issueDate: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.dueDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => date && setFormData({ ...formData, dueDate: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Total Summary */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${amount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-muted-foreground">Tax</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="border-t border-border mt-4 pt-4 flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-2xl font-bold">${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || fetchingCustomers || !formData.customerId}>
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              'Create Invoice'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
