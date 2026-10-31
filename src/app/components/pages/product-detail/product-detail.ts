import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { PRODUCTS, Product as DataProduct } from '../../../data';
import { Product, ProductVariant } from '../../../models/product.model';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { TimeService } from '../../../services/time.service';
import { MagneticDirective, RevealDirective, TiltDirective } from '../../../directives';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, DecimalPipe, RevealDirective, TiltDirective, MagneticDirective],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  protected readonly cart = inject(CartService);
  protected readonly time = inject(TimeService);

  private readonly idParam = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? ''))
  );

  /** Active full product details */
  protected readonly product = computed<Product | null>(() => {
    const id = this.idParam();
    if (!id) return null;
    return (
      this.productService.products().find((p) => p.id === id || p.handle === id) ??
      null
    );
  });

  /** Selected variant (defaults to first variant when available) */
  protected readonly selectedVariant = signal<ProductVariant | null>(null);

  /** Quantity counter */
  protected readonly qty = signal<number>(1);

  /** Active accordion tab */
  protected readonly activeTab = signal<'desc' | 'benefits' | 'ingredients' | 'how-to'>('desc');

  /** Live calculated price based on variant selection */
  protected readonly currentPrice = computed<number>(() => {
    const v = this.selectedVariant();
    if (v) return v.price;
    return this.product()?.price ?? 0;
  });

  protected readonly originalPrice = computed<number>(() => {
    return this.product()?.originalPrice ?? 0;
  });

  protected readonly discountPct = computed<number>(() => {
    const orig = this.originalPrice();
    const curr = this.currentPrice();
    if (!orig || orig <= curr) return 0;
    return Math.round(((orig - curr) / orig) * 100);
  });

  /** Real customer reviews */
  protected readonly reviews = this.productService.reviews;

  /** Animation and transition states for ultra-smooth product switching */
  protected readonly isTransitioning = signal<boolean>(false);
  protected readonly animKey = signal<number>(0);
  protected readonly variantChanging = signal<boolean>(false);
  protected readonly scrolledPastHero = signal<boolean>(false);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (typeof window !== 'undefined') {
      this.scrolledPastHero.set(window.scrollY > 420);
    }
  }

  /** Previous product in catalog for smooth browsing */
  protected readonly prevProduct = computed<Product | null>(() => {
    const curr = this.product();
    if (!curr) return null;
    const all = this.productService.products();
    const idx = all.findIndex((p) => p.id === curr.id || p.handle === curr.id);
    if (idx <= 0) return all[all.length - 1] ?? null;
    return all[idx - 1] ?? null;
  });

  /** Next product in catalog for smooth browsing */
  protected readonly nextProduct = computed<Product | null>(() => {
    const curr = this.product();
    if (!curr) return null;
    const all = this.productService.products();
    const idx = all.findIndex((p) => p.id === curr.id || p.handle === curr.id);
    if (idx < 0 || idx >= all.length - 1) return all[0] ?? null;
    return all[idx + 1] ?? null;
  });

  /** Related products recommendations */
  protected readonly related = computed<DataProduct[]>(() => {
    const curr = this.product();
    return PRODUCTS.filter((p) => p.id !== curr?.id).slice(0, 4);
  });

  constructor() {
    // When product changes, smooth scroll to top and trigger silky-smooth transition
    this.route.paramMap.subscribe(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      this.isTransitioning.set(true);
      this.animKey.update((k) => k + 1);

      const p = this.product();
      if (p?.variants && p.variants.length > 0) {
        this.selectedVariant.set(p.variants[0]);
      } else {
        this.selectedVariant.set(null);
      }
      this.qty.set(1);

      setTimeout(() => {
        this.isTransitioning.set(false);
      }, 550);
    });
  }

  protected selectVariant(v: ProductVariant) {
    if (this.selectedVariant()?.id === v.id) return;
    this.variantChanging.set(true);
    this.selectedVariant.set(v);
    setTimeout(() => {
      this.variantChanging.set(false);
    }, 350);
  }

  protected changeQty(delta: number) {
    this.qty.update((q) => Math.max(1, Math.min(99, q + delta)));
  }

  protected addToCart(e: MouseEvent) {
    const p = this.product();
    if (!p) return;

    // Bridge full Product to cart data model
    const dataProd: DataProduct = {
      id: p.id,
      name: p.title + (this.selectedVariant() ? ` - ${this.selectedVariant()!.name}` : ''),
      tagline: p.subtitle,
      image: p.image,
      price: this.currentPrice(),
      compareAt: this.originalPrice() || this.currentPrice(),
      badge: p.badge?.includes('Best') ? 'Best Seller' : p.badge?.includes('New') ? 'New' : undefined,
      handle: p.handle,
      tint: p.accentColor || '#ffe1ef',
    };

    // Add specified quantity
    for (let i = 0; i < this.qty(); i++) {
      this.cart.add(dataProd, i === 0 ? (e.currentTarget as HTMLElement) : undefined);
    }
  }

  protected buyNow(e: MouseEvent) {
    this.addToCart(e);
    this.router.navigate(['/cart']);
  }

  protected addRelatedToCart(e: MouseEvent, p: DataProduct) {
    e.preventDefault();
    e.stopPropagation();
    this.cart.add(p, e.currentTarget as HTMLElement);
  }

  protected rupiah(n: number) {
    return 'Rp' + Math.round(n).toLocaleString('id-ID');
  }

  protected discount(p: DataProduct) {
    return Math.round((1 - p.price / p.compareAt) * 100);
  }
}
