/**
 * API Configuration and Base Functions
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

class ApiClient {
  public readonly baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private getToken(): string | null {
    // Always get the latest token from localStorage in case it was updated
    const token = localStorage.getItem('auth_token');
    if (token && token !== this.token) {
      this.token = token;
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Reload token to ensure we have the latest one
    const token = this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers,
    };

    // Include CSRF token for Sanctum stateful requests
    if (endpoint !== '/sanctum/csrf-cookie') {
      await this.ensureCsrfCookie();
      const csrfToken = this.getCsrfToken();
      if (csrfToken) {
        headers['X-XSRF-TOKEN'] = csrfToken;
      }
    }

    // For stateful Sanctum, we primarily use cookies, but also send token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Important for Sanctum
      });

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = {};
      }

      if (!response.ok) {
        // Handle 401 Unauthorized - token might be expired or invalid
        if (response.status === 401) {
          // Clear invalid token
          this.setToken(null);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          
          // Redirect to login if we're in the browser
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          
          return {
            errors: { general: ['Your session has expired. Please log in again.'] },
            message: 'Unauthorized. Please log in again.',
          };
        }
        
        // Log validation errors for debugging
        if (response.status === 422) {
          console.error('Validation Error Response:', {
            status: response.status,
            data: data,
            errors: data.errors,
            message: data.message,
          });
        }
        
        return {
          errors: data.errors || { general: [data.message || `Request failed with status ${response.status}`] },
          message: data.message || `Request failed with status ${response.status}`,
        };
      }

      // Laravel returns the resource directly, so wrap it in data
      return { data };
    } catch (error) {
      return {
        errors: { general: ['Network error. Please check your connection.'] },
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async ensureCsrfCookie() {
    try {
      await fetch(`${this.baseURL.replace('/api', '')}/sanctum/csrf-cookie`, {
        method: 'GET',
        credentials: 'include',
      });
    } catch (error) {
      console.warn('Failed to get CSRF cookie:', error);
    }
  }

  private getCsrfToken(): string | null {
    // Get CSRF token from cookie (Laravel sets it as XSRF-TOKEN)
    const name = 'XSRF-TOKEN';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return decodeURIComponent(parts.pop()?.split(';').shift() || '');
    }
    return null;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Download blob from POST request (for exports)
  async downloadBlob(endpoint: string, body?: any, accept?: string): Promise<Blob> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Reload token to ensure we have the latest one
    const token = this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': accept || 'application/pdf',
      'X-Requested-With': 'XMLHttpRequest',
    };

    // Include CSRF token for Sanctum stateful requests
    await this.ensureCsrfCookie();
    const csrfToken = this.getCsrfToken();
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken;
    }

    // For stateful Sanctum, we primarily use cookies, but also send token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `Export failed (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return await response.blob();
    } catch (error) {
      console.error('Download blob error:', error);
      throw error;
    }
  }

  // File download helper
  async download(endpoint: string, filename?: string): Promise<void> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Accept': 'application/pdf',
      'X-Requested-With': 'XMLHttpRequest',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Include CSRF token for Sanctum stateful requests
    await this.ensureCsrfCookie();
    const csrfToken = this.getCsrfToken();
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken;
    }

    try {
      const response = await fetch(url, {
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `Download failed (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        console.error('Download failed:', {
          status: response.status,
          statusText: response.statusText,
          url,
        });
        throw new Error(errorMessage);
      }

      // Check if response is actually a PDF
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('pdf') && !contentType.includes('application/octet-stream')) {
        // If not PDF, try to get error message
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Invalid response format');
        } catch {
          throw new Error('Response is not a PDF file');
        }
      }

      const blob = await response.blob();
      
      // Check if blob is empty or too small (might be an error page)
      if (blob.size < 100) {
        const text = await blob.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Download failed');
        } catch {
          throw new Error('Downloaded file appears to be empty or invalid');
        }
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

