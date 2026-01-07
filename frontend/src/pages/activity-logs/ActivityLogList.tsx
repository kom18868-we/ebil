import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { activityLogsApi, ActivityLog, ActivityLogFilters } from '@/lib/api/activity-logs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';
import { 
  Activity, Search, Filter, Calendar, User, FileText, 
  CreditCard, TicketIcon, Settings, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const actionIcons: Record<string, any> = {
  invoice_created: FileText,
  invoice_updated: FileText,
  invoice_deleted: FileText,
  payment_created: CreditCard,
  ticket_created: TicketIcon,
  user_login: User,
  user_logout: User,
  profile_update: Settings,
};

const actionColors: Record<string, string> = {
  invoice_created: 'success',
  invoice_updated: 'warning',
  invoice_deleted: 'error',
  payment_created: 'success',
  ticket_created: 'info',
  user_login: 'success',
  user_logout: 'default',
  profile_update: 'warning',
};

export default function ActivityLogList() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ActivityLogFilters>({
    action: undefined,
    date_from: '',
    date_to: '',
    per_page: 15,
  });
  
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    loadLogs();
  }, [debouncedSearch, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await activityLogsApi.getAll({
        ...filters,
        search: debouncedSearch || undefined,
      });
      
      if (response.data) {
        setLogs(response.data.data || []);
        setPagination({
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          per_page: response.data.per_page,
          total: response.data.total,
        });
      }
    } catch (error: any) {
      console.error('Error loading activity logs:', error);
      toast.error(error?.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ActivityLogFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getActionIcon = (action: string) => {
    const Icon = actionIcons[action] || Activity;
    return <Icon className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    return actionColors[action] || 'default';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Activity Logs</h1>
          <p className="text-muted-foreground mt-1">
            View system activity and user actions
          </p>
        </div>
        <Button onClick={loadLogs} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Action</Label>
              <Select
                value={filters.action || 'all'}
                onValueChange={(value) => handleFilterChange('action', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="invoice_created">Invoice Created</SelectItem>
                  <SelectItem value="invoice_updated">Invoice Updated</SelectItem>
                  <SelectItem value="invoice_deleted">Invoice Deleted</SelectItem>
                  <SelectItem value="payment_created">Payment Created</SelectItem>
                  <SelectItem value="ticket_created">Ticket Created</SelectItem>
                  <SelectItem value="user_login">User Login</SelectItem>
                  <SelectItem value="user_logout">User Logout</SelectItem>
                  <SelectItem value="profile_update">Profile Update</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No activity logs found</h3>
            <p className="text-muted-foreground text-center">
              {search || filters.action ? 'Try adjusting your filters' : 'No activities have been logged yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {logs.map((log) => {
              const ActionIcon = getActionIcon(log.action);
              const actionColor = getActionColor(log.action);
              
              return (
                <Card key={log.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        actionColor === 'success' ? 'bg-success-light' :
                        actionColor === 'warning' ? 'bg-warning-light' :
                        actionColor === 'error' ? 'bg-error-light' :
                        actionColor === 'info' ? 'bg-info-light' :
                        'bg-muted'
                      }`}>
                        {ActionIcon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium">{log.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {log.user?.name || 'Unknown User'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                              </span>
                              {log.ip_address && (
                                <span className="text-xs">IP: {log.ip_address}</span>
                              )}
                            </div>
                          </div>
                          <StatusBadge 
                            status={log.action.replace('_', ' ')} 
                            size="sm"
                          />
                        </div>
                        
                        {log.properties && Object.keys(log.properties).length > 0 && (
                          <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                            <details>
                              <summary className="cursor-pointer font-medium">View Details</summary>
                              <pre className="mt-2 text-xs overflow-auto">
                                {JSON.stringify(log.properties, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                {pagination.total} activities
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

