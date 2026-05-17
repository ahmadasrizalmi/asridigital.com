import type { APIRoute } from 'astro';
import { getDB } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signJWT, setAuthCookie } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies, redirect }) => {
  // If already logged in, redirect
  const token = cookies.get('token')?.value;
  if (token) {
    return redirect('/dashboard');
  }
  
  // Serve login page
  return new Response(loginPageHTML, {
    headers: { 'Content-Type': 'text/html' },
  });
};

export const POST: APIRoute = async ({ request, cookies, redirect, locals }) => {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return new Response(loginPageHTML.replace('<!-- ERROR -->', '<div class="bg-danger/20 border border-danger/30 text-danger px-4 py-3 rounded-lg mb-4">Email dan password wajib diisi</div>'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const env = locals?.runtime?.env || {};
    const db = getDB(env);
    
    // Find user
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (!user[0] || !user[0].passwordHash) {
      return new Response(loginPageHTML.replace('<!-- ERROR -->', '<div class="bg-danger/20 border border-danger/30 text-danger px-4 py-3 rounded-lg mb-4">Email atau password salah</div>'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user[0].passwordHash);
    if (!valid) {
      return new Response(loginPageHTML.replace('<!-- ERROR -->', '<div class="bg-danger/20 border border-danger/30 text-danger px-4 py-3 rounded-lg mb-4">Email atau password salah</div>'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Sign JWT
    const jwtSecret = env.JWT_SECRET || 'default-secret';
    const token = await signJWT({
      sub: user[0].id,
      email: user[0].email,
      name: user[0].name,
      isAllAccess: user[0].isAllAccess || false,
    }, jwtSecret);

    // Set cookie
    setAuthCookie(cookies, token);

    // Redirect based on role (admin or regular user)
    if (user[0].email === 'admin@asridigital.com') {
      return redirect('/admin');
    }
    return redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    return new Response(loginPageHTML.replace('<!-- ERROR -->', '<div class="bg-danger/20 border border-danger/30 text-danger px-4 py-3 rounded-lg mb-4">Terjadi kesalahan server</div>'), {
      headers: { 'Content-Type': 'text/html' },
    });
  }
};

const loginPageHTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login - Asri Digital</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0F172A; color: #F8FAFC; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .card { background: #1E293B; border: 1px solid #334155; border-radius: 16px; padding: 2rem; width: 100%; max-width: 400px; }
    .logo { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2rem; justify-content: center; }
    .logo svg { width: 32px; height: 32px; color: #4F46E5; }
    .logo span { font-size: 1.25rem; font-weight: bold; }
    h1 { text-align: center; font-size: 1.5rem; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94A3B8; font-size: 0.875rem; margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; color: #94A3B8; }
    input { width: 100%; padding: 0.75rem; background: #0F172A; border: 1px solid #334155; border-radius: 8px; color: #F8FAFC; font-size: 1rem; outline: none; transition: border-color 0.2s; }
    input:focus { border-color: #4F46E5; }
    button { width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
    button:hover { opacity: 0.9; }
    .links { text-align: center; margin-top: 1.5rem; font-size: 0.875rem; color: #94A3B8; }
    .links a { color: #4F46E5; text-decoration: none; }
    .links a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
      <span>Asri <span style="color:#4F46E5">Digital</span></span>
    </div>
    <h1>Selamat Datang 👋</h1>
    <p class="subtitle">Masuk ke akun Anda</p>
    <!-- ERROR -->
    <form method="POST">
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" placeholder="email@anda.com" required />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" placeholder="••••••••" required />
      </div>
      <button type="submit">Masuk</button>
    </form>
    <div class="links">
      Belum punya akun? <a href="/api/auth/register">Daftar sekarang</a>
    </div>
  </div>
</body>
</html>`;
