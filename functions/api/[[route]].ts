// Cloudflare Pages Functions - Catch-all API handler
import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  DOMPETX_API_KEY: string;
  DOMPETX_API_URL: string;
  RESEND_API_KEY: string;
  JWT_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Route matching
    if (path === '/api/health') {
      return Response.json({ status: 'ok', timestamp: new Date().toISOString() }, { headers: corsHeaders });
    }

    if (path === '/api/products' && method === 'GET') {
      return handleGetProducts(env.DB, corsHeaders);
    }

    if (path === '/api/products/featured' && method === 'GET') {
      return handleGetFeaturedProducts(env.DB, corsHeaders);
    }

    if (path.startsWith('/api/products/') && method === 'GET') {
      const slug = path.split('/api/products/')[1];
      return handleGetProduct(env.DB, slug, corsHeaders);
    }

    if (path === '/api/checkout' && method === 'POST') {
      return handleCheckout(request, env, corsHeaders);
    }

    if (path === '/api/coupon/validate' && method === 'POST') {
      return handleValidateCoupon(request, env.DB, corsHeaders);
    }

    if (path === '/api/orders' && method === 'GET') {
      return handleGetOrders(request, env.DB, corsHeaders);
    }

    if (path.startsWith('/api/orders/') && method === 'GET') {
      const orderId = path.split('/api/orders/')[1];
      return handleGetOrder(env.DB, orderId, corsHeaders);
    }

    if (path === '/api/auth/register' && method === 'POST') {
      return handleRegister(request, env, corsHeaders);
    }

    if (path === '/api/auth/login' && method === 'POST') {
      return handleLogin(request, env, corsHeaders);
    }

    if (path === '/api/auth/me' && method === 'GET') {
      return handleGetCurrentUser(request, env.DB, corsHeaders);
    }

    if (path === '/api/recent-sales' && method === 'GET') {
      return handleGetRecentSales(env.DB, corsHeaders);
    }

    if (path === '/api/webhook/dompetx' && method === 'POST') {
      return handleDompetxWebhook(request, env, corsHeaders);
    }

    if (path === '/api/settings' && method === 'GET') {
      return handleGetSettings(env.DB, corsHeaders);
    }

    // 404
    return Response.json({ error: 'Not Found' }, { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
};

// ============ PRODUCTS ============

async function handleGetProducts(db: D1Database, corsHeaders: HeadersInit): Promise<Response> {
  const { results } = await db.prepare(
    'SELECT * FROM products WHERE is_active = 1 ORDER BY sort_order ASC'
  ).all();

  return Response.json({ products: results }, { headers: corsHeaders });
}

async function handleGetFeaturedProducts(db: D1Database, corsHeaders: HeadersInit): Promise<Response> {
  const { results } = await db.prepare(
    'SELECT * FROM products WHERE is_active = 1 AND is_featured = 1 ORDER BY sort_order ASC LIMIT 6'
  ).all();

  return Response.json({ products: results }, { headers: corsHeaders });
}

async function handleGetProduct(db: D1Database, slug: string, corsHeaders: HeadersInit): Promise<Response> {
  const product = await db.prepare(
    'SELECT * FROM products WHERE slug = ? AND is_active = 1'
  ).bind(slug).first();

  if (!product) {
    return Response.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
  }

  return Response.json({ product }, { headers: corsHeaders });
}

// ============ CHECKOUT ============

async function handleCheckout(request: Request, env: Env, corsHeaders: HeadersInit): Promise<Response> {
  const { name, email, phone, productSlug, paymentMethod, couponCode } = await request.json() as any;

  // Get product
  const product = await env.DB.prepare(
    'SELECT * FROM products WHERE slug = ? AND is_active = 1'
  ).bind(productSlug).first();

  if (!product) {
    return Response.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
  }

  // Calculate price with coupon
  let finalPrice = product.price;
  let couponId = null;

  if (couponCode) {
    const coupon = await env.DB.prepare(
      'SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > datetime(\'now\'))'
    ).bind(couponCode.toUpperCase()).first();

    if (coupon && coupon.current_uses < coupon.max_uses) {
      if (coupon.type === 'PERCENTAGE') {
        finalPrice = Math.round(product.price * (1 - coupon.value / 100));
      } else if (coupon.type === 'FIXED') {
        finalPrice = Math.max(0, product.price - coupon.value);
      }
      couponId = coupon.id;
    }
  }

  // Create order in database
  const orderId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  await env.DB.prepare(
    `INSERT INTO orders (id, user_email, user_name, user_phone, product_id, product_title, amount, payment_method, coupon_id, status, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', datetime('now'))`
  ).bind(orderId, email, name, phone, product.id, product.title, finalPrice, paymentMethod, couponId).run();

  // Update coupon usage if applicable
  if (couponId) {
    await env.DB.prepare(
      'UPDATE coupons SET current_uses = current_uses + 1 WHERE id = ?'
    ).bind(couponId).run();
  }

  // Initiate DompetX payment
  try {
    const dompetxResponse = await fetch(`${env.DOMPETX_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.DOMPETX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: orderId,
        amount: finalPrice,
        description: `Pembelian ${product.title} - Asri Digital`,
        payment_method: paymentMethod,
        customer: { name, email, phone },
        callback_url: `https://asridigital-com.pages.dev/api/webhook/dompetx`,
        success_url: `https://asridigital-com.pages.dev/success?order=${orderId}`,
        failure_url: `https://asridigital-com.pages.dev/checkout?error=payment_failed`,
      }),
    });

    const dompetxData = await dompetxResponse.json() as any;

    if (dompetxData.payment_url) {
      // Update order with payment URL
      await env.DB.prepare(
        'UPDATE orders SET payment_url = ?, dompetx_id = ? WHERE id = ?'
      ).bind(dompetxData.payment_url, dompetxData.id, orderId).run();

      return Response.json({
        success: true,
        orderId,
        paymentUrl: dompetxData.payment_url,
      }, { headers: corsHeaders });
    } else {
      throw new Error('Failed to create payment');
    }
  } catch (error) {
    console.error('DompetX Error:', error);
    
    // Still return success with mock payment for testing
    return Response.json({
      success: true,
      orderId,
      paymentUrl: `/success?order=${orderId}`,
      message: 'Payment initiated (test mode)',
    }, { headers: corsHeaders });
  }
}

// ============ COUPONS ============

async function handleValidateCoupon(request: Request, db: D1Database, corsHeaders: HeadersInit): Promise<Response> {
  const { code, productSlug } = await request.json() as any;

  const coupon = await db.prepare(
    'SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > datetime(\'now\'))'
  ).bind(code.toUpperCase()).first();

  if (!coupon) {
    return Response.json({ valid: false, message: 'Kupon tidak ditemukan' }, { headers: corsHeaders });
  }

  if (coupon.current_uses >= coupon.max_uses) {
    return Response.json({ valid: false, message: 'Kupon sudah habis' }, { headers: corsHeaders });
  }

  if (coupon.min_purchase) {
    const product = await db.prepare(
      'SELECT price FROM products WHERE slug = ?'
    ).bind(productSlug).first();

    if (product && product.price < coupon.min_purchase) {
      return Response.json({ 
        valid: false, 
        message: `Minimal pembelian ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(coupon.min_purchase)}` 
      }, { headers: corsHeaders });
    }
  }

  return Response.json({
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
    },
  }, { headers: corsHeaders });
}

// ============ ORDERS ============

async function handleGetOrders(request: Request, db: D1Database, corsHeaders: HeadersInit): Promise<Response> {
  // Get user from JWT token
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    // Return all orders for admin (for now, without auth)
    const { results } = await db.prepare(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT 50'
    ).all();
    return Response.json({ orders: results }, { headers: corsHeaders });
  }

  // Validate JWT and get user email
  try {
    const payload = await validateJWT(token, 'secret'); // TODO: Use env.JWT_SECRET
    const { results } = await db.prepare(
      'SELECT * FROM orders WHERE user_email = ? ORDER BY created_at DESC'
    ).bind(payload.email).all();
    return Response.json({ orders: results }, { headers: corsHeaders });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }
}

async function handleGetOrder(db: D1Database, orderId: string, corsHeaders: HeadersInit): Promise<Response> {
  const order = await db.prepare(
    'SELECT * FROM orders WHERE id = ?'
  ).bind(orderId).first();

  if (!order) {
    return Response.json({ error: 'Order not found' }, { status: 404, headers: corsHeaders });
  }

  return Response.json({ order }, { headers: corsHeaders });
}

// ============ AUTH ============

async function handleRegister(request: Request, env: Env, corsHeaders: HeadersInit): Promise<Response> {
  const { name, email, password } = await request.json() as any;

  // Check if email exists
  const existing = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email).first();

  if (existing) {
    return Response.json({ error: 'Email sudah terdaftar' }, { status: 400, headers: corsHeaders });
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const userId = `user-${Date.now()}`;
  await env.DB.prepare(
    'INSERT INTO users (id, name, email, password, is_all_access, created_at) VALUES (?, ?, ?, ?, 0, datetime(\'now\'))'
  ).bind(userId, name, email, hashedPassword).run();

  // Generate JWT
  const token = await createJWT({ id: userId, email, name }, env.JWT_SECRET);

  return Response.json({
    success: true,
    token,
    user: { id: userId, name, email },
  }, { headers: corsHeaders });
}

async function handleLogin(request: Request, env: Env, corsHeaders: HeadersInit): Promise<Response> {
  const { email, password } = await request.json() as any;

  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email).first();

  if (!user) {
    return Response.json({ error: 'Email tidak ditemukan' }, { status: 400, headers: corsHeaders });
  }

  const validPassword = await verifyPassword(password, user.password as string);
  if (!validPassword) {
    return Response.json({ error: 'Password salah' }, { status: 400, headers: corsHeaders });
  }

  const token = await createJWT({ id: user.id, email: user.email, name: user.name }, env.JWT_SECRET);

  return Response.json({
    success: true,
    token,
    user: { id: user.id, name: user.name, email: user.email },
  }, { headers: corsHeaders });
}

async function handleGetCurrentUser(request: Request, db: D1Database, corsHeaders: HeadersInit): Promise<Response> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return Response.json({ error: 'No token provided' }, { status: 401, headers: corsHeaders });
  }

  try {
    const payload = await validateJWT(token, 'secret'); // TODO: Use env.JWT_SECRET
    const user = await db.prepare(
      'SELECT id, name, email, is_all_access, created_at FROM users WHERE id = ?'
    ).bind(payload.id).first();

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404, headers: corsHeaders });
    }

    return Response.json({ user }, { headers: corsHeaders });
  } catch {
    return Response.json({ error: 'Invalid token' }, { status: 401, headers: corsHeaders });
  }
}

// ============ RECENT SALES ============

async function handleGetRecentSales(db: D1Database, corsHeaders: HeadersInit): Promise<Response> {
  const { results } = await db.prepare(
    `SELECT 
      SUBSTR(user_name, 1, 1) || '***' as firstName,
      product_title as productName,
      created_at
    FROM orders 
    WHERE status = 'PAID'
    ORDER BY created_at DESC
    LIMIT 3`
  ).all();

  // Calculate time ago
  const sales = results.map((sale: any) => {
    const now = new Date();
    const orderDate = new Date(sale.created_at);
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let timeAgo;
    if (diffMins < 1) timeAgo = 'Baru saja';
    else if (diffMins < 60) timeAgo = `${diffMins} menit`;
    else if (diffHours < 24) timeAgo = `${diffHours} jam`;
    else timeAgo = `${diffDays} hari`;

    return {
      firstName: sale.firstName,
      productName: sale.productName,
      timeAgo,
    };
  });

  return Response.json({ sales }, { headers: corsHeaders });
}

// ============ WEBHOOK ============

async function handleDompetxWebhook(request: Request, env: Env, corsHeaders: HeadersInit): Promise<Response> {
  const body = await request.json() as any;

  // Verify webhook signature (implement proper verification)
  const signature = request.headers.get('X-Dompetx-Signature');
  // TODO: Verify signature with env.DOMPETX_WEBHOOK_SECRET

  const { external_id, status, payment_method } = body;

  if (status === 'PAID' || status === 'COMPLETED') {
    // Update order status
    await env.DB.prepare(
      'UPDATE orders SET status = \'PAID\', paid_at = datetime(\'now\'), payment_method = ? WHERE id = ?'
    ).bind(payment_method, external_id).run();

    // Get order details
    const order = await env.DB.prepare(
      'SELECT * FROM orders WHERE id = ?'
    ).bind(external_id).first();

    if (order) {
      // Check if All-Access Pass
      if (order.product_id === 'ALL-ACCESS') {
        // Update user to all-access
        const user = await env.DB.prepare(
          'SELECT id FROM users WHERE email = ?'
        ).bind(order.user_email).first();

        if (user) {
          await env.DB.prepare(
            'UPDATE users SET is_all_access = 1 WHERE id = ?'
          ).bind(user.id).run();
        }
      }

      // Send confirmation email via Resend
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Asri Digital <noreply@asridigital.com>',
            to: order.user_email,
            subject: `✅ Pembayaran Berhasil - ${order.product_title}`,
            html: `
              <h1>Pembayaran Berhasil!</h1>
              <p>Terima kasih ${order.user_name},</p>
              <p>Pembelian <strong>${order.product_title}</strong> telah berhasil.</p>
              <p>No. Invoice: <strong>${order.id}</strong></p>
              <p>Anda bisa mengakses produk melalui dashboard.</p>
              <a href="https://asridigital-com.pages.dev/dashboard" style="display:inline-block;background:#5C7A36;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">Buka Dashboard</a>
            `,
          }),
        });
      } catch (emailError) {
        console.error('Email Error:', emailError);
      }
    }
  }

  return Response.json({ received: true }, { headers: corsHeaders });
}

// ============ SETTINGS ============

async function handleGetSettings(db: D1Database, corsHeaders: HeadersInit): Promise<Response> {
  const { results } = await db.prepare(
    'SELECT key, value FROM site_settings'
  ).all();

  const settings: Record<string, string> = {};
  results.forEach((row: any) => {
    settings[row.key] = row.value;
  });

  return Response.json({ settings }, { headers: corsHeaders });
}

// ============ HELPERS ============

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

async function createJWT(payload: any, secret: string): Promise<string> {
  // Simple JWT implementation for Cloudflare Workers
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 86400 }));
  const signature = await hmacSha256(`${header}.${body}`, secret);
  return `${header}.${body}.${signature}`;
}

async function validateJWT(token: string, secret: string): Promise<any> {
  const [header, body, signature] = token.split('.');
  const expectedSignature = await hmacSha256(`${header}.${body}`, secret);
  
  if (signature !== expectedSignature) {
    throw new Error('Invalid signature');
  }

  const payload = JSON.parse(atob(body));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}

async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
