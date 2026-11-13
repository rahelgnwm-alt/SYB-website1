import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { BestSeller } from './best-seller';
import { Product } from '../../../../../data';
import { ProductService } from '../../../../../services/product.service';

describe('BestSeller Component', () => {
  let component: BestSeller;
  let router: Router;
  let productService: ProductService;

  const mockProduct: Product = {
    id: 'aha-body-toner',
    name: 'AHA Skinboost Body Toner',
    tagline: 'Glycolic Acid · 250ml',
    image: 'products/aha-body-toner.jpg',
    price: 46060,
    compareAt: 98000,
    handle: 'aha-body-toner',
    tint: '#ffe4f0'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BestSeller],
      providers: [
        provideHttpClient(),
        provideRouter([
          { path: 'products/:id', component: BestSeller },
          { path: 'products', component: BestSeller },
        ]),
      ],
    }).compileComponents();

    productService = TestBed.inject(ProductService);
    productService.products.set([
      {
        id: 'aha-body-toner',
        title: 'AHA Skinboost Body Toner',
        subtitle: 'Glycolic Acid · 250ml',
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
        howToUse: []
      }
    ]);

    const fixture = TestBed.createComponent(BestSeller);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create best seller component', () => {
    expect(component).toBeTruthy();
  });

  it('should have products available', () => {
    expect(component['products']().length).toBeGreaterThan(0);
  });

  it('should navigate to product detail on card click when not dragging', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    const mockEvent = new MouseEvent('click');

    component['onCardClick'](mockEvent, mockProduct);

    expect(navigateSpy).toHaveBeenCalledWith(['/products', 'aha-body-toner']);
  });

  it('should suppress navigation if user was dragging the rail', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    const mockEvent = new MouseEvent('click');

    // Simulate drag movement
    component['suppressClick'] = true;
    component['onCardClick'](mockEvent, mockProduct);

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should navigate to /products on more card click when not dragging', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    const mockEvent = new MouseEvent('click');

    component['onMoreClick'](mockEvent);

    expect(navigateSpy).toHaveBeenCalledWith(['/products']);
  });
});
