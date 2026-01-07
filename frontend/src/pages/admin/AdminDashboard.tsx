import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/lib/api/admin';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { 
  FileText, CreditCard, AlertTriangle, CheckCircle, 
  DollarSign, Users, TicketIcon, TrendingUp, TrendingDown,
  Building2, ArrowRight, Calendar, Settings, Shield, BarChart3,
  Plus, Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDashboard();
      if (response.data) {
        setDashboardData(response.data);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error: any) {
      console.error('Failed to load admin dashboard:', error);
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
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
        <Button onClick={loadDashboard} className="mt-4">Retry</Button>
      </div>
    );
  }

  const { stats, recent_invoices, recent_payments, recent_tickets, monthly_revenue, revenue_by_provider, revenue_growth } = dashboardData;

  // Format monthly revenue for chart
  const chartData = monthly_revenue?.map((item: any) => ({
    month: monthNames[item.month - 1] || `Month ${item.month}`,
    revenue: item.total || 0,
  })) || [];

  // Format revenue by provider
  const providerData = revenue_by_provider?.slice(0, 5).map((item: any) => ({
    name: item.provider?.company_name || item.provider?.user?.name || 'Unknown',
    revenue: item.revenue || 0,
  })) || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your platform's performance and activity
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link to="/admin/reports">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Reports
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/users">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/service-providers">
              <Building2 className="h-4 w-4 mr-2" />
              Service Providers
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/tickets">
              <TicketIcon className="h-4 w-4 mr-2" />
              Support Tickets
            </Link>
          </Button>
          <Button asChild>
            <Link to="/invoices/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${stats.total_revenue.toLocaleString()}`}
          icon={DollarSign}
          variant="primary"
          trend={revenue_growth ? { value: Math.abs(revenue_growth), isPositive: revenue_growth >= 0 } : undefined}
        />
        <StatCard
          title="Total Users"
          value={stats.total_users}
          subtitle={`${stats.active_users} active`}
          icon={Users}
        />
        <StatCard
          title="Total Invoices"
          value={stats.total_invoices}
          subtitle={`${stats.pending_invoices} pending`}
          icon={FileText}
        />
        <StatCard
          title="Open Tickets"
          value={stats.open_tickets}
          subtitle={`${stats.resolved_tickets} resolved`}
          icon={TicketIcon}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Invoices"
          value={stats.pending_invoices}
          icon={Calendar}
          variant="warning"
        />
        <StatCard
          title="Overdue Invoices"
          value={stats.overdue_invoices}
          icon={AlertTriangle}
          variant="error"
        />
        <StatCard
          title="Paid Invoices"
          value={stats.paid_invoices}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Service Providers"
          value={stats.total_service_providers}
          icon={Building2}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Revenue Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Monthly Revenue</h3>
              <p className="text-sm text-muted-foreground">Revenue trend for this year</p>
            </div>
            <div className={`flex items-center gap-2 ${revenue_growth >= 0 ? 'text-success' : 'text-error'}`}>
              {revenue_growth >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {revenue_growth >= 0 ? '+' : ''}{revenue_growth?.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
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

        {/* Top Service Providers */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6">
            <h3 className="font-semibold">Top Service Providers</h3>
            <p className="text-sm text-muted-foreground">Revenue by provider</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={providerData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Quick Actions</h3>
            <p className="text-sm text-muted-foreground">Common administrative tasks</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Button variant="outline" className="flex flex-col h-auto py-4" asChild>
            <Link to="/admin/users">
              <Users className="h-5 w-5 mb-2" />
              <span className="text-xs">Users</span>
            </Link>
          </Button>
          <Button variant="outline" className="flex flex-col h-auto py-4" asChild>
            <Link to="/admin/service-providers">
              <Building2 className="h-5 w-5 mb-2" />
              <span className="text-xs">Providers</span>
            </Link>
          </Button>
          <Button variant="outline" className="flex flex-col h-auto py-4" asChild>
            <Link to="/admin/reports">
              <BarChart3 className="h-5 w-5 mb-2" />
              <span className="text-xs">Reports</span>
            </Link>
          </Button>
          <Button variant="outline" className="flex flex-col h-auto py-4" asChild>
            <Link to="/tickets">
              <TicketIcon className="h-5 w-5 mb-2" />
              <span className="text-xs">Tickets</span>
            </Link>
          </Button>
          <Button variant="outline" className="flex flex-col h-auto py-4" asChild>
            <Link to="/invoices/create">
              <Plus className="h-5 w-5 mb-2" />
              <span className="text-xs">New Invoice</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Invoices */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Invoices</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/invoices">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {recent_invoices?.length > 0 ? (
              recent_invoices.slice(0, 5).map((invoice: any) => (
                <Link
                  key={invoice.id}
                  to={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{invoice.invoice_number}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {invoice.user?.name || 'Unknown'} • {invoice.service_provider?.company_name || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-semibold text-sm">${invoice.total_amount?.toLocaleString()}</p>
                    <StatusBadge status={invoice.status} size="sm" />
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent invoices</p>
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
            {recent_payments?.length > 0 ? (
              recent_payments.slice(0, 5).map((payment: any) => (
                <Link
                  key={payment.id}
                  to={`/payments/${payment.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{payment.reference || `Payment #${payment.id}`}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {payment.user?.name || 'Unknown'} • {payment.invoice?.invoice_number || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-semibold text-success text-sm">+${payment.amount?.toLocaleString()}</p>
                    <StatusBadge status={payment.status} size="sm" />
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent payments</p>
            )}
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Tickets</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tickets">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {recent_tickets?.length > 0 ? (
              recent_tickets.slice(0, 5).map((ticket: any) => (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{ticket.subject || `Ticket #${ticket.id}`}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {ticket.user?.name || 'Unknown'} • {ticket.category || 'General'}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <StatusBadge status={ticket.status} size="sm" />
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent tickets</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

