import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { ProductDetail } from './product-detail';
import { ProductService } from '../../../services/product.service';
import { MAX_PRODUCT_IMAGES } from '../../../models/product.model';

describe('ProductDetail Component', () => {
  let component: ProductDetail;
  let fixture: ComponentFixture<ProductDetail>;
  let productService: ProductService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetail],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        ProductService,
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({
              get: (key: string) => (key === 'id' ? 'aha-body-toner' : null),
            }),
          },
        },
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

    fixture = TestBed.createComponent(ProductDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should find and display product for aha-body-toner', () => {
    expect(component).toBeTruthy();
    const prod = component['product']();
    expect(prod).not.toBeNull();
    expect(prod?.id).toBe('aha-body-toner');
    expect(prod?.title).toContain('AHA Skinboost Body Toner');
  });

  it('should calculate current price and discount correctly', () => {
    const prod = component['product']();
    expect(prod).not.toBeNull();
    expect(component['currentPrice']()).toBeGreaterThan(0);
    expect(component['discountPct']()).toBeGreaterThanOrEqual(0);
  });

  it('should display up to 10 product photos and switch active image cleanly', () => {
    const twelveImages = Array.from({ length: 12 }, (_, idx) => `products/photo-${idx + 1}.jpg`);
    const current = productService.products()[0];
    productService.products.set([
      {
        ...current,
        image: twelveImages[0],
        gallery: twelveImages,
      },
    ]);
    fixture.detectChanges();

    const gallery = component['galleryImages']();
    expect(gallery.length).toBe(MAX_PRODUCT_IMAGES);
    expect(component['activeImageIndex']()).toBe(0);
    expect(component['activeImage']()).toContain('photo-1.jpg');

    const thumbButtons = fixture.nativeElement.querySelectorAll('.pdp__thumb');
    expect(thumbButtons.length).toBe(MAX_PRODUCT_IMAGES);

    component['selectImage'](4);
    fixture.detectChanges();
    expect(component['activeImageIndex']()).toBe(4);
    expect(component['activeImage']()).toContain('photo-5.jpg');

    component['nextImage']();
    expect(component['activeImageIndex']()).toBe(5);

    component['prevImage']();
    expect(component['activeImageIndex']()).toBe(4);
  });

  it('should hide thumbnail strip when product has only 1 image', () => {
    const current = productService.products()[0];
    productService.products.set([
      {
        ...current,
        image: 'products/aha-body-toner.jpg',
        gallery: ['products/aha-body-toner.jpg'],
      },
    ]);
    fixture.detectChanges();

    expect(component['galleryImages']().length).toBe(1);
    const thumbButtons = fixture.nativeElement.querySelectorAll('.pdp__thumb');
    expect(thumbButtons.length).toBe(0);
  });
});

