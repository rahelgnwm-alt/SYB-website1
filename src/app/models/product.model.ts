export const MAX_PRODUCT_IMAGES = 10;

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
  gallery?: string[];
  handle: string;
  heroTagline: string;
  description: string;
  benefits: string[];
  keyIngredients: string[];
  howToUse: string[];
  isFeatured?: boolean;
  isFlashSale?: boolean;
  isPreOrder?: boolean;
  preOrderDays?: number;
  preOrderNote?: string;
  costPrice?: number;
  flashSalePrice?: number;
  flashSaleDiscount?: number;
  flashSaleQuota?: number;
}

export interface FlashSaleItem {
  productId: string;
  discountPercent: number;
  flashSalePrice?: number;
  quota?: number;
}

export interface FlashSaleSession {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string;   // YYYY-MM-DD
  endTime: string;   // HH:mm
  isActive: boolean;
  items: FlashSaleItem[];
  createdAt?: string;
}

export interface FlashSaleConfig {
  isActive: boolean;
  endHour: number; // 0-23 in WIB
  endMinute: number; // 0-59
  title: string;
  subtitle: string;
  targetTimestamp?: number | null;
  activeSessionId?: string | null;
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
