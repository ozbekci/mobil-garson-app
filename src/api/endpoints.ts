// src/api/endpoints.ts
import { api } from './restClient';
import { LoginResponse, Table, MenuItem, ApiOrder, Order, mapApiOrder, WaiterSummary, WaiterLoginResponse } from '../types';

// Auth
export const login = (username: string, password: string): Promise<LoginResponse> =>
  api('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });

// Tables
export const getTables = (): Promise<Table[]> => api('/tables');

// Menu
export const getMenu = (): Promise<{ categories: string[]; items: MenuItem[] }> => api('/menu');

// Orders
export const getOpenOrder = async (tableId: number): Promise<Order | null> => {
  const raw = await api<ApiOrder | null>(`/orders/open?tableId=${tableId}`);
  return raw ? mapApiOrder(raw) : null;
};

export const createOrder = async (data: { tableId?: number; orderType: string; items: { menuItemId: number; quantity: number; notes?: string }[] }): Promise<Order> => {
  const raw = await api<ApiOrder>('/orders', { method: 'POST', body: JSON.stringify(data) });
  return mapApiOrder(raw);
};

export const addOrderItems = async (orderId: number, items: { menuItemId: number; quantity: number; notes?: string }[]): Promise<Order> => {
  const raw = await api<ApiOrder>(`/orders/${orderId}/items`, { method: 'POST', body: JSON.stringify({ items }) });
  return mapApiOrder(raw);
};

export const updateOrderStatus = async (orderId: number, status: string): Promise<Order> => {
  const raw = await api<ApiOrder>(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  return mapApiOrder(raw);
};

export const getOrder = async (orderId: number): Promise<Order> => {
  const raw = await api<ApiOrder>(`/orders/${orderId}`);
  return mapApiOrder(raw);
};

// List active / visible orders for waiter (assumed backend route)
export const listActiveOrders = async (): Promise<Order[]> => {
  const raw = await api<ApiOrder[]>(`/orders/active`);
  return raw.map(mapApiOrder);
};

// Payments removed (payment functionality disabled)

// --- Activation / Feature / Waiter endpoints (placeholders for real backend paths) ---
export const handshakeRequest = (): Promise<{ token: string; instanceId: string; valid: boolean }> =>
  api('/handshake', { method: 'POST' });

export const fetchFeatureFlags = (): Promise<{ mobileEnabled: boolean }> =>
  api('/features/mobile');

export const verifyOwner = (password: string): Promise<{ ok: boolean }> =>
  api('/owner/verify', { method: 'POST', body: JSON.stringify({ password }) });

export const getActiveWaiters = (): Promise<WaiterSummary[]> =>
  api('/waiters/active');

export const waiterLogin = (waiterId: number, pin: string): Promise<WaiterLoginResponse> =>
  api('/waiter/login', { method: 'POST', body: JSON.stringify({ waiterId, pin }) });

export const waiterStatus = (waiterId: number): Promise<{ active: boolean }> =>
  api(`/waiter/status?waiterId=${waiterId}`);
