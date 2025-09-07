import { create } from 'zustand';
import { fetchFeatureFlags } from '../api/endpoints';

interface FeatureState {
  mobileEnabled: boolean | null; // null = bilinmiyor
  loading: boolean;
  error: string | null;
  fetchFeatures: () => Promise<void>;
}

// fetchFeatureFlags imported

export const useFeatureStore = create<FeatureState>((set) => ({
  mobileEnabled: null,
  loading: false,
  error: null,
  fetchFeatures: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetchFeatureFlags();
      set({ mobileEnabled: res.mobileEnabled, loading: false });
    } catch (e: any) {
      set({ error: e.message || 'Özellikler alınamadı', loading: false });
    }
  }
}));
