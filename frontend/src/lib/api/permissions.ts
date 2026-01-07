import { apiClient, type ApiResponse } from '../api';

export interface Permission {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
  roles?: any[];
}

export interface CreatePermissionData {
  name: string;
}

export interface UpdatePermissionData {
  name?: string;
}

export const permissionsApi = {
  /**
   * Get all permissions
   */
  async getAll(): Promise<ApiResponse<{ permissions: Permission[]; grouped: Record<string, Permission[]> }>> {
    return apiClient.get('/admin/permissions');
  },

  /**
   * Get a single permission by ID
   */
  async getById(id: number): Promise<ApiResponse<{ permission: Permission }>> {
    return apiClient.get(`/admin/permissions/${id}`);
  },

  /**
   * Create a new permission
   */
  async create(data: CreatePermissionData): Promise<ApiResponse<Permission>> {
    return apiClient.post<Permission>('/admin/permissions', data);
  },

  /**
   * Update a permission
   */
  async update(id: number, data: UpdatePermissionData): Promise<ApiResponse<Permission>> {
    return apiClient.put<Permission>(`/admin/permissions/${id}`, data);
  },

  /**
   * Delete a permission
   */
  async delete(id: number): Promise<ApiResponse> {
    return apiClient.delete(`/admin/permissions/${id}`);
  },
};

