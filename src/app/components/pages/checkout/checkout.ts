import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { ShippingService } from '../../../services/shipping.service';
import { JneApiService } from '../../../services/jne-api.service';
import { JneTariffOption } from '../../../models/jne.model';
import { ShopifyOrder } from '../../../models/shipping.model';

@Component({
  selector: 'app-checkout',
  imports: [RouterLink, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  protected readonly shippingService = inject(ShippingService);
  protected readonly jneApi = inject(JneApiService);
  private readonly router = inject(Router);

  // Form Fields matching user image
  protected readonly country = signal<string>('Indonesia');
  protected readonly firstName = signal<string>('');
  protected readonly lastName = signal<string>('');
  protected readonly address = signal<string>('');
  protected readonly apartment = signal<string>('');
  protected readonly city = signal<string>('Surabaya');
  protected readonly province = signal<string>('Jawa Timur');
  protected readonly postalCode = signal<string>('60293');
  protected readonly phone = signal<string>('');
  protected readonly email = signal<string>('');

  // Checkbox states
  protected readonly saveInfoNextTime = signal<boolean>(true);
  protected readonly updateProfileAddress = signal<boolean>(true);

  // Indonesian Provinces list
  readonly provinces: string[] = [
    'Jawa Timur',
    'DKI Jakarta',
    'Jawa Barat',
    'Jawa Tengah',
    'DI Yogyakarta',
    'Banten',
    'Bali',
    'Sumatera Utara',
    'Riau',
    'Sumatera Selatan',
    'Sumatera Barat',
    'Lampung',
    'Jambi',
    'Aceh',
    'Kalimantan Barat',
    'Kalimantan Timur',
    'Kalimantan Selatan',
    'Sulawesi Selatan',
    'Sulawesi Utara',
    'Nusa Tenggara Barat',
    'Nusa Tenggara Timur',
    'Papua'
  ];

  // Logistics / JNE Tariff state
  protected readonly isLoadingTariff = signal<boolean>(false);
  protected readonly tariffOptions = signal<JneTariffOption[]>([]);
  protected readonly selectedTariff = signal<JneTariffOption | null>(null);

  // Weight estimation: ~250g per item, min 1kg
  protected readonly estimatedWeightKg = computed(() => {
    const totalItems = this.cart.count();
    return Math.max(1, Math.ceil(totalItems * 0.25));
  });

  // Free shipping check
  protected readonly isFreeShipping = computed(() =>
    this.cart.subtotal() >= this.cart.freeShippingThreshold
  );

  protected readonly shippingCost = computed(() => {
    if (this.isFreeShipping()) return 0;
    return this.selectedTariff()?.price ?? 15000;
  });

  // Voucher state
  protected readonly voucherInput = signal<string>('');
  protected readonly appliedDiscount = signal<number>(0);
  protected readonly appliedVoucherCode = signal<string | null>(null);

  // Grand Total calculation
  protected readonly grandTotal = computed(() => {
    const sub = this.cart.subtotal();
    const ship = this.shippingCost();
    const disc = this.appliedDiscount();
    return Math.max(0, sub + ship - disc);
  });

  // Payment method selection
  protected readonly paymentMethod = signal<'va' | 'qris' | 'cod' | 'card'>('va');

  // Checkout process & completed state
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly completedOrder = signal<ShopifyOrder | null>(null);
  protected readonly toastMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.initUserData();
    this.fetchJneTariffs();
  }

  /**
   * Pre-fill fields from user profile if logged in or from saved localStorage
   */
  protected initUserData(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.email.set(user.email || '');
      this.phone.set(user.phone || '');

      // Split full name into first & last name
      const names = (user.fullName || '').trim().split(' ');
      if (names.length > 1) {
        this.firstName.set(names.slice(0, -1).join(' '));
        this.lastName.set(names[names.length - 1]);
      } else {
        this.lastName.set(names[0] || 'Pelanggan');
      }

      if (user.address) {
        this.address.set(user.address.street || '');
        this.city.set(user.address.city || 'Surabaya');
        this.province.set(user.address.province || 'Jawa Timur');
        this.postalCode.set(user.address.postalCode || '60293');
      }
    } else {
      // Guest restore
      try {
        const saved = localStorage.getItem('syb_checkout_address');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.email) this.email.set(parsed.email);
          if (parsed.firstName) this.firstName.set(parsed.firstName);
          if (parsed.lastName) this.lastName.set(parsed.lastName);
          if (parsed.address) this.address.set(parsed.address);
          if (parsed.apartment) this.apartment.set(parsed.apartment);
          if (parsed.city) this.city.set(parsed.city);
          if (parsed.province) this.province.set(parsed.province);
          if (parsed.postalCode) this.postalCode.set(parsed.postalCode);
          if (parsed.phone) this.phone.set(parsed.phone);
        }
      } catch {}
    }
  }

  /**
   * One-click option to apply saved address from profile
   */
  protected applyProfileAddress(): void {
    const user = this.auth.currentUser();
    if (user && user.address) {
      this.address.set(user.address.street || '');
      this.city.set(user.address.city || 'Surabaya');
      this.province.set(user.address.province || 'Jawa Timur');
      this.postalCode.set(user.address.postalCode || '60293');
      if (user.phone) this.phone.set(user.phone);
      this.showToast('✅ Alamat dari profil akun berhasil diterapkan!');
      this.fetchJneTariffs();
    }
  }

  /**
   * Fetch live tariff from JNE API (/tracing/api/pricedev)
   */
  protected async fetchJneTariffs(): Promise<void> {
    this.isLoadingTariff.set(true);
    const destCode = this.jneApi.mapCityToDestCode(this.city() || this.province());
    const weight = this.estimatedWeightKg();

    try {
      const options = await this.jneApi.checkTariff(destCode, weight);
      this.tariffOptions.set(options);

      const current = this.selectedTariff();
      const matched = current ? options.find(o => o.serviceCode === current.serviceCode) : null;
      if (matched) {
        this.selectedTariff.set(matched);
      } else {
        const recommended = options.find(o => o.isRecommended) || options[0] || null;
        this.selectedTariff.set(recommended);
      }
    } catch {
      // Fallback handled gracefully in jneApi
    } finally {
      this.isLoadingTariff.set(false);
    }
  }

  protected onLocationChange(): void {
    this.fetchJneTariffs();
  }

  protected selectTariff(opt: JneTariffOption): void {
    this.selectedTariff.set(opt);
  }

  /**
   * Apply voucher code
   */
  protected applyVoucher(): void {
    const code = this.voucherInput().trim().toUpperCase();
    if (!code) return;

    if (code === 'GLOWVIP20') {
      const disc = Math.round(this.cart.subtotal() * 0.2);
      this.appliedDiscount.set(disc);
      this.appliedVoucherCode.set(code);
      this.showToast('🎉 Voucher Diskon Member 20% Berhasil Diterapkan!');
    } else if (code === 'ONGKIRFREE') {
      const shipFee = this.selectedTariff()?.price || 15000;
      this.appliedDiscount.set(shipFee);
      this.appliedVoucherCode.set(code);
      this.showToast('🚚 Voucher Bebas Ongkir Berhasil Diterapkan!');
    } else if (code === 'CUTEBEAUTY') {
      this.appliedDiscount.set(15000);
      this.appliedVoucherCode.set(code);
      this.showToast('✨ Voucher Potongan Rp 15.000 Berhasil Diterapkan!');
    } else {
      this.showToast('⚠️ Kode voucher tidak valid atau sudah kedaluwarsa.');
    }
  }

  /**
   * Place Order & Advance to Confirmation
   */
  protected async placeOrder(): Promise<void> {
    this.errorMessage.set(null);

    // Validation
    if (!this.lastName().trim()) {
      this.errorMessage.set('Harap isi Nama Belakang.');
      return;
    }
    if (!this.address().trim()) {
      this.errorMessage.set('Harap isi Alamat lengkap pengiriman.');
      return;
    }
    if (!this.city().trim()) {
      this.errorMessage.set('Harap isi Kota pengiriman.');
      return;
    }
    if (!this.postalCode().trim()) {
      this.errorMessage.set('Harap isi Kode Pos.');
      return;
    }
    if (!this.phone().trim()) {
      this.errorMessage.set('Harap isi Nomor Telepon aktif untuk kurir.');
      return;
    }

    this.isSubmitting.set(true);

    // Short realistic checkout delay
    await new Promise((r) => setTimeout(r, 650));

    const fullStreet = this.apartment().trim()
      ? `${this.address().trim()}, ${this.apartment().trim()}`
      : this.address().trim();

    const fullName = this.firstName().trim()
      ? `${this.firstName().trim()} ${this.lastName().trim()}`
      : this.lastName().trim();

    // 1. If buyer has account & update profile checkbox is checked: update profile address!
    if (this.auth.currentUser() && this.updateProfileAddress()) {
      this.auth.updateProfile({
        phone: this.phone().trim(),
        address: {
          street: fullStreet,
          city: this.city().trim(),
          province: this.province().trim(),
          postalCode: this.postalCode().trim()
        }
      });
    }

    // 2. If save info for next time is checked: persist in localStorage
    if (this.saveInfoNextTime()) {
      try {
        localStorage.setItem(
          'syb_checkout_address',
          JSON.stringify({
            email: this.email().trim(),
            firstName: this.firstName().trim(),
            lastName: this.lastName().trim(),
            address: this.address().trim(),
            apartment: this.apartment().trim(),
            city: this.city().trim(),
            province: this.province().trim(),
            postalCode: this.postalCode().trim(),
            phone: this.phone().trim()
          })
        );
      } catch {}
    }

    // 3. Create real ShopifyOrder for Admin Orders & Logistics
    const nextOrderNum = `#SYB-${Math.floor(10820 + Math.random() * 500)}`;
    const nowFormatted = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const chosenService = this.selectedTariff();
    const serviceName = chosenService ? chosenService.serviceName : 'JNE Reguler (REG)';

    const newOrder: ShopifyOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: nextOrderNum,
      createdAt: `${nowFormatted} WIB`,
      customerName: fullName,
      customerEmail: this.email().trim() || this.auth.currentUser()?.email || 'customer@sybindonesia.com',
      customerPhone: this.phone().trim(),
      shippingAddress: {
        street: fullStreet,
        city: this.city().trim(),
        province: this.province().trim(),
        postalCode: this.postalCode().trim()
      },
      items: this.cart.lines().map((line) => ({
        productId: line.product.id,
        title: line.product.name,
        variantName: line.product.tagline || 'Standard Unit',
        quantity: line.qty,
        price: line.product.price,
        image: line.product.image
      })),
      subtotal: this.cart.subtotal(),
      shippingCost: this.shippingCost(),
      discount: this.appliedDiscount(),
      total: this.grandTotal(),
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Unfulfilled',
      isLabelPrinted: false,
      courier: 'JNE',
      serviceName,
      trackingNumber: 'JNE-PENDING',
      weightGrams: this.estimatedWeightKg() * 500
    };

    this.shippingService.addOrder(newOrder);

    // 4. Clear Cart & show confirmation
    this.cart.clear();
    this.completedOrder.set(newOrder);
    this.isSubmitting.set(false);
  }

  protected rupiah(n: number): string {
    return 'Rp ' + Math.round(n).toLocaleString('id-ID');
  }

  protected showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3200);
  }
}
