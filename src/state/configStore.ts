import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setBaseUrl } from '../api/restClient';
import { handshakeRequest } from '../api/endpoints';

interface ConfigState {
  baseUrl: string;
  handshakeToken: string | null;
  instanceId: string | null;
  loading: boolean;
  error: string | null;
  setBaseUrlValue: (url: string) => Promise<void>;
  handshake: () => Promise<boolean>;
  reset: () => void;
}

// handshakeRequest imported

export const useConfigStore = create<ConfigState>()(
  // temporary memory storage to isolate AsyncStorage issues
  persist(
    (set, get) => ({
      baseUrl: 'http://localhost:4000',
      handshakeToken: null,
      instanceId: null,
      loading: false,
      error: null,
      setBaseUrlValue: async (url: string) => {
        await setBaseUrl(url);
        set({ baseUrl: url });
      },
      handshake: async () => {
        set({ loading: true, error: null });
        try {
          const res = await handshakeRequest();
          if (!res || typeof res !== 'object') {
            set({ loading: false, error: 'Sunucudan geçerli yanıt alınamadı' });
            return false;
          }
          // res may be { valid: boolean, token, instanceId } or other
          if (!('valid' in res) || res.valid !== true) {
            set({ loading: false, error: 'Bağlantı doğrulanamadı' });
            return false;
          }
          set({ handshakeToken: (res as any).token ?? null, instanceId: (res as any).instanceId ?? null, loading: false });
          return true;
        } catch (e: any) {
          set({ loading: false, error: e.message || 'Handshake başarısız' });
          return false;
        }
      },
      reset: () => set({ handshakeToken: null, instanceId: null })
    }),
    {
      name: 'config-storage',
      // use in-memory storage to avoid AsyncStorage errors while debugging
      storage: {
        // cast to any to satisfy zustand types during debugging
        getItem: async (name: string) => null as unknown as string,
        setItem: async (name: string, value: any) => undefined,
        removeItem: async (name: string) => undefined,
      } as any,
      partialize: (s): Partial<ConfigState> => ({ baseUrl: s.baseUrl, handshakeToken: s.handshakeToken, instanceId: s.instanceId }),
    }
  )
);
