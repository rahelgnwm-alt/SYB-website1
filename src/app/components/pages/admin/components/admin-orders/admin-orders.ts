import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShippingService } from '../../../../../services/shipping.service';
import { ShopifyOrder } from '../../../../../models/shipping.model';
import { JneApiService } from '../../../../../services/jne-api.service';
import { JntApiService } from '../../../../../services/jnt-api.service';
import { ThermalPdfService } from '../../../../../services/thermal-pdf.service';
import { JneAwbResult, JneConfig } from '../../../../../models/jne.model';
import { JntAwbResult, JntCancelOrderResult, JntConfig, JntTrackResult } from '../../../../../models/jnt.model';
import { resolveImgUrl } from '../../../../../data';

export interface OrderConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  isDanger?: boolean;
  orderNumber?: string;
  onConfirm: () => void;
}

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
  readonly jntApiService = inject(JntApiService);
  readonly thermalPdfService = inject(ThermalPdfService);

  // Search & Filter
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<'All' | 'Unprinted' | 'Packing' | 'Shipped' | 'Delivered'>('All');
  readonly courierFilter = signal<string>('All');

  // Modals state
  readonly isLabelModalOpen = signal<boolean>(false);
  readonly activeLabelOrder = signal<ShopifyOrder | null>(null);

  readonly isTrackingModalOpen = signal<boolean>(false);
  readonly activeTrackingOrder = signal<ShopifyOrder | null>(null);

  // JNE & J&T AWB State (Dual Courier Engine)
  readonly isAwbModalOpen = signal<boolean>(false);
  readonly activeAwbOrder = signal<ShopifyOrder | null>(null);
  readonly selectedAwbCourier = signal<'JNE' | 'J&T'>('JNE');
  readonly isGeneratingAwb = signal<boolean>(false);
  readonly awbResult = signal<JneAwbResult | null>(null);
  readonly jntAwbResult = signal<JntAwbResult | null>(null);
  readonly jntCancelResult = signal<JntCancelOrderResult | null>(null);
  readonly isCancellingJnt = signal<boolean>(false);
  readonly customAwbInput = signal<string>('');

  // Live J&T Tracking State
  readonly isTrackingJntApi = signal<boolean>(false);
  readonly jntTrackResult = signal<JntTrackResult | null>(null);

  // JNE & J&T Settings State
  readonly isJneSettingsOpen = signal<boolean>(false);
  readonly activeSettingsTab = signal<'JNE' | 'J&T'>('JNE');
  readonly jneConfig = this.jneApiService.config;
  readonly editableJneConfig = signal<JneConfig>(this.jneApiService.loadConfig());
  readonly jntConfig = this.jntApiService.config;
  readonly editableJntConfig = signal<JntConfig>(this.jntApiService.loadConfig());
  readonly originList = this.jneApiService.origins;

  // Bulk Selection & Bulk AWB / Thermal PDF State
  readonly selectedOrderIds = signal<string[]>([]);
  readonly isBulkModalOpen = signal<boolean>(false);
  readonly isBulkGenerating = signal<boolean>(false);
  readonly bulkProgressCurrent = signal<number>(0);
  readonly bulkProgressTotal = signal<number>(0);
  readonly bulkCustomerCourierFilter = signal<'ALL' | 'JNE' | 'J&T'>('ALL');
  readonly bulkModalCourierFilter = signal<'ALL' | 'JNE' | 'J&T'>('ALL');
  readonly bulkGeneratedOrders = signal<ShopifyOrder[]>([]);

  readonly selectedOrders = computed(() => {
    const idSet = new Set(this.selectedOrderIds());
    return this.shippingService.orders().filter((o) => idSet.has(o.id));
  });

  readonly selectedCount = computed(() => this.selectedOrders().length);

  readonly selectedJneCount = computed(() =>
    this.selectedOrders().filter((o) => o.courier === 'JNE').length
  );

  readonly selectedJntCount = computed(() =>
    this.selectedOrders().filter((o) => o.courier === 'J&T').length
  );

  readonly bulkFilteredSelectedOrders = computed(() => {
    const filter = this.bulkCustomerCourierFilter();
    const list = this.selectedOrders();
    if (filter === 'ALL') return list;
    return list.filter((o) => o.courier === filter);
  });

  readonly filteredBulkGeneratedOrders = computed(() => {
    const filter = this.bulkModalCourierFilter();
    const list = this.bulkGeneratedOrders();
    if (filter === 'ALL') return list;
    return list.filter((o) => o.courier === filter);
  });

  readonly bulkGeneratedJneCount = computed(() =>
    this.bulkGeneratedOrders().filter((o) => o.courier === 'JNE').length
  );

  readonly bulkGeneratedJntCount = computed(() =>
    this.bulkGeneratedOrders().filter((o) => o.courier === 'J&T').length
  );

  readonly unprintedOrdersList = computed(() => {
    const cr = this.courierFilter();
    return this.shippingService
      .orders()
      .filter(
        (o) =>
          this.shippingService.needsAwbOrPrint(o) &&
          o.fulfillmentStatus === 'Unfulfilled' &&
          (cr === 'All' || o.courier === cr)
      );
  });

  readonly jneOrdersCount = computed(() =>
    this.shippingService.orders().filter((o) => o.courier === 'JNE').length
  );

  readonly jntOrdersCount = computed(() =>
    this.shippingService.orders().filter((o) => o.courier === 'J&T').length
  );

  readonly isAllFilteredSelected = computed(() => {
    const visible = this.filteredOrders();
    if (visible.length === 0) return false;
    const idSet = new Set(this.selectedOrderIds());
    return visible.every((o) => idSet.has(o.id));
  });

  // Toast
  readonly toastMessage = signal<string | null>(null);
  readonly copiedCode = signal<string | null>(null);

  // Custom Luxury Confirmation Popup Dialog
  readonly confirmDialog = signal<OrderConfirmDialogState | null>(null);

  openConfirm(options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDanger?: boolean;
    orderNumber?: string;
    onConfirm: () => void;
  }): void {
    this.confirmDialog.set({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel || 'Ya, Hapus',
      cancelLabel: options.cancelLabel || 'Batal',
      isDanger: options.isDanger ?? true,
      orderNumber: options.orderNumber,
      onConfirm: () => {
        const action = options.onConfirm;
        this.closeConfirm();
        action();
      },
    });
  }

  closeConfirm(): void {
    this.confirmDialog.set(null);
  }

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

  readonly getImgUrl = resolveImgUrl;

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
    this.jntTrackResult.set(null);
    this.isTrackingModalOpen.set(true);
    if (order.courier === 'J&T' && order.trackingNumber && !order.trackingNumber.includes('PENDING')) {
      this.fetchJntLiveTrack(order.trackingNumber);
    }
  }

  closeTrackingModal(): void {
    this.isTrackingModalOpen.set(false);
    this.activeTrackingOrder.set(null);
    this.jntTrackResult.set(null);
  }

  async fetchJntLiveTrack(awb: string): Promise<void> {
    this.isTrackingJntApi.set(true);
    try {
      const res = await this.jntApiService.trackOrder(awb);
      this.jntTrackResult.set(res);
    } finally {
      this.isTrackingJntApi.set(false);
    }
  }

  deleteOrder(orderId: string): void {
    const order = this.shippingService.orders().find(o => o.id === orderId);
    this.openConfirm({
      title: 'Hapus Pesanan Ini?',
      message: `Apakah Anda yakin ingin menghapus pesanan ${order?.orderNumber || orderId} secara permanen? Data pesanan ini akan dihapus dari sistem.`,
      confirmLabel: 'Ya, Hapus Pesanan',
      cancelLabel: 'Batal',
      isDanger: true,
      orderNumber: order?.orderNumber,
      onConfirm: () => {
        this.shippingService.deleteOrder(orderId);
        this.showToast('Pesanan telah berhasil dihapus.');
      }
    });
  }

  // ==================== JNE & J&T AWB & SETTINGS ====================
  openAwbModal(order: ShopifyOrder, forceCourier?: 'JNE' | 'J&T'): void {
    this.activeAwbOrder.set(order);
    this.selectedAwbCourier.set(forceCourier || (order.courier === 'J&T' ? 'J&T' : 'JNE'));
    this.awbResult.set(null);
    this.jntAwbResult.set(null);
    this.jntCancelResult.set(null);
    this.customAwbInput.set('');
    this.isAwbModalOpen.set(true);
  }

  closeAwbModal(): void {
    this.isAwbModalOpen.set(false);
    this.activeAwbOrder.set(null);
    this.awbResult.set(null);
    this.jntAwbResult.set(null);
    this.jntCancelResult.set(null);
  }

  selectAwbCourier(courier: 'JNE' | 'J&T'): void {
    this.selectedAwbCourier.set(courier);
    this.awbResult.set(null);
    this.jntAwbResult.set(null);
    this.jntCancelResult.set(null);
  }

  openJneSettings(tab: 'JNE' | 'J&T' = 'JNE'): void {
    this.activeSettingsTab.set(tab);
    this.editableJneConfig.set({ ...this.jneApiService.config() });
    this.editableJntConfig.set({ ...this.jntApiService.config() });
    this.isJneSettingsOpen.set(true);
  }

  closeJneSettings(): void {
    this.isJneSettingsOpen.set(false);
  }

  saveJneSettings(): void {
    this.jneApiService.saveConfig(this.editableJneConfig());
    this.jntApiService.saveConfig(this.editableJntConfig());
    this.showToast('✅ Konfigurasi JNE & J&T API berhasil disimpan!');
    this.closeJneSettings();
  }

  switchJneEnv(env: 'live' | 'sandbox'): void {
    this.jneApiService.setEnvironment(env);
    this.editableJneConfig.set({ ...this.jneApiService.config() });
    this.showToast(`Mode JNE dialihkan ke: ${env.toUpperCase()}`);
  }

  switchJntEnv(env: 'testing' | 'live'): void {
    this.jntApiService.setEnvironment(env);
    this.editableJntConfig.set({ ...this.jntApiService.config() });
    this.showToast(`Mode J&T dialihkan ke: ${env.toUpperCase()}`);
  }

  async generateAwbForActiveCourier(order: ShopifyOrder): Promise<void> {
    if (this.selectedAwbCourier() === 'J&T') {
      await this.generateJntAwbForOrder(order);
    } else {
      await this.generateJneAwbForOrder(order);
    }
  }

  async generateJneAwbForOrder(order: ShopifyOrder): Promise<void> {
    this.isGeneratingAwb.set(true);
    this.awbResult.set(null);
    this.jntAwbResult.set(null);
    try {
      const result = await this.jneApiService.generateAwb(order);
      this.awbResult.set(result);
      if (result.success && result.cnoteNo) {
        this.shippingService.applyAwbToOrder(order.id, result.cnoteNo, true, 'JNE');
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

  async generateJntAwbForOrder(order: ShopifyOrder): Promise<void> {
    this.isGeneratingAwb.set(true);
    this.jntAwbResult.set(null);
    this.awbResult.set(null);
    this.jntCancelResult.set(null);
    try {
      const result = await this.jntApiService.generateAwb(order);
      this.jntAwbResult.set(result);
      if (result.success && result.awbNo) {
        this.shippingService.applyAwbToOrder(order.id, result.awbNo, true, 'J&T');
        this.showToast(`⚡ Resi J&T resmi ${result.awbNo} berhasil diterbitkan!`);
        this.syncOrderSignals(order.id);
      } else {
        this.showToast(`⚠️ ${result.message}`);
      }
    } catch (err: any) {
      this.jntAwbResult.set({
        success: false,
        message: err?.message || 'Gagal memanggil API J&T.'
      });
      this.showToast('Koneksi API J&T gagal.');
    } finally {
      this.isGeneratingAwb.set(false);
    }
  }

  async cancelJntOrderForOrder(order: ShopifyOrder): Promise<void> {
    this.isCancellingJnt.set(true);
    this.jntCancelResult.set(null);
    try {
      const result = await this.jntApiService.cancelOrder(order.orderNumber, 'Dibatalkan oleh Admin SYB Official Store');
      this.jntCancelResult.set(result);
      if (result.success) {
        this.shippingService.updateOrderTracking(order.id, 'JT-PENDING', 'J&T');
        this.shippingService.updateOrderStatus(order.id, 'Unfulfilled', false);
        this.showToast(`🗑️ Order J&T ${order.orderNumber} berhasil dibatalkan via API Cancellation.`);
        this.syncOrderSignals(order.id);
      } else {
        this.showToast(`⚠️ ${result.message}`);
      }
    } finally {
      this.isCancellingJnt.set(false);
    }
  }

  applyFallbackAwb(order: ShopifyOrder): void {
    const isJnt = this.selectedAwbCourier() === 'J&T';
    const fallbackCode = isJnt
      ? this.jntApiService.generateFallbackAwb()
      : this.jneApiService.generateFallbackAwb();
    this.shippingService.applyAwbToOrder(order.id, fallbackCode, true, isJnt ? 'J&T' : 'JNE');
    this.showToast(`Resi ${isJnt ? 'J&T' : 'JNE'} Standar ${fallbackCode} berhasil diterapkan! 📦`);
    this.syncOrderSignals(order.id);
  }

  applyCustomAwb(order: ShopifyOrder): void {
    const val = this.customAwbInput().trim();
    if (!val) {
      this.showToast('Nomor resi tidak boleh kosong.');
      return;
    }
    this.shippingService.applyAwbToOrder(order.id, val, true, this.selectedAwbCourier());
    this.showToast(`Resi ${val} berhasil disimpan!`);
    this.syncOrderSignals(order.id);
  }

  downloadSingleThermalPdf(order: ShopifyOrder): void {
    this.shippingService.markLabelPrinted(order.id);
    this.syncOrderSignals(order.id);
    const updated = this.activeLabelOrder() || order;
    const fileName = this.thermalPdfService.downloadBulkThermalPdf([updated], `SYB-Thermal-${updated.orderNumber.replace('#', '')}.pdf`);
    this.showToast(`📥 File PDF Thermal "${fileName}" berhasil diunduh!`);
  }

  // ==================== BULK SELECTION, BULK AWB & THERMAL PDF ====================
  isOrderSelected(orderId: string): boolean {
    return this.selectedOrderIds().includes(orderId);
  }

  toggleOrderSelection(orderId: string, event?: Event): void {
    event?.stopPropagation();
    this.selectedOrderIds.update((list) =>
      list.includes(orderId) ? list.filter((id) => id !== orderId) : [...list, orderId]
    );
  }

  toggleSelectAllFiltered(): void {
    const visibleIds = this.filteredOrders().map((o) => o.id);
    if (visibleIds.length === 0) return;

    if (this.isAllFilteredSelected()) {
      const removeSet = new Set(visibleIds);
      this.selectedOrderIds.update((list) => list.filter((id) => !removeSet.has(id)));
    } else {
      this.selectedOrderIds.update((list) => Array.from(new Set([...list, ...visibleIds])));
    }
  }

  selectAllUnprintedOrders(customerCourier?: 'All' | 'JNE' | 'J&T'): void {
    if (customerCourier) {
      this.courierFilter.set(customerCourier);
      this.bulkCustomerCourierFilter.set(customerCourier === 'All' ? 'ALL' : customerCourier);
    }
    const unprinted = this.unprintedOrdersList();
    if (unprinted.length === 0) {
      this.showToast('Semua pesanan pada filter kurir pilihan customer ini sudah memiliki resi & sudah dicetak.');
      return;
    }
    this.statusFilter.set('Unprinted');
    this.selectedOrderIds.set(unprinted.map((o) => o.id));
    const courierLabel = this.courierFilter() === 'All' ? 'Semua Kurir' : this.courierFilter();
    this.showToast(`☑️ ${unprinted.length} pesanan (${courierLabel}) yang belum dicetak / belum ada AWB berhasil dipilih!`);
  }

  setCustomerCourierFilter(courier: string): void {
    this.courierFilter.set(courier);
    if (courier === 'JNE' || courier === 'J&T') {
      this.bulkCustomerCourierFilter.set(courier);
    } else {
      this.bulkCustomerCourierFilter.set('ALL');
    }
  }

  clearSelection(): void {
    this.selectedOrderIds.set([]);
    this.bulkCustomerCourierFilter.set('ALL');
  }

  async bulkGenerateSelectedAwbs(): Promise<void> {
    let targets = this.bulkFilteredSelectedOrders();
    if (targets.length === 0) {
      targets = this.unprintedOrdersList();
      if (targets.length === 0) {
        this.showToast('Tidak ada pesanan pada filter kurir pilihan customer yang dipilih.');
        return;
      }
      this.selectedOrderIds.set(targets.map((o) => o.id));
    }

    this.isBulkModalOpen.set(true);
    this.isBulkGenerating.set(true);
    this.bulkProgressCurrent.set(0);
    this.bulkProgressTotal.set(targets.length);
    this.bulkModalCourierFilter.set(this.bulkCustomerCourierFilter());
    this.bulkGeneratedOrders.set([]);

    const targetIds: string[] = [];

    for (let i = 0; i < targets.length; i++) {
      const ord = targets[i];
      targetIds.push(ord.id);
      // Strictly use the courier chosen by the customer on the order
      const courierToUse: 'JNE' | 'J&T' = ord.courier === 'J&T' ? 'J&T' : 'JNE';

      let awbCode = ord.trackingNumber;
      const needsNewAwb = this.shippingService.needsAwbOrPrint(ord);

      if (needsNewAwb) {
        if (courierToUse === 'J&T') {
          try {
            const res = await this.jntApiService.generateAwb(ord);
            awbCode = res.success && res.awbNo ? res.awbNo : this.jntApiService.generateFallbackAwb();
          } catch {
            awbCode = this.jntApiService.generateFallbackAwb();
          }
        } else {
          try {
            const res = await this.jneApiService.generateAwb(ord);
            awbCode = res.success && res.cnoteNo ? res.cnoteNo : this.jneApiService.generateFallbackAwb();
          } catch {
            awbCode = this.jneApiService.generateFallbackAwb();
          }
        }
      }

      this.shippingService.applyAwbToOrder(ord.id, awbCode, true, courierToUse);
      this.bulkProgressCurrent.set(i + 1);
    }

    const idSet = new Set(targetIds);
    const updatedOrders = this.shippingService.orders().filter((o) => idSet.has(o.id));
    this.bulkGeneratedOrders.set(updatedOrders);
    this.isBulkGenerating.set(false);
    this.showToast(`🎉 ${updatedOrders.length} AWB berhasil di-generate sesuai kurir pilihan customer! Siap download PDF Thermal.`);
  }

  openBulkPdfModalForSelected(): void {
    const targets = this.bulkFilteredSelectedOrders();
    if (targets.length === 0) {
      this.showToast('Pilih pesanan terlebih dahulu.');
      return;
    }
    this.bulkModalCourierFilter.set(this.bulkCustomerCourierFilter());
    this.bulkGeneratedOrders.set(targets);
    this.isBulkGenerating.set(false);
    this.isBulkModalOpen.set(true);
  }

  closeBulkModal(): void {
    this.isBulkModalOpen.set(false);
  }

  downloadBulkThermalPdf(): void {
    const list = this.filteredBulkGeneratedOrders();
    if (list.length === 0) return;
    const filterSuffix = this.bulkModalCourierFilter() === 'ALL' ? '' : `-${this.bulkModalCourierFilter().replace('&', 'N')}`;
    const fileName = this.thermalPdfService.downloadBulkThermalPdf(
      list,
      `SYB-Thermal-AWB${filterSuffix}-${list.length}Resi.pdf`
    );
    this.showToast(`📥 PDF Thermal (${list.length} halaman 10x15 cm) "${fileName}" berhasil diunduh!`);
  }

  printBulkThermalLabels(): void {
    const list = this.filteredBulkGeneratedOrders();
    if (list.length === 0) return;
    this.thermalPdfService.printBulkThermalLabels(list);
    this.showToast(`🖨️ Membuka dialog cetak printer thermal (${list.length} label 10x15 cm)...`);
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
