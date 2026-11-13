import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AdminProductsComponent } from './admin-products';
import { ProductService } from '../../../../../services/product.service';
import { CartService } from '../../../../../services/cart.service';

describe('AdminProductsComponent — Edit Product Pre-Order', () => {
  let fixture: ComponentFixture<AdminProductsComponent>;
  let component: AdminProductsComponent;
  let productService: ProductService;
  let cartService: CartService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AdminProductsComponent],
      providers: [provideRouter([]), provideHttpClient(), ProductService, CartService],
    }).compileComponents();

    productService = TestBed.inject(ProductService);
    productService.products.set([
      {
        id: 'red-jelly-serum',
        title: 'FORTE Red Jelly Serum',
        subtitle: 'Niacinamide 10%',
        category: 'Kecantikan/Perawatan Wajah',
        categoryLabel: 'Wajah',
        productType: 'Serum Wajah',
        status: 'Active',
        inventory: 100,
        variantsCount: 0,
        variants: [],
        channels: 4,
        catalogs: 2,
        price: 22325,
        originalPrice: 47500,
        rating: 4.9,
        reviewsCount: 1420,
        bpomNumber: 'NA18210103429',
        accentColor: '#ff2a7a',
        image: 'products/red-jelly-serum.jpg',
        handle: 'red-jelly-serum',
        heroTagline: 'Mencerahkan flek',
        description: 'Serum legendaris',
        benefits: [],
        keyIngredients: [],
        howToUse: []
      }
    ]);

    fixture = TestBed.createComponent(AdminProductsComponent);
    component = fixture.componentInstance;
    cartService = TestBed.inject(CartService);
  });

  it('should create the admin products component', () => {
    expect(component).toBeTruthy();
  });

  it('should enable Pre-Order and configure duration on Edit Product', () => {
    const target = productService.products()[0];
    expect(target.isPreOrder).toBeFalsy();

    component.openEditProductModal(target);
    expect(component.isProductModalOpen()).toBe(true);
    expect(component.modalMode()).toBe('edit');

    component.setStudioTab('preorder');
    expect(component.activeStudioTab()).toBe('preorder');

    component.formIsPreOrder.set(true);
    component.formPreOrderDays.set(14);
    component.formPreOrderNote.set('Batch produksi baru dikirim mulai minggu ke-2');
    component.saveProduct();

    expect(component.isProductModalOpen()).toBe(false);
    const updated = productService.products().find((p) => p.id === target.id);
    expect(updated?.isPreOrder).toBe(true);
    expect(updated?.preOrderDays).toBe(14);
    expect(updated?.preOrderNote).toBe('Batch produksi baru dikirim mulai minggu ke-2');
  });

  it('should accept manual Pre-Order days input and clamp between 1 and max 30 days', () => {
    const target = productService.products()[0];
    component.openEditProductModal(target);
    component.formIsPreOrder.set(true);

    component.onPreOrderDaysInput(15);
    expect(component.formPreOrderDays()).toBe(15);

    component.onPreOrderDaysInput(0);
    expect(component.formPreOrderDays()).toBe(1);

    component.onPreOrderDaysInput(45);
    expect(component.formPreOrderDays()).toBe(30);

    component.saveProduct();
    const updated = productService.products().find((p) => p.id === target.id);
    expect(updated?.preOrderDays).toBe(30);
  });

  it('should reflect Edit Product Pre-Order changes live in CartService', () => {
    const storeItem = productService.storefrontProducts()[0];
    cartService.add(storeItem);
    expect(cartService.hasPreOrder()).toBe(false);

    const adminProd = productService.products().find((p) => p.id === storeItem.id)!;
    component.openEditProductModal(adminProd);
    component.formIsPreOrder.set(true);
    component.formPreOrderDays.set(10);
    component.saveProduct();

    expect(cartService.hasPreOrder()).toBe(true);
    expect(cartService.maxPreOrderDays()).toBe(10);
    expect(cartService.estimatedPreOrderShipDate().length).toBeGreaterThan(0);

    // Switch back to Ready Stock via Edit Product
    const updatedAdminProd = productService.products().find((p) => p.id === storeItem.id)!;
    component.openEditProductModal(updatedAdminProd);
    component.formIsPreOrder.set(false);
    component.saveProduct();

    expect(cartService.hasPreOrder()).toBe(false);
    expect(cartService.maxPreOrderDays()).toBe(0);
  });

  it('should format numbers with Indonesian thousand separator dots', () => {
    expect(component.formatThousand(50000)).toBe('50.000');
    expect(component.formatThousand(100000)).toBe('100.000');
    expect(component.formatThousand(38900)).toBe('38.900');
    expect(component.formatThousand(0)).toBe('0');
    expect(component.formatThousand(null)).toBe('');
  });

  it('should parse strings with thousand separator dots back to numeric values', () => {
    expect(component.parseThousand('50.000')).toBe(50000);
    expect(component.parseThousand('100.000')).toBe(100000);
    expect(component.parseThousand('Rp 38.900')).toBe(38900);
    expect(component.parseThousand('')).toBe(0);
  });

  it('should format and update input values during price, origPrice, and inventory typing', () => {
    const priceInput = { value: '50000' } as HTMLInputElement;
    component.handlePriceInput({ target: priceInput } as any);
    expect(component.formPrice()).toBe(50000);
    expect(priceInput.value).toBe('50.000');

    const origPriceInput = { value: '100000' } as HTMLInputElement;
    component.handleOrigPriceInput({ target: origPriceInput } as any);
    expect(component.formOrigPrice()).toBe(100000);
    expect(origPriceInput.value).toBe('100.000');

    const invInput = { value: '38900' } as HTMLInputElement;
    component.handleInventoryInput({ target: invInput } as any);
    expect(component.formInventory()).toBe(38900);
    expect(invInput.value).toBe('38.900');
  });

  it('should open custom luxury confirmation popup on deleteProduct instead of native confirm()', () => {
    const prod = productService.products()[0];
    expect(component.confirmDialog()).toBeNull();

    component.deleteProduct(prod.id);
    const dialog = component.confirmDialog();
    expect(dialog).toBeTruthy();
    expect(dialog?.isOpen).toBe(true);
    expect(dialog?.isDanger).toBe(true);
    expect(dialog?.title).toContain('Hapus Produk');
    expect(dialog?.product?.id).toBe(prod.id);

    // Cancel deletion
    component.closeConfirm();
    expect(component.confirmDialog()).toBeNull();
    expect(productService.products().some((p) => p.id === prod.id)).toBe(true);

    // Re-open and proceed deletion
    component.deleteProduct(prod.id);
    component.confirmDialog()?.onConfirm();
    expect(component.confirmDialog()).toBeNull();
    expect(productService.products().some((p) => p.id === prod.id)).toBe(false);
  });

  it('should not render the official SYB photo gallery picker in Add or Edit product modals', () => {
    component.openAddProductModal();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.media-gallery-section')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Koleksi Foto Resmi SYB');

    component.openEditProductModal(productService.products()[0]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.media-gallery-section')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Koleksi Foto Resmi SYB');
  });

  it('should allow adding up to 10 product photos and enforce the 10-photo limit', () => {
    component.openAddProductModal();
    const twelveImages = Array.from(
      { length: 12 },
      (_, idx) => `data:image/jpeg;base64,img-${idx + 1}`
    );

    component['addGalleryImages'](twelveImages);
    fixture.detectChanges();

    expect(component['formGallery']().length).toBe(10);
    expect(component['formImage']()).toBe('data:image/jpeg;base64,img-1');
    expect(component['formGallery']()[9]).toBe('data:image/jpeg;base64,img-10');
    expect(fixture.nativeElement.querySelectorAll('.admin-gallery-card').length).toBe(10);
    expect(fixture.nativeElement.querySelector('.gallery-limit-notice')).toBeTruthy();
  });

  it('should reorder via drag-and-drop into first slot as main photo without bottom action buttons', () => {
    component.openAddProductModal();
    component.formTitle.set('Serum Multi Foto Test');
    component.formPrice.set(75000);

    component['addGalleryImages']([
      'data:image/jpeg;base64,photo-a',
      'data:image/jpeg;base64,photo-b',
      'data:image/jpeg;base64,photo-c',
    ]);
    fixture.detectChanges();

    // Ensure no bottom action button bar exists below the images
    expect(fixture.nativeElement.querySelector('.admin-gallery-actions')).toBeNull();

    // Drag slot #3 (index 2) and drop it onto slot #1 (index 0) to promote it as Foto Utama
    const fakeDragStart = { preventDefault: () => {}, stopPropagation: () => {} } as unknown as DragEvent;
    const fakeDrop = { preventDefault: () => {}, stopPropagation: () => {} } as unknown as DragEvent;
    component['onGalleryDragStart'](fakeDragStart, 2);
    component['onGalleryDragOver'](fakeDragStart, 0);
    expect(component['dragOverGalleryIndex']()).toBe(0);

    component['onGalleryDrop'](fakeDrop, 0);
    expect(component['formGallery']()).toEqual([
      'data:image/jpeg;base64,photo-c',
      'data:image/jpeg;base64,photo-a',
      'data:image/jpeg;base64,photo-b',
    ]);
    expect(component['formImage']()).toBe('data:image/jpeg;base64,photo-c');

    component['removeGalleryImage'](1);
    expect(component['formGallery']()).toEqual([
      'data:image/jpeg;base64,photo-c',
      'data:image/jpeg;base64,photo-b',
    ]);

    component.saveProduct();

    const saved = productService.products().find((p) => p.title === 'Serum Multi Foto Test');
    expect(saved).toBeTruthy();
    expect(saved?.image).toBe('data:image/jpeg;base64,photo-c');
    expect(saved?.gallery).toEqual([
      'data:image/jpeg;base64,photo-c',
      'data:image/jpeg;base64,photo-b',
    ]);

    component.openEditProductModal(saved!);
    fixture.detectChanges();
    expect(component['formGallery']()).toEqual([
      'data:image/jpeg;base64,photo-c',
      'data:image/jpeg;base64,photo-b',
    ]);
    expect(fixture.nativeElement.querySelectorAll('.admin-gallery-card').length).toBe(2);
  });
});

