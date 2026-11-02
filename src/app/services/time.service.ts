import { Injectable, computed, signal } from '@angular/core';
import { FlashSaleConfig } from '../models/product.model';

const WIB_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const FLASH_SALE_STORAGE_KEY = 'syb_flash_sale_config';

const DEFAULT_FLASH_SALE_CONFIG: FlashSaleConfig = {
  isActive: true,
  endHour: 24, // 24 = midnight WIB
  endMinute: 0,
  title: 'Flash sale berakhir dalam',
  subtitle: 'Limited time offer',
  targetTimestamp: null,
};

/**
 * Reactive Jakarta (WIB) time service.
 * Drives live clocks, greetings, and flash-sale countdowns across the app.
 */
@Injectable({ providedIn: 'root' })
export class TimeService {
  readonly now = signal(new Date());
  readonly flashSaleConfig = signal<FlashSaleConfig>(this.loadFlashSaleConfig());

  /** Current time in Jakarta (WIB), independent of visitor's local timezone. */
  readonly wib = computed(() => {
    const parts = WIB_FORMATTER.formatToParts(this.now());
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

  /** Flash sale countdown matching the admin-configured end hour or duration. */
  readonly countdown = computed(() => {
    const config = this.flashSaleConfig();
    const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

    if (!config.isActive) {
      return { h: '00', m: '00', s: '00' };
    }

    // 1. Duration / specific target timestamp mode
    if (config.targetTimestamp) {
      const diffSec = Math.max(0, Math.floor((config.targetTimestamp - this.now().getTime()) / 1000));
      return {
        h: pad(Math.floor(diffSec / 3600)),
        m: pad(Math.floor((diffSec % 3600) / 60)),
        s: pad(diffSec % 60),
      };
    }

    // 2. Fixed End Hour WIB mode (e.g. 18:00 WIB, 21:00 WIB, or 24:00 WIB midnight)
    const { h, m, s } = this.wib();
    const nowSec = h * 3600 + m * 60 + s;
    const targetHour = config.endHour === 0 ? 24 : config.endHour;
    const targetSec = targetHour * 3600 + config.endMinute * 60;

    let left = targetSec - nowSec;
    if (left <= 0) {
      // If end hour has passed today, roll over to the same end hour tomorrow
      left += 24 * 3600;
    }

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

  private loadFlashSaleConfig(): FlashSaleConfig {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(FLASH_SALE_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...DEFAULT_FLASH_SALE_CONFIG, ...parsed };
        }
      }
    } catch {}
    return { ...DEFAULT_FLASH_SALE_CONFIG };
  }

  private persistFlashSaleConfig(cfg: FlashSaleConfig): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(FLASH_SALE_STORAGE_KEY, JSON.stringify(cfg));
      }
    } catch {}
  }

  updateFlashSaleConfig(partial: Partial<FlashSaleConfig>): void {
    const updated = { ...this.flashSaleConfig(), ...partial };
    this.flashSaleConfig.set(updated);
    this.persistFlashSaleConfig(updated);
  }

  setFlashSaleEndHour(hour: number, minute = 0): void {
    this.updateFlashSaleConfig({
      endHour: Math.max(0, Math.min(24, hour)),
      endMinute: Math.max(0, Math.min(59, minute)),
      targetTimestamp: null,
      isActive: true,
    });
  }

  setFlashSaleDuration(hours: number): void {
    const targetTimestamp = Date.now() + Math.max(0.1, hours) * 3600 * 1000;
    this.updateFlashSaleConfig({
      targetTimestamp,
      isActive: true,
    });
  }

  resetFlashSaleToDefault(): void {
    this.flashSaleConfig.set({ ...DEFAULT_FLASH_SALE_CONFIG });
    this.persistFlashSaleConfig(DEFAULT_FLASH_SALE_CONFIG);
  }
}
