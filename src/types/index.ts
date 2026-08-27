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
  galleryImages: string[] | null;
  galleryVideos: string[] | null;
  videoEmbedUrl: string | null;
  features: string[] | null;
  specs: Record<string, string> | null;
  faq: Array<{question: string; answer: string}> | null;
  category: string;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  isHot?: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductLicense {
  id: string;
  order_id: string | null;
  customer_email: string;
  customer_name: string;
  mosque_name: string;
  product_code: string;
  serial_id: string;
  license_key: string;
  status: 'active' | 'revoked' | 'refunded';
  issued_by: 'system' | 'admin_manual' | 'promo';
  note: string | null;
  created_at: number;
}

export interface LicenseGenerationRequest {
  mosque_name: string;
  customer_name: string;
  customer_email: string;
  note?: string;
  send_email?: boolean;
}

export interface LicenseGenerationResponse {
  success: boolean;
  license?: ProductLicense;
  error?: string;
}
