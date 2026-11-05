import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { FlashSaleItem, FlashSaleSession } from '../models/product.model';
import { ProductService } from './product.service';

const SESSIONS_STORAGE_KEY = 'syb_flash_sale_sessions';
const SELECTED_SESSION_KEY = 'syb_selected_fs_session';
const MASTER_ACTIVE_KEY = 'syb_fs_master_active';

/**
 * Helper to get today's date formatted as YYYY-MM-DD
 */
function getTodayString(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_SESSIONS: FlashSaleSession[] = [
  {
    id: 'fs-session-1',
    name: 'Sesi Siang: Super Glowing Rush',
    title: 'Flash sale siang berakhir dalam',
    subtitle: 'Limited Time Offer · Diskon s/d 60%',
    startDate: getTodayString(0),
    startTime: '10:00',
    endDate: getTodayString(0),
    endTime: '15:00',
    isActive: true,
    items: [
      { productId: 'red-jelly-serum', discountPercent: 50, quota: 50 },
      { productId: 'aha-body-toner', discountPercent: 50, quota: 50 },
      { productId: 'glow-fresh-bundle', discountPercent: 50, quota: 30 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fs-session-2',
    name: 'Sesi Malam: Prime Time Beauty 11.11',
    title: 'Flash sale malam berakhir dalam',
    subtitle: 'Spesial Malam Glowing · Diskon Eksklusif',
    startDate: getTodayString(0),
    startTime: '18:00',
    endDate: getTodayString(0),
    endTime: '23:59',
    isActive: true,
    items: [
      { productId: 'golden-egg-mask', discountPercent: 60, quota: 40 },
      { productId: 'peeling-serum', discountPercent: 50, quota: 50 },
      { productId: 'vitamin-lippy-oil', discountPercent: 40, quota: 60 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fs-session-3',
    name: 'Sesi Weekend: Mega Beauty Bazaar',
    title: 'Weekend beauty flash sale berakhir dalam',
    subtitle: 'Promo Spesial Akhir Pekan',
    startDate: getTodayString(1),
    startTime: '09:00',
    endDate: getTodayString(1),
    endTime: '21:00',
    isActive: false,
    items: [
      { productId: 'powder-mask-sakura', discountPercent: 50, quota: 35 },
      { productId: 'red-jelly-serum', discountPercent: 40, quota: 50 },
    ],
    createdAt: new Date().toISOString(),
  },
];

@Injectable({
  providedIn: 'root',
})
export class FlashSaleService {
  private readonly productService = inject(ProductService);

  readonly isMasterActive = signal<boolean>(this.loadMasterActive());
  readonly sessions = signal<FlashSaleSession[]>(this.loadSessions());
  readonly selectedSessionId = signal<string>(this.loadSelectedSessionId());

  /**
   * The session currently selected in the admin panel for viewing/editing
   */
  readonly selectedSession = computed<FlashSaleSession>(() => {
    const list = this.sessions();
    const id = this.selectedSessionId();
    const found = list.find((s) => s.id === id);
    return found || list[0] || DEFAULT_SESSIONS[0];
  });

  readonly currentTime = signal<Date>(new Date());

  /**
   * Determine which session is currently active (running right now, not ended, and not empty).
   */
  readonly activeSession = computed<FlashSaleSession | null>(() => {
    if (!this.isMasterActive()) return null;

    const list = this.sessions().filter((s) => s.isActive && s.items && s.items.length > 0);
    if (list.length === 0) return null;

    const now = this.currentTime();

    // 1. Check if the currently selected session is running right now and not empty
    const selected = list.find((s) => s.id === this.selectedSessionId());
    if (selected) {
      const start = new Date(`${selected.startDate}T${selected.startTime}:00`);
      const end = new Date(`${selected.endDate}T${selected.endTime}:00`);
      if (now >= start && now <= end) {
        return selected;
      }
    }

    // 2. Check any other active session that is running right now
    for (const s of list) {
      const start = new Date(`${s.startDate}T${s.startTime}:00`);
      const end = new Date(`${s.endDate}T${s.endTime}:00`);
      if (now >= start && now <= end) {
        return s;
      }
    }

    return null;
  });

  /**
   * True only if there is an active session running right now with products.
   * If ended, empty, or master switch is off, this is FALSE.
   */
  readonly isFlashSaleLive = computed<boolean>(() => {
    return this.activeSession() !== null;
  });

  constructor() {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.currentTime.set(new Date());
      }, 1000);
    }

    this.syncActiveSessionToStore();

    effect(() => {
      const live = this.activeSession();
      const items = live ? live.items : [];
      untracked(() => {
        this.productService.syncFlashSaleItems(items);
      });
    }, { allowSignalWrites: true });
  }

  private loadMasterActive(): boolean {
    try {
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(MASTER_ACTIVE_KEY);
        if (val !== null) return JSON.parse(val);
      }
    } catch {}
    return true;
  }

  setMasterActive(active: boolean): void {
    this.isMasterActive.set(active);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(MASTER_ACTIVE_KEY, JSON.stringify(active));
      }
    } catch {}
    this.syncActiveSessionToStore();
  }

  toggleMasterActive(): void {
    this.setMasterActive(!this.isMasterActive());
  }

  private loadSessions(): FlashSaleSession[] {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch {}
    return DEFAULT_SESSIONS;
  }

  private persistSessions(data: FlashSaleSession[]): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(data));
      }
    } catch {}
  }

  private loadSelectedSessionId(): string {
    try {
      if (typeof localStorage !== 'undefined') {
        const id = localStorage.getItem(SELECTED_SESSION_KEY);
        if (id) return id;
      }
    } catch {}
    return 'fs-session-1';
  }

  selectSession(id: string): void {
    this.selectedSessionId.set(id);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SELECTED_SESSION_KEY, id);
      }
    } catch {}
    this.syncActiveSessionToStore();
  }

  createSession(partial: Partial<FlashSaleSession>): FlashSaleSession {
    const newSession: FlashSaleSession = {
      id: `fs-session-${Date.now()}`,
      name: partial.name?.trim() || 'Sesi Flash Sale Baru',
      title: partial.title?.trim() || 'Flash sale berakhir dalam',
      subtitle: partial.subtitle?.trim() || 'Limited time offer',
      startDate: partial.startDate || getTodayString(0),
      startTime: partial.startTime || '12:00',
      endDate: partial.endDate || getTodayString(0),
      endTime: partial.endTime || '18:00',
      isActive: partial.isActive !== undefined ? partial.isActive : true,
      items: partial.items || [],
      createdAt: new Date().toISOString(),
    };

    const updated = [...this.sessions(), newSession];
    this.sessions.set(updated);
    this.persistSessions(updated);
    this.selectSession(newSession.id);
    this.syncActiveSessionToStore();
    return newSession;
  }

  updateSession(id: string, partial: Partial<FlashSaleSession>): void {
    const updated = this.sessions().map((s) => {
      if (s.id !== id) return s;
      return { ...s, ...partial };
    });
    this.sessions.set(updated);
    this.persistSessions(updated);
    this.syncActiveSessionToStore();
  }

  deleteSession(id: string): void {
    const current = this.sessions();
    if (current.length <= 1) {
      throw new Error('Minimal harus ada 1 sesi Flash Sale.');
    }
    const updated = current.filter((s) => s.id !== id);
    this.sessions.set(updated);
    this.persistSessions(updated);

    if (this.selectedSessionId() === id) {
      this.selectSession(updated[0].id);
    }
    this.syncActiveSessionToStore();
  }

  duplicateSession(id: string): FlashSaleSession {
    const target = this.sessions().find((s) => s.id === id);
    if (!target) throw new Error('Sesi tidak ditemukan.');

    const copy: FlashSaleSession = {
      ...target,
      id: `fs-session-${Date.now()}`,
      name: `${target.name} (Salinan)`,
      startDate: getTodayString(1),
      endDate: getTodayString(1),
      createdAt: new Date().toISOString(),
      items: target.items.map((it) => ({ ...it })),
    };

    const updated = [...this.sessions(), copy];
    this.sessions.set(updated);
    this.persistSessions(updated);
    this.selectSession(copy.id);
    return copy;
  }

  toggleSessionActive(id: string): void {
    const target = this.sessions().find((s) => s.id === id);
    if (!target) return;
    this.updateSession(id, { isActive: !target.isActive });
  }

  makeSessionLiveNow(id: string): void {
    const today = getTodayString(0);
    const now = new Date();
    const curHour = String(now.getHours()).padStart(2, '0');
    const curMin = String(now.getMinutes()).padStart(2, '0');

    const endH = Math.min(23, now.getHours() + 3);
    const endHourStr = String(endH).padStart(2, '0');

    this.setMasterActive(true);
    this.updateSession(id, {
      startDate: today,
      startTime: `${curHour}:${curMin}`,
      endDate: today,
      endTime: `${endHourStr}:00`,
      isActive: true,
    });
    this.selectSession(id);
    this.syncActiveSessionToStore();
  }

  // ==================== PRODUCT MANAGEMENT IN SESSION ====================

  addProductToSession(sessionId: string, productId: string, discountPercent = 50, quota = 50): void {
    const session = this.sessions().find((s) => s.id === sessionId);
    if (!session) return;

    const existingIndex = session.items.findIndex((it) => it.productId === productId);
    let newItems: FlashSaleItem[];

    if (existingIndex >= 0) {
      newItems = session.items.map((it, idx) =>
        idx === existingIndex ? { ...it, discountPercent, quota } : it
      );
    } else {
      newItems = [...session.items, { productId, discountPercent, quota }];
    }

    this.updateSession(sessionId, { items: newItems });
  }

  removeProductFromSession(sessionId: string, productId: string): void {
    const session = this.sessions().find((s) => s.id === sessionId);
    if (!session) return;

    const newItems = session.items.filter((it) => it.productId !== productId);
    this.updateSession(sessionId, { items: newItems });
  }

  updateProductInSession(
    sessionId: string,
    productId: string,
    discountPercent?: number,
    flashSalePrice?: number,
    quota?: number
  ): void {
    const session = this.sessions().find((s) => s.id === sessionId);
    if (!session) return;

    const product = this.productService.products().find((p) => p.id === productId);
    const orig = product?.originalPrice || product?.price || 50000;

    let finalDisc = discountPercent;
    let finalPrice = flashSalePrice;

    if (discountPercent !== undefined) {
      finalDisc = Math.max(1, Math.min(99, discountPercent));
      finalPrice = Math.round(orig * (1 - finalDisc / 100));
    } else if (flashSalePrice !== undefined) {
      finalPrice = Math.max(0, flashSalePrice);
      finalDisc = Math.round((1 - finalPrice / orig) * 100);
    }

    const newItems = session.items.map((it) => {
      if (it.productId !== productId) return it;
      return {
        ...it,
        discountPercent: finalDisc ?? it.discountPercent,
        flashSalePrice: finalPrice ?? it.flashSalePrice,
        quota: quota ?? it.quota,
      };
    });

    this.updateSession(sessionId, { items: newItems });
  }

  bulkAddProductsToSession(sessionId: string, productIds: string[], discountPercent = 50): void {
    const session = this.sessions().find((s) => s.id === sessionId);
    if (!session) return;

    const existingMap = new Map(session.items.map((it) => [it.productId, it]));
    for (const pid of productIds) {
      if (!existingMap.has(pid)) {
        existingMap.set(pid, { productId: pid, discountPercent, quota: 50 });
      }
    }

    this.updateSession(sessionId, { items: Array.from(existingMap.values()) });
  }

  clearSessionProducts(sessionId: string): void {
    this.updateSession(sessionId, { items: [] });
  }

  syncActiveSessionToStore(): void {
    const active = this.activeSession();
    if (!active || !active.isActive || !this.isMasterActive() || !active.items || active.items.length === 0) {
      this.productService.syncFlashSaleItems([]);
      return;
    }
    this.productService.syncFlashSaleItems(active.items);
  }

  getSessionStatus(s: FlashSaleSession): { code: 'live' | 'upcoming' | 'ended' | 'paused'; label: string } {
    if (!s.isActive || !this.isMasterActive()) {
      return { code: 'paused', label: '⏸️ Non-Aktif' };
    }
    const now = this.currentTime();
    const start = new Date(`${s.startDate}T${s.startTime}:00`);
    const end = new Date(`${s.endDate}T${s.endTime}:00`);

    if (now < start) {
      return { code: 'upcoming', label: '🟡 Akan Datang' };
    }
    if (now > end) {
      return { code: 'ended', label: '⚪ Selesai' };
    }
    if (!s.items || s.items.length === 0) {
      return { code: 'ended', label: '⚪ Kosong (0 Produk)' };
    }
    return { code: 'live', label: '🟢 Sedang Berlangsung' };
  }
}
