import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/utils/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      console.log('Attempting login...', { email });
      const result = await login(email, password);
      console.log('Login result:', result);
      if (result.success) {
        // Wait a bit for user to be set in context, then check role
        setTimeout(() => {
          // Get user from localStorage to check role immediately
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              if (isAdmin(parsedUser)) {
                navigate('/admin/dashboard');
              } else {
                navigate('/dashboard');
              }
            } catch {
              navigate('/dashboard');
            }
          } else {
            navigate('/dashboard');
          }
        }, 100);
      } else {
        setError(result.error || 'Invalid email or password. Please try again.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
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
            Streamline Your<br />Billing & Payments
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Manage invoices, track payments, and handle support tickets all in one powerful platform.
          </p>
        </div>
        
        <p className="text-primary-foreground/60 text-sm">
          © 2024 eBill Platform. All rights reserved.
        </p>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">eB</span>
              </div>
              <span className="font-bold text-2xl">eBill</span>
            </div>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground mt-2">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-error-light text-error text-sm">
                {error}
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
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Create account
            </Link>
          </p>

          {/* Demo accounts */}
          <div className="pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">Test accounts (password: password)</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button 
                type="button"
                onClick={() => {
                  setEmail('ahmed@example.com');
                  setPassword('password');
                }} 
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                <p className="font-medium">Customer</p>
                <p className="text-muted-foreground">ahmed@example.com</p>
              </button>
              <button 
                type="button"
                onClick={() => {
                  setEmail('admin@ebill.com');
                  setPassword('password');
                }} 
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                <p className="font-medium">Admin</p>
                <p className="text-muted-foreground">admin@ebill.com</p>
              </button>
              <button 
                type="button"
                onClick={() => {
                  setEmail('provider@example.com');
                  setPassword('password');
                }} 
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                <p className="font-medium">Provider</p>
                <p className="text-muted-foreground">provider@example.com</p>
              </button>
              <button 
                type="button"
                onClick={() => {
                  setEmail('support@ebill.com');
                  setPassword('password');
                }} 
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                <p className="font-medium">Support</p>
                <p className="text-muted-foreground">support@ebill.com</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
