import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ProductDetail } from './product-detail';
import { ProductService } from '../../../services/product.service';

describe('ProductDetail Component', () => {
  let component: ProductDetail;
  let productService: ProductService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetail],
      providers: [
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

    const fixture = TestBed.createComponent(ProductDetail);
    component = fixture.componentInstance;
    productService = TestBed.inject(ProductService);
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
});

