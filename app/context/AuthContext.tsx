import React, { createContext, useContext, useState, ReactNode } from 'react';
import apiService from '../services/ApiService';
import type { Waiter, WaiterLoginCredentials, ApiResponse } from '../services/ApiService';

interface AuthUser {
  type: 'waiter' | 'admin';
  waiter?: Waiter;
  token: string;
  loginTime: Date;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  waiterLogin: (credentials: WaiterLoginCredentials) => Promise<{success: boolean, error?: string}>;
  adminLogin: (username: string, password: string) => Promise<{success: boolean, error?: string}>;
  verifyOwner: (password: string) => Promise<{success: boolean, error?: string}>;
  logout: () => void;
  getActiveWaiters: () => Promise<Waiter[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = user !== null;

  // Garson girişi
  const waiterLogin = async (credentials: WaiterLoginCredentials): Promise<{success: boolean, error?: string}> => {
    setIsLoading(true);
    try {
      const response = await apiService.waiterLogin(credentials);
      
      if (response.status === 200 && response.data?.token && response.data?.waiter) {
        const authUser: AuthUser = {
          type: 'waiter',
          waiter: response.data.waiter,
          token: response.data.token,
          loginTime: new Date()
        };
        
        setUser(authUser);
        apiService.setAuthToken(response.data.token);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: response.error || 'Giriş başarısız. Garson ID ve PIN\'inizi kontrol edin.' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ağ hatası' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Admin girişi
  const adminLogin = async (username: string, password: string): Promise<{success: boolean, error?: string}> => {
    setIsLoading(true);
    try {
      const response = await apiService.login({ username, password });
      
      if (response.status === 200 && response.data?.token) {
        const authUser: AuthUser = {
          type: 'admin',
          token: response.data.token,
          loginTime: new Date()
        };
        
        setUser(authUser);
        apiService.setAuthToken(response.data.token);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: response.error || 'Admin girişi başarısız. Kullanıcı adı ve şifrenizi kontrol edin.' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ağ hatası' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // İşletme sahibi şifre doğrulama
  const verifyOwner = async (password: string): Promise<{success: boolean, error?: string}> => {
    setIsLoading(true);
    try {
      const response = await apiService.verifyOwner(password);
      
      if (response.status === 200 && response.data?.verified === true) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: response.error || 'Şifre doğrulaması başarısız.' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ağ hatası' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Aktif garson listesini getir
  const getActiveWaiters = async (): Promise<Waiter[]> => {
    try {
      const response = await apiService.getActiveWaiters();
      
      if (response.status === 200 && Array.isArray(response.data)) {
        return response.data;
      } else {
        console.error('Aktif garsonlar alınamadı:', response.error);
        return [];
      }
    } catch (error) {
      console.error('Aktif garsonlar alınırken hata:', error);
      return [];
    }
  };

  // Çıkış
  const logout = (): void => {
    setUser(null);
    apiService.setAuthToken(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    waiterLogin,
    adminLogin,
    verifyOwner,
    logout,
    getActiveWaiters,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Default export for Expo Router
export default AuthProvider;
