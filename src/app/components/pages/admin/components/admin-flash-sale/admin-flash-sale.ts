import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../../../services/product.service';
import { TimeService } from '../../../../../services/time.service';
import { FlashSaleService } from '../../../../../services/flash-sale.service';
import { FlashSaleSession, Product } from '../../../../../models/product.model';

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
}

@Component({
  selector: 'app-admin-flash-sale',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-flash-sale.html',
  styleUrl: './admin-flash-sale.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFlashSaleComponent {
  readonly productService = inject(ProductService);
  readonly time = inject(TimeService);
  readonly fsService = inject(FlashSaleService);

  // Active Main Tabs: 'sessions' | 'enrolled' | 'catalog'
  readonly activeTab = signal<'sessions' | 'enrolled' | 'catalog'>('sessions');

  // Search & Filter in Catalog
  readonly catalogSearchQuery = signal('');
  readonly catalogCategory = signal<string>('Semua');

  // New Session Creation Modal / Inline Form State
  readonly isCreatingSession = signal(false);
  readonly newSessionName = signal('');
  readonly newSessionStartDate = signal(this.getTodayString(0));
  readonly newSessionStartTime = signal('12:00');
  readonly newSessionEndDate = signal(this.getTodayString(0));
  readonly newSessionEndTime = signal('18:00');
  readonly newSessionTitle = signal('Flash sale berakhir dalam');
  readonly newSessionSubtitle = signal('Limited time offer');

  // Selected Session Editable State (synced from selectedSession)
  readonly editSessionName = signal('');
  readonly editStartDate = signal('');
  readonly editStartTime = signal('');
  readonly editEndDate = signal('');
  readonly editEndTime = signal('');
  readonly editTitle = signal('');
  readonly editSubtitle = signal('');

  // Legacy & Quick hour presets
  readonly selectedEndHour = signal<number>(24);
  readonly selectedEndMinute = signal<number>(0);
  readonly eventTitle = signal<string>('Flash sale berakhir dalam');
  readonly eventSubtitle = signal<string>('Limited time offer');

  // Toast
  readonly toastMessage = signal<string | null>(null);
  private toastTimer?: ReturnType<typeof setTimeout>;

  // Custom Popup Confirmation Modal State
  readonly confirmDialog = signal<ConfirmDialogState | null>(null);

  openConfirm(options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }): void {
    this.confirmDialog.set({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel || 'Ya, Lanjutkan',
      cancelLabel: options.cancelLabel || 'Batal',
      isDanger: options.isDanger ?? true,
      onConfirm: () => {
        const action = options.onConfirm;
        this.closeConfirm();
        action();
      },
    });
  }

  closeConfirm(): void {
    this.confirmDialog.set(null);
  }

  // Preset End Hours
  readonly hourPresets = [
    { label: '12:00 WIB (Siang)', hour: 12, min: 0 },
    { label: '15:00 WIB (Sore)', hour: 15, min: 0 },
    { label: '18:00 WIB (Senja)', hour: 18, min: 0 },
    { label: '21:00 WIB (Prime Time)', hour: 21, min: 0 },
    { label: '23:59 WIB (Midnight)', hour: 24, min: 0 },
  ];

  // Duration Presets (Hours from now)
  readonly durationPresets = [1, 2, 4, 8, 12, 24];

  // All Sessions list
  readonly sessions = computed(() => this.fsService.sessions());
  readonly currentSelectedSession = computed(() => this.fsService.selectedSession());

  // Products enrolled in the currently selected session
  readonly sessionEnrolledProducts = computed(() => {
    const session = this.currentSelectedSession();
    if (!session || !session.items) return [];

    const itemMap = new Map(session.items.map((it) => [it.productId, it]));
    return this.productService.products()
      .filter((p) => itemMap.has(p.id))
      .map((p) => {
        const item = itemMap.get(p.id)!;
        const orig = p.originalPrice || p.price;
        const disc = item.discountPercent || 50;
        const flashPrice = item.flashSalePrice ?? Math.round(orig * (1 - disc / 100));
        return {
          ...p,
          isFlashSale: true,
          price: flashPrice,
          flashSalePrice: flashPrice,
          flashSaleDiscount: disc,
          flashSaleQuota: item.quota || 50,
        };
      });
  });

  // Alias for backward compatibility with existing tests
  readonly enrolledProducts = computed(() => this.sessionEnrolledProducts());
  readonly enrolledCount = computed(() => this.sessionEnrolledProducts().length);

  // Available Products with Filter
  readonly availableProducts = computed(() => {
    const q = this.catalogSearchQuery().toLowerCase().trim();
    const cat = this.catalogCategory();

    return this.productService.products().filter((p) => {
      const matchQ =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q);
      const matchCat = cat === 'Semua' || p.categoryLabel === cat;
      return matchQ && matchCat;
    });
  });

  constructor() {
    this.initEditState();
  }

  private initEditState(): void {
    const s = this.fsService.selectedSession();
    if (s) {
      this.editSessionName.set(s.name);
      this.editStartDate.set(s.startDate);
      this.editStartTime.set(s.startTime);
      this.editEndDate.set(s.endDate);
      this.editEndTime.set(s.endTime);
      this.editTitle.set(s.title);
      this.editSubtitle.set(s.subtitle);

      const h = Number(s.endTime.split(':')[0]) || 24;
      const m = Number(s.endTime.split(':')[1]) || 0;
      this.selectedEndHour.set(h);
      this.selectedEndMinute.set(m);
      this.eventTitle.set(s.title);
      this.eventSubtitle.set(s.subtitle);
    }
  }

  // ==================== SESSION OPERATIONS ====================

  selectSession(id: string): void {
    this.fsService.selectSession(id);
    this.initEditState();
    this.triggerToast(`Sesi "${this.currentSelectedSession().name}" dipilih.`);
  }

  openCreateSession(): void {
    this.newSessionName.set(`Flash Sale ${new Date().toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}`);
    this.newSessionStartDate.set(this.getTodayString(0));
    this.newSessionStartTime.set('12:00');
    this.newSessionEndDate.set(this.getTodayString(0));
    this.newSessionEndTime.set('21:00');
    this.isCreatingSession.set(true);
  }

  cancelCreateSession(): void {
    this.isCreatingSession.set(false);
  }

  submitNewSession(): void {
    const name = this.newSessionName().trim();
    if (!name) {
      this.triggerToast('⚠️ Harap isi nama sesi Flash Sale.');
      return;
    }

    const created = this.fsService.createSession({
      name,
      startDate: this.newSessionStartDate(),
      startTime: this.newSessionStartTime(),
      endDate: this.newSessionEndDate(),
      endTime: this.newSessionEndTime(),
      title: this.newSessionTitle().trim() || 'Flash sale berakhir dalam',
      subtitle: this.newSessionSubtitle().trim() || 'Limited time offer',
      isActive: true,
      items: [],
    });

    this.isCreatingSession.set(false);
    this.initEditState();
    this.activeTab.set('catalog'); // Switch to catalog so admin can immediately pick products!
    this.triggerToast(`✓ Sesi baru "${created.name}" berhasil dibuat! Silakan pilih produk dari katalog.`);
  }

  saveSelectedSession(): void {
    const s = this.currentSelectedSession();
    this.fsService.updateSession(s.id, {
      name: this.editSessionName().trim() || s.name,
      startDate: this.editStartDate() || s.startDate,
      startTime: this.editStartTime() || s.startTime,
      endDate: this.editEndDate() || s.endDate,
      endTime: this.editEndTime() || s.endTime,
      title: this.editTitle().trim() || s.title,
      subtitle: this.editSubtitle().trim() || s.subtitle,
    });
    this.triggerToast(`✓ Perubahan jadwal sesi "${this.editSessionName()}" berhasil disimpan!`);
  }

  duplicateSession(session: FlashSaleSession): void {
    const copy = this.fsService.duplicateSession(session.id);
    this.initEditState();
    this.triggerToast(`✓ Sesi "${session.name}" berhasil diduplikasi sebagai "${copy.name}".`);
  }

  deleteSession(session: FlashSaleSession): void {
    this.openConfirm({
      title: 'Hapus Sesi Flash Sale?',
      message: `Apakah Anda yakin ingin menghapus sesi "${session.name}"? Jadwal dan produk yang terdaftar pada sesi ini akan dihapus.`,
      confirmLabel: 'Ya, Hapus Sesi',
      cancelLabel: 'Batal',
      isDanger: true,
      onConfirm: () => {
        try {
          this.fsService.deleteSession(session.id);
          this.initEditState();
          this.triggerToast(`Sesi "${session.name}" telah dihapus.`);
        } catch (err: any) {
          this.triggerToast(`⚠️ ${err?.message || 'Gagal menghapus sesi.'}`);
        }
      },
    });
  }

  toggleSessionStatus(session: FlashSaleSession): void {
    this.fsService.toggleSessionActive(session.id);
    const next = !session.isActive;
    this.triggerToast(
      next
        ? `Sesi "${session.name}" sekarang DIAKTIFKAN!`
        : `Sesi "${session.name}" dinonaktifkan.`
    );
  }

  makeSessionLiveNow(session: FlashSaleSession): void {
    this.fsService.makeSessionLiveNow(session.id);
    this.initEditState();
    this.triggerToast(`⚡ Sesi "${session.name}" sekarang LIVE AKTIF di website!`);
  }

  // ==================== PRODUCT ASSIGNMENT IN CURRENT SESSION ====================

  isProductInSession(productId: string): boolean {
    const s = this.currentSelectedSession();
    return s ? s.items.some((it) => it.productId === productId) : false;
  }

  getProductSessionDiscount(productId: string): number {
    const s = this.currentSelectedSession();
    const item = s?.items.find((it) => it.productId === productId);
    return item?.discountPercent ?? 50;
  }

  getProductSessionQuota(productId: string): number {
    const s = this.currentSelectedSession();
    const item = s?.items.find((it) => it.productId === productId);
    return item?.quota ?? 50;
  }

  toggleProductInSession(product: Product): void {
    const s = this.currentSelectedSession();
    if (!s) return;

    if (this.isProductInSession(product.id)) {
      this.fsService.removeProductFromSession(s.id, product.id);
      this.productService.setProductFlashSale(product.id, false);
      this.triggerToast(`✕ ${product.title} dikeluarkan dari sesi "${s.name}"`);
    } else {
      const disc = product.flashSaleDiscount || 50;
      this.fsService.addProductToSession(s.id, product.id, disc, 50);
      this.productService.setProductFlashSale(product.id, true, disc, undefined, 50);
      this.triggerToast(`✓ ${product.title} dimasukkan ke sesi "${s.name}" (${disc}% OFF)`);
    }
  }

  // Backward compatibility alias for existing unit tests
  toggleProductEnrollment(product: Product): void {
    const willEnroll = !product.isFlashSale;
    const s = this.currentSelectedSession();
    if (willEnroll) {
      const disc = product.flashSaleDiscount || 50;
      if (s) {
        this.fsService.addProductToSession(s.id, product.id, disc, 50);
      }
      this.productService.setProductFlashSale(product.id, true, disc, undefined, 50);
      this.triggerToast(`✓ ${product.title} dimasukkan ke Flash Sale (${disc}% OFF)`);
    } else {
      if (s) {
        this.fsService.removeProductFromSession(s.id, product.id);
      }
      this.productService.setProductFlashSale(product.id, false);
      this.triggerToast(`✕ ${product.title} dikeluarkan dari Flash Sale`);
    }
  }

  onDiscountChange(product: Product, percentValue: number | string): void {
    const s = this.currentSelectedSession();
    const pct = Math.max(1, Math.min(99, Number(percentValue) || 1));
    if (s) {
      this.fsService.updateProductInSession(s.id, product.id, pct);
    }
    this.productService.setProductFlashSale(product.id, true, pct);
    this.triggerToast(`Diskon ${product.title} diatur ke ${pct}% di sesi "${s.name}"`);
  }

  onPriceChange(product: Product, priceValue: number | string): void {
    const s = this.currentSelectedSession();
    const price = Math.max(0, Number(priceValue) || 0);
    if (s) {
      this.fsService.updateProductInSession(s.id, product.id, undefined, price);
    }
    this.productService.setProductFlashSale(product.id, true, undefined, price);
    const pct = this.calcDiscountPercent({ ...product, price });
    this.triggerToast(`Harga Flash Sale ${product.title} diatur ke Rp ${price.toLocaleString('id-ID')} (${pct}% OFF)`);
  }

  onQuotaChange(product: Product, quotaValue: number | string): void {
    const s = this.currentSelectedSession();
    const quota = Math.max(1, Number(quotaValue) || 10);
    if (s) {
      this.fsService.updateProductInSession(s.id, product.id, undefined, undefined, quota);
    }
    this.productService.setProductFlashSale(product.id, true, undefined, undefined, quota);
    this.triggerToast(`Alokasi kuota ${product.title} disetel ke ${quota} pcs`);
  }

  // Bulk Operations for Selected Session
  enrollAllBestSellers(): void {
    const s = this.currentSelectedSession();
    const bestSellers = this.productService.products().filter(
      (p) => p.badge?.includes('Best Seller') || p.isFeatured
    );
    const ids = bestSellers.map((p) => p.id);
    this.fsService.bulkAddProductsToSession(s.id, ids, 50);
    this.productService.bulkSetFlashSale(ids, true, 50);
    this.triggerToast(`${ids.length} Produk Best Seller dimasukkan ke sesi "${s.name}" (50% OFF)!`);
  }

  applyBulkDiscountToEnrolled(percent: number): void {
    const s = this.currentSelectedSession();
    if (s.items.length === 0) return;
    for (const it of s.items) {
      this.fsService.updateProductInSession(s.id, it.productId, percent);
    }
    const ids = s.items.map((it) => it.productId);
    this.productService.bulkSetFlashSale(ids, true, percent);
    this.triggerToast(`Diskon ${percent}% diterapkan ke semua produk di sesi "${s.name}"!`);
  }

  removeAllFromFlashSale(): void {
    const s = this.currentSelectedSession();
    this.openConfirm({
      title: 'Kosongkan Produk Sesi Ini?',
      message: `Apakah Anda yakin ingin mengosongkan semua produk dari sesi "${s.name}"?`,
      confirmLabel: 'Ya, Kosongkan',
      cancelLabel: 'Batal',
      isDanger: true,
      onConfirm: () => {
        const ids = s.items.map((it) => it.productId);
        this.fsService.clearSessionProducts(s.id);
        this.productService.bulkSetFlashSale(ids, false);
        this.triggerToast(`Semua produk telah dikeluarkan dari sesi "${s.name}".`);
      },
    });
  }

  // Legacy Schedule Methods for Tests & Quick Set
  saveScheduleByHour(): void {
    const hour = Number(this.selectedEndHour());
    const minute = Number(this.selectedEndMinute());
    const hourStr = String(hour).padStart(2, '0');
    const minStr = String(minute).padStart(2, '0');
    this.editEndTime.set(`${hourStr}:${minStr}`);
    this.time.setFlashSaleEndHour(hour, minute);
    this.saveSelectedSession();
    const label = hour === 24 ? '23:59 (Midnight)' : `${hourStr}:${minStr}`;
    this.triggerToast(`Jam berakhir Flash Sale disetel ke ${label} WIB!`);
  }

  applyHourPreset(hour: number, min: number): void {
    this.selectedEndHour.set(hour);
    this.selectedEndMinute.set(min);
    const hourStr = String(hour === 24 ? 23 : hour).padStart(2, '0');
    const minStr = String(hour === 24 ? 59 : min).padStart(2, '0');
    this.editEndTime.set(`${hourStr}:${minStr}`);
    this.time.setFlashSaleEndHour(hour, min);
    this.saveSelectedSession();
    this.triggerToast(`Jam berakhir disetel ke ${hour === 24 ? '23:59 (Midnight)' : hour + ':00'} WIB`);
  }

  applyDurationPreset(hours: number): void {
    this.time.setFlashSaleDuration(hours);
    const now = new Date();
    const end = new Date(now.getTime() + hours * 3600 * 1000);
    const endHourStr = String(end.getHours()).padStart(2, '0');
    const endMinStr = String(end.getMinutes()).padStart(2, '0');
    this.editEndTime.set(`${endHourStr}:${endMinStr}`);
    this.saveSelectedSession();
    this.triggerToast(`Durasi Flash Sale aktif selama ${hours} Jam (Berakhir pukul ${endHourStr}:${endMinStr} WIB)`);
  }

  toggleMasterSwitch(): void {
    const nextState = !this.time.flashSaleConfig().isActive;
    this.fsService.setMasterActive(nextState);
    this.time.updateFlashSaleConfig({ isActive: nextState });
    this.triggerToast(
      nextState
        ? 'Flash Sale sekarang AKTIF di halaman utama!'
        : 'Flash Sale telah DINONAKTIFKAN (Paused).'
    );
  }

  saveTitles(): void {
    this.saveSelectedSession();
  }

  calcDiscountPercent(p: Product): number {
    if (!p.originalPrice || p.originalPrice <= 0) return 0;
    const diff = p.originalPrice - p.price;
    if (diff <= 0) return 0;
    return Math.round((diff / p.originalPrice) * 100);
  }

  triggerToast(msg: string): void {
    this.toastMessage.set(msg);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set(null), 3200;
    });
  }

  private getTodayString(offsetDays = 0): string {
    const d = new Date();
    if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
