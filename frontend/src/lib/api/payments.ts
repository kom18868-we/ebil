/**
 * Payments API
 */

import { apiClient, ApiResponse, PaginatedResponse } from '../api';

export interface Payment {
  id: number;
  payment_reference: string;
  invoice_id: number;
  user_id: number;
  payment_method_id: number;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_type: 'full' | 'partial';
  gateway: string;
  gateway_transaction_id?: string;
  gateway_response?: any;
  processed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  invoice?: any;
  user?: any;
  payment_method?: any;
}

export interface CreatePaymentData {
  invoice_id: number;
  payment_method_id: number;
  amount: number;
  payment_type: 'full' | 'partial';
  gateway?: string;
  notes?: string;
}

export const paymentsApi = {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    payment_method?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ApiResponse<PaginatedResponse<Payment>>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.payment_method) queryParams.append('payment_method', params.payment_method);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);

    const query = queryParams.toString();
    return apiClient.get<PaginatedResponse<Payment>>(`/payments${query ? `?${query}` : ''}`);
  },

  async getById(id: number): Promise<ApiResponse<Payment>> {
    return apiClient.get<Payment>(`/payments/${id}`);
  },

  async create(data: CreatePaymentData): Promise<ApiResponse<Payment>> {
    return apiClient.post<Payment>('/payments', data);
  },

  async delete(id: number): Promise<ApiResponse> {
    return apiClient.delete(`/payments/${id}`);
  },

  async downloadReceipt(id: number): Promise<void> {
    return apiClient.download(`/payments/${id}/receipt`, `receipt-${id}.pdf`);
  },
};

