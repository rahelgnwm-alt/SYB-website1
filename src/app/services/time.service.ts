import { Injectable, computed, inject, signal } from '@angular/core';
import { FlashSaleConfig } from '../models/product.model';
import { FlashSaleService } from './flash-sale.service';

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
  private readonly fsService = inject(FlashSaleService);

  readonly now = signal(new Date());
  readonly localFlashConfig = signal<FlashSaleConfig>(this.loadFlashSaleConfig());

  /** Dynamic Flash Sale Config reflecting active session or local fallback */
  readonly flashSaleConfig = computed<FlashSaleConfig>(() => {
    const active = this.fsService.activeSession();
    if (active) {
      const endH = Number(active.endTime.split(':')[0]) || 24;
      const endM = Number(active.endTime.split(':')[1]) || 0;
      return {
        isActive: active.isActive,
        title: active.title,
        subtitle: active.subtitle,
        endHour: endH,
        endMinute: endM,
        activeSessionId: active.id,
        targetTimestamp: null,
      };
    }
    return this.localFlashConfig();
  });

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

  readonly isFlashSaleActive = computed<boolean>(() => {
    return this.fsService.isFlashSaleLive();
  });

  /** Flash sale countdown matching the active session or admin-configured end hour. */
  readonly countdown = computed(() => {
    if (!this.fsService.isFlashSaleLive()) {
      return { h: '00', m: '00', s: '00' };
    }

    const active = this.fsService.activeSession();
    if (active && active.isActive) {
      const end = new Date(`${active.endDate}T${active.endTime}:00`);
      return this.formatSecondsToHms(Math.floor((end.getTime() - this.now().getTime()) / 1000));
    }

    const config = this.flashSaleConfig();
    if (!config.isActive) {
      return { h: '00', m: '00', s: '00' };
    }

    // 1. Duration / specific target timestamp mode
    if (config.targetTimestamp) {
      return this.formatSecondsToHms(Math.floor((config.targetTimestamp - this.now().getTime()) / 1000));
    }

    // 2. Fixed End Hour WIB mode (e.g. 18:00 WIB, 21:00 WIB, or 24:00 WIB midnight)
    const { h, m, s } = this.wib();
    const nowSec = h * 3600 + m * 60 + s;
    const targetHour = config.endHour === 0 ? 24 : config.endHour;
    const targetSec = targetHour * 3600 + config.endMinute * 60;

    return this.formatSecondsToHms(targetSec - nowSec);
  });

  private formatSecondsToHms(seconds: number): { h: string; m: string; s: string } {
    const clamped = Math.max(0, seconds);
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      h: pad(Math.floor(clamped / 3600)),
      m: pad(Math.floor((clamped % 3600) / 60)),
      s: pad(clamped % 60),
    };
  }

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
    const updated = { ...this.localFlashConfig(), ...partial };
    this.localFlashConfig.set(updated);
    this.persistFlashSaleConfig(updated);

    const active = this.fsService.activeSession();
    if (active) {
      this.fsService.updateSession(active.id, {
        ...(partial.title !== undefined ? { title: partial.title } : {}),
        ...(partial.subtitle !== undefined ? { subtitle: partial.subtitle } : {}),
        ...(partial.isActive !== undefined ? { isActive: partial.isActive } : {}),
      });
    }
  }

  setFlashSaleEndHour(hour: number, minute = 0): void {
    const h = Math.max(0, Math.min(24, hour));
    const m = Math.max(0, Math.min(59, minute));
    this.updateFlashSaleConfig({
      endHour: h,
      endMinute: m,
      targetTimestamp: null,
      isActive: true,
    });

    const active = this.fsService.activeSession();
    if (active) {
      const hStr = String(h === 24 ? 23 : h).padStart(2, '0');
      const mStr = String(h === 24 ? 59 : m).padStart(2, '0');
      this.fsService.updateSession(active.id, {
        endTime: `${hStr}:${mStr}`,
        isActive: true,
      });
    }
  }

  setFlashSaleDuration(hours: number): void {
    const targetTimestamp = Date.now() + Math.max(0.1, hours) * 3600 * 1000;
    this.updateFlashSaleConfig({
      targetTimestamp,
      isActive: true,
    });
  }
}
