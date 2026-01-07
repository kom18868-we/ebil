import { useState, useEffect } from 'react';
import { permissionsApi, type Permission } from '@/lib/api/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Plus, Search, Key, Edit, Trash2, Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function PermissionManagement() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState({
    name: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const response = await permissionsApi.getAll();
      if (response.data) {
        setPermissions(response.data.permissions || []);
        if (response.data.grouped) {
          setGroupedPermissions(response.data.grouped);
        }
      }
    } catch (error: any) {
      console.error('Failed to load permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({ name: '' });
    setFormErrors({});
    setSelectedPermission(null);
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (permission: Permission) => {
    setFormData({ name: permission.name });
    setFormErrors({});
    setSelectedPermission(permission);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (permission: Permission) => {
    setSelectedPermission(permission);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitting(true);

    try {
      if (selectedPermission) {
        // Update
        const response = await permissionsApi.update(selectedPermission.id, formData);
        if (response.errors) {
          setFormErrors(response.errors);
          toast.error('Failed to update permission');
        } else {
          toast.success('Permission updated successfully');
          setIsEditDialogOpen(false);
          loadPermissions();
        }
      } else {
        // Create
        const response = await permissionsApi.create(formData);
        if (response.errors) {
          setFormErrors(response.errors);
          toast.error('Failed to create permission');
        } else {
          toast.success('Permission created successfully');
          setIsCreateDialogOpen(false);
          loadPermissions();
        }
      }
    } catch (error: any) {
      console.error('Permission operation error:', error);
      toast.error(error?.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPermission) return;

    try {
      const response = await permissionsApi.delete(selectedPermission.id);
      if (response.errors) {
        toast.error('Failed to delete permission');
      } else {
        toast.success('Permission deleted successfully');
        setIsDeleteDialogOpen(false);
        loadPermissions();
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error?.message || 'Failed to delete permission');
    }
  };

  const filteredPermissions = permissions.filter(perm =>
    perm.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group filtered permissions
  const filteredGrouped = filteredPermissions.reduce((acc, perm) => {
    const category = perm.name.split(' ')[0] || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Permission Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage system permissions and access controls
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Permission
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Permissions List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : Object.keys(filteredGrouped).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(filteredGrouped).map(([category, perms]) => (
            <div key={category} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-semibold capitalize">{category}</h3>
                <span className="text-sm text-muted-foreground">({perms.length})</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {perms.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Key className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{perm.name}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(perm)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(perm)}
                        className="text-error hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Key}
          title="No permissions found"
          description={search ? "Try adjusting your search" : "Create your first permission to get started"}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPermission ? 'Edit Permission' : 'Create Permission'}
            </DialogTitle>
            <DialogDescription>
              {selectedPermission ? 'Update permission name' : 'Create a new permission'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Permission Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="e.g., view reports, manage settings"
                required
              />
              {formErrors.name && (
                <p className="text-sm text-error">{formErrors.name[0]}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Use lowercase with spaces (e.g., "view invoices", "create users")
              </p>
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
                  <LoadingSpinner size="sm" />
                ) : (
                  selectedPermission ? 'Update Permission' : 'Create Permission'
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
            <AlertDialogTitle>Delete Permission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the permission "{selectedPermission?.name}"? 
              This action cannot be undone. Roles using this permission will lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-error text-error-foreground hover:bg-error/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

