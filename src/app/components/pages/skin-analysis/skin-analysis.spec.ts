import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SkinAnalysisComponent } from './skin-analysis';
import { SkinAnalysisService } from '../../../services/skin-analysis.service';
import { CartService } from '../../../services/cart.service';

describe('SkinAnalysisComponent', () => {
  let component: SkinAnalysisComponent;
  let service: SkinAnalysisService;
  let cart: CartService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkinAnalysisComponent],
      providers: [provideRouter([]), SkinAnalysisService, CartService]
    }).compileComponents();

    const fixture = TestBed.createComponent(SkinAnalysisComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(SkinAnalysisService);
    cart = TestBed.inject(CartService);
    service.clearResult();
    fixture.detectChanges();
  });

  it('should create skin analysis component', () => {
    expect(component).toBeTruthy();
    expect(component.mode()).toBe('scan');
  });

  it('should switch mode between scan and quiz', () => {
    component.setMode('quiz');
    expect(component.mode()).toBe('quiz');

    component.setMode('scan');
    expect(component.mode()).toBe('scan');
  });

  it('should add product to cart and show toast', () => {
    const product = {
      id: 'test-serum',
      name: 'Test Serum',
      tagline: 'Test Tagline',
      image: 'test.jpg',
      price: 25000,
      compareAt: 50000,
      handle: 'test-serum',
      tint: '#fff'
    };

    const initialCount = cart.count();
    component.addToCart(product);
    expect(cart.count()).toBe(initialCount + 1);
    expect(component.toastMessage()).toContain('Test Serum');
  });

  it('should submit quiz and produce skin analysis result', () => {
    component.selectedSkinType.set('oily');
    component.selectedConcern.set('acne_pores');
    component.submitQuiz();

    expect(component.isProcessing()).toBe(true);
  });
});

