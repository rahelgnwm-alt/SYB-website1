import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ResellerComponent } from './reseller';
import { ResellerService } from '../../../services/reseller.service';

describe('ResellerComponent', () => {
  let component: ResellerComponent;
  let resellerService: ResellerService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResellerComponent],
      providers: [provideRouter([]), ResellerService],
    }).compileComponents();

    const fixture = TestBed.createComponent(ResellerComponent);
    component = fixture.componentInstance;
    resellerService = TestBed.inject(ResellerService);
    resellerService.resetToDefault();
    fixture.detectChanges();
  });

  it('should create public reseller component', () => {
    expect(component).toBeTruthy();
  });

  it('should display active reseller products', () => {
    const list = component.products();
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((p) => p.status === 'Active')).toBe(true);
  });

  it('should generate valid WhatsApp link with prefilled message', () => {
    const prod = component.products()[0];
    const link = component.getWhatsAppLink(prod);
    expect(link).toContain('https://wa.me/6281333369909');
    expect(link).toContain('reseller');
  });
});

