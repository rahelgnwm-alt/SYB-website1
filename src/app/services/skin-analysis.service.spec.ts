import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SkinAnalysisService, SkinQuizAnswers } from './skin-analysis.service';

describe('SkinAnalysisService', () => {
  let service: SkinAnalysisService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SkinAnalysisService);
    service.clearResult();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should analyze oily skin with acne pores concern and recommend appropriate products', () => {
    const answers: SkinQuizAnswers = {
      skinType: 'oily',
      primaryConcern: 'acne_pores',
      lifestyle: 'pollution',
      goal: 'clear_pores'
    };

    const result = service.analyzeSkin(answers);

    expect(result).toBeDefined();
    expect(result.skinType).toBe('oily');
    expect(result.primaryConcern).toBe('acne_pores');
    expect(result.glowingScore).toBeGreaterThan(0);
    expect(result.matchedProducts.length).toBeGreaterThan(0);
    // Should match powder mask or jelly mask for oily/pores
    const productIds = result.matchedProducts.map((p) => p.product.id);
    expect(productIds).toContain('powder-mask');
    expect(service.latestResult()).toEqual(result);
  });

  it('should analyze dry skin with dryness concern and recommend golden egg mask or red jelly serum', () => {
    const answers: SkinQuizAnswers = {
      skinType: 'dry',
      primaryConcern: 'dryness',
      lifestyle: 'ac_room',
      goal: 'plump_elastic'
    };

    const result = service.analyzeSkin(answers);

    expect(result.skinType).toBe('dry');
    const productIds = result.matchedProducts.map((p) => p.product.id);
    expect(productIds).toContain('golden-egg-mask');
    expect(result.metrics.hydration.value).toBeLessThanOrEqual(65);
  });

  it('should analyze body dark areas and recommend aha body toner', () => {
    const answers: SkinQuizAnswers = {
      skinType: 'normal',
      primaryConcern: 'body_dark_areas',
      lifestyle: 'sun_outdoor',
      goal: 'even_tone'
    };

    const result = service.analyzeSkin(answers);

    expect(result.primaryConcern).toBe('body_dark_areas');
    expect(result.matchedProducts[0].product.id).toBe('aha-body-toner');
  });

  it('should save and clear result from signal and storage', () => {
    const answers: SkinQuizAnswers = {
      skinType: 'normal',
      primaryConcern: 'dullness',
      lifestyle: 'sun_outdoor',
      goal: 'glass_skin'
    };

    const result = service.analyzeSkin(answers);
    expect(service.latestResult()).not.toBeNull();

    service.clearResult();
    expect(service.latestResult()).toBeNull();
  });
});

