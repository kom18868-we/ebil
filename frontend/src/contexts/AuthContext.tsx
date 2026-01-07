import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { apiClient } from '@/lib/api';
import { authApi } from '@/lib/api/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('auth_token');
      
      if (savedUser && savedToken) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        apiClient.setToken(savedToken);
        
        // Verify user is still valid
        const response = await authApi.getCurrentUser();
        if (response.data) {
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } else {
          // Token invalid, clear storage
          clearAuth();
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const clearAuth = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    apiClient.setToken(null);
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApi.login({ email, password });
      
      if (response.data?.user) {
        setUser(response.data.user);
        if (response.data.token) {
          apiClient.setToken(response.data.token);
        }
        return { success: true };
      }
      
      // Extract error message from response
      let errorMessage = response.message || 'Login failed';
      if (response.errors) {
        // Check for general errors first
        if (response.errors.general && Array.isArray(response.errors.general) && response.errors.general.length > 0) {
          errorMessage = response.errors.general[0];
        } else {
          // Get first error message from errors object
          const errorKeys = Object.keys(response.errors);
          if (errorKeys.length > 0) {
            const firstError = response.errors[errorKeys[0]];
            if (Array.isArray(firstError) && firstError.length > 0) {
              errorMessage = firstError[0];
            } else if (typeof firstError === 'string') {
              errorMessage = firstError;
            }
          }
        }
      }
      
      return { success: false, error: errorMessage };
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.message || 'An error occurred during login';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      loading,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
