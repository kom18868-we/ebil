import { apiClient, ApiResponse, PaginatedResponse } from '../api';

export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  model_type: string | null;
  model_id: number | null;
  description: string;
  properties: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  model?: any;
}

export interface ActivityLogStats {
  total_activities: number;
  activities_today: number;
  activities_this_week: number;
  activities_this_month: number;
  top_actions: Array<{
    action: string;
    count: number;
  }>;
}

export interface ActivityLogFilters {
  action?: string;
  user_id?: number;
  date_from?: string;
  date_to?: string;
  model_type?: string;
  model_id?: number;
  search?: string;
  per_page?: number;
  page?: number;
}

export const activityLogsApi = {
  /**
   * Get activity logs
   */
  async getAll(filters?: ActivityLogFilters): Promise<ApiResponse<PaginatedResponse<ActivityLog>>> {
    const params = new URLSearchParams();
    if (filters?.action) params.append('action', filters.action);
    if (filters?.user_id) params.append('user_id', filters.user_id.toString());
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.model_type) params.append('model_type', filters.model_type);
    if (filters?.model_id) params.append('model_id', filters.model_id.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.per_page) params.append('per_page', filters.per_page.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    
    const query = params.toString();
    return apiClient.get<PaginatedResponse<ActivityLog>>(`/activity-logs${query ? `?${query}` : ''}`);
  },

  /**
   * Get activity log statistics
   */
  async getStats(filters?: { date_from?: string; date_to?: string }): Promise<ApiResponse<ActivityLogStats>> {
    const params = new URLSearchParams();
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    
    const query = params.toString();
    return apiClient.get<ActivityLogStats>(`/activity-logs/stats${query ? `?${query}` : ''}`);
  },

  /**
   * Get a specific activity log
   */
  async getById(id: number): Promise<ApiResponse<ActivityLog>> {
    return apiClient.get<ActivityLog>(`/activity-logs/${id}`);
  },
};

