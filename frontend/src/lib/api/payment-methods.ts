/**
 * Payment Methods API
 */

import { apiClient, ApiResponse } from '../api';

export interface PaymentMethod {
  id: number;
  user_id: number;
  type: 'credit_card' | 'debit_card' | 'bank_account' | 'digital_wallet';
  name: string;
  last_four?: string;
  brand?: string;
  gateway_token?: string;
  expires_at?: string;
  is_default: boolean;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentMethodData {
  type: 'credit_card' | 'debit_card' | 'bank_account' | 'digital_wallet';
  name: string;
  last_four?: string;
  brand?: string;
  gateway_token?: string;
  expires_at?: string;
  is_default?: boolean;
}

export interface UpdatePaymentMethodData extends Partial<CreatePaymentMethodData> {
  name?: string;
  expires_at?: string;
  is_active?: boolean;
}

export const paymentMethodsApi = {
  /**
   * Get all payment methods for the current user
   */
  async getAll(): Promise<ApiResponse<PaymentMethod[]>> {
    return apiClient.get<PaymentMethod[]>('/payment-methods');
  },

  /**
   * Get a single payment method by ID
   */
  async getById(id: number): Promise<ApiResponse<PaymentMethod>> {
    return apiClient.get<PaymentMethod>(`/payment-methods/${id}`);
  },

  /**
   * Create a new payment method
   */
  async create(data: CreatePaymentMethodData): Promise<ApiResponse<PaymentMethod>> {
    return apiClient.post<PaymentMethod>('/payment-methods', data);
  },

  /**
   * Update a payment method
   */
  async update(id: number, data: UpdatePaymentMethodData): Promise<ApiResponse<PaymentMethod>> {
    return apiClient.put<PaymentMethod>(`/payment-methods/${id}`, data);
  },

  /**
   * Delete a payment method
   */
  async delete(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/payment-methods/${id}`);
  },

  /**
   * Set a payment method as default
   */
  async makeDefault(id: number): Promise<ApiResponse<PaymentMethod>> {
    return apiClient.post<PaymentMethod>(`/payment-methods/${id}/make-default`, {});
  },
};

