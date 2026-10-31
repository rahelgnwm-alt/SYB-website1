import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MagneticDirective, RevealDirective, TiltDirective } from '../../../directives';
import { PRODUCTS, Product, SHOP_URL, productUrl } from '../../../data';
import { CartService } from '../../../services/cart.service';

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'discount';
type Filter = 'all' | 'Best Seller' | 'New' | 'Bundling';

/** All products (route: "/products"). */
@Component({
  selector: 'app-products',
  imports: [RouterLink, RevealDirective, TiltDirective, MagneticDirective],
  templateUrl: './products.html',
  styleUrls: ['./_pcard.css', './products.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Products {
  protected readonly cart = inject(CartService);
  protected readonly productUrl = productUrl;
  protected readonly shopUrl = SHOP_URL;

  protected readonly filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'Best Seller', label: 'Best Seller' },
    { key: 'New', label: 'New' },
    { key: 'Bundling', label: 'Bundling' },
  ];

  protected readonly query = signal('');
  protected readonly filter = signal<Filter>('all');
  protected readonly sort = signal<Sort>('featured');

  protected readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const f = this.filter();
    let list = PRODUCTS.filter(
      (p) =>
        (f === 'all' || p.badge === f) &&
        (!q || p.name.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q)),
    );
    switch (this.sort()) {
      case 'price-asc':
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case 'discount':
        list = [...list].sort((a, b) => this.discount(b) - this.discount(a));
        break;
    }
    return list;
  });

  protected add(e: MouseEvent, p: Product) {
    e.preventDefault();
    e.stopPropagation();
    this.cart.add(p, e.currentTarget as HTMLElement);
  }

  protected reset() {
    this.query.set('');
    this.filter.set('all');
    this.sort.set('featured');
  }

  protected rupiah(n: number) {
    return 'Rp' + Math.round(n).toLocaleString('id-ID');
  }

  protected discount(p: Product) {
    return Math.round((1 - p.price / p.compareAt) * 100);
  }
}
