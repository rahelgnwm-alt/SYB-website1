import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MagneticDirective, RevealDirective, TiltDirective } from '../../../directives';
import { PRODUCTS, Product, SHOP_URL, productUrl } from '../../../data';
import { CartService } from '../../../services/cart.service';
import { ProductService } from '../../../services/product.service';

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'discount';
type Filter = 'all' | 'Flash Sale' | 'Best Seller' | 'New' | 'Bundling';

/** All products (route: "/products"). */
@Component({
  selector: 'app-products',
  imports: [RouterLink, RevealDirective, TiltDirective, MagneticDirective],
  templateUrl: './products.html',
  styleUrls: ['./_pcard.css', './products.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Products {
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly cart = inject(CartService);
  protected readonly productUrl = productUrl;
  protected readonly shopUrl = SHOP_URL;

  protected readonly filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'Flash Sale', label: '⚡ Flash Sale' },
    { key: 'Best Seller', label: 'Best Seller' },
    { key: 'New', label: 'New' },
    { key: 'Bundling', label: 'Bundling' },
  ];

  protected readonly query = signal('');
  protected readonly filter = signal<Filter>('all');
  protected readonly sort = signal<Sort>('featured');

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
      const f = params['filter'];
      if (!f) {
        this.filter.set('all');
        return;
      }
      const norm = f.toString().toLowerCase().replace(/[\s-_]/g, '');
      if (norm === 'flashsale') {
        this.filter.set('Flash Sale');
      } else if (norm === 'bestseller') {
        this.filter.set('Best Seller');
      } else if (norm === 'new') {
        this.filter.set('New');
      } else if (norm === 'bundling') {
        this.filter.set('Bundling');
      } else {
        this.filter.set('all');
      }
    });
  }

  protected setFilter(key: Filter): void {
    this.filter.set(key);
    const queryParam = key === 'all' ? null : key.toLowerCase().replace(/\s+/g, '-');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { filter: queryParam },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const f = this.filter();
    const liveMap = new Map(this.productService.products().map((p) => [p.id, p]));

    let list = PRODUCTS.map((p) => {
      const live = liveMap.get(p.id);
      if (!live) return p;
      return {
        ...p,
        price: live.price,
        compareAt: live.originalPrice,
        isFlashSale: live.isFlashSale ?? p.isFlashSale,
      };
    });

    const staticIds = new Set(PRODUCTS.map((p) => p.id));
    for (const p of this.productService.products()) {
      if (!staticIds.has(p.id) && p.status === 'Active') {
        list.push({
          id: p.id,
          name: p.title,
          tagline: p.subtitle,
          price: p.price,
          compareAt: p.originalPrice,
          badge: (p.badge?.replace(' ✦', '') || '') as any,
          image: p.image,
          tint: 'rgba(255, 10, 108, 0.08)',
          isFlashSale: p.isFlashSale,
        } as any);
      }
    }

    let filtered = list.filter(
      (p: any) =>
        (f === 'all' || (f === 'Flash Sale' ? p.isFlashSale : p.badge === f)) &&
        (!q || p.name.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q)),
    );

    switch (this.sort()) {
      case 'price-asc':
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case 'discount':
        filtered = [...filtered].sort((a, b) => this.discount(b) - this.discount(a));
        break;
    }
    return filtered;
  });

  protected add(e: MouseEvent, p: Product) {
    e.preventDefault();
    e.stopPropagation();
    this.cart.add(p, e.currentTarget as HTMLElement);
  }

  protected reset() {
    this.query.set('');
    this.setFilter('all');
    this.sort.set('featured');
  }

  protected rupiah(n: number) {
    return 'Rp' + Math.round(n).toLocaleString('id-ID');
  }

  protected discount(p: Product) {
    return Math.round((1 - p.price / p.compareAt) * 100);
  }
}
