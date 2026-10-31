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

const MANIFESTO =
  'Buat kami, glowing bukan soal jadi sempurna. Ini soal merasa nyaman di kulit sendiri — dari ritual pagi yang segar sampai ritual malam yang menenangkan. Karena kamu layak bersinar, di mana pun kamu berada.';

@Component({
  selector: 'app-manifesto',
  imports: [],
  templateUrl: './manifesto.html',
  styleUrl: './manifesto.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Manifesto {
  protected readonly manifestoWords = MANIFESTO.split(' ');
  protected readonly progress = signal(0);

  private readonly sectionRef = viewChild<ElementRef<HTMLElement>>('sectionRef');
  private readonly destroyRef = inject(DestroyRef);

  protected readonly signOpacity = computed(() => {
    // Fades in during the last 35% of the scroll progress
    return Math.min(Math.max((this.progress() - 0.65) / 0.3, 0), 1);
  });

  constructor() {
    afterNextRender(() => {
      this.initScrollTracking();
    });
  }

  private initScrollTracking() {
    const el = this.sectionRef()?.nativeElement;
    if (!el) return;

    let rafId = 0;

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const maxScroll = Math.max(r.height - vh, 1);
        const p = Math.min(Math.max(-r.top / maxScroll, 0), 1);
        this.progress.set(p);
        el.style.setProperty('--p', p.toFixed(4));
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Initial calculation
    onScroll();

    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    });
  }

  /**
   * Checks if word at `index` has been illuminated.
   * Total progress is scaled so all words light up smoothly as user scrolls through the section.
   */
  protected isLit(index: number): boolean {
    const total = this.manifestoWords.length;
    const current = this.progress() * (total + 2) * 1.12;
    return index < current;
  }

  /**
   * Highlights the specific word currently being read.
   */
  protected isCurrent(index: number): boolean {
    const total = this.manifestoWords.length;
    const current = this.progress() * (total + 2) * 1.12;
    return index >= current - 1.2 && index < current;
  }
}
