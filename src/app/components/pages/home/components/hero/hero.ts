import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { MagneticDirective } from '../../../../../directives';
import { PLACES, SHOP_URL } from '../../../../../data';
import { TimeService } from '../../../../../services/time.service';

@Component({
  selector: 'app-hero',
  imports: [MagneticDirective],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  protected readonly time = inject(TimeService);
  protected readonly shopUrl = SHOP_URL;
  protected readonly places = PLACES;
  protected readonly placeIndex = signal(0);

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    if (typeof window !== 'undefined') {
      const timer = setInterval(() => {
        this.placeIndex.update((i) => (i + 1) % this.places.length);
      }, 2400);

      this.destroyRef.onDestroy(() => clearInterval(timer));
    }
  }

  protected heroMove(e: PointerEvent) {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  }
}
