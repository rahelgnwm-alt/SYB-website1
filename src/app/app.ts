import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SiteHeader } from './components/shared/site-header/site-header';
import { SiteFooter } from './components/shared/site-footer/site-footer';
import { AuthModalComponent } from './components/shared/auth-modal/auth-modal';
import { SparkleCursor } from './sparkle-cursor';
import { CartService } from './services/cart.service';

const MODAL_BACKDROP_SELECTOR =
  '.modal-backdrop, .confirm-modal-backdrop, .fs-modal-backdrop, .tracking-modal-backdrop';

/** App shell: header + routed page + footer. Admin pages render without the storefront chrome. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeader, SiteFooter, AuthModalComponent, SparkleCursor],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly cart = inject(CartService);
  protected readonly isAdmin = signal(false);
  protected readonly isHome = signal(true);

  constructor() {
    const router = inject(Router);
    const destroyRef = inject(DestroyRef);

    router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      const path = e.urlAfterRedirects.split(/[?#]/)[0];
      this.isAdmin.set(path.startsWith('/admin'));
      this.isHome.set(path === '/');
      scrollTo({ top: 0, behavior: 'instant' });
    });

    if (typeof document !== 'undefined') {
      const findModalScrollable = (target: EventTarget | null, backdrop: Element): HTMLElement | null => {
        let el = target instanceof HTMLElement ? target : null;
        while (el && el !== document.body && el !== document.documentElement) {
          if (el.scrollHeight > el.clientHeight) {
            const oy = getComputedStyle(el).overflowY;
            if (oy === 'auto' || oy === 'scroll') {
              return el;
            }
          }
          if (el === backdrop) break;
          el = el.parentElement;
        }
        return null;
      };

      const onWheel = (e: WheelEvent) => {
        const backdrop = document.querySelector(MODAL_BACKDROP_SELECTOR);
        if (!backdrop) return;

        const scrollable = findModalScrollable(e.target, backdrop);
        if (!scrollable) {
          e.preventDefault();
          return;
        }

        const atTop = scrollable.scrollTop <= 0 && e.deltaY < 0;
        const atBottom =
          Math.ceil(scrollable.scrollTop + scrollable.clientHeight) >= scrollable.scrollHeight &&
          e.deltaY > 0;
        if (atTop || atBottom) {
          e.preventDefault();
        }
      };

      const onTouchMove = (e: TouchEvent) => {
        const backdrop = document.querySelector(MODAL_BACKDROP_SELECTOR);
        if (!backdrop) return;
        if (!findModalScrollable(e.target, backdrop)) {
          e.preventDefault();
        }
      };

      const onKeyDown = (e: KeyboardEvent) => {
        const backdrop = document.querySelector(MODAL_BACKDROP_SELECTOR);
        if (!backdrop) return;
        const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
        if (!scrollKeys.includes(e.key)) return;

        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
          return;
        }
        if (!findModalScrollable(target, backdrop)) {
          e.preventDefault();
        }
      };

      document.addEventListener('wheel', onWheel, { passive: false });
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('keydown', onKeyDown);

      destroyRef.onDestroy(() => {
        document.removeEventListener('wheel', onWheel);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('keydown', onKeyDown);
      });
    }
  }
}
