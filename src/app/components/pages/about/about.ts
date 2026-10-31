import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MagneticDirective, RevealDirective, TiltDirective } from '../../../directives';

interface Milestone {
  year: string;
  title: string;
  desc: string;
}

interface ValueItem {
  icon: string;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-about',
  imports: [RouterLink, RevealDirective, MagneticDirective, TiltDirective],
  templateUrl: './about.html',
  styleUrl: './about.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  protected readonly stats = [
    { num: '500K+', label: 'Pelanggan Setia', note: 'Di seluruh kota di Indonesia' },
    { num: '100%', label: 'BPOM & Halal Resmi', note: 'Teruji aman secara klinis' },
    { num: '50+', label: 'Inovasi Produk', note: 'Skincare & makeup viral' },
    { num: '8 Thn', label: 'Dedikasi Nyata', note: 'Menemani kecantikan sejak 2018' },
  ];

  protected readonly values: ValueItem[] = [
    {
      icon: '🧪',
      title: 'Bahan Aktif Premium',
      desc: 'Menggabungkan Niacinamide, AHA, DNA Salmon, dan Botanical Extracts pilihan untuk hasil glowing maksimal.',
    },
    {
      icon: '🛡️',
      title: 'Standar CPKB & BPOM',
      desc: 'Diproduksi di fasilitas modern bersertifikasi Cara Pembuatan Kosmetika yang Baik dengan uji dermatologis ketat.',
    },
    {
      icon: '💗',
      title: 'Inklusif & Ramah Kulit',
      desc: 'Diformulasikan khusus untuk iklim tropis Indonesia, lembut untuk kulit sensitif, remaja, dan dewasa.',
    },
    {
      icon: '✨',
      title: 'Harga Bersahabat',
      desc: 'Kecantikan berkualitas bukan kemewahan eksklusif — kami memastikan setiap wanita Indonesia dapat merawat diri.',
    },
  ];

  protected readonly milestones: Milestone[] = [
    {
      year: '2018',
      title: 'Awal Mula Perjalanan',
      desc: 'SYB lahir dengan komitmen menghadirkan produk perawatan kulit lokal berkualitas tinggi dan terjangkau.',
    },
    {
      year: '2020',
      title: 'Viral Red Jelly & AHA Toner',
      desc: 'Peluncuran FORTE Red Jelly Serum dan AHA Skinboost Toner meledak di pasar dengan jutaan botol terjual.',
    },
    {
      year: '2023',
      title: 'Ekspansi Lini Kosmetik Cute',
      desc: 'Menghadirkan lip cream transferproof, blusher travel-friendly, dan DNA Salmon jelly mask.',
    },
    {
      year: '2026',
      title: 'Next-Gen Glowing Experience',
      desc: 'Pengalaman digital terintegrasi dengan pengiriman kilat 24/7 dan jutaan wanita bersinar setiap hari.',
    },
  ];
}
