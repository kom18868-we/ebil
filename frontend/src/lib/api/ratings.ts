/**
 * Ratings API
 */

import { apiClient, ApiResponse, PaginatedResponse } from '../api';

export interface ServiceProviderRating {
  id: number;
  user_id: number;
  service_provider_id: number;
  invoice_id?: number;
  rating: number; // 1-5
  comment?: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  service_provider?: {
    id: number;
    company_name: string;
  };
  invoice?: {
    id: number;
    invoice_number: string;
    title: string;
  };
}

export interface RatingStatistics {
  average_rating: number;
  total_ratings: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface CreateRatingData {
  service_provider_id: number;
  invoice_id?: number;
  rating: number; // 1-5
  comment?: string;
}

export interface UpdateRatingData {
  rating?: number;
  comment?: string;
}

export const ratingsApi = {
  /**
   * Get ratings for a service provider
   */
  async getByServiceProvider(
    serviceProviderId: number,
    params?: {
      page?: number;
      per_page?: number;
      rating?: number;
    }
  ): Promise<ApiResponse<{ ratings: PaginatedResponse<ServiceProviderRating>; statistics: RatingStatistics }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.rating) queryParams.append('rating', params.rating.toString());

    const query = queryParams.toString();
    return apiClient.get<{ ratings: PaginatedResponse<ServiceProviderRating>; statistics: RatingStatistics }>(
      `/service-providers/${serviceProviderId}/ratings${query ? `?${query}` : ''}`
    );
  },

  /**
   * Create a new rating
   */
  async create(data: CreateRatingData): Promise<ApiResponse<ServiceProviderRating>> {
    return apiClient.post<ServiceProviderRating>('/ratings', data);
  },

  /**
   * Update a rating
   */
  async update(id: number, data: UpdateRatingData): Promise<ApiResponse<ServiceProviderRating>> {
    return apiClient.put<ServiceProviderRating>(`/ratings/${id}`, data);
  },

  /**
   * Delete a rating
   */
  async delete(id: number): Promise<ApiResponse> {
    return apiClient.delete(`/ratings/${id}`);
  },

  /**
   * Get rating for a specific invoice
   */
  async getByInvoice(invoiceId: number): Promise<ApiResponse<ServiceProviderRating | null>> {
    return apiClient.get<ServiceProviderRating | null>(`/invoices/${invoiceId}/rating`);
  },

  /**
   * Get current user's ratings
   */
  async getMyRatings(params?: {
    page?: number;
    per_page?: number;
    service_provider_id?: number;
  }): Promise<ApiResponse<PaginatedResponse<ServiceProviderRating>>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.service_provider_id) queryParams.append('service_provider_id', params.service_provider_id.toString());

    const query = queryParams.toString();
    return apiClient.get<PaginatedResponse<ServiceProviderRating>>(`/my-ratings${query ? `?${query}` : ''}`);
  },
};

