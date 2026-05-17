import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { users, products, coupons, siteSettings } from './schema';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

const db = drizzle(createClient({ url: 'file:./dev.db' }), { schema });

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Create admin user
  const adminId = nanoid();
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  await db.insert(users).values({
    id: adminId,
    email: 'admin@asridigital.com',
    name: 'Admin Asri Digital',
    passwordHash: adminPassword,
    isAllAccess: true,
  }).onConflictDoNothing();
  console.log('✅ Admin user created: admin@asridigital.com / Admin123!');

  // 2. Create products
  const seedProducts = [
    {
      id: 'ALL-ACCESS',
      title: 'Lifetime All-Access Pass',
      slug: 'lifetime-all-access-pass',
      description: 'Akses seluruh Custom GPT yang ada saat ini dan semua update di masa depan. Sekali bayar, akses seumur hidup.',
      shortDescription: 'Akses unlimited ke semua Custom GPT. Sekali bayar, seumur hidup.',
      price: 299000,
      compareAtPrice: 599000,
      gptUrl: null,
      imageIcon: '/images/all-access-banner.jpg',
      category: 'membership',
      tags: JSON.stringify(['all-access', 'premium', 'best-value']),
      isActive: true,
      isFeatured: true,
      sortOrder: 0,
    },
    {
      id: 'gpt-animasi-muslim',
      title: 'Animasi Muslim Kids Studio',
      slug: 'animasi-muslim-kids-studio',
      description: 'GPT khusus untuk membuat konten animasi Islami untuk anak-anak. Cocok untuk content creator Muslim yang ingin membuat konten edukatif dan menghibur.',
      shortDescription: 'Buat konten animasi Islami untuk anak-anak dengan AI',
      price: 99000,
      compareAtPrice: 149000,
      gptUrl: 'https://chatgpt.com/g/g-6a06bc1c2e5481918d9767aa00048789-animasi-muslim-kids-studio',
      imageIcon: '/images/animasi-muslim.jpg',
      category: 'kreatif',
      tags: JSON.stringify(['animasi', 'islami', 'anak']),
      isActive: true,
      isFeatured: true,
      sortOrder: 1,
    },
    {
      id: 'gpt-sahabat-guru',
      title: 'Sahabat Guru PAUD Islami',
      slug: 'sahabat-guru-paud-islami',
      description: 'GPT asisten untuk guru PAUD Islami. Membantu membuat kurikulum, materi pembelajaran, dan aktivitas anak berbasis nilai-nilai Islam.',
      shortDescription: 'Asisten AI untuk guru PAUD Islami',
      price: 79000,
      gptUrl: 'https://chatgpt.com/g/g-6a06d28370f4819189acb6d1815a5df6-sahabat-guru-paud-islami',
      imageIcon: '/images/sahabat-guru.jpg',
      category: 'pendidikan',
      tags: JSON.stringify(['guru', 'paud', 'islami', 'pendidikan']),
      isActive: true,
      sortOrder: 2,
    },
  ];

  for (const product of seedProducts) {
    await db.insert(products).values(product).onConflictDoNothing();
  }
  console.log(`✅ ${seedProducts.length} products seeded`);

  // 3. Create coupons
  const seedCoupons = [
    {
      id: nanoid(),
      code: 'ASRIBOS',
      description: 'Launch promo 20% off',
      discountPercent: 20,
      maxUses: 100,
      validUntil: new Date('2026-12-31T23:59:59Z'),
      appliesTo: 'all',
    },
    {
      id: nanoid(),
      code: 'WELCOME10',
      description: 'New user 10% off',
      discountPercent: 10,
      maxUses: 500,
      validUntil: new Date('2026-12-31T23:59:59Z'),
      appliesTo: 'all',
    },
  ];

  for (const coupon of seedCoupons) {
    await db.insert(coupons).values(coupon).onConflictDoNothing();
  }
  console.log(`✅ ${seedCoupons.length} coupons seeded`);

  // 4. Create site settings
  await db.insert(siteSettings).values({
    id: 'default',
    siteName: 'Asri Digital',
    siteTagline: 'Custom GPT untuk Profesional Indonesia',
    commissionPercent: 10,
    allAccessProductId: 'ALL-ACCESS',
  }).onConflictDoNothing();
  console.log('✅ Site settings created');

  console.log('\n🎉 Seed complete!');
}

seed().catch(console.error);
