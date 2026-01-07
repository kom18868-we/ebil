import { apiClient, type ApiResponse, type PaginatedResponse } from '../api';

export interface AdminDashboardData {
  stats: {
    total_users: number;
    active_users: number;
    total_invoices: number;
    pending_invoices: number;
    overdue_invoices: number;
    paid_invoices: number;
    total_payments: number;
    total_revenue: number;
    open_tickets: number;
    resolved_tickets: number;
    total_service_providers: number;
  };
  recent_invoices: any[];
  recent_payments: any[];
  recent_tickets: any[];
  monthly_revenue: Array<{ month: number; total: number }>;
  revenue_by_provider: Array<{ provider: any; revenue: number }>;
  payment_status_distribution: Array<{ status: string; count: number }>;
  invoice_status_distribution: Array<{ status: string; count: number }>;
  new_users_this_month: number;
  revenue_this_month: number;
  revenue_last_month: number;
  revenue_growth: number;
}

export interface ReportParams {
  status?: string;
  date_from?: string;
  date_to?: string;
  service_provider_id?: number;
  payment_method_id?: number;
  role?: string;
  per_page?: number;
  page?: number;
}

export const adminApi = {
  /**
   * Get admin dashboard data
   */
  async getDashboard(): Promise<ApiResponse<AdminDashboardData>> {
    return apiClient.get<AdminDashboardData>('/admin/dashboard');
  },

  /**
   * Get invoice reports
   */
  async getInvoiceReports(params?: ReportParams): Promise<ApiResponse<PaginatedResponse<any> & { stats: any; service_providers: any[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.service_provider_id) queryParams.append('service_provider_id', params.service_provider_id.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const query = queryParams.toString();
    return apiClient.get(`/admin/reports/invoices${query ? `?${query}` : ''}`);
  },

  /**
   * Get payment reports
   */
  async getPaymentReports(params?: ReportParams): Promise<ApiResponse<PaginatedResponse<any> & { stats: any; monthly_revenue: any[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.payment_method_id) queryParams.append('payment_method_id', params.payment_method_id.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const query = queryParams.toString();
    return apiClient.get(`/admin/reports/payments${query ? `?${query}` : ''}`);
  },

  /**
   * Get user reports
   */
  async getUserReports(params?: ReportParams): Promise<ApiResponse<PaginatedResponse<any> & { stats: any }>> {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const query = queryParams.toString();
    return apiClient.get(`/admin/reports/users${query ? `?${query}` : ''}`);
  },

  /**
   * Get financial reports
   */
  async getFinancialReports(params?: { date_from?: string; date_to?: string }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    
    const query = queryParams.toString();
    return apiClient.get(`/admin/reports/financial${query ? `?${query}` : ''}`);
  },

  /**
   * Get usage reports
   */
  async getUsageReports(params?: { date_from?: string; date_to?: string }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    
    const query = queryParams.toString();
    return apiClient.get(`/admin/reports/usage${query ? `?${query}` : ''}`);
  },

  /**
   * Export report
   */
  async exportReport(data: {
    type: 'invoices' | 'payments' | 'users' | 'financial' | 'usage';
    format: 'excel' | 'pdf';
    date_from?: string;
    date_to?: string;
    status?: string;
    service_provider_id?: number;
  }): Promise<Blob> {
    const accept = data.format === 'pdf' ? 'application/pdf' : 'text/csv';
    return apiClient.downloadBlob('/admin/reports/export', data, accept);
  },

  /**
   * Schedule report
   */
  async scheduleReport(data: {
    type: 'invoices' | 'payments' | 'users' | 'financial' | 'usage';
    frequency: 'daily' | 'weekly' | 'monthly';
    email: string;
    format: 'excel' | 'pdf';
  }): Promise<ApiResponse> {
    return apiClient.post('/admin/reports/schedule', data);
  },
};

