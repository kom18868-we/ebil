import { apiClient, ApiResponse } from '../api';

export interface DashboardStats {
  total_invoices: number;
  pending_invoices: number;
  overdue_invoices?: number;
  paid_invoices: number;
  total_paid?: number;
  pending_amount?: number;
  total_payments?: number;
  total_revenue?: number;
  total_users?: number;
  active_users?: number;
  open_tickets?: number;
  resolved_tickets?: number;
}

export interface DashboardInvoice {
  id: number;
  invoice_number: string;
  title: string;
  total_amount: number;
  status: string;
  due_date: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  service_provider?: {
    id: number;
    name: string;
  };
}

export interface DashboardPayment {
  id: number;
  reference: string;
  amount: number;
  status: string;
  created_at: string;
  invoice?: {
    id: number;
    invoice_number: string;
    title: string;
  };
  user?: {
    id: number;
    name: string;
  };
}

export interface DashboardData {
  type: 'customer' | 'admin' | 'service_provider' | 'support_agent';
  stats: DashboardStats;
  recent_invoices: DashboardInvoice[];
  recent_payments: DashboardPayment[];
  upcoming_due_dates?: DashboardInvoice[];
  monthly_revenue?: Array<{
    month: number;
    total: number;
  }>;
}

export const dashboardApi = {
  /**
   * Get dashboard data
   */
  async getData(): Promise<ApiResponse<DashboardData>> {
    return apiClient.get<DashboardData>('/dashboard');
  },
};

