import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, Building2, Wallet, Shield, Lock } from 'lucide-react';
import { paymentMethodsApi } from '@/lib/api/payment-methods';

export default function PaymentMethodCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'credit_card',
    name: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    holderName: '',
    isDefault: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Extract last 4 digits from card number
      const lastFour = formData.cardNumber.replace(/\s/g, '').slice(-4);
      
      // Determine brand from card number (simplified)
      let brand = 'Visa';
      const firstDigit = formData.cardNumber.replace(/\s/g, '')[0];
      if (firstDigit === '5') brand = 'MasterCard';
      if (firstDigit === '3') brand = 'American Express';
      if (firstDigit === '4') brand = 'Visa';
      
      // Format expiry date
      const expiresAt = formData.expiryMonth && formData.expiryYear
        ? `${formData.expiryYear}-${formData.expiryMonth.padStart(2, '0')}-01`
        : null;
      
      const paymentMethodData = {
        type: formData.type,
        name: formData.name || `${brand} •••• ${lastFour}`,
        last_four: lastFour,
        brand: formData.type === 'credit_card' || formData.type === 'debit_card' ? brand : null,
        expires_at: expiresAt,
        is_default: formData.isDefault,
      };

      const response = await paymentMethodsApi.create(paymentMethodData);
      
      if (response.data) {
        toast.success('Payment method added successfully!');
        navigate('/payment-methods');
      } else {
        toast.error(response.message || 'Failed to add payment method');
      }
    } catch (error: any) {
      console.error('Error creating payment method:', error);
      toast.error(error?.message || 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setFormData({ ...formData, cardNumber: formatted });
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add Payment Method</h1>
          <p className="text-muted-foreground">Add a new payment method to your account</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Method Type */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="font-semibold">Payment Method Type</h2>
          
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="credit_card">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Credit Card
                </div>
              </SelectItem>
              <SelectItem value="debit_card">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Debit Card
                </div>
              </SelectItem>
              <SelectItem value="bank_account">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Bank Account
                </div>
              </SelectItem>
              <SelectItem value="digital_wallet">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Digital Wallet
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Card Details (for credit/debit cards) */}
        {(formData.type === 'credit_card' || formData.type === 'debit_card') && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Card Information</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number *</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cardNumber"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={handleCardNumberChange}
                    className="pl-10"
                    maxLength={19}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="holderName">Cardholder Name *</Label>
                <Input
                  id="holderName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.holderName}
                  onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="expiryMonth">Expiry Month *</Label>
                  <Select 
                    value={formData.expiryMonth} 
                    onValueChange={(value) => setFormData({ ...formData, expiryMonth: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = (i + 1).toString().padStart(2, '0');
                        return (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="expiryYear">Expiry Year *</Label>
                  <Select 
                    value={formData.expiryYear} 
                    onValueChange={(value) => setFormData({ ...formData, expiryYear: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="YYYY" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="cvv">CVV *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cvv"
                      type="text"
                      placeholder="123"
                      value={formData.cvv}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setFormData({ ...formData, cvv: value });
                      }}
                      className="pl-10"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bank Account Details */}
        {formData.type === 'bank_account' && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Bank Account Information</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name *</Label>
                <Input
                  id="accountName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  type="text"
                  placeholder="1234567890"
                  value={formData.cardNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, cardNumber: value });
                  }}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Digital Wallet Details */}
        {formData.type === 'digital_wallet' && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Digital Wallet Information</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="walletName">Wallet Name *</Label>
                <Input
                  id="walletName"
                  type="text"
                  placeholder="e.g., PayPal, Apple Pay"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="walletEmail">Email/Phone *</Label>
                <Input
                  id="walletEmail"
                  type="text"
                  placeholder="wallet@example.com or +1234567890"
                  value={formData.holderName}
                  onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Default Payment Method */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Settings</h2>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="isDefault" className="cursor-pointer">
              Set as default payment method
            </Label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Payment Method'}
          </Button>
        </div>
      </form>
    </div>
  );
}

