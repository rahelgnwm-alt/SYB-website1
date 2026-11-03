import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SiteHeader } from './site-header';
import { AuthService } from '../../../services/auth.service';

describe('SiteHeader Component', () => {
  let component: SiteHeader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteHeader],
      providers: [provideRouter([]), AuthService],
    }).compileComponents();

    const fixture = TestBed.createComponent(SiteHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create site-header component', () => {
    expect(component).toBeTruthy();
  });
});
