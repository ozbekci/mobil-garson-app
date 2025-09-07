import { create } from 'zustand';
import { verifyOwner } from '../api/endpoints';

interface OwnerState {
  verified: boolean;
  loading: boolean;
  error: string | null;
  verify: (password: string) => Promise<boolean>;
  reset: () => void;
}

export const useOwnerStore = create<OwnerState>((set) => ({
  verified: false,
  loading: false,
  error: null,
  verify: async (password: string) => {
    set({ loading: true, error: null });
    try {
      const res = await verifyOwner(password);
      if (!res.ok) {
        set({ loading: false, error: 'Geçersiz şifre' });
        return false;
      }
      set({ verified: true, loading: false });
      return true;
    } catch (e: any) {
      set({ loading: false, error: e.message || 'Doğrulama başarısız' });
      return false;
    }
  },
  reset: () => set({ verified: false, error: null })
}));
