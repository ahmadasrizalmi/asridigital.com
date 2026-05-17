import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ============================================
// A. TABEL USERS
// ============================================
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // UUID v4
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"), // bcrypt hash
  isAllAccess: integer("is_all_access", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// B. TABEL PRODUCTS
// ============================================
export const products = sqliteTable("products", {
  id: text("id").primaryKey(), // UUID atau 'ALL-ACCESS'
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  shortDescription: text("short_description"),
  price: integer("price").notNull(), // in IDR
  compareAtPrice: integer("compare_at_price"), // Original price for discount display
  gptUrl: text("gpt_url"), // Link ke Custom GPT
  imageIcon: text("image_icon"), // URL gambar/icon produk
  category: text("category").default("general"),
  tags: text("tags"), // JSON array string
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  isFeatured: integer("is_featured", { mode: "boolean" }).default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// C. TABEL ORDERS
// ============================================
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(), // UUID v4
  userId: text("user_id").notNull().references(() => users.id),
  productId: text("product_id").notNull().references(() => products.id),
  dompetxRefId: text("dompetx_ref_id").notNull().unique(),
  amount: integer("amount").notNull(), // Final amount paid
  originalAmount: integer("original_amount"),
  discountAmount: integer("discount_amount").default(0),
  couponCode: text("coupon_code"),
  status: text("status").notNull().default("PENDING"), // PENDING, PAID, FAILED, REFUNDED
  paidAt: integer("paid_at", { mode: "timestamp" }),
  referredBy: text("referred_by"), // User ID affiliate referrer
  paymentMethod: text("payment_method"), // QRIS, VA_BCA, etc.
  paymentChannel: text("payment_channel"),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// D. TABEL COUPONS
// ============================================
export const coupons = sqliteTable("coupons", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountPercent: integer("discount_percent").notNull(),
  discountAmount: integer("discount_amount"),
  maxUses: integer("max_uses").notNull().default(100),
  usedCount: integer("used_count").notNull().default(0),
  minOrderAmount: integer("min_order_amount").default(0),
  validFrom: integer("valid_from", { mode: "timestamp" }),
  validUntil: integer("valid_until", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  appliesTo: text("applies_to").default("all"), // all, single, all-access
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// E. TABEL AFFILIATES
// ============================================
export const affiliates = sqliteTable("affiliates", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().unique().references(() => orders.id),
  referredByUserId: text("referred_by_user_id").notNull().references(() => users.id),
  referredUserId: text("referred_user_id").references(() => users.id),
  commissionAmount: integer("commission_amount").notNull(),
  commissionPercent: integer("commission_percent").default(10),
  status: text("status").notNull().default("PENDING"), // PENDING, AVAILABLE, PAID_OUT, CANCELLED
  availableAt: integer("available_at", { mode: "timestamp" }),
  paidOutAt: integer("paid_out_at", { mode: "timestamp" }),
  payoutMethod: text("payout_method"),
  payoutDetails: text("payout_details"), // JSON
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// F. TABEL BLOG POSTS
// ============================================
export const blogPosts = sqliteTable("blog_posts", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  authorId: text("author_id").references(() => users.id),
  authorName: text("author_name"),
  category: text("category").default("general"),
  tags: text("tags"), // JSON array
  isPublished: integer("is_published", { mode: "boolean" }).default(false),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  viewCount: integer("view_count").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// G. TABEL EMAIL LOGS
// ============================================
export const emailLogs = sqliteTable("email_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  orderId: text("order_id").references(() => orders.id),
  emailType: text("email_type").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  status: text("status").notNull().default("SENT"),
  resendId: text("resend_id"),
  errorMessage: text("error_message"),
  sentAt: integer("sent_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// H. TABEL SITE SETTINGS
// ============================================
export const siteSettings = sqliteTable("site_settings", {
  id: text("id").primaryKey().default("default"),
  siteName: text("site_name").default("Asri Digital"),
  siteTagline: text("site_tagline"),
  commissionPercent: integer("commission_percent").default(10),
  allAccessProductId: text("all_access_product_id"),
  maintenanceMode: integer("maintenance_mode", { mode: "boolean" }).default(false),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});
