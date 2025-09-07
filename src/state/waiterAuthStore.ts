import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setToken, clearToken } from '../api/restClient';
import { waiterLogin, waiterStatus } from '../api/endpoints';

interface WaiterSession {
  waiterId: number;
  waiterName: string;
  accessToken: string;
  lastCheckin?: string;
}

interface WaiterAuthState {
  session: WaiterSession | null;
  loading: boolean;
  error: string | null;
  errorcode : string | null;
  loginWaiter: (waiterId: number, pin: string) => Promise<boolean>;
  checkActive: () => Promise<boolean>;
  logoutWaiter: () => Promise<void>;
}

// waiterLogin & waiterStatus imported

export const useWaiterAuthStore = create<WaiterAuthState>()(
  persist(
    (set, get) => ({
      session: null,
      loading: false,
      error: null,
      errorcode :null,
      loginWaiter: async (waiterId: number, pin: string) => {
        set({ loading: true, error: null });
        console.log(waiterId)
        console.log(pin)

        try {
          const resp = await waiterLogin(waiterId, pin);
          console.log(resp)
          const sess: WaiterSession = {
            waiterId: resp.waiter.id,
            waiterName: resp.waiter.name,
            accessToken: resp.accessToken,
            lastCheckin: resp.lastCheckin
          };
          await setToken(resp.accessToken);
          set({ session: sess, loading: false });
          return true;
        } catch (e: any) {
          set({ error: e.message || 'Garson girişi başarısız', loading: false ,errorcode :e.code || "bilinmiyor" });
          return false;
        }
      },
      checkActive: async () => {
        const sess = get().session;
        if (!sess) return false;
        try {
          const res = await waiterStatus(sess.waiterId);
          if (!res.active) {
            await clearToken();
            set({ session: null });
            return false;
          }
          return true;
        } catch (e) {
          return false;
        }
      },
      logoutWaiter: async () => {
        await clearToken();
        set({ session: null });
      }
    }),
    { name: 'waiter-session', partialize: (s) => ({ session: s.session }) }
  )
);
