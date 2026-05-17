// Cloudflare Pages Functions - API Handler
// This handles all /api/* routes

interface Env {
  DB: D1Database;
  DOMPETX_API_KEY: string;
  DOMPETX_WEBHOOK_SECRET: string;
  DOMPETX_BASE_URL: string;
  RESEND_API_KEY: string;
  JWT_SECRET: string;
  APP_URL: string;
}

// Helper: Generate UUID
function generateId(): string {
  return crypto.randomUUID();
}

// Helper: Hash password using SHA-256
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper: Verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
}

// Helper: Create JWT token
async function createJWT(payload: any, secret: string, expiresIn: string = '24h'): Promise<string> {
  // Ensure secret is not empty
  const secretKey = secret || 'asri-digital-default-jwt-secret-key-2026';
  
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = expiresIn === '24h' ? now + 86400 : now + 3600;
  
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: exp
  };

  const encoder = new TextEncoder();
  const headerBase64 = btoa(JSON.stringify(header)).replace(/=/g, '');
  const payloadBase64 = btoa(JSON.stringify(tokenPayload)).replace(/=/g, '');
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${headerBase64}.${payloadBase64}`)
  );
  
  const signatureArray = new Uint8Array(signature);
  let signatureBase64 = '';
  for (let i = 0; i < signatureArray.length; i++) {
    signatureBase64 += String.fromCharCode(signatureArray[i]);
  }
  signatureBase64 = btoa(signatureBase64)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  
  return `${headerBase64}.${payloadBase64}.${signatureBase64}`;
}

// Helper: Verify JWT token
async function verifyJWT(token: string, secret: string): Promise<any> {
  try {
    const secretKey = secret || 'asri-digital-default-jwt-secret-key-2026';
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    // Decode signature from base64url
    const signatureStr = parts[2].replace(/-/g, '+').replace(/_/g, '/');
    const signatureBytes = atob(signatureStr);
    const signature = new Uint8Array(signatureBytes.length);
    for (let i = 0; i < signatureBytes.length; i++) {
      signature[i] = signatureBytes.charCodeAt(i);
    }
    
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(`${parts[0]}.${parts[1]}`)
    );
    
    if (!valid) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (e) {
    console.error('JWT verify error:', e);
    return null;
  }
}

// Helper: Get user from request
async function getUser(request: Request, env: Env): Promise<any> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload || !payload.userId) {
    return null;
  }
  
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(payload.userId)
    .first();
  
  return user;
}

// Helper: JSON response
function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// Helper: Calculate time ago
function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'baru saja';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam`;
  return `${Math.floor(seconds / 86400)} hari`;
}

// Main request handler
export async function onRequest(context: any): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  // Remove /api prefix for routing
  const route = path.replace('/api', '') || '/';

  try {
    // ==================== HEALTH CHECK ====================
    if (route === '/health' && method === 'GET') {
      return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // ==================== PRODUCTS ====================
    if (route === '/products' && method === 'GET') {
      const category = url.searchParams.get('category');
      const search = url.searchParams.get('search');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM products WHERE is_active = 1';
      let countQuery = 'SELECT COUNT(*) as total FROM products WHERE is_active = 1';
      const params: any[] = [];

      if (category && category !== 'all') {
        query += ' AND category = ?';
        countQuery += ' AND category = ?';
        params.push(category);
      }

      if (search) {
        query += ' AND (title LIKE ? OR description LIKE ?)';
        countQuery += ' AND (title LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ' ORDER BY sort_order ASC LIMIT ? OFFSET ?';

      const products = await env.DB.prepare(query)
        .bind(...params, limit, offset)
        .all();

      const countResult = await env.DB.prepare(countQuery)
        .bind(...params)
        .first();

      return jsonResponse({
        products: products.results,
        total: countResult?.total || 0,
        page,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      });
    }

    if (route === '/products/featured' && method === 'GET') {
      const products = await env.DB.prepare(
        'SELECT * FROM products WHERE is_active = 1 AND (is_featured = 1 OR id = ?) ORDER BY sort_order ASC'
      )
        .bind('ALL-ACCESS')
        .all();

      return jsonResponse({ products: products.results });
    }

    if (route.startsWith('/products/') && method === 'GET') {
      const slug = route.split('/')[2];
      const product = await env.DB.prepare(
        'SELECT * FROM products WHERE slug = ? AND is_active = 1'
      )
        .bind(slug)
        .first();

      if (!product) {
        return jsonResponse({ error: 'Product not found' }, 404);
      }

      return jsonResponse({ product });
    }

    // ==================== AUTH ====================
    if (route === '/auth/register' && method === 'POST') {
      const { email, password, name } = await request.json();

      if (!email || !password || !name) {
        return jsonResponse({ error: 'Email, password, dan name wajib diisi' }, 400);
      }

      // Check if email exists
      const existingUser = await env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      )
        .bind(email)
        .first();

      if (existingUser) {
        return jsonResponse({ error: 'Email sudah terdaftar' }, 400);
      }

      // Hash password
      const passwordHash = await hashPassword(password);
      const userId = generateId();

      // Insert user
      await env.DB.prepare(
        'INSERT INTO users (id, email, name, password, is_all_access, created_at, updated_at) VALUES (?, ?, ?, ?, 0, datetime("now"), datetime("now"))'
      )
        .bind(userId, email, name, passwordHash)
        .run();

      // Create JWT token
      const token = await createJWT({ userId, email, name }, env.JWT_SECRET);

      return jsonResponse({
        success: true,
        token,
        user: { id: userId, email, name, is_all_access: false }
      });
    }

    if (route === '/auth/login' && method === 'POST') {
      const { email, password } = await request.json();

      if (!email || !password) {
        return jsonResponse({ error: 'Email dan password wajib diisi' }, 400);
      }

      // Find user
      const user = await env.DB.prepare(
        'SELECT * FROM users WHERE email = ?'
      )
        .bind(email)
        .first();

      if (!user) {
        return jsonResponse({ error: 'Email atau password salah' }, 401);
      }

      // Verify password
      const valid = await verifyPassword(password, user.password as string);
      if (!valid) {
        return jsonResponse({ error: 'Email atau password salah' }, 401);
      }

      // Create JWT token
      const token = await createJWT(
        { userId: user.id, email: user.email, name: user.name },
        env.JWT_SECRET
      );

      return jsonResponse({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          is_all_access: user.is_all_access
        }
      });
    }

    if (route === '/auth/me' && method === 'GET') {
      const user = await getUser(request, env);
      if (!user) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }

      return jsonResponse({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          is_all_access: user.is_all_access
        }
      });
    }

    // ==================== AUTH: FORGOT PASSWORD ====================
    if (route === '/auth/forgot-password' && method === 'POST') {
      const { email } = await request.json();

      if (!email) {
        return jsonResponse({ error: 'Email wajib diisi' }, 400);
      }

      // Check if user exists
      const user = await env.DB.prepare(
        'SELECT id, email, name FROM users WHERE email = ?'
      )
        .bind(email)
        .first();

      // Always return success to prevent email enumeration
      if (!user) {
        return jsonResponse({ success: true, message: 'Jika email terdaftar, Anda akan menerima link reset password.' });
      }

      // Generate reset token
      const resetToken = generateId();
      const resetExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

      // Store reset token
      await env.DB.prepare(
        'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?'
      )
        .bind(resetToken, resetExpiry, user.id)
        .run();

      // Send reset email
      try {
        if (env.RESEND_API_KEY && !env.RESEND_API_KEY.startsWith('re_your_')) {
          const resetUrl = `${env.APP_URL}/reset-password?token=${resetToken}`;
          
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.RESEND_API_KEY}`
            },
            body: JSON.stringify({
              from: 'Asri Digital <noreply@asridigital.com>',
              to: email,
              subject: '🔐 Reset Password - Asri Digital',
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: #5C7A36; padding: 24px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Reset Password</h1>
                  </div>
                  <div style="padding: 24px;">
                    <p>Halo <strong>${user.name}</strong>,</p>
                    <p>Kami menerima permintaan untuk reset password akun Anda.</p>
                    <p>Klik tombol di bawah untuk reset password:</p>
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${resetUrl}" style="background: #5C7A36; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                        Reset Password
                      </a>
                    </div>
                    <p style="color: #737373; font-size: 14px;">Link ini akan kedaluwarsa dalam 1 jam.</p>
                    <p style="color: #737373; font-size: 14px;">Jika Anda tidak meminta reset password, abaikan email ini.</p>
                  </div>
                </div>
              `
            })
          });
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      return jsonResponse({ success: true, message: 'Jika email terdaftar, Anda akan menerima link reset password.' });
    }

    // ==================== AUTH: RESET PASSWORD ====================
    if (route === '/auth/reset-password' && method === 'POST') {
      const { token, password } = await request.json();

      if (!token || !password) {
        return jsonResponse({ error: 'Token dan password wajib diisi' }, 400);
      }

      if (password.length < 6) {
        return jsonResponse({ error: 'Password minimal 6 karakter' }, 400);
      }

      // Find user with valid reset token
      const user = await env.DB.prepare(
        'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > datetime("now")'
      )
        .bind(token)
        .first();

      if (!user) {
        return jsonResponse({ error: 'Token tidak valid atau sudah kedaluwarsa' }, 400);
      }

      // Update password
      const passwordHash = await hashPassword(password);
      await env.DB.prepare(
        'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = datetime("now") WHERE id = ?'
      )
        .bind(passwordHash, user.id)
        .run();

      return jsonResponse({ success: true, message: 'Password berhasil direset. Silakan login dengan password baru.' });
    }

    // ==================== AUTH: UPDATE PROFILE ====================
    if (route === '/auth/profile' && method === 'PATCH') {
      const currentUser = await getUser(request, env);
      if (!currentUser) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }

      const { name, phone } = await request.json();

      await env.DB.prepare(
        'UPDATE users SET name = ?, phone = ?, updated_at = datetime("now") WHERE id = ?'
      )
        .bind(name || currentUser.name, phone || currentUser.phone, currentUser.id)
        .run();

      return jsonResponse({ success: true, message: 'Profil berhasil diupdate.' });
    }

    // ==================== AUTH: CHANGE PASSWORD ====================
    if (route === '/auth/change-password' && method === 'POST') {
      const currentUser = await getUser(request, env);
      if (!currentUser) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }

      const { current_password, new_password } = await request.json();

      if (!current_password || !new_password) {
        return jsonResponse({ error: 'Password lama dan baru wajib diisi' }, 400);
      }

      if (new_password.length < 6) {
        return jsonResponse({ error: 'Password baru minimal 6 karakter' }, 400);
      }

      // Verify current password
      const valid = await verifyPassword(current_password, currentUser.password as string);
      if (!valid) {
        return jsonResponse({ error: 'Password lama salah' }, 401);
      }

      // Update password
      const passwordHash = await hashPassword(new_password);
      await env.DB.prepare(
        'UPDATE users SET password = ?, updated_at = datetime("now") WHERE id = ?'
      )
        .bind(passwordHash, currentUser.id)
        .run();

      return jsonResponse({ success: true, message: 'Password berhasil diubah.' });
    }

    // ==================== CHECKOUT ====================
    if (route === '/checkout' && method === 'POST') {
      const body = await request.json();
      const { productSlug, customerEmail, customerName, customerPhone, couponCode, paymentMethod } = body;

      if (!productSlug || !customerEmail || !customerName || !paymentMethod) {
        return jsonResponse({ error: 'Data tidak lengkap' }, 400);
      }

      // Get product
      const product = await env.DB.prepare(
        'SELECT * FROM products WHERE slug = ? AND is_active = 1'
      )
        .bind(productSlug)
        .first();

      if (!product) {
        return jsonResponse({ error: 'Produk tidak ditemukan' }, 404);
      }

      let discountAmount = 0;
      let couponId = null;

      // Validate coupon if provided
      if (couponCode) {
        const coupon = await env.DB.prepare(
          'SELECT * FROM coupons WHERE code = ? AND is_active = 1'
        )
          .bind(couponCode.toUpperCase())
          .first();

        if (coupon) {
          const now = new Date().toISOString();
          const isValid = (!coupon.expires_at || coupon.expires_at > now) &&
                         (coupon.current_uses < coupon.max_uses) &&
                         (!coupon.min_purchase || product.price >= coupon.min_purchase);

          if (isValid) {
            couponId = coupon.id;
            if (coupon.type === 'PERCENTAGE') {
              discountAmount = Math.round(product.price * (coupon.value / 100));
            } else if (coupon.type === 'FIXED') {
              discountAmount = coupon.value;
            }
          }
        }
      }

      const finalAmount = product.price - discountAmount;
      const orderId = generateId();
      const orderCode = `INV-${Date.now().toString(36).toUpperCase()}`;

      // Create order
      await env.DB.prepare(
        `INSERT INTO orders (id, user_id, user_email, user_name, user_phone, product_id, product_title, amount, payment_method, coupon_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', datetime('now'), datetime('now'))`
      )
        .bind(
          orderId,
          null, // user_id null for guest checkout
          customerEmail,
          customerName,
          customerPhone || null,
          product.id,
          product.title,
          finalAmount,
          paymentMethod,
          couponId
        )
        .run();

      // Update coupon usage
      if (couponId) {
        await env.DB.prepare(
          'UPDATE coupons SET current_uses = current_uses + 1 WHERE id = ?'
        )
          .bind(couponId)
          .run();
      }

      // Create DompetX payment
      let paymentUrl = null;
      let paymentData = null;

      try {
        const dompetxResponse = await fetch(`${env.DOMPETX_BASE_URL || 'https://api.dompetx.com/v1'}/create-invoice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.DOMPETX_API_KEY}`
          },
          body: JSON.stringify({
            ref_id: orderId,
            amount: finalAmount,
            currency: 'IDR',
            description: `Pembelian ${product.title}`,
            customer_email: customerEmail,
            customer_name: customerName,
            customer_phone: customerPhone,
            payment_method: paymentMethod,
            callback_url: `${env.APP_URL}/api/webhook/dompetx`,
            return_url: `${env.APP_URL}/success?order=${orderId}`,
            expiry_minutes: 60
          })
        });

        const dompetxData = await dompetxResponse.json() as any;

        if (dompetxData.success || dompetxData.invoice_url) {
          paymentUrl = dompetxData.invoice_url || dompetxData.payment_url;
          paymentData = dompetxData;

          // Update order with DompetX reference
          await env.DB.prepare(
            'UPDATE orders SET payment_url = ?, dompetx_id = ? WHERE id = ?'
          )
            .bind(paymentUrl, dompetxData.invoice_id || dompetxData.id, orderId)
            .run();
        }
      } catch (error) {
        console.error('DompetX error:', error);
        // Continue even if DompetX fails - we can process manually
      }

      // If no DompetX URL, generate mock payment for testing
      if (!paymentUrl) {
        paymentUrl = `${env.APP_URL}/success?order=${orderId}`;
      }

      return jsonResponse({
        success: true,
        orderId,
        orderCode,
        paymentUrl,
        paymentData,
        amount: finalAmount,
        discount: discountAmount
      });
    }

    // ==================== COUPON ====================
    if (route === '/coupon/validate' && method === 'POST') {
      const { code, productSlug } = await request.json();

      if (!code) {
        return jsonResponse({ valid: false, message: 'Kode kupon wajib diisi' });
      }

      const coupon = await env.DB.prepare(
        'SELECT * FROM coupons WHERE code = ? AND is_active = 1'
      )
        .bind(code.toUpperCase())
        .first();

      if (!coupon) {
        return jsonResponse({ valid: false, message: 'Kupon tidak ditemukan' });
      }

      const now = new Date().toISOString();
      
      if (coupon.expires_at && coupon.expires_at < now) {
        return jsonResponse({ valid: false, message: 'Kupon sudah kedaluwarsa' });
      }

      if (coupon.current_uses >= coupon.max_uses) {
        return jsonResponse({ valid: false, message: 'Kupon sudah habis' });
      }

      let productPrice = 0;
      if (productSlug) {
        const product = await env.DB.prepare(
          'SELECT price FROM products WHERE slug = ?'
        )
          .bind(productSlug)
          .first();
        if (product) {
          productPrice = product.price as number;
        }
      }

      if (coupon.min_purchase && productPrice < coupon.min_purchase) {
        return jsonResponse({
          valid: false,
          message: `Minimal pembelian Rp ${coupon.min_purchase.toLocaleString()}`
        });
      }

      return jsonResponse({
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          description: coupon.description
        }
      });
    }

    // ==================== ORDERS ====================
    if (route === '/orders' && method === 'GET') {
      const user = await getUser(request, env);
      
      let orders;
      if (user) {
        orders = await env.DB.prepare(
          'SELECT * FROM orders WHERE user_email = ? ORDER BY created_at DESC LIMIT 50'
        )
          .bind(user.email)
          .all();
      } else {
        // For admin or testing - return recent orders
        orders = await env.DB.prepare(
          'SELECT * FROM orders ORDER BY created_at DESC LIMIT 50'
        )
          .all();
      }

      return jsonResponse({ orders: orders.results });
    }

    if (route.startsWith('/orders/') && method === 'GET') {
      const orderId = route.split('/')[2];
      
      const order = await env.DB.prepare(
        'SELECT o.*, p.title as product_title, p.image_icon as product_image FROM orders o LEFT JOIN products p ON o.product_id = p.id WHERE o.id = ?'
      )
        .bind(orderId)
        .first();

      if (!order) {
        return jsonResponse({ error: 'Pesanan tidak ditemukan' }, 404);
      }

      return jsonResponse({ order });
    }

    // ==================== RECENT SALES (FOMO) ====================
    if (route === '/recent-sales' && method === 'GET') {
      const sales = await env.DB.prepare(
        `SELECT 
           SUBSTR(user_name, 1, 1) || '***' as firstName,
           product_title as productName,
           created_at
         FROM orders 
         WHERE status = 'PAID' 
         ORDER BY created_at DESC 
         LIMIT 3`
      )
        .all();

      const formattedSales = sales.results.map((sale: any) => ({
        firstName: sale.firstName,
        productName: sale.productName,
        timeAgo: timeAgo(sale.created_at)
      }));

      return jsonResponse({ sales: formattedSales });
    }

    // ==================== WEBHOOK DOMPETX ====================
    if (route === '/webhook/dompetx' && method === 'POST') {
      const body = await request.json() as any;
      
      // Verify webhook signature if secret is set
      if (env.DOMPETX_WEBHOOK_SECRET && env.DOMPETX_WEBHOOK_SECRET !== 'placeholder-set-after-dompetx-config') {
        const signature = request.headers.get('X-DompetX-Signature');
        // TODO: Implement proper signature verification
      }

      const { ref_id, status, amount, payment_method, paid_at } = body;

      if (!ref_id) {
        return jsonResponse({ error: 'Missing ref_id' }, 400);
      }

      // Find order
      const order = await env.DB.prepare(
        'SELECT * FROM orders WHERE id = ?'
      )
        .bind(ref_id)
        .first();

      if (!order) {
        return jsonResponse({ error: 'Order not found' }, 404);
      }

      // Update order status
      if (status === 'SUCCESS' || status === 'PAID') {
        await env.DB.prepare(
          `UPDATE orders 
           SET status = 'PAID', 
               paid_at = datetime('now'),
               payment_method = ?,
               updated_at = datetime('now')
           WHERE id = ?`
        )
          .bind(payment_method || order.payment_method, ref_id)
          .run();

        // Check if All-Access Pass
        if (order.product_id === 'ALL-ACCESS') {
          // Find or create user by email
          let user = await env.DB.prepare(
            'SELECT id FROM users WHERE email = ?'
          )
            .bind(order.user_email)
            .first();

          if (user) {
            await env.DB.prepare(
              'UPDATE users SET is_all_access = 1 WHERE id = ?'
            )
              .bind(user.id)
              .run();
          }
        }

        // Send confirmation email
        try {
          await sendOrderConfirmationEmail(env, order);
        } catch (emailError) {
          console.error('Email error:', emailError);
        }

      } else if (status === 'FAILED') {
        await env.DB.prepare(
          `UPDATE orders 
           SET status = 'FAILED', 
               updated_at = datetime('now')
           WHERE id = ?`
        )
          .bind(ref_id)
          .run();
      }

      return jsonResponse({ success: true });
    }

    // ==================== USER PRODUCTS ====================
    if (route === '/user/products' && method === 'GET') {
      const user = await getUser(request, env);
      if (!user) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }

      let products;

      if (user.is_all_access) {
        // All-access user gets all active products
        products = await env.DB.prepare(
          'SELECT * FROM products WHERE is_active = 1 AND id != ? ORDER BY sort_order ASC'
        )
          .bind('ALL-ACCESS')
          .all();
      } else {
        // Regular user gets only purchased products
        products = await env.DB.prepare(
          `SELECT DISTINCT p.* 
           FROM products p
           INNER JOIN orders o ON p.id = o.product_id
           WHERE o.user_email = ? AND o.status = 'PAID'
           ORDER BY p.sort_order ASC`
        )
          .bind(user.email)
          .all();
      }

      return jsonResponse({ products: products.results });
    }

    // ==================== SETTINGS ====================
    if (route === '/settings' && method === 'GET') {
      const settings = await env.DB.prepare(
        'SELECT * FROM site_settings WHERE key IN (?, ?, ?, ?, ?)'
      )
        .bind('site_name', 'site_description', 'whatsapp_number', 'commission_percent', 'fomo_enabled')
        .all();

      const settingsObj: any = {};
      settings.results.forEach((s: any) => {
        settingsObj[s.key] = s.value;
      });

      return jsonResponse({ settings: settingsObj });
    }

    // ==================== BLOG POSTS ====================
    if (route === '/blog/posts' && method === 'GET') {
      const category = url.searchParams.get('category');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const offset = (page - 1) * limit;

      let query = 'SELECT id, title, slug, excerpt, image_url, category, tags, published_at, author_name FROM blog_posts WHERE is_published = 1';
      const params: any[] = [];

      if (category && category !== 'all') {
        query += ' AND category = ?';
        params.push(category);
      }

      query += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';

      const posts = await env.DB.prepare(query)
        .bind(...params, limit, offset)
        .all();

      return jsonResponse({ posts: posts.results });
    }

    if (route.startsWith('/blog/') && method === 'GET') {
      const slug = route.split('/')[2];
      
      const post = await env.DB.prepare(
        'SELECT * FROM blog_posts WHERE slug = ? AND is_published = 1'
      )
        .bind(slug)
        .first();

      if (!post) {
        return jsonResponse({ error: 'Artikel tidak ditemukan' }, 404);
      }

      // Get related posts
      const relatedPosts = await env.DB.prepare(
        'SELECT id, title, slug, excerpt, image_url, category, published_at FROM blog_posts WHERE is_published = 1 AND id != ? ORDER BY published_at DESC LIMIT 3'
      )
        .bind(post.id)
        .all();

      return jsonResponse({ post, relatedPosts: relatedPosts.results });
    }

    // ==================== ADMIN STATS ====================
    if (route === '/admin/stats' && method === 'GET') {
      const totalOrders = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM orders'
      ).first();

      const paidOrders = await env.DB.prepare(
        "SELECT COUNT(*) as count, SUM(amount) as revenue FROM orders WHERE status = 'PAID'"
      ).first();

      const pendingOrders = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM orders WHERE status = 'PENDING'"
      ).first();

      const totalUsers = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM users'
      ).first();

      const recentOrders = await env.DB.prepare(
        `SELECT o.*, p.title as product_title 
         FROM orders o 
         LEFT JOIN products p ON o.product_id = p.id 
         ORDER BY o.created_at DESC 
         LIMIT 10`
      ).all();

      return jsonResponse({
        stats: {
          totalOrders: totalOrders?.count || 0,
          paidOrders: paidOrders?.count || 0,
          revenue: paidOrders?.revenue || 0,
          pendingOrders: pendingOrders?.count || 0,
          totalUsers: totalUsers?.count || 0
        },
        recentOrders: recentOrders.results
      });
    }

    // ==================== ADMIN: COUPONS LIST ====================
    if (route === '/admin/coupons' && method === 'GET') {
      const coupons = await env.DB.prepare(
        'SELECT * FROM coupons ORDER BY created_at DESC'
      ).all();

      return jsonResponse({ coupons: coupons.results });
    }

    // ==================== ADMIN: CREATE COUPON ====================
    if (route === '/admin/coupons' && method === 'POST') {
      const body = await request.json();
      const { code, type, value, description, max_uses, min_purchase, expires_at, is_active } = body;

      if (!code || !type || !value) {
        return jsonResponse({ error: 'Code, type, dan value wajib diisi' }, 400);
      }

      const couponId = generateId();
      
      await env.DB.prepare(
        `INSERT INTO coupons (id, code, type, value, description, max_uses, current_uses, min_purchase, expires_at, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, datetime('now'), datetime('now'))`
      )
        .bind(
          couponId,
          code.toUpperCase(),
          type,
          value,
          description || null,
          max_uses || 100,
          min_purchase || null,
          expires_at || null,
          is_active !== false ? 1 : 0
        )
        .run();

      return jsonResponse({ success: true, coupon: { id: couponId, code: code.toUpperCase() } });
    }

    // ==================== ADMIN: UPDATE COUPON ====================
    if (route.startsWith('/admin/coupons/') && method === 'PUT') {
      const couponId = route.split('/')[3];
      const body = await request.json();
      const { code, type, value, description, max_uses, min_purchase, expires_at, is_active } = body;

      await env.DB.prepare(
        `UPDATE coupons 
         SET code = ?, type = ?, value = ?, description = ?, max_uses = ?, 
             min_purchase = ?, expires_at = ?, is_active = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
        .bind(
          code?.toUpperCase(),
          type,
          value,
          description,
          max_uses,
          min_purchase,
          expires_at,
          is_active !== false ? 1 : 0,
          couponId
        )
        .run();

      return jsonResponse({ success: true });
    }

    // ==================== ADMIN: DELETE COUPON ====================
    if (route.startsWith('/admin/coupons/') && method === 'DELETE') {
      const couponId = route.split('/')[3];

      await env.DB.prepare(
        'DELETE FROM coupons WHERE id = ?'
      )
        .bind(couponId)
        .run();

      return jsonResponse({ success: true });
    }

    // ==================== ADMIN: PRODUCTS LIST ====================
    if (route === '/admin/products' && method === 'GET') {
      const products = await env.DB.prepare(
        'SELECT * FROM products ORDER BY sort_order ASC'
      ).all();

      return jsonResponse({ products: products.results });
    }

    // ==================== ADMIN: CREATE PRODUCT ====================
    if (route === '/admin/products' && method === 'POST') {
      const body = await request.json();
      const { id, title, slug, description, short_description, price, compare_at_price, category, gpt_url, tags, is_active, is_featured } = body;

      if (!title || !slug || !price) {
        return jsonResponse({ error: 'Title, slug, dan price wajib diisi' }, 400);
      }

      const productId = id || generateId();
      
      await env.DB.prepare(
        `INSERT INTO products (id, title, slug, description, short_description, price, compare_at_price, category, gpt_url, image_icon, tags, is_active, is_featured, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
        .bind(
          productId,
          title,
          slug,
          description || null,
          short_description || null,
          price,
          compare_at_price || null,
          category || 'general',
          gpt_url || null,
          `/images/${slug}.jpg`,
          typeof tags === 'string' ? tags : JSON.stringify(tags || []),
          is_active !== false ? 1 : 0,
          is_featured ? 1 : 0,
          body.sort_order || 0
        )
        .run();

      return jsonResponse({ success: true, product: { id: productId, title, slug } });
    }

    // ==================== ADMIN: UPDATE PRODUCT ====================
    if (route.startsWith('/admin/products/') && method === 'PUT') {
      const productId = route.split('/')[3];
      const body = await request.json();
      const { title, slug, description, short_description, price, compare_at_price, category, gpt_url, tags, is_active, is_featured } = body;

      await env.DB.prepare(
        `UPDATE products 
         SET title = ?, slug = ?, description = ?, short_description = ?, price = ?, 
             compare_at_price = ?, category = ?, gpt_url = ?, tags = ?, 
             is_active = ?, is_featured = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
        .bind(
          title,
          slug,
          description,
          short_description,
          price,
          compare_at_price,
          category,
          gpt_url,
          typeof tags === 'string' ? tags : JSON.stringify(tags),
          is_active !== false ? 1 : 0,
          is_featured ? 1 : 0,
          productId
        )
        .run();

      return jsonResponse({ success: true });
    }

    // ==================== ADMIN: DELETE PRODUCT ====================
    if (route.startsWith('/admin/products/') && method === 'DELETE') {
      const productId = route.split('/')[3];

      // Soft delete - set is_active to false
      await env.DB.prepare(
        'UPDATE products SET is_active = 0 WHERE id = ?'
      )
        .bind(productId)
        .run();

      return jsonResponse({ success: true });
    }

    // ==================== ADMIN: BLOG POSTS LIST ====================
    if (route === '/admin/blog' && method === 'GET') {
      const posts = await env.DB.prepare(
        'SELECT * FROM blog_posts ORDER BY published_at DESC'
      ).all();

      return jsonResponse({ posts: posts.results });
    }

    // ==================== ADMIN: CREATE BLOG POST ====================
    if (route === '/admin/blog' && method === 'POST') {
      const body = await request.json();
      const { title, slug, content, excerpt, image_url, category, tags, author_name, is_published } = body;

      if (!title || !slug || !content) {
        return jsonResponse({ error: 'Title, slug, dan content wajib diisi' }, 400);
      }

      const postId = generateId();
      
      await env.DB.prepare(
        `INSERT INTO blog_posts (id, title, slug, content, excerpt, image_url, category, tags, author_name, author_email, is_published, published_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`
      )
        .bind(
          postId,
          title,
          slug,
          content,
          excerpt || null,
          image_url || null,
          category || 'general',
          typeof tags === 'string' ? tags : JSON.stringify(tags || []),
          author_name || 'Admin',
          'admin@asridigital.com',
          is_published !== false ? 1 : 0
        )
        .run();

      return jsonResponse({ success: true, post: { id: postId, title, slug } });
    }

    // ==================== ADMIN: UPDATE BLOG POST ====================
    if (route.startsWith('/admin/blog/') && method === 'PUT') {
      const postId = route.split('/')[3];
      const body = await request.json();
      const { title, slug, content, excerpt, image_url, category, tags, author_name, is_published } = body;

      await env.DB.prepare(
        `UPDATE blog_posts 
         SET title = ?, slug = ?, content = ?, excerpt = ?, image_url = ?, 
             category = ?, tags = ?, author_name = ?, is_published = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
        .bind(
          title,
          slug,
          content,
          excerpt,
          image_url,
          category,
          typeof tags === 'string' ? tags : JSON.stringify(tags),
          author_name,
          is_published ? 1 : 0,
          postId
        )
        .run();

      return jsonResponse({ success: true });
    }

    // ==================== ADMIN: DELETE BLOG POST ====================
    if (route.startsWith('/admin/blog/') && method === 'DELETE') {
      const postId = route.split('/')[3];

      await env.DB.prepare(
        'DELETE FROM blog_posts WHERE id = ?'
      )
        .bind(postId)
        .run();

      return jsonResponse({ success: true });
    }

    // ==================== ADMIN: SETTINGS ====================
    if (route === '/admin/settings' && method === 'GET') {
      const settings = await env.DB.prepare(
        'SELECT * FROM site_settings ORDER BY key ASC'
      ).all();

      const settingsObj: any = {};
      settings.results.forEach((s: any) => {
        settingsObj[s.key] = s.value;
      });

      return jsonResponse({ settings: settingsObj });
    }

    if (route === '/admin/settings' && method === 'PUT') {
      const body = await request.json();
      
      for (const [key, value] of Object.entries(body)) {
        await env.DB.prepare(
          `INSERT INTO site_settings (key, value, updated_at) 
           VALUES (?, ?, datetime('now'))
           ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`
        )
          .bind(key, value as string, value as string)
          .run();
      }

      return jsonResponse({ success: true });
    }

    // ==================== ADMIN: UPDATE ORDER STATUS ====================
    if (route.startsWith('/admin/orders/') && route.endsWith('/status') && method === 'PUT') {
      const orderId = route.split('/')[3];
      const body = await request.json();
      const { status } = body;

      if (!['PENDING', 'PAID', 'FAILED', 'CANCELLED'].includes(status)) {
        return jsonResponse({ error: 'Invalid status' }, 400);
      }

      await env.DB.prepare(
        `UPDATE orders 
         SET status = ?, 
             paid_at = CASE WHEN ? = 'PAID' THEN datetime('now') ELSE paid_at END,
             updated_at = datetime('now')
         WHERE id = ?`
      )
        .bind(status, status, orderId)
        .run();

      // If paid, check for all-access
      if (status === 'PAID') {
        const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();
        if (order && order.product_id === 'ALL-ACCESS') {
          const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(order.user_email).first();
          if (user) {
            await env.DB.prepare('UPDATE users SET is_all_access = 1 WHERE id = ?').bind(user.id).run();
          }
        }
      }

      return jsonResponse({ success: true });
    }

    // ==================== DEFAULT 404 ====================
    return jsonResponse({ error: 'Endpoint not found' }, 404);

  } catch (error: any) {
    console.error('API Error:', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
}

// Email helper function
async function sendOrderConfirmationEmail(env: Env, order: any) {
  if (!env.RESEND_API_KEY || env.RESEND_API_KEY.startsWith('re_your_')) {
    console.log('Resend API key not configured, skipping email');
    return;
  }

  const isAllAccess = order.product_id === 'ALL-ACCESS';
  const subject = isAllAccess
    ? '🏆 Selamat! All-Access Pass Anda Aktif'
    : `🎉 Pembayaran Berhasil - ${order.product_title}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Inter', -apple-system, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #5C7A36; padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 24px; margin: 0;">✨ Asri Digital</h1>
          <p style="color: #ffffff; opacity: 0.9; margin-top: 8px;">Custom GPT untuk Profesional Indonesia</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px;">
          <h2 style="font-size: 20px; color: #171717; margin-bottom: 16px;">
            ${isAllAccess ? '🏆 Selamat! All-Access Pass Anda Aktif' : '🎉 Pembayaran Berhasil!'}
          </h2>
          
          <p style="color: #525252; line-height: 1.6;">
            Halo <strong>${order.user_name}</strong>,
          </p>
          
          <p style="color: #525252; line-height: 1.6;">
            ${isAllAccess
              ? 'Terima kasih telah membeli All-Access Pass! Anda sekarang memiliki akses ke semua Custom GPT yang tersedia dan yang akan datang.'
              : `Terima kasih telah membeli <strong>${order.product_title}</strong>! Produk Anda sudah siap digunakan.`
            }
          </p>
          
          <!-- Order Details -->
          <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="font-size: 14px; color: #737373; text-transform: uppercase; margin-top: 0;">Detail Pesanan</h3>
            <table style="width: 100%;">
              <tr>
                <td style="color: #525252; padding: 4px 0;">Order ID</td>
                <td style="color: #171717; font-weight: 600; text-align: right;">${order.id}</td>
              </tr>
              <tr>
                <td style="color: #525252; padding: 4px 0;">Produk</td>
                <td style="color: #171717; font-weight: 600; text-align: right;">${order.product_title}</td>
              </tr>
              <tr>
                <td style="color: #525252; padding: 4px 0;">Total</td>
                <td style="color: #5C7A36; font-weight: 700; font-size: 18px; text-align: right;">Rp ${order.amount.toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${env.APP_URL}/dashboard" style="display: inline-block; background-color: #5C7A36; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Buka Dashboard →
            </a>
          </div>
          
          <p style="color: #737373; font-size: 14px; text-align: center;">
            Jika ada pertanyaan, balas email ini atau hubungi kami via WhatsApp.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f5f5f5; padding: 24px; text-align: center; border-top: 1px solid #e5e5e5;">
          <p style="color: #a3a3a3; font-size: 12px; margin: 0;">
            © 2026 Asri Digital. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'Asri Digital <noreply@asridigital.com>',
      to: order.user_email,
      subject,
      html
    })
  });

  const result = await response.json() as any;

  // Log email
  await env.DB.prepare(
    `INSERT INTO email_logs (to_email, subject, type, status, sent_at)
     VALUES (?, ?, 'ORDER_CONFIRMATION', 'SENT', datetime('now'))`
  )
    .bind(order.user_email, subject)
    .run();

  return result;
}
