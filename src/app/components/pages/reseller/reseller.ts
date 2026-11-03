import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ResellerService } from '../../../services/reseller.service';
import { CartService } from '../../../services/cart.service';
import { ResellerProduct } from '../../../models/reseller-product.model';
import { Product as DataProduct } from '../../../data';
import { RevealDirective, TiltDirective, MagneticDirective } from '../../../directives';

@Component({
  selector: 'app-reseller',
  imports: [CommonModule, DecimalPipe, RevealDirective, TiltDirective, MagneticDirective],
  templateUrl: './reseller.html',
  styleUrl: './reseller.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResellerComponent {
  readonly resellerService = inject(ResellerService);
  private readonly cartService = inject(CartService);
  protected readonly Math = Math;

  readonly selectedCategory = signal<string>('Semua');
  readonly addedNotification = signal<string | null>(null);

  readonly categories = [
    'Semua',
    'Starter Kit',
    'Kartonan',
    'Paket Wajah',
    'Paket Tubuh',
    'Paket Kosmetik'
  ];

  readonly products = computed(() => {
    const list = this.resellerService.activeResellerProducts();
    const cat = this.selectedCategory();
    if (cat === 'Semua') return list;
    return list.filter((p) => p.categoryLabel === cat);
  });

  addPackageToCart(e: MouseEvent, p: ResellerProduct): void {
    e.preventDefault();
    e.stopPropagation();

    // Map ResellerProduct to DataProduct for Cart compatibility
    const cartProduct: DataProduct = {
      id: p.id,
      name: `[Grosir] ${p.title}`,
      tagline: p.packageContents,
      image: p.image,
      price: p.wholesalePrice,
      compareAt: p.retailPrice,
      badge: p.badge?.includes('Populer') ? 'Best Seller' : 'Bundling',
      handle: p.id,
      tint: p.accentColor || '#ecfdf5',
    };

    this.cartService.add(cartProduct, e.currentTarget as HTMLElement);
    this.showToast(`Paket "${p.title}" dimasukkan ke keranjang belanja!`);
  }

  getWhatsAppLink(p?: ResellerProduct): string {
    const base = 'https://wa.me/6281333369909';
    if (p) {
      const text = encodeURIComponent(
        `Halo Admin Kemitraan SYB Official, saya tertarik memesan paket reseller:\n\n*${p.title}*\nHarga Grosir: Rp ${p.wholesalePrice.toLocaleString('id-ID')}\nMin. Order: ${p.minOrder} ${p.minOrderUnit}\n\nMohon info ketersediaan stok & ongkos kirim ke kota saya. Terima kasih!`
      );
      return `${base}?text=${text}`;
    }
    const generalText = encodeURIComponent(
      'Halo Admin Kemitraan SYB Official, saya ingin mendaftar dan berkonsultasi mengenai Program Reseller & Grosir SYB. Mohon info syarat dan katalog lengkapnya. Terima kasih!'
    );
    return `${base}?text=${generalText}`;
  }

  private showToast(msg: string): void {
    this.addedNotification.set(msg);
    setTimeout(() => this.addedNotification.set(null), 3000);
  }
}
