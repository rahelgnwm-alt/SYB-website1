import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, afterNextRender, inject, viewChild } from '@angular/core';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  rot: number;
  vr: number;
  hue: number;
  shape: 0 | 1; // 0 = sparkle star, 1 = heart
}

/**
 * Pink dot + ring cursor that grows over interactive elements,
 * with a sparkle / heart particle trail drawn on a full-screen canvas.
 * Only active on devices with a fine pointer.
 */
@Component({
  selector: 'app-sparkle-cursor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #canvas class="trail" aria-hidden="true"></canvas>
    <div #ring class="ring" aria-hidden="true"><span class="label">lihat</span></div>
    <div #dot class="dot" aria-hidden="true"></div>
  `,
  styles: `
    :host { position: fixed; inset: 0; pointer-events: none; z-index: 9999; }
    .trail { position: absolute; inset: 0; width: 100%; height: 100%; }
    .dot, .ring {
      position: absolute; top: 0; left: 0; border-radius: 50%;
      transform: translate3d(-100px, -100px, 0); opacity: 0;
      transition: opacity .3s;
    }
    :host(.active) .dot, :host(.active) .ring { opacity: 1; }
    .dot { width: 8px; height: 8px; margin: -4px 0 0 -4px; background: var(--pink-900); }
    .ring {
      width: 42px; height: 42px; margin: -21px 0 0 -21px;
      border: 1.5px solid var(--pink-400);
      display: grid; place-items: center;
      transition: width .45s var(--ease-jelly), height .45s var(--ease-jelly), margin .45s var(--ease-jelly),
        background-color .3s, border-color .3s, opacity .3s;
    }
    .label {
      font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase;
      color: #fff; opacity: 0; transform: scale(.6); transition: opacity .3s, transform .4s var(--ease-jelly);
    }
    :host(.hover) .ring {
      width: 72px; height: 72px; margin: -36px 0 0 -36px;
      background: rgba(255, 139, 198, .22); border-color: transparent; backdrop-filter: blur(2px);
    }
    :host(.view) .ring {
      width: 96px; height: 96px; margin: -48px 0 0 -48px;
      background: var(--pink-900); border-color: transparent; mix-blend-mode: normal;
    }
    :host(.view) .label { opacity: 1; transform: none; }
    :host(.view) .dot { opacity: 0; }
    :host(.down) .ring { width: 30px; height: 30px; margin: -15px 0 0 -15px; }
  `,
})
export class SparkleCursor implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly dot = viewChild.required<ElementRef<HTMLElement>>('dot');
  private readonly ring = viewChild.required<ElementRef<HTMLElement>>('ring');

  private particles: Particle[] = [];
  private raf = 0;
  private mouse = { x: -100, y: -100 };
  private ringPos = { x: -100, y: -100 };
  private last = { x: 0, y: 0 };
  private cleanup: (() => void)[] = [];

  constructor() {
    afterNextRender(() => {
      const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!fine) {
        this.host.style.display = 'none';
        return;
      }
      document.body.classList.add('has-custom-cursor');
      this.setup(reduced);
    });
  }

  private setup(reduced: boolean) {
    const canvas = this.canvas().nativeElement;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const onMove = (e: PointerEvent) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.host.classList.add('active');

      const dx = e.clientX - this.last.x;
      const dy = e.clientY - this.last.y;
      const dist = Math.hypot(dx, dy);
      if (!reduced && dist > 14) {
        this.last.x = e.clientX;
        this.last.y = e.clientY;
        this.spawn(e.clientX, e.clientY, 1);
      }

      const t = e.target as HTMLElement | null;
      const view = t?.closest('[data-cursor="view"]');
      const hover = t?.closest('a, button, [data-cursor="hover"]');
      this.host.classList.toggle('view', !!view);
      this.host.classList.toggle('hover', !view && !!hover);
    };
    const onDown = (e: PointerEvent) => {
      this.host.classList.add('down');
      if (!reduced) this.spawn(e.clientX, e.clientY, 10, true);
    };
    const onUp = () => this.host.classList.remove('down');
    const onLeave = () => this.host.classList.remove('active');

    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('pointerdown', onDown, { passive: true });
    addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    addEventListener('resize', resize);
    this.cleanup.push(
      () => removeEventListener('pointermove', onMove),
      () => removeEventListener('pointerdown', onDown),
      () => removeEventListener('pointerup', onUp),
      () => document.removeEventListener('pointerleave', onLeave),
      () => removeEventListener('resize', resize),
    );

    const loop = () => {
      // cursor follow
      this.ringPos.x += (this.mouse.x - this.ringPos.x) * 0.18;
      this.ringPos.y += (this.mouse.y - this.ringPos.y) * 0.18;
      this.dot().nativeElement.style.transform = `translate3d(${this.mouse.x}px, ${this.mouse.y}px, 0)`;
      this.ring().nativeElement.style.transform = `translate3d(${this.ringPos.x}px, ${this.ringPos.y}px, 0)`;

      // particles
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= 0.018;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.035;
        p.rot += p.vr;
        this.draw(ctx, p);
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private spawn(x: number, y: number, count: number, burst = false) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = burst ? 1.5 + Math.random() * 3 : Math.random() * 0.6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - (burst ? 1.5 : 0.4),
        life: 1,
        size: burst ? 6 + Math.random() * 6 : 4 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.1,
        hue: Math.random() < 0.6 ? 330 : 270,
        shape: Math.random() < (burst ? 0.5 : 0.25) ? 1 : 0,
      });
    }
    if (this.particles.length > 160) this.particles.splice(0, this.particles.length - 160);
  }

  private draw(ctx: CanvasRenderingContext2D, p: Particle) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.fillStyle = `hsl(${p.hue} 100% ${p.hue === 330 ? 72 : 78}%)`;
    const s = p.size * (0.5 + p.life * 0.5);
    ctx.beginPath();
    if (p.shape === 0) {
      // 4-point sparkle
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(0, 0, s, 0);
      ctx.quadraticCurveTo(0, 0, 0, s);
      ctx.quadraticCurveTo(0, 0, -s, 0);
      ctx.quadraticCurveTo(0, 0, 0, -s);
    } else {
      // heart
      const h = s * 0.9;
      ctx.moveTo(0, h * 0.35);
      ctx.bezierCurveTo(-h, -h * 0.4, -h * 0.4, -h * 1.1, 0, -h * 0.45);
      ctx.bezierCurveTo(h * 0.4, -h * 1.1, h, -h * 0.4, 0, h * 0.35);
    }
    ctx.fill();
    ctx.restore();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.raf);
    this.cleanup.forEach((fn) => fn());
    document.body.classList.remove('has-custom-cursor');
  }
}
