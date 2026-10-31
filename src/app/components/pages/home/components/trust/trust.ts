import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RevealDirective } from '../../../../../directives';

@Component({
  selector: 'app-trust',
  imports: [RevealDirective],
  templateUrl: './trust.html',
  styleUrl: './trust.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Trust {
  protected readonly trustItems = [
    { metric: '24/7', title: 'Toko selalu buka', desc: 'Checkout kapan pun kamu mau' },
    { metric: '80%', title: 'Diskon hingga', desc: 'Promo & bundling hemat' },
    { metric: '100%', title: 'Produk asli', desc: 'Langsung dari official store' },
    { metric: '♥', title: 'Untuk semua kulit', desc: 'Formula lembut setiap hari' },
  ];
}
