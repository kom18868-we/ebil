/**
 * Authentication API
 */

import { apiClient, ApiResponse } from '../api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  roles?: Array<{ id: number; name: string }>;
  permissions?: Array<{ id: number; name: string }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const WEB_BASE_URL = API_BASE_URL.replace('/api', '');

export const authApi = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      // First, get CSRF cookie from web route (required for Sanctum stateful)
      console.log('Fetching CSRF cookie from:', `${WEB_BASE_URL}/sanctum/csrf-cookie`);
      
      let csrfResponse;
      try {
        csrfResponse = await fetch(`${WEB_BASE_URL}/sanctum/csrf-cookie`, {
          method: 'GET',
          credentials: 'include',
        });
      } catch (fetchError: any) {
        console.error('Network error fetching CSRF cookie:', fetchError);
        if (fetchError.message === 'Failed to fetch' || fetchError.name === 'TypeError') {
          throw new Error(
            'Cannot connect to server. Please make sure:\n' +
            '1. Laravel backend is running (php artisan serve)\n' +
            '2. Backend URL is correct in .env (VITE_API_BASE_URL)\n' +
            '3. No CORS issues (check browser console)\n' +
            `Current URL: ${WEB_BASE_URL}`
          );
        }
        throw fetchError;
      }
      
      if (!csrfResponse.ok) {
        console.error('Failed to get CSRF cookie:', csrfResponse.status, csrfResponse.statusText);
        throw new Error(`Failed to get CSRF cookie: ${csrfResponse.status} ${csrfResponse.statusText}`);
      }
      
      console.log('CSRF cookie obtained, attempting login...');
      
      // Get CSRF token from cookie
      const getCsrfToken = () => {
        const name = 'XSRF-TOKEN';
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
          return decodeURIComponent(parts.pop()?.split(';').shift() || '');
        }
        return null;
      };

      const csrfToken = getCsrfToken();
      console.log('CSRF token from cookie:', csrfToken ? 'Found' : 'Not found');

      // Use API route for login to get token
      const loginHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };

      if (csrfToken) {
        loginHeaders['X-XSRF-TOKEN'] = csrfToken;
      }

      const loginResponse = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: loginHeaders,
        credentials: 'include', // Important: sends cookies including CSRF token
        body: JSON.stringify(credentials),
      });

      console.log('Login response status:', loginResponse.status);

      if (!loginResponse.ok && loginResponse.status === 0) {
        throw new Error(
          'Network error: Cannot connect to backend server.\n\n' +
          'Please check:\n' +
          '1. Is Laravel backend running? Run: php artisan serve\n' +
          '2. Is backend URL correct? Current: ' + API_BASE_URL + '\n' +
          '3. Check browser console for CORS errors\n' +
          '4. Make sure backend is on http://localhost:8000'
        );
      }

      const response = await apiResponse<AuthResponse>(loginResponse);

      if (response.data?.user) {
        console.log('Login successful, storing user data');
        // Store user and token in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        if (response.data.token) {
          apiClient.setToken(response.data.token);
        }
      } else {
        console.error('Login failed:', response.errors, response.message);
      }

      return response;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    try {
      // First, get CSRF cookie
      const csrfResponse = await fetch(`${WEB_BASE_URL}/sanctum/csrf-cookie`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!csrfResponse.ok) {
        console.error('Failed to get CSRF cookie:', csrfResponse.status, csrfResponse.statusText);
      }
      
      // Get CSRF token from cookie
      const getCsrfToken = () => {
        const name = 'XSRF-TOKEN';
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
          return decodeURIComponent(parts.pop()?.split(';').shift() || '');
        }
        return null;
      };

      const csrfToken = getCsrfToken();
      
      // Use API route for registration
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };

      if (csrfToken) {
        headers['X-XSRF-TOKEN'] = csrfToken;
      }

      const registerResponse = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const response = await apiResponse<AuthResponse>(registerResponse);

      if (response.data?.user) {
        // Store user and token in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        if (response.data.token) {
          apiClient.setToken(response.data.token);
        }
      }

      return response;
    } catch (error) {
      console.error('Registration API error:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    // Always clear local storage and token first (optimistic logout)
    apiClient.setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    
    try {
      // Try to logout on backend using API route (with timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      try {
        await apiClient.post('/logout', {}, { signal: controller.signal });
      } catch (apiError: any) {
        // If API logout fails, try web route as fallback
        if (!controller.signal.aborted) {
          const getCsrfToken = () => {
            const name = 'XSRF-TOKEN';
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) {
              return decodeURIComponent(parts.pop()?.split(';').shift() || '');
            }
            return null;
          };

          const csrfToken = getCsrfToken();
          
          const headers: HeadersInit = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          };

          if (csrfToken) {
            headers['X-XSRF-TOKEN'] = csrfToken;
          }

          await fetch(`${WEB_BASE_URL}/logout`, {
            method: 'POST',
            headers,
            credentials: 'include',
            signal: controller.signal,
          });
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      // Silently fail - user is already logged out locally
      console.log('Logout API call failed, but user is logged out locally');
    }
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/user');
  },

  async forgotPassword(email: string): Promise<ApiResponse> {
    return apiClient.post('/forgot-password', { email });
  },

  async resetPassword(data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<ApiResponse> {
    return apiClient.post('/reset-password', data);
  },
};

async function apiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let data: any = {};
  let responseText = '';
  
  try {
    responseText = await response.text();
    if (responseText) {
      data = JSON.parse(responseText);
    }
  } catch (e) {
    // If response is not JSON, use empty object
    data = {};
  }

  if (!response.ok) {
    // Handle 401 Unauthenticated errors
    if (response.status === 401) {
      // Check if it's a login error or general unauthenticated
      if (responseText.includes('Unauthenticated') || data.message === 'Unauthenticated' || data.error === 'Unauthenticated') {
        return {
          errors: { general: ['Invalid email or password. Please try again.'] },
          message: 'Invalid email or password. Please try again.',
        };
      }
      return {
        errors: { general: ['Invalid email or password. Please try again.'] },
        message: 'Invalid email or password. Please try again.',
      };
    }
    
    // Handle validation errors (Laravel format)
    if (data.errors && typeof data.errors === 'object') {
      // Convert errors object to proper format
      const formattedErrors: Record<string, string[]> = {};
      for (const [key, value] of Object.entries(data.errors)) {
        if (Array.isArray(value)) {
          formattedErrors[key] = value;
        } else if (typeof value === 'string') {
          formattedErrors[key] = [value];
        } else {
          formattedErrors[key] = [String(value)];
        }
      }
      
      // Extract message from errors if no message provided
      let errorMessage = data.message || 'Validation failed';
      if (!errorMessage || errorMessage === 'Validation failed') {
        // Get first error message
        const firstKey = Object.keys(formattedErrors)[0];
        if (firstKey && formattedErrors[firstKey] && formattedErrors[firstKey].length > 0) {
          errorMessage = formattedErrors[firstKey][0];
        }
      }
      
      return {
        errors: formattedErrors,
        message: errorMessage,
      };
    }
    
    // Handle single error message
    if (data.message) {
      return {
        errors: { general: [data.message] },
        message: data.message,
      };
    }
    
    // Handle "Unauthenticated" message in response text
    if (responseText && (responseText.includes('Unauthenticated') || data.error === 'Unauthenticated')) {
      return {
        errors: { general: ['Invalid email or password. Please try again.'] },
        message: 'Invalid email or password. Please try again.',
      };
    }
    
    // Default error
    return {
      errors: { general: [`Request failed with status ${response.status}`] },
      message: `Request failed with status ${response.status}`,
    };
  }

  return { data };
}

