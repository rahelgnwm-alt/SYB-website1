export interface Product {
  id: string;
  name: string;
  tagline: string;
  image: string;
  gallery?: string[];
  price: number;
  compareAt: number;
  badge?: 'Best Seller' | 'New' | 'Bundling';
  handle: string;
  /** soft background tint behind the product photo */
  tint: string;
  isFlashSale?: boolean;
  isPreOrder?: boolean;
  preOrderDays?: number;
  preOrderNote?: string;
}

export const productUrl = (handle: string) => `/products/${handle}`;

/** Shared currency formatter for IDR (e.g. 'Rp46.060' or 'Rp 46.060'). */
export function formatRupiah(n: number, withSpace = false): string {
  return (withSpace ? 'Rp ' : 'Rp') + Math.round(n).toLocaleString('id-ID');
}

/** Format a number/string with Indonesian dot thousand separators (e.g. 50000 -> '50.000'). */
export function formatThousand(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === '') return '';
  const num = typeof n === 'number' ? Math.round(n) : parseInt(n.toString().replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('id-ID');
}

/** Parse a thousand-separator formatted string back to an integer. */
export function parseThousand(val: string | number | null | undefined): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const clean = val.toString().replace(/\D/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

/** Live-format a numeric text input with dot thousand separators and return the parsed integer (or null if empty). */
export function syncThousandInput(event: Event): number | null {
  const input = event.target as HTMLInputElement;
  const rawDigits = input.value.replace(/\D/g, '');
  if (!rawDigits) {
    input.value = '';
    return null;
  }
  const parsed = parseInt(rawDigits, 10);
  input.value = formatThousand(parsed);
  return parsed;
}

/** Shared discount percentage calculator for storefront products (`compareAt` vs `price`). */
export function calcDiscount(p: { price: number; compareAt: number }): number {
  if (!p.compareAt || p.compareAt <= p.price) return 0;
  return Math.round((1 - p.price / p.compareAt) * 100);
}

/** Shared discount percentage calculator for admin products (`originalPrice` vs `price`). */
export function calcAdminDiscountPercent(p: { price: number; originalPrice?: number }): number {
  if (!p.originalPrice || p.originalPrice <= 0) return 0;
  const diff = p.originalPrice - p.price;
  if (diff <= 0) return 0;
  return Math.round((diff / p.originalPrice) * 100);
}

/** Maximum number of photos allowed per product gallery. */
export const MAX_PRODUCT_IMAGES = 10;

/** Shared image URL normalizer with fallback. */
export function resolveImgUrl(path?: string, fallback = 'products/red-jelly-serum.jpg'): string {
  if (!path) return fallback;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  return path.replace(/^\//, '');
}

/**
 * Normalizes a product's photo gallery alongside its primary `image`,
 * keeping `primaryImage` first, deduplicating entries, and capping at `maxImages`.
 */
export function normalizeProductGallery(
  primaryImage?: string | null,
  rawGallery?: unknown,
  maxImages = MAX_PRODUCT_IMAGES,
): string[] {
  let list: string[] = [];
  if (Array.isArray(rawGallery)) {
    list = rawGallery.filter((item): item is string => typeof item === 'string');
  } else if (typeof rawGallery === 'string') {
    const trimmed = rawGallery.trim();
    if (trimmed) {
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            list = parsed.filter((item): item is string => typeof item === 'string');
          }
        } catch {
          list = [trimmed];
        }
      } else {
        list = [trimmed];
      }
    }
  }

  const normalized: string[] = [];
  const seen = new Set<string>();
  const pushUnique = (img?: string | null) => {
    const val = typeof img === 'string' ? img.trim() : '';
    if (!val || seen.has(val)) return;
    seen.add(val);
    normalized.push(val);
  };

  pushUnique(primaryImage);
  for (const item of list) {
    if (normalized.length >= maxImages) break;
    pushUnique(item);
  }

  return normalized.slice(0, maxImages);
}

/** Shared YYYY-MM-DD date string helper with optional day offset. */
export function getTodayDateString(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const PRODUCTS: Product[] = [];

export const byId = (id: string): Product | undefined => PRODUCTS.find((p) => p.id === id);

export interface RitualStep {
  step: string;
  productId: string;
  name: string;
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

export const RITUALS: Ritual[] = [
  {
    key: 'am',
    label: 'Ritual Pagi',
    time: '07:00',
    title: 'Fresh & Glowing',
    image: 'images/ritual-morning.jpg',
    hour: 7,
    steps: [
      { step: 'Prep', productId: 'aha-body-toner', name: 'AHA Skinboost Body Toner' },
      { step: 'Treat', productId: 'red-jelly-serum', name: 'FORTE Red Jelly Serum' },
      { step: 'Pop of color', productId: 'lip-cream-matte', name: 'Lip Cream Matte' },
    ],
  },
  {
    key: 'pm',
    label: 'Ritual Malam',
    time: '22:00',
    title: 'Calm & Recharge',
    image: 'images/ritual-night.jpg',
    hour: 22,
    steps: [
      { step: 'Exfoliate', productId: 'peeling-serum', name: 'Peeling Serum Vitamin C' },
      { step: 'Mask', productId: 'golden-egg-mask', name: 'Bright Glow Jelly Mask Golden Egg' },
      { step: 'Lip care', productId: 'lippy-oil-serum', name: 'Vitamin Lippy Oil Serum' },
    ],
  },
];

export interface CategoryItem {
  name: string;
  note: string;
  image: string;
  filter?: string;
  query?: string;
}

export const CATEGORIES: CategoryItem[] = [
  { name: 'Skin Care', note: 'Serum, toner & mask', image: 'products/red-jelly-serum.jpg', filter: 'all', query: 'serum' },
  { name: 'Make Up', note: 'Lip cream & blush', image: 'products/lip-cream-matte.jpg', filter: 'all', query: 'lip' },
  { name: 'Body Care', note: 'Body toner & serum', image: 'products/body-serum-booster.jpg', filter: 'all', query: 'body' },
  { name: 'Bundling', note: 'Hemat sampai 80%', image: 'products/glow-fresh-bundle.jpg', filter: 'bundling', query: '' },
];

export const PLACES = [
  'di kampus?',
  'di kantor?',
  'saat first date?',
  'di konser?',
  'di Bali?',
  'di nikahan bestie?',
  'di kafe?',
  'saat OOTD?',
];

export const INGREDIENTS = [
  'Niacinamide 10%',
  'DNA Salmon',
  'Glycolic Acid',
  'Vitamin C',
  'Jojoba Oil',
  'Collagen',
  'Sodium PCA',
  'Licorice Extract',
];
