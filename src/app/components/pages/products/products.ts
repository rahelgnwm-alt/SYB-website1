import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MagneticDirective, RevealDirective, TiltDirective } from '../../../directives';
import { Product, calcDiscount, formatRupiah } from '../../../data';
import { CartService } from '../../../services/cart.service';
import { ProductService } from '../../../services/product.service';
import { FlashSaleService } from '../../../services/flash-sale.service';

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'discount';
type Filter = 'all' | 'Flash Sale' | 'Pre-Order' | 'Best Seller' | 'New' | 'Bundling';

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
  protected readonly flashSaleService = inject(FlashSaleService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly cart = inject(CartService);
  protected readonly rupiah = formatRupiah;
  protected readonly discount = calcDiscount;

  protected readonly filters = computed<{ key: Filter; label: string }[]>(() => {
    const list: { key: Filter; label: string }[] = [{ key: 'all', label: 'Semua' }];
    if (this.flashSaleService.isFlashSaleLive()) {
      list.push({ key: 'Flash Sale', label: '⚡ Flash Sale' });
    }
    if (this.productService.preOrderProducts().length > 0) {
      list.push({ key: 'Pre-Order', label: '⏳ Pre-Order' });
    }
    list.push(
      { key: 'Best Seller', label: 'Best Seller' },
      { key: 'New', label: 'New' },
      { key: 'Bundling', label: 'Bundling' }
    );
    return list;
  });

  protected readonly query = signal('');
  protected readonly filter = signal<Filter>('all');
  protected readonly sort = signal<Sort>('featured');

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
      const q = params['q'] || params['search'];
      if (q !== undefined) {
        this.query.set(q.toString());
      }

      const f = params['filter'];
      if (!f) {
        this.filter.set('all');
        return;
      }
      const norm = f.toString().toLowerCase().replace(/[\s-_]/g, '');
      if (norm === 'flashsale') {
        this.filter.set('Flash Sale');
      } else if (norm === 'preorder' || norm === 'po') {
        this.filter.set('Pre-Order');
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
    const isLive = this.flashSaleService.isFlashSaleLive();
    const f = (this.filter() === 'Flash Sale' && !isLive) ? 'all' : this.filter();

    const list = this.productService.storefrontProducts();

    let filtered = list.filter(
      (p: any) =>
        (f === 'all' ||
          (f === 'Flash Sale'
            ? p.isFlashSale
            : f === 'Pre-Order'
              ? p.isPreOrder
              : p.badge === f)) &&
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
}
