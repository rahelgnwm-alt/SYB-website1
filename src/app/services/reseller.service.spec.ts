import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ResellerService } from './reseller.service';
import { ResellerProduct } from '../models/reseller-product.model';

describe('ResellerService', () => {
  let service: ResellerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ResellerService],
    });
    service = TestBed.inject(ResellerService);
    service.resetToDefault();
  });

  it('should be created and have initial reseller products', () => {
    expect(service).toBeTruthy();
    expect(service.resellerProducts().length).toBeGreaterThan(0);
  });

  it('should allow adding a new reseller product', () => {
    const initialCount = service.resellerProducts().length;
    const newProd: ResellerProduct = {
      id: 'test-reseller-1',
      title: 'Paket Tes Grosir',
      subtitle: 'Subtitle tes',
      category: 'Grosir/Paket Wajah',
      categoryLabel: 'Paket Wajah',
      image: 'products/red-jelly-serum.jpg',
      wholesalePrice: 400000,
      retailPrice: 800000,
      minOrder: 1,
      minOrderUnit: 'paket',
      packageContents: '12 pcs tes',
      inventory: 50,
      status: 'Active',
      sku: 'TEST-RSL-01',
      bpomNumber: 'BPOM-TEST',
      accentColor: '#ff2a7a',
      benefits: ['Benefit 1'],
    };

    service.addResellerProduct(newProd);
    expect(service.resellerProducts().length).toBe(initialCount + 1);
    expect(service.resellerProducts()[0].title).toBe('Paket Tes Grosir');
  });

  it('should allow toggling active status', () => {
    const prod = service.resellerProducts()[0];
    const prevStatus = prod.status;

    service.toggleStatus(prod.id);
    const updated = service.resellerProducts().find((p) => p.id === prod.id);
    expect(updated?.status).toBe(prevStatus === 'Active' ? 'Draft' : 'Active');
  });

  it('should allow deleting a reseller product', () => {
    const initialCount = service.resellerProducts().length;
    const target = service.resellerProducts()[0];

    service.deleteResellerProduct(target.id);
    expect(service.resellerProducts().length).toBe(initialCount - 1);
    expect(service.resellerProducts().some((p) => p.id === target.id)).toBe(false);
  });
});

