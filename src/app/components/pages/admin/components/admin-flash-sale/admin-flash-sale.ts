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
import { Product } from '../../../../../models/product.model';

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

  // Active Tab
  readonly activeTab = signal<'enrolled' | 'catalog'>('enrolled');

  // Search & Filter in Catalog
  readonly catalogSearchQuery = signal('');
  readonly catalogCategory = signal<string>('Semua');

  // Editable Schedule State
  readonly selectedEndHour = signal<number>(this.time.flashSaleConfig().endHour || 24);
  readonly selectedEndMinute = signal<number>(this.time.flashSaleConfig().endMinute || 0);
  readonly eventTitle = signal<string>(this.time.flashSaleConfig().title || 'Flash sale berakhir dalam');
  readonly eventSubtitle = signal<string>(this.time.flashSaleConfig().subtitle || 'Limited time offer');

  // Bulk Flash Discount Input
  readonly defaultBulkDiscount = signal<number>(50);

  // Toast
  readonly toastMessage = signal<string | null>(null);
  private toastTimer?: ReturnType<typeof setTimeout>;

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

  // Enrolled Products
  readonly enrolledProducts = computed(() =>
    this.productService.products().filter((p) => p.isFlashSale)
  );

  readonly enrolledCount = computed(() => this.enrolledProducts().length);

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

  // Schedule Operations
  saveScheduleByHour(): void {
    const hour = Number(this.selectedEndHour());
    const minute = Number(this.selectedEndMinute());
    this.time.setFlashSaleEndHour(hour, minute);
    this.time.updateFlashSaleConfig({
      title: this.eventTitle().trim() || 'Flash sale berakhir dalam',
      subtitle: this.eventSubtitle().trim() || 'Limited time offer',
      isActive: true,
    });
    const label = hour === 24 ? '23:59 / 00:00 (Midnight)' : `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    this.triggerToast(`Jam berakhir Flash Sale berhasil diatur ke ${label} WIB!`);
  }

  applyHourPreset(hour: number, min: number): void {
    this.selectedEndHour.set(hour);
    this.selectedEndMinute.set(min);
    this.time.setFlashSaleEndHour(hour, min);
    this.triggerToast(`Waktu berakhir Flash Sale disetel ke ${hour === 24 ? '23:59 (Midnight)' : hour + ':00'} WIB`);
  }

  applyDurationPreset(hours: number): void {
    this.time.setFlashSaleDuration(hours);
    const end = new Date(Date.now() + hours * 3600 * 1000);
    const timeStr = end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    this.triggerToast(`Durasi Flash Sale aktif selama ${hours} Jam (Berakhir sekitar pukul ${timeStr} WIB)`);
  }

  toggleMasterSwitch(): void {
    const nextState = !this.time.flashSaleConfig().isActive;
    this.time.updateFlashSaleConfig({ isActive: nextState });
    this.triggerToast(
      nextState
        ? 'Flash Sale sekarang AKTIF di halaman utama!'
        : 'Flash Sale telah DINONAKTIFKAN (Paused).'
    );
  }

  saveTitles(): void {
    this.time.updateFlashSaleConfig({
      title: this.eventTitle().trim() || 'Flash sale berakhir dalam',
      subtitle: this.eventSubtitle().trim() || 'Limited time offer',
    });
    this.triggerToast('Judul banner Flash Sale berhasil diperbarui!');
  }

  // Individual Product Flash Sale Operations
  toggleProductEnrollment(product: Product): void {
    const willEnroll = !product.isFlashSale;
    if (willEnroll) {
      // Default to 50% discount if not already discounted
      const disc = product.flashSaleDiscount || 50;
      this.productService.setProductFlashSale(product.id, true, disc, undefined, 50);
      this.triggerToast(`✓ ${product.title} dimasukkan ke Flash Sale (${disc}% OFF)`);
    } else {
      this.productService.setProductFlashSale(product.id, false);
      this.triggerToast(`✕ ${product.title} dikeluarkan dari Flash Sale`);
    }
  }

  onDiscountChange(product: Product, percentValue: number | string): void {
    const pct = Math.max(1, Math.min(99, Number(percentValue) || 1));
    this.productService.setProductFlashSale(product.id, true, pct);
    this.triggerToast(`Diskon Flash Sale ${product.title} diubah ke ${pct}%`);
  }

  onPriceChange(product: Product, priceValue: number | string): void {
    const price = Math.max(0, Number(priceValue) || 0);
    this.productService.setProductFlashSale(product.id, true, undefined, price);
    const pct = this.calcDiscountPercent({ ...product, price });
    this.triggerToast(`Harga Flash Sale ${product.title} diatur ke Rp ${price.toLocaleString('id-ID')} (${pct}% OFF)`);
  }

  onQuotaChange(product: Product, quotaValue: number | string): void {
    const quota = Math.max(1, Number(quotaValue) || 10);
    this.productService.setProductFlashSale(product.id, true, undefined, undefined, quota);
    this.triggerToast(`Alokasi kuota ${product.title} disetel ke ${quota} pcs`);
  }

  setQuickDiscount(product: Product, percent: number): void {
    this.productService.setProductFlashSale(product.id, true, percent);
    this.triggerToast(`Diskon Flash Sale ${product.title} disetel ke ${percent}% OFF`);
  }

  // Bulk Enrollment Operations
  enrollAllBestSellers(): void {
    const bestSellers = this.productService.products().filter((p) => p.badge?.includes('Best Seller') || p.isFeatured);
    const ids = bestSellers.map((p) => p.id);
    this.productService.bulkSetFlashSale(ids, true, 50);
    this.triggerToast(`${ids.length} Produk Best Seller berhasil ditambahkan ke Flash Sale (Diskon 50%)!`);
  }

  applyBulkDiscountToEnrolled(percent: number): void {
    const ids = this.enrolledProducts().map((p) => p.id);
    if (ids.length === 0) return;
    this.productService.bulkSetFlashSale(ids, true, percent);
    this.triggerToast(`Diskon ${percent}% diterapkan ke semua (${ids.length}) produk Flash Sale!`);
  }

  removeAllFromFlashSale(): void {
    if (confirm('Apakah Anda yakin ingin mengeluarkan SEMUA produk dari Flash Sale?')) {
      const ids = this.enrolledProducts().map((p) => p.id);
      this.productService.bulkSetFlashSale(ids, false);
      this.triggerToast('Semua produk telah dikeluarkan dari Flash Sale.');
    }
  }

  // Helpers
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
      this.toastMessage.set(null);
    }, 3200);
  }
}

