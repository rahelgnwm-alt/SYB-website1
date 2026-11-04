import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
} from '@angular/core';
import {
  Preloader,
  Hero,
  Manifesto,
  DualClock,
  BestSeller,
  FlashSale,
  GlowOnTheGo,
  Ingredients,
  Categories,
  Trust,
  Finale,
  AiSkinBannerComponent,
} from './components';

/**
 * Landing page (route: "/").
 * Composes modular section components (Hero, Manifesto, DualClock, FlashSale, etc.).
 */
@Component({
  selector: 'app-home',
  imports: [
    Preloader,
    Hero,
    Manifesto,
    DualClock,
    BestSeller,
    AiSkinBannerComponent,
    FlashSale,
    GlowOnTheGo,
    Ingredients,
    Categories,
    Trust,
    Finale,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => this.initScrollProgress());
  }

  /**
   * Updates `--p` (0 -> 1) on any element with `[data-progress]` as it travels through the viewport,
   * driving parallax and scroll-linked effects in child sections.
   */
  private initScrollProgress() {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let tracked = Array.from(document.querySelectorAll<HTMLElement>('[data-progress]'));
    const root = document.documentElement;

    if (reduced) {
      tracked.forEach((el) => el.style.setProperty('--p', '1'));
      return;
    }

    let lastY = scrollY;
    let velocity = 0;
    let raf = 0;
    let ticking = false;

    const update = () => {
      const vh = innerHeight;
      const y = scrollY;
      velocity += (y - lastY - velocity) * 0.15;
      lastY = y;

      root.style.setProperty('--scroll-v', velocity.toFixed(2));

      if (tracked.length === 0) {
        tracked = Array.from(document.querySelectorAll<HTMLElement>('[data-progress]'));
      }

      for (const el of tracked) {
        const r = el.getBoundingClientRect();
        const mode = el.dataset['progress'];
        let p: number;
        if (mode === 'top') {
          p = -r.top / Math.max(r.height - vh, 1);
        } else {
          p = (vh - r.top) / (vh + r.height);
        }
        el.style.setProperty('--p', Math.min(Math.max(p, 0), 1).toFixed(4));
      }

      if (Math.abs(y - lastY) > 0.5 || Math.abs(velocity) > 0.05) {
        raf = requestAnimationFrame(update);
      } else {
        ticking = false;
        velocity = 0;
        root.style.setProperty('--scroll-v', '0');
      }
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        raf = requestAnimationFrame(update);
      }
    };

    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(raf);
      removeEventListener('scroll', onScroll);
    });
  }
}
