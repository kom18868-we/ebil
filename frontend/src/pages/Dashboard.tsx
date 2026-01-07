import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin, hasRole } from '@/lib/utils/user';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { dashboardApi, DashboardData } from '@/lib/api/dashboard';
import { 
  FileText, CreditCard, AlertTriangle, CheckCircle, 
  DollarSign, Clock, Plus, ArrowRight, TrendingUp, Users, TicketIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userIsAdmin = isAdmin(user);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect admins to admin dashboard
  useEffect(() => {
    if (userIsAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [userIsAdmin, navigate]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardApi.getData();
      if (response.data) {
        setDashboardData(response.data);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast.error(error?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold mb-2">No dashboard data available</h2>
        <p className="text-muted-foreground mb-4">Unable to load your dashboard information.</p>
        <Button onClick={loadDashboardData}>Retry</Button>
      </div>
    );
  }

  const stats = dashboardData.stats;
  const upcomingInvoices = dashboardData.upcoming_due_dates || [];
  const recentPayments = dashboardData.recent_payments || [];
  
  // Format monthly revenue data for chart
  const monthlyRevenueData = dashboardData.monthly_revenue?.map(item => ({
    month: format(new Date(2024, item.month - 1, 1), 'MMM'),
    revenue: item.total
  })) || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your account today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/invoices">View All Invoices</Link>
          </Button>
          {(userIsAdmin || hasRole(user, 'service_provider') || hasRole(user, 'provider')) && (
            <Button asChild>
              <Link to="/invoices/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Invoices"
          value={stats.total_invoices}
          icon={FileText}
          variant="default"
        />
        <StatCard
          title="Pending"
          value={stats.pending_invoices}
          subtitle={stats.pending_amount ? `$${stats.pending_amount.toLocaleString()} pending` : undefined}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Overdue"
          value={stats.overdue_invoices || 0}
          icon={AlertTriangle}
          variant="error"
        />
        <StatCard
          title="Paid"
          value={stats.paid_invoices}
          subtitle={stats.total_paid ? `$${stats.total_paid.toLocaleString()} collected` : undefined}
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Admin-specific stats */}
      {userIsAdmin && stats.total_revenue !== undefined && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Revenue"
            value={`$${(stats.total_revenue || 0).toLocaleString()}`}
            icon={DollarSign}
            variant="primary"
          />
          {stats.total_users !== undefined && (
            <StatCard
              title="Total Users"
              value={stats.total_users}
              icon={Users}
            />
          )}
          {stats.open_tickets !== undefined && (
            <StatCard
              title="Open Tickets"
              value={stats.open_tickets}
              subtitle={stats.resolved_tickets ? `${stats.resolved_tickets} resolved` : undefined}
              icon={TicketIcon}
            />
          )}
        </div>
      )}

      {/* Charts & Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        {userIsAdmin && monthlyRevenueData.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold">Revenue Overview</h3>
                <p className="text-sm text-muted-foreground">Monthly revenue trend</p>
              </div>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Upcoming Invoices */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Upcoming Due Dates</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/invoices">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {upcomingInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No upcoming invoices</p>
              </div>
            ) : (
              upcomingInvoices.map((invoice) => (
                <Link 
                  key={invoice.id} 
                  to={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary-light flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{invoice.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{invoice.title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${invoice.total_amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {format(new Date(invoice.due_date), 'MMM d')}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Payments</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/payments">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {recentPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No recent payments</p>
              </div>
            ) : (
              recentPayments.map((payment) => (
                <Link
                  key={payment.id}
                  to={`/payments/${payment.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-success-light flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{payment.reference}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.invoice?.invoice_number || payment.invoice?.title || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-success">+${payment.amount.toLocaleString()}</p>
                    <StatusBadge status={payment.status} size="sm" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* User Management Section (Admin Only) */}
      {userIsAdmin && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">User Management</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Manage system users and permissions
              </p>
            </div>
            <Button asChild>
              <Link to="/admin/users">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold mt-1">{stats.total_users || 0}</p>
                </div>
                <Users className="h-8 w-8 text-primary opacity-50" />
              </div>
            </div>
            {stats.active_users !== undefined && (
              <div className="p-4 rounded-lg bg-success-light/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold mt-1 text-success">
                      {stats.active_users}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-success opacity-50" />
                </div>
              </div>
            )}
          </div>
          <div className="mt-4">
            <Button variant="outline" className="w-full" asChild>
              <Link to="/admin/users">
                <ArrowRight className="h-4 w-4 mr-2" />
                Go to User Management
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
