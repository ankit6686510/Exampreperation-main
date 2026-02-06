import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axiosInstance from '@/api/axiosInstance';

interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  examTypes?: string[];
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Set authorization header
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Verify token and get user data
      const response = await axiosInstance.get('/auth/me');
      setUser(response.data.data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid token
      localStorage.removeItem('authToken');
      delete axiosInstance.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password
      });

      const { token, user: userData } = response.data.data;

      // Store token
      localStorage.setItem('authToken', token);
      
      // Set authorization header for future requests
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Set user data
      setUser(userData);
    } catch (error: unknown) {
      // Clear any existing auth data on login failure
      localStorage.removeItem('authToken');
      delete axiosInstance.defaults.headers.common['Authorization'];
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed. Please try again.';
      
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    // Clear user data
    setUser(null);
    
    // Clear token from storage
    localStorage.removeItem('authToken');
    
    // Remove authorization header
    delete axiosInstance.defaults.headers.common['Authorization'];
    
    // Optionally call logout endpoint
    axiosInstance.post('/auth/logout').catch(() => {
      // Ignore errors on logout
    });
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const refreshUser = async () => {
    try {
      const response = await axiosInstance.get('/auth/me');
      setUser(response.data.data.user);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If refresh fails, user might need to login again
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
