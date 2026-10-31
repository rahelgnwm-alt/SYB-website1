import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShippingService } from '../../../../../services/shipping.service';
import { ProductService } from '../../../../../services/product.service';
import { CourierCode, ShopifyOrder } from '../../../../../models/shipping.model';

@Component({
  selector: 'app-admin-logistics',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-logistics.html',
  styleUrl: './admin-logistics.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLogisticsComponent {
  readonly shippingService = inject(ShippingService);
  readonly productService = inject(ProductService);

  // Sub-tabs in Logistics Hub: 'manifest' | 'couriers' | 'simulator'
  readonly shippingSubTab = signal<'manifest' | 'couriers' | 'simulator'>('manifest');

  // Search & Filters
  readonly shipmentSearchQuery = signal<string>('');
  readonly shipmentStatusFilter = signal<'All' | 'Unfulfilled' | 'Ready to Ship' | 'Shipped' | 'Delivered'>('All');
  readonly shipmentCourierFilter = signal<string>('All');

  // Modals state
  readonly isLabelModalOpen = signal<boolean>(false);
  readonly activeLabelOrder = signal<ShopifyOrder | null>(null);

  readonly isTrackingModalOpen = signal<boolean>(false);
  readonly activeTrackingOrder = signal<ShopifyOrder | null>(null);

  readonly isNewShipmentModalOpen = signal<boolean>(false);
  newShipCustName = signal<string>('');
  newShipCustPhone = signal<string>('');
  newShipStreet = signal<string>('');
  newShipCity = signal<string>('Jakarta Selatan');
  newShipProvince = signal<string>('DKI Jakarta');
  newShipPostal = signal<string>('12190');
  newShipCourier = signal<CourierCode>('J&T');
  newShipWeightGrams = signal<number>(450);
  newShipNotes = signal<string>('Fragile - Produk Skincare Cair');
  selectedProductForShipment = signal<string>('red-jelly-serum');
  selectedQtyForShipment = signal<number>(1);

  // Rate Simulator State
  calcDestCity = signal<string>('Jakarta Selatan');
  calcWeightGrams = signal<number>(1000);

  // Toast & Copied state
  readonly toastMessage = signal<string | null>(null);
  readonly copiedCode = signal<string | null>(null);

  // Computeds
  readonly totalOrdersCount = computed(() => this.shippingService.orders().length);
  readonly unfulfilledCount = computed(() => this.shippingService.orders().filter(o => o.fulfillmentStatus === 'Unfulfilled').length);
  readonly readyToShipCount = computed(() => this.shippingService.orders().filter(o => o.fulfillmentStatus === 'Ready to Ship').length);
  readonly shippedInTransitCount = computed(() => this.shippingService.orders().filter(o => o.fulfillmentStatus === 'Shipped').length);
  readonly deliveredCount = computed(() => this.shippingService.orders().filter(o => o.fulfillmentStatus === 'Delivered').length);

  readonly calculatedRates = computed(() => {
    const zone =
      this.shippingService.shippingDestinations.find((z) => z.city === this.calcDestCity()) ||
      this.shippingService.shippingDestinations[0];
    return this.shippingService.calculateShippingOptions(zone, this.calcWeightGrams());
  });

  readonly activeTrackingMilestones = computed(() => {
    const order = this.activeTrackingOrder();
    if (!order) return [];
    return this.shippingService.getTrackingMilestones(order);
  });

  readonly filteredShipmentOrders = computed(() => {
    const list = this.shippingService.orders();
    const query = this.shipmentSearchQuery().toLowerCase().trim();
    const status = this.shipmentStatusFilter();
    const courier = this.shipmentCourierFilter();

    return list.filter((ord) => {
      const matchStatus = status === 'All' || ord.fulfillmentStatus === status;
      const matchCourier = courier === 'All' || ord.courier === courier;
      const matchQuery =
        !query ||
        ord.orderNumber.toLowerCase().includes(query) ||
        ord.customerName.toLowerCase().includes(query) ||
        ord.trackingNumber.toLowerCase().includes(query) ||
        ord.shippingAddress.city.toLowerCase().includes(query) ||
        ord.shippingAddress.province.toLowerCase().includes(query);

      return matchStatus && matchCourier && matchQuery;
    });
  });

  setShippingSubTab(subTab: 'manifest' | 'couriers' | 'simulator'): void {
    this.shippingSubTab.set(subTab);
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3200);
  }

  copyTrackingCode(text: string): void {
    if (!text || text.includes('PENDING')) return;
    navigator.clipboard.writeText(text);
    this.copiedCode.set(text);
    this.showToast(`Nomor Resi "${text}" disalin ke clipboard! 📋`);
    setTimeout(() => this.copiedCode.set(null), 2500);
  }

  // Waybill / Resi Modal
  openShippingLabel(order: ShopifyOrder): void {
    this.activeLabelOrder.set(order);
    this.isLabelModalOpen.set(true);
  }

  closeShippingLabel(): void {
    this.isLabelModalOpen.set(false);
    this.activeLabelOrder.set(null);
  }

  printShippingLabel(): void {
    window.print();
    this.showToast('Mencetak resi pengiriman thermal...');
  }

  // Live Tracking Modal
  openTrackingModal(order: ShopifyOrder): void {
    this.activeTrackingOrder.set(order);
    this.isTrackingModalOpen.set(true);
  }

  closeTrackingModal(): void {
    this.isTrackingModalOpen.set(false);
    this.activeTrackingOrder.set(null);
  }

  // Shipment Order Actions
  generateWaybillForOrder(order: ShopifyOrder): void {
    this.shippingService.updateOrderStatus(order.id, 'Ready to Ship');
    this.showToast(`Resi otomatis terbit untuk ${order.orderNumber}! Siap dijemput kurir.`);
  }

  markShipped(order: ShopifyOrder): void {
    this.shippingService.updateOrderStatus(order.id, 'Shipped');
    this.showToast(`Pesanan ${order.orderNumber} telah diserahkan ke ${order.courier} (Status: Shipped)!`);
  }

  markDelivered(order: ShopifyOrder): void {
    this.shippingService.updateOrderStatus(order.id, 'Delivered');
    this.showToast(`Pesanan ${order.orderNumber} telah sampai di tujuan (Delivered)! 🎉`);
  }

  deleteOrder(orderId: string): void {
    if (confirm('Hapus pesanan ini dari riwayat pengiriman?')) {
      this.shippingService.deleteOrder(orderId);
      this.showToast('Pesanan telah dihapus.');
    }
  }

  // Manual Dispatch Creator
  openNewShipmentModal(): void {
    this.newShipCustName.set('');
    this.newShipCustPhone.set('');
    this.newShipStreet.set('');
    this.newShipCity.set('Jakarta Selatan');
    this.newShipProvince.set('DKI Jakarta');
    this.newShipPostal.set('12190');
    this.newShipCourier.set('J&T');
    this.newShipWeightGrams.set(450);
    this.newShipNotes.set('Fragile - Produk Skincare Cair');
    this.selectedProductForShipment.set(this.productService.products()[0]?.id || 'red-jelly-serum');
    this.selectedQtyForShipment.set(1);
    this.isNewShipmentModalOpen.set(true);
  }

  closeNewShipmentModal(): void {
    this.isNewShipmentModalOpen.set(false);
  }

  saveNewShipment(): void {
    if (!this.newShipCustName().trim()) {
      alert('Mohon isi nama customer penerima!');
      return;
    }
    if (!this.newShipStreet().trim()) {
      alert('Mohon isi alamat lengkap pengiriman!');
      return;
    }

    const prodId = this.selectedProductForShipment();
    const prod = this.productService.products().find(p => p.id === prodId) || this.productService.products()[0];
    const qty = Math.max(1, this.selectedQtyForShipment());
    const courier = this.newShipCourier();
    const tracking = this.shippingService.generateTrackingNumber(courier);
    const shippingFee = courier === 'J&T' ? 11000 : courier === 'JNE' ? 12000 : courier === 'SICEPAT' ? 10000 : 25000;
    const subtotal = prod.price * qty;

    const newOrder: ShopifyOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `#SYB-${Math.floor(10800 + Math.random() * 900)}`,
      createdAt: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      customerName: this.newShipCustName().trim(),
      customerEmail: `${this.newShipCustName().toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      customerPhone: this.newShipCustPhone().trim() || '081234567890',
      shippingAddress: {
        street: this.newShipStreet().trim(),
        city: this.newShipCity(),
        province: this.newShipProvince(),
        postalCode: this.newShipPostal() || '12345'
      },
      items: [
        {
          productId: prod.id,
          title: prod.title,
          variantName: prod.variants[0]?.name || 'Standard',
          quantity: qty,
          price: prod.price,
          image: prod.image
        }
      ],
      subtotal,
      shippingCost: shippingFee,
      discount: 0,
      total: subtotal + shippingFee,
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Ready to Ship',
      courier,
      serviceName: courier === 'J&T' ? 'J&T EZ Express' : courier === 'JNE' ? 'JNE Reguler' : courier === 'SICEPAT' ? 'SiCepat HALU' : 'GoSend Instant',
      trackingNumber: tracking,
      weightGrams: this.newShipWeightGrams(),
      notes: this.newShipNotes()
    };

    this.shippingService.addOrder(newOrder);
    this.closeNewShipmentModal();
    this.showToast(`Pengiriman baru ${newOrder.orderNumber} (${newOrder.trackingNumber}) berhasil dibuat! 🚚`);
  }
}
