import { apiClient, type ApiResponse, type PaginatedResponse } from '../api';
import type { User } from '../api';

export interface UserCreateData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  preferred_language?: 'en' | 'ar';
  is_active?: boolean;
  roles: string[];
}

export interface UserUpdateData extends Partial<UserCreateData> {
  password?: string;
  password_confirmation?: string;
}

export interface UsersListParams {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive';
  per_page?: number;
  page?: number;
}

export const usersApi = {
  /**
   * Get list of users with pagination and filters
   */
  async getAll(params?: UsersListParams): Promise<ApiResponse<PaginatedResponse<User> & { roles: any[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const query = queryParams.toString();
    return apiClient.get(`/admin/users${query ? `?${query}` : ''}`);
  },

  /**
   * Get a single user by ID
   */
  async getById(id: number): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`/admin/users/${id}`);
  },

  /**
   * Create a new user
   */
  async create(data: UserCreateData): Promise<ApiResponse<User>> {
    return apiClient.post<User>('/admin/users', data);
  },

  /**
   * Update a user
   */
  async update(id: number, data: UserUpdateData): Promise<ApiResponse<User>> {
    return apiClient.put<User>(`/admin/users/${id}`, data);
  },

  /**
   * Delete a user
   */
  async delete(id: number): Promise<ApiResponse> {
    return apiClient.delete(`/admin/users/${id}`);
  },

  /**
   * Toggle user active status
   */
  async toggleStatus(id: number): Promise<ApiResponse<User>> {
    return apiClient.post<User>(`/admin/users/${id}/toggle-status`);
  },

  /**
   * Assign role to user
   */
  async assignRole(id: number, role: string): Promise<ApiResponse<User>> {
    return apiClient.post<User>(`/admin/users/${id}/assign-role`, { role });
  },
};

