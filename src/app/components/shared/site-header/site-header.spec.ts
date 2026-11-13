import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SiteHeader } from './site-header';
import { AuthService } from '../../../services/auth.service';

describe('SiteHeader Component', () => {
  let fixture: ComponentFixture<SiteHeader>;
  let component: SiteHeader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteHeader],
      providers: [provideRouter([]), AuthService],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create site-header component', () => {
    expect(component).toBeTruthy();
  });

  it('should only show the 5 main navigation links and exclude Flash Sale and Pre-Order', () => {
    const navLinks = Array.from(
      fixture.nativeElement.querySelectorAll('nav.header__nav a') as NodeListOf<HTMLAnchorElement>,
    ).map((a) => a.textContent?.replace(/\s+/g, ' ').trim());

    expect(navLinks).toEqual([
      'Beranda',
      'Semua Produk',
      '✨ AI Skin Check',
      'Reseller',
      'Tentang Kami',
    ]);

    const mobileLinks = Array.from(
      fixture.nativeElement.querySelectorAll('.mobile-menu a') as NodeListOf<HTMLAnchorElement>,
    ).map((a) => a.textContent?.replace(/\s+/g, ' ').trim() || '');

    expect(mobileLinks.some((text) => /flash\s*sale|pre-?order/i.test(text))).toBe(false);
  });
});

