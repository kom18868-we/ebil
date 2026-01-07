import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  ArrowLeft, CreditCard, Building2, CheckCircle, Lock, Shield 
} from 'lucide-react';
import { invoicesApi, type Invoice } from '@/lib/api/invoices';
import { paymentMethodsApi, type PaymentMethod } from '@/lib/api/payment-methods';
import { paymentsApi } from '@/lib/api/payments';

export default function PaymentCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoice');
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [step, setStep] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState(invoiceId || '');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState('');
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Load invoices and payment methods
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        
        // Load unpaid invoices
        const invoicesResponse = await invoicesApi.getAll({ 
          status: 'pending',
          per_page: 100 
        });
        
        if (invoicesResponse.data?.data) {
          const unpaidInvoices = invoicesResponse.data.data.filter(
            inv => inv.status !== 'paid'
          );
          setInvoices(unpaidInvoices);
          
          // If invoice ID is provided, load that specific invoice
          if (invoiceId) {
            const invoiceResponse = await invoicesApi.getById(Number(invoiceId));
            if (invoiceResponse.data) {
              setInvoice(invoiceResponse.data);
              setSelectedInvoice(invoiceId);
            }
          }
        }
        
        // Load payment methods
        const methodsResponse = await paymentMethodsApi.getAll();
        if (methodsResponse.data) {
          setPaymentMethods(methodsResponse.data.filter(m => m.is_active));
        }
      } catch (error: any) {
        console.error('Error loading data:', error);
        toast.error(error?.message || 'Failed to load data');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [invoiceId]);

  // Load invoice when selection changes
  useEffect(() => {
    const loadInvoice = async () => {
      if (!selectedInvoice) {
        setInvoice(null);
        return;
      }

      try {
        const response = await invoicesApi.getById(Number(selectedInvoice));
        if (response.data) {
          setInvoice(response.data);
          // Reset payment type and amount when invoice changes
          setPaymentType('full');
          setPartialAmount('');
        }
      } catch (error: any) {
        console.error('Error loading invoice:', error);
        toast.error(error?.message || 'Failed to load invoice');
      }
    };

    loadInvoice();
  }, [selectedInvoice]);

  const handleSubmit = async () => {
    if (!invoice || !selectedMethod) {
      toast.error('Please select an invoice and payment method');
      return;
    }

    setLoading(true);
    
    try {
      let amount: number;
      if (paymentType === 'full') {
        const totalPaid = invoice.payments?.reduce((sum, p) => sum + (p.status === 'completed' ? (p.amount || 0) : 0), 0) || 0;
        amount = invoice.total_amount - totalPaid;
      } else {
        amount = parseFloat(partialAmount);
        if (isNaN(amount)) {
          toast.error('Please enter a valid payment amount');
          setLoading(false);
          return;
        }
      }

      if (amount <= 0 || isNaN(amount)) {
        toast.error('Payment amount must be greater than 0');
        setLoading(false);
        return;
      }

      // Ensure all values are properly formatted
      const paymentData = {
        invoice_id: parseInt(String(invoice.id), 10),
        payment_method_id: parseInt(String(selectedMethod), 10),
        amount: parseFloat(Number(amount).toFixed(2)),
        payment_type: paymentType as 'full' | 'partial',
      };

      console.log('Submitting payment:', paymentData);
      console.log('Payment data types:', {
        invoice_id: typeof paymentData.invoice_id,
        payment_method_id: typeof paymentData.payment_method_id,
        amount: typeof paymentData.amount,
        payment_type: typeof paymentData.payment_type,
      });

      const response = await paymentsApi.create(paymentData);
      
      if (response.data) {
        toast.success('Payment processed successfully!');
        navigate(`/payments/${response.data.id}`);
      } else {
        toast.error(response.message || 'Failed to process payment');
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);
      console.error('Error message:', error?.message);
      
      // Extract validation errors
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        console.error('Validation errors:', errors);
        
        // Show all validation errors
        const errorMessages: string[] = [];
        Object.keys(errors).forEach((field) => {
          const fieldErrors = errors[field];
          if (Array.isArray(fieldErrors)) {
            errorMessages.push(...fieldErrors);
          } else {
            errorMessages.push(String(fieldErrors));
          }
        });
        
        if (errorMessages.length > 0) {
          toast.error(errorMessages[0] || 'Validation failed');
          // Log all errors
          errorMessages.forEach(msg => console.error('Validation error:', msg));
        } else {
          toast.error('Validation failed');
        }
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to process payment';
        console.error('Error message:', errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const remainingAmount = invoice 
    ? invoice.total_amount - (invoice.payments?.reduce((sum, p) => sum + (p.status === 'completed' ? (p.amount || 0) : 0), 0) || 0)
    : 0;
  
  const displayAmount = paymentType === 'full' ? remainingAmount : parseFloat(partialAmount || '0');

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading payment data...</p>
        </div>
      </div>
    );
  }

  const selectedPaymentMethod = paymentMethods.find(m => m.id.toString() === selectedMethod);

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Make Payment</h1>
          <p className="text-muted-foreground">Complete your payment securely</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= s 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {step > s ? <CheckCircle className="h-4 w-4" /> : s}
            </div>
            <span className={`text-sm hidden sm:inline ${step >= s ? 'text-foreground' : 'text-muted-foreground'}`}>
              {s === 1 ? 'Select Invoice' : s === 2 ? 'Payment Method' : 'Confirm'}
            </span>
            {s < 3 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-xl border border-border bg-card p-6">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-semibold">Select Invoice to Pay</h2>
            <Select value={selectedInvoice} onValueChange={setSelectedInvoice}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an invoice" />
              </SelectTrigger>
              <SelectContent>
                {invoices.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id.toString()}>
                    {inv.invoice_number} - ${inv.total_amount.toLocaleString()} ({inv.title})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {invoice && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice</span>
                  <span className="font-medium">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium">${invoice.total_amount.toLocaleString()}</span>
                </div>
                {remainingAmount < invoice.total_amount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Already Paid</span>
                    <span className="font-medium">
                      ${(invoice.total_amount - remainingAmount).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Due</span>
                  <span className="font-bold text-lg">${remainingAmount.toLocaleString()}</span>
                </div>

                {remainingAmount > 0 && (
                  <>
                    <div className="pt-3 border-t border-border">
                      <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v as 'full' | 'partial')}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="full" id="full" />
                          <Label htmlFor="full">Pay full remaining amount</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="partial" id="partial" />
                          <Label htmlFor="partial">Pay partial amount</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {paymentType === 'partial' && (
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={partialAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = parseFloat(value);
                          if (value === '' || (numValue > 0 && numValue <= remainingAmount)) {
                            setPartialAmount(value);
                          }
                        }}
                        min="0.01"
                        max={remainingAmount}
                        step="0.01"
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {paymentMethods.length === 0 && (
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  You need to add a payment method before making a payment.{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-yellow-800 dark:text-yellow-200 underline"
                    onClick={() => navigate('/payment-methods/create')}
                  >
                    Add one now
                  </Button>
                </p>
              </div>
            )}

            <Button 
              className="w-full" 
              disabled={!selectedInvoice || remainingAmount <= 0 || paymentMethods.length === 0}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-semibold">Select Payment Method</h2>
            
            {paymentMethods.length === 0 ? (
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-4">
                  You need to add a payment method before making a payment.
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/payment-methods/create')}
                >
                  Add Payment Method
                </Button>
              </div>
            ) : (
              <>
                <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedMethod === method.id.toString() 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value={method.id.toString()} />
                        <div className="flex items-center gap-3 flex-1">
                          {(method.type === 'credit_card' || method.type === 'debit_card') ? (
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium">
                              {method.brand || method.name} {method.last_four ? `•••• ${method.last_four}` : ''}
                            </p>
                            <p className="text-sm text-muted-foreground">{method.name}</p>
                          </div>
                        </div>
                        {method.is_default && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </RadioGroup>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button 
                    className="flex-1" 
                    disabled={!selectedMethod}
                    onClick={() => setStep(3)}
                  >
                    Continue
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && invoice && selectedPaymentMethod && (
          <div className="space-y-6">
            <h2 className="font-semibold">Confirm Payment</h2>
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice</span>
                  <span className="font-medium">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium">
                    {selectedPaymentMethod.brand || selectedPaymentMethod.name}
                    {selectedPaymentMethod.last_four ? ` •••• ${selectedPaymentMethod.last_four}` : ''}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="font-semibold">Total Amount</span>
                  <span className="text-2xl font-bold">
                    ${displayAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Your payment is secured with SSL encryption</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSubmit}
                disabled={loading || displayAmount <= 0}
              >
                {loading ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Pay ${displayAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
