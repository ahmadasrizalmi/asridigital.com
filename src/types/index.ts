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
