// Temporary endpoint to update admin credentials (no auth for one-time use)
export async function onRequestPost(context: any) {
  const { env } = context;

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
       WHERE email = 'admin@asridigital.com' OR email = 'ahmadasrizalmi@gmail.com'`
    )
      .bind('ahmadasrizalmi@gmail.com', passwordHash)
      .run();

    // Verify update
    const updatedUser = await env.DB.prepare(
      'SELECT id, email, name FROM users WHERE email = ?'
    )
      .bind('ahmadasrizalmi@gmail.com')
      .first();

    return new Response(JSON.stringify({
      success: true,
      message: 'Admin user updated successfully!',
      newEmail: 'ahmadasrizalmi@gmail.com',
      updatedUser,
      changes: result.meta.changes
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Update failed',
      details: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}