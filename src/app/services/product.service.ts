import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Product, ReviewItem, FlashSaleItem } from '../models/product.model';
import { Product as DataProduct, normalizeProductGallery } from '../data';
import { firstValueFrom } from 'rxjs';

const SQL_PRODUCTS_CACHE_KEY = 'syb_sql_products_cache';
const ADMIN_API_KEY = 'sybadmin2026';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);

  private readonly initialReviews: ReviewItem[] = [
    {
      id: 'rev-1',
      author: 'Clara Anindya',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      city: 'Jakarta Selatan',
      rating: 5,
      productName: 'FORTE Red Jelly Serum',
      comment: 'Udah botol ke-3! Tekstur jellynya beneran melting di kulit. Pori-pori aku yang tadinya kelihatan gede sekarang jadi samar banget!',
      verified: true,
      timeAgo: '2 hari lalu',
      skinType: 'Kombinasi & Kusam'
    },
    {
      id: 'rev-2',
      author: 'Nabila Putri S.',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
      city: 'Surabaya',
      rating: 5,
      productName: 'AHA Skinboost Body Toner',
      comment: 'Daki di leher dan siku langsung rontok di kapas pas pertama coba! Wanginya seger bgt kaya parfum mewah, wajib repurchase!',
      verified: true,
      timeAgo: '3 hari lalu',
      skinType: 'Kulit Tubuh Belang'
    },
    {
      id: 'rev-3',
      author: 'Tiara Maulida',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80',
      city: 'Bandung',
      rating: 5,
      productName: 'Paket Bundling Glow & Fresh',
      comment: 'Worth it parah buat harga segini dapet 3 produk kualitas juara! Packingnya super cute dapet pouch pink lagi!',
      verified: true,
      timeAgo: '5 hari lalu',
      skinType: 'Normal to Dry'
    },
    {
      id: 'rev-4',
      author: 'Felicia Tan',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
      city: 'Medan',
      rating: 5,
      productName: 'SYB Lip Cream Matte',
      comment: 'Shade 06 Terrable beneran MLBB terbaik buat undertone hangat. Ga bikin bibir kering ngelupas seharian dipakai makan!',
      verified: true,
      timeAgo: '1 minggu lalu',
      skinType: 'Bibir Kering'
    }
  ];

  // State Signals - No hardcoded product models!
  readonly products = signal<Product[]>(this.loadCachedProducts());
  readonly reviews = signal<ReviewItem[]>(this.initialReviews);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly preOrderProducts = computed(() =>
    this.products().filter((p) => Boolean(p.isPreOrder))
  );

  readonly defaultPreOrderDays = signal<number>(this.loadDefaultPreOrderDays());

  /**
   * Computed signal providing DataProduct objects directly for all storefront pages,
   * completely derived from the SQL database and synced with live discounts & flash sale.
   */
  readonly storefrontProducts = computed<DataProduct[]>(() => {
    return this.products()
      .filter((p) => p.status === 'Active')
      .map((p) => this.mapToDataProduct(p));
  });

  constructor() {
    // Automatically trigger SQL sync on initialization
    this.loadProducts();

    // Cross-tab real-time sync (e.g. Admin updates price in Tab 2, Storefront updates in Tab 1)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === SQL_PRODUCTS_CACHE_KEY && event.newValue) {
          try {
            const updated = JSON.parse(event.newValue);
            if (Array.isArray(updated) && updated.length > 0) {
              this.products.set(updated);
            }
          } catch {}
        }
      });
    }
  }

  /**
   * Map database Product entity to storefront DataProduct representation
   */
  private mapToDataProduct(p: Product): DataProduct {
    const gallery = normalizeProductGallery(p.image || 'products/red-jelly-serum.jpg', p.gallery);
    return {
      id: p.id,
      name: p.title,
      tagline: p.subtitle,
      image: gallery[0] || p.image || 'products/red-jelly-serum.jpg',
      gallery,
      price: p.price,
      compareAt: p.originalPrice || p.price,
      badge: (p.badge?.includes('Best Seller')
        ? 'Best Seller'
        : p.badge?.includes('New')
          ? 'New'
          : p.badge?.includes('Bundling')
            ? 'Bundling'
            : undefined) as any,
      handle: p.handle || p.id,
      tint: p.accentColor ? `${p.accentColor}1a` : '#ffe1ef',
      isFlashSale: Boolean(p.isFlashSale),
      isPreOrder: Boolean(p.isPreOrder),
      preOrderDays: p.preOrderDays || 7,
      preOrderNote: p.preOrderNote,
    };
  }

  /**
   * Central helper to enrich storefront `DataProduct` items with live admin pricing,
   * Flash Sale status, and Pre-Order settings.
   */
  enrichStorefrontProducts(items: DataProduct[], isFlashSaleLive = false): DataProduct[] {
    const liveMap = new Map(this.products().map((p) => [p.id, p]));
    return items.map((p) => {
      const live = liveMap.get(p.id);
      if (!live) {
        return { ...p, isFlashSale: false, isPreOrder: false };
      }
      return {
        ...p,
        price: live.price,
        compareAt: live.originalPrice || p.compareAt,
        isFlashSale: isFlashSaleLive && Boolean(live.isFlashSale),
        isPreOrder: Boolean(live.isPreOrder),
        preOrderDays: live.preOrderDays || 7,
        preOrderNote: live.preOrderNote,
      };
    });
  }

  private getApiUrl(path: string): string {
    if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
      return `${window.location.origin}${path.startsWith('/') ? '' : '/'}${path}`;
    }
    return `http://localhost:8000${path.startsWith('/') ? '' : '/'}${path}`;
  }

  /**
   * Fetch all products from SQL database via backend REST API
   */
  async loadProducts(force = false): Promise<Product[]> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const url = this.getApiUrl('/api/products?status=all');
      const res = await firstValueFrom(
        this.http.get<{ status: string; data: any[] }>(url)
      );
      if (res && res.status === 'success' && Array.isArray(res.data)) {
        const loaded: Product[] = res.data.map((item) => this.normalizeBackendProduct(item));
        this.products.set(loaded);
        this.cacheProducts(loaded);
        return loaded;
      }
    } catch (err: any) {
      console.warn('Backend /api/products request failed, using cached SQL catalog:', err?.message || err);
      this.error.set(err?.message || 'Gagal memuat produk dari server.');
    } finally {
      this.isLoading.set(false);
    }
    return this.products();
  }

  private normalizeBackendProduct(raw: any): Product {
    const benefits: string[] = Array.isArray(raw.benefits)
      ? raw.benefits
      : Array.isArray(raw.keyBenefits)
        ? raw.keyBenefits
        : typeof raw.key_benefits === 'string'
          ? JSON.parse(raw.key_benefits || '[]')
          : [];

    const keyIngredients: string[] = Array.isArray(raw.keyIngredients)
      ? raw.keyIngredients
      : typeof raw.key_ingredients === 'string'
        ? JSON.parse(raw.key_ingredients || '[]')
        : [];

    const howToUse: string[] = Array.isArray(raw.howToUse)
      ? raw.howToUse
      : typeof raw.how_to_use === 'string'
        ? JSON.parse(raw.how_to_use || '[]')
        : [];

    return {
      id: raw.id,
      title: raw.title || raw.name || '',
      subtitle: raw.subtitle || raw.tagline || '',
      category: raw.category || 'Kecantikan/Perawatan Wajah',
      categoryLabel: raw.categoryLabel || raw.category_label || 'Wajah',
      productType: raw.productType || raw.product_type || 'Serum',
      status: raw.status || 'Active',
      inventory: Number(raw.inventory) || 0,
      variantsCount: raw.variantsCount || (Array.isArray(raw.variants) ? raw.variants.length : 0),
      variants: Array.isArray(raw.variants) ? raw.variants : [],
      channels: Number(raw.channels) || 4,
      catalogs: Number(raw.catalogs) || 2,
      price: Number(raw.price) || 0,
      originalPrice: Number(raw.originalPrice ?? raw.original_price ?? raw.price) || 0,
      rating: Number(raw.rating) || 4.9,
      reviewsCount: Number(raw.reviewsCount ?? raw.reviews_count) || 120,
      badge: raw.badge || undefined,
      bpomNumber: raw.bpomNumber || raw.bpom_number || 'NA18210103429',
      accentColor: raw.accentColor || raw.accent_color || '#ff2a7a',
      image: raw.image || 'products/red-jelly-serum.jpg',
      gallery: normalizeProductGallery(raw.image || 'products/red-jelly-serum.jpg', raw.gallery),
      handle: raw.handle || raw.id,
      heroTagline: raw.heroTagline || raw.subtitle || '',
      description: raw.description || '',
      benefits,
      keyIngredients,
      howToUse,
      isFeatured: Boolean(raw.isFeatured || raw.is_featured),
      isFlashSale: Boolean(raw.isFlashSale || raw.is_flash_sale),
      isPreOrder: Boolean(raw.isPreOrder || raw.is_pre_order),
      preOrderDays: Number(raw.preOrderDays ?? raw.pre_order_days) || 7,
      preOrderNote: raw.preOrderNote || raw.pre_order_note,
      flashSalePrice: raw.flashSalePrice ?? raw.flash_sale_price ? Number(raw.flashSalePrice ?? raw.flash_sale_price) : undefined,
      flashSaleDiscount: raw.flashSaleDiscount ?? raw.flash_sale_discount ? Number(raw.flashSaleDiscount ?? raw.flash_sale_discount) : undefined,
      flashSaleQuota: raw.flashSaleQuota ?? raw.flash_sale_quota ? Number(raw.flashSaleQuota ?? raw.flash_sale_quota) : undefined,
    };
  }

  private loadCachedProducts(): Product[] {
    try {
      const saved = localStorage.getItem(SQL_PRODUCTS_CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return [];
  }

  private cacheProducts(products: Product[]): void {
    try {
      localStorage.setItem(SQL_PRODUCTS_CACHE_KEY, JSON.stringify(products));
    } catch {}
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Admin-Key': ADMIN_API_KEY,
    });
  }

  // Admin CRUD Methods connected to SQL Backend
  async addProduct(newProduct: Product): Promise<void> {
    this.products.update((current) => [newProduct, ...current]);
    this.cacheProducts(this.products());

    try {
      await firstValueFrom(
        this.http.post(this.getApiUrl('/api/products'), newProduct, { headers: this.getAuthHeaders() })
      );
    } catch (err) {
      console.error('Failed to save product to SQL database:', err);
    }
  }

  async updateProduct(updated: Product): Promise<void> {
    this.products.update((current) =>
      current.map((p) => (p.id === updated.id ? updated : p))
    );
    this.cacheProducts(this.products());

    try {
      await firstValueFrom(
        this.http.put(this.getApiUrl(`/api/products/${updated.id}`), updated, { headers: this.getAuthHeaders() })
      );
    } catch (err) {
      console.error('Failed to update product in SQL database:', err);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    this.products.update((current) => current.filter((p) => p.id !== id));
    this.cacheProducts(this.products());

    try {
      await firstValueFrom(
        this.http.delete(this.getApiUrl(`/api/products/${id}`), { headers: this.getAuthHeaders() })
      );
    } catch (err) {
      console.error('Failed to delete product from SQL database:', err);
    }
  }

  // Discount Management Methods connected to SQL Backend
  async setProductDiscount(productId: string, discountPercent: number): Promise<void> {
    let updatedProduct: Product | undefined;
    this.products.update((current) =>
      current.map((p) => {
        if (p.id !== productId) return p;
        const orig = p.originalPrice || p.price;
        const pct = Math.max(0, Math.min(99, discountPercent));
        const newPrice = pct === 0 ? orig : Math.round(orig * (1 - pct / 100));
        updatedProduct = {
          ...p,
          originalPrice: orig,
          price: newPrice,
        };
        return updatedProduct;
      })
    );
    this.cacheProducts(this.products());

    if (updatedProduct) {
      try {
        await firstValueFrom(
          this.http.put(this.getApiUrl(`/api/products/${productId}`), {
            price: updatedProduct.price,
            originalPrice: updatedProduct.originalPrice
          }, { headers: this.getAuthHeaders() })
        );
      } catch (err) {
        console.error('Failed to persist discount to SQL database:', err);
      }
    }
  }

  async setProductPrices(productId: string, salePrice: number, originalPrice?: number): Promise<void> {
    let updatedProduct: Product | undefined;
    this.products.update((current) =>
      current.map((p) => {
        if (p.id !== productId) return p;
        const newOrig = originalPrice !== undefined ? originalPrice : (p.originalPrice || p.price);
        updatedProduct = {
          ...p,
          price: Math.max(0, salePrice),
          originalPrice: Math.max(salePrice, newOrig),
        };
        return updatedProduct;
      })
    );
    this.cacheProducts(this.products());

    if (updatedProduct) {
      try {
        await firstValueFrom(
          this.http.put(this.getApiUrl(`/api/products/${productId}`), {
            price: updatedProduct.price,
            originalPrice: updatedProduct.originalPrice
          }, { headers: this.getAuthHeaders() })
        );
      } catch (err) {
        console.error('Failed to persist price change to SQL database:', err);
      }
    }
  }

  async applyBulkDiscount(discountPercent: number, categoryLabel?: string): Promise<void> {
    const pct = Math.max(0, Math.min(99, discountPercent));
    const modified: Product[] = [];

    this.products.update((current) =>
      current.map((p) => {
        if (categoryLabel && categoryLabel !== 'Semua' && p.categoryLabel !== categoryLabel) {
          return p;
        }
        const orig = p.originalPrice || p.price;
        const newPrice = pct === 0 ? orig : Math.round(orig * (1 - pct / 100));
        const updated = {
          ...p,
          originalPrice: orig,
          price: newPrice,
        };
        modified.push(updated);
        return updated;
      })
    );
    this.cacheProducts(this.products());

    for (const p of modified) {
      try {
        await firstValueFrom(
          this.http.put(this.getApiUrl(`/api/products/${p.id}`), { price: p.price, originalPrice: p.originalPrice }, { headers: this.getAuthHeaders() })
        );
      } catch {}
    }
  }

  async resetDiscounts(categoryLabel?: string): Promise<void> {
    const modified: Product[] = [];
    this.products.update((current) =>
      current.map((p) => {
        if (categoryLabel && categoryLabel !== 'Semua' && p.categoryLabel !== categoryLabel) {
          return p;
        }
        const orig = p.originalPrice || p.price;
        const updated = {
          ...p,
          price: orig,
          originalPrice: orig,
        };
        modified.push(updated);
        return updated;
      })
    );
    this.cacheProducts(this.products());

    for (const p of modified) {
      try {
        await firstValueFrom(
          this.http.put(this.getApiUrl(`/api/products/${p.id}`), { price: p.price, originalPrice: p.originalPrice }, { headers: this.getAuthHeaders() })
        );
      } catch {}
    }
  }

  // Flash Sale Management Methods connected to SQL Backend
  async setProductFlashSale(
    productId: string,
    isFlashSale: boolean,
    discountPercent?: number,
    flashSalePrice?: number,
    quota?: number
  ): Promise<void> {
    let target: Product | undefined;
    this.products.update((current) =>
      current.map((p) => {
        if (p.id !== productId) return p;
        const orig = p.originalPrice || p.price;
        let finalPrice = p.price;
        let finalDiscount = p.flashSaleDiscount;

        if (discountPercent !== undefined) {
          finalDiscount = Math.max(1, Math.min(99, discountPercent));
          finalPrice = Math.round(orig * (1 - finalDiscount / 100));
        } else if (flashSalePrice !== undefined) {
          finalPrice = Math.max(0, flashSalePrice);
          finalDiscount = Math.round((1 - finalPrice / orig) * 100);
        }

        target = {
          ...p,
          isFlashSale,
          price: isFlashSale ? finalPrice : p.price,
          flashSalePrice: isFlashSale ? finalPrice : undefined,
          flashSaleDiscount: isFlashSale ? finalDiscount : undefined,
          flashSaleQuota: quota !== undefined ? quota : (p.flashSaleQuota || 50),
        };
        return target;
      })
    );
    this.cacheProducts(this.products());

    if (target) {
      try {
        await firstValueFrom(
          this.http.put(this.getApiUrl(`/api/products/${productId}`), {
            isFlashSale: target.isFlashSale,
            flashSalePrice: target.flashSalePrice,
            flashSaleDiscount: target.flashSaleDiscount,
            flashSaleQuota: target.flashSaleQuota
          }, { headers: this.getAuthHeaders() })
        );
      } catch (err) {
        console.error('Failed to persist flash sale change to SQL database:', err);
      }
    }
  }

  async bulkSetFlashSale(productIds: string[], isFlashSale: boolean, discountPercent?: number): Promise<void> {
    const idSet = new Set(productIds);
    const modified: Product[] = [];

    this.products.update((current) =>
      current.map((p) => {
        if (!idSet.has(p.id)) return p;
        const orig = p.originalPrice || p.price;
        const disc = discountPercent !== undefined ? Math.max(1, Math.min(99, discountPercent)) : 50;
        const newPrice = Math.round(orig * (1 - disc / 100));
        const updated = {
          ...p,
          isFlashSale,
          price: isFlashSale ? newPrice : p.price,
          flashSalePrice: isFlashSale ? newPrice : undefined,
          flashSaleDiscount: isFlashSale ? disc : undefined,
          flashSaleQuota: isFlashSale ? (p.flashSaleQuota || 50) : undefined,
        };
        modified.push(updated);
        return updated;
      })
    );
    this.cacheProducts(this.products());

    for (const p of modified) {
      try {
        await firstValueFrom(
          this.http.put(this.getApiUrl(`/api/products/${p.id}`), {
            isFlashSale: p.isFlashSale,
            flashSalePrice: p.flashSalePrice,
            flashSaleDiscount: p.flashSaleDiscount,
            flashSaleQuota: p.flashSaleQuota
          }, { headers: this.getAuthHeaders() })
        );
      } catch {}
    }
  }

  async syncFlashSaleItems(items: FlashSaleItem[]): Promise<void> {
    const itemMap = new Map(items.map((it) => [it.productId, it]));
    this.products.update((current) =>
      current.map((p) => {
        const flashItem = itemMap.get(p.id);
        if (flashItem) {
          const orig = p.originalPrice || p.price;
          const disc = flashItem.discountPercent || 50;
          const flashPrice = flashItem.flashSalePrice ?? Math.round(orig * (1 - disc / 100));
          return {
            ...p,
            isFlashSale: true,
            price: flashPrice,
            flashSalePrice: flashPrice,
            flashSaleDiscount: disc,
            flashSaleQuota: flashItem.quota || 50,
          };
        } else {
          return {
            ...p,
            isFlashSale: false,
            price: p.originalPrice || p.price,
            flashSalePrice: undefined,
            flashSaleDiscount: undefined,
            flashSaleQuota: undefined,
          };
        }
      })
    );
    this.cacheProducts(this.products());
  }

  // Pre-Order Management Methods
  private loadDefaultPreOrderDays(): number {
    try {
      const saved = localStorage.getItem('syb_default_preorder_days');
      if (saved) {
        const parsed = Number(saved);
        if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 30) {
          return Math.round(parsed);
        }
      }
    } catch {}
    return 7;
  }

  getEstimatedShipDateLabel(days?: number): string {
    const waitDays = Math.max(1, Math.round(Number(days) || 7));
    const target = new Date();
    target.setDate(target.getDate() + waitDays);
    return target.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
