import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../../services/product.service';
import { Product, ProductVariant } from '../../../../../models/product.model';

@Component({
  selector: 'app-admin-products',
  imports: [CommonModule, FormsModule],
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
  readonly productStockFilter = signal<'All' | 'LowStock' | 'OutOfStock'>('All');
  readonly productSortBy = signal<'default' | 'price-asc' | 'price-desc' | 'stock-desc' | 'name'>('default');

  // Pre-stocked authentic SYB beauty images
  readonly availableImages = [
    { name: 'Red Jelly Serum', path: 'products/red-jelly-serum.jpg' },
    { name: 'AHA Body Toner', path: 'products/aha-body-toner.jpg' },
    { name: 'Body Serum Booster', path: 'products/body-serum-booster.jpg' },
    { name: 'Golden Egg Jelly Mask', path: 'products/golden-egg-mask.jpg' },
    { name: 'Lip Cream Matte', path: 'products/lip-cream-matte.jpg' },
    { name: 'Vitamin Lippy Oil', path: 'products/lippy-oil-serum.jpg' },
    { name: 'Peeling Serum', path: 'products/peeling-serum.jpg' },
    { name: 'Jelly Mask Cherry', path: 'products/jelly-mask.jpg' },
    { name: 'Powder Mask Sakura', path: 'products/powder-mask.jpg' },
    { name: 'Paket Glow 3in1', path: 'products/glow-fresh-bundle.jpg' }
  ];

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
  readonly activeStudioTab = signal<'all' | 'basic' | 'pricing' | 'media' | 'formula' | 'variants'>('all');
  readonly isPreviewVisible = signal<boolean>(true);

  // Quick curation helpers
  readonly brandSwatches = [
    { name: 'SYB Rose', hex: '#ff0a6c' },
    { name: 'Cherry Blossom', hex: '#e84393' },
    { name: 'Velvet Plum', hex: '#7928ca' },
    { name: 'Golden Glow', hex: '#f59e0b' },
    { name: 'Coral Sunset', hex: '#ff6b6b' },
    { name: 'Botanical Mint', hex: '#10b981' },
    { name: 'Midnight Glam', hex: '#1e1b4b' }
  ];

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
  formAccentColor = signal<string>('#ff2a7a');
  formHeroTagline = signal<string>('Formula pencerah intensif teruji klinis!');
  formDescription = signal<string>('');
  formBenefits = signal<string[]>(['Mencerahkan kulit seketika', 'Formula ringan cepat meresap']);
  formKeyIngredients = signal<string[]>(['Niacinamide 10%', 'Hyaluronic Acid 4D']);
  formHowToUse = signal<string[]>(['Teteskan 2-3 tetes ke seluruh wajah bersih', 'Gunakan teratur pagi dan malam hari']);
  formIsFeatured = signal<boolean>(false);
  formIsFlashSale = signal<boolean>(false);
  formVariants = signal<ProductVariant[]>([
    { id: 'v1', name: 'Regular Size 20ml', price: 35000, stock: 500, sku: 'SYB-REG-01' }
  ]);

  // Temporary inputs for list builders
  tempBenefitInput = signal<string>('');
  tempIngredientInput = signal<string>('');
  tempHowToUseInput = signal<string>('');

  // Toast
  readonly toastMessage = signal<string | null>(null);

  // Real-time financial calculations
  readonly discountPercent = computed(() => {
    const orig = this.formOrigPrice();
    const curr = this.formPrice();
    if (orig <= 0 || curr >= orig) return 0;
    return Math.round(((orig - curr) / orig) * 100);
  });

  readonly grossProfitMargin = computed(() => {
    const cost = this.formCostPrice();
    const sell = this.formPrice();
    if (sell <= 0) return 0;
    return Math.round(((sell - cost) / sell) * 100);
  });

  readonly profitPerUnit = computed(() => {
    return Math.max(0, this.formPrice() - this.formCostPrice());
  });

  readonly formTotalStockValuation = computed(() => {
    return (this.formPrice() || 0) * (this.formInventory() || 0);
  });

  // Computeds
  readonly totalProductsCount = computed(() => this.productService.products().length);
  readonly activeProductsCount = computed(() => this.productService.products().filter(p => p.status === 'Active').length);
  readonly lowStockProductsCount = computed(() => this.productService.products().filter(p => p.inventory < 500).length);
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

  getImgUrl(path?: string): string {
    if (!path) return 'products/red-jelly-serum.jpg';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return path.replace(/^\//, '');
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
    this.formImage.set('products/red-jelly-serum.jpg');
    this.formAccentColor.set('#ff2a7a');
    this.formHeroTagline.set('Formula pencerah kulit intensif teruji klinis!');
    this.formDescription.set('Diformulasikan lembut dengan konsentrat bahan aktif untuk hasil glowing maksimal.');
    this.formBenefits.set(['Mencerahkan kulit seketika', 'Formula ringan cepat meresap']);
    this.formKeyIngredients.set(['Niacinamide 10%', 'Hyaluronic Acid 4D']);
    this.formHowToUse.set(['Teteskan 2-3 tetes ke wajah bersih', 'Gunakan teratur pagi dan malam hari']);
    this.formIsFeatured.set(false);
    this.formIsFlashSale.set(false);
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
    this.formImage.set(prod.image || 'products/red-jelly-serum.jpg');
    this.formAccentColor.set(prod.accentColor || '#ff2a7a');
    this.formHeroTagline.set(prod.heroTagline || prod.subtitle);
    this.formDescription.set(prod.description || prod.subtitle);
    this.formBenefits.set([...(prod.benefits || ['Mencerahkan kulit seketika'])]);
    this.formKeyIngredients.set([...(prod.keyIngredients || ['Niacinamide'])]);
    this.formHowToUse.set([...(prod.howToUse || ['Gunakan secara teratur setiap hari'])]);
    this.formIsFeatured.set(!!prod.isFeatured);
    this.formIsFlashSale.set(!!prod.isFlashSale);
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
    this.formImage.set(preset.image);
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
      alert('Mohon isi nama produk!');
      return;
    }

    const title = this.formTitle().trim();
    const price = Number(this.formPrice()) || 0;
    const origPrice = Number(this.formOrigPrice()) || price;
    const costPrice = Number(this.formCostPrice()) || Math.round(price * 0.45);
    const inventory = Number(this.formInventory()) || 0;
    const catLabel = this.formCategoryLabel();
    const bpom = this.formBpom().trim();

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
          image: this.formImage(),
          accentColor: this.formAccentColor(),
          heroTagline: this.formHeroTagline() || title,
          description: this.formDescription() || this.formSubtitle(),
          benefits: this.formBenefits(),
          keyIngredients: this.formKeyIngredients(),
          howToUse: this.formHowToUse(),
          isFeatured: this.formIsFeatured(),
          isFlashSale: this.formIsFlashSale(),
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
      image: this.formImage(),
      handle: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      heroTagline: this.formHeroTagline() || title,
      description: this.formDescription() || this.formSubtitle(),
      benefits: this.formBenefits(),
      keyIngredients: this.formKeyIngredients(),
      howToUse: this.formHowToUse(),
      isFeatured: this.formIsFeatured(),
      isFlashSale: this.formIsFlashSale()
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
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${prod.title}"?`)) {
      this.productService.deleteProduct(id);
      this.showToast(`Produk telah dihapus.`);
    }
  }

  quickAdjustStock(prod: Product, delta: number): void {
    const newStock = Math.max(0, prod.inventory + delta);
    const updated: Product = {
      ...prod,
      inventory: newStock,
      variants: prod.variants.map((v, i) => i === 0 ? { ...v, stock: newStock } : v)
    };
    this.productService.updateProduct(updated);
    this.showToast(`Stok "${prod.title}" diupdate: ${newStock} pcs`);
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
      alert('Produk harus memiliki setidaknya satu varian utama.');
      return;
    }
    this.formVariants.update(list => list.filter((_, i) => i !== index));
  }

  setStudioTab(tab: 'all' | 'basic' | 'pricing' | 'media' | 'formula' | 'variants'): void {
    this.activeStudioTab.set(tab);
  }

  togglePreview(): void {
    this.isPreviewVisible.update(v => !v);
  }

  adjustFormInventory(delta: number): void {
    this.formInventory.update(curr => Math.max(0, curr + delta));
  }

  selectSwatch(hex: string): void {
    this.formAccentColor.set(hex);
  }

  onImgError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'products/red-jelly-serum.jpg';
    }
  }
}
