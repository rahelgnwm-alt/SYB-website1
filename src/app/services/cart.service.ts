import { Injectable, computed, signal } from '@angular/core';
import { PRODUCTS, Product } from '../data';

export interface CartLine {
  product: Product;
  qty: number;
}

const STORAGE_KEY = 'syb_cart_v1';

/** Single source of truth for the cart. Persists to localStorage. */
@Injectable({ providedIn: 'root' })
export class CartService {
  readonly freeShippingThreshold = 150000;

  readonly lines = signal<CartLine[]>(this.load());
  readonly bump = signal(false);
  readonly toast = signal<string | null>(null);

  readonly count = computed(() => this.lines().reduce((n, l) => n + l.qty, 0));
  readonly subtotal = computed(() => this.lines().reduce((n, l) => n + l.product.price * l.qty, 0));
  readonly compareTotal = computed(() => this.lines().reduce((n, l) => n + l.product.compareAt * l.qty, 0));
  readonly savings = computed(() => this.compareTotal() - this.subtotal());
  readonly remainingForFreeShipping = computed(() => Math.max(0, this.freeShippingThreshold - this.subtotal()));
  readonly shippingProgress = computed(() => Math.min(100, (this.subtotal() / this.freeShippingThreshold) * 100));

  private toastTimer?: ReturnType<typeof setTimeout>;

  qtyOf(id: string): number {
    return this.lines().find((l) => l.product.id === id)?.qty ?? 0;
  }

  add(product: Product, origin?: HTMLElement) {
    this.lines.update((ls) => {
      const existing = ls.find((l) => l.product.id === product.id);
      return existing
        ? ls.map((l) => (l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l))
        : [...ls, { product, qty: 1 }];
    });
    this.persist();
    this.bump.set(false);
    requestAnimationFrame(() => this.bump.set(true));
    if (origin) this.burstHearts(origin);
    this.notify(`${product.name} masuk keranjang 💗`);
  }

  setQty(id: string, qty: number) {
    if (qty <= 0) return this.remove(id);
    this.lines.update((ls) => ls.map((l) => (l.product.id === id ? { ...l, qty: Math.min(qty, 99) } : l)));
    this.persist();
  }

  remove(id: string) {
    this.lines.update((ls) => ls.filter((l) => l.product.id !== id));
    this.persist();
  }

  clear() {
    this.lines.set([]);
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
        JSON.stringify(this.lines().map((l) => ({ id: l.product.id, qty: l.qty }))),
      );
    } catch {}
  }

  private load(): CartLine[] {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as { id: string; qty: number }[];
      return raw
        .map((r) => ({ product: PRODUCTS.find((p) => p.id === r.id)!, qty: r.qty }))
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
      h.style.setProperty('--c', i % 2 ? 'var(--lilac-700)' : 'var(--pink-900)');
      document.body.appendChild(h);
      h.addEventListener('animationend', () => h.remove(), { once: true });
    }
  }
}
