import type { APIRoute } from 'astro';
import { getDB } from '../../../db';
import { siteSettings } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const env = locals?.runtime?.env || {};
    const db = getDB(env);

    const existing = await db.select().from(siteSettings).limit(1);

    if (existing[0]) {
      await db.update(siteSettings)
        .set({
          siteName: body.siteName,
          siteTagline: body.siteTagline,
          commissionPercent: body.commissionPercent,
          maintenanceMode: body.maintenanceMode,
          updatedAt: new Date(),
        })
        .where(eq(siteSettings.id, 'default'));
    } else {
      await db.insert(siteSettings).values({
        id: 'default',
        siteName: body.siteName,
        siteTagline: body.siteTagline,
        commissionPercent: body.commissionPercent,
        maintenanceMode: body.maintenanceMode,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Settings error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Gagal menyimpan' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
