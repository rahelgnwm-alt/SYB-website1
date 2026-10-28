import { Directive, ElementRef, OnDestroy, afterNextRender, inject, input } from '@angular/core';

/**
 * Adds `.is-in` when the host scrolls into view.
 * Usage: <div appReveal [revealDelay]="120"></div>  or appReveal="clip" / "scale"
 */
@Directive({ selector: '[appReveal]' })
export class RevealDirective implements OnDestroy {
  readonly revealDelay = input(0);
  readonly revealOnce = input(true);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;

  constructor() {
    afterNextRender(() => {
      const node = this.el.nativeElement;
      node.style.setProperty('--reveal-delay', `${this.revealDelay()}ms`);
      this.observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              node.classList.add('is-in');
              if (this.revealOnce()) this.observer?.unobserve(node);
            } else if (!this.revealOnce()) {
              node.classList.remove('is-in');
            }
          }
        },
        { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
      );
      this.observer.observe(node);
    });
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}

/** Element gently follows the pointer while hovered (magnetic buttons). */
@Directive({
  selector: '[appMagnetic]',
  host: {
    '(pointermove)': 'move($event)',
    '(pointerleave)': 'reset()',
  },
})
export class MagneticDirective {
  readonly strength = input(0.35, { alias: 'appMagnetic', transform: (v: unknown) => (v === '' || v == null ? 0.35 : Number(v)) });
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  move(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    const r = this.el.nativeElement.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * this.strength();
    const y = (e.clientY - r.top - r.height / 2) * this.strength();
    this.el.nativeElement.style.transform = `translate(${x}px, ${y}px)`;
  }

  reset() {
    this.el.nativeElement.style.transform = '';
  }
}

/** 3D tilt that follows the pointer (used on product cards). */
@Directive({
  selector: '[appTilt]',
  host: {
    '(pointermove)': 'move($event)',
    '(pointerleave)': 'reset()',
  },
})
export class TiltDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  move(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    const node = this.el.nativeElement;
    const r = node.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    node.style.setProperty('--rx', `${(0.5 - py) * 10}deg`);
    node.style.setProperty('--ry', `${(px - 0.5) * 12}deg`);
    node.style.setProperty('--mx', `${px * 100}%`);
    node.style.setProperty('--my', `${py * 100}%`);
  }

  reset() {
    const s = this.el.nativeElement.style;
    s.setProperty('--rx', '0deg');
    s.setProperty('--ry', '0deg');
  }
}
