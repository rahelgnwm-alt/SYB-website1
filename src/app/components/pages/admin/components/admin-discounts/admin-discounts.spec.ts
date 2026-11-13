import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AdminDiscountsComponent } from './admin-discounts';
import { ProductService } from '../../../../../services/product.service';

describe('AdminDiscountsComponent', () => {
  let component: AdminDiscountsComponent;
  let productService: ProductService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AdminDiscountsComponent],
      providers: [provideRouter([]), provideHttpClient(), ProductService],
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
        howToUse: []
      }
    ]);

    const fixture = TestBed.createComponent(AdminDiscountsComponent);
    component = fixture.componentInstance;
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

  it('should accept thousand-separator formatted strings in price inputs', () => {
    const product = productService.products()[0];
    component.onOriginalPriceChange(product, '120.000');
    let updated = productService.products().find((p) => p.id === product.id);
    expect(updated?.originalPrice).toBe(120000);

    component.onSalePriceChange(updated!, '85.500');
    updated = productService.products().find((p) => p.id === product.id);
    expect(updated?.price).toBe(85500);
  });
});

