import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AiSkinBannerComponent } from './ai-skin-banner';

describe('AiSkinBannerComponent', () => {
  let component: AiSkinBannerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiSkinBannerComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    const fixture = TestBed.createComponent(AiSkinBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create ai skin banner component', () => {
    expect(component).toBeTruthy();
  });
});
