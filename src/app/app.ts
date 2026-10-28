import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MagneticDirective, RevealDirective, TiltDirective } from './directives';
import { SparkleCursor } from './sparkle-cursor';
import { CATEGORIES, INGREDIENTS, PLACES, PRODUCTS, Product, RITUALS, SHOP_URL, productUrl } from './data';

const MANIFESTO =
  'Buat kami, glowing bukan soal jadi sempurna. Ini soal merasa nyaman di kulit sendiri — dari ritual pagi yang segar sampai ritual malam yang menenangkan. Karena kamu layak bersinar, di mana pun kamu berada.';

@Component({
  selector: 'app-root',
  imports: [RevealDirective, MagneticDirective, TiltDirective, SparkleCursor],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown.escape)': 'menuOpen.set(false)',
  },
})
export class App {
  protected readonly shopUrl = SHOP_URL;
  protected readonly productUrl = productUrl;
  protected readonly products = PRODUCTS;
  protected readonly rituals = RITUALS;
  protected readonly categories = CATEGORIES;
  protected readonly places = PLACES;
  protected readonly ingredients = INGREDIENTS;
  protected readonly manifestoWords = MANIFESTO.split(' ');
  protected readonly year = new Date().getFullYear();

  protected readonly loading = signal(true);
  protected readonly scrolled = signal(false);
  protected readonly menuOpen = signal(false);
  protected readonly placeIndex = signal(0);
  protected readonly cartCount = signal(0);
  protected readonly cartBump = signal(false);
  protected readonly toast = signal<string | null>(null);
  protected readonly activeRitual = signal<'am' | 'pm' | null>(null);
  protected readonly activeCategory = signal(0);
  protected readonly now = signal(new Date());

  /** Current time in Jakarta (WIB), independent of visitor's timezone. */
  private readonly wib = computed(() => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(this.now());
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
    return { h: get('hour') % 24, m: get('minute'), s: get('second') };
  });

  protected readonly clockLabel = computed(() => {
    const { h, m } = this.wib();
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  });

  protected readonly hands = computed(() => {
    const { h, m, s } = this.wib();
    return {
      h: ((h % 12) + m / 60) * 30,
      m: (m + s / 60) * 6,
      s: s * 6,
    };
  });

  /** Which ritual fits the current WIB hour. */
  protected readonly ritualNow = computed<'am' | 'pm'>(() => {
    const h = this.wib().h;
    return h >= 4 && h < 16 ? 'am' : 'pm';
  });

  protected readonly greeting = computed(() => {
    const h = this.wib().h;
    if (h >= 4 && h < 11) return 'Selamat pagi, waktunya ritual pagi ☀️';
    if (h >= 11 && h < 15) return 'Siang-siang tetap glowing ✨';
    if (h >= 15 && h < 18) return 'Sore cantik, touch-up dulu yuk 💗';
    return 'Malam ini, saatnya me-time 🌙';
  });

  /** Flash sale countdown to next midnight WIB. */
  protected readonly countdown = computed(() => {
    const { h, m, s } = this.wib();
    const left = 24 * 3600 - (h * 3600 + m * 60 + s);
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      h: pad(Math.floor(left / 3600)),
      m: pad(Math.floor((left % 3600) / 60)),
      s: pad(left % 60),
    };
  });

  private readonly rail = viewChild<ElementRef<HTMLElement>>('rail');
  private readonly destroyRef = inject(DestroyRef);
  private toastTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    afterNextRender(() => this.init());
  }

  private init() {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.body.classList.add('is-loading');

    const loaderTimer = setTimeout(
      () => {
        this.loading.set(false);
        document.body.classList.remove('is-loading');
      },
      reduced ? 200 : 2100,
    );

    const tick = setInterval(() => this.now.set(new Date()), 1000);
    const placeTimer = setInterval(() => this.placeIndex.update((i) => (i + 1) % this.places.length), 2400);

    // ---- Scroll-driven effects ---------------------------------------------
    // Any element with [data-progress] gets a --p var (0 → 1) as it travels through the viewport.
    const tracked = Array.from(document.querySelectorAll<HTMLElement>('[data-progress]'));
    const root = document.documentElement;
    let lastY = scrollY;
    let velocity = 0;
    let raf = 0;

    const update = () => {
      const vh = innerHeight;
      const y = scrollY;
      velocity += (y - lastY - velocity) * 0.15;
      lastY = y;

      this.scrolled.set(y > 40);
      root.style.setProperty('--scroll-v', velocity.toFixed(2));

      for (const el of tracked) {
        const r = el.getBoundingClientRect();
        const mode = el.dataset['progress'];
        let p: number;
        if (mode === 'top') {
          // 0 when section top hits viewport top, 1 when its bottom does
          p = -r.top / Math.max(r.height - vh, 1);
        } else {
          // 0 when element enters from bottom, 1 when it leaves the top
          p = (vh - r.top) / (vh + r.height);
        }
        el.style.setProperty('--p', Math.min(Math.max(p, 0), 1).toFixed(4));
      }
      raf = requestAnimationFrame(update);
    };
    if (!reduced) raf = requestAnimationFrame(update);
    else {
      const onScroll = () => this.scrolled.set(scrollY > 40);
      addEventListener('scroll', onScroll, { passive: true });
      tracked.forEach((el) => el.style.setProperty('--p', '1'));
      this.destroyRef.onDestroy(() => removeEventListener('scroll', onScroll));
    }

    this.destroyRef.onDestroy(() => {
      clearTimeout(loaderTimer);
      clearInterval(tick);
      clearInterval(placeTimer);
      cancelAnimationFrame(raf);
    });
  }

  // ---- Hero pointer parallax ------------------------------------------------
  protected heroMove(e: PointerEvent) {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  }

  // ---- Product rail ---------------------------------------------------------
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

  /** Prevent link navigation when the user was dragging the rail. */
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

  // ---- Cart -----------------------------------------------------------------
  protected addToCart(e: MouseEvent, p: Product) {
    e.preventDefault();
    e.stopPropagation();
    this.cartCount.update((c) => c + 1);
    this.cartBump.set(false);
    requestAnimationFrame(() => this.cartBump.set(true));
    this.burstHearts(e.currentTarget as HTMLElement);

    this.toast.set(`${p.name} masuk keranjang 💗`);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 2600);
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

  // ---- Helpers --------------------------------------------------------------
  protected rupiah(n: number) {
    return 'Rp' + Math.round(n).toLocaleString('id-ID');
  }

  protected discount(p: Product) {
    return Math.round((1 - p.price / p.compareAt) * 100);
  }
}
