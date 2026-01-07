import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});
    setSuccess(false);
    setLoading(true);
    
    try {
      const response = await authApi.forgotPassword(email);

      if (response.errors) {
        setErrors(response.errors);
        const errorMessage = response.errors.email?.[0] || response.errors.general?.[0] || response.message || 'Failed to send reset link. Please try again.';
        setError(errorMessage);
      } else if (response.data || response.message) {
        setSuccess(true);
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      const errorMessage = err?.message || 'An error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center backdrop-blur">
              <span className="text-primary-foreground font-bold text-lg">eB</span>
            </div>
            <span className="text-primary-foreground font-bold text-2xl">eBill</span>
          </div>
        </div>
        
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-primary-foreground leading-tight">
            Reset Your<br />Password
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        
        <p className="text-primary-foreground/60 text-sm">
          © 2024 eBill Platform. All rights reserved.
        </p>
      </div>

      {/* Right side - Forgot Password Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">eB</span>
              </div>
              <span className="font-bold text-2xl">eBill</span>
            </div>
            <h2 className="text-2xl font-bold">Forgot password?</h2>
            <p className="text-muted-foreground mt-2">
              No problem. Just let us know your email address and we will email you a password reset link.
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-success-light text-success border border-success/20">
                <p className="font-medium">Reset link sent!</p>
                <p className="text-sm mt-1">
                  We've sent a password reset link to <strong>{email}</strong>. Please check your email and click the link to reset your password.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-error-light text-error text-sm">
                  {error}
                </div>
              )}
              
              {errors.email && errors.email.length > 0 && (
                <div className="p-3 rounded-lg bg-error-light text-error text-sm">
                  {errors.email[0]}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : 'Email Password Reset Link'}
              </Button>
            </form>
          )}

          <div className="text-center">
            <Link 
              to="/login" 
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

