import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MagneticDirective, RevealDirective } from '../../../directives';
import { PRODUCTS, Product, SHOP_URL, productUrl } from '../../../data';
import { CartService } from '../../../services/cart.service';

/** Cart page (route: "/cart"). */
@Component({
  selector: 'app-cart',
  imports: [RouterLink, RevealDirective, MagneticDirective],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cart {
  protected readonly cart = inject(CartService);
  protected readonly productUrl = productUrl;
  protected readonly shopUrl = SHOP_URL;

  /** Products not in the cart yet — shown as quick add-ons. */
  protected readonly suggestions = computed(() => {
    const inCart = new Set(this.cart.lines().map((l) => l.product.id));
    return PRODUCTS.filter((p) => !inCart.has(p.id)).slice(0, 4);
  });

  protected add(e: MouseEvent, p: Product) {
    this.cart.add(p, e.currentTarget as HTMLElement);
  }

  protected rupiah(n: number) {
    return 'Rp' + Math.round(n).toLocaleString('id-ID');
  }

  protected discount(p: Product) {
    return Math.round((1 - p.price / p.compareAt) * 100);
  }
}
