import { Resend } from 'resend';

interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export class EmailClient {
  private resend: Resend;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    this.resend = new Resend(config.apiKey);
  }

  /**
   * Send an email
   */
  async send(params: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, id: data?.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  /**
   * Send payment success email (single product)
   */
  async sendPaymentSuccess(params: {
    to: string;
    customerName: string;
    orderId: string;
    productName: string;
    amount: number;
    dashboardUrl: string;
    gptUrl?: string;
  }): Promise<{ success: boolean; id?: string }> {
    const formatIDR = (n: number) => new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(n);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
          <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; color: white;">🎉 Pembayaran Berhasil!</h1>
          </div>
          <div style="padding: 32px;">
            <p style="color: #94a3b8; margin: 0 0 16px;">Halo ${params.customerName},</p>
            <p style="color: #f8fafc; margin: 0 0 24px;">Terima kasih atas pembelian Anda. Berikut detail pesanan:</p>
            
            <div style="background-color: #0f172a; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #334155;">
              <p style="margin: 0 0 8px; color: #94a3b8; font-size: 14px;">Order ID</p>
              <p style="margin: 0 0 16px; color: #f8fafc; font-weight: bold;">${params.orderId}</p>
              <p style="margin: 0 0 8px; color: #94a3b8; font-size: 14px;">Produk</p>
              <p style="margin: 0 0 16px; color: #f8fafc; font-weight: bold;">${params.productName}</p>
              <p style="margin: 0 0 8px; color: #94a3b8; font-size: 14px;">Total</p>
              <p style="margin: 0; color: #10b981; font-weight: bold; font-size: 20px;">${formatIDR(params.amount)}</p>
            </div>

            ${params.gptUrl ? `
            <a href="${params.gptUrl}" style="display: block; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; text-decoration: none; padding: 14px 24px; border-radius: 8px; text-align: center; font-weight: bold; margin-bottom: 12px;">
              🔗 Buka Custom GPT
            </a>
            ` : ''}

            <a href="${params.dashboardUrl}" style="display: block; background-color: #334155; color: #f8fafc; text-decoration: none; padding: 14px 24px; border-radius: 8px; text-align: center; font-weight: bold;">
              📦 Buka Dashboard
            </a>
          </div>
          <div style="padding: 20px 32px; border-top: 1px solid #334155; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">© 2026 Asri Digital. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await this.send({
      to: params.to,
      subject: `🎉 ${params.productName} Siap Digunakan!`,
      html,
    });

    return result;
  }

  /**
   * Send all-access activated email
   */
  async sendAllAccessActivated(params: {
    to: string;
    customerName: string;
    dashboardUrl: string;
  }): Promise<{ success: boolean; id?: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
          <div style="background: linear-gradient(135deg, #F59E0B, #D97706); padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; color: white;">🏆 All-Access Pass Aktif!</h1>
          </div>
          <div style="padding: 32px;">
            <p style="color: #94a3b8; margin: 0 0 16px;">Halo ${params.customerName},</p>
            <p style="color: #f8fafc; margin: 0 0 24px;">Selamat! Anda sekarang adalah <strong style="color: #F59E0B;">All-Access Member</strong>. Anda memiliki akses ke semua Custom GPT yang ada saat ini dan yang akan datang.</p>
            
            <div style="background: linear-gradient(135deg, #F59E0B20, #D9770620); border: 1px solid #F59E0B40; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 12px; color: #F59E0B;">✨ Benefit Anda:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #f8fafc;">
                <li style="margin-bottom: 8px;">Akses semua Custom GPT</li>
                <li style="margin-bottom: 8px;">Update lifetime gratis</li>
                <li style="margin-bottom: 8px;">Prioritas support</li>
                <li>Akses produk baru otomatis</li>
              </ul>
            </div>

            <a href="${params.dashboardUrl}" style="display: block; background: linear-gradient(135deg, #F59E0B, #D97706); color: white; text-decoration: none; padding: 14px 24px; border-radius: 8px; text-align: center; font-weight: bold;">
              🚀 Buka Dashboard
            </a>
          </div>
          <div style="padding: 20px 32px; border-top: 1px solid #334155; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">© 2026 Asri Digital. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send({
      to: params.to,
      subject: `🏆 Selamat! All-Access Pass Anda Aktif`,
      html,
    });
  }

  /**
   * Send affiliate commission email
   */
  async sendAffiliateCommission(params: {
    to: string;
    affiliateName: string;
    commissionAmount: number;
    productName: string;
    dashboardUrl: string;
  }): Promise<{ success: boolean; id?: string }> {
    const formatIDR = (n: number) => new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(n);

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
          <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; color: white;">💰 Komisi Baru!</h1>
          </div>
          <div style="padding: 32px;">
            <p style="color: #94a3b8; margin: 0 0 16px;">Halo ${params.affiliateName},</p>
            <p style="color: #f8fafc; margin: 0 0 24px;">Anda mendapatkan komisi dari referral:</p>
            <div style="background-color: #0f172a; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #334155;">
              <p style="color: #94a3b8; margin: 0 0 8px; font-size: 14px;">Komisi</p>
              <p style="color: #10b981; font-size: 32px; font-weight: bold; margin: 0;">${formatIDR(params.commissionAmount)}</p>
              <p style="color: #64748b; margin: 8px 0 0; font-size: 14px;">dari ${params.productName}</p>
            </div>
            <a href="${params.dashboardUrl}" style="display: block; background: linear-gradient(135deg, #10B981, #059669); color: white; text-decoration: none; padding: 14px 24px; border-radius: 8px; text-align: center; font-weight: bold; margin-top: 24px;">
              📊 Lihat Dashboard Affiliate
            </a>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send({
      to: params.to,
      subject: `💰 Komisi Baru! ${formatIDR(params.commissionAmount)} dari ${params.productName}`,
      html,
    });
  }
}

/**
 * Create email client from environment
 */
export function createEmailClient(env: {
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
  RESEND_FROM_NAME: string;
}): EmailClient {
  return new EmailClient({
    apiKey: env.RESEND_API_KEY,
    fromEmail: env.RESEND_FROM_EMAIL,
    fromName: env.RESEND_FROM_NAME,
  });
}
