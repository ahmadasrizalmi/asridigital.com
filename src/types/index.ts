// Types for the application

export interface User {
  id: string;
  email: string;
  name: string | null;
  isAllAccess: boolean;
  createdAt: Date;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  gptUrl: string | null;
  imageIcon: string | null;
  category: string;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export interface Order {
  id: string;
  userId: string;
  productId: string;
  dompetxRefId: string;
  amount: number;
  originalAmount: number | null;
  discountAmount: number;
  couponCode: string | null;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paidAt: Date | null;
  referredBy: string | null;
  paymentMethod: string | null;
  paymentChannel: string | null;
  customerEmail: string;
  customerName: string | null;
  customerPhone: string | null;
  createdAt: Date;
  product?: Product;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountPercent: number;
  discountAmount: number | null;
  maxUses: number;
  usedCount: number;
  minOrderAmount: number;
  validFrom: Date | null;
  validUntil: Date | null;
  isActive: boolean;
  appliesTo: string;
}

export interface Affiliate {
  id: string;
  orderId: string;
  referredByUserId: string;
  referredUserId: string | null;
  commissionAmount: number;
  commissionPercent: number;
  status: 'PENDING' | 'AVAILABLE' | 'PAID_OUT' | 'CANCELLED';
  availableAt: Date | null;
  paidOutAt: Date | null;
  createdAt: Date;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  authorName: string | null;
  category: string;
  tags: string[];
  isPublished: boolean;
  publishedAt: Date | null;
  viewCount: number;
}

export interface SiteSettings {
  id: string;
  siteName: string;
  siteTagline: string | null;
  commissionPercent: number;
  allAccessProductId: string | null;
  maintenanceMode: boolean;
}

export interface CheckoutPayload {
  productId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  couponCode?: string;
  paymentMethod: string;
  referredBy?: string;
}

export interface DompetXCreateTransaction {
  ref_id: string;
  amount: number;
  payment_method: string;
  customer_name: string;
  customer_email: string;
  description: string;
  callback_url: string;
  return_url: string;
}

export interface DompetXWebhookPayload {
  ref_id: string;
  status: string;
  amount: number;
  payment_method: string;
  paid_at: string;
  signature: string;
}

export interface RecentSale {
  firstName: string;
  productName: string;
  timeAgo: string;
}
