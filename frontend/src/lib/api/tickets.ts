/**
 * Support Tickets API
 */

import { apiClient, ApiResponse, PaginatedResponse } from '../api';

export interface Ticket {
  id: number;
  ticket_number: string;
  user_id: number;
  assigned_to?: number;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'billing' | 'technical' | 'general' | 'complaint' | 'suggestion';
  rating?: number;
  rating_comment?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  resolved_at?: string;
  user?: any;
  assignedTo?: any;
  replies?: TicketReply[];
}

export interface TicketReply {
  id: number;
  support_ticket_id: number;
  user_id: number;
  message: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  user?: any;
}

export interface CreateTicketData {
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'billing' | 'technical' | 'general' | 'complaint' | 'suggestion';
}

export interface UpdateTicketData extends Partial<CreateTicketData> {
  status?: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed';
  assigned_to?: number;
}

export interface ReplyData {
  message: string;
  is_internal?: boolean;
}

export interface RateData {
  rating: number;
  rating_comment?: string;
}

export const ticketsApi = {
  /**
   * Get all tickets for the current user
   */
  async getAll(params?: {
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
    assigned_to?: string;
    page?: number;
    per_page?: number;
  }): Promise<ApiResponse<Ticket[] | PaginatedResponse<Ticket>>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.assigned_to) queryParams.append('assigned_to', params.assigned_to);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    
    const query = queryParams.toString();
    const endpoint = query ? `/tickets?${query}` : '/tickets';
    return apiClient.get<Ticket[] | PaginatedResponse<Ticket>>(endpoint);
  },

  /**
   * Get a single ticket by ID
   */
  async getById(id: number): Promise<ApiResponse<Ticket>> {
    return apiClient.get<Ticket>(`/tickets/${id}`);
  },

  /**
   * Create a new ticket
   */
  async create(data: CreateTicketData): Promise<ApiResponse<Ticket>> {
    return apiClient.post<Ticket>('/tickets', data);
  },

  /**
   * Update a ticket
   */
  async update(id: number, data: UpdateTicketData): Promise<ApiResponse<Ticket>> {
    return apiClient.put<Ticket>(`/tickets/${id}`, data);
  },

  /**
   * Delete a ticket
   */
  async delete(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/tickets/${id}`);
  },

  /**
   * Add a reply to a ticket
   */
  async reply(id: number, data: ReplyData): Promise<ApiResponse<TicketReply>> {
    return apiClient.post<TicketReply>(`/tickets/${id}/replies`, data);
  },

  /**
   * Resolve a ticket
   */
  async resolve(id: number): Promise<ApiResponse<Ticket>> {
    return apiClient.post<Ticket>(`/tickets/${id}/resolve`, {});
  },

  /**
   * Close a ticket
   */
  async close(id: number): Promise<ApiResponse<Ticket>> {
    return apiClient.post<Ticket>(`/tickets/${id}/close`, {});
  },

  /**
   * Rate a ticket
   */
  async rate(id: number, data: RateData): Promise<ApiResponse<Ticket>> {
    return apiClient.post<Ticket>(`/tickets/${id}/rate`, data);
  },
};

