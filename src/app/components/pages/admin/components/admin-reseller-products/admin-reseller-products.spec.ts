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

  it('should format and parse Indonesian thousand separators cleanly on reseller prices and stock', () => {
    expect(component.formatThousand(790000)).toBe('790.000');
    expect(component.formatThousand(1650000)).toBe('1.650.000');
    expect(component.formatThousand(0)).toBe('0');
    expect(component.parseThousand('1.250.000')).toBe(1250000);

    component.openAddModal();
    const fakeInput = { value: '1250000' } as HTMLInputElement;
    component.handleNumericInput(
      { target: fakeInput } as unknown as Event,
      component.formWholesalePrice
    );
    expect(component.formWholesalePrice()).toBe(1250000);
    expect(fakeInput.value).toBe('1.250.000');

    const fakeStockInput = { value: '2500' } as HTMLInputElement;
    component.handleNumericInput(
      { target: fakeStockInput } as unknown as Event,
      component.formInventory
    );
    expect(component.formInventory()).toBe(2500);
    expect(fakeStockInput.value).toBe('2.500');
  });
});
