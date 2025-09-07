// Aligned with backend (waiter-focused simplified model + API raw types & mapper)

// Auth removed user profile (only token kept)
export interface LoginResponse { accessToken: string; }

// Raw backend types (snake_case fields) -----------------
export interface ApiOrderItem {
  id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
  notes?: string;
  created_at?: string;
  // name / description backend join ile gelebilir; UI enrich edebilir
  name?: string;
  description?: string;
}

export interface ApiOrder {
  id: number;
  table_id: number | null;
  table_number?: string | null;
  order_type: 'dine-in' | 'takeaway' | 'delivery' | 'trendyol';
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'paid';
  payment_status: 'unpaid' | 'paid' | 'debt';
  total: number;
  created_at: string;
  // paid / method fields (waiter app ignores for now)
  paid_at?: string | null;
  payment_method?: string | null;
  paid_amount?: number | null;
  items: ApiOrderItem[];
}

// Domain (frontend) simplified types -------------------
export interface OrderItem {
  id: number;
  menuItemId: number;
  quantity: number;
  price: number;
  notes?: string;
  createdAt?: string;
  name?: string; // optional enrichment
  description?: string;
}

export interface Order {
  id: number;
  tableId: number | null;
  tableNumber?: string | null;
  orderType: ApiOrder['order_type'];
  status: ApiOrder['status'];
  total: number;
  createdAt: string;
  items: OrderItem[];
}

// Mapper & helpers -------------------------------------
export function mapApiOrder(o: ApiOrder): Order {
  return {
    id: o.id,
    tableId: o.table_id,
    tableNumber: o.table_number ?? null,
    orderType: o.order_type,
    status: o.status,
    total: o.total,
    createdAt: o.created_at,
    items: (o.items || []).map(it => ({
      id: it.id,
      menuItemId: it.menu_item_id,
      quantity: it.quantity,
      price: it.price,
      notes: it.notes,
      createdAt: it.created_at,
      name: it.name,
      description: it.description,
    }))
  };
}

export function isVisibleToWaiter(order: Order): boolean {
  // Garson served veya paid olmuş siparişleri görmesin
  return order.status !== 'served' && order.status !== 'paid';
}

// Minimal extra shared types (keeping only what is necessary now)
export interface Table {
  id: number;
  number: string;
  seats?: number; // optional if not always needed
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  categoryId?: number;
  categoryName?: string;
  x?: number;
  y?: number;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  categoryId?: number;
  available: boolean;
  image?: string;
}

// Minimal waiter / owner related types
export interface WaiterSummary {
  id: number;
  name: string;
}

export interface WaiterLoginResponse {
  accessToken: string;
  waiter: WaiterSummary;
  lastCheckin?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T> { data: T; }
export interface ApiErrorResponse { error: ApiError; }
