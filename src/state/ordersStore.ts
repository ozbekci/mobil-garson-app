// src/state/ordersStore.ts
import { create } from 'zustand';
import { Order, OrderItem } from '../types';
import { getOpenOrder, createOrder, addOrderItems, updateOrderStatus, getOrder } from '../api/endpoints';

interface OrdersState {
  currentOrder: Order | null;
  draftItems: Omit<OrderItem, 'id'>[];
  loading: boolean;
  error: string | null;
  fetchOpenOrder: (tableId: number) => Promise<void>;
  createNewOrder: (tableId: number, orderType: string) => Promise<void>;
  addItemToDraft: (item: Omit<OrderItem, 'id'>) => void;
  removeItemFromDraft: (index: number) => void;
  submitDraft: () => Promise<void>;
  updateStatus: (status: string) => Promise<void>;
  reloadOrder: () => Promise<void>;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  currentOrder: null,
  draftItems: [],
  loading: false,
  error: null,
  fetchOpenOrder: async (tableId: number) => {
    set({ loading: true, error: null });
    try {
      const order = await getOpenOrder(tableId);
      set({ currentOrder: order, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Sipariş yüklenemedi', loading: false });
    }
  },
  createNewOrder: async (tableId: number, orderType: string) => {
    const { draftItems } = get();
    if (draftItems.length === 0) return;
    set({ loading: true, error: null });
    try {
      const order = await createOrder({ tableId, orderType, items: draftItems });
      set({ currentOrder: order, draftItems: [], loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Sipariş oluşturulamadı', loading: false });
    }
  },
  addItemToDraft: (item: Omit<OrderItem, 'id'>) => {
    set(state => ({ draftItems: [...state.draftItems, item] }));
  },
  removeItemFromDraft: (index: number) => {
    set(state => ({ draftItems: state.draftItems.filter((_, i) => i !== index) }));
  },
  submitDraft: async () => {
    const { currentOrder, draftItems } = get();
    if (!currentOrder || draftItems.length === 0) return;
    set({ loading: true, error: null });
    try {
      const updatedOrder = await addOrderItems(currentOrder.id, draftItems);
      set({ currentOrder: updatedOrder, draftItems: [], loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Ürün eklenemedi', loading: false });
    }
  },
  updateStatus: async (status: string) => {
    const { currentOrder } = get();
    if (!currentOrder) return;
    set({ loading: true, error: null });
    try {
  const updatedOrder = await updateOrderStatus(currentOrder.id, status);
      set({ currentOrder: updatedOrder, loading: false });
    } catch (error: any) {
  set({ error: error.message || 'Durum güncellenemedi', loading: false });
    }
  },
  reloadOrder: async () => {
    const { currentOrder } = get();
    if (!currentOrder) return;
    set({ loading: true, error: null });
    try {
      const order = await getOrder(currentOrder.id);
      set({ currentOrder: order, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Sipariş yeniden yüklenemedi', loading: false });
    }
  },
}));
