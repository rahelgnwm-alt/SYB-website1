import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService, UserSession } from '../../../services/auth.service';
import { ShippingService } from '../../../services/shipping.service';
import { ShopifyOrder } from '../../../models/shipping.model';
import { CartService } from '../../../services/cart.service';

interface VoucherItem {
  code: string;
  title: string;
  discount: string;
  minSpend: string;
  validUntil: string;
  badge: string;
  bgGradient: string;
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  protected readonly auth = inject(AuthService);
  protected readonly shippingService = inject(ShippingService);
  protected readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  // Active Tab
  protected readonly activeTab = signal<'orders' | 'address' | 'vouchers' | 'glow-club'>('orders');

  // Tracking modal state
  protected readonly activeTrackingOrder = signal<ShopifyOrder | null>(null);

  // Edit address modal state
  protected readonly isEditAddressModalOpen = signal(false);
  protected readonly editName = signal('');
  protected readonly editPhone = signal('');
  protected readonly editStreet = signal('');
  protected readonly editCity = signal('');
  protected readonly editProvince = signal('');
  protected readonly editPostalCode = signal('');

  // Toast notification
  protected readonly toastMessage = signal<string | null>(null);
  private toastTimer: any = null;

  // Available Vouchers
  protected readonly memberVouchers: VoucherItem[] = [
    {
      code: 'GLOWVIP20',
      title: 'Diskon Spesial Member VIP',
      discount: 'Diskon 20%',
      minSpend: 'Min. Belanja Rp 100.000',
      validUntil: '31 Des 2026',
      badge: 'Eksklusif Member',
      bgGradient: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)'
    },
    {
      code: 'ONGKIRFREE',
      title: 'Subsidi Ongkir Seluruh Indonesia',
      discount: 'Gratis Ongkir Rp 20.000',
      minSpend: 'Min. Belanja Rp 80.000',
      validUntil: '31 Des 2026',
      badge: 'Hemat Logistik',
      bgGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      code: 'CUTEBEAUTY',
      title: 'Welcome Glowing Treat',
      discount: 'Potongan Rp 15.000',
      minSpend: 'Tanpa Minimal Belanja',
      validUntil: '30 Nov 2026',
      badge: 'Paling Populer',
      bgGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    }
  ];

  // Orders matching current user or fallback to realistic customer orders
  protected readonly userOrders = computed(() => {
    const user = this.auth.currentUser();
    const all = this.shippingService.orders();
    if (!user) return [];

    const userEmail = (user.email || '').toLowerCase().trim();
    const matched = all.filter((o) => (o.customerEmail || '').toLowerCase().trim() === userEmail);

    // If specific email has orders, return them; otherwise display the top orders to give an active realistic experience
    if (matched.length > 0) {
      return matched;
    }

    // Default sample orders for any new logged-in customer so they can test tracking
    return all.slice(0, 3);
  });

  getImgUrl(path: string | undefined): string {
    if (!path) return 'images/logo.png';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return path.replace(/^\//, '');
  }

  rupiah(val: number): string {
    return 'Rp' + Math.round(val).toLocaleString('id-ID');
  }

  showToast(msg: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage.set(msg);
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set(null);
    }, 2800);
  }

  copyVoucherCode(code: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    this.showToast(`Kode voucher "${code}" berhasil disalin! 💖`);
  }

  copyTrackingNumber(trackingNum: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(trackingNum);
    }
    this.showToast(`No. Resi "${trackingNum}" berhasil disalin! 📋`);
  }

  openTrackingModal(order: ShopifyOrder): void {
    this.activeTrackingOrder.set(order);
  }

  closeTrackingModal(): void {
    this.activeTrackingOrder.set(null);
  }

  openEditAddressModal(): void {
    const user = this.auth.currentUser();
    this.editName.set(user?.fullName || '');
    this.editPhone.set(user?.phone || '');
    this.editStreet.set(user?.address?.street || '');
    this.editCity.set(user?.address?.city || '');
    this.editProvince.set(user?.address?.province || '');
    this.editPostalCode.set(user?.address?.postalCode || '');
    this.isEditAddressModalOpen.set(true);
  }

  closeEditAddressModal(): void {
    this.isEditAddressModalOpen.set(false);
  }

  saveAddress(event: Event): void {
    event.preventDefault();
    this.auth.updateProfile({
      fullName: this.editName().trim(),
      phone: this.editPhone().trim(),
      address: {
        street: this.editStreet().trim(),
        city: this.editCity().trim(),
        province: this.editProvince().trim(),
        postalCode: this.editPostalCode().trim()
      }
    });
    this.closeEditAddressModal();
    this.showToast('Alamat pengiriman utama berhasil diperbarui! ✨');
  }

  handleLogout(): void {
    this.auth.logout();
    this.showToast('Anda telah berhasil keluar.');
    this.router.navigate(['/']);
  }
}
