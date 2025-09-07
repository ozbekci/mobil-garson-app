interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface WaiterLoginCredentials {
  waiterId: string;
  pin: string;
}

interface Waiter {
  id: string;
  name: string;
  isActive: boolean;
}

interface Table {
  id: string;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
}

interface Order {
  id: string;
  tableId: string;
  waiterId: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'paid';
  total: number;
  createdAt: string;
}

interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;
  notes?: string;
}

class ApiService {
  private baseUrl: string = '';
  private authToken: string | null = null;

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    body?: any,
    requiresAuth: boolean = false,
    timeoutMs: number = 5000
  ): Promise<ApiResponse<T>> {
    try {
      // Eğer baseUrl yoksa erken döndür
      if (!this.baseUrl || this.baseUrl.trim() === '') {
        return {
          status: 0,
          error: 'API sunucu adresi tanımlanmamış'
        };
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (requiresAuth && this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const config: RequestInit = {
        method,
        headers,
      };

      if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      config.signal = controller.signal;

      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      clearTimeout(timeoutId);

      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      return {
        data,
        status: response.status,
        error: response.ok ? undefined : data?.message || 'İstek başarısız'
      };
    } catch (error) {
      // Sadece beklenmedik hataları logla, baseUrl yoksa sessizce iśle
      if (error instanceof Error && error.name !== 'AbortError' && this.baseUrl && this.baseUrl.trim() !== '') {
        console.error('API Request Error:', {
          endpoint,
          method,
          baseUrl: this.baseUrl,
          error: error.message
        });
      }
      
      let errorMessage = 'Ağ hatası';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'İstek zaman aşımına uğradı';
        } else if (error.message === 'Network request failed') {
          errorMessage = 'Sunucuya bağlanılamadı';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        status: 0,
        error: errorMessage
      };
    }
  }

  // ===== HEALTH & CONNECTION =====
  async checkHealth(): Promise<ApiResponse<{ok: boolean}>> {
    return this.makeRequest('/health', 'GET', undefined, false, 2000); // 2 saniye timeout
  }

  // ===== FEATURES =====
  async getMobileFeatureStatus(): Promise<ApiResponse<{mobileEnabled: boolean}>> {
    return this.makeRequest('/features/mobile');
  }

  async toggleMobileFeature(enabled: boolean): Promise<ApiResponse> {
    return this.makeRequest('/features/mobile', 'PUT', { enabled });
  }

  // ===== AUTHENTICATION =====
  async login(credentials: LoginCredentials): Promise<ApiResponse<{token: string, user: any}>> {
    return this.makeRequest('/auth/login', 'POST', credentials);
  }

  async verifyOwner(password: string): Promise<ApiResponse<{verified: boolean}>> {
    return this.makeRequest('/owner/verify', 'POST', { password });
  }

  async waiterLogin(credentials: WaiterLoginCredentials): Promise<ApiResponse<{token: string, waiter: Waiter}>> {
    return this.makeRequest('/waiter/login', 'POST', credentials);
  }

  // ===== WAITERS =====
  async getActiveWaiters(): Promise<ApiResponse<Waiter[]>> {
    return this.makeRequest('/waiters/active');
  }

  async getWaiterStatus(waiterId: string): Promise<ApiResponse<{status: string, waiter: Waiter}>> {
    return this.makeRequest(`/waiter/status?waiterId=${waiterId}`);
  }

  // ===== TABLES =====
  async getTables(): Promise<ApiResponse<Table[]>> {
    return this.makeRequest('/tables', 'GET', undefined, true);
  }

  // ===== MENU =====
  async getMenu(): Promise<ApiResponse<{categories: string[], items: MenuItem[]}>> {
    return this.makeRequest('/menu');
  }

  // ===== ORDERS =====
  async getOpenOrder(tableId: string): Promise<ApiResponse<Order | null>> {
    return this.makeRequest(`/orders/open?tableId=${tableId}`);
  }

  async createOrder(order: Partial<Order>): Promise<ApiResponse<Order>> {
    return this.makeRequest('/orders', 'POST', order);
  }

  async addOrderItems(orderId: string, items: Omit<OrderItem, 'id'>[]): Promise<ApiResponse<Order>> {
    return this.makeRequest(`/orders/${orderId}/items`, 'POST', { items });
  }

  async updateOrderStatus(orderId: string, status: Order['status'], version?: number): Promise<ApiResponse<Order>> {
    return this.makeRequest(`/orders/${orderId}/status`, 'PATCH', { status, version });
  }

  async getOrderDetail(orderId: string): Promise<ApiResponse<Order>> {
    return this.makeRequest(`/orders/${orderId}`);
  }

  async getActiveOrders(): Promise<ApiResponse<Order[]>> {
    return this.makeRequest('/orders/active');
  }
}

// Singleton instance
const apiService = new ApiService();

export default apiService;
export type { 
  ApiResponse, 
  LoginCredentials, 
  WaiterLoginCredentials, 
  Waiter, 
  Table, 
  MenuItem, 
  Order, 
  OrderItem 
};
