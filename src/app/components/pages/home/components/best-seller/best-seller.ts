import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective, TiltDirective } from '../../../../../directives';
import { PRODUCTS, Product, productUrl } from '../../../../../data';
import { CartService } from '../../../../../services/cart.service';

/** Best Seller products interactive rail */
@Component({
  selector: 'app-best-seller',
  imports: [RouterLink, RevealDirective, TiltDirective],
  templateUrl: './best-seller.html',
  styleUrl: './best-seller.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BestSeller {
  private readonly cart = inject(CartService);

  protected readonly products = PRODUCTS;
  protected readonly productUrl = productUrl;

  private readonly rail = viewChild<ElementRef<HTMLElement>>('rail');
  private drag = { active: false, startX: 0, startScroll: 0, moved: false };

  protected railDown(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    const el = this.rail()!.nativeElement;
    this.drag = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
    el.classList.add('is-dragging');
  }

  protected railMove(e: PointerEvent) {
    if (!this.drag.active) return;
    const el = this.rail()!.nativeElement;
    const dx = e.clientX - this.drag.startX;
    if (Math.abs(dx) > 5) this.drag.moved = true;
    el.scrollLeft = this.drag.startScroll - dx;
  }

  protected railUp() {
    this.drag.active = false;
    this.rail()?.nativeElement.classList.remove('is-dragging');
  }

  /** Prevent link navigation when user was dragging the rail. */
  protected railClick(e: MouseEvent) {
    if (this.drag.moved) {
      e.preventDefault();
      e.stopPropagation();
      this.drag.moved = false;
    }
  }

  protected scrollRail(dir: 1 | -1) {
    const el = this.rail()?.nativeElement;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('.p-card');
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 320) + 24) * 2, behavior: 'smooth' });
  }

  protected addToCart(e: MouseEvent, p: Product) {
    e.preventDefault();
    e.stopPropagation();
    this.cart.add(p, e.currentTarget as HTMLElement);
  }

  protected rupiah(n: number) {
    return 'Rp' + Math.round(n).toLocaleString('id-ID');
  }

  protected discount(p: Product) {
    return Math.round((1 - p.price / p.compareAt) * 100);
  }
}
