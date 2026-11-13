import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../../../services/product.service';
import { Product } from '../../../../../models/product.model';
import { calcAdminDiscountPercent, formatThousand, parseThousand, syncThousandInput } from '../../../../../data';

export interface DiscountConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
}

@Component({
  selector: 'app-admin-discounts',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-discounts.html',
  styleUrl: './admin-discounts.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDiscountsComponent {
  readonly productService = inject(ProductService);

  // Filter & Search Signals
  readonly searchQuery = signal('');
  readonly selectedCategory = signal<string>('Semua');
  readonly discountFilter = signal<'all' | 'discounted' | 'no-discount'>('all');
  readonly sortBy = signal<'discount-desc' | 'discount-asc' | 'price-asc' | 'price-desc' | 'name-asc'>('discount-desc');

  // Multi-Selection State
  readonly selectedProductIds = signal<Set<string>>(new Set());

  // Bulk Discount Controls
  readonly bulkDiscountPercent = signal<number>(20);
  readonly bulkTargetCategory = signal<string>('Semua');

  // Feedback Toast
  readonly toastMessage = signal<string | null>(null);
  private toastTimer?: ReturnType<typeof setTimeout>;

  // Custom Luxury Confirmation Popup Dialog
  readonly confirmDialog = signal<DiscountConfirmDialogState | null>(null);

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

  // Category Options
  readonly categories = ['Semua', 'Wajah', 'Tubuh', 'Makeup', 'Paket Ritual'] as const;

  // KPI Metrics
  readonly totalProducts = computed(() => this.productService.products().length);

  readonly discountedProducts = computed(() =>
    this.productService.products().filter((p) => p.price < p.originalPrice)
  );

  readonly discountedCount = computed(() => this.discountedProducts().length);

  readonly averageDiscount = computed(() => {
    const list = this.discountedProducts();
    if (list.length === 0) return 0;
    const sum = list.reduce(
      (acc, p) => acc + Math.round((1 - p.price / p.originalPrice) * 100),
      0
    );
    return Math.round(sum / list.length);
  });

  readonly totalSavings = computed(() => {
    return this.discountedProducts().reduce(
      (acc, p) => acc + (p.originalPrice - p.price),
      0
    );
  });

  // Filtered & Sorted Product List
  readonly filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    const filter = this.discountFilter();
    const sort = this.sortBy();

    let list = this.productService.products().filter((p) => {
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      const matchesCat = cat === 'Semua' || p.categoryLabel === cat;

      const isDisc = p.price < p.originalPrice;
      const matchesDiscount =
        filter === 'all' ||
        (filter === 'discounted' && isDisc) ||
        (filter === 'no-discount' && !isDisc);

      return matchesSearch && matchesCat && matchesDiscount;
    });

    return [...list].sort((a, b) => {
      const discA = this.calcDiscountPercent(a);
      const discB = this.calcDiscountPercent(b);

      switch (sort) {
        case 'discount-desc':
          return discB - discA;
        case 'discount-asc':
          return discA - discB;
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  });

  readonly isAllSelected = computed(() => {
    const visible = this.filteredProducts();
    const selected = this.selectedProductIds();
    return visible.length > 0 && visible.every((p) => selected.has(p.id));
  });

  // Utility Calculations
  readonly calcDiscountPercent = calcAdminDiscountPercent;
  readonly formatThousand = formatThousand;
  readonly onFormatNumericInput = syncThousandInput;

  // Inline Discount Operations
  onDiscountPercentChange(product: Product, percentValue: number | string): void {
    const num = Math.max(0, Math.min(99, Number(percentValue) || 0));
    this.productService.setProductDiscount(product.id, num);
    this.triggerToast(`Diskon ${product.title} diatur ke ${num}%`);
  }

  onSalePriceChange(product: Product, priceValue: number | string): void {
    const price = Math.max(0, parseThousand(priceValue));
    this.productService.setProductPrices(product.id, price, product.originalPrice);
    const pct = this.calcDiscountPercent({ ...product, price });
    this.triggerToast(`Harga ${product.title} diubah ke Rp ${price.toLocaleString('id-ID')} (${pct}% OFF)`);
  }

  onOriginalPriceChange(product: Product, origValue: number | string): void {
    const orig = Math.max(0, parseThousand(origValue));
    this.productService.setProductPrices(product.id, product.price, orig);
    this.triggerToast(`Harga Asli ${product.title} diubah ke Rp ${orig.toLocaleString('id-ID')}`);
  }

  applyPreset(product: Product, percent: number): void {
    this.productService.setProductDiscount(product.id, percent);
    this.triggerToast(`Diskon ${percent}% diterapkan ke ${product.title}`);
  }

  resetSingle(product: Product): void {
    this.productService.setProductPrices(product.id, product.originalPrice, product.originalPrice);
    this.triggerToast(`Diskon ${product.title} telah dihapus (Harga Normal)`);
  }

  // Bulk Discount Actions
  applyBulk(): void {
    const pct = Math.max(0, Math.min(99, this.bulkDiscountPercent()));
    const cat = this.bulkTargetCategory();
    this.productService.applyBulkDiscount(pct, cat);
    this.triggerToast(`Diskon massal ${pct}% berhasil diterapkan ke kategori: ${cat}!`);
  }

  resetBulk(): void {
    const cat = this.bulkTargetCategory();
    this.openConfirm({
      title: 'Reset Semua Diskon?',
      message: `Apakah Anda yakin ingin menghapus semua diskon untuk kategori "${cat}"? Harga jual akan dikembalikan sama dengan harga normal.`,
      confirmLabel: 'Ya, Reset Diskon',
      cancelLabel: 'Batal',
      isDanger: true,
      onConfirm: () => {
        this.productService.resetDiscounts(cat);
        this.triggerToast(`Semua diskon untuk kategori ${cat} telah direset.`);
      }
    });
  }

  // Multi-Selection Actions
  toggleSelectAll(): void {
    const current = new Set(this.selectedProductIds());
    const visible = this.filteredProducts();

    if (this.isAllSelected()) {
      visible.forEach((p) => current.delete(p.id));
    } else {
      visible.forEach((p) => current.add(p.id));
    }
    this.selectedProductIds.set(current);
  }

  toggleSelect(id: string): void {
    const current = new Set(this.selectedProductIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedProductIds.set(current);
  }

  clearSelection(): void {
    this.selectedProductIds.set(new Set());
  }

  applyDiscountToSelected(percent: number): void {
    const selected = Array.from(this.selectedProductIds());
    if (selected.length === 0) return;

    selected.forEach((id) => {
      this.productService.setProductDiscount(id, percent);
    });

    this.triggerToast(`Diskon ${percent}% diterapkan ke ${selected.length} produk terpilih.`);
    this.selectedProductIds.set(new Set());
  }

  resetSelected(): void {
    const selected = Array.from(this.selectedProductIds());
    if (selected.length === 0) return;

    selected.forEach((id) => {
      const p = this.productService.products().find((item) => item.id === id);
      if (p) {
        this.productService.setProductPrices(p.id, p.originalPrice, p.originalPrice);
      }
    });

    this.triggerToast(`Diskon dihapus dari ${selected.length} produk terpilih.`);
    this.selectedProductIds.set(new Set());
  }

  triggerToast(msg: string): void {
    this.toastMessage.set(msg);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set(null);
    }, 3200);
  }
}
