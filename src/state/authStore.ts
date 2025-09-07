// src/state/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoginResponse } from '../types';
import { login as apiLogin } from '../api/endpoints';
import { setToken, clearToken } from '../api/restClient';

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
  accessToken: null,
      isAuthenticated: false,
      loading: false,
      login: async (username: string, password: string) => {
        set({ loading: true });
        try {
          const response: LoginResponse = await apiLogin(username, password);
          await setToken(response.accessToken);
          set({ accessToken: response.accessToken, isAuthenticated: true, loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      logout: async () => {
        set({ loading: true });
        await clearToken();
  set({ accessToken: null, isAuthenticated: false, loading: false });
      },
    }),
    {
      name: 'auth-storage',
  partialize: (state) => ({ accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
    }
  )
);
