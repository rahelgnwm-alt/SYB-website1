import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShippingService } from '../../../../../services/shipping.service';
import { ShopifyOrder } from '../../../../../models/shipping.model';
import { JneApiService } from '../../../../../services/jne-api.service';
import { JneAwbResult, JneConfig } from '../../../../../models/jne.model';

@Component({
  selector: 'app-admin-orders',
  imports: [DecimalPipe, UpperCasePipe, FormsModule],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrdersComponent {
  readonly shippingService = inject(ShippingService);
  readonly jneApiService = inject(JneApiService);

  // Search & Filter
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<'All' | 'Unprinted' | 'Packing' | 'Shipped' | 'Delivered'>('All');
  readonly courierFilter = signal<string>('All');

  // Modals state
  readonly isLabelModalOpen = signal<boolean>(false);
  readonly activeLabelOrder = signal<ShopifyOrder | null>(null);

  readonly isTrackingModalOpen = signal<boolean>(false);
  readonly activeTrackingOrder = signal<ShopifyOrder | null>(null);

  // JNE AWB State
  readonly isAwbModalOpen = signal<boolean>(false);
  readonly activeAwbOrder = signal<ShopifyOrder | null>(null);
  readonly isGeneratingAwb = signal<boolean>(false);
  readonly awbResult = signal<JneAwbResult | null>(null);
  readonly customAwbInput = signal<string>('');

  // JNE Settings State
  readonly isJneSettingsOpen = signal<boolean>(false);
  readonly jneConfig = this.jneApiService.config;
  readonly editableJneConfig = signal<JneConfig>(this.jneApiService.loadConfig());

  // Toast
  readonly toastMessage = signal<string | null>(null);
  readonly copiedCode = signal<string | null>(null);

  // Computeds
  readonly totalOrders = computed(() => this.shippingService.orders().length);
  readonly unprintedCount = computed(() =>
    this.shippingService.orders().filter(o => !o.isLabelPrinted && o.fulfillmentStatus === 'Unfulfilled').length
  );
  readonly packingCount = computed(() =>
    this.shippingService.orders().filter(o => !!o.isLabelPrinted && o.fulfillmentStatus === 'Unfulfilled').length
  );
  readonly shippedCount = computed(() =>
    this.shippingService.orders().filter(o => o.fulfillmentStatus === 'Shipped').length
  );
  readonly deliveredCount = computed(() =>
    this.shippingService.orders().filter(o => o.fulfillmentStatus === 'Delivered').length
  );

  readonly totalRevenue = computed(() =>
    this.shippingService.orders().reduce((acc, o) => acc + (o.paymentStatus === 'Paid' ? o.total : 0), 0)
  );

  readonly filteredOrders = computed(() => {
    const list = this.shippingService.orders();
    const q = this.searchQuery().toLowerCase().trim();
    const st = this.statusFilter();
    const cr = this.courierFilter();

    return list.filter((o) => {
      let matchStatus = false;
      if (st === 'All') {
        matchStatus = true;
      } else if (st === 'Unprinted') {
        matchStatus = !o.isLabelPrinted && o.fulfillmentStatus === 'Unfulfilled';
      } else if (st === 'Packing') {
        matchStatus = !!o.isLabelPrinted && o.fulfillmentStatus === 'Unfulfilled';
      } else {
        matchStatus = o.fulfillmentStatus === st;
      }

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

  getOrderStatusKey(ord: ShopifyOrder): string {
    if (ord.fulfillmentStatus === 'Unfulfilled') {
      return ord.isLabelPrinted ? 'Packing' : 'Unprinted';
    }
    if ((ord.fulfillmentStatus as string) === 'Ready to Ship') {
      return 'Packing';
    }
    return ord.fulfillmentStatus;
  }

  getImgUrl(path?: string): string {
    if (!path) return 'products/red-jelly-serum.jpg';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return path.replace(/^\//, '');
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
    const val = select.value;

    if (val === 'Unprinted') {
      this.shippingService.updateOrderStatus(orderId, 'Unfulfilled', false);
      this.showToast('Status pesanan: Resi Belum Dicetak 📄');
    } else if (val === 'Packing') {
      this.shippingService.updateOrderStatus(orderId, 'Unfulfilled', true);
      this.showToast('Status pesanan: Perlu Dikemas (Fase Packing) ⏳');
    } else {
      const newStatus = val as ShopifyOrder['fulfillmentStatus'];
      this.shippingService.updateOrderStatus(orderId, newStatus, true);
      this.showToast(`Status pesanan diperbarui menjadi "${newStatus}"!`);
    }
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
    const order = this.activeLabelOrder();
    if (order) {
      this.shippingService.markLabelPrinted(order.id);
      this.showToast(`Resi ${order.orderNumber} berhasil dicetak! Paket masuk ke fase "Perlu Dikemas" (Fase Packing) 📦`);
    } else {
      this.showToast('Mencetak resi pengiriman thermal...');
    }
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

  // ==================== JNE AWB & SETTINGS ====================
  openAwbModal(order: ShopifyOrder): void {
    this.activeAwbOrder.set(order);
    this.awbResult.set(null);
    this.customAwbInput.set('');
    this.isAwbModalOpen.set(true);
  }

  closeAwbModal(): void {
    this.isAwbModalOpen.set(false);
    this.activeAwbOrder.set(null);
    this.awbResult.set(null);
  }

  openJneSettings(): void {
    this.editableJneConfig.set({ ...this.jneApiService.config() });
    this.isJneSettingsOpen.set(true);
  }

  closeJneSettings(): void {
    this.isJneSettingsOpen.set(false);
  }

  saveJneSettings(): void {
    this.jneApiService.saveConfig(this.editableJneConfig());
    this.showToast('✅ Konfigurasi JNE API berhasil disimpan!');
    this.closeJneSettings();
  }

  switchJneEnv(env: 'live' | 'sandbox'): void {
    this.jneApiService.setEnvironment(env);
    this.editableJneConfig.set({ ...this.jneApiService.config() });
    this.showToast(`Mode JNE dialihkan ke: ${env.toUpperCase()}`);
  }

  async generateJneAwbForOrder(order: ShopifyOrder): Promise<void> {
    this.isGeneratingAwb.set(true);
    this.awbResult.set(null);
    try {
      const result = await this.jneApiService.generateAwb(order);
      this.awbResult.set(result);
      if (result.success && result.cnoteNo) {
        this.shippingService.applyAwbToOrder(order.id, result.cnoteNo, true);
        this.showToast(`🎉 Resi JNE resmi ${result.cnoteNo} berhasil diterbitkan!`);
        this.syncOrderSignals(order.id);
      } else {
        this.showToast(`⚠️ ${result.message}`);
      }
    } catch (err: any) {
      this.awbResult.set({
        success: false,
        message: err?.message || 'Gagal memanggil API JNE.'
      });
      this.showToast('Koneksi API JNE gagal.');
    } finally {
      this.isGeneratingAwb.set(false);
    }
  }

  applyFallbackAwb(order: ShopifyOrder): void {
    const fallbackCode = this.jneApiService.generateFallbackAwb();
    this.shippingService.applyAwbToOrder(order.id, fallbackCode, true);
    this.showToast(`Resi JNE Standar ${fallbackCode} berhasil diterapkan! 📦`);
    this.syncOrderSignals(order.id);
  }

  applyCustomAwb(order: ShopifyOrder): void {
    const val = this.customAwbInput().trim();
    if (!val) {
      this.showToast('Nomor resi tidak boleh kosong.');
      return;
    }
    this.shippingService.applyAwbToOrder(order.id, val, true);
    this.showToast(`Resi ${val} berhasil disimpan!`);
    this.syncOrderSignals(order.id);
  }

  private syncOrderSignals(orderId: string): void {
    const fresh = this.shippingService.orders().find(o => o.id === orderId);
    if (fresh) {
      if (this.activeAwbOrder()?.id === orderId) this.activeAwbOrder.set(fresh);
      if (this.activeLabelOrder()?.id === orderId) this.activeLabelOrder.set(fresh);
      if (this.activeTrackingOrder()?.id === orderId) this.activeTrackingOrder.set(fresh);
    }
  }
}
