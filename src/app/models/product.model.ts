export interface ProductVariant {
  id: string;
  name: string;
  stock: number;
  price: number;
  sku: string;
}

export interface Product {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  categoryLabel: 'Wajah' | 'Tubuh' | 'Makeup' | 'Paket Ritual' | 'Aksesoris' | 'Semua';
  productType: string;
  status: 'Active' | 'Draft' | 'Archived';
  inventory: number;
  variantsCount: number;
  variants: ProductVariant[];
  channels: number;
  catalogs: number;
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  badge?: string;
  bpomNumber: string;
  accentColor: string;
  image: string;
  handle: string;
  heroTagline: string;
  description: string;
  benefits: string[];
  keyIngredients: string[];
  howToUse: string[];
  isFeatured?: boolean;
  isFlashSale?: boolean;
  costPrice?: number;
}

export interface ReviewItem {
  id: string;
  author: string;
  avatar: string;
  city: string;
  rating: number;
  productName: string;
  comment: string;
  verified: boolean;
  timeAgo: string;
  skinType: string;
}

export interface RitualStep {
  step: string;
  product: Product;
}

export interface Ritual {
  key: 'am' | 'pm';
  label: string;
  time: string;
  title: string;
  image: string;
  hour: number;
  steps: RitualStep[];
}

export interface CategoryItem {
  name: string;
  note: string;
  image: string;
  categoryLabel: 'Wajah' | 'Tubuh' | 'Makeup' | 'Paket Ritual' | 'Semua';
}
