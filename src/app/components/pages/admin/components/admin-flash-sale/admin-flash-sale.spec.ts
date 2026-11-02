import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminFlashSaleComponent } from './admin-flash-sale';
import { ProductService } from '../../../../../services/product.service';
import { TimeService } from '../../../../../services/time.service';

describe('AdminFlashSaleComponent', () => {
  let component: AdminFlashSaleComponent;
  let productService: ProductService;
  let timeService: TimeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminFlashSaleComponent],
      providers: [provideRouter([]), ProductService, TimeService],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminFlashSaleComponent);
    component = fixture.componentInstance;
    productService = TestBed.inject(ProductService);
    timeService = TestBed.inject(TimeService);
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
    const initialStatus = nonFlash.isFlashSale;

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
});

