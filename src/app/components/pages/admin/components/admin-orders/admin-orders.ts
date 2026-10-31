import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShippingService } from '../../../../../services/shipping.service';
import { ShopifyOrder } from '../../../../../models/shipping.model';

@Component({
  selector: 'app-admin-orders',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrdersComponent {
  readonly shippingService = inject(ShippingService);

  // Search & Filter
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<'All' | 'Unfulfilled' | 'Ready to Ship' | 'Shipped' | 'Delivered'>('All');
  readonly courierFilter = signal<string>('All');

  // Modals state
  readonly isLabelModalOpen = signal<boolean>(false);
  readonly activeLabelOrder = signal<ShopifyOrder | null>(null);

  readonly isTrackingModalOpen = signal<boolean>(false);
  readonly activeTrackingOrder = signal<ShopifyOrder | null>(null);

  // Toast
  readonly toastMessage = signal<string | null>(null);
  readonly copiedCode = signal<string | null>(null);

  // Computeds
  readonly totalOrders = computed(() => this.shippingService.orders().length);
  readonly unfulfilledCount = computed(() => this.shippingService.orders().filter(o => o.fulfillmentStatus === 'Unfulfilled').length);
  readonly readyCount = computed(() => this.shippingService.orders().filter(o => o.fulfillmentStatus === 'Ready to Ship').length);
  readonly shippedCount = computed(() => this.shippingService.orders().filter(o => o.fulfillmentStatus === 'Shipped').length);
  readonly deliveredCount = computed(() => this.shippingService.orders().filter(o => o.fulfillmentStatus === 'Delivered').length);

  readonly totalRevenue = computed(() =>
    this.shippingService.orders().reduce((acc, o) => acc + (o.paymentStatus === 'Paid' ? o.total : 0), 0)
  );

  readonly filteredOrders = computed(() => {
    const list = this.shippingService.orders();
    const q = this.searchQuery().toLowerCase().trim();
    const st = this.statusFilter();
    const cr = this.courierFilter();

    return list.filter((o) => {
      const matchStatus = st === 'All' || o.fulfillmentStatus === st;
      const matchCourier = cr === 'All' || o.courier === cr;
      const matchQuery =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.customerEmail || '').toLowerCase().includes(q) ||
        (o.trackingNumber || '').toLowerCase().includes(q) ||
        o.shippingAddress.city.toLowerCase().includes(q);

      return matchStatus && matchCourier && matchQuery;
    });
  });

  readonly activeTrackingMilestones = computed(() => {
    const order = this.activeTrackingOrder();
    if (!order) return [];
    return this.shippingService.getTrackingMilestones(order);
  });

  getImgUrl(path?: string): string {
    if (!path) return '/products/red-jelly-serum.jpg';
    if (path.startsWith('http') || path.startsWith('/')) return path;
    return '/' + path;
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

  updateFulfillmentStatus(orderId: string, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as ShopifyOrder['fulfillmentStatus'];
    this.shippingService.updateOrderStatus(orderId, newStatus);
    this.showToast(`Status pesanan diperbarui menjadi "${newStatus}"!`);
  }

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

  openTrackingModal(order: ShopifyOrder): void {
    this.activeTrackingOrder.set(order);
    this.isTrackingModalOpen.set(true);
  }

  closeTrackingModal(): void {
    this.isTrackingModalOpen.set(false);
    this.activeTrackingOrder.set(null);
  }

  deleteOrder(orderId: string): void {
    if (confirm('Hapus pesanan ini secara permanen?')) {
      this.shippingService.deleteOrder(orderId);
      this.showToast('Pesanan telah dihapus.');
    }
  }
}
