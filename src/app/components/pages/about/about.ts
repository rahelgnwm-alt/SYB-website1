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
    { num: '20 Jt+', label: 'Pelanggan Setia', note: 'Di seluruh kota di Indonesia' },
    { num: '100%', label: 'BPOM & Halal Resmi', note: 'Teruji aman secara klinis' },
    { num: '300+', label: 'Inovasi Produk', note: 'Skincare & makeup viral' },
    { num: '9 Thn', label: 'Dedikasi Nyata', note: 'Menemani kecantikan sejak 2017' },
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
      year: '2017',
      title: 'Founded',
      desc: 'PT Sheva Jordan Bersama founded as a beauty distributor.',
    },
    {
      year: '2018',
      title: 'First Journey',
      desc: 'First Distribution line established across Java.',
    },
    {
      year: '2020',
      title: 'Production Expansion',
      desc: 'Establishment of PT. Alwinda Pratama Jaya Factory. ',
    },
    {
      year: '2023',
      title: 'National Expansion',
      desc: 'Expansion into national marketplaces.',
    },
    {
      year: '2024',
      title: 'Collaboration',
      desc: 'Collaboration with national celebrities & KOLs.',
    },
    {
      year: '2025',
      title: 'Export',
      desc: 'Launch of export-ready product lines.',
    },
  ];
}
