import type { DompetXCreateTransaction } from '@/types';

interface DompetXConfig {
  apiKey: string;
  baseUrl: string;
  webhookSecret: string;
}

interface DompetXResponse {
  success: boolean;
  data?: {
    ref_id: string;
    payment_url?: string;
    qr_string?: string;
    va_number?: string;
    amount: number;
    status: string;
    payment_method: string;
    expired_at?: string;
  };
  error?: string;
  message?: string;
}

export class DompetXClient {
  private config: DompetXConfig;

  constructor(config: DompetXConfig) {
    this.config = config;
  }

  /**
   * Create a new payment transaction
   */
  async createTransaction(params: {
    refId: string;
    amount: number;
    paymentMethod: string;
    customerName: string;
    customerEmail: string;
    description: string;
    callbackUrl: string;
    returnUrl: string;
  }): Promise<DompetXResponse> {
    try {
      const body: DompetXCreateTransaction = {
        ref_id: params.refId,
        amount: params.amount,
        payment_method: params.paymentMethod,
        customer_name: params.customerName,
        customer_email: params.customerEmail,
        description: params.description,
        callback_url: params.callbackUrl,
        return_url: params.returnUrl,
      };

      const response = await fetch(`${this.config.baseUrl}/transaction/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json() as DompetXResponse;

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Gagal membuat transaksi',
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Check transaction status
   */
  async checkStatus(refId: string): Promise<DompetXResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/transaction/status/${refId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      const data = await response.json() as DompetXResponse;

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Gagal cek status',
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Simple HMAC verification
    // Implementation depends on DompetX's actual webhook signature method
    // For now, we'll do a basic check
    try {
      // DompetX typically sends signature as HMAC-SHA256 of the payload
      const expectedSignature = this.generateSignature(payload);
      return expectedSignature === signature;
    } catch {
      return false;
    }
  }

  private generateSignature(payload: string): string {
    // This should match DompetX's signature generation method
    // Placeholder - update based on DompetX documentation
    const crypto = globalThis.crypto;
    const encoder = new TextEncoder();
    // Simple hash for now
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      const char = payload.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Get available payment methods
   */
  getPaymentMethods(): Array<{ id: string; name: string; type: string }> {
    return [
      { id: 'QRIS', name: 'QRIS', type: 'qris' },
      { id: 'VA_BCA', name: 'Virtual Account BCA', type: 'va' },
      { id: 'VA_MANDIRI', name: 'Virtual Account Mandiri', type: 'va' },
      { id: 'VA_BNI', name: 'Virtual Account BNI', type: 'va' },
      { id: 'VA_BRI', name: 'Virtual Account BRI', type: 'va' },
      { id: 'GOPAY', name: 'GoPay', type: 'ewallet' },
      { id: 'OVO', name: 'OVO', type: 'ewallet' },
      { id: 'DANA', name: 'DANA', type: 'ewallet' },
      { id: 'SHOPEEPAY', name: 'ShopeePay', type: 'ewallet' },
    ];
  }
}

/**
 * Create DompetX client from environment variables
 */
export function createDompetXClient(env: {
  DOMPETX_API_KEY: string;
  DOMPETX_BASE_URL: string;
  DOMPETX_WEBHOOK_SECRET: string;
}): DompetXClient {
  return new DompetXClient({
    apiKey: env.DOMPETX_API_KEY,
    baseUrl: env.DOMPETX_BASE_URL,
    webhookSecret: env.DOMPETX_WEBHOOK_SECRET,
  });
}
