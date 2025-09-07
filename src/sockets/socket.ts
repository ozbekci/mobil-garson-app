// src/sockets/socket.ts
import type { Socket } from 'socket.io-client';
import { getBaseUrl, getToken } from '../api/restClient';
import { useTablesStore } from '../state/tablesStore';
import { useOrdersStore } from '../state/ordersStore';

let socket: Socket | null = null;

export async function connectSocket(): Promise<void> {
  // avoid blocking app startup: dynamic import + full try/catch
  if ((socket as any)?.connected) return;

  let baseUrl: string | undefined;
  let token: string | null = null;
  try {
    baseUrl = await getBaseUrl();
    token = await getToken();
  } catch (err) {
    console.error('connectSocket: failed to read baseUrl/token', err);
    return; // don't throw — fail silently so app can continue
  }

  try {
    // dynamic import prevents module-load errors from blocking startup
    const mod = await import('socket.io-client');
    const io = mod.io ?? mod.default ?? mod;

    socket = io(baseUrl, {
      autoConnect: false,
      transports: ['websocket'],
      timeout: 5000,
      reconnectionAttempts: 3,
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      try {
        if (token) {
          socket?.emit('auth', token);
        }
      } catch (e) {
        console.error('Socket emit auth failed', e);
      }
    });

    socket.on('auth_ok', () => console.log('Auth OK'));
    socket.on('auth_error', () => console.log('Auth Error'));

    socket.on('table:update', (data: { id: number; status: string }) => {
      try {
        useTablesStore.getState().updateTableStatus(data.id, data.status as any);
      } catch (e) {
        console.error('table:update handler failed', e);
      }
    });

    socket.on('order:new', (data: { id: number; tableId: number; total: number; status: string }) => {
      console.log('New order:', data);
    });

    socket.on('order:update', (data: { id: number; status: string; total?: number; version: number }) => {
      try {
        const { currentOrder, reloadOrder } = useOrdersStore.getState();
        if (currentOrder?.id === data.id) reloadOrder();
      } catch (e) {
        console.error('order:update handler failed', e);
      }
    });

    socket.on('order:item:add', (data: { orderId: number; item: { menuItemId: number; quantity: number; price: number } }) => {
      try {
        const { currentOrder, reloadOrder } = useOrdersStore.getState();
        if (currentOrder?.id === data.orderId) reloadOrder();
      } catch (e) {
        console.error('order:item:add handler failed', e);
      }
    });

    socket.on('order:paid', (data: { orderId: number }) => {
      try {
        const { currentOrder } = useOrdersStore.getState();
        if (currentOrder?.id === data.orderId) {
          useOrdersStore.getState().fetchOpenOrder(currentOrder.tableId!);
        }
      } catch (e) {
        console.error('order:paid handler failed', e);
      }
    });

    socket.on('menu:item:update', (data: { id: number; available?: boolean; price?: number }) => {
      console.log('Menu update:', data);
    });

    socket.connect();
  } catch (err) {
    console.error('connectSocket failed', err);
    socket = null;
  }
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export { socket };
