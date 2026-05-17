import type { APIRoute } from 'astro';
import { getDB } from '../../db';
import { coupons } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

export const GET: APIRoute = async ({ url, locals }) => {
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response(JSON.stringify({ valid: false, message: 'Kode kupon tidak ditemukan' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const env = locals?.runtime?.env || {};
    const db = getDB(env);

    const coupon = await db.select().from(coupons)
      .where(and(
        eq(coupons.code, code.toUpperCase()),
        eq(coupons.isActive, true)
      ))
      .limit(1);

    if (!coupon[0]) {
      return new Response(JSON.stringify({ 
        valid: false, 
        message: 'Kupon tidak ditemukan atau sudah tidak aktif' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const c = coupon[0];

    // Check validity
    if (c.validFrom && c.validFrom > now) {
      return new Response(JSON.stringify({ 
        valid: false, 
        message: 'Kupon belum berlaku' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (c.validUntil && c.validUntil < now) {
      return new Response(JSON.stringify({ 
        valid: false, 
        message: 'Kupon sudah kedaluwarsa' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (c.usedCount >= c.maxUses) {
      return new Response(JSON.stringify({ 
        valid: false, 
        message: 'Kupon sudah habis digunakan' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      valid: true,
      code: c.code,
      discountPercent: c.discountPercent,
      discountAmount: c.discountAmount,
      message: `Diskon ${c.discountPercent}% berhasil diterapkan!`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Coupon error:', error);
    return new Response(JSON.stringify({ 
      valid: false, 
      message: 'Gagal memeriksa kupon' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
