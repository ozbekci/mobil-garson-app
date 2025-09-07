// src/state/tablesStore.ts
import { create } from 'zustand';
import { Table } from '../types';
import { getTables } from '../api/endpoints';

interface TablesState {
  tables: Table[];
  loading: boolean;
  error: string | null;
  fetchTables: () => Promise<void>;
  updateTableStatus: (id: number, status: Table['status']) => void;
}

export const useTablesStore = create<TablesState>((set, get) => ({
  tables: [],
  loading: false,
  error: null,
  fetchTables: async () => {
    set({ loading: true, error: null });
    try {
      const tables = await getTables();
      set({ tables, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Tablolar yüklenemedi', loading: false });
    }
  },
  updateTableStatus: (id: number, status: Table['status']) => {
    const tables = get().tables.map(table => table.id === id ? { ...table, status } : table);
    set({ tables });
  },
}));
