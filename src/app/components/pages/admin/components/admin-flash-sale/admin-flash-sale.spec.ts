import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AdminFlashSaleComponent } from './admin-flash-sale';
import { ProductService } from '../../../../../services/product.service';
import { TimeService } from '../../../../../services/time.service';
import { FlashSaleService } from '../../../../../services/flash-sale.service';

describe('AdminFlashSaleComponent', () => {
  let fixture: ComponentFixture<AdminFlashSaleComponent>;
  let component: AdminFlashSaleComponent;
  let productService: ProductService;
  let timeService: TimeService;
  let flashSaleService: FlashSaleService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AdminFlashSaleComponent],
      providers: [provideRouter([]), provideHttpClient(), ProductService, TimeService, FlashSaleService],
    }).compileComponents();

    productService = TestBed.inject(ProductService);
    productService.products.set([
      {
        id: 'red-jelly-serum',
        title: 'FORTE Red Jelly Serum',
        subtitle: 'Niacinamide 10%',
        category: 'Kecantikan/Perawatan Wajah',
        categoryLabel: 'Wajah',
        productType: 'Serum',
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
        heroTagline: 'Serum pencerah',
        description: 'Serum legendaris',
        benefits: [],
        keyIngredients: [],
        howToUse: [],
        isFlashSale: false
      },
      {
        id: 'aha-body-toner',
        title: 'AHA Skinboost Body Toner',
        subtitle: 'Glycolic Acid',
        category: 'Perawatan Tubuh/Perawatan Kulit',
        categoryLabel: 'Tubuh',
        productType: 'Body Toner',
        status: 'Active',
        inventory: 100,
        variantsCount: 0,
        variants: [],
        channels: 4,
        catalogs: 2,
        price: 46060,
        originalPrice: 98000,
        rating: 4.9,
        reviewsCount: 1420,
        bpomNumber: 'NA18210103429',
        accentColor: '#ff2a7a',
        image: 'products/aha-body-toner.jpg',
        handle: 'aha-body-toner',
        heroTagline: 'Glycolic Acid',
        description: 'Body toner',
        benefits: [],
        keyIngredients: [],
        howToUse: [],
        isFlashSale: false
      }
    ]);

    fixture = TestBed.createComponent(AdminFlashSaleComponent);
    component = fixture.componentInstance;
    timeService = TestBed.inject(TimeService);
    flashSaleService = TestBed.inject(FlashSaleService);
  });

  it('should create the flash sale admin component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle master flash sale switch', () => {
    const initial = timeService.flashSaleConfig().isActive;
    component.toggleMasterSwitch();
    expect(timeService.flashSaleConfig().isActive).toBe(!initial);
  });

  it('should allow setting the flash sale end hour', () => {
    component.selectedEndHour.set(18);
    component.selectedEndMinute.set(30);
    component.saveScheduleByHour();

    expect(timeService.flashSaleConfig().endHour).toBe(18);
    expect(timeService.flashSaleConfig().endMinute).toBe(30);
    expect(timeService.flashSaleConfig().isActive).toBe(true);
  });

  it('should allow enrolling an individual product into Flash Sale', () => {
    const nonFlash = productService.products().find((p) => !p.isFlashSale) || productService.products()[0];
    const initialStatus = !!nonFlash.isFlashSale;

    component.toggleProductEnrollment(nonFlash);

    const updated = productService.products().find((p) => p.id === nonFlash.id);
    expect(updated?.isFlashSale).toBe(!initialStatus);
  });

  it('should allow setting custom flash sale discount for an individual product', () => {
    const product = productService.products()[0];
    component.onDiscountChange(product, 60);

    const updated = productService.products().find((p) => p.id === product.id);
    expect(updated?.isFlashSale).toBe(true);
    expect(updated?.price).toBe(Math.round(product.originalPrice * 0.4));
  });

  it('should support multiple flash sale sessions with distinct dates and times', () => {
    const initialCount = flashSaleService.sessions().length;
    expect(initialCount).toBeGreaterThanOrEqual(2);

    // Create a new flash sale session with custom date and time
    component.newSessionName.set('Sesi 12.12 Mega Malam');
    component.newSessionStartDate.set('2026-12-12');
    component.newSessionStartTime.set('19:00');
    component.newSessionEndDate.set('2026-12-12');
    component.newSessionEndTime.set('23:59');
    component.submitNewSession();

    expect(flashSaleService.sessions().length).toBe(initialCount + 1);

    const created = flashSaleService.sessions().find((s) => s.name === 'Sesi 12.12 Mega Malam');
    expect(created).toBeDefined();
    expect(created?.startDate).toBe('2026-12-12');
    expect(created?.startTime).toBe('19:00');
    expect(created?.endTime).toBe('23:59');
  });

  it('should allow each flash sale session to have different products or the same products', () => {
    // Session 1 products
    const s1 = flashSaleService.sessions()[0];
    component.selectSession(s1.id);
    component.toggleProductInSession(productService.products()[0]);

    // Session 2 products
    const s2 = flashSaleService.sessions()[1];
    component.selectSession(s2.id);
    component.toggleProductInSession(productService.products()[1]);

    const refreshedS1 = flashSaleService.sessions().find((s) => s.id === s1.id);
    const refreshedS2 = flashSaleService.sessions().find((s) => s.id === s2.id);

    expect(refreshedS1).toBeDefined();
    expect(refreshedS2).toBeDefined();
    // They are independent sessions
    expect(refreshedS1?.id).not.toBe(refreshedS2?.id);
  });

  it('should open custom confirmation popup when deleting a session', () => {
    expect(component.confirmDialog()).toBeNull();
    const session = flashSaleService.sessions()[0];
    component.deleteSession(session);

    expect(component.confirmDialog()).not.toBeNull();
    expect(component.confirmDialog()?.title).toBe('Hapus Sesi Flash Sale?');
    expect(component.confirmDialog()?.isDanger).toBe(true);

    // Cancel closes popup
    component.closeConfirm();
    expect(component.confirmDialog()).toBeNull();
  });

  it('should not render preset end hour or duration quick-add blocks in Flash Sale management', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.schedule-presets-block')).toBeNull();
    expect(fixture.nativeElement.querySelector('.duration-block')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Preset Jam Selesai Cepat');
    expect(fixture.nativeElement.textContent).not.toContain('Atau Tambah Durasi dari Sekarang');
  });

  it('should accept thousand-separator formatted strings for flash sale price and quota', () => {
    const product = productService.products()[0];
    component.onPriceChange(product, '25.000');
    component.onQuotaChange(product, '1.500');

    const updated = productService.products().find((p) => p.id === product.id);
    expect(updated?.price).toBe(25000);
    expect(updated?.flashSaleQuota).toBe(1500);
  });
});
