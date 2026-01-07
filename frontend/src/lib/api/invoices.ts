/**
 * Invoices API
 */

import { apiClient, ApiResponse, PaginatedResponse } from '../api';

export interface Invoice {
  id: number;
  invoice_number: string;
  user_id: number;
  service_provider_id: number;
  title: string;
  description?: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'archived';
  due_date: string;
  issue_date: string;
  paid_date?: string;
  created_at: string;
  updated_at: string;
  user?: any;
  service_provider?: any;
  payments?: any[];
}

export interface CreateInvoiceData {
  user_id: number;
  service_provider_id?: number; // Optional - auto-set for service providers
  title: string;
  description?: string;
  amount: number;
  tax_amount?: number;
  due_date: string;
  issue_date?: string;
  status?: 'pending' | 'paid' | 'overdue';
}

export interface Customer {
  id: number;
  name: string;
  email: string;
}

export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {}

export const invoicesApi = {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ApiResponse<PaginatedResponse<Invoice>>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);

    const query = queryParams.toString();
    return apiClient.get<PaginatedResponse<Invoice>>(`/invoices${query ? `?${query}` : ''}`);
  },

  async getById(id: number): Promise<ApiResponse<Invoice>> {
    return apiClient.get<Invoice>(`/invoices/${id}`);
  },

  async create(data: CreateInvoiceData): Promise<ApiResponse<Invoice>> {
    return apiClient.post<Invoice>('/invoices', data);
  },

  async update(id: number, data: UpdateInvoiceData): Promise<ApiResponse<Invoice>> {
    return apiClient.put<Invoice>(`/invoices/${id}`, data);
  },

  async delete(id: number): Promise<ApiResponse> {
    return apiClient.delete(`/invoices/${id}`);
  },

  async download(id: number): Promise<void> {
    return apiClient.download(`/invoices/${id}/download`, `invoice-${id}.pdf`);
  },

  async markAsPaid(id: number): Promise<ApiResponse<Invoice>> {
    return apiClient.post<Invoice>(`/invoices/${id}/mark-as-paid`);
  },

  async cancel(id: number, reason?: string): Promise<ApiResponse<Invoice>> {
    return apiClient.post<Invoice>(`/invoices/${id}/cancel`, reason ? { reason } : {});
  },

  async archive(): Promise<ApiResponse> {
    return apiClient.post('/invoices/archive');
  },

  async getCustomers(): Promise<ApiResponse<Customer[]>> {
    return apiClient.get<Customer[]>('/invoices/customers');
  },
};

