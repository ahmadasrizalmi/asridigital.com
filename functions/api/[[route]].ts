// Cloudflare Pages Functions - API Handler
// This handles all /api/* routes

interface Env {
  DB: D1Database;
  DOMPETX_API_KEY: string;
  DOMPETX_WEBHOOK_SECRET: string;
  DOMPETX_API_URL: string;
  RESEND_KEY: string;
  RESEND_API_KEY: string;
  JWT_SECRET: string;
  APP_URL: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

// Rate limiting store (in-memory for simplicity, use KV in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// CSRF token store (in-memory, use KV in production)
const csrfTokenStore = new Map<string, { token: string; expires: number }>();

// Rate limiting helper
function checkRateLimit(ip: string, limit: number = 60, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

// CSRF token generation
function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomUUID();
  const expires = Date.now() + (60 * 60 * 1000); // 1 hour
  csrfTokenStore.set(sessionId, { token, expires });
  return token;
}

// CSRF token validation
function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokenStore.get(sessionId);
  if (!stored) return false;
  if (Date.now() > stored.expires) {
    csrfTokenStore.delete(sessionId);
    return false;
  }
  return stored.token === token;
}

// Input sanitization helper
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 1000); // Limit length
}

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper: Generate UUID
function generateId(): string {
  return crypto.randomUUID();
}

// Helper: Hash password using PBKDF2 (more secure than SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(hash));
  const saltArray = Array.from(salt);
  
  // Combine salt and hash
  const combined = [...saltArray, ...hashArray];
  return combined.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: Verify password
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  
  // Extract salt (first 32 chars = 16 bytes)
  const saltHex = storedHash.substring(0, 32);
  const salt = new Uint8Array(
    saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return storedHash.substring(32) === hashHex;
}

// Helper: Create JWT token
async function createJWT(payload: any, secret: string, expiresIn: string = '24h'): Promise<string> {
  // Ensure secret is not empty
  if (!secret) throw new Error('JWT_SECRET is required but was not provided');
  const secretKey = secret;
  
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
    if (!secret) throw new Error('JWT_SECRET is required but was not provided');
    const secretKey = secret;
    
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

// Helper: Get allowed CORS origin
function getAllowedOrigin(request: Request): string {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = ['https://asridigital.com', 'https://www.asridigital.com', 'http://localhost:4321'];
  return allowedOrigins.includes(origin) ? origin : 'https://asridigital.com';
}

// Module-level request reference for jsonResponse
let _currentRequest: Request | null = null;
// Module-level context reference for waitUntil (non-blocking deploy trigger)
let _currentCtx: any = null;

// Helper: JSON response
function jsonResponse(data: any, status: number = 200, request?: Request, cacheControl?: string): Response {
  const req = request || _currentRequest;
  const origin = req ? getAllowedOrigin(req) : 'https://asridigital.com';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin'
  };
  // For mutable methods (POST/PUT/DELETE), never cache
  if (cacheControl) {
    headers['Cache-Control'] = cacheControl;
  } else if (req && req.method !== 'GET') {
    headers['Cache-Control'] = 'no-store';
  }
  // For GET requests, rely on Cloudflare Pages _headers Cache-Control
  return new Response(JSON.stringify(data), { status, headers });
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

// ==================== AUTO-DEPLOY TRIGGER ====================
// Triggers Cloudflare Pages rebuild after admin CRUD operations.
// Uses D1 for debounce state since CF Workers are STATELESS (no setTimeout across requests).
// Supports both deploy hook URL and direct CF API trigger.
// Priority: 1) deploy_hook_url (webhook), 2) cf_api_token (direct CF API)
const CF_ACCOUNT_ID = '6c18d33071f75f4fa94fc308a1fd4bd8';
const CF_PROJECT_NAME = 'asridigital';
const DEPLOY_DEBOUNCE_MS = 120000; // 2 minutes

async function triggerDeploy(env: Env): Promise<void> {
  try {
    // Check last deploy time from site_settings
    const lastDeploy = await env.DB.prepare(
      "SELECT value FROM site_settings WHERE key = 'last_deploy_trigger'"
    ).first();
    
    const now = Date.now();
    const lastTime = lastDeploy ? parseInt(lastDeploy.value as string) : 0;
    
    // Only trigger if 2+ minutes since last trigger
    if (now - lastTime < DEPLOY_DEBOUNCE_MS) {
      console.log('Deploy skipped (debounce) - last trigger was', Math.floor((now - lastTime) / 1000), 'seconds ago');
      return;
    }
    
    // Update last trigger time FIRST to prevent race conditions
    await env.DB.prepare(
      "INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES ('last_deploy_trigger', ?, datetime('now'))"
    ).bind(now.toString()).run();
    
    // Option 1: Deploy hook URL (preferred - no API token needed in code)
    const hookSetting = await env.DB.prepare(
      "SELECT value FROM site_settings WHERE key = 'deploy_hook_url'"
    ).first();
    
    if (hookSetting?.value) {
      console.log('Triggering auto-deploy via deploy hook...');
      const deployPromise = fetch(hookSetting.value as string, { method: 'POST' })
        .then((r: Response) => { console.log('Deploy triggered via hook, status:', r.status); return r; })
        .catch((e: any) => { console.error('Deploy hook trigger failed:', e); });
      
      if (_currentCtx?.waitUntil) {
        _currentCtx.waitUntil(deployPromise);
      }
      return;
    }
    
    // Option 2: Direct CF API trigger (needs cf_api_token in site_settings)
    const tokenSetting = await env.DB.prepare(
      "SELECT value FROM site_settings WHERE key = 'cf_api_token'"
    ).first();
    
    if (tokenSetting?.value) {
      console.log('Triggering auto-deploy via CF API...');
      const deployUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${CF_PROJECT_NAME}/deployments`;
      const deployPromise = fetch(deployUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenSetting.value}`,
          'Content-Type': 'application/json'
        }
      })
        .then((r: Response) => { console.log('Deploy triggered via CF API, status:', r.status); return r; })
        .catch((e: any) => { console.error('CF API deploy trigger failed:', e); });
      
      if (_currentCtx?.waitUntil) {
        _currentCtx.waitUntil(deployPromise);
      }
      return;
    }
    
    console.log('No deploy_hook_url or cf_api_token configured - skipping deploy trigger');
  } catch (e) {
    console.error('Deploy trigger error:', e);
  }
}

// Main request handler
export async function onRequest(context: any): Promise<Response> {
  const { request, env } = context;
  _currentRequest = request;
  _currentCtx = context;

  // Env var compatibility: RESEND_API_KEY (wrangler.toml/dashboard) → RESEND_KEY (code)
  if (!env.RESEND_KEY && env.RESEND_API_KEY) env.RESEND_KEY = env.RESEND_API_KEY;

  // Require JWT_SECRET to be configured
  if (!env.JWT_SECRET) {
    return new Response(JSON.stringify({ error: 'Server configuration error: JWT_SECRET not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // Get client IP for rate limiting
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = ['https://asridigital.com', 'https://www.asridigital.com', 'http://localhost:4321', 'http://localhost:4322'];
    const corsOrigin = allowedOrigins.includes(origin) ? origin : 'https://asridigital.com';
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Vary': 'Origin'
      }
    });
  }

  // Rate limiting for auth endpoints
  if (path.includes('/auth/login') || path.includes('/auth/register') || path.includes('/auth/forgot-password')) {
    if (!checkRateLimit(clientIp, 10, 60000)) { // 10 requests per minute
      return jsonResponse({ error: 'Terlalu banyak percobaan. Silakan tunggu beberapa saat.' }, 429);
    }
  }

  // Rate limiting for checkout
  if (path.includes('/checkout')) {
    if (!checkRateLimit(clientIp, 20, 60000)) { // 20 requests per minute
      return jsonResponse({ error: 'Terlalu banyak percobaan checkout.' }, 429);
    }
  }

  // General rate limiting
  if (!checkRateLimit(clientIp, 100, 60000)) { // 100 requests per minute
    return jsonResponse({ error: 'Terlalu banyak request. Silakan tunggu.' }, 429);
  }

  // Remove /api prefix for routing
  const route = path.replace('/api', '') || '/';

  try {
    // ==================== HEALTH CHECK ====================
    if (route === '/health' && method === 'GET') {
      return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // ==================== CSRF TOKEN ====================
    if (route === '/csrf-token' && method === 'GET') {
      const sessionId = url.searchParams.get('session') || crypto.randomUUID();
      const token = generateCSRFToken(sessionId);
      return jsonResponse({ token, sessionId });
    }

    // ==================== AFFILIATE CLICK TRACKING ====================
    if (route === '/affiliate/click' && method === 'POST') {
      const { referralCode, page } = await request.json();
      
      if (!referralCode) {
        return jsonResponse({ error: 'Missing referral code' }, 400);
      }
      
      // Log click to database
      try {
        await env.DB.prepare(
          `INSERT INTO affiliate_clicks (id, referral_code, page, ip_address, user_agent, created_at)
           VALUES (?, ?, ?, ?, ?, datetime('now'))`
        ).bind(
          generateId(),
          referralCode,
          page || '/',
          request.headers.get('CF-Connecting-IP') || 'unknown',
          request.headers.get('User-Agent') || 'unknown'
        ).run();
        
        return jsonResponse({ success: true });
      } catch (dbError) {
        // Table might not exist yet, just log
        console.log('Click tracking table not ready:', dbError);
        return jsonResponse({ success: true });
      }
    }

    // ==================== PRODUCTS ====================
    if (route === '/products' && method === 'GET') {
      const category = url.searchParams.get('category');
      const search = url.searchParams.get('search');
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1') || 1);
      const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20') || 20));
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

      // Hide gpt_url from public responses
      const publicProducts = (products.results || []).map((p: any) => {
        const pub = { ...p };
        delete pub.gpt_url;
        return pub;
      });

      return jsonResponse({
        products: publicProducts,
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

      // Hide gpt_url from public responses
      const publicProducts = (products.results || []).map((p: any) => {
        const pub = { ...p };
        delete pub.gpt_url;
        return pub;
      });

      return jsonResponse({ products: publicProducts });
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

      // Hide gpt_url from public - only show to authenticated owners
      const publicProduct = { ...product };
      delete publicProduct.gpt_url;

      return jsonResponse({ product: publicProduct });
    }

    // ==================== AUTH ====================
    // ==================== ORDER STATUS (PUBLIC) ====================
    if (route.startsWith('/orders/') && method === 'GET') {
      const orderId = route.split('/')[2];
      if (!orderId) {
        return jsonResponse({ error: 'Order ID diperlukan' }, 400);
      }

      const order = await env.DB.prepare(
        'SELECT id, product_title, amount, status, paid_at, created_at, dompetx_id, payment_url FROM orders WHERE id = ?'
      ).bind(orderId).first();

      if (!order) {
        return jsonResponse({ error: 'Pesanan tidak ditemukan' }, 404);
      }

      // If order is still PENDING and has a DompetX checkout ID, poll for status
      if (order.status === 'PENDING' && order.dompetx_id) {
        try {
          const apiKey = env.DOMPETX_API_KEY || '';
          const baseUrl = env.DOMPETX_API_URL || 'https://api.dompetx.com/v1';

          // DompetX: GET /payments/checkout/check-status/{id} with signed headers
          const timestamp = Math.floor(Date.now() / 1000).toString();
          const encoder = new TextEncoder();
          const hmacKey = await crypto.subtle.importKey(
            'raw', encoder.encode(apiKey),
            { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
          );
          const sigInput = `${timestamp}.{}`;
          const sigBuffer = await crypto.subtle.sign('HMAC', hmacKey, encoder.encode(sigInput));
          const signature = Array.from(new Uint8Array(sigBuffer))
            .map(b => b.toString(16).padStart(2, '0')).join('');

          const dompetxResponse = await fetch(`${baseUrl}/payments/checkout/check-status/${order.dompetx_id}`, {
            headers: {
              'X-DOMPAY-API-Key': apiKey,
              'X-DOMPAY-Signature': signature,
              'X-DOMPAY-Timestamp': timestamp
            }
          });

          if (dompetxResponse.ok) {
            const checkoutData = await dompetxResponse.json() as any;
            console.log('ORDER STATUS: DompetX poll result', checkoutData.status);

            if (checkoutData.status === 'paid' || checkoutData.status === 'confirmed') {
              // Update order to PAID
              await env.DB.prepare(
                "UPDATE orders SET status = 'PAID', paid_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
              ).bind(orderId).run();

              // Auto-create user + magic link (same as webhook handler)
              const paidOrder = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();
              if (paidOrder) {
                let user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(paidOrder.user_email).first();
                let magicToken = '';
                let newUserPassword = '';

                if (!user) {
                  const userId = generateId();
                  newUserPassword = crypto.randomUUID().slice(0, 12);
                  const passwordHash = await hashPassword(newUserPassword);
                  try {
                    await env.DB.prepare(
                      'INSERT INTO users (id, email, name, password, is_all_access, role, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, datetime("now"), datetime("now"))'
                    ).bind(userId, paidOrder.user_email, paidOrder.user_name, passwordHash, paidOrder.product_id === 'ALL-ACCESS' ? 1 : 0).run();
                    user = { id: userId };
                  } catch (e) {
                    user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(paidOrder.user_email.toLowerCase()).first();
                  }
                }

                if (user && paidOrder.product_id === 'ALL-ACCESS') {
                  await env.DB.prepare('UPDATE users SET is_all_access = 1 WHERE id = ?').bind(user.id).run();
                }

                if (user) {
                  await env.DB.prepare('UPDATE orders SET user_id = ? WHERE id = ?').bind(user.id, orderId).run();
                  magicToken = await createJWT(
                    { userId: user.id, email: paidOrder.user_email, type: 'magic_login' },
                    env.JWT_SECRET,
                    '720h'
                  );
                }

                await sendOrderConfirmationEmail(env, paidOrder, magicToken, newUserPassword || undefined);
              }

              // Telegram notification for paid order
              try {
                await notifyTelegram(env,
                  `💰 <b>Order DIBAYAR</b>\n\n` +
                  `📦 Produk: ${paidOrder?.product_title || order.product_title}\n` +
                  `👤 Customer: ${paidOrder?.user_name || order.user_name}\n` +
                  `📧 Email: ${paidOrder?.user_email || order.user_email}\n` +
                  `💰 Total: Rp ${(paidOrder?.amount || order.amount || 0).toLocaleString('id-ID')}\n` +
                  `🔖 ID: ${orderId}`
                );
              } catch (e: any) { console.log('TELEGRAM: Error:', e.message); }

              order.status = 'PAID';
              order.paid_at = new Date().toISOString();
            } else if (checkoutData.status === 'expired' || checkoutData.status === 'cancelled') {
              await env.DB.prepare(
                "UPDATE orders SET status = 'FAILED', updated_at = datetime('now') WHERE id = ?"
              ).bind(orderId).run();
              order.status = 'FAILED';
            }
          }
        } catch (pollError) {
          console.error('ORDER STATUS: DompetX poll error', pollError);
        }
      }

      // Generate dashboard URL for PAID orders
      let dashboardUrl = '';
      if (order.status === 'PAID') {
        // Get full order with user_id
        const fullOrder = await env.DB.prepare('SELECT user_id FROM orders WHERE id = ?').bind(orderId).first();
        if (fullOrder?.user_id) {
          const magicToken = await createJWT(
            { userId: fullOrder.user_id, type: 'magic_login' },
            env.JWT_SECRET,
            '720h'
          );
          dashboardUrl = `/api/auth/magic-login?token=${magicToken}`;
        }
      }

      return jsonResponse({ order: { ...order, dashboardUrl } });
    }

    if (route === '/auth/register' && method === 'POST') {
      const { email, password, name } = await request.json();

      if (!email || !password || !name) {
        return jsonResponse({ error: 'Email, password, dan name wajib diisi' }, 400);
      }

      // Sanitize inputs
      const sanitizedName = sanitizeInput(name);
      const sanitizedEmail = sanitizeInput(email).toLowerCase();

      // Validate email format
      if (!isValidEmail(sanitizedEmail)) {
        return jsonResponse({ error: 'Format email tidak valid' }, 400);
      }

      // Validate password length
      if (password.length < 6) {
        return jsonResponse({ error: 'Password minimal 6 karakter' }, 400);
      }

      // Validate name length
      if (sanitizedName.length < 2) {
        return jsonResponse({ error: 'Nama minimal 2 karakter' }, 400);
      }

      // Check if email exists
      const existingUser = await env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      )
        .bind(sanitizedEmail)
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
        .bind(userId, sanitizedEmail, sanitizedName, passwordHash)
        .run();

      // Create JWT token
      const token = await createJWT({ userId, email: sanitizedEmail, name: sanitizedName, role: 'user' }, env.JWT_SECRET);

      return jsonResponse({
        success: true,
        token,
        user: { id: userId, email, name, role: 'user', is_all_access: false }
      });
    }

    if (route === '/auth/login' && method === 'POST') {
      const { email, password } = await request.json();

      if (!email || !password) {
        return jsonResponse({ error: 'Email dan password wajib diisi' }, 400);
      }

      const normalizedEmail = sanitizeInput(email).toLowerCase();

      // Find user
      const user = await env.DB.prepare(
        'SELECT * FROM users WHERE email = ?'
      )
        .bind(normalizedEmail)
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
        { userId: user.id, email: user.email, name: user.name, role: user.role || 'user' },
        env.JWT_SECRET
      );

      return jsonResponse({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'user',
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
          role: user.role || 'user',
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

      const normalizedEmail = sanitizeInput(email).toLowerCase();

      // Find user
      const user = await env.DB.prepare(
        'SELECT * FROM users WHERE email = ?'
      )
        .bind(normalizedEmail)
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
        if (env.RESEND_KEY && !env.RESEND_KEY.startsWith('re_your_')) {
          const resetUrl = `${env.APP_URL}/reset-password?token=${resetToken}`;
          
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.RESEND_KEY}`
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
      console.log('CHECKOUT: Starting checkout process');
      try {
      const body = await request.json();
      const { productSlug, customerEmail, customerName, customerPhone, couponCode, paymentMethod, referredBy, csrfToken } = body;
      console.log('CHECKOUT: Body parsed', { productSlug, customerEmail, paymentMethod });

      // Get product first to check if it's free
      const product = await env.DB.prepare(
        'SELECT * FROM products WHERE slug = ? AND is_active = 1'
      )
        .bind(productSlug)
        .first();

      if (!product) {
        return jsonResponse({ error: 'Produk tidak ditemukan' }, 404);
      }

      // For free products, paymentMethod is optional
      const isFree = product.price === 0;
      if (!productSlug || !customerEmail || !customerName || (!isFree && !paymentMethod)) {
        return jsonResponse({ error: 'Data tidak lengkap' }, 400);
      }

      // Sanitize inputs
      const sanitizedName = sanitizeInput(customerName);
      const sanitizedEmail = sanitizeInput(customerEmail).toLowerCase();

      // Validate email
      if (!isValidEmail(sanitizedEmail)) {
        return jsonResponse({ error: 'Format email tidak valid' }, 400);
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
                         (!coupon.max_uses || coupon.current_uses < coupon.max_uses) &&
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

      // ==================== FREE PRODUCT CHECKOUT ====================
      if (finalAmount <= 0) {
        // Auto-create user account for free checkout (same as paid flow)
        let userId: string | null = null;
        let magicToken = '';
        let newUserPassword = '';

        let existingUser = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(sanitizedEmail).first();
        if (!existingUser) {
          userId = generateId();
          newUserPassword = crypto.randomUUID().slice(0, 12);
          const passwordHash = await hashPassword(newUserPassword);
          try {
            await env.DB.prepare(
              'INSERT INTO users (id, email, name, password, is_all_access, role, created_at, updated_at) VALUES (?, ?, ?, ?, 0, \'user\', datetime(\'now\'), datetime(\'now\'))'
            ).bind(userId, sanitizedEmail, sanitizedName, passwordHash).run();
            existingUser = { id: userId };
          } catch (e) {
            existingUser = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(sanitizedEmail).first();
          }
        }

        if (existingUser) {
          userId = existingUser.id;
          magicToken = await createJWT(
            { userId: existingUser.id, email: sanitizedEmail, type: 'magic_login' },
            env.JWT_SECRET,
            '720h'
          );
        }

        await env.DB.prepare(
          `INSERT INTO orders (id, user_id, user_email, user_name, user_phone, product_id, product_title, amount, payment_method, coupon_id, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'FREE', ?, 'PAID', datetime('now'), datetime('now'))`
        ).bind(orderId, userId, sanitizedEmail, sanitizedName, customerPhone || null, product.id, product.title, 0, couponId).run();

        try {
          await env.DB.prepare(
            `INSERT OR IGNORE INTO subscribers (id, email, whatsapp, name, source, product_id, product_title, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'free_product', ?, ?, datetime('now'), datetime('now'))`
          ).bind(generateId(), sanitizedEmail, customerPhone || null, sanitizedName, product.id, product.title).run();
        } catch (e: any) { console.log('SUBSCRIBER: Error:', e.message); }

        if (couponId) {
          await env.DB.prepare('UPDATE coupons SET current_uses = current_uses + 1 WHERE id = ?').bind(couponId).run();
        }

        try {
          await sendOrderConfirmationEmail(env, { id: orderId, user_email: sanitizedEmail, user_name: sanitizedName, product_title: product.title, product_slug: product.slug, product_id: product.id }, magicToken || undefined, newUserPassword || undefined);
        } catch (e: any) { console.log('FREE_EMAIL: Error:', e.message); }

        // Telegram notification for new order
        try {
          await notifyTelegram(env,
            `🆕 <b>Order Baru (GRATIS)</b>\n\n` +
            `📦 Produk: ${product.title}\n` +
            `👤 Customer: ${sanitizedName}\n` +
            `📧 Email: ${sanitizedEmail}\n` +
            `💰 Total: GRATIS\n` +
            `🔖 Kode: INV-${Date.now().toString(36).toUpperCase()}`
          );
        } catch (e: any) { console.log('TELEGRAM: Error:', e.message); }

        return jsonResponse({ success: true, orderId, orderCode, paymentUrl: `${env.APP_URL}/success?order=${orderId}&free=true`, amount: 0, discount: discountAmount, isFree: true, dashboardUrl: magicToken ? `/api/auth/magic-login?token=${magicToken}` : null });
      }

      // Get affiliate referral from cookie or request body
      let affiliateReferral = referredBy || null;
      
      // Validate affiliate referral exists
      if (affiliateReferral) {
        const referrer = await env.DB.prepare(
          'SELECT id FROM users WHERE id = ?'
        ).bind(affiliateReferral).first();
        
        if (!referrer) {
          affiliateReferral = null; // Invalid referrer, ignore
        }
      }

      // Create order
      await env.DB.prepare(
        `INSERT INTO orders (id, user_id, user_email, user_name, user_phone, product_id, product_title, amount, payment_method, coupon_id, status, referred_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, datetime('now'), datetime('now'))`
      )
        .bind(
          orderId,
          null, // user_id null for guest checkout
          sanitizedEmail,
          sanitizedName,
          customerPhone || null,
          product.id,
          product.title,
          finalAmount,
          paymentMethod,
          couponId,
          affiliateReferral
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

      // Create DompetX checkout session - skip for free products
      let paymentUrl = null;
      let paymentData = null;

      if (!isFree && finalAmount > 0) {
        try {
          const apiKey = env.DOMPETX_API_KEY || '';
          const baseUrl = env.DOMPETX_API_URL || 'https://api.dompetx.com/v1';

          // Generate HMAC-SHA256 signature per DompetX docs
          const timestamp = Math.floor(Date.now() / 1000).toString();
          const requestBodyObj = {
            amount: finalAmount,
            currency: 'IDR',
            reference: orderId,  // Use orderId (UUID) so webhook can look it up directly
            metadata: {
              order_id: orderId,
              product_slug: productSlug,
              customer_email: sanitizedEmail,
              customer_name: sanitizedName
            }
          };
          const requestBody = JSON.stringify(requestBodyObj);

          // Signature = HMAC-SHA256(timestamp + "." + body, apiKey)
          const encoder = new TextEncoder();
          const key = await crypto.subtle.importKey(
            'raw', encoder.encode(apiKey),
            { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
          );
          const sigInput = `${timestamp}.${requestBody}`;
          const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(sigInput));
          const signature = Array.from(new Uint8Array(sigBuffer))
            .map(b => b.toString(16).padStart(2, '0')).join('');

          const idempotencyKey = `req_${orderId}`;

          console.log('DOMPETX: Creating checkout', { orderId, amount: finalAmount });

          const dompetxResponse = await fetch(`${baseUrl}/payments/checkout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-DOMPAY-API-Key': apiKey,
              'X-DOMPAY-Signature': signature,
              'X-DOMPAY-Timestamp': timestamp,
              'Idempotency-Key': idempotencyKey
            },
            body: requestBody
          });

          const dompetxData = await dompetxResponse.json() as any;
          console.log('DOMPETX: Response', JSON.stringify(dompetxData));

          // DompetX returns payment_url
          if (dompetxData.payment_url || dompetxData.id) {
            paymentUrl = dompetxData.payment_url;
            paymentData = dompetxData;

            // Update order with DompetX reference
            await env.DB.prepare(
              'UPDATE orders SET payment_url = ?, dompetx_id = ? WHERE id = ?'
            )
              .bind(paymentUrl, dompetxData.id, orderId)
              .run();
          } else {
            console.error('DOMPETX: Checkout failed', dompetxData);
          }
        } catch (error: any) {
          console.error('DOMPETX: Error', error.message);
        }
      } else {
        console.log('CHECKOUT: Free product, skipping payment gateway');
      }

      // Free products (price=0 or coupon covers full amount) - skip payment
      if (finalAmount <= 0) {
        await env.DB.prepare(
          "UPDATE orders SET status = 'PAID', paid_at = datetime('now') WHERE id = ?"
        ).bind(orderId).run();

        // Send confirmation email for free orders too
        try {
          const paidOrder = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();
          if (paidOrder) {
            await sendOrderConfirmationEmail(env, paidOrder);
          }
        } catch (emailErr: any) {
          console.error('EMAIL: Failed to send free order confirmation:', emailErr.message);
        }

        // Telegram notification for free order
        try {
          await notifyTelegram(env,
            `🆕 <b>Order Baru (GRATIS)</b>\n\n` +
            `📦 Produk: ${product.title}\n` +
            `👤 Customer: ${sanitizedName}\n` +
            `📧 Email: ${sanitizedEmail}\n` +
            `💰 Total: GRATIS\n` +
            `🔖 Kode: ${orderCode}`
          );
        } catch (e: any) { console.log('TELEGRAM: Error:', e.message); }

        return jsonResponse({
          success: true,
          orderId,
          orderCode,
          amount: finalAmount,
          discount: discountAmount
          // No paymentUrl - frontend will redirect to success page
        });
      }

      // If DompetX fails, don't fake success - return error
      if (!paymentUrl) {
        return jsonResponse({
          success: false,
          error: 'Payment gateway sedang bermasalah. Silakan coba beberapa saat lagi atau hubungi support.',
          orderId,
          orderCode
        }, 502);
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
      } catch (checkoutError: any) {
        console.error('CHECKOUT: Unhandled error', checkoutError.message, checkoutError.stack);
        return jsonResponse({ 
          error: 'Terjadi kesalahan server. Silakan coba lagi.',
          details: checkoutError.message 
        }, 500);
      }
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

      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
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
      if (user && user.role === 'admin') {
        // Admin sees ALL orders
        orders = await env.DB.prepare(
          'SELECT * FROM orders ORDER BY created_at DESC LIMIT 100'
        ).all();
      } else if (user) {
        orders = await env.DB.prepare(
          'SELECT * FROM orders WHERE user_email = ? ORDER BY created_at DESC LIMIT 50'
        )
          .bind(user.email)
          .all();
      } else {
        // Unauthenticated - return only minimal FOMO data (no PII leak)
        orders = await env.DB.prepare(
          "SELECT id, product_title, amount, status, created_at, SUBSTR(user_name, 1, 1) || '***' as user_name FROM orders WHERE status = 'PAID' ORDER BY created_at DESC LIMIT 10"
        )
          .all();
      }

      return jsonResponse({ orders: orders.results });
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
      const rawBody = await request.text();
      let body: any;
      
      // Verify webhook signature if secret is configured
      if (env.DOMPETX_WEBHOOK_SECRET) {
        const signature = request.headers.get('X-Dompay-Signature') || request.headers.get('X-Signature') || '';
        const timestamp = request.headers.get('X-Dompay-Timestamp') || request.headers.get('X-Timestamp') || '';
        if (signature) {
          const encoder = new TextEncoder();
          const key = await crypto.subtle.importKey('raw', encoder.encode(env.DOMPETX_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
          const dataToSign = timestamp ? timestamp + rawBody : rawBody;
          const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(dataToSign));
          const expectedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
          if (expectedSig !== signature.replace('sha256=', '')) {
            console.error('WEBHOOK: Invalid signature');
            return jsonResponse({ error: 'Invalid signature' }, 401);
          }
        }
      }
      
      try {
        body = JSON.parse(rawBody);
      } catch (e) {
        return jsonResponse({ error: 'Invalid JSON' }, 400);
      }

      console.log('WEBHOOK: Received DompetX webhook', JSON.stringify(body).substring(0, 500));

      // DompetX webhook format per docs:
      // { "data": { "id": "...", "amount": ..., "status": "paid", "currency": "IDR", "reference": "INV-XXX" }, "eventType": "deposit", "paymentId": "..." }
      const eventType = body.eventType || '';
      const webhookData = body.data || body;
      const checkoutStatus = webhookData.status || '';

      // Find order by reference (our orderCode, e.g. INV-xxx)
      const orderCode = webhookData.reference || '';
      const dompetxId = webhookData.id || body.paymentId || '';

      // Only process paid events
      const isPaidEvent = checkoutStatus === 'paid' || checkoutStatus === 'confirmed' || eventType === 'deposit';

      if (!orderCode && !dompetxId) {
        console.error('WEBHOOK: No reference or ID found');
        return jsonResponse({ error: 'Missing reference' }, 400);
      }

      console.log('WEBHOOK: Processing', { eventType, orderCode, dompetxId, status: checkoutStatus });

      // Find order by reference (orderId UUID) or dompetx_id
      let order: any = null;
      if (orderCode) {
        // reference is now orderId (UUID), direct lookup
        order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?')
          .bind(orderCode).first();
      }
      if (!order && dompetxId) {
        order = await env.DB.prepare('SELECT * FROM orders WHERE dompetx_id = ?')
          .bind(dompetxId).first();
      }

      if (!order) {
        return jsonResponse({ error: 'Order not found' }, 404);
      }

      // Update order status
      if (isPaidEvent) {
        await env.DB.prepare(
          `UPDATE orders 
           SET status = 'PAID', 
               paid_at = datetime('now'),
               payment_method = ?,
               updated_at = datetime('now')
           WHERE id = ?`
        )
          .bind(webhookData.payment_method || order.payment_method, order.id)
          .run();

        // Auto-create user account after payment (for ALL products)
        let user = await env.DB.prepare(
          'SELECT id FROM users WHERE email = ?'
        )
          .bind(order.user_email)
          .first();

        let magicToken = '';
        let newUserPassword = '';
        if (!user) {
          // Create new user with random password
          const userId = generateId();
          newUserPassword = crypto.randomUUID().slice(0, 12);
          const passwordHash = await hashPassword(newUserPassword);

          try {
            await env.DB.prepare(
              'INSERT INTO users (id, email, name, password, is_all_access, role, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, datetime("now"), datetime("now"))'
            ).bind(userId, order.user_email, order.user_name, passwordHash, order.product_id === 'ALL-ACCESS' ? 1 : 0).run();

            user = { id: userId };
          } catch (e) {
            // User might already exist with different casing
            user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(order.user_email.toLowerCase()).first();
          }
        }

        // Set all_access for ALL-ACCESS products
        if (user && order.product_id === 'ALL-ACCESS') {
          await env.DB.prepare('UPDATE users SET is_all_access = 1 WHERE id = ?').bind(user.id).run();
        }

        // Generate magic login link (valid 30 days)
        if (user) {
          magicToken = await createJWT(
            { userId: user.id, email: order.user_email, type: 'magic_login' },
            env.JWT_SECRET,
            '720h' // 30 days
          );

          // Store magic link in order for success page
          await env.DB.prepare(
            'UPDATE orders SET user_id = ? WHERE id = ?'
          ).bind(user.id, order.id).run();
        }

        // Process affiliate commission if order has referral
        if (order.referred_by) {
          try {
            // Get commission percent from settings (default 10%)
            const settings = await env.DB.prepare(
              "SELECT value FROM site_settings WHERE key = 'commission_percent'"
            ).first();
            const commissionPercent = settings ? parseInt(settings.value) : 10;
            const commissionAmount = Math.round(order.amount * (commissionPercent / 100));
            
            // Calculate available date (7 days holding period)
            const availableAt = new Date();
            availableAt.setDate(availableAt.getDate() + 7);
            
            // Create affiliate transaction
            await env.DB.prepare(
              `INSERT INTO affiliate_transactions (id, order_id, referrer_user_id, referred_user_id, commission_amount, commission_percent, status, available_at, created_at)
               VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, datetime('now'))`
            ).bind(
              generateId(),
              order.id,
              order.referred_by,
              null, // Guest user, no user_id
              commissionAmount,
              commissionPercent,
              availableAt.toISOString()
            ).run();
            
            console.log(`Affiliate commission created: ${commissionAmount} IDR for referrer ${order.referred_by}`);
          } catch (affiliateError) {
            console.error('Affiliate commission error:', affiliateError);
          }
        }

        // Send confirmation email with magic link
        try {
          await sendOrderConfirmationEmail(env, order, magicToken, newUserPassword || undefined);
        } catch (emailError) {
          console.error('Email error:', emailError);
        }

      } else if (checkoutStatus === 'FAILED') {
        await env.DB.prepare(
          `UPDATE orders 
           SET status = 'FAILED', 
               updated_at = datetime('now')
           WHERE id = ?`
        )
          .bind(order.id)
          .run();
      }

      return jsonResponse({ success: true });
    }

    // ==================== WEBHOOK RESEND (email delivery tracking) ====================
    if (route === '/webhooks/resend' && method === 'POST') {
      try {
        const rawBody = await request.text();
        const body = JSON.parse(rawBody);
        const eventType = body.type || '';
        const data = body.data || {};

        console.log('RESEND WEBHOOK:', eventType, JSON.stringify(data).substring(0, 300));

        // Update email_logs based on delivery status
        if (data.email_id || data.to) {
          const statusMap: Record<string, string> = {
            'email.sent': 'SENT',
            'email.delivered': 'DELIVERED',
            'email.delivery_delayed': 'DELAYED',
            'email.bounced': 'BOUNCED',
            'email.complained': 'COMPLAINED',
          };
          const newStatus = statusMap[eventType] || eventType;

          // Try to find and update the email log
          if (data.to && Array.isArray(data.to)) {
            for (const toEmail of data.to) {
              await env.DB.prepare(
                `UPDATE email_logs SET status = ?, resend_id = ? WHERE to_email = ? AND type = 'ORDER_CONFIRMATION' ORDER BY sent_at DESC LIMIT 1`
              ).bind(newStatus, data.email_id || null, toEmail).run();
            }
          } else if (data.to && typeof data.to === 'string') {
            await env.DB.prepare(
              `UPDATE email_logs SET status = ?, resend_id = ? WHERE to_email = ? AND type = 'ORDER_CONFIRMATION' ORDER BY sent_at DESC LIMIT 1`
            ).bind(newStatus, data.email_id || null, data.to).run();
          }
        }

        return jsonResponse({ received: true });
      } catch (webhookErr) {
        console.error('Resend webhook error:', webhookErr);
        return jsonResponse({ error: 'Webhook processing failed' }, 500);
      }
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
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1') || 1);
      const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '10') || 10));
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

    // ==================== ADMIN MIDDLEWARE ====================
    // All admin routes require authentication and admin role
    let adminUser: any = null;
    if (route.startsWith('/admin')) {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return jsonResponse({ error: 'Unauthorized - Login required' }, 401);
      }
      
      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyJWT(token, env.JWT_SECRET);
      
      if (!payload) {
        return jsonResponse({ error: 'Invalid token' }, 401);
      }
      
      // Check if user is admin
      const user = await env.DB.prepare(
        'SELECT role, name FROM users WHERE id = ?'
      ).bind(payload.userId).first();
      
      if (!user || user.role !== 'admin') {
        return jsonResponse({ error: 'Forbidden - Admin access required' }, 403);
      }
      adminUser = { ...payload, name: user.name || payload.name };
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

      triggerDeploy(env);
      return jsonResponse({ success: true, coupon: { id: couponId, code: code.toUpperCase() }, deploy_triggered: true });
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

      triggerDeploy(env);
      return jsonResponse({ success: true, deploy_triggered: true });
    }

    // ==================== ADMIN: DELETE COUPON ====================
    if (route.startsWith('/admin/coupons/') && method === 'DELETE') {
      const couponId = route.split('/')[3];

      await env.DB.prepare(
        'DELETE FROM coupons WHERE id = ?'
      )
        .bind(couponId)
        .run();

      triggerDeploy(env);
      return jsonResponse({ success: true, deploy_triggered: true });
    }

    // ==================== CATEGORIES (PUBLIC) ====================
    if (route === '/categories' && method === 'GET') {
      const categories = await env.DB.prepare(
        'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC'
      ).all();
      return jsonResponse({ categories: categories.results });
    }

    // ==================== ADMIN: CATEGORIES LIST ====================
    if (route === '/admin/categories' && method === 'GET') {
      const categories = await env.DB.prepare(
        'SELECT * FROM categories ORDER BY sort_order ASC'
      ).all();
      return jsonResponse({ categories: categories.results });
    }

    // ==================== ADMIN: CREATE CATEGORY ====================
    if (route === '/admin/categories' && method === 'POST') {
      const body = await request.json();
      const { name, slug, description, icon, sort_order, is_active } = body;

      if (!name || !slug) {
        return jsonResponse({ error: 'Name dan slug wajib diisi' }, 400);
      }

      const catId = 'cat-' + slug;
      await env.DB.prepare(
        `INSERT INTO categories (id, name, slug, description, icon, sort_order, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).bind(catId, name, slug, description || null, icon || null, sort_order || 0, is_active !== false ? 1 : 0).run();

      triggerDeploy(env);
      return jsonResponse({ success: true, category: { id: catId, name, slug }, deploy_triggered: true });
    }

    // ==================== ADMIN: UPDATE CATEGORY ====================
    if (route.startsWith('/admin/categories/') && method === 'PUT') {
      const catId = route.split('/')[3];
      const body = await request.json();
      const updates: string[] = [];
      const values: any[] = [];

      if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name); }
      if (body.slug !== undefined) { updates.push('slug = ?'); values.push(body.slug); }
      if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description); }
      if (body.icon !== undefined) { updates.push('icon = ?'); values.push(body.icon); }
      if (body.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(body.sort_order); }
      if (body.is_active !== undefined) { updates.push('is_active = ?'); values.push(body.is_active ? 1 : 0); }

      if (updates.length === 0) return jsonResponse({ error: 'Tidak ada data yang diupdate' }, 400);

      updates.push("updated_at = datetime('now')");
      values.push(catId);

      await env.DB.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
      triggerDeploy(env);
      return jsonResponse({ success: true, deploy_triggered: true });
    }

    // ==================== ADMIN: DELETE CATEGORY ====================
    if (route.startsWith('/admin/categories/') && method === 'DELETE') {
      const catId = route.split('/')[3];
      await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(catId).run();
      triggerDeploy(env);
      return jsonResponse({ success: true, deploy_triggered: true });
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
      const { id, title, slug, description, short_description, price, compare_at_price, category, gpt_url, tags, is_active, is_featured, image_icon, gallery_images, gallery_videos, video_embed_url } = body;

      if (!title || !slug || price === undefined || price === null) {
        return jsonResponse({ error: 'Title, slug, dan price wajib diisi' }, 400);
      }

      const productId = id || generateId();
      
      await env.DB.prepare(
        `INSERT INTO products (id, title, slug, description, short_description, price, compare_at_price, category, gpt_url, image_icon, gallery_images, gallery_videos, video_embed_url, tags, is_active, is_featured, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
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
          image_icon || `/images/${slug}.jpg`,
          gallery_images || null,
          gallery_videos || null,
          video_embed_url || null,
          typeof tags === 'string' ? tags : JSON.stringify(tags || []),
          is_active !== false ? 1 : 0,
          is_featured ? 1 : 0,
          body.sort_order || 0
        )
        .run();

      triggerDeploy(env);
      return jsonResponse({ success: true, product: { id: productId, title, slug }, deploy_triggered: true });
    }

    // ==================== ADMIN: UPDATE PRODUCT ====================
    if (route.startsWith('/admin/products/') && method === 'PUT') {
      const productId = route.split('/')[3];
      const body = await request.json();

      // Build dynamic SET clause - only update fields that were provided
      const updates: string[] = [];
      const values: any[] = [];

      if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title); }
      if (body.slug !== undefined) { updates.push('slug = ?'); values.push(body.slug); }
      if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description); }
      if (body.short_description !== undefined) { updates.push('short_description = ?'); values.push(body.short_description); }
      if (body.price !== undefined) { updates.push('price = ?'); values.push(body.price); }
      if (body.compare_at_price !== undefined) { updates.push('compare_at_price = ?'); values.push(body.compare_at_price); }
      if (body.category !== undefined) { updates.push('category = ?'); values.push(body.category); }
      if (body.gpt_url !== undefined) { updates.push('gpt_url = ?'); values.push(body.gpt_url); }
      if (body.tags !== undefined) { updates.push('tags = ?'); values.push(typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags)); }
      if (body.is_active !== undefined) { updates.push('is_active = ?'); values.push(body.is_active ? 1 : 0); }
      if (body.is_featured !== undefined) { updates.push('is_featured = ?'); values.push(body.is_featured ? 1 : 0); }
      if (body.image_icon !== undefined) { updates.push('image_icon = ?'); values.push(body.image_icon); }
      if (body.gallery_images !== undefined) { updates.push('gallery_images = ?'); values.push(body.gallery_images); }
      if (body.gallery_videos !== undefined) { updates.push('gallery_videos = ?'); values.push(body.gallery_videos); }
      if (body.video_embed_url !== undefined) { updates.push('video_embed_url = ?'); values.push(body.video_embed_url); }

      if (updates.length === 0) {
        return jsonResponse({ error: 'Tidak ada data yang diupdate' }, 400);
      }

      updates.push("updated_at = datetime('now')");
      values.push(productId);

      await env.DB.prepare(
        `UPDATE products SET ${updates.join(', ')} WHERE id = ?`
      )
        .bind(...values)
        .run();

      triggerDeploy(env);
      return jsonResponse({ success: true, deploy_triggered: true });
    }

    // ==================== ADMIN: DELETE PRODUCT ====================
    if (route.startsWith('/admin/products/') && method === 'DELETE') {
      const productId = route.split('/')[3];

      // Hard delete - remove product from database
      await env.DB.prepare(
        'DELETE FROM products WHERE id = ?'
      )
        .bind(productId)
        .run();

      triggerDeploy(env);
      return jsonResponse({ success: true, message: 'Produk berhasil dihapus', deploy_triggered: true });
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
        `INSERT INTO blog_posts (id, title, slug, content, excerpt, image_url, category, tags, author_name, is_published, published_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`
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
          adminUser?.name || author_name || 'Admin',
          is_published !== false ? 1 : 0
        )
        .run();

      triggerDeploy(env);
      return jsonResponse({ success: true, post: { id: postId, title, slug }, deploy_triggered: true });
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
          adminUser?.name || author_name || 'Admin',
          is_published ? 1 : 0,
          postId
        )
        .run();

      triggerDeploy(env);
      return jsonResponse({ success: true, deploy_triggered: true });
    }

    // ==================== ADMIN: DELETE BLOG POST ====================
    if (route.startsWith('/admin/blog/') && method === 'DELETE') {
      const postId = route.split('/')[3];

      await env.DB.prepare(
        'DELETE FROM blog_posts WHERE id = ?'
      )
        .bind(postId)
        .run();

      triggerDeploy(env);
      return jsonResponse({ success: true, deploy_triggered: true });
    }

    // ==================== PUBLIC: HERO SLIDES ====================
    if (route === '/hero-slides' && method === 'GET') {
      try {
        const slides = await env.DB.prepare(
          'SELECT * FROM hero_slides WHERE is_active = 1 ORDER BY sort_order ASC'
        ).all();
        return jsonResponse({ slides: slides.results });
      } catch (e) {
        // Table might not exist yet
        return jsonResponse({ slides: [] });
      }
    }

    // ==================== ADMIN: HERO SLIDES LIST ====================
    if (route === '/admin/hero-slides' && method === 'GET') {
      const slides = await env.DB.prepare(
        'SELECT * FROM hero_slides ORDER BY sort_order ASC'
      ).all();
      return jsonResponse({ slides: slides.results });
    }

    // ==================== ADMIN: CREATE HERO SLIDE ====================
    if (route === '/admin/hero-slides' && method === 'POST') {
      const body = await request.json();
      const { title, subtitle, cta_text, cta_link, image_desktop, image_mobile, link_type, link_target, badge_text, badge_color, sort_order, is_active } = body;

      if (!title || !image_desktop || !image_mobile) {
        return jsonResponse({ error: 'Title, image_desktop, dan image_mobile wajib diisi' }, 400);
      }

      const slideId = 'slide-' + generateId().substring(0, 8);

      await env.DB.prepare(
        `INSERT INTO hero_slides (id, title, subtitle, cta_text, cta_link, image_desktop, image_mobile, link_type, link_target, badge_text, badge_color, sort_order, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).bind(
        slideId, title, subtitle || null, cta_text || null, cta_link || null,
        image_desktop, image_mobile, link_type || 'none', link_target || null,
        badge_text || null, badge_color || 'primary', sort_order || 0, is_active !== false ? 1 : 0
      ).run();

      triggerDeploy(env);
      return jsonResponse({ success: true, slide: { id: slideId }, deploy_triggered: true });
    }

    // ==================== ADMIN: UPDATE HERO SLIDE ====================
    if (route.startsWith('/admin/hero-slides/') && method === 'PUT') {
      const slideId = route.split('/')[3];
      const body = await request.json();
      const updates: string[] = [];
      const values: any[] = [];

      if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title); }
      if (body.subtitle !== undefined) { updates.push('subtitle = ?'); values.push(body.subtitle); }
      if (body.cta_text !== undefined) { updates.push('cta_text = ?'); values.push(body.cta_text); }
      if (body.cta_link !== undefined) { updates.push('cta_link = ?'); values.push(body.cta_link); }
      if (body.image_desktop !== undefined) { updates.push('image_desktop = ?'); values.push(body.image_desktop); }
      if (body.image_mobile !== undefined) { updates.push('image_mobile = ?'); values.push(body.image_mobile); }
      if (body.link_type !== undefined) { updates.push('link_type = ?'); values.push(body.link_type); }
      if (body.link_target !== undefined) { updates.push('link_target = ?'); values.push(body.link_target); }
      if (body.badge_text !== undefined) { updates.push('badge_text = ?'); values.push(body.badge_text); }
      if (body.badge_color !== undefined) { updates.push('badge_color = ?'); values.push(body.badge_color); }
      if (body.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(body.sort_order); }
      if (body.is_active !== undefined) { updates.push('is_active = ?'); values.push(body.is_active ? 1 : 0); }

      if (updates.length === 0) return jsonResponse({ error: 'Tidak ada data yang diupdate' }, 400);

      updates.push("updated_at = datetime('now')");
      values.push(slideId);

      await env.DB.prepare(`UPDATE hero_slides SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
      triggerDeploy(env);
      return jsonResponse({ success: true, deploy_triggered: true });
    }

    // ==================== ADMIN: DELETE HERO SLIDE ====================
    if (route.startsWith('/admin/hero-slides/') && method === 'DELETE') {
      const slideId = route.split('/')[3];
      await env.DB.prepare('DELETE FROM hero_slides WHERE id = ?').bind(slideId).run();
      triggerDeploy(env);
      return jsonResponse({ success: true, deploy_triggered: true });
    }

    // ==================== ADMIN: REORDER HERO SLIDES ====================
    if (route === '/admin/hero-slides/reorder' && method === 'POST') {
      const body = await request.json();
      const { order } = body; // array of { id, sort_order }

      if (!Array.isArray(order)) {
        return jsonResponse({ error: 'Order harus berupa array' }, 400);
      }

      for (const item of order) {
        await env.DB.prepare(
          'UPDATE hero_slides SET sort_order = ?, updated_at = datetime(\'now\') WHERE id = ?'
        ).bind(item.sort_order, item.id).run();
      }

      triggerDeploy(env);
      return jsonResponse({ success: true, deploy_triggered: true });
    }

    // ==================== PUBLIC: SITE SETTINGS ====================
    if (route === '/site-settings' && method === 'GET') {
      try {
        const keysParam = url.searchParams.get('keys');
        let query = 'SELECT key, value FROM site_settings';
        let params: any[] = [];

        if (keysParam) {
          const keys = keysParam.split(',').map(k => k.trim()).filter(Boolean);
          if (keys.length > 0) {
            const placeholders = keys.map(() => '?').join(',');
            query += ` WHERE key IN (${placeholders})`;
            params = keys;
          }
        }

        const settings = await env.DB.prepare(query).bind(...params).all();
        const result: Record<string, string> = {};
        (settings.results || []).forEach((s: any) => {
          if (s.value && s.value.trim()) result[s.key] = s.value.trim();
        });
        return jsonResponse(result);
      } catch (e) {
        return jsonResponse({});
      }
    }

    // ==================== PUBLIC: CATEGORIES ====================
    if (route === '/categories' && method === 'GET') {
      try {
        const categories = await env.DB.prepare(
          'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC'
        ).all();
        return jsonResponse({ categories: categories.results });
      } catch (e) {
        return jsonResponse({ categories: [] });
      }
    }

    // ==================== PUBLIC: TRACKING CONFIG ====================
    if (route === '/tracking-config' && method === 'GET') {
      const keys = ['gtm_id', 'meta_pixel_id', 'google_ads_id', 'google_ads_label'];
      const placeholders = keys.map(() => '?').join(',');
      const settings = await env.DB.prepare(
        `SELECT key, value FROM site_settings WHERE key IN (${placeholders})`
      ).bind(...keys).all();

      const config: any = {};
      settings.results.forEach((s: any) => {
        if (s.value && s.value.trim()) config[s.key] = s.value.trim();
      });

      return jsonResponse(config);
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

      triggerDeploy(env);
      return jsonResponse({ success: true, deploy_triggered: true });
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

      triggerDeploy(env);
      return jsonResponse({ success: true, deploy_triggered: true });
    }

    // ==================== ADMIN: EDIT ORDER ====================
    if (route.match(/^\/admin\/orders\/[^/]+$/) && !route.endsWith('/status') && method === 'PUT') {
      const orderId = route.split('/')[3];
      const body = await request.json();
      const updates: string[] = [];
      const values: any[] = [];

      if (body.user_name !== undefined) { updates.push('user_name = ?'); values.push(body.user_name); }
      if (body.user_email !== undefined) { updates.push('user_email = ?'); values.push(body.user_email); }
      if (body.user_phone !== undefined) { updates.push('user_phone = ?'); values.push(body.user_phone); }
      if (body.amount !== undefined) { updates.push('amount = ?'); values.push(body.amount); }
      if (body.payment_method !== undefined) { updates.push('payment_method = ?'); values.push(body.payment_method); }
      if (body.status !== undefined) {
        updates.push('status = ?'); values.push(body.status);
        if (body.status === 'PAID') { updates.push("paid_at = datetime('now')"); }
      }

      if (updates.length === 0) return jsonResponse({ error: 'Tidak ada data yang diupdate' }, 400);

      updates.push("updated_at = datetime('now')");
      values.push(orderId);

      await env.DB.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
      triggerDeploy(env);
      return jsonResponse({ success: true, deploy_triggered: true });
    }

    // ==================== ADMIN: DELETE ORDER ====================
    if (route.match(/^\/admin\/orders\/[^/]+$/) && method === 'DELETE') {
      const orderId = route.split('/')[3];
      await env.DB.prepare('DELETE FROM orders WHERE id = ?').bind(orderId).run();
      triggerDeploy(env);
      return jsonResponse({ success: true, deploy_triggered: true });
    }

    // ==================== AUTH: LOGOUT ====================
    if (route === '/auth/logout' && method === 'POST') {
      // For JWT, logout is handled client-side by removing token
      // We can add token blacklist here if needed
      return jsonResponse({ success: true, message: 'Logged out successfully' });
    }

    // ==================== MAGIC LOGIN ====================
    if (route === '/auth/magic-login' && method === 'GET') {
      const token = url.searchParams.get('token');
      if (!token) {
        return new Response('<html><body>Token tidak valid</body></html>', {
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        });
      }

      const payload = await verifyJWT(token, env.JWT_SECRET);
      if (!payload || payload.type !== 'magic_login') {
        return new Response('<html><body>Token tidak valid atau sudah expired</body></html>', {
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        });
      }

      // Get user info
      const user = await env.DB.prepare('SELECT id, email, name, role, is_all_access FROM users WHERE id = ?')
        .bind(payload.userId).first();

      if (!user) {
        return new Response('<html><body>User tidak ditemukan</body></html>', {
          status: 404,
          headers: { 'Content-Type': 'text/html' }
        });
      }

      // Create a regular JWT for the user
      const authToken = await createJWT(
        { userId: user.id, email: user.email, name: user.name, role: user.role || 'user' },
        env.JWT_SECRET
      );

      // Redirect to dashboard with token in URL fragment (client-side reads it)
      const dashboardUrl = `${env.APP_URL}/dashboard#token=${authToken}`;
      return new Response(null, {
        status: 302,
        headers: { 'Location': dashboardUrl }
      });
    }

    // ==================== AFFILIATE: STATS ====================
    if (route === '/affiliate/stats' && method === 'GET') {
      // Get user from auth header
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyJWT(token, env.JWT_SECRET);
      if (!payload) {
        return jsonResponse({ error: 'Invalid token' }, 401);
      }

      const userId = payload.userId;

      // Get affiliate stats
      const totalConversions = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM affiliate_transactions WHERE referrer_user_id = ? AND status != 'CANCELLED'"
      ).bind(userId).first();

      const totalCommission = await env.DB.prepare(
        "SELECT COALESCE(SUM(commission_amount), 0) as total FROM affiliate_transactions WHERE referrer_user_id = ? AND status != 'CANCELLED'"
      ).bind(userId).first();

      const availableCommission = await env.DB.prepare(
        "SELECT COALESCE(SUM(commission_amount), 0) as total FROM affiliate_transactions WHERE referrer_user_id = ? AND status = 'AVAILABLE'"
      ).bind(userId).first();

      const pendingCommission = await env.DB.prepare(
        "SELECT COALESCE(SUM(commission_amount), 0) as total FROM affiliate_transactions WHERE referrer_user_id = ? AND status = 'PENDING'"
      ).bind(userId).first();

      // Get click count
      let totalClicks = 0;
      try {
        const clickCount = await env.DB.prepare(
          "SELECT COUNT(*) as count FROM affiliate_clicks WHERE referral_code = ?"
        ).bind(userId).first();
        totalClicks = clickCount?.count || 0;
      } catch (e) {
        // Table might not exist yet
        console.log('Click tracking not available:', e);
      }

      // Get recent conversions
      const conversions = await env.DB.prepare(
        `SELECT at.*, o.product_title, o.amount as order_amount 
         FROM affiliate_transactions at 
         JOIN orders o ON at.order_id = o.id 
         WHERE at.referrer_user_id = ? 
         ORDER BY at.created_at DESC 
         LIMIT 10`
      ).bind(userId).all();

      return jsonResponse({
        referralLink: `${env.APP_URL || 'https://asridigital.com'}?ref=${userId}`,
        totalClicks: totalClicks,
        totalConversions: totalConversions?.count || 0,
        totalCommission: totalCommission?.total || 0,
        availableCommission: availableCommission?.total || 0,
        pendingCommission: pendingCommission?.total || 0,
        conversions: conversions.results || []
      });
    }

    // ==================== AFFILIATE: WITHDRAW ====================
    if (route === '/affiliate/withdraw' && method === 'POST') {
      // Get user from auth header
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyJWT(token, env.JWT_SECRET);
      if (!payload) {
        return jsonResponse({ error: 'Invalid token' }, 401);
      }

      const userId = payload.userId;
      const { amount, bankName, accountNumber, accountName } = await request.json();

      // Validate minimum withdrawal
      if (amount < 100000) {
        return jsonResponse({ error: 'Minimum withdraw Rp 100.000' }, 400);
      }

      // Check available balance
      const available = await env.DB.prepare(
        "SELECT COALESCE(SUM(commission_amount), 0) as total FROM affiliate_transactions WHERE referrer_user_id = ? AND status = 'AVAILABLE'"
      ).bind(userId).first();

      if (!available || available.total < amount) {
        return jsonResponse({ error: 'Saldo tidak mencukupi' }, 400);
      }

      // Create withdrawal request (mark transactions as processing)
      const withdrawId = generateId();
      
      // Update affiliate transactions status to PROCESSING
      await env.DB.prepare(
        `UPDATE affiliate_transactions 
         SET status = 'PROCESSING', paid_out_at = datetime('now'), payout_method = 'BANK_TRANSFER', payout_details = ?
         WHERE referrer_user_id = ? AND status = 'AVAILABLE'`
      ).bind(
        JSON.stringify({ bank: bankName, account_number: accountNumber, account_name: accountName }),
        userId
      ).run();

      return jsonResponse({ 
        success: true, 
        withdrawalId,
        message: 'Permintaan withdraw sedang diproses' 
      });
    }

    // ==================== COUPON VALIDATE (GET) ====================
    if (route === '/coupon' && method === 'GET') {
      const code = url.searchParams.get('code');
      if (!code) {
        return jsonResponse({ error: 'Code parameter required' }, 400);
      }

      const coupon = await env.DB.prepare(
        'SELECT * FROM coupons WHERE code = ? AND is_active = 1'
      ).bind(code.toUpperCase()).first();

      if (!coupon) {
        return jsonResponse({ valid: false, message: 'Kupon tidak ditemukan' });
      }

      const now = new Date().toISOString();
      if (coupon.expires_at && coupon.expires_at < now) {
        return jsonResponse({ valid: false, message: 'Kupon sudah kedaluwarsa' });
      }

      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        return jsonResponse({ valid: false, message: 'Kupon sudah habis' });
      }

      return jsonResponse({
        valid: true,
        code: coupon.code,
        discountPercent: coupon.type === 'PERCENTAGE' ? coupon.value : null,
        discountAmount: coupon.type === 'FIXED' ? coupon.value : null,
        message: 'Kupon valid'
      });
    }

    // ==================== ADMIN: UPDATE ADMIN CREDENTIALS ====================
    if (route === '/admin/update-credentials' && method === 'POST') {
      // Check for special authorization (one-time use)
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.includes('UPDATE_ADMIN_NOW')) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }

      try {
        const encoder = new TextEncoder();
        const password = 'Masajidallah13!';

        // Generate salt
        const salt = crypto.getRandomValues(new Uint8Array(16));

        // Import password as key
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(password),
          { name: 'PBKDF2' },
          false,
          ['deriveBits']
        );

        // Derive hash
        const hash = await crypto.subtle.deriveBits(
          {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
          },
          key,
          256
        );

        // Convert to hex
        const hashArray = Array.from(new Uint8Array(hash));
        const saltArray = Array.from(salt);
        const combined = [...saltArray, ...hashArray];
        const passwordHash = combined.map(b => b.toString(16).padStart(2, '0')).join('');

        // Update user
        const result = await env.DB.prepare(
          `UPDATE users
           SET email = ?, password = ?, updated_at = datetime('now')
           WHERE id = 'user-admin' OR email = 'admin@asridigital.com' OR email = 'ahmadasrizalmi@gmail.com'`
        )
          .bind('ahmadasrizalmi@gmail.com', passwordHash)
          .run();

        return jsonResponse({
          success: true,
          message: 'Admin user updated successfully',
          newEmail: 'ahmadasrizalmi@gmail.com',
          changes: result.meta.changes
        });
      } catch (error: any) {
        console.error('Error updating admin:', error);
        return jsonResponse({ error: 'Terjadi kesalahan pada server. Silakan coba lagi.' }, 500);
      }
    }

    // ==================== CONTACT FORM ====================
    if (route === '/contact' && method === 'POST') {
      const body = await request.json();
      const { name, email, subject, message } = body;

      if (!name || !email || !message) {
        return jsonResponse({ error: 'Nama, email, dan pesan wajib diisi' }, 400);
      }

      const sanitizedName = sanitizeInput(name);
      const sanitizedEmail = sanitizeInput(email).toLowerCase();
      const sanitizedSubject = sanitizeInput(subject || 'Pesan dari Kontak');
      const sanitizedMessage = sanitizeInput(message);

      if (!isValidEmail(sanitizedEmail)) {
        return jsonResponse({ error: 'Format email tidak valid' }, 400);
      }

      // Store in DB
      try {
        await env.DB.prepare(
          `INSERT INTO contact_messages (id, name, email, subject, message, is_read, created_at)
           VALUES (?, ?, ?, ?, ?, 0, datetime('now'))`
        ).bind(generateId(), sanitizedName, sanitizedEmail, sanitizedSubject, sanitizedMessage).run();
      } catch (dbErr) {
        // Table might not exist, create it
        try {
          await env.DB.prepare(
            `CREATE TABLE IF NOT EXISTS contact_messages (
              id TEXT PRIMARY KEY, name TEXT, email TEXT, subject TEXT, message TEXT, is_read INTEGER DEFAULT 0, created_at TEXT
            )`
          ).run();
          await env.DB.prepare(
            `INSERT INTO contact_messages (id, name, email, subject, message, is_read, created_at)
             VALUES (?, ?, ?, ?, ?, 0, datetime('now'))`
          ).bind(generateId(), sanitizedName, sanitizedEmail, sanitizedSubject, sanitizedMessage).run();
        } catch (e) {
          console.error('Contact form DB error:', e);
        }
      }

      // Send email notification
      try {
        if (env.RESEND_KEY && !env.RESEND_KEY.startsWith('re_your_')) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.RESEND_KEY}` },
            body: JSON.stringify({
              from: 'Asri Digital <noreply@asridigital.com>',
              to: 'ahmadasrizalmi@gmail.com',
              subject: `[Kontak] ${sanitizedSubject} - dari ${sanitizedName}`,
              html: `<p><strong>Dari:</strong> ${sanitizedName} (${sanitizedEmail})</p><p><strong>Pesan:</strong></p><p>${sanitizedMessage.replace(/\n/g, '<br>')}</p>`
            })
          });
        }
      } catch (emailErr) {
        console.error('Contact email error:', emailErr);
      }

      return jsonResponse({ success: true, message: 'Pesan berhasil dikirim' });
    }

    // ==================== ADMIN: CONTACT MESSAGES ====================
    if (route === '/admin/contacts' && method === 'GET') {
      try {
        const messages = await env.DB.prepare(
          'SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100'
        ).all();
        return jsonResponse({ messages: messages.results || [] });
      } catch (e) {
        return jsonResponse({ messages: [] });
      }
    }

    if (route.startsWith('/admin/contacts/') && method === 'PUT') {
      const msgId = route.split('/')[3];
      await env.DB.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').bind(msgId).run();
      triggerDeploy(env);
      return jsonResponse({ success: true, deploy_triggered: true });
    }

    if (route.startsWith('/admin/contacts/') && method === 'DELETE') {
      const msgId = route.split('/')[3];
      await env.DB.prepare('DELETE FROM contact_messages WHERE id = ?').bind(msgId).run();
      triggerDeploy(env);
      return jsonResponse({ success: true, deploy_triggered: true });
    }

    // ==================== ADMIN: AFFILIATES CRUD ====================
    if (route === '/admin/affiliates' && method === 'GET') {
      try {
        const affiliates = await env.DB.prepare(
          `SELECT u.id, u.email, u.name, u.created_at,
            (SELECT COUNT(*) FROM affiliate_transactions WHERE referrer_user_id = u.id) as total_transactions,
            (SELECT COALESCE(SUM(commission_amount), 0) FROM affiliate_transactions WHERE referrer_user_id = u.id) as total_commission,
            (SELECT COALESCE(SUM(commission_amount), 0) FROM affiliate_transactions WHERE referrer_user_id = u.id AND status = 'PAID') as paid_commission
           FROM users u WHERE u.role = 'affiliate' OR u.id IN (SELECT DISTINCT referrer_user_id FROM affiliate_transactions)
           ORDER BY total_commission DESC`
        ).all();

        const stats = await env.DB.prepare(
          `SELECT COUNT(DISTINCT referrer_user_id) as total_affiliates,
            COALESCE(SUM(commission_amount), 0) as total_commission,
            COUNT(*) as total_transactions
           FROM affiliate_transactions`
        ).first();

        return jsonResponse({ affiliates: affiliates.results || [], stats: stats || { total_affiliates: 0, total_commission: 0, total_transactions: 0 } });
      } catch (e) {
        console.error('Affiliates error:', e);
        return jsonResponse({ affiliates: [], stats: { total_affiliates: 0, total_commission: 0, total_transactions: 0 } });
      }
    }

    if (route === '/admin/affiliates' && method === 'POST') {
      const body = await request.json();
      const { user_id, commission_percent } = body;

      if (!user_id) {
        return jsonResponse({ error: 'User ID wajib diisi' }, 400);
      }

      // Set user role to affiliate
      await env.DB.prepare('UPDATE users SET role = ? WHERE id = ?')
        .bind('affiliate', user_id).run();

      // Update commission percent in settings if provided
      if (commission_percent) {
        await env.DB.prepare(
          `INSERT INTO site_settings (key, value, updated_at) VALUES ('commission_percent', ?, datetime('now'))
           ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`
        ).bind(String(commission_percent), String(commission_percent)).run();
      }

      return jsonResponse({ success: true });
    }

    if (route.startsWith('/admin/affiliates/') && method === 'DELETE') {
      const userId = route.split('/')[3];
      await env.DB.prepare('UPDATE users SET role = ? WHERE id = ?')
        .bind('user', userId).run();
      return jsonResponse({ success: true });
    }

    // ==================== ADMIN: USERS LIST (for affiliate dropdown) ====================
    if (route === '/admin/users' && method === 'GET') {
      const users = await env.DB.prepare(
        'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC LIMIT 100'
      ).all();
      return jsonResponse({ users: users.results || [] });
    }

    // ==================== ADMIN: SUBSCRIBERS LIST ====================
    if (route === '/admin/subscribers' && method === 'GET') {
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const status = url.searchParams.get('status') || 'all';
      const search = url.searchParams.get('search') || '';
      const offset = (page - 1) * limit;
      let whereClause = '1=1';
      const bindings: any[] = [];
      if (status === 'active') whereClause += ' AND is_active = 1';
      else if (status === 'unsubscribed') whereClause += ' AND is_active = 0';
      if (search) { whereClause += ' AND (email LIKE ? OR name LIKE ? OR whatsapp LIKE ?)'; bindings.push(`%${search}%`, `%${search}%`, `%${search}%`); }
      const countResult = await env.DB.prepare(`SELECT COUNT(*) as total FROM subscribers WHERE ${whereClause}`).bind(...bindings).first();
      const subscribers = await env.DB.prepare(`SELECT * FROM subscribers WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...bindings, limit, offset).all();
      return jsonResponse({ subscribers: subscribers.results, total: countResult?.total || 0, page, limit, totalPages: Math.ceil((countResult?.total || 0) / limit) });
    }

    // ==================== ADMIN: UPDATE SUBSCRIBER ====================
    if (route.startsWith('/admin/subscribers/') && route.split('/').length === 4 && method === 'PATCH') {
      const subscriberId = route.split('/')[3];
      const body = await request.json();
      const updates: string[] = [];
      const vals: any[] = [];
      if (body.is_active !== undefined) { updates.push('is_active = ?'); vals.push(body.is_active); updates.push(body.is_active ? 'unsubscribed_at = NULL' : "unsubscribed_at = datetime('now')"); }
      if (body.email_notifications !== undefined) { updates.push('email_notifications = ?'); vals.push(body.email_notifications); }
      if (body.whatsapp_notifications !== undefined) { updates.push('whatsapp_notifications = ?'); vals.push(body.whatsapp_notifications); }
      updates.push("updated_at = datetime('now')"); vals.push(subscriberId);
      await env.DB.prepare(`UPDATE subscribers SET ${updates.join(', ')} WHERE id = ?`).bind(...vals).run();
      return jsonResponse({ success: true });
    }

    // ==================== ADMIN: SUBSCRIBER STATS ====================
    if (route === '/admin/subscribers/stats' && method === 'GET') {
      const total = await env.DB.prepare('SELECT COUNT(*) as count FROM subscribers WHERE is_active = 1').first();
      const thisWeek = await env.DB.prepare("SELECT COUNT(*) as count FROM subscribers WHERE is_active = 1 AND created_at >= datetime('now', '-7 days')").first();
      const thisMonth = await env.DB.prepare("SELECT COUNT(*) as count FROM subscribers WHERE is_active = 1 AND created_at >= datetime('now', '-30 days')").first();
      return jsonResponse({ totalActive: total?.count || 0, newThisWeek: thisWeek?.count || 0, newThisMonth: thisMonth?.count || 0 });
    }

    // ==================== ADMIN: NOTIFY SUBSCRIBERS (new product) ====================
    if (route === '/admin/notify-subscribers' && method === 'POST') {
      const body = await request.json();
      const { product_id } = body;

      if (!product_id) {
        return jsonResponse({ error: 'product_id wajib diisi' }, 400);
      }

      // Fetch product details
      const product = await env.DB.prepare(
        'SELECT id, title, slug, description, short_description, price, image_icon, category FROM products WHERE id = ?'
      ).bind(product_id).first();

      if (!product) {
        return jsonResponse({ error: 'Produk tidak ditemukan' }, 404);
      }

      // Fetch all active subscribers
      const subscribers = await env.DB.prepare(
        'SELECT id, email, name FROM subscribers WHERE is_active = 1'
      ).all();

      if (!subscribers.results || subscribers.results.length === 0) {
        return jsonResponse({ success: true, sent: 0, message: 'Tidak ada subscriber aktif' });
      }

      // Send notification to each subscriber
      let sentCount = 0;
      let failedCount = 0;
      const productUrl = `${env.APP_URL}/product/${product.slug}`;

      for (const sub of subscribers.results as any[]) {
        try {
          await sendSubscriberNewProductEmail(env, {
            to_email: sub.email,
            to_name: sub.name || 'Sobat Asri',
            product_title: product.title,
            product_description: product.short_description || product.description || '',
            product_price: product.price,
            product_image: product.image_icon,
            product_url: productUrl,
            product_category: product.category,
          });
          sentCount++;
        } catch (e: any) {
          console.error(`Failed to send to ${sub.email}:`, e.message);
          failedCount++;
        }
      }

      return jsonResponse({
        success: true,
        sent: sentCount,
        failed: failedCount,
        total: subscribers.results.length,
        message: `Notifikasi terkirim ke ${sentCount} subscriber${sentCount !== 1 ? 's' : ''}`
      });
    }

    // ==================== DEFAULT 404 ====================
    return jsonResponse({ error: 'Endpoint not found' }, 404);

  } catch (error: any) {
    console.error('API Error:', error);
    console.error('API Error stack:', error.stack);
    return jsonResponse({ error: 'Terjadi kesalahan pada server. Silakan coba lagi.' }, 500);
  }
}

// Telegram notification helper
async function notifyTelegram(env: Env, message: string) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.log('Telegram not configured, skipping notification');
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });
  } catch (e: any) {
    console.error('Telegram notification failed:', e.message);
  }
}

// Email helper function
async function sendOrderConfirmationEmail(env: Env, order: any, magicToken?: string, userPassword?: string) {
  if (!env.RESEND_KEY || env.RESEND_KEY.startsWith('re_your_')) {
    console.log('Resend API key not configured, skipping email');
    return;
  }

  // Check if auto_email is enabled in settings
  try {
    const autoEmailSetting = await env.DB.prepare(
      "SELECT value FROM site_settings WHERE key = 'auto_email'"
    ).first();
    if (autoEmailSetting && autoEmailSetting.value === 'false') {
      console.log('Auto email disabled in settings, skipping email');
      return;
    }
  } catch (e) {
    // If settings check fails, continue sending (fail-open)
  }

  // Read from_email and from_name from settings
  let fromName = 'Asri Digital';
  let fromEmail = 'noreply@asridigital.com';
  try {
    const fromNameSetting = await env.DB.prepare("SELECT value FROM site_settings WHERE key = 'from_name'").first();
    const fromEmailSetting = await env.DB.prepare("SELECT value FROM site_settings WHERE key = 'from_email'").first();
    if (fromNameSetting?.value) fromName = fromNameSetting.value;
    if (fromEmailSetting?.value) fromEmail = fromEmailSetting.value;
  } catch (e) {}

  const fromAddress = `${fromName} <${fromEmail}>`;

  const isAllAccess = order.product_id === 'ALL-ACCESS';
  const dashboardUrl = magicToken
    ? `${env.APP_URL}/api/auth/magic-login?token=${magicToken}`
    : `${env.APP_URL}/dashboard`;
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
            <a href="${dashboardUrl}" style="display: inline-block; background-color: #5C7A36; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Buka Dashboard →
            </a>
          </div>
          
          ${userPassword ? `
          <!-- Login Credentials -->
          <div style="background-color: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="color: #92400e; font-size: 14px; font-weight: 600; margin: 0 0 8px;">🔐 Info Login Anda</p>
            <p style="color: #78350f; font-size: 13px; margin: 0; line-height: 1.6;">
              <strong>Email:</strong> ${order.user_email}<br/>
              <strong>Password:</strong> <code style="background: #fef3c7; padding: 2px 6px; border-radius: 4px;">${userPassword}</code>
            </p>
            <p style="color: #92400e; font-size: 12px; margin: 8px 0 0;">Simpan info ini atau ganti password Anda di Dashboard.</p>
          </div>
          ` : ''}
          
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
      'Authorization': `Bearer ${env.RESEND_KEY}`
    },
    body: JSON.stringify({
      from: fromAddress,
      to: order.user_email,
      subject,
      html
    })
  });

  const result = await response.json() as any;

  // Log email (best effort) — check response status
  const emailStatus = response.ok ? 'SENT' : 'FAILED';
  const errorMsg = response.ok ? null : (result?.message || result?.error || `HTTP ${response.status}`);
  
  try {
    await env.DB.prepare(
      `INSERT INTO email_logs (to_email, subject, type, status, error_message, sent_at)
       VALUES (?, ?, 'ORDER_CONFIRMATION', ?, ?, datetime('now'))`
    )
      .bind(order.user_email, subject, emailStatus, errorMsg)
      .run();
  } catch (logErr) {
    console.error('Email log insert failed:', logErr);
  }

  if (!response.ok) {
    console.error(`Email send failed: ${response.status} - ${JSON.stringify(result)}`);
  }

  return result;
}

// Email helper function for free products
async function sendFreeProductEmail(env: Env, order: any) {
  if (!env.RESEND_KEY || env.RESEND_KEY.startsWith('re_your_')) return;
  const subject = `🎁 Produk Gratis Anda - ${order.product_title}`;
  const downloadLink = order.download_url || `${env.APP_URL}/dashboard`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:sans-serif;background:#f5f5f5;"><div style="max-width:600px;margin:0 auto;background:#fff;"><div style="background:linear-gradient(135deg,#10b981,#f59e0b);padding:32px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:24px;">🎁 Produk Gratis Anda!</h1></div><div style="padding:32px;"><p style="color:#171717;font-size:16px;">Halo <strong>${order.user_name}</strong>,</p><p style="color:#525252;">Terima kasih telah mengunduh produk gratis kami!</p><div style="background:#f0fdf4;border-left:4px solid #10b981;border-radius:8px;padding:20px;margin:24px 0;"><h3 style="color:#10b981;margin:0 0 8px;">${order.product_title}</h3><p style="color:#525252;margin:0;font-size:14px;">Order ID: ${order.id}</p></div><div style="text-align:center;margin:32px 0;"><a href="${downloadLink}" style="display:inline-block;background:linear-gradient(135deg,#10b981,#f59e0b);color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:600;">Download Sekarang →</a></div><p style="color:#737373;font-size:14px;text-align:center;">Anda akan mendapat notifikasi saat produk baru dirilis. 📬</p></div><div style="background:#f5f5f5;padding:24px;text-align:center;border-top:1px solid #e5e5e5;"><p style="color:#a3a3a3;font-size:12px;margin:0;">© 2026 Asri Digital</p></div></div></body></html>`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.RESEND_KEY}` },
    body: JSON.stringify({ from: 'Asri Digital <noreply@asridigital.com>', to: order.user_email, subject, html })
  });
  const result = await response.json() as any;
  try { await env.DB.prepare(`INSERT INTO email_logs (to_email, subject, type, status, sent_at) VALUES (?, ?, 'FREE_PRODUCT', 'SENT', datetime('now'))`).bind(order.user_email, subject).run(); } catch(e) {}
  return result;
}

// Email helper: notify subscriber about new product
async function sendSubscriberNewProductEmail(env: Env, data: {
  to_email: string;
  to_name: string;
  product_title: string;
  product_description: string;
  product_price: number;
  product_image: string;
  product_url: string;
  product_category: string;
}) {
  if (!env.RESEND_KEY || env.RESEND_KEY.startsWith('re_your_')) return;

  const priceDisplay = data.product_price === 0 ? 'GRATIS' : `Rp ${Number(data.product_price).toLocaleString('id-ID')}`;
  const subject = `🆕 Produk Baru: ${data.product_title}`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <!-- Header -->
    <div style="background:#5C7A36;padding:28px 32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:600;letter-spacing:-0.01em;">Asri Digital</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">Produk Baru Untuk Anda</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#18181b;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Halo <strong>${data.to_name}</strong>,
      </p>
      <p style="color:#3f3f46;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Kami baru saja merilis produk baru yang mungkin Anda minati:
      </p>

      <!-- Product Card -->
      <div style="border:1px solid #e4e4e7;border-radius:10px;overflow:hidden;margin:0 0 24px;">
        <div style="background:#fafafa;padding:20px;text-align:center;">
          <span style="display:inline-block;background:#5C7A36;color:#fff;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.03em;">${data.product_category}</span>
        </div>
        <div style="padding:20px 24px;">
          <h2 style="color:#18181b;font-size:17px;font-weight:600;margin:0 0 8px;line-height:1.3;">${data.product_title}</h2>
          <p style="color:#525252;font-size:14px;line-height:1.5;margin:0 0 16px;">${data.product_description.substring(0, 150)}${data.product_description.length > 150 ? '...' : ''}</p>
          <p style="color:#5C7A36;font-size:18px;font-weight:700;margin:0;">${priceDisplay}</p>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${data.product_url}" style="display:inline-block;background:#5C7A36;color:#ffffff;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          Lihat Produk →
        </a>
      </div>

      <p style="color:#a1a1aa;font-size:13px;line-height:1.5;margin:0;text-align:center;">
        Anda menerima email ini karena terdaftar sebagai subscriber Asri Digital.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f4f4f5;padding:20px 32px;text-align:center;border-top:1px solid #e4e4e7;">
      <p style="color:#a1a1aa;font-size:12px;margin:0;">© 2026 Asri Digital. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.RESEND_KEY}`
    },
    body: JSON.stringify({
      from: 'Asri Digital <noreply@asridigital.com>',
      to: data.to_email,
      subject,
      html
    })
  });

  const result = await response.json() as any;
  const emailStatus = response.ok ? 'SENT' : 'FAILED';
  const errorMsg = response.ok ? null : (result?.message || result?.error || `HTTP ${response.status}`);

  try {
    await env.DB.prepare(
      `INSERT INTO email_logs (to_email, subject, type, status, error_message, sent_at)
       VALUES (?, ?, 'NEW_PRODUCT_NOTIFY', ?, ?, datetime('now'))`
    ).bind(data.to_email, subject, emailStatus, errorMsg).run();
  } catch (e) {
    console.error('Email log insert failed:', e);
  }

  if (!response.ok) {
    throw new Error(`Email send failed: ${response.status} - ${JSON.stringify(result)}`);
  }

  return result;
}
