import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { 
  FileText, CreditCard, Users, Download, Calendar, Filter,
  TrendingUp, DollarSign, BarChart3, AlertTriangle, CheckCircle, Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('invoices');
  const [loading, setLoading] = useState(false);
  const [invoicesData, setInvoicesData] = useState<any>(null);
  const [paymentsData, setPaymentsData] = useState<any>(null);
  const [usersData, setUsersData] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [usageData, setUsageData] = useState<any>(null);
  
  // Filters
  const [invoiceFilters, setInvoiceFilters] = useState({
    status: 'all',
    date_from: '',
    date_to: '',
    service_provider_id: '',
  });
  const [paymentFilters, setPaymentFilters] = useState({
    status: 'all',
    date_from: '',
    date_to: '',
  });
  const [userFilters, setUserFilters] = useState({
    role: 'all',
    status: 'all',
    date_from: '',
    date_to: '',
  });
  const [financialFilters, setFinancialFilters] = useState({
    date_from: '',
    date_to: '',
  });
  const [usageFilters, setUsageFilters] = useState({
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    if (activeTab === 'invoices') {
      loadInvoiceReports();
    } else if (activeTab === 'payments') {
      loadPaymentReports();
    } else if (activeTab === 'users') {
      loadUserReports();
    } else if (activeTab === 'financial') {
      loadFinancialReports();
    } else if (activeTab === 'usage') {
      loadUsageReports();
    }
  }, [activeTab, invoiceFilters, paymentFilters, userFilters, financialFilters, usageFilters]);

  const loadInvoiceReports = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (invoiceFilters.status && invoiceFilters.status !== 'all') params.status = invoiceFilters.status;
      if (invoiceFilters.date_from) params.date_from = invoiceFilters.date_from;
      if (invoiceFilters.date_to) params.date_to = invoiceFilters.date_to;
      if (invoiceFilters.service_provider_id) params.service_provider_id = parseInt(invoiceFilters.service_provider_id);
      
      const response = await adminApi.getInvoiceReports(params);
      if (response.data) {
        setInvoicesData(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load invoice reports:', error);
      toast.error('Failed to load invoice reports');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentReports = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (paymentFilters.status && paymentFilters.status !== 'all') params.status = paymentFilters.status;
      if (paymentFilters.date_from) params.date_from = paymentFilters.date_from;
      if (paymentFilters.date_to) params.date_to = paymentFilters.date_to;
      
      const response = await adminApi.getPaymentReports(params);
      if (response.data) {
        setPaymentsData(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load payment reports:', error);
      toast.error('Failed to load payment reports');
    } finally {
      setLoading(false);
    }
  };

  const loadUserReports = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (userFilters.role && userFilters.role !== 'all') params.role = userFilters.role;
      if (userFilters.status && userFilters.status !== 'all') params.status = userFilters.status;
      if (userFilters.date_from) params.date_from = userFilters.date_from;
      if (userFilters.date_to) params.date_to = userFilters.date_to;
      
      const response = await adminApi.getUserReports(params);
      if (response.data) {
        setUsersData(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load user reports:', error);
      toast.error('Failed to load user reports');
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialReports = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (financialFilters.date_from) params.date_from = financialFilters.date_from;
      if (financialFilters.date_to) params.date_to = financialFilters.date_to;
      
      const response = await adminApi.getFinancialReports(params);
      if (response.data) {
        setFinancialData(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load financial reports:', error);
      toast.error('Failed to load financial reports');
    } finally {
      setLoading(false);
    }
  };

  const loadUsageReports = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (usageFilters.date_from) params.date_from = usageFilters.date_from;
      if (usageFilters.date_to) params.date_to = usageFilters.date_to;
      
      const response = await adminApi.getUsageReports(params);
      if (response.data) {
        setUsageData(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load usage reports:', error);
      toast.error('Failed to load usage reports');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'invoices' | 'payments' | 'users' | 'financial' | 'usage', format: 'excel' | 'pdf' = 'excel') => {
    try {
      const filters = type === 'invoices' ? invoiceFilters : type === 'payments' ? paymentFilters : userFilters;
      const blob = await adminApi.exportReport({
        type,
        format,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        service_provider_id: type === 'invoices' && invoiceFilters.service_provider_id ? parseInt(invoiceFilters.service_provider_id) : undefined,
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extension = format === 'pdf' ? 'pdf' : 'csv';
      link.download = `${type}_report_${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export report');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            View detailed reports and analytics for your platform
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="invoices">
            <FileText className="h-4 w-4 mr-2" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="financial">
            <DollarSign className="h-4 w-4 mr-2" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="usage">
            <BarChart3 className="h-4 w-4 mr-2" />
            Usage
          </TabsTrigger>
        </TabsList>

        {/* Invoice Reports */}
        <TabsContent value="invoices" className="space-y-6">
          {/* Filters */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4" />
              <h3 className="font-semibold">Filters</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={invoiceFilters.status} onValueChange={(value) => setInvoiceFilters({ ...invoiceFilters, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={invoiceFilters.date_from}
                  onChange={(e) => setInvoiceFilters({ ...invoiceFilters, date_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={invoiceFilters.date_to}
                  onChange={(e) => setInvoiceFilters({ ...invoiceFilters, date_to: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Actions</Label>
                <div className="flex gap-2">
                  <Button onClick={() => handleExport('invoices', 'excel')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button onClick={() => handleExport('invoices', 'pdf')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          {invoicesData?.stats && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard
                title="Total Invoices"
                value={invoicesData.stats.total_invoices}
                icon={FileText}
              />
              <StatCard
                title="Total Amount"
                value={`$${invoicesData.stats.total_amount?.toLocaleString() || '0'}`}
                icon={DollarSign}
                variant="primary"
              />
              <StatCard
                title="Paid Amount"
                value={`$${invoicesData.stats.paid_amount?.toLocaleString() || '0'}`}
                icon={CheckCircle}
                variant="success"
              />
              <StatCard
                title="Pending Amount"
                value={`$${invoicesData.stats.pending_amount?.toLocaleString() || '0'}`}
                icon={Calendar}
                variant="warning"
              />
              <StatCard
                title="Overdue Amount"
                value={`$${invoicesData.stats.overdue_amount?.toLocaleString() || '0'}`}
                icon={AlertTriangle}
                variant="error"
              />
            </div>
          )}

          {/* Invoice Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : invoicesData?.invoices?.data?.length > 0 ? (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Invoice</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoicesData.invoices.data.map((invoice: any) => (
                      <tr key={invoice.id} className="hover:bg-muted/30">
                        <td className="px-6 py-4">
                          <div className="font-medium">{invoice.invoice_number}</div>
                          <div className="text-sm text-muted-foreground">{invoice.title}</div>
                        </td>
                        <td className="px-6 py-4">{invoice.user?.name || 'N/A'}</td>
                        <td className="px-6 py-4">{invoice.service_provider?.company_name || 'N/A'}</td>
                        <td className="px-6 py-4 font-semibold">${invoice.total_amount?.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {invoice.due_date ? format(new Date(invoice.due_date), 'MMM dd, yyyy') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No invoices found"
              description="Try adjusting your filters"
            />
          )}
        </TabsContent>

        {/* Payment Reports */}
        <TabsContent value="payments" className="space-y-6">
          {/* Filters */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4" />
              <h3 className="font-semibold">Filters</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={paymentFilters.status} onValueChange={(value) => setPaymentFilters({ ...paymentFilters, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={paymentFilters.date_from}
                  onChange={(e) => setPaymentFilters({ ...paymentFilters, date_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={paymentFilters.date_to}
                  onChange={(e) => setPaymentFilters({ ...paymentFilters, date_to: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => handleExport('payments', 'excel')} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => handleExport('payments', 'pdf')} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Stats */}
          {paymentsData?.stats && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Payments"
                value={paymentsData.stats.total_payments}
                icon={CreditCard}
              />
              <StatCard
                title="Total Amount"
                value={`$${paymentsData.stats.total_amount?.toLocaleString() || '0'}`}
                icon={DollarSign}
                variant="primary"
              />
              <StatCard
                title="Pending Amount"
                value={`$${paymentsData.stats.pending_amount?.toLocaleString() || '0'}`}
                icon={Calendar}
                variant="warning"
              />
              <StatCard
                title="Failed Amount"
                value={`$${paymentsData.stats.failed_amount?.toLocaleString() || '0'}`}
                icon={AlertTriangle}
                variant="error"
              />
            </div>
          )}

          {/* Monthly Revenue Chart */}
          {paymentsData?.monthly_revenue && paymentsData.monthly_revenue.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Monthly Revenue</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={paymentsData.monthly_revenue.map((item: any) => ({
                    month: monthNames[item.month - 1] || `Month ${item.month}`,
                    revenue: item.total || 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `$${v/1000}k`} />
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Payment Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : paymentsData?.payments?.data?.length > 0 ? (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Reference</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Invoice</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paymentsData.payments.data.map((payment: any) => (
                      <tr key={payment.id} className="hover:bg-muted/30">
                        <td className="px-6 py-4 font-medium">{payment.reference || `Payment #${payment.id}`}</td>
                        <td className="px-6 py-4">{payment.user?.name || 'N/A'}</td>
                        <td className="px-6 py-4">{payment.invoice?.invoice_number || 'N/A'}</td>
                        <td className="px-6 py-4 font-semibold">${payment.amount?.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={payment.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {payment.created_at ? format(new Date(payment.created_at), 'MMM dd, yyyy') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={CreditCard}
              title="No payments found"
              description="Try adjusting your filters"
            />
          )}
        </TabsContent>

        {/* User Reports */}
        <TabsContent value="users" className="space-y-6">
          {/* Filters */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4" />
              <h3 className="font-semibold">Filters</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={userFilters.role} onValueChange={(value) => setUserFilters({ ...userFilters, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="service_provider">Service Provider</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="support_agent">Support Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={userFilters.status} onValueChange={(value) => setUserFilters({ ...userFilters, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={userFilters.date_from}
                  onChange={(e) => setUserFilters({ ...userFilters, date_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={userFilters.date_to}
                  onChange={(e) => setUserFilters({ ...userFilters, date_to: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => handleExport('users', 'excel')} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => handleExport('users', 'pdf')} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Stats */}
          {usersData?.stats && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <StatCard
                title="Total Users"
                value={usersData.stats.total_users}
                icon={Users}
              />
              <StatCard
                title="Active Users"
                value={usersData.stats.active_users}
                icon={CheckCircle}
                variant="success"
              />
              <StatCard
                title="Inactive Users"
                value={usersData.stats.inactive_users}
                icon={AlertTriangle}
                variant="error"
              />
              <StatCard
                title="Customers"
                value={usersData.stats.customers}
                icon={Users}
              />
              <StatCard
                title="Service Providers"
                value={usersData.stats.service_providers}
                icon={Building2}
              />
              <StatCard
                title="New This Month"
                value={usersData.stats.new_this_month}
                icon={TrendingUp}
                variant="primary"
              />
            </div>
          )}

          {/* User Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : usersData?.users?.data?.length > 0 ? (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Invoices</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Payments</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {usersData.users.data.map((user: any) => (
                      <tr key={user.id} className="hover:bg-muted/30">
                        <td className="px-6 py-4">
                          <div className="font-medium">{user.name}</div>
                        </td>
                        <td className="px-6 py-4">{user.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {user.roles?.map((role: any) => (
                              <span key={role.id || role.name} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                                {role.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">{user.invoices_count || 0}</td>
                        <td className="px-6 py-4">{user.payments_count || 0}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={user.is_active ? 'active' : 'inactive'} />
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {user.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No users found"
              description="Try adjusting your filters"
            />
          )}
        </TabsContent>

        {/* Financial Reports */}
        <TabsContent value="financial" className="space-y-6">
          {/* Filters */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4" />
              <h3 className="font-semibold">Filters</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={financialFilters.date_from}
                  onChange={(e) => setFinancialFilters({ ...financialFilters, date_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={financialFilters.date_to}
                  onChange={(e) => setFinancialFilters({ ...financialFilters, date_to: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Actions</Label>
                <div className="flex gap-2">
                  <Button onClick={() => handleExport('financial', 'excel')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button onClick={() => handleExport('financial', 'pdf')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          {financialData?.stats && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Revenue"
                value={`$${financialData.stats.total_revenue?.toLocaleString() || '0'}`}
                icon={DollarSign}
                variant="primary"
              />
              <StatCard
                title="Total Invoices"
                value={financialData.stats.total_invoices}
                icon={FileText}
              />
              <StatCard
                title="Paid Invoices"
                value={financialData.stats.paid_invoices}
                icon={CheckCircle}
                variant="success"
              />
              <StatCard
                title="Average Payment"
                value={`$${financialData.stats.average_payment?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0'}`}
                icon={TrendingUp}
              />
            </div>
          )}

          {/* Revenue by Provider */}
          {financialData?.revenue_by_provider && financialData.revenue_by_provider.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Revenue by Service Provider</h3>
              <div className="space-y-2">
                {financialData.revenue_by_provider.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="font-medium">{item.provider}</span>
                    <span className="font-semibold text-primary">${item.revenue?.toLocaleString() || '0'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Revenue Chart */}
          {financialData?.monthly_revenue && financialData.monthly_revenue.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Monthly Revenue</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData.monthly_revenue.map((item: any) => ({
                    month: item.month,
                    revenue: item.total || 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `$${v/1000}k`} />
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Usage Reports */}
        <TabsContent value="usage" className="space-y-6">
          {/* Filters */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4" />
              <h3 className="font-semibold">Filters</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={usageFilters.date_from}
                  onChange={(e) => setUsageFilters({ ...usageFilters, date_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={usageFilters.date_to}
                  onChange={(e) => setUsageFilters({ ...usageFilters, date_to: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Actions</Label>
                <div className="flex gap-2">
                  <Button onClick={() => handleExport('usage', 'excel')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button onClick={() => handleExport('usage', 'pdf')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          {usageData?.stats && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Providers"
                value={usageData.stats.total_providers}
                icon={Building2}
              />
              <StatCard
                title="Active Providers"
                value={usageData.stats.active_providers}
                icon={CheckCircle}
                variant="success"
              />
              <StatCard
                title="Total Invoices"
                value={usageData.stats.total_invoices}
                icon={FileText}
              />
              <StatCard
                title="Active Users"
                value={usageData.stats.total_users_active}
                icon={Users}
                variant="primary"
              />
            </div>
          )}

          {/* Service Provider Usage */}
          {usageData?.provider_usage && usageData.provider_usage.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="font-semibold">Service Provider Usage</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Total Invoices</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Paid Invoices</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {usageData.provider_usage.map((provider: any) => (
                      <tr key={provider.id} className="hover:bg-muted/30">
                        <td className="px-6 py-4 font-medium">{provider.company_name}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={provider.is_active ? 'active' : 'inactive'} />
                        </td>
                        <td className="px-6 py-4">{provider.invoices_count || 0}</td>
                        <td className="px-6 py-4">{provider.paid_invoices_count || 0}</td>
                        <td className="px-6 py-4 font-semibold">${provider.total_revenue?.toLocaleString() || '0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* User Activity */}
          {usageData?.user_activity && usageData.user_activity.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="font-semibold">User Activity</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Invoices</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Payments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {usageData.user_activity.map((user: any) => (
                      <tr key={user.id} className="hover:bg-muted/30">
                        <td className="px-6 py-4 font-medium">{user.name}</td>
                        <td className="px-6 py-4">{user.email}</td>
                        <td className="px-6 py-4">{user.invoices_count || 0}</td>
                        <td className="px-6 py-4">{user.payments_count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

