import { useState, useEffect } from 'react';
import { serviceProvidersApi, type ServiceProvider, type CreateServiceProviderData } from '@/lib/api/service-providers';
import { usersApi } from '@/lib/api/users';
import { StatusBadge } from '@/components/StatusBadge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  Plus, Search, Building2, Edit, Trash2, Filter, CheckCircle, XCircle, Mail, Phone, MapPin, Globe
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { User } from '@/lib/api';

export default function ServiceProviderManagement() {
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [formData, setFormData] = useState<CreateServiceProviderData & { user_id: number | null }>({
    user_id: null,
    company_name: '',
    business_registration: '',
    tax_number: '',
    description: '',
    website: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
    status: 'active',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 20,
  });

  useEffect(() => {
    loadServiceProviders();
    loadUsers();
  }, [search, statusFilter]);

  const loadServiceProviders = async () => {
    try {
      setLoading(true);
      const response = await serviceProvidersApi.getAll({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter as 'active' | 'inactive' | 'suspended' : undefined,
        per_page: pagination.per_page,
        page: pagination.current_page,
      });

      if (response.data) {
        if ('data' in response.data) {
          setServiceProviders(response.data.data);
          setPagination({
            current_page: response.data.current_page || 1,
            last_page: response.data.last_page || 1,
            total: response.data.total || 0,
            per_page: response.data.per_page || 20,
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to load service providers:', error);
      toast.error('Failed to load service providers');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const excludeProviderId = selectedProvider?.id;
      const response = await serviceProvidersApi.getAvailableUsers(excludeProviderId);
      if (response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load available users');
    }
  };

  const handleCreate = async () => {
    setFormData({
      user_id: null,
      company_name: '',
      business_registration: '',
      tax_number: '',
      description: '',
      website: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      postal_code: '',
      status: 'active',
    });
    setFormErrors({});
    setSelectedProvider(null);
    setIsCreateDialogOpen(true);
    // Reload users when opening create dialog
    await loadUsers();
  };

  const handleEdit = async (provider: ServiceProvider) => {
    setFormData({
      user_id: provider.user_id,
      company_name: provider.company_name,
      business_registration: provider.business_registration || '',
      tax_number: provider.tax_number || '',
      description: provider.description || '',
      website: provider.website || '',
      phone: provider.phone || '',
      address: provider.address || '',
      city: provider.city || '',
      country: provider.country || '',
      postal_code: provider.postal_code || '',
      status: provider.status,
    });
    setFormErrors({});
    setSelectedProvider(provider);
    setIsEditDialogOpen(true);
    // Reload users to include the current user
    await loadUsers();
  };

  const handleDelete = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validate user_id is selected
    if (!formData.user_id || formData.user_id === 0) {
      setFormErrors({ user_id: ['Please select a user account'] });
      toast.error('Please select a user account');
      return;
    }

    setSubmitting(true);

    try {
      if (selectedProvider) {
        const response = await serviceProvidersApi.update(selectedProvider.id, formData);
        if (response.errors) {
          setFormErrors(response.errors);
          toast.error(response.message || 'Failed to update service provider');
        } else {
          toast.success('Service provider updated successfully!');
          setIsEditDialogOpen(false);
          loadServiceProviders();
        }
      } else {
        const response = await serviceProvidersApi.create(formData as CreateServiceProviderData);
        if (response.errors) {
          setFormErrors(response.errors);
          toast.error(response.message || 'Failed to create service provider');
        } else {
          toast.success('Service provider created successfully!');
          setIsCreateDialogOpen(false);
          loadServiceProviders();
        }
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error?.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedProvider) return;

    try {
      const response = await serviceProvidersApi.delete(selectedProvider.id);
      if (response.errors) {
        toast.error(response.message || 'Failed to delete service provider');
      } else {
        toast.success('Service provider deleted successfully!');
        setIsDeleteDialogOpen(false);
        loadServiceProviders();
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error?.message || 'An error occurred');
    }
  };

  const handleToggleStatus = async (provider: ServiceProvider) => {
    try {
      const response = await serviceProvidersApi.toggleStatus(provider.id);
      if (response.errors) {
        toast.error(response.message || 'Failed to update status');
      } else {
        toast.success('Status updated successfully!');
        loadServiceProviders();
      }
    } catch (error: any) {
      console.error('Toggle status error:', error);
      toast.error(error?.message || 'An error occurred');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service Provider Management</h1>
          <p className="text-muted-foreground mt-1">Manage service providers and their accounts</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service Provider
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company name, registration, tax number, or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : serviceProviders.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No service providers found"
          description="Get started by creating a new service provider"
          action={
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service Provider
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {serviceProviders.map((provider) => (
                  <tr key={provider.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{provider.company_name}</div>
                      {provider.business_registration && (
                        <div className="text-sm text-muted-foreground">Reg: {provider.business_registration}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {provider.user ? (
                        <div>
                          <div className="font-medium">{provider.user.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {provider.user.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {provider.phone && (
                          <div className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {provider.phone}
                          </div>
                        )}
                        {provider.city && (
                          <div className="text-sm flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {provider.city}, {provider.country}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={provider.status} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(provider)}
                          className="h-6 px-2"
                        >
                          {provider.status === 'active' ? (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {format(new Date(provider.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(provider)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(provider)}
                          className="text-error hover:text-error"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                {pagination.total} service providers
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPagination({ ...pagination, current_page: pagination.current_page - 1 });
                    loadServiceProviders();
                  }}
                  disabled={pagination.current_page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPagination({ ...pagination, current_page: pagination.current_page + 1 });
                    loadServiceProviders();
                  }}
                  disabled={pagination.current_page === pagination.last_page}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setFormErrors({});
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProvider ? 'Edit Service Provider' : 'Create New Service Provider'}</DialogTitle>
            <DialogDescription>
              {selectedProvider ? 'Update service provider information' : 'Add a new service provider to the system'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user_id">User Account *</Label>
                <Select
                  value={formData.user_id ? formData.user_id.toString() : undefined}
                  onValueChange={(value) => {
                    setFormData({ ...formData, user_id: parseInt(value) });
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.length === 0 ? (
                      <SelectItem value="no-users" disabled>No available users</SelectItem>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formErrors.user_id && (
                  <p className="text-sm text-error">{formErrors.user_id[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                />
                {formErrors.company_name && (
                  <p className="text-sm text-error">{formErrors.company_name[0]}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_registration">Business Registration</Label>
                <Input
                  id="business_registration"
                  value={formData.business_registration}
                  onChange={(e) => setFormData({ ...formData, business_registration: e.target.value })}
                />
                {formErrors.business_registration && (
                  <p className="text-sm text-error">{formErrors.business_registration[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_number">Tax Number</Label>
                <Input
                  id="tax_number"
                  value={formData.tax_number}
                  onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                />
                {formErrors.tax_number && (
                  <p className="text-sm text-error">{formErrors.tax_number[0]}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
              {formErrors.description && (
                <p className="text-sm text-error">{formErrors.description[0]}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
                {formErrors.website && (
                  <p className="text-sm text-error">{formErrors.website[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                {formErrors.phone && (
                  <p className="text-sm text-error">{formErrors.phone[0]}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              {formErrors.address && (
                <p className="text-sm text-error">{formErrors.address[0]}</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                {formErrors.city && (
                  <p className="text-sm text-error">{formErrors.city[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
                {formErrors.country && (
                  <p className="text-sm text-error">{formErrors.country[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                />
                {formErrors.postal_code && (
                  <p className="text-sm text-error">{formErrors.postal_code[0]}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' | 'suspended' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.status && (
                <p className="text-sm text-error">{formErrors.status[0]}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {selectedProvider ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  selectedProvider ? 'Update' : 'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Provider</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedProvider?.company_name}? This action cannot be undone.
              The associated user account will remain, but the service provider role will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-error hover:bg-error/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

