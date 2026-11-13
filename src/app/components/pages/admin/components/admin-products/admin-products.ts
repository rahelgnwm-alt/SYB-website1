import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../../services/product.service';
import { Product, ProductVariant } from '../../../../../models/product.model';
import { MAX_PRODUCT_IMAGES, normalizeProductGallery, resolveImgUrl } from '../../../../../data';

export interface ProductConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  isDanger?: boolean;
  product?: Product;
  onConfirm: () => void;
}

@Component({
  selector: 'app-admin-products',
  imports: [FormsModule],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProductsComponent {
  readonly productService = inject(ProductService);
  protected readonly Math = Math;

  // Filters & Search
  readonly searchProductQuery = signal<string>('');
  readonly productCategoryFilter = signal<string>('Semua');
  readonly productStatusFilter = signal<'All' | 'Active' | 'Draft'>('All');
  readonly productStockFilter = signal<'All' | 'LowStock' | 'OutOfStock' | 'PreOrder'>('All');
  readonly productSortBy = signal<'default' | 'price-asc' | 'price-desc' | 'stock-desc' | 'name'>('default');

  // Quick preset templates for rapid product curation
  readonly beautyPresets = [
    {
      label: '✨ Serum Wajah Niacinamide',
      title: 'NEW SYB Collagen Bright Glow Serum 30ml',
      subtitle: 'Niacinamide 10% + Red Algae extract untuk kulit glowing kenyal seketika',
      categoryLabel: 'Wajah' as const,
      productType: 'Serum Wajah',
      price: 32500,
      origPrice: 65000,
      costPrice: 15000,
      inventory: 1200,
      bpom: 'NA18230104821',
      badge: 'New Arrival ✦',
      image: 'products/red-jelly-serum.jpg',
      accentColor: '#ff2a7a',
      ingredients: ['Niacinamide 10%', 'Hydrolyzed Collagen', 'Red Algae', 'Hyaluronic Acid 4D'],
      benefits: ['Mencerahkan noda hitam & bekas jerawat dalam 14 hari', 'Mengunci kelembapan dan elastisitas kulit', 'Ringan dan cepat meresap tanpa rasa lengket']
    },
    {
      label: '🫧 AHA Body Toner Eksfoliasi',
      title: 'NEW SYB GlowBoost AHA Body Exfoliating Toner 250ml',
      subtitle: 'Glycolic Acid 7% mencerahkan area lipatan siku, leher, dan lutut',
      categoryLabel: 'Tubuh' as const,
      productType: 'Body Toner',
      price: 48000,
      origPrice: 85000,
      costPrice: 22000,
      inventory: 850,
      bpom: 'NA18230701923',
      badge: 'Viral TikTok ✦',
      image: 'products/aha-body-toner.jpg',
      accentColor: '#e84393',
      ingredients: ['Glycolic Acid 7%', 'Niacinamide', 'Aloe Vera Extract', 'Panthenol B5'],
      benefits: ['Mengangkat sel kulit mati penyebab kusam di badan', 'Mencerahkan ketiak, leher, dan lipatan tubuh', 'Kulit badan halus bercahaya sejak pemakaian pertama']
    },
    {
      label: '🍯 Bright Glow Jelly Mask',
      title: 'SYB Golden Caviar Deep Nourish Jelly Mask 50gr',
      subtitle: 'Masker tidur jelly emas merelaksasi dan meregenerasi sel kulit semalaman',
      categoryLabel: 'Wajah' as const,
      productType: 'Sleeping Mask',
      price: 68000,
      origPrice: 120000,
      costPrice: 30000,
      inventory: 640,
      bpom: 'NA18220200889',
      badge: 'Best Seller ✦',
      image: 'products/golden-egg-mask.jpg',
      accentColor: '#e17055',
      ingredients: ['Gold Flakes 24K', 'Caviar Extract', 'Squalane', 'Centella Asiatica'],
      benefits: ['Kaya antioksidan menangkal penuaan dini', 'Bangun tidur dengan kulit kenyal, segar & glowing', 'Meredakan iritasi dan kemerahan di wajah']
    },
    {
      label: '💄 Velvet Lip Tint Matte',
      title: 'SYB Butter Velvet Lip Cream Shade 07 Rosy Nude',
      subtitle: 'Formula airy-matte transferproof dengan infusi Vitamin E dan Jojoba Oil',
      categoryLabel: 'Makeup' as const,
      productType: 'Lip Matte',
      price: 24500,
      origPrice: 45000,
      costPrice: 11000,
      inventory: 1500,
      bpom: 'NA18231300941',
      badge: 'Fav Shade ✦',
      image: 'products/lip-cream-matte.jpg',
      accentColor: '#d63031',
      ingredients: ['Vitamin E Acetate', 'Jojoba Seed Oil', 'Ceramide NP', 'Pigment Dispersion Ultra-Fine'],
      benefits: ['Warna intens satu kali usap tahan hingga 12 jam', 'Tidak bikin garis bibir pecah-pecah', 'Formula super ringan serasa tidak memakai lip cream']
    },
    {
      label: '🎁 Paket Bundling Hemat 3in1',
      title: 'SYB Ultimate Glow 3in1 Daily Ritual Treatment Box',
      subtitle: 'Paket bundling lengkap: Serum Wajah + Body Booster + Jelly Mask + Pouch Eksklusif',
      categoryLabel: 'Paket Ritual' as const,
      productType: 'Bundling Set',
      price: 99000,
      origPrice: 195000,
      costPrice: 48000,
      inventory: 350,
      bpom: 'NA18230104821 (Paket Resmi)',
      badge: 'Hemat 50% ✦',
      image: 'products/glow-fresh-bundle.jpg',
      accentColor: '#fd79a8',
      ingredients: ['Niacinamide Kompleks', 'Gold Caviar', 'Body Serum Booster'],
      benefits: ['Solusi lengkap wajah cerah dan tubuh glowing merata', 'Hemat lebih dari 95 ribu dibanding beli satuan', 'Gratis Beauty Pouch SYB Official edisi terbatas']
    }
  ];

  // ===================== PRODUCT MODAL STATE =====================
  readonly isProductModalOpen = signal<boolean>(false);
  readonly modalMode = signal<'add' | 'edit'>('add');
  readonly editingProductId = signal<string | null>(null);
  readonly activeStudioTab = signal<'all' | 'basic' | 'preorder' | 'pricing' | 'media' | 'formula' | 'variants'>('all');
  readonly isPreviewVisible = signal<boolean>(true);

  // Product Media Upload State (up to 10 pictures per product)
  readonly maxProductImages = MAX_PRODUCT_IMAGES;
  readonly isDraggingImage = signal<boolean>(false);
  readonly draggedGalleryIndex = signal<number | null>(null);
  readonly dragOverGalleryIndex = signal<number | null>(null);

  readonly suggestedIngredients = [
    'Niacinamide 10%',
    'Hyaluronic Acid 4D',
    'Centella Asiatica',
    'Hydrolyzed Collagen',
    'Glycolic Acid (AHA)',
    'Vitamin E',
    'Ceramide NP',
    'Alpha Arbutin',
    'Retinol 1%'
  ];

  readonly commonProductTypes = [
    'Serum Wajah',
    'Body Toner',
    'Jelly Mask',
    'Lip Matte',
    'Sunscreen SPF 50',
    'Facial Wash',
    'Body Booster'
  ];

  // Form Fields
  formTitle = signal<string>('');
  formSubtitle = signal<string>('');
  formCategoryLabel = signal<Product['categoryLabel']>('Wajah');
  formProductType = signal<string>('Serum Wajah');
  formStatus = signal<'Active' | 'Draft'>('Active');
  formPrice = signal<number>(35000);
  formOrigPrice = signal<number>(65000);
  formCostPrice = signal<number>(18000);
  formInventory = signal<number>(500);
  formSku = signal<string>('SYB-NEW-01');
  formBpom = signal<string>('NA18230109999');
  formBadge = signal<string>('New Arrival ✦');
  formImage = signal<string>('products/red-jelly-serum.jpg');
  formGallery = signal<string[]>([]);
  formAccentColor = signal<string>('#ff2a7a');
  formHeroTagline = signal<string>('Formula pencerah intensif teruji klinis!');
  formDescription = signal<string>('');
  formBenefits = signal<string[]>(['Mencerahkan kulit seketika', 'Formula ringan cepat meresap']);
  formKeyIngredients = signal<string[]>(['Niacinamide 10%', 'Hyaluronic Acid 4D']);
  formHowToUse = signal<string[]>(['Teteskan 2-3 tetes ke seluruh wajah bersih', 'Gunakan teratur pagi dan malam hari']);
  formIsFeatured = signal<boolean>(false);
  formIsFlashSale = signal<boolean>(false);
  formIsPreOrder = signal<boolean>(false);
  formPreOrderDays = signal<number>(7);
  formPreOrderNote = signal<string>('');
  readonly maxPreOrderDaysLimit = 30;
  formVariants = signal<ProductVariant[]>([
    { id: 'v1', name: 'Regular Size 20ml', price: 35000, stock: 500, sku: 'SYB-REG-01' }
  ]);

  // Temporary inputs for list builders
  tempBenefitInput = signal<string>('');
  tempIngredientInput = signal<string>('');
  tempHowToUseInput = signal<string>('');

  // Toast
  readonly toastMessage = signal<string | null>(null);

  // Custom Confirmation Popup Dialog
  readonly confirmDialog = signal<ProductConfirmDialogState | null>(null);

  openConfirm(options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDanger?: boolean;
    product?: Product;
    onConfirm: () => void;
  }): void {
    this.confirmDialog.set({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel || 'Ya, Hapus Produk',
      cancelLabel: options.cancelLabel || 'Batal',
      isDanger: options.isDanger ?? true,
      product: options.product,
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

  // Real-time calculations
  readonly discountPercent = computed(() => {
    const orig = this.formOrigPrice();
    const curr = this.formPrice();
    if (orig <= 0 || curr >= orig) return 0;
    return Math.round(((orig - curr) / orig) * 100);
  });

  // Computeds
  readonly totalProductsCount = computed(() => this.productService.products().length);
  readonly activeProductsCount = computed(() => this.productService.products().filter(p => p.status === 'Active').length);
  readonly lowStockProductsCount = computed(() => this.productService.products().filter(p => p.inventory < 500).length);
  readonly preOrderProductsCount = computed(() => this.productService.products().filter(p => p.isPreOrder).length);
  readonly totalInventoryValue = computed(() =>
    this.productService.products().reduce((acc, p) => acc + (p.price * p.inventory), 0)
  );

  readonly filteredProducts = computed(() => {
    const list = this.productService.products();
    const query = this.searchProductQuery().toLowerCase().trim();
    const status = this.productStatusFilter();
    const cat = this.productCategoryFilter();
    const stock = this.productStockFilter();
    const sort = this.productSortBy();

    let filtered = list.filter((p) => {
      const matchStatus = status === 'All' || p.status === status;
      const matchCat = cat === 'Semua' || p.categoryLabel === cat;
      const matchQuery =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.bpomNumber.toLowerCase().includes(query) ||
        (p.variants[0]?.sku || '').toLowerCase().includes(query);

      let matchStock = true;
      if (stock === 'LowStock') {
        matchStock = p.inventory > 0 && p.inventory < 500;
      } else if (stock === 'OutOfStock') {
        matchStock = p.inventory === 0;
      } else if (stock === 'PreOrder') {
        matchStock = Boolean(p.isPreOrder);
      }

      return matchStatus && matchCat && matchQuery && matchStock;
    });

    if (sort === 'price-asc') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sort === 'stock-desc') {
      filtered = [...filtered].sort((a, b) => b.inventory - a.inventory);
    } else if (sort === 'name') {
      filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  });

  readonly getImgUrl = resolveImgUrl;

  formatThousand(n: number | string | null | undefined): string {
    if (n === null || n === undefined || n === '') return '';
    const num = typeof n === 'number' ? Math.round(n) : parseInt(n.toString().replace(/\D/g, ''), 10);
    if (isNaN(num)) return '';
    return num.toLocaleString('id-ID');
  }

  parseThousand(val: string | number | null | undefined): number {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const clean = val.toString().replace(/\D/g, '');
    return clean ? parseInt(clean, 10) : 0;
  }

  handlePriceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const rawDigits = input.value.replace(/\D/g, '');
    if (!rawDigits) {
      this.formPrice.set(0);
      input.value = '';
      return;
    }
    const parsed = parseInt(rawDigits, 10);
    this.formPrice.set(parsed);
    input.value = this.formatThousand(parsed);
  }

  handleOrigPriceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const rawDigits = input.value.replace(/\D/g, '');
    if (!rawDigits) {
      this.formOrigPrice.set(0);
      input.value = '';
      return;
    }
    const parsed = parseInt(rawDigits, 10);
    this.formOrigPrice.set(parsed);
    input.value = this.formatThousand(parsed);
  }

  handleInventoryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const rawDigits = input.value.replace(/\D/g, '');
    if (!rawDigits) {
      this.formInventory.set(0);
      input.value = '';
      return;
    }
    const parsed = parseInt(rawDigits, 10);
    this.formInventory.set(parsed);
    input.value = this.formatThousand(parsed);
  }

  handleVariantPriceInput(event: Event, variant: ProductVariant): void {
    const input = event.target as HTMLInputElement;
    const rawDigits = input.value.replace(/\D/g, '');
    if (!rawDigits) {
      variant.price = 0;
      input.value = '';
      return;
    }
    const parsed = parseInt(rawDigits, 10);
    variant.price = parsed;
    input.value = this.formatThousand(parsed);
  }

  handleVariantStockInput(event: Event, variant: ProductVariant): void {
    const input = event.target as HTMLInputElement;
    const rawDigits = input.value.replace(/\D/g, '');
    if (!rawDigits) {
      variant.stock = 0;
      input.value = '';
      return;
    }
    const parsed = parseInt(rawDigits, 10);
    variant.stock = parsed;
    input.value = this.formatThousand(parsed);
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3200);
  }

  openAddProductModal(): void {
    this.modalMode.set('add');
    this.editingProductId.set(null);
    this.formTitle.set('');
    this.formSubtitle.set('');
    this.formCategoryLabel.set('Wajah');
    this.formProductType.set('Serum Wajah');
    this.formStatus.set('Active');
    this.formPrice.set(35000);
    this.formOrigPrice.set(65000);
    this.formCostPrice.set(18000);
    this.formInventory.set(500);
    this.formSku.set(`SYB-${Math.floor(1000 + Math.random() * 9000)}`);
    this.formBpom.set('NA182301' + Math.floor(10000 + Math.random() * 90000));
    this.formBadge.set('New Arrival ✦');
    this.setFormGallery([]);
    this.formAccentColor.set('#ff0a6c');
    this.formHeroTagline.set('Formula pencerah kulit intensif teruji klinis!');
    this.formDescription.set('Diformulasikan lembut dengan konsentrat bahan aktif untuk hasil glowing maksimal.');
    this.formBenefits.set(['Mencerahkan kulit seketika', 'Formula ringan cepat meresap']);
    this.formKeyIngredients.set(['Niacinamide 10%', 'Hyaluronic Acid 4D']);
    this.formHowToUse.set(['Teteskan 2-3 tetes ke wajah bersih', 'Gunakan teratur pagi dan malam hari']);
    this.formIsFeatured.set(false);
    this.formIsFlashSale.set(false);
    this.formIsPreOrder.set(false);
    this.formPreOrderDays.set(this.productService.defaultPreOrderDays());
    this.formPreOrderNote.set('');
    this.formVariants.set([
      { id: 'v1', name: 'Regular Size 20ml', price: 35000, stock: 500, sku: 'SYB-REG-01' }
    ]);
    this.activeStudioTab.set('all');
    this.isProductModalOpen.set(true);
  }

  openEditProductModal(prod: Product): void {
    this.modalMode.set('edit');
    this.editingProductId.set(prod.id);
    this.activeStudioTab.set('all');
    this.formTitle.set(prod.title);
    this.formSubtitle.set(prod.subtitle);
    this.formCategoryLabel.set(prod.categoryLabel);
    this.formProductType.set(prod.productType || `Perawatan ${prod.categoryLabel}`);
    this.formStatus.set(prod.status === 'Archived' ? 'Draft' : prod.status);
    this.formPrice.set(prod.price);
    this.formOrigPrice.set(prod.originalPrice || Math.round(prod.price * 1.5));
    this.formCostPrice.set(prod.costPrice || Math.round(prod.price * 0.45));
    this.formInventory.set(prod.inventory);
    this.formSku.set(prod.variants[0]?.sku || `SYB-${Math.floor(1000 + Math.random() * 9000)}`);
    this.formBpom.set(prod.bpomNumber || 'NA18230109999');
    this.formBadge.set(prod.badge || 'Best Seller ✦');
    this.setFormGallery(normalizeProductGallery(prod.image, prod.gallery));
    this.formAccentColor.set(prod.accentColor || '#ff0a6c');
    this.formHeroTagline.set(prod.heroTagline || prod.subtitle);
    this.formDescription.set(prod.description || prod.subtitle);
    this.formBenefits.set([...(prod.benefits || ['Mencerahkan kulit seketika'])]);
    this.formKeyIngredients.set([...(prod.keyIngredients || ['Niacinamide'])]);
    this.formHowToUse.set([...(prod.howToUse || ['Gunakan secara teratur setiap hari'])]);
    this.formIsFeatured.set(!!prod.isFeatured);
    this.formIsFlashSale.set(!!prod.isFlashSale);
    this.formIsPreOrder.set(!!prod.isPreOrder);
    this.formPreOrderDays.set(Math.max(1, Math.min(30, prod.preOrderDays || this.productService.defaultPreOrderDays())));
    this.formPreOrderNote.set(prod.preOrderNote || '');
    this.formVariants.set(prod.variants?.length ? [...prod.variants] : [
      { id: 'v1', name: 'Regular Size', price: prod.price, stock: prod.inventory, sku: 'SYB-01' }
    ]);
    this.isProductModalOpen.set(true);
  }

  applyPreset(preset: typeof this.beautyPresets[0]): void {
    this.formTitle.set(preset.title);
    this.formSubtitle.set(preset.subtitle);
    this.formCategoryLabel.set(preset.categoryLabel);
    this.formProductType.set(preset.productType);
    this.formPrice.set(preset.price);
    this.formOrigPrice.set(preset.origPrice);
    this.formCostPrice.set(preset.costPrice);
    this.formInventory.set(preset.inventory);
    this.formBpom.set(preset.bpom);
    this.formBadge.set(preset.badge);
    this.setFormGallery([preset.image]);
    this.formAccentColor.set(preset.accentColor);
    this.formKeyIngredients.set([...preset.ingredients]);
    this.formBenefits.set([...preset.benefits]);
    this.formDescription.set(preset.subtitle);
    this.formHeroTagline.set(preset.subtitle);
    this.showToast(`Preset "${preset.label}" berhasil diterapkan!`);
  }

  closeProductModal(): void {
    this.isProductModalOpen.set(false);
  }

  saveProduct(): void {
    if (!this.formTitle().trim()) {
      this.showToast('⚠️ Mohon isi nama produk terlebih dahulu!');
      return;
    }

    const title = this.formTitle().trim();
    const price = Number(this.formPrice()) || 0;
    const origPrice = Number(this.formOrigPrice()) || price;
    const costPrice = Number(this.formCostPrice()) || Math.round(price * 0.45);
    const inventory = Number(this.formInventory()) || 0;
    const catLabel = this.formCategoryLabel();
    const bpom = this.formBpom().trim();
    const cleanedGallery = this.formGallery().filter(Boolean).slice(0, this.maxProductImages);
    const finalGallery = cleanedGallery.length > 0 ? cleanedGallery : ['products/red-jelly-serum.jpg'];
    const primaryImage = finalGallery[0];

    if (this.modalMode() === 'edit' && this.editingProductId()) {
      const existing = this.productService.products().find(p => p.id === this.editingProductId());
      if (existing) {
        const updated: Product = {
          ...existing,
          title,
          subtitle: this.formSubtitle().trim() || title,
          category: `Kecantikan/Perawatan ${catLabel}`,
          categoryLabel: catLabel,
          productType: this.formProductType(),
          status: this.formStatus(),
          price,
          originalPrice: origPrice,
          costPrice,
          inventory,
          bpomNumber: bpom,
          badge: this.formBadge(),
          image: primaryImage,
          gallery: finalGallery,
          accentColor: this.formAccentColor(),
          heroTagline: this.formHeroTagline() || title,
          description: this.formDescription() || this.formSubtitle(),
          benefits: this.formBenefits(),
          keyIngredients: this.formKeyIngredients(),
          howToUse: this.formHowToUse(),
          isFeatured: this.formIsFeatured(),
          isFlashSale: this.formIsFlashSale(),
          isPreOrder: this.formIsPreOrder(),
          preOrderDays: Math.max(1, Math.min(30, Math.round(Number(this.formPreOrderDays()) || 7))),
          preOrderNote: this.formPreOrderNote().trim() || undefined,
          variants: this.formVariants().map((v, i) => ({
            ...v,
            price: i === 0 ? price : v.price,
            stock: i === 0 ? inventory : v.stock
          }))
        };
        this.productService.updateProduct(updated);
        this.showToast(`Produk "${updated.title}" berhasil diperbarui! ✨`);
        this.closeProductModal();
        return;
      }
    }

    // Add new product
    const newId = `syb-${Date.now()}`;
    const newProd: Product = {
      id: newId,
      title,
      subtitle: this.formSubtitle().trim() || 'Formula istimewa dari SYB Official',
      category: `Kecantikan/Perawatan ${catLabel}`,
      categoryLabel: catLabel,
      productType: this.formProductType(),
      status: this.formStatus(),
      inventory,
      variantsCount: this.formVariants().length,
      variants: this.formVariants().length ? this.formVariants() : [
        {
          id: 'v1',
          name: 'Regular Size',
          stock: inventory,
          price,
          sku: this.formSku()
        }
      ],
      channels: 4,
      catalogs: 2,
      price,
      originalPrice: origPrice,
      costPrice,
      rating: 5.0,
      reviewsCount: 1,
      badge: this.formBadge(),
      bpomNumber: bpom,
      accentColor: this.formAccentColor(),
      image: primaryImage,
      gallery: finalGallery,
      handle: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      heroTagline: this.formHeroTagline() || title,
      description: this.formDescription() || this.formSubtitle(),
      benefits: this.formBenefits(),
      keyIngredients: this.formKeyIngredients(),
      howToUse: this.formHowToUse(),
      isFeatured: this.formIsFeatured(),
      isFlashSale: this.formIsFlashSale(),
      isPreOrder: this.formIsPreOrder(),
      preOrderDays: Math.max(1, Math.min(30, Math.round(Number(this.formPreOrderDays()) || 7))),
      preOrderNote: this.formPreOrderNote().trim() || undefined
    };

    this.productService.addProduct(newProd);
    this.showToast(`Produk "${newProd.title}" berhasil ditambahkan ke katalog! 🛍️`);
    this.closeProductModal();
  }

  duplicateProduct(prod: Product): void {
    const copy: Product = {
      ...prod,
      id: `syb-${Date.now()}`,
      title: `${prod.title} (Salinan)`,
      handle: `${prod.handle}-copy-${Date.now().toString().slice(-4)}`,
      status: 'Draft',
      reviewsCount: 0
    };
    this.productService.addProduct(copy);
    this.showToast(`Salinan produk dibuat sebagai Draft.`);
  }

  deleteProduct(id: string): void {
    const prod = this.productService.products().find(p => p.id === id);
    if (!prod) return;

    this.openConfirm({
      title: 'Hapus Produk dari Toko?',
      message: `Apakah Anda yakin ingin menghapus "${prod.title}"? Tindakan ini akan menghapus produk secara permanen dari etalase toko dan database SQL.`,
      confirmLabel: 'Ya, Hapus Produk',
      cancelLabel: 'Batal',
      isDanger: true,
      product: prod,
      onConfirm: () => {
        this.productService.deleteProduct(id);
        this.showToast(`Produk "${prod.title}" berhasil dihapus.`);
      }
    });
  }

  toggleProductStatus(prod: Product): void {
    const newStatus: Product['status'] = prod.status === 'Active' ? 'Draft' : 'Active';
    const updated: Product = { ...prod, status: newStatus };
    this.productService.updateProduct(updated);
    this.showToast(`Status "${prod.title}" diubah menjadi ${newStatus}`);
  }

  addIngredientChip(ing: string): void {
    const trimmed = ing.trim();
    if (!trimmed) return;
    if (!this.formKeyIngredients().includes(trimmed)) {
      this.formKeyIngredients.update(list => [...list, trimmed]);
    }
    this.tempIngredientInput.set('');
  }

  removeIngredientChip(index: number): void {
    this.formKeyIngredients.update(list => list.filter((_, i) => i !== index));
  }

  addBenefitItem(): void {
    const text = this.tempBenefitInput().trim();
    if (text) {
      this.formBenefits.update(list => [...list, text]);
      this.tempBenefitInput.set('');
    }
  }

  removeBenefitItem(index: number): void {
    this.formBenefits.update(list => list.filter((_, i) => i !== index));
  }

  addHowToUseItem(): void {
    const text = this.tempHowToUseInput().trim();
    if (text) {
      this.formHowToUse.update(list => [...list, text]);
      this.tempHowToUseInput.set('');
    }
  }

  removeHowToUseItem(index: number): void {
    this.formHowToUse.update(list => list.filter((_, i) => i !== index));
  }

  addVariantItem(): void {
    const newVar: ProductVariant = {
      id: `v${Date.now()}`,
      name: 'Varian Baru (e.g. 50ml Jumbo)',
      price: this.formPrice(),
      stock: 200,
      sku: `SYB-VAR-${Math.floor(100 + Math.random() * 900)}`
    };
    this.formVariants.update(list => [...list, newVar]);
  }

  removeVariantItem(index: number): void {
    if (this.formVariants().length <= 1) {
      this.showToast('⚠️ Produk harus memiliki setidaknya satu varian utama.');
      return;
    }
    this.formVariants.update(list => list.filter((_, i) => i !== index));
  }

  setStudioTab(tab: 'all' | 'basic' | 'preorder' | 'pricing' | 'media' | 'formula' | 'variants'): void {
    this.activeStudioTab.set(tab);
  }

  togglePreview(): void {
    this.isPreviewVisible.update(v => !v);
  }

  adjustFormInventory(delta: number): void {
    this.formInventory.update(curr => Math.max(0, curr + delta));
  }

  onPreOrderDaysInput(value: number | string): void {
    const parsed = Math.round(Number(value));
    if (Number.isNaN(parsed) || parsed < 1) {
      this.formPreOrderDays.set(1);
      return;
    }
    this.formPreOrderDays.set(Math.min(30, parsed));
  }

  /** Sets normalized gallery list (max 10) and syncs primary cover `formImage`. */
  setFormGallery(images: string[]): void {
    const cleaned = normalizeProductGallery(undefined, images, this.maxProductImages);
    this.formGallery.set(cleaned);
    this.formImage.set(cleaned[0] || '');
  }

  /** Appends one or more image URLs/data URIs up to the 10-photo cap. */
  addGalleryImages(newImages: string[]): number {
    const current = this.formGallery();
    const remaining = this.maxProductImages - current.length;
    if (remaining <= 0) {
      this.showToast(`⚠️ Maksimal ${this.maxProductImages} foto per produk telah tercapai.`);
      return 0;
    }

    const existingSet = new Set(current);
    const toAdd: string[] = [];
    for (const raw of newImages) {
      const val = (raw || '').trim();
      if (!val || existingSet.has(val)) continue;
      existingSet.add(val);
      toAdd.push(val);
      if (toAdd.length >= remaining) break;
    }

    if (toAdd.length > 0) {
      this.setFormGallery([...current, ...toAdd]);
    }
    return toAdd.length;
  }

  reorderGalleryImage(fromIndex: number, toIndex: number): void {
    const list = [...this.formGallery()];
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      fromIndex >= list.length ||
      toIndex < 0 ||
      toIndex >= list.length
    ) {
      return;
    }
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    this.setFormGallery(list);
    if (toIndex === 0) {
      this.showToast('✓ Foto utama (Slot #1) berhasil diperbarui.');
    }
  }

  onGalleryDragStart(event: DragEvent, index: number): void {
    this.draggedGalleryIndex.set(index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  onGalleryDragOver(event: DragEvent, index: number): void {
    if (this.draggedGalleryIndex() === null) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (this.dragOverGalleryIndex() !== index) {
      this.dragOverGalleryIndex.set(index);
    }
  }

  onGalleryDragLeave(index: number): void {
    if (this.dragOverGalleryIndex() === index) {
      this.dragOverGalleryIndex.set(null);
    }
  }

  onGalleryDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    event.stopPropagation();
    const raw = event.dataTransfer?.getData('text/plain');
    const parsed = raw !== undefined && raw !== '' ? Number(raw) : NaN;
    const fromIndex = this.draggedGalleryIndex() ?? (Number.isInteger(parsed) ? parsed : null);
    this.draggedGalleryIndex.set(null);
    this.dragOverGalleryIndex.set(null);
    if (fromIndex !== null) {
      this.reorderGalleryImage(fromIndex, targetIndex);
    }
  }

  onGalleryDragEnd(): void {
    this.draggedGalleryIndex.set(null);
    this.dragOverGalleryIndex.set(null);
  }

  removeGalleryImage(index: number): void {
    const list = this.formGallery();
    if (index < 0 || index >= list.length) return;
    this.setFormGallery(list.filter((_, i) => i !== index));
    this.showToast('Foto telah dihapus dari galeri produk.');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      void this.processImageFiles(Array.from(input.files));
      input.value = '';
    }
  }

  onImageDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingImage.set(false);
    if (this.draggedGalleryIndex() !== null) return;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      void this.processImageFiles(Array.from(event.dataTransfer.files));
    }
  }

  onImageDragOver(event: DragEvent): void {
    if (this.draggedGalleryIndex() !== null) return;
    event.preventDefault();
    this.isDraggingImage.set(true);
  }

  onImageDragLeave(): void {
    this.isDraggingImage.set(false);
  }

  private async processImageFiles(files: File[]): Promise<void> {
    const remaining = this.maxProductImages - this.formGallery().length;
    if (remaining <= 0) {
      this.showToast(`⚠️ Maksimal ${this.maxProductImages} foto per produk telah tercapai.`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        this.showToast(`⚠️ "${file.name}" bukan file gambar (JPG, PNG, WEBP).`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.showToast(`⚠️ Ukuran "${file.name}" melebihi batas 5 MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    const sliced = validFiles.slice(0, remaining);
    const truncated = validFiles.length > remaining;

    const dataUrls = await Promise.all(sliced.map((file) => this.readAndOptimizeImageFile(file)));
    const addedCount = this.addGalleryImages(dataUrls.filter((u): u is string => Boolean(u)));

    if (addedCount > 0) {
      const limitNote = truncated ? ` (dibatasi maksimal ${this.maxProductImages} foto)` : '';
      this.showToast(`✓ ${addedCount} foto ditambahkan (${this.formGallery().length}/${this.maxProductImages})${limitNote}`);
    }
  }

  private readAndOptimizeImageFile(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onerror = () => resolve(null);
      reader.onload = () => {
        const rawUrl = reader.result as string;
        if (!rawUrl || file.size <= 350 * 1024 || typeof Image === 'undefined' || typeof document === 'undefined') {
          resolve(rawUrl);
          return;
        }

        let settled = false;
        const finish = (val: string) => {
          if (settled) return;
          settled = true;
          resolve(val);
        };

        const timer = setTimeout(() => finish(rawUrl), 1500);
        const img = new Image();
        img.onerror = () => {
          clearTimeout(timer);
          finish(rawUrl);
        };
        img.onload = () => {
          clearTimeout(timer);
          const maxDim = 1080;
          let { width, height } = img;
          if (!width || !height) {
            finish(rawUrl);
            return;
          }
          if (width > maxDim || height > maxDim) {
            const scale = maxDim / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            finish(rawUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const outMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const compressed = canvas.toDataURL(outMime, 0.85);
          finish(compressed.length < rawUrl.length ? compressed : rawUrl);
        };
        img.src = rawUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  onImgError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'products/red-jelly-serum.jpg';
    }
  }
}
