import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CheckoutComponent } from './checkout';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { ShippingService } from '../../../services/shipping.service';
import { JneApiService } from '../../../services/jne-api.service';

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        provideRouter([]),
        AuthService,
        CartService,
        ShippingService,
        JneApiService
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the checkout component', () => {
    expect(component).toBeTruthy();
  });

  it('should have Indonesia as the default country', () => {
    expect((component as any).country()).toBe('Indonesia');
  });

  it('should auto-fill address if user has saved profile address', () => {
    authService.currentUser.set({
      id: 'usr_test',
      username: 'aulia',
      email: 'aulia.r@gmail.com',
      fullName: 'Aulia Rahmadani',
      phone: '081298412933',
      role: 'customer',
      lastLogin: 'Today',
      address: {
        street: 'Jl. Senopati No. 42',
        city: 'Jakarta Selatan',
        province: 'DKI Jakarta',
        postalCode: '12190'
      }
    });

    (component as any).initUserData();

    expect((component as any).firstName()).toBe('Aulia');
    expect((component as any).lastName()).toBe('Rahmadani');
    expect((component as any).address()).toBe('Jl. Senopati No. 42');
    expect((component as any).city()).toBe('Jakarta Selatan');
    expect((component as any).province()).toBe('DKI Jakarta');
    expect((component as any).postalCode()).toBe('12190');
    expect((component as any).phone()).toBe('081298412933');
  });

  it('should block placing order while checkoutEnabled is false', async () => {
    const cartService = TestBed.inject(CartService);
    cartService.checkoutEnabled.set(false);
    (component as any).lastName.set('Rahmadani');
    (component as any).address.set('Jl. Senopati No. 42');
    (component as any).city.set('Surabaya');
    (component as any).postalCode.set('60241');
    (component as any).phone.set('081234567890');

    await (component as any).placeOrder();

    expect((component as any).completedOrder()).toBeNull();
    expect((component as any).errorMessage()).toContain('sementara dinonaktifkan');
  });

  it('should update profile address when updateProfileAddress is true and order is placed', async () => {
    const cartService = TestBed.inject(CartService);
    cartService.checkoutEnabled.set(true);
    authService.currentUser.set({
      id: 'usr_test2',
      username: 'kezia',
      email: 'kezia@example.com',
      fullName: 'Kezia Maharani',
      phone: '085712398411',
      role: 'customer',
      lastLogin: 'Today',
      address: {
        street: 'Alamat Lama',
        city: 'Surabaya',
        province: 'Jawa Timur',
        postalCode: '60111'
      }
    });

    (component as any).initUserData();
    (component as any).address.set('Jl. Raya Darmo No. 99');
    (component as any).city.set('Kota Surabaya');
    (component as any).province.set('Jawa Timur');
    (component as any).postalCode.set('60241');
    (component as any).phone.set('081234567890');
    (component as any).updateProfileAddress.set(true);

    await (component as any).placeOrder();

    const updatedUser = authService.currentUser();
    expect(updatedUser?.address?.street).toBe('Jl. Raya Darmo No. 99');
    expect(updatedUser?.address?.postalCode).toBe('60241');
    expect(updatedUser?.phone).toBe('081234567890');
  });
});

