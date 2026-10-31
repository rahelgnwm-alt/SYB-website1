import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SiteHeader } from './components/shared/site-header/site-header';
import { SiteFooter } from './components/shared/site-footer/site-footer';
import { AuthModalComponent } from './components/shared/auth-modal/auth-modal';
import { SparkleCursor } from './sparkle-cursor';
import { CartService } from './services/cart.service';

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
    router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      const path = e.urlAfterRedirects.split(/[?#]/)[0];
      this.isAdmin.set(path.startsWith('/admin'));
      this.isHome.set(path === '/');
      scrollTo({ top: 0, behavior: 'instant' });
    });
  }
}
