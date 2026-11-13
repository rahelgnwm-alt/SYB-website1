import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { RevealDirective, TiltDirective } from '../../../../../directives';
import { Product, calcDiscount, formatRupiah } from '../../../../../data';
import { CartService } from '../../../../../services/cart.service';
import { ProductService } from '../../../../../services/product.service';
import { FlashSaleService } from '../../../../../services/flash-sale.service';

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
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  protected readonly flashSaleService = inject(FlashSaleService);

  protected readonly products = computed<Product[]>(() =>
    this.productService.storefrontProducts()
  );
  protected readonly rupiah = formatRupiah;
  protected readonly discount = calcDiscount;

  private readonly rail = viewChild<ElementRef<HTMLElement>>('rail');
  private drag = { active: false, startX: 0, startScroll: 0, moved: false };
  private suppressClick = false;

  protected railDown(e: PointerEvent) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = this.rail()?.nativeElement;
    if (!el) return;
    this.drag = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
    // Do NOT add 'is-dragging' here so that clicks aren't intercepted by pointer-events: none
  }

  protected railMove(e: PointerEvent) {
    if (!this.drag.active) return;
    const el = this.rail()?.nativeElement;
    if (!el) return;
    const dx = e.clientX - this.drag.startX;
    if (Math.abs(dx) > 12) {
      if (!this.drag.moved) {
        this.drag.moved = true;
        el.classList.add('is-dragging');
      }
      el.scrollLeft = this.drag.startScroll - dx;
    }
  }

  protected railUp() {
    if (!this.drag.active) return;
    const el = this.rail()?.nativeElement;
    const hadMoved = this.drag.moved;
    this.drag.active = false;
    this.drag.moved = false;

    if (el) {
      if (hadMoved) {
        this.suppressClick = true;
        setTimeout(() => {
          this.suppressClick = false;
          el.classList.remove('is-dragging');
        }, 80);
      } else {
        el.classList.remove('is-dragging');
      }
    }
  }

  /** Prevent link navigation when user was dragging the rail. */
  protected railClick(e: MouseEvent) {
    if (this.suppressClick || this.drag.moved) {
      e.preventDefault();
      e.stopPropagation();
      this.suppressClick = false;
      this.drag.moved = false;
    }
  }

  protected onCardClick(e: MouseEvent, p: Product) {
    if (this.suppressClick || this.drag.moved) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // Ensures navigation is directly triggered
    this.router.navigate(['/products', p.id]);
  }

  protected onMoreClick(e: MouseEvent) {
    if (this.suppressClick || this.drag.moved) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.router.navigate(['/products']);
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
}
