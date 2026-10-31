import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';

@Component({
  selector: 'app-preloader',
  imports: [],
  templateUrl: './preloader.html',
  styleUrl: './preloader.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Preloader {
  protected readonly loading = signal(true);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    if (typeof window !== 'undefined') {
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.body.classList.add('is-loading');

      const timer = setTimeout(
        () => {
          this.loading.set(false);
          document.body.classList.remove('is-loading');
        },
        reduced ? 200 : 2100,
      );

      this.destroyRef.onDestroy(() => {
        clearTimeout(timer);
        document.body.classList.remove('is-loading');
      });
    }
  }
}
