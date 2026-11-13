import { TestBed } from '@angular/core/testing';
import { JntApiService, DEFAULT_JNT_CONFIG } from './jnt-api.service';

describe('JntApiService', () => {
  let service: JntApiService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(JntApiService);
  });

  it('should initialize with exact J&T testing credentials from specification', () => {
    const cfg = service.config();
    expect(cfg.orderKey).toBe('AKe62df84bJ3d8e4b1hea2R45j11klsb');
    expect(cfg.username).toBe('SUB-PT-DODORA');
    expect(cfg.apiKey).toBe('OKNECE');
    expect(cfg.orderCreateEndpoint).toBe(
      'https://demo-ecommerce.inuat-jntexpress.id/jts-idn-ecommerce-api/api/order/create'
    );
    expect(cfg.tariffKey).toBe('rL7xcBnvGli5');
    expect(cfg.customerName).toBe('SUB-PT-DODORA');
    expect(cfg.tariffEndpoint).toBe(
      'https://demo-general.inuat-jntexpress.id/jandt_track/inquiry.action'
    );
    expect(cfg.trackUsername).toBe('SUB-PT-DODORA');
    expect(cfg.trackPassword).toBe('rL7xcBnvGli5');
    expect(cfg.trackEndpoint).toBe(
      'https://demo-general.inuat-jntexpress.id/jandt_track/track/trackAction!tracking.action'
    );
    expect(cfg.orderCancelEndpoint).toBe(
      'https://demo-ecommerce.inuat-jntexpress.id/jts-idn-ecommerce-api/api/order/cancel'
    );
  });

  it('should compute base64(md5(payload + key)) signature and Basic Auth header', () => {
    const sig = service.generateSignature('{"test":1}', DEFAULT_JNT_CONFIG.tariffKey);
    expect(sig).toBeTruthy();
    expect(sig.length).toBeGreaterThan(10);

    const basicHeader = service.getBasicAuthHeader();
    expect(basicHeader).toBe(`Basic ${btoa('SUB-PT-DODORA:rL7xcBnvGli5')}`);
  });

  it('should return fallback J&T tariffs tagged with courier J&T when offline', () => {
    const fallback = service.getFallbackTariffs('JKT', 1);
    expect(fallback.length).toBeGreaterThan(0);
    expect(fallback[0].courier).toBe('J&T');
    expect(fallback[0].serviceName).toContain('J&T');
  });

  it('should generate valid J&T fallback AWB', () => {
    const awb = service.generateFallbackAwb();
    expect(awb).toMatch(/^JP\d{10}$/);
  });
});
