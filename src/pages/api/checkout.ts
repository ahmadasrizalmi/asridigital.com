import type { APIRoute } from 'astro';
import { getDB } from '../../db';
import { orders, products, coupons, users } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { generateId, calculateDiscount } from '../../lib/utils';
import { createDompetXClient } from '../../lib/dompetx';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { productId, customerName, customerEmail, customerPhone, paymentMethod, couponCode, referredBy } = body;

    if (!productId || !customerName || !customerEmail || !paymentMethod) {
      return new Response(JSON.stringify({ success: false, error: 'Data tidak lengkap' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const env = locals?.runtime?.env || {};
    const db = getDB(env);

    // Get product
    const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product[0]) {
      return new Response(JSON.stringify({ success: false, error: 'Produk tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let finalAmount = product[0].price;
    let discountAmount = 0;

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await db.select().from(coupons)
        .where(and(
          eq(coupons.code, couponCode),
          eq(coupons.isActive, true)
        ))
        .limit(1);

      if (coupon[0]) {
        const now = new Date();
        const isValid = (!coupon[0].validFrom || coupon[0].validFrom <= now) &&
                       (!coupon[0].validUntil || coupon[0].validUntil >= now) &&
                       (coupon[0].usedCount < coupon[0].maxUses);

        if (isValid) {
          discountAmount = calculateDiscount(product[0].price, coupon[0].discountPercent);
          finalAmount = product[0].price - discountAmount;
        }
      }
    }

    // Create order
    const orderId = generateId();
    const refId = `ASRI-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Find or create user by email
    let userId: string;
    const existingUser = await db.select().from(users).where(eq(users.email, customerEmail)).limit(1);
    
    if (existingUser[0]) {
      userId = existingUser[0].id;
    } else {
      userId = generateId();
      await db.insert(users).values({
        id: userId,
        email: customerEmail,
        name: customerName,
      });
    }

    await db.insert(orders).values({
      id: orderId,
      userId,
      productId,
      dompetxRefId: refId,
      amount: finalAmount,
      originalAmount: product[0].price,
      discountAmount,
      couponCode: couponCode || null,
      status: 'PENDING',
      referredBy: referredBy || null,
      paymentMethod,
      customerEmail,
      customerName,
      customerPhone: customerPhone || null,
    });

    // Increment coupon usage
    if (couponCode && discountAmount > 0) {
      const coupon = await db.select().from(coupons).where(eq(coupons.code, couponCode)).limit(1);
      if (coupon[0]) {
        await db.update(coupons)
          .set({ usedCount: coupon[0].usedCount + 1 })
          .where(eq(coupons.id, coupon[0].id));
      }
    }

    // Create DompetX transaction
    const dompetx = createDompetXClient(env);
    const appUrl = env.APP_URL || 'https://asridigital.com';

    const txResult = await dompetx.createTransaction({
      refId,
      amount: finalAmount,
      paymentMethod,
      customerName,
      customerEmail,
      description: `Pembelian ${product[0].title} - Asri Digital`,
      callbackUrl: `${appUrl}/api/webhook/dompetx`,
      returnUrl: `${appUrl}/success?order=${orderId}`,
    });

    if (!txResult.success) {
      // Update order status to failed
      await db.update(orders)
        .set({ status: 'FAILED' })
        .where(eq(orders.id, orderId));

      return new Response(JSON.stringify({ 
        success: false, 
        error: txResult.error || 'Gagal membuat transaksi pembayaran' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update order with payment details
    await db.update(orders)
      .set({ 
        paymentChannel: txResult.data?.payment_method || paymentMethod 
      })
      .where(eq(orders.id, orderId));

    return new Response(JSON.stringify({
      success: true,
      orderId,
      orderNumber: refId,
      paymentUrl: txResult.data?.payment_url,
      paymentData: {
        qrString: txResult.data?.qr_string,
        vaNumber: txResult.data?.va_number,
        amount: txResult.data?.amount || finalAmount,
        expiredAt: txResult.data?.expired_at,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Terjadi kesalahan server' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
