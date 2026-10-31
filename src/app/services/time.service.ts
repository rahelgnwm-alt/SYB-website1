import { Injectable, computed, signal } from '@angular/core';

/**
 * Reactive Jakarta (WIB) time service.
 * Drives live clocks, greetings, and flash-sale countdowns across the app.
 */
@Injectable({ providedIn: 'root' })
export class TimeService {
  readonly now = signal(new Date());

  /** Current time in Jakarta (WIB), independent of visitor's local timezone. */
  readonly wib = computed(() => {
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

  readonly clockLabel = computed(() => {
    const { h, m } = this.wib();
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  });

  readonly hands = computed(() => {
    const { h, m, s } = this.wib();
    return {
      h: ((h % 12) + m / 60) * 30,
      m: (m + s / 60) * 6,
      s: s * 6,
    };
  });

  /** Which ritual fits the current WIB hour (AM: 04:00 - 15:59, PM: 16:00 - 03:59). */
  readonly ritualNow = computed<'am' | 'pm'>(() => {
    const h = this.wib().h;
    return h >= 4 && h < 16 ? 'am' : 'pm';
  });

  readonly greeting = computed(() => {
    const h = this.wib().h;
    if (h >= 4 && h < 11) return 'Selamat pagi, waktunya ritual pagi ☀️';
    if (h >= 11 && h < 15) return 'Siang-siang tetap glowing ✨';
    if (h >= 15 && h < 18) return 'Sore cantik, touch-up dulu yuk 💗';
    return 'Malam ini, saatnya me-time 🌙';
  });

  /** Flash sale countdown to next midnight WIB. */
  readonly countdown = computed(() => {
    const { h, m, s } = this.wib();
    const left = 24 * 3600 - (h * 3600 + m * 60 + s);
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      h: pad(Math.floor(left / 3600)),
      m: pad(Math.floor((left % 3600) / 60)),
      s: pad(left % 60),
    };
  });

  constructor() {
    if (typeof window !== 'undefined') {
      setInterval(() => this.now.set(new Date()), 1000);
    }
  }
}
