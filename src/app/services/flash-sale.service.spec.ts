import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FlashSaleService } from './flash-sale.service';
import { ProductService } from './product.service';

describe('FlashSaleService - Live State & Ended/Empty Removal', () => {
  let service: FlashSaleService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [FlashSaleService, ProductService],
    });
    service = TestBed.inject(FlashSaleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should report isFlashSaleLive as false if master toggle is off', () => {
    service.setMasterActive(false);
    expect(service.isFlashSaleLive()).toBe(false);
    expect(service.activeSession()).toBeNull();
  });

  it('should report isFlashSaleLive as false if session has 0 items (empty)', () => {
    const session = service.sessions()[0];
    if (session) {
      service.updateSession(session.id, {
        items: [],
      });
      // Set time to be within session range
      service.currentTime.set(new Date(`${session.startDate}T${session.startTime}:00`));
      expect(service.isFlashSaleLive()).toBe(false);
      const status = service.getSessionStatus(service.sessions()[0]);
      expect(status.label).toContain('Kosong');
    }
  });

  it('should report isFlashSaleLive as false if session has ended', () => {
    const session = service.sessions()[0];
    if (session) {
      const pastTime = new Date('2020-01-01T00:00:00');
      service.updateSession(session.id, {
        startDate: '2019-01-01',
        endDate: '2019-01-02',
      });
      service.currentTime.set(pastTime);
      expect(service.isFlashSaleLive()).toBe(false);
      const status = service.getSessionStatus(service.sessions()[0]);
      expect(status.code).toBe('ended');
    }
  });

  it('should report isFlashSaleLive as true when active session is ongoing and has products', () => {
    service.setMasterActive(true);
    const session = service.sessions()[0];
    if (session && session.items.length > 0) {
      service.updateSession(session.id, {
        isActive: true,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        startTime: '00:00',
        endTime: '23:59',
      });
      service.currentTime.set(new Date('2026-06-15T12:00:00'));
      expect(service.isFlashSaleLive()).toBe(true);
      expect(service.activeSession()).not.toBeNull();
    }
  });
});
