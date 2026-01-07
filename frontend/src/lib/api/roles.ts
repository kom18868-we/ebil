import { apiClient, type ApiResponse } from '../api';

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRoleData {
  name: string;
  permissions?: string[];
}

export interface UpdateRoleData {
  name?: string;
  permissions?: string[];
}

export const rolesApi = {
  /**
   * Get all roles with permissions
   */
  async getAll(): Promise<ApiResponse<{ roles: Role[]; permissions: Permission[] }>> {
    return apiClient.get('/admin/roles');
  },

  /**
   * Get a single role by ID
   */
  async getById(id: number): Promise<ApiResponse<{ role: Role; permissions: Permission[] }>> {
    return apiClient.get(`/admin/roles/${id}`);
  },

  /**
   * Create a new role
   */
  async create(data: CreateRoleData): Promise<ApiResponse<Role>> {
    return apiClient.post<Role>('/admin/roles', data);
  },

  /**
   * Update a role
   */
  async update(id: number, data: UpdateRoleData): Promise<ApiResponse<Role>> {
    return apiClient.put<Role>(`/admin/roles/${id}`, data);
  },

  /**
   * Delete a role
   */
  async delete(id: number): Promise<ApiResponse> {
    return apiClient.delete(`/admin/roles/${id}`);
  },

  /**
   * Assign permissions to role
   */
  async assignPermissions(id: number, permissions: string[]): Promise<ApiResponse<Role>> {
    return apiClient.post<Role>(`/admin/roles/${id}/permissions`, { permissions });
  },
};

