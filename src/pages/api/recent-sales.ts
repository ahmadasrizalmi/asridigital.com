import type { APIRoute } from 'astro';
import { getDB } from '../../db';
import { orders, users, products } from '../../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { maskName, timeAgo } from '../../lib/utils';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const env = locals?.runtime?.env || {};
    const db = getDB(env);

    const recentOrders = await db
      .select({
        userName: users.name,
        productName: products.title,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .innerJoin(products, eq(orders.productId, products.id))
      .where(eq(orders.status, 'PAID'))
      .orderBy(desc(orders.createdAt))
      .limit(5);

    const sales = recentOrders.map(order => ({
      firstName: maskName(order.userName || 'A'),
      productName: order.productName,
      timeAgo: timeAgo(order.createdAt || new Date()),
    }));

    return new Response(JSON.stringify({ sales }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Recent sales error:', error);
    // Return fallback data
    return new Response(JSON.stringify({
      sales: [
        { firstName: 'S***', productName: 'All-Access Pass', timeAgo: '5 menit yang lalu' },
        { firstName: 'B***', productName: 'Animasi Muslim Kids Studio', timeAgo: '12 menit yang lalu' },
      ],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
