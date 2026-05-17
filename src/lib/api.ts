// Frontend API Client for Asri Digital

const API_BASE = '/api';

interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  message?: string;
  [key: string]: any;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        }
      });

      const data = await response.json() as ApiResponse<T>;

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
      }

      return data;
    } catch (error: any) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Auth methods
  async register(email: string, password: string, name: string) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });

    if (data.token) {
      this.token = data.token;
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (data.token) {
      this.token = data.token;
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getUser() {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Product methods
  async getProducts(params?: { category?: string; search?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request(`/products${query ? `?${query}` : ''}`);
  }

  async getFeaturedProducts() {
    return this.request('/products/featured');
  }

  async getProduct(slug: string) {
    return this.request(`/products/${slug}`);
  }

  // Checkout methods
  async createCheckout(data: {
    productSlug: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    couponCode?: string;
    paymentMethod: string;
  }) {
    return this.request('/checkout', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Coupon methods
  async validateCoupon(code: string, productSlug?: string) {
    return this.request('/coupon/validate', {
      method: 'POST',
      body: JSON.stringify({ code, productSlug })
    });
  }

  // Order methods
  async getOrders() {
    return this.request('/orders');
  }

  async getOrder(orderId: string) {
    return this.request(`/orders/${orderId}`);
  }

  // User products
  async getUserProducts() {
    return this.request('/user/products');
  }

  // Blog methods
  async getBlogPosts(params?: { category?: string; page?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.page) searchParams.set('page', params.page.toString());

    const query = searchParams.toString();
    return this.request(`/blog/posts${query ? `?${query}` : ''}`);
  }

  async getBlogPost(slug: string) {
    return this.request(`/blog/${slug}`);
  }

  // FOMO / Recent Sales
  async getRecentSales() {
    return this.request('/recent-sales');
  }

  // Settings
  async getSettings() {
    return this.request('/settings');
  }

  // Admin stats
  async getAdminStats() {
    return this.request('/admin/stats');
  }
}

// Export singleton instance
export const api = new ApiClient();
export default api;
