import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResellerService } from '../../../../../services/reseller.service';
import { ResellerProduct } from '../../../../../models/reseller-product.model';

@Component({
  selector: 'app-admin-reseller-products',
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './admin-reseller-products.html',
  styleUrl: './admin-reseller-products.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminResellerProductsComponent {
  readonly resellerService = inject(ResellerService);
  protected readonly Math = Math;

  // Filter & Search
  readonly searchQuery = signal<string>('');
  readonly selectedCategory = signal<string>('Semua');
  readonly selectedStatus = signal<'All' | 'Active' | 'Draft'>('All');

  // Modal Studio State
  readonly isModalOpen = signal<boolean>(false);
  readonly modalMode = signal<'add' | 'edit'>('add');
  readonly editingProductId = signal<string | null>(null);

  // Form Fields
  formTitle = signal<string>('');
  formSubtitle = signal<string>('');
  formCategoryLabel = signal<ResellerProduct['categoryLabel']>('Starter Kit');
  formWholesalePrice = signal<number>(500000);
  formRetailPrice = signal<number>(1000000);
  formMinOrder = signal<number>(1);
  formMinOrderUnit = signal<'paket' | 'karton' | 'lusin' | 'pcs'>('paket');
  formPackageContents = signal<string>('');
  formInventory = signal<number>(100);
  formStatus = signal<'Active' | 'Draft'>('Active');
  formSku = signal<string>('');
  formBpom = signal<string>('Resmi BPOM RI');
  formBadge = signal<string>('Best Seller Grosir ✦');
  formImage = signal<string>('products/glow-fresh-bundle.jpg');
  formBenefits = signal<string[]>([
    'Harga grosir pabrik langsung tanpa perantara',
    'Gratis materi promosi foto & video HD',
    'Garansi produk 100% original berizin BPOM RI'
  ]);
  tempBenefitInput = signal<string>('');

  // Toast
  readonly toastMessage = signal<string | null>(null);

  // Category list
  readonly categories: Array<ResellerProduct['categoryLabel'] | 'Semua'> = [
    'Semua',
    'Starter Kit',
    'Kartonan',
    'Paket Wajah',
    'Paket Tubuh',
    'Paket Kosmetik'
  ];

  // Preset Wholesale Packs for one-click creation
  readonly wholesalePresets = [
    {
      label: 'Paket Usaha Starter Glow (36 pcs)',
      title: 'Paket Starter Reseller Glowing Mix (36 Pcs)',
      subtitle: '12 Red Jelly + 12 AHA Toner + 12 Lip Cream',
      categoryLabel: 'Starter Kit' as const,
      wholesalePrice: 790000,
      retailPrice: 1650000,
      minOrder: 1,
      minOrderUnit: 'paket' as const,
      packageContents: '36 pcs produk best seller + Brosur & Banner Toko',
      image: 'products/glow-fresh-bundle.jpg',
      badge: 'Paling Populer ✦',
      sku: 'SYB-RSL-START-36'
    },
    {
      label: '1 Karton Red Jelly (48 pcs)',
      title: '1 Karton FORTE Red Jelly Serum (48 Pcs)',
      subtitle: 'Serum Niacinamide 10% Original Box Pabrik',
      categoryLabel: 'Kartonan' as const,
      wholesalePrice: 864000,
      retailPrice: 2280000,
      minOrder: 1,
      minOrderUnit: 'karton' as const,
      packageContents: '48 botol 20ml sealed + Acrylic Standee Counter',
      image: 'products/red-jelly-serum.jpg',
      badge: 'Best Seller Pabrik',
      sku: 'SYB-RSL-RJ-48'
    },
    {
      label: '1 Karton AHA Body Toner (24 pcs)',
      title: '1 Karton AHA Skinboost Body Toner (24 Pcs)',
      subtitle: 'Body Toner 250ml Pencerah Daki & Lipatan',
      categoryLabel: 'Paket Tubuh' as const,
      wholesalePrice: 840000,
      retailPrice: 2352000,
      minOrder: 1,
      minOrderUnit: 'karton' as const,
      packageContents: '24 botol jumbo 250ml segel barcode pabrik',
      image: 'products/aha-body-toner.jpg',
      badge: 'Margin Tinggi ✦',
      sku: 'SYB-RSL-AHA-24'
    }
  ];

  // Photo options
  readonly availableImages = [
    { label: 'Paket Bundling Glow', path: 'products/glow-fresh-bundle.jpg' },
    { label: 'FORTE Red Jelly Serum', path: 'products/red-jelly-serum.jpg' },
    { label: 'AHA Skinboost Body Toner', path: 'products/aha-body-toner.jpg' },
    { label: 'SYB Lip Cream Matte', path: 'products/lip-cream-matte.jpg' },
    { label: 'Golden Egg Jelly Mask', path: 'products/golden-egg-mask.jpg' },
    { label: 'Vitamin Lippy Oil Serum', path: 'products/lippy-oil-serum.jpg' },
    { label: 'Body Serum Booster', path: 'products/body-serum-booster.jpg' },
    { label: 'Peeling Serum Vit C', path: 'products/peeling-serum.jpg' },
  ];

  // Filtered Products
  readonly filteredProducts = computed(() => {
    const list = this.resellerService.resellerProducts();
    const cat = this.selectedCategory();
    const status = this.selectedStatus();
    const q = this.searchQuery().toLowerCase().trim();

    return list.filter((p) => {
      const matchCat = cat === 'Semua' || p.categoryLabel === cat;
      const matchStatus = status === 'All' || p.status === status;
      const matchQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.packageContents.toLowerCase().includes(q);
      return matchCat && matchStatus && matchQuery;
    });
  });

  // KPI Computeds
  readonly totalProductsCount = computed(() => this.resellerService.resellerProducts().length);
  readonly activeCount = computed(() => this.resellerService.resellerProducts().filter((p) => p.status === 'Active').length);
  readonly draftCount = computed(() => this.resellerService.resellerProducts().filter((p) => p.status === 'Draft').length);
  readonly totalStockUnits = computed(() =>
    this.resellerService.resellerProducts().reduce((sum, p) => sum + (p.inventory || 0), 0)
  );

  // Discount computation for Studio
  readonly discountPercent = computed(() => {
    const orig = this.formRetailPrice();
    const curr = this.formWholesalePrice();
    if (orig <= 0 || curr >= orig) return 0;
    return Math.round(((orig - curr) / orig) * 100);
  });

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3000);
  }

  openAddModal(): void {
    this.modalMode.set('add');
    this.editingProductId.set(null);
    this.formTitle.set('');
    this.formSubtitle.set('');
    this.formCategoryLabel.set('Starter Kit');
    this.formWholesalePrice.set(650000);
    this.formRetailPrice.set(1300000);
    this.formMinOrder.set(1);
    this.formMinOrderUnit.set('paket');
    this.formPackageContents.set('Paket komplit isi produk best seller + Brosur resmi');
    this.formInventory.set(100);
    this.formStatus.set('Active');
    this.formSku.set(`SYB-RSL-${Math.floor(1000 + Math.random() * 9000)}`);
    this.formBpom.set('Resmi BPOM RI');
    this.formBadge.set('Paling Populer ✦');
    this.formImage.set('products/glow-fresh-bundle.jpg');
    this.formBenefits.set([
      'Harga grosir pabrik langsung tanpa perantara',
      'Gratis materi promosi foto & video HD',
      'Garansi produk 100% original berizin BPOM RI'
    ]);
    this.tempBenefitInput.set('');
    this.isModalOpen.set(true);
  }

  openEditModal(p: ResellerProduct): void {
    this.modalMode.set('edit');
    this.editingProductId.set(p.id);
    this.formTitle.set(p.title);
    this.formSubtitle.set(p.subtitle);
    this.formCategoryLabel.set(p.categoryLabel);
    this.formWholesalePrice.set(p.wholesalePrice);
    this.formRetailPrice.set(p.retailPrice);
    this.formMinOrder.set(p.minOrder);
    this.formMinOrderUnit.set(p.minOrderUnit);
    this.formPackageContents.set(p.packageContents);
    this.formInventory.set(p.inventory);
    this.formStatus.set(p.status);
    this.formSku.set(p.sku);
    this.formBpom.set(p.bpomNumber);
    this.formBadge.set(p.badge || '');
    this.formImage.set(p.image);
    this.formBenefits.set([...(p.benefits || [])]);
    this.tempBenefitInput.set('');
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  applyPreset(preset: typeof this.wholesalePresets[0]): void {
    this.formTitle.set(preset.title);
    this.formSubtitle.set(preset.subtitle);
    this.formCategoryLabel.set(preset.categoryLabel);
    this.formWholesalePrice.set(preset.wholesalePrice);
    this.formRetailPrice.set(preset.retailPrice);
    this.formMinOrder.set(preset.minOrder);
    this.formMinOrderUnit.set(preset.minOrderUnit);
    this.formPackageContents.set(preset.packageContents);
    this.formImage.set(preset.image);
    this.formBadge.set(preset.badge);
    this.formSku.set(preset.sku);
    this.showToast(`Preset "${preset.label}" berhasil diterapkan!`);
  }

  addBenefit(): void {
    const val = this.tempBenefitInput().trim();
    if (val) {
      this.formBenefits.update((list) => [...list, val]);
      this.tempBenefitInput.set('');
    }
  }

  removeBenefit(index: number): void {
    this.formBenefits.update((list) => list.filter((_, i) => i !== index));
  }

  saveProduct(): void {
    if (!this.formTitle().trim()) {
      alert('Mohon isi nama paket reseller!');
      return;
    }

    const title = this.formTitle().trim();
    const wholesalePrice = Number(this.formWholesalePrice()) || 0;
    const retailPrice = Number(this.formRetailPrice()) || wholesalePrice;
    const minOrder = Math.max(1, Number(this.formMinOrder()) || 1);
    const inventory = Math.max(0, Number(this.formInventory()) || 0);

    if (this.modalMode() === 'edit' && this.editingProductId()) {
      const existing = this.resellerService.resellerProducts().find((p) => p.id === this.editingProductId());
      if (existing) {
        const updated: ResellerProduct = {
          ...existing,
          title,
          subtitle: this.formSubtitle().trim() || title,
          categoryLabel: this.formCategoryLabel(),
          wholesalePrice,
          retailPrice,
          minOrder,
          minOrderUnit: this.formMinOrderUnit(),
          packageContents: this.formPackageContents().trim() || 'Paket Grosir Resmi SYB',
          inventory,
          status: this.formStatus(),
          sku: this.formSku().trim() || existing.sku,
          bpomNumber: this.formBpom().trim() || 'Resmi BPOM RI',
          badge: this.formBadge().trim(),
          image: this.formImage(),
          benefits: this.formBenefits(),
        };
        this.resellerService.updateResellerProduct(updated);
        this.showToast(`Paket "${updated.title}" berhasil diperbarui! ✨`);
        this.closeModal();
        return;
      }
    }

    // Add new reseller product
    const newId = `reseller-${Date.now()}`;
    const newProduct: ResellerProduct = {
      id: newId,
      title,
      subtitle: this.formSubtitle().trim() || 'Paket Grosir Resmi SYB',
      category: `Grosir/${this.formCategoryLabel()}`,
      categoryLabel: this.formCategoryLabel(),
      image: this.formImage(),
      wholesalePrice,
      retailPrice,
      minOrder,
      minOrderUnit: this.formMinOrderUnit(),
      packageContents: this.formPackageContents().trim() || 'Paket Grosir Resmi SYB',
      inventory,
      status: this.formStatus(),
      sku: this.formSku().trim() || `SYB-RSL-${Math.floor(1000 + Math.random() * 9000)}`,
      badge: this.formBadge().trim(),
      bpomNumber: this.formBpom().trim() || 'Resmi BPOM RI',
      accentColor: '#10b981',
      benefits: this.formBenefits(),
    };

    this.resellerService.addResellerProduct(newProduct);
    this.showToast(`Paket "${newProduct.title}" berhasil ditambahkan! 📦`);
    this.closeModal();
  }

  toggleStatus(p: ResellerProduct): void {
    this.resellerService.toggleStatus(p.id);
    const newStatus = p.status === 'Active' ? 'Draft' : 'Active';
    this.showToast(`Status "${p.title}" diubah ke ${newStatus}`);
  }

  deleteProduct(p: ResellerProduct): void {
    if (confirm(`Apakah Anda yakin ingin menghapus paket reseller "${p.title}"?`)) {
      this.resellerService.deleteResellerProduct(p.id);
      this.showToast(`Paket "${p.title}" telah dihapus.`);
    }
  }

  resetToDefault(): void {
    if (confirm('Kembalikan katalog paket reseller ke data awal pabrik?')) {
      this.resellerService.resetToDefault();
      this.showToast('Katalog paket reseller berhasil direset!');
    }
  }
}
