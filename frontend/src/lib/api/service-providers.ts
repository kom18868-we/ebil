import { apiClient, type ApiResponse, type PaginatedResponse } from '../api';
import type { User } from '../api';

export interface ServiceProvider {
  id: number;
  user_id: number;
  company_name: string;
  business_registration?: string;
  tax_number?: string;
  description?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  status: 'active' | 'inactive' | 'suspended';
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  invoices?: any[];
  average_rating?: number;
  ratings_count?: number;
}

export interface CreateServiceProviderData {
  user_id: number;
  company_name: string;
  business_registration?: string;
  tax_number?: string;
  description?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface UpdateServiceProviderData extends Partial<CreateServiceProviderData> {}

export interface ServiceProviderListParams {
  search?: string;
  status?: 'active' | 'inactive' | 'suspended';
  per_page?: number;
  page?: number;
}

export const serviceProvidersApi = {
  /**
   * Get all service providers
   */
  async getAll(params?: ServiceProviderListParams): Promise<ApiResponse<PaginatedResponse<ServiceProvider>>> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const query = queryParams.toString();
    const response = await apiClient.get<{ service_providers: PaginatedResponse<ServiceProvider> }>(`/admin/service-providers${query ? `?${query}` : ''}`);
    
    // Transform response to match expected format
    if (response.data && 'service_providers' in response.data) {
      return {
        ...response,
        data: response.data.service_providers,
      } as ApiResponse<PaginatedResponse<ServiceProvider>>;
    }
    
    return response as ApiResponse<PaginatedResponse<ServiceProvider>>;
  },

  /**
   * Get a specific service provider
   */
  async getById(id: number): Promise<ApiResponse<ServiceProvider>> {
    const response = await apiClient.get<{ service_provider: ServiceProvider }>(`/admin/service-providers/${id}`);
    
    // Transform response
    if (response.data && 'service_provider' in response.data) {
      return {
        ...response,
        data: response.data.service_provider,
      } as ApiResponse<ServiceProvider>;
    }
    
    return response as ApiResponse<ServiceProvider>;
  },

  /**
   * Create a new service provider
   */
  async create(data: CreateServiceProviderData): Promise<ApiResponse<ServiceProvider>> {
    const response = await apiClient.post<{ service_provider: ServiceProvider }>('/admin/service-providers', data);
    
    // Transform response
    if (response.data && 'service_provider' in response.data) {
      return {
        ...response,
        data: response.data.service_provider,
      } as ApiResponse<ServiceProvider>;
    }
    
    return response as ApiResponse<ServiceProvider>;
  },

  /**
   * Update a service provider
   */
  async update(id: number, data: UpdateServiceProviderData): Promise<ApiResponse<ServiceProvider>> {
    const response = await apiClient.put<{ service_provider: ServiceProvider }>(`/admin/service-providers/${id}`, data);
    
    // Transform response
    if (response.data && 'service_provider' in response.data) {
      return {
        ...response,
        data: response.data.service_provider,
      } as ApiResponse<ServiceProvider>;
    }
    
    return response as ApiResponse<ServiceProvider>;
  },

  /**
   * Delete a service provider
   */
  async delete(id: number): Promise<ApiResponse> {
    return apiClient.delete(`/admin/service-providers/${id}`);
  },

  /**
   * Toggle service provider status
   */
  async toggleStatus(id: number): Promise<ApiResponse<ServiceProvider>> {
    const response = await apiClient.post<{ service_provider: ServiceProvider }>(`/admin/service-providers/${id}/toggle-status`);
    
    // Transform response
    if (response.data && 'service_provider' in response.data) {
      return {
        ...response,
        data: response.data.service_provider,
      } as ApiResponse<ServiceProvider>;
    }
    
    return response as ApiResponse<ServiceProvider>;
  },

  /**
   * Get available users for service provider creation
   */
  async getAvailableUsers(excludeProviderId?: number): Promise<ApiResponse<User[]>> {
    const queryParams = new URLSearchParams();
    if (excludeProviderId) {
      queryParams.append('exclude_provider_id', excludeProviderId.toString());
    }
    
    const query = queryParams.toString();
    const response = await apiClient.get<{ users: User[] }>(`/admin/service-providers/available-users${query ? `?${query}` : ''}`);
    
    // Transform response
    if (response.data && 'users' in response.data) {
      return {
        ...response,
        data: response.data.users,
      } as ApiResponse<User[]>;
    }
    
    return response as ApiResponse<User[]>;
  },
};

