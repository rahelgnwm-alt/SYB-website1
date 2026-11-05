import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BestSeller } from './best-seller';
import { PRODUCTS } from '../../../../../data';

describe('BestSeller Component', () => {
  let component: BestSeller;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BestSeller],
      providers: [
        provideRouter([
          { path: 'products/:id', component: BestSeller },
          { path: 'products', component: BestSeller },
        ]),
      ],
    }).compileComponents();

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
    const mockProduct = PRODUCTS[1]; // aha-body-toner
    const mockEvent = new MouseEvent('click');

    component['onCardClick'](mockEvent, mockProduct);

    expect(navigateSpy).toHaveBeenCalledWith(['/products', 'aha-body-toner']);
  });

  it('should suppress navigation if user was dragging the rail', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    const mockProduct = PRODUCTS[1];
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
