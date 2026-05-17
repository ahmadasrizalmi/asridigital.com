// API Client for Asri Digital
const API_BASE = '/api';

interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  data?: T;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth
  async register(name: string, email: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    this.token = data.token;
    localStorage.setItem('auth_token', data.token);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.token = data.token;
    localStorage.setItem('auth_token', data.token);
    return data;
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Products
  async getProducts() {
    return this.request<{ products: any[] }>('/products');
  }

  async getFeaturedProducts() {
    return this.request<{ products: any[] }>('/products/featured');
  }

  async getProduct(slug: string) {
    return this.request<{ product: any }>(`/products/${slug}`);
  }

  // Checkout
  async checkout(data: {
    name: string;
    email: string;
    phone: string;
    productSlug: string;
    paymentMethod: string;
    couponCode?: string;
  }) {
    return this.request<{ success: boolean; orderId: string; paymentUrl: string }>('/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Coupons
  async validateCoupon(code: string, productSlug: string) {
    return this.request<{ valid: boolean; coupon?: any; message?: string }>('/coupon/validate', {
      method: 'POST',
      body: JSON.stringify({ code, productSlug }),
    });
  }

  // Orders
  async getOrders() {
    return this.request<{ orders: any[] }>('/orders');
  }

  async getOrder(orderId: string) {
    return this.request<{ order: any }>(`/orders/${orderId}`);
  }

  // Recent Sales (FOMO)
  async getRecentSales() {
    return this.request<{ sales: any[] }>('/recent-sales');
  }

  // Settings
  async getSettings() {
    return this.request<{ settings: Record<string, string> }>('/settings');
  }
}

export const api = new ApiClient();
