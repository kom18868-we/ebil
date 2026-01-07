import { apiClient, ApiResponse, PaginatedResponse } from '../api';

export interface Refund {
  id: number;
  refund_reference: string;
  payment_id: number;
  invoice_id: number;
  user_id: number;
  processed_by?: number;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  refund_type: 'full' | 'partial';
  reason?: string;
  notes?: string;
  gateway?: string;
  gateway_refund_id?: string;
  gateway_response?: any;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  payment?: any;
  invoice?: any;
  user?: any;
  processedBy?: any;
}

export interface CreateRefundData {
  payment_id: number;
  amount: number;
  refund_type: 'full' | 'partial';
  reason?: string;
  notes?: string;
}

export const refundsApi = {
  /**
   * Get all refunds
   */
  async getAll(params?: {
    status?: string;
    payment_id?: number;
    invoice_id?: number;
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<ApiResponse<PaginatedResponse<Refund>>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.payment_id) queryParams.append('payment_id', params.payment_id.toString());
    if (params?.invoice_id) queryParams.append('invoice_id', params.invoice_id.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const query = queryParams.toString();
    return apiClient.get(`/refunds${query ? `?${query}` : ''}`);
  },

  /**
   * Get a single refund
   */
  async get(id: number): Promise<ApiResponse<Refund>> {
    return apiClient.get(`/refunds/${id}`);
  },

  /**
   * Create a new refund
   */
  async create(data: CreateRefundData): Promise<ApiResponse<Refund>> {
    return apiClient.post('/refunds', data);
  },

  /**
   * Cancel a refund
   */
  async cancel(id: number): Promise<ApiResponse<Refund>> {
    return apiClient.post(`/refunds/${id}/cancel`, {});
  },
};

