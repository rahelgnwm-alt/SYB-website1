import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { PRODUCTS, Product as DataProduct } from '../../../data';
import { Product, ProductVariant } from '../../../models/product.model';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { TimeService } from '../../../services/time.service';
import { MagneticDirective, RevealDirective, TiltDirective } from '../../../directives';

const WHATSAPP_NUMBER = '6281333369909';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, DecimalPipe, RevealDirective, TiltDirective, MagneticDirective],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetail {
  private readonly route = inject(ActivatedRoute);
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

  /** Related products recommendations */
  protected readonly related = computed<DataProduct[]>(() => {
    const curr = this.product();
    return PRODUCTS.filter((p) => p.id !== curr?.id).slice(0, 4);
  });

  /** WhatsApp order link */
  protected readonly waUrl = computed(() => {
    const p = this.product();
    if (!p) return `https://wa.me/${WHATSAPP_NUMBER}`;
    const variantName = this.selectedVariant()?.name ? ` (${this.selectedVariant()?.name})` : '';
    const text = `Halo SYB Official 💗, saya mau pesan:\n• ${this.qty()}x ${p.title}${variantName} — ${this.rupiah(this.currentPrice() * this.qty())}\n\nApakah stok masih tersedia?`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  });

  constructor() {
    // When product changes, reset variant and qty
    this.route.paramMap.subscribe(() => {
      const p = this.product();
      if (p?.variants && p.variants.length > 0) {
        this.selectedVariant.set(p.variants[0]);
      } else {
        this.selectedVariant.set(null);
      }
      this.qty.set(1);
    });
  }

  protected selectVariant(v: ProductVariant) {
    this.selectedVariant.set(v);
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
