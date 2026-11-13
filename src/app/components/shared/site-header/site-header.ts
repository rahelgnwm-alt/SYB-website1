import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';

/** Announcement bar + persistent sticky header. `solid` = always show frosted style (inner pages). */
@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'onScroll()',
    '(window:keydown.escape)': 'menuOpen.set(false)',
    '[class.is-scrolled]': 'scrolled()',
    '[class.is-solid]': 'solid()',
    '[class.menu-open]': 'menuOpen()',
  },
})
export class SiteHeader {
  readonly solid = input(false);

  protected readonly cart = inject(CartService);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly scrolled = signal(false);
  protected readonly menuOpen = signal(false);

  constructor() {
    effect(() => {
      const open = this.menuOpen();
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('menu-open', open);
      }
    });

    this.destroyRef.onDestroy(() => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('menu-open');
      }
    });
  }

  protected handleAccountClick(event: Event) {
    event.preventDefault();
    if (!this.auth.isAuthenticated()) return this.auth.openLoginModal();
    this.router.navigate([this.auth.isAdmin() ? '/admin/products' : '/profile']);
  }

  protected onScroll() {
    const y = window.scrollY;
    // Hysteresis buffer prevents flickering/jittering at boundary
    if (!this.scrolled() && y > 38) {
      this.scrolled.set(true);
    } else if (this.scrolled() && y < 15) {
      this.scrolled.set(false);
    }
  }
}
