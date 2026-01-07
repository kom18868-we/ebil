import { apiClient, type ApiResponse } from '../api';
import type { User } from '../api';

export interface ProfileUpdateData {
  name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  preferred_language?: 'en' | 'ar';
}

export interface ChangePasswordData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export const profileApi = {
  /**
   * Get the authenticated user's profile
   */
  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/profile');
  },

  /**
   * Update the authenticated user's profile
   */
  async updateProfile(data: ProfileUpdateData): Promise<ApiResponse<User>> {
    return apiClient.put<User>('/profile', data);
  },

  /**
   * Get security settings
   */
  async getSecurity(): Promise<ApiResponse<{ two_factor_enabled: boolean; last_login_at: string | null }>> {
    return apiClient.get('/profile/security');
  },

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<ApiResponse<{ preferred_language: string; preferences: Record<string, any> }>> {
    return apiClient.get('/profile/preferences');
  },

  /**
   * Update user preferences
   */
  async updatePreferences(data: {
    preferred_language?: string;
    preferences?: Record<string, any>;
  }): Promise<ApiResponse<{ preferred_language: string; preferences: Record<string, any> }>> {
    return apiClient.put('/profile/preferences', data);
  },

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordData): Promise<ApiResponse> {
    return apiClient.post('/profile/change-password', data);
  },
};

