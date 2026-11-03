import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminResellerProductsComponent } from './admin-reseller-products';
import { ResellerService } from '../../../../../services/reseller.service';

describe('AdminResellerProductsComponent', () => {
  let component: AdminResellerProductsComponent;
  let resellerService: ResellerService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminResellerProductsComponent],
      providers: [provideRouter([]), ResellerService],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminResellerProductsComponent);
    component = fixture.componentInstance;
    resellerService = TestBed.inject(ResellerService);
    resellerService.resetToDefault();
    fixture.detectChanges();
  });

  it('should create the admin reseller products component', () => {
    expect(component).toBeTruthy();
  });

  it('should list reseller products and filter correctly', () => {
    expect(component.filteredProducts().length).toBeGreaterThan(0);

    component.searchQuery.set('AHA');
    const filtered = component.filteredProducts();
    expect(filtered.length).toBeGreaterThan(0);
    expect(
      filtered.every(
        (p) =>
          p.title.toLowerCase().includes('aha') ||
          p.subtitle.toLowerCase().includes('aha')
      )
    ).toBe(true);
  });

  it('should open modal in add mode', () => {
    component.openAddModal();
    expect(component.isModalOpen()).toBe(true);
    expect(component.modalMode()).toBe('add');
    expect(component.formTitle()).toBe('');
  });

  it('should open modal in edit mode with product data', () => {
    const prod = resellerService.resellerProducts()[0];
    component.openEditModal(prod);
    expect(component.isModalOpen()).toBe(true);
    expect(component.modalMode()).toBe('edit');
    expect(component.formTitle()).toBe(prod.title);
    expect(component.formWholesalePrice()).toBe(prod.wholesalePrice);
  });
});
