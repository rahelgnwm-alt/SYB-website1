import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminDiscountsComponent } from './admin-discounts';
import { ProductService } from '../../../../../services/product.service';

describe('AdminDiscountsComponent', () => {
  let component: AdminDiscountsComponent;
  let productService: ProductService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDiscountsComponent],
      providers: [provideRouter([]), ProductService],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminDiscountsComponent);
    component = fixture.componentInstance;
    productService = TestBed.inject(ProductService);
  });

  it('should create the discounts component', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate discount percentage correctly', () => {
    const product = productService.products()[0];
    const discount = component.calcDiscountPercent(product);
    expect(discount).toBeGreaterThanOrEqual(0);
    expect(discount).toBeLessThan(100);
  });

  it('should allow setting discount percentage for an individual product', () => {
    const product = productService.products()[0];
    const origPrice = product.originalPrice;
    component.onDiscountPercentChange(product, 30);

    const updated = productService.products().find((p) => p.id === product.id);
    expect(updated?.price).toBe(Math.round(origPrice * 0.7));
  });

  it('should apply bulk discount to a category', () => {
    component.bulkDiscountPercent.set(40);
    component.bulkTargetCategory.set('Wajah');
    component.applyBulk();

    const wajahProducts = productService.products().filter((p) => p.categoryLabel === 'Wajah');
    wajahProducts.forEach((p) => {
      expect(p.price).toBe(Math.round(p.originalPrice * 0.6));
    });
  });

  it('should toggle multi-selection and clear selection', () => {
    const product = productService.products()[0];
    component.toggleSelect(product.id);
    expect(component.selectedProductIds().has(product.id)).toBe(true);

    component.clearSelection();
    expect(component.selectedProductIds().size).toBe(0);
  });
});

