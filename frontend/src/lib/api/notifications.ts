/**
 * Notifications API
 */

import { apiClient, ApiResponse, PaginatedResponse } from '../api';

export interface Notification {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: number;
  data: {
    type: string;
    invoice_id?: number;
    invoice_number?: string;
    payment_id?: number;
    payment_reference?: string;
    amount?: number;
    title?: string;
    message: string;
    action_url?: string;
    [key: string]: any;
  };
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export const notificationsApi = {
  /**
   * Get all notifications
   */
  async getAll(params?: {
    page?: number;
    per_page?: number;
    read?: boolean;
    type?: string;
  }): Promise<ApiResponse<{ notifications: PaginatedResponse<Notification>; unread_count: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.read !== undefined) queryParams.append('read', params.read.toString());
    if (params?.type) queryParams.append('type', params.type);

    const query = queryParams.toString();
    return apiClient.get<{ notifications: PaginatedResponse<Notification>; unread_count: number }>(
      `/notifications${query ? `?${query}` : ''}`
    );
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<ApiResponse<{ unread_count: number }>> {
    return apiClient.get<{ unread_count: number }>('/notifications/unread-count');
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    return apiClient.post<Notification>(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse<{ unread_count: number }>> {
    return apiClient.post<{ unread_count: number }>('/notifications/read-all');
  },

  /**
   * Delete a notification
   */
  async delete(id: string): Promise<ApiResponse> {
    return apiClient.delete(`/notifications/${id}`);
  },

  /**
   * Delete all notifications
   */
  async deleteAll(): Promise<ApiResponse> {
    return apiClient.delete('/notifications');
  },
};

