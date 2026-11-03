import { TestBed } from '@angular/core/testing';
import { JneApiService } from './jne-api.service';
import { ShopifyOrder } from '../models/shipping.model';

describe('JneApiService', () => {
  let service: JneApiService;

  const mockOrder: ShopifyOrder = {
    id: 'ord-test-1',
    orderNumber: '#SYB-9999',
    createdAt: '03 Nov 2026, 10:00',
    customerName: 'Budi Santoso',
    customerEmail: 'budi@example.com',
    customerPhone: '081298412933',
    shippingAddress: {
      street: 'Jl. Senopati No. 42 Kebayoran Baru',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12190'
    },
    items: [
      { productId: 'red-jelly', title: 'FORTE Red Jelly Serum', variantName: '20ml', quantity: 2, price: 25000, image: 'products/red-jelly-serum.jpg' }
    ],
    subtotal: 50000,
    shippingCost: 10000,
    discount: 0,
    total: 60000,
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Unfulfilled',
    isLabelPrinted: false,
    courier: 'JNE',
    serviceName: 'JNE Reguler (REG)',
    trackingNumber: 'JNE-PENDING',
    weightGrams: 450
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [JneApiService]
    });
    service = TestBed.inject(JneApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should correctly map city to JNE destination code', () => {
    expect(service.mapCityToDestCode('Jakarta Selatan')).toBe('CGK10000');
    expect(service.mapCityToDestCode('Kota Surabaya')).toBe('SUB10000');
    expect(service.mapCityToDestCode('Kota Bandung')).toBe('BDO10000');
    expect(service.mapCityToDestCode('Kota Denpasar')).toBe('DPS10000');
  });

  it('should correctly map courier service name to JNE service code', () => {
    expect(service.mapServiceCode('JNE YES (Yakin Esok Sampai)')).toBe('YES');
    expect(service.mapServiceCode('JNE OKE')).toBe('OKE');
    expect(service.mapServiceCode('JNE CTC City Courier')).toBe('CTC');
    expect(service.mapServiceCode('JNE Reguler')).toBe('REG');
  });

  it('should build payload conforming to JNE API requirements', () => {
    const payload = service.buildPayload(mockOrder);
    expect(payload.username).toBe('DODORAKOSMETIK');
    expect(payload.OLSHOP_BRANCH).toBe('SUB000');
    expect(payload.OLSHOP_ORDERID).toBe('SYB-9999');
    expect(payload.OLSHOP_RECEIVER_NAME).toBe('Budi Santoso');
    expect(payload.OLSHOP_RECEIVER_CITY).toBe('Jakarta Selatan');
    expect(payload.OLSHOP_RECEIVER_ZIP).toBe('12190');
    expect(payload.OLSHOP_QTY).toBe('2');
    expect(payload.OLSHOP_WEIGHT).toBe('1');
    expect(payload.OLSHOP_ORIG).toBe('SUB10000');
    expect(payload.OLSHOP_DEST).toBe('CGK10000');
    expect(payload.OLSHOP_SERVICE).toBe('REG');
  });

  it('should generate compliant fallback 12-digit JNE AWB numbers', () => {
    const awb = service.generateFallbackAwb();
    expect(awb).toMatch(/^01\d{10}$/);
  });

  it('should allow toggling between Live and Sandbox environment', () => {
    service.setEnvironment('sandbox');
    expect(service.config().environment).toBe('sandbox');
    expect(service.config().username).toBe('TESTAPI');
    expect(service.getEndpoint()).toContain(':10202');
    expect(service.getTariffEndpoint()).toContain(':10202');

    service.setEnvironment('live');
    expect(service.config().environment).toBe('live');
    expect(service.config().username).toBe('DODORAKOSMETIK');
    expect(service.getEndpoint()).toContain(':10206');
    expect(service.getTariffEndpoint()).toContain(':10206');
  });

  it('should return valid tariff options with checkTariff', async () => {
    const tariffs = await service.checkTariff('CGK10000', 1);
    expect(tariffs.length).toBeGreaterThan(0);
    expect(tariffs[0].price).toBeGreaterThan(0);
    expect(tariffs[0].serviceDisplay).toBeDefined();
    expect(tariffs[0].etd).toBeDefined();
  });
});
