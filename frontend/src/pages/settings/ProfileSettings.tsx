import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi } from '@/lib/api/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { User, Mail, Phone, Save, MapPin, Globe, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProfileSettings() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    country: user?.country || '',
    postal_code: user?.postal_code || '',
  });

  // Fetch latest profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setFetching(true);
        const response = await profileApi.getProfile();
        if (response.data) {
          const profileUser = response.data;
          setFormData({
            name: profileUser.name || '',
            email: profileUser.email || '',
            phone: profileUser.phone || '',
            address: profileUser.address || '',
            city: profileUser.city || '',
            country: profileUser.country || '',
            postal_code: profileUser.postal_code || '',
          });
        }
      } catch (err: any) {
        console.error('Failed to fetch profile:', err);
        toast.error('Failed to load profile information');
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});
    setLoading(true);

    try {
      const response = await profileApi.updateProfile(formData);

      if (response.errors) {
        setErrors(response.errors);
        const errorMessage = response.errors.general?.[0] || response.message || 'Failed to update profile. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      } else if (response.data) {
        // Refresh user in context to get latest data
        await refreshUser();
        toast.success('Profile updated successfully!');
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      const errorMessage = err?.message || 'An error occurred. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account information</p>
        </div>
        <Link to="/settings/preferences">
          <Button variant="outline" className="gap-2">
            <Bell className="h-4 w-4" />
            Preferences
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-error-light text-error text-sm">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </span>
            </div>
            <Button variant="outline" type="button" disabled>Change Photo</Button>
          </div>

          <Separator />

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
              {errors.name && errors.name.length > 0 && (
                <p className="text-sm text-error">{errors.name[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
              {errors.email && errors.email.length > 0 && (
                <p className="text-sm text-error">{errors.email[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10"
                />
              </div>
              {errors.phone && errors.phone.length > 0 && (
                <p className="text-sm text-error">{errors.phone[0]}</p>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4">Address Information</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="pl-10"
                    placeholder="Street address"
                  />
                </div>
                {errors.address && errors.address.length > 0 && (
                  <p className="text-sm text-error">{errors.address[0]}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                  />
                  {errors.city && errors.city.length > 0 && (
                    <p className="text-sm text-error">{errors.city[0]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Country"
                  />
                  {errors.country && errors.country.length > 0 && (
                    <p className="text-sm text-error">{errors.country[0]}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="pl-10"
                    placeholder="Postal/ZIP code"
                  />
                </div>
                {errors.postal_code && errors.postal_code.length > 0 && (
                  <p className="text-sm text-error">{errors.postal_code[0]}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
