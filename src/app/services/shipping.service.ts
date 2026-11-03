import { Injectable, signal, computed } from '@angular/core';
import { CourierCode, ShippingServiceOption, ShippingZone, ShopifyOrder } from '../models/shipping.model';

@Injectable({
  providedIn: 'root'
})
export class ShippingService {
  // Couriers list
  readonly couriers: { code: CourierCode; name: string; appName: string; icon: string; color: string; defaultEta: string }[] = [
    { code: 'J&T', name: 'J&T Express Indonesia', appName: 'J&T Express Official App', icon: '⚡', color: '#ED1C24', defaultEta: '1-3 Hari' },
    { code: 'JNE', name: 'JNE Shipping & Express', appName: 'JNE Shipping Automated Plugin', icon: '📦', color: '#005BAA', defaultEta: '1-3 Hari' },
    { code: 'SICEPAT', name: 'SiCepat Ekspres', appName: 'SiCepat HALU & Best App', icon: '🚀', color: '#D32F2F', defaultEta: '2-3 Hari' },
    { code: 'GOSEND', name: 'GoSend & Grab Instant', appName: 'Instant On-Demand Delivery', icon: '🛵', color: '#00AA13', defaultEta: '1-3 Jam' }
  ];

  // Indonesian destinations
  readonly shippingDestinations: ShippingZone[] = [
    { province: 'DKI Jakarta', city: 'Jakarta Selatan', baseRateMultiplier: 1.0, jntAvailable: true, jneAvailable: true },
    { province: 'DKI Jakarta', city: 'Jakarta Barat', baseRateMultiplier: 1.0, jntAvailable: true, jneAvailable: true },
    { province: 'Jawa Barat', city: 'Kota Bandung', baseRateMultiplier: 1.1, jntAvailable: true, jneAvailable: true },
    { province: 'Jawa Barat', city: 'Kota Bekasi', baseRateMultiplier: 1.0, jntAvailable: true, jneAvailable: true },
    { province: 'Jawa Timur', city: 'Kota Surabaya (Origin)', baseRateMultiplier: 0.8, jntAvailable: true, jneAvailable: true },
    { province: 'Jawa Timur', city: 'Kota Malang', baseRateMultiplier: 0.9, jntAvailable: true, jneAvailable: true },
    { province: 'Jawa Tengah', city: 'Kota Semarang', baseRateMultiplier: 1.1, jntAvailable: true, jneAvailable: true },
    { province: 'DI Yogyakarta', city: 'Kota Yogyakarta', baseRateMultiplier: 1.1, jntAvailable: true, jneAvailable: true },
    { province: 'Banten', city: 'Tangerang Selatan', baseRateMultiplier: 1.0, jntAvailable: true, jneAvailable: true },
    { province: 'Bali', city: 'Kota Denpasar', baseRateMultiplier: 1.5, jntAvailable: true, jneAvailable: true },
    { province: 'Sumatera Utara', city: 'Kota Medan', baseRateMultiplier: 1.9, jntAvailable: true, jneAvailable: true },
    { province: 'Riau', city: 'Kota Pekanbaru', baseRateMultiplier: 1.8, jntAvailable: true, jneAvailable: true },
    { province: 'Sulawesi Selatan', city: 'Kota Makassar', baseRateMultiplier: 2.1, jntAvailable: true, jneAvailable: true },
    { province: 'Kalimantan Timur', city: 'Kota Balikpapan', baseRateMultiplier: 2.2, jntAvailable: true, jneAvailable: true }
  ];

  private readonly initialOrders: ShopifyOrder[] = [
    {
      id: 'ord-1001',
      orderNumber: '#SYB-10821',
      createdAt: '28 Okt 2026, 09:15',
      customerName: 'Aulia Rahmadani',
      customerEmail: 'aulia.r@gmail.com',
      customerPhone: '081298412933',
      shippingAddress: {
        street: 'Jl. Senopati No. 42',
        city: 'Jakarta Selatan',
        province: 'DKI Jakarta',
        postalCode: '12190'
      },
      items: [
        { productId: 'red-jelly-serum', title: 'FORTE Red Jelly Serum', variantName: '20ml Regular Glass Bottle', quantity: 2, price: 22325, image: 'products/red-jelly-serum.jpg' },
        { productId: 'aha-body-toner', title: 'AHA Skinboost Body Toner', variantName: 'Standard 250ml', quantity: 1, price: 46060, image: 'products/aha-body-toner.jpg' }
      ],
      subtotal: 90710,
      shippingCost: 10000,
      discount: 13600,
      total: 87110,
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Unfulfilled',
      isLabelPrinted: true,
      labelPrintedAt: '28 Okt 2026, 09:30',
      courier: 'J&T',
      serviceName: 'J&T EZ Express',
      trackingNumber: 'JT88291039401',
      weightGrams: 450
    },
    {
      id: 'ord-1002',
      orderNumber: '#SYB-10822',
      createdAt: '28 Okt 2026, 10:40',
      customerName: 'Kezia Maharani',
      customerEmail: 'kezia.m@yahoo.com',
      customerPhone: '085712398411',
      shippingAddress: {
        street: 'Komplek Permata Buana Blok C3',
        city: 'Kota Surabaya (Origin)',
        province: 'Jawa Timur',
        postalCode: '60119'
      },
      items: [
        { productId: 'glow-fresh-bundle', title: 'Paket Bundling Glow & Fresh 3in1', variantName: 'Paket Lengkap Glowing 3in1', quantity: 1, price: 88042, image: 'products/glow-fresh-bundle.jpg' }
      ],
      subtotal: 88042,
      shippingCost: 8000,
      discount: 0,
      total: 96042,
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Unfulfilled',
      isLabelPrinted: false,
      courier: 'JNE',
      serviceName: 'JNE Reguler',
      trackingNumber: 'JNE-PENDING-02',
      weightGrams: 600
    },
    {
      id: 'ord-1003',
      orderNumber: '#SYB-10823',
      createdAt: '28 Okt 2026, 11:12',
      customerName: 'Siti Nurhaliza',
      customerEmail: 'siti.nur@gmail.com',
      customerPhone: '081399081234',
      shippingAddress: {
        street: 'Jl. Riau No. 88',
        city: 'Kota Bandung',
        province: 'Jawa Barat',
        postalCode: '40115'
      },
      items: [
        { productId: 'golden-egg-mask', title: 'Bright Glow Jelly Mask Golden Egg', variantName: 'Golden Egg Jar 50gr', quantity: 1, price: 72380, image: 'products/golden-egg-mask.jpg' },
        { productId: 'lip-cream-matte', title: 'SYB Lip Cream Matte', variantName: 'Shade 06 Terrable Brick', quantity: 1, price: 22748, image: 'products/lip-cream-matte.jpg' }
      ],
      subtotal: 95128,
      shippingCost: 11000,
      discount: 14269,
      total: 91859,
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Shipped',
      isLabelPrinted: true,
      labelPrintedAt: '28 Okt 2026, 11:30',
      courier: 'J&T',
      serviceName: 'J&T EZ Express',
      trackingNumber: 'JT99104820194',
      weightGrams: 350
    },
    {
      id: 'ord-1004',
      orderNumber: '#SYB-10824',
      createdAt: '28 Okt 2026, 13:05',
      customerName: 'Indah Kusuma',
      customerEmail: 'indahk@outlook.com',
      customerPhone: '081987654321',
      shippingAddress: {
        street: 'Jl. Sunset Road No. 12',
        city: 'Kota Denpasar',
        province: 'Bali',
        postalCode: '80361'
      },
      items: [
        { productId: 'body-serum-booster', title: 'Original Body Serum Booster', variantName: 'Brightening Diamond 30ml', quantity: 2, price: 40903, image: 'products/body-serum-booster.jpg' }
      ],
      subtotal: 81806,
      shippingCost: 18000,
      discount: 0,
      total: 99806,
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Shipped',
      isLabelPrinted: true,
      labelPrintedAt: '28 Okt 2026, 13:20',
      courier: 'JNE',
      serviceName: 'JNE YES (Yakin Esok Sampai)',
      trackingNumber: 'JNE0192830192',
      weightGrams: 280
    },
    {
      id: 'ord-1005',
      orderNumber: '#SYB-10825',
      createdAt: '28 Okt 2026, 14:22',
      customerName: 'Melati Anggraini',
      customerEmail: 'melati.ang@gmail.com',
      customerPhone: '082133445566',
      shippingAddress: {
        street: 'Jl. Malioboro No. 45',
        city: 'Kota Yogyakarta',
        province: 'DI Yogyakarta',
        postalCode: '55271'
      },
      items: [
        { productId: 'peeling-serum', title: 'Peeling Serum Vitamin C', variantName: 'Botol Pipet 20ml', quantity: 1, price: 35895, image: 'products/peeling-serum.jpg' },
        { productId: 'lippy-oil-serum', title: 'Vitamin Lippy Oil Serum', variantName: 'Single 5ml Tube', quantity: 1, price: 46060, image: 'products/lippy-oil-serum.jpg' }
      ],
      subtotal: 81955,
      shippingCost: 11000,
      discount: 0,
      total: 92955,
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Delivered',
      isLabelPrinted: true,
      labelPrintedAt: '28 Okt 2026, 14:40',
      courier: 'SICEPAT',
      serviceName: 'SiCepat HALU',
      trackingNumber: '003948102948',
      weightGrams: 220
    },
    {
      id: 'ord-1006',
      orderNumber: '#SYB-10826',
      createdAt: '28 Okt 2026, 15:00',
      customerName: 'Dinda Permatasari',
      customerEmail: 'dinda.p@gmail.com',
      customerPhone: '081245678901',
      shippingAddress: {
        street: 'Jl. Pemuda No. 15',
        city: 'Kota Surabaya (Origin)',
        province: 'Jawa Timur',
        postalCode: '60271'
      },
      items: [
        { productId: 'red-jelly-serum', title: 'FORTE Red Jelly Serum', variantName: '20ml Regular Glass Bottle', quantity: 1, price: 22325, image: 'products/red-jelly-serum.jpg' },
        { productId: 'lippy-oil-serum', title: 'Vitamin Lippy Oil Serum', variantName: 'Single 5ml Tube', quantity: 1, price: 46060, image: 'products/lippy-oil-serum.jpg' }
      ],
      subtotal: 68385,
      shippingCost: 8000,
      discount: 0,
      total: 76385,
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Unfulfilled',
      isLabelPrinted: true,
      labelPrintedAt: '28 Okt 2026, 15:15',
      courier: 'J&T',
      serviceName: 'J&T EZ Express',
      trackingNumber: 'JT77391029481',
      weightGrams: 300
    }
  ];

  readonly orders = signal<ShopifyOrder[]>(this.initialOrders);
  readonly selectedDestination = signal<ShippingZone>(this.shippingDestinations[0]);

  readonly activeOrdersCount = computed(() =>
    this.orders().filter((o) => o.fulfillmentStatus !== 'Delivered').length
  );

  calculateShippingOptions(zone: ShippingZone, weightGrams: number = 500): ShippingServiceOption[] {
    const kg = Math.ceil(weightGrams / 1000);
    const baseMult = zone.baseRateMultiplier;

    return [
      {
        id: 'opt-jnt-ez',
        courier: 'J&T',
        serviceName: 'EZ Express',
        courierFullName: 'J&T Express Official Service',
        cost: Math.round(11000 * baseMult * kg),
        etd: '1-3 Hari',
        type: 'Regular',
        badge: 'Rekomendasi Hemat',
        trackingPrefix: 'JT'
      },
      {
        id: 'opt-jne-reg',
        courier: 'JNE',
        serviceName: 'REG (Reguler)',
        courierFullName: 'JNE Shipping Regular Automated',
        cost: Math.round(12000 * baseMult * kg),
        etd: '2-3 Hari',
        type: 'Regular',
        trackingPrefix: 'JNE'
      },
      {
        id: 'opt-jne-yes',
        courier: 'JNE',
        serviceName: 'YES (Yakin Esok Sampai)',
        courierFullName: 'JNE Premium Overnight Service',
        cost: Math.round(24000 * baseMult * kg),
        etd: '1 Hari (Besok Sampai)',
        type: 'Express',
        badge: 'Super Cepat',
        trackingPrefix: 'JNE-YES'
      },
      {
        id: 'opt-sicepat-halu',
        courier: 'SICEPAT',
        serviceName: 'HALU (Harga Mulai Lima Ribu)',
        courierFullName: 'SiCepat HALU Standard',
        cost: Math.round(10000 * baseMult * kg),
        etd: '2-4 Hari',
        type: 'Economy',
        trackingPrefix: '00'
      }
    ];
  }

  constructor() {
    this.restoreOrders();
  }

  private restoreOrders(): void {
    try {
      const saved = localStorage.getItem('syb_admin_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized: ShopifyOrder[] = parsed.map((o: ShopifyOrder) => {
            const isReady = (o.fulfillmentStatus as string) === 'Ready to Ship';
            const status = isReady ? 'Unfulfilled' : o.fulfillmentStatus;
            const printed = isReady
              ? true
              : typeof o.isLabelPrinted === 'boolean'
              ? o.isLabelPrinted
              : Boolean(status !== 'Unfulfilled' || (o.trackingNumber && !o.trackingNumber.includes('PENDING')));
            return {
              ...o,
              fulfillmentStatus: status,
              isLabelPrinted: printed
            };
          });
          this.orders.set(sanitized);
        }
      }
    } catch {}
  }

  private persist(): void {
    try {
      localStorage.setItem('syb_admin_orders', JSON.stringify(this.orders()));
    } catch {}
  }

  generateTrackingNumber(courier: CourierCode): string {
    const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    switch (courier) {
      case 'J&T':
        return `JT${randomDigits}ID`;
      case 'JNE':
        return `JNE${randomDigits}`;
      case 'SICEPAT':
        return `00${randomDigits}`;
      case 'GOSEND':
        return `GK-${Math.floor(10000000 + Math.random() * 90000000)}`;
      default:
        return `EXP${randomDigits}`;
    }
  }

  updateOrderStatus(orderId: string, newStatus: ShopifyOrder['fulfillmentStatus'], isLabelPrinted?: boolean): void {
    this.orders.update((list) =>
      list.map((o) => {
        if (o.id === orderId) {
          const updated: ShopifyOrder = {
            ...o,
            fulfillmentStatus: newStatus,
            ...(typeof isLabelPrinted === 'boolean' ? { isLabelPrinted } : {})
          };
          if ((newStatus === 'Shipped' || newStatus === 'Ready to Ship') && (!o.trackingNumber || o.trackingNumber.includes('PENDING'))) {
            updated.trackingNumber = this.generateTrackingNumber(o.courier);
            updated.isLabelPrinted = true;
          }
          return updated;
        }
        return o;
      })
    );
    this.persist();
  }

  markLabelPrinted(orderId: string): void {
    this.orders.update((list) =>
      list.map((o) => {
        if (o.id === orderId) {
          const updated: ShopifyOrder = {
            ...o,
            isLabelPrinted: true,
            labelPrintedAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
          };
          if (!o.trackingNumber || o.trackingNumber.includes('PENDING')) {
            updated.trackingNumber = this.generateTrackingNumber(o.courier);
          }
          return updated;
        }
        return o;
      })
    );
    this.persist();
  }

  updateOrderTracking(orderId: string, trackingNumber: string, courier?: CourierCode): void {
    this.orders.update((list) =>
      list.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            trackingNumber: trackingNumber.trim(),
            ...(courier ? { courier } : {})
          };
        }
        return o;
      })
    );
    this.persist();
  }

  applyAwbToOrder(orderId: string, trackingNumber: string, isAutoAdvance: boolean = true): void {
    const trimmed = trackingNumber.trim();
    this.orders.update((list) =>
      list.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            trackingNumber: trimmed,
            courier: 'JNE',
            isLabelPrinted: isAutoAdvance ? true : o.isLabelPrinted,
            labelPrintedAt: isAutoAdvance
              ? (o.labelPrintedAt || new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }))
              : o.labelPrintedAt
          };
        }
        return o;
      })
    );
    this.persist();
  }

  addOrder(order: ShopifyOrder): void {
    this.orders.update((list) => [order, ...list]);
    this.persist();
  }

  deleteOrder(orderId: string): void {
    this.orders.update((list) => list.filter((o) => o.id !== orderId));
    this.persist();
  }

  resetOrdersToDefault(): void {
    this.orders.set(this.initialOrders);
    this.persist();
  }

  getTrackingMilestones(order: ShopifyOrder): {
    title: string;
    location: string;
    time: string;
    description: string;
    status: 'completed' | 'active' | 'upcoming';
  }[] {
    const isUnprinted = !order.isLabelPrinted && order.fulfillmentStatus === 'Unfulfilled';
    const isPacking = !!order.isLabelPrinted && order.fulfillmentStatus === 'Unfulfilled';
    const isReady = order.fulfillmentStatus === 'Ready to Ship';
    const isShipped = order.fulfillmentStatus === 'Shipped';
    const isDelivered = order.fulfillmentStatus === 'Delivered';

    return [
      {
        title: 'Pesanan Diterima & Terverifikasi',
        location: 'SYB Surabaya E-Commerce Hub',
        time: order.createdAt,
        description: `Pembayaran ${order.paymentStatus} via Gateway Resmi. Item siap dikemas di gudang.`,
        status: 'completed'
      },
      {
        title: isUnprinted
          ? 'Menunggu Cetak Resi (Belum Dicetak)'
          : isPacking
          ? 'Resi Telah Dicetak — Fase Pengemasan (Packing)'
          : 'Pesanan Selesai Dikemas & Diberi Resi',
        location: 'Gudang Ekspedisi SYB - Rungkut Industri Surabaya',
        time: isUnprinted ? 'Menunggu Cetak Label' : (order.labelPrintedAt || '28 Okt 2026, 12:45 WIB'),
        description: isUnprinted
          ? 'Pesanan terverifikasi. Menunggu staf gudang mencetak label resi ekspedisi.'
          : isPacking
          ? `Resi resmi ${order.courier} (${order.trackingNumber}) telah dicetak. Staf gudang sedang mengemas produk dengan bubble wrap.`
          : `Resi resmi ${order.courier} (${order.trackingNumber}) tertempel rapi pada kardus pengiriman.`,
        status: isUnprinted || isPacking ? 'active' : isReady || isShipped || isDelivered ? 'completed' : 'upcoming'
      },
      {
        title: isReady ? 'Menunggu Penjemputan Kurir (Pickup)' : isShipped || isDelivered ? `Paket Telah Diserahkan ke ${order.courier}` : 'Penjemputan Ekspedisi',
        location: `Drop Point ${order.courier} Surabaya Timur`,
        time: isReady ? 'Jadwal Pickup: 15:00 WIB' : isShipped || isDelivered ? '28 Okt 2026, 16:30 WIB' : 'Menunggu',
        description: isReady
          ? `Driver ${order.courier} dijadwalkan pickup di gudang pabrik sore ini.`
          : isShipped || isDelivered
          ? `Paket diterima petugas manifest ${order.courier} dan siap diberangkatkan ke Hub Sortir.`
          : 'Menunggu proses serah terima barang.',
        status: isReady ? 'active' : isShipped || isDelivered ? 'completed' : 'upcoming'
      },
      {
        title: isShipped ? `Dalam Perjalanan ke ${order.shippingAddress.city}` : isDelivered ? `Tiba di DC Hub ${order.shippingAddress.city}` : `Transit ke Kota Tujuan (${order.shippingAddress.city})`,
        location: `Gateway Logistik ${order.shippingAddress.province}`,
        time: isShipped ? 'Estimasi Sampai: 1-2 Hari' : isDelivered ? '29 Okt 2026, 08:15 WIB' : 'Dalam Proses',
        description: isShipped
          ? `Paket sedang diangkut armada kargo jalur darat/udara menuju kota tujuan.`
          : isDelivered
          ? `Paket tiba di Distribution Center setempat dan ditugaskan ke kurir pengantar.`
          : 'Paket belum diberangkatkan.',
        status: isShipped ? 'active' : isDelivered ? 'completed' : 'upcoming'
      },
      {
        title: isDelivered ? 'Paket Berhasil Diterima' : 'Pengantaran ke Alamat Tujuan',
        location: `${order.shippingAddress.street}, ${order.shippingAddress.city}`,
        time: isDelivered ? '29 Okt 2026, 14:10 WIB' : 'Estimasi Besok',
        description: isDelivered
          ? `Paket telah diterima langsung oleh ${order.customerName}. Status: Berhasil Terkirim (Delivered).`
          : `Kurir pengantar akan menghubungi nomor ${order.customerPhone} saat menuju lokasi.`,
        status: isDelivered ? 'completed' : 'upcoming'
      }
    ];
  }
}
