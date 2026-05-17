import type { APIRoute } from 'astro';
import { getDB } from '../../../db';
import { orders, users, products, affiliates, emailLogs } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { generateId, formatIDR } from '../../../lib/utils';
import { createEmailClient } from '../../../lib/resend';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.text();
    const payload = JSON.parse(body);
    
    const { ref_id, status, amount, payment_method, paid_at } = payload;

    if (!ref_id || !status) {
      return new Response('Invalid payload', { status: 400 });
    }

    const env = locals?.runtime?.env || {};
    const db = getDB(env);

    // Find order
    const order = await db.select().from(orders).where(eq(orders.dompetxRefId, ref_id)).limit(1);
    
    if (!order[0]) {
      return new Response('Order not found', { status: 404 });
    }

    // Skip if already processed
    if (order[0].status === 'PAID') {
      return new Response('OK', { status: 200 });
    }

    if (status === 'SUCCESS' || status === 'PAID') {
      // Update order status
      await db.update(orders)
        .set({
          status: 'PAID',
          paidAt: new Date(paid_at || Date.now()),
          paymentMethod: payment_method || order[0].paymentMethod,
        })
        .where(eq(orders.id, order[0].id));

      // Get user and product
      const user = await db.select().from(users).where(eq(users.id, order[0].userId)).limit(1);
      const product = await db.select().from(products).where(eq(products.id, order[0].productId)).limit(1);

      const appUrl = env.APP_URL || 'https://asridigital.com';

      // Handle All-Access activation
      if (order[0].productId === 'ALL-ACCESS' && user[0]) {
        await db.update(users)
          .set({ isAllAccess: true })
          .where(eq(users.id, order[0].userId));
      }

      // Handle affiliate commission
      if (order[0].referredBy && user[0]) {
        const commissionPercent = 10; // Default from settings
        const commissionAmount = Math.round(order[0].amount * (commissionPercent / 100));
        
        await db.insert(affiliates).values({
          id: generateId(),
          orderId: order[0].id,
          referredByUserId: order[0].referredBy,
          referredUserId: order[0].userId,
          commissionAmount,
          commissionPercent,
          status: 'PENDING',
          availableAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days holding
        });

        // Send affiliate notification email
        try {
          const referrer = await db.select().from(users).where(eq(users.id, order[0].referredBy)).limit(1);
          if (referrer[0] && env.RESEND_API_KEY) {
            const emailClient = createEmailClient(env);
            await emailClient.sendAffiliateCommission({
              to: referrer[0].email,
              affiliateName: referrer[0].name || 'Affiliate',
              commissionAmount,
              productName: product[0]?.title || 'Produk',
              dashboardUrl: `${appUrl}/dashboard/affiliate`,
            });
          }
        } catch (e) {
          console.error('Affiliate email error:', e);
        }
      }

      // Send payment success email
      try {
        if (user[0] && env.RESEND_API_KEY) {
          const emailClient = createEmailClient(env);
          
          if (order[0].productId === 'ALL-ACCESS') {
            const result = await emailClient.sendAllAccessActivated({
              to: user[0].email,
              customerName: user[0].name || 'Pelanggan',
              dashboardUrl: `${appUrl}/dashboard`,
            });
            
            // Log email
            await db.insert(emailLogs).values({
              id: generateId(),
              userId: user[0].id,
              orderId: order[0].id,
              emailType: 'ALL_ACCESS_ACTIVATED',
              recipientEmail: user[0].email,
              subject: 'All-Access Pass Aktif',
              status: result.success ? 'SENT' : 'FAILED',
              resendId: result.id,
            });
          } else {
            const result = await emailClient.sendPaymentSuccess({
              to: user[0].email,
              customerName: user[0].name || 'Pelanggan',
              orderId: ref_id,
              productName: product[0]?.title || 'Produk',
              amount: order[0].amount,
              dashboardUrl: `${appUrl}/dashboard`,
              gptUrl: product[0]?.gptUrl || undefined,
            });
            
            // Log email
            await db.insert(emailLogs).values({
              id: generateId(),
              userId: user[0].id,
              orderId: order[0].id,
              emailType: 'PAYMENT_SUCCESS',
              recipientEmail: user[0].email,
              subject: `${product[0]?.title} Siap Digunakan!`,
              status: result.success ? 'SENT' : 'FAILED',
              resendId: result.id,
            });
          }
        }
      } catch (e) {
        console.error('Email error:', e);
      }
    } else if (status === 'FAILED' || status === 'EXPIRED') {
      await db.update(orders)
        .set({ status: 'FAILED' })
        .where(eq(orders.id, order[0].id));
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal error', { status: 500 });
  }
};
