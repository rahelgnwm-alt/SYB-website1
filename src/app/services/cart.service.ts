import { Injectable, computed, inject, signal } from '@angular/core';
import { Product } from '../data';
import { ProductService } from './product.service';

export interface CartLine {
  product: Product;
  qty: number;
}

const STORAGE_KEY = 'syb_cart_v1';

/** Single source of truth for the cart. Persists to localStorage. */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly productService = inject(ProductService);
  readonly freeShippingThreshold = 150000;
  /** Toggle to `true` when the store checkout & payment flow is ready to accept orders. */
  readonly checkoutEnabled = signal<boolean>(false);

  private readonly rawLines = signal<CartLine[]>(this.load());

  /** Enriched cart lines synced live with ProductService pre-order & pricing settings */
  readonly lines = computed<CartLine[]>(() => {
    const liveMap = new Map(this.productService.products().map((p) => [p.id, p]));
    return this.rawLines().map((line) => {
      const live = liveMap.get(line.product.id);
      if (!live) return line;
      return {
        ...line,
        product: {
          ...line.product,
          isPreOrder: Boolean(live.isPreOrder),
          preOrderDays: live.preOrderDays || 7,
          preOrderNote: live.preOrderNote,
        },
      };
    });
  });

  readonly bump = signal(false);
  readonly toast = signal<string | null>(null);

  readonly count = computed(() => this.lines().reduce((n, l) => n + l.qty, 0));
  readonly subtotal = computed(() => this.lines().reduce((n, l) => n + l.product.price * l.qty, 0));
  readonly compareTotal = computed(() => this.lines().reduce((n, l) => n + l.product.compareAt * l.qty, 0));
  readonly savings = computed(() => this.compareTotal() - this.subtotal());
  readonly remainingForFreeShipping = computed(() => Math.max(0, this.freeShippingThreshold - this.subtotal()));
  readonly shippingProgress = computed(() => Math.min(100, (this.subtotal() / this.freeShippingThreshold) * 100));

  /** Pre-Order summary signals for Cart & Checkout notices */
  readonly hasPreOrder = computed(() => this.lines().some((l) => Boolean(l.product.isPreOrder)));
  readonly preOrderItemsCount = computed(() =>
    this.lines().filter((l) => Boolean(l.product.isPreOrder)).reduce((n, l) => n + l.qty, 0)
  );
  readonly maxPreOrderDays = computed(() =>
    this.lines().reduce((max, l) => {
      if (!l.product.isPreOrder) return max;
      return Math.max(max, l.product.preOrderDays || 7);
    }, 0)
  );
  readonly estimatedPreOrderShipDate = computed(() => {
    const days = this.maxPreOrderDays();
    if (days <= 0) return '';
    return this.productService.getEstimatedShipDateLabel(days);
  });

  private toastTimer?: ReturnType<typeof setTimeout>;

  qtyOf(id: string): number {
    return this.lines().find((l) => l.product.id === id)?.qty ?? 0;
  }

  add(product: Product, origin?: HTMLElement) {
    const live = this.productService.products().find((p) => p.id === product.id);
    const isPO = Boolean(product.isPreOrder ?? live?.isPreOrder);
    const poDays = product.preOrderDays ?? live?.preOrderDays ?? 7;

    this.rawLines.update((ls) => {
      const existing = ls.find((l) => l.product.id === product.id);
      return existing
        ? ls.map((l) => (l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l))
        : [
            ...ls,
            {
              product: {
                ...product,
                isPreOrder: isPO,
                preOrderDays: poDays,
                preOrderNote: product.preOrderNote ?? live?.preOrderNote,
              },
              qty: 1,
            },
          ];
    });
    this.persist();
    this.bump.set(false);
    requestAnimationFrame(() => this.bump.set(true));
    if (origin) this.burstHearts(origin);
    if (isPO) {
      this.notify(`${product.name} (Pre-Order ±${poDays} hari) masuk keranjang ⏳💗`);
    } else {
      this.notify(`${product.name} masuk keranjang 💗`);
    }
  }

  setQty(id: string, qty: number) {
    if (qty <= 0) return this.remove(id);
    this.rawLines.update((ls) => ls.map((l) => (l.product.id === id ? { ...l, qty: Math.min(qty, 99) } : l)));
    this.persist();
  }

  remove(id: string) {
    this.rawLines.update((ls) => ls.filter((l) => l.product.id !== id));
    this.persist();
  }

  clear() {
    this.rawLines.set([]);
    this.persist();
  }

  notify(message: string) {
    this.toast.set(message);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 2600);
  }

  private persist() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          this.rawLines().map((l) => ({
            id: l.product.id,
            qty: l.qty,
            product: l.product,
          }))
        ),
      );
    } catch {}
  }

  private load(): CartLine[] {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as {
        id: string;
        qty: number;
        product?: Product;
      }[];
      const storeMap = new Map(this.productService.storefrontProducts().map((p) => [p.id, p]));
      const liveMap = new Map(this.productService.products().map((p) => [p.id, p]));
      return raw
        .map((r) => {
          const storeProd = storeMap.get(r.id);
          const live = liveMap.get(r.id);
          const fallbackProd: Product | undefined =
            r.product ||
            (storeProd
              ? {
                  ...storeProd,
                  price: live?.price ?? storeProd.price,
                  compareAt: live?.originalPrice ?? storeProd.compareAt,
                  isPreOrder: Boolean(live?.isPreOrder),
                  preOrderDays: live?.preOrderDays || 7,
                  preOrderNote: live?.preOrderNote,
                }
              : live
                ? {
                    id: live.id,
                    name: live.title,
                    tagline: live.subtitle,
                    image: live.image,
                    price: live.price,
                    compareAt: live.originalPrice || live.price,
                    handle: live.handle,
                    tint: live.accentColor || '#ffe1ef',
                    isPreOrder: Boolean(live.isPreOrder),
                    preOrderDays: live.preOrderDays || 7,
                    preOrderNote: live.preOrderNote,
                  }
                : undefined);
          return { product: fallbackProd!, qty: r.qty };
        })
        .filter((l) => l.product && l.qty > 0);
    } catch {
      return [];
    }
  }

  private burstHearts(origin: HTMLElement) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = origin.getBoundingClientRect();
    for (let i = 0; i < 10; i++) {
      const h = document.createElement('span');
      h.className = 'heart-burst';
      h.textContent = i % 3 === 0 ? '✦' : '♥';
      const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
      const dist = 50 + Math.random() * 50;
      h.style.left = `${r.left + r.width / 2}px`;
      h.style.top = `${r.top + r.height / 2}px`;
      h.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
      h.style.setProperty('--ty', `${Math.sin(angle) * dist - 30}px`);
      h.style.setProperty('--c', i % 2 ? 'var(--pink-500)' : 'var(--pink-900)');
      document.body.appendChild(h);
      h.addEventListener('animationend', () => h.remove(), { once: true });
    }
  }
}
