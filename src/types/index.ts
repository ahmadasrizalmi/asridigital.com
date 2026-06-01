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
