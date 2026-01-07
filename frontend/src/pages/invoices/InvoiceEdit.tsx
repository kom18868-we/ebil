import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ArrowLeft, CalendarIcon, DollarSign } from 'lucide-react';
import { invoicesApi } from '@/lib/api/invoices';

export default function InvoiceEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    taxAmount: '',
    dueDate: new Date(),
  });

  useEffect(() => {
    const loadInvoice = async () => {
      if (!id) {
        toast.error('Invoice ID not found');
        navigate('/invoices');
        return;
      }

      try {
        setLoadingInvoice(true);
        const response = await invoicesApi.getById(Number(id));
        
        if (response.data) {
          const invoice = response.data;
          setFormData({
            title: invoice.title || '',
            description: invoice.description || '',
            amount: invoice.amount?.toString() || '0',
            taxAmount: invoice.tax_amount?.toString() || '0',
            dueDate: invoice.due_date ? new Date(invoice.due_date) : new Date(),
          });
        } else {
          toast.error('Invoice not found');
          navigate('/invoices');
        }
      } catch (error: any) {
        console.error('Error loading invoice:', error);
        toast.error(error?.message || 'Failed to load invoice');
        navigate('/invoices');
      } finally {
        setLoadingInvoice(false);
      }
    };

    loadInvoice();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) {
      toast.error('Invoice ID not found');
      return;
    }

    setLoading(true);
    
    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        tax_amount: parseFloat(formData.taxAmount) || 0,
        due_date: format(formData.dueDate, 'yyyy-MM-dd'),
      };

      const response = await invoicesApi.update(Number(id), updateData);
      
      if (response.data) {
        toast.success('Invoice updated successfully!');
        navigate(`/invoices/${id}`);
      } else {
        toast.error(response.message || 'Failed to update invoice');
      }
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      toast.error(error?.message || 'Failed to update invoice');
    } finally {
      setLoading(false);
    }
  };

  const amount = parseFloat(formData.amount) || 0;
  const taxAmount = parseFloat(formData.taxAmount) || 0;
  const totalAmount = amount + taxAmount;

  if (loadingInvoice) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
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
          <h1 className="text-2xl font-bold">Edit Invoice</h1>
          <p className="text-muted-foreground">Update invoice details</p>
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
              <Label>Due Date *</Label>
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
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
}

