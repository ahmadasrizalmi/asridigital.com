// Update Admin User Credentials
// Run this via: POST /api/admin/update-admin

export async function onRequestPost(context: any) {
  const { request, env } = context;

  // Simple auth check (for security)
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== 'Bearer UPDATE_ADMIN_NOW') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Hash password "Masajidallah13!"
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
       WHERE id = 'user-admin' OR email = 'admin@asridigital.com'`
    )
      .bind('ahmadasrizalmi@gmail.com', passwordHash)
      .run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Admin user updated successfully',
      newEmail: 'ahmadasrizalmi@gmail.com',
      changes: result.meta.changes
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Update failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}