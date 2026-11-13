import { Injectable } from '@angular/core';
import { ShopifyOrder } from '../models/shipping.model';

/**
 * Pure TypeScript Multi-Page Thermal Label PDF Generator (100mm x 150mm / A6 Standard)
 * Generates a vector PDF 1.4 document with 1 thermal waybill per page.
 */
@Injectable({
  providedIn: 'root'
})
export class ThermalPdfService {
  // 100mm x 150mm in PostScript points (1 mm = 2.83464567 pt)
  private readonly PAGE_W = 283.46;
  private readonly PAGE_H = 425.20;

  /**
   * Build a multi-page PDF Blob for the provided orders and trigger a browser download.
   */
  downloadBulkThermalPdf(orders: ShopifyOrder[], filename?: string): string {
    const pdfBytes = this.generatePdfBytes(orders);
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const finalName = filename || `SYB-Thermal-AWB-${orders.length}-Resi-${dateStr}.pdf`;

    if (typeof document !== 'undefined') {
      const a = document.createElement('a');
      a.href = url;
      a.download = finalName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    return finalName;
  }

  /**
   * Open a dedicated thermal printer window formatted at 100mm x 150mm per page
   * and trigger the native print dialog.
   */
  printBulkThermalLabels(orders: ShopifyOrder[]): void {
    if (typeof window === 'undefined' || orders.length === 0) return;

    const pagesHtml = orders.map((ord) => this.buildSingleThermalHtml(ord)).join('\n');
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Cetak Resi Thermal 10x15 cm (${orders.length} Pesanan) - SYB Official</title>
  <style>
    @page {
      size: 100mm 150mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #e5e7eb;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      color: #000000;
    }
    .print-toolbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: #111827;
      color: #ffffff;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .print-toolbar button {
      background: #10b981;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 13px;
    }
    .sheets-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }
    .thermal-sheet {
      width: 100mm;
      height: 150mm;
      background: #ffffff;
      border: 2px solid #000000;
      padding: 4mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
    }
    .thermal-sheet:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .th-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000;
      padding-bottom: 2.5mm;
    }
    .th-courier {
      font-size: 18pt;
      font-weight: 900;
      line-height: 1;
    }
    .th-service {
      font-size: 8pt;
      font-weight: 700;
      margin-top: 1mm;
    }
    .th-route {
      border: 1.5px solid #000;
      padding: 1.5mm 2.5mm;
      text-align: right;
      font-weight: 900;
      font-size: 9pt;
    }
    .th-barcode-box {
      text-align: center;
      border-bottom: 2px solid #000;
      padding: 2.5mm 0;
    }
    .th-bars {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1.5px;
      height: 14mm;
      margin-bottom: 1.5mm;
    }
    .th-awb-code {
      font-family: 'Courier New', monospace;
      font-size: 12pt;
      font-weight: 900;
      letter-spacing: 1.5px;
    }
    .th-addr-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 2.5mm;
      border-bottom: 2px solid #000;
      padding: 2.5mm 0;
      font-size: 7.5pt;
    }
    .th-addr-col {
      display: flex;
      flex-direction: column;
      gap: 1mm;
    }
    .th-addr-col.sender {
      border-right: 1px dashed #000;
      padding-right: 2mm;
    }
    .th-role {
      font-size: 6.5pt;
      font-weight: 900;
      text-transform: uppercase;
      color: #333;
    }
    .th-name {
      font-size: 8.5pt;
      font-weight: 900;
    }
    .th-specs {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      border-bottom: 2px solid #000;
      padding: 2mm 0;
      font-size: 7.5pt;
      text-align: center;
    }
    .th-items {
      flex: 1;
      padding: 2mm 0;
      border-bottom: 1.5px solid #000;
      font-size: 7.5pt;
      overflow: hidden;
    }
    .th-items-title {
      font-weight: 900;
      margin-bottom: 1mm;
      text-transform: uppercase;
      font-size: 7pt;
    }
    .th-item-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.8mm;
    }
    .th-foot {
      padding-top: 1.5mm;
      display: flex;
      justify-content: space-between;
      font-size: 6.5pt;
      font-weight: 800;
    }
    @media print {
      html, body {
        background: #ffffff;
      }
      .print-toolbar {
        display: none !important;
      }
      .sheets-container {
        padding: 0;
        gap: 0;
      }
      .thermal-sheet {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="print-toolbar">
    <span>🖨️ Siap Cetak Thermal 100x150mm (${orders.length} Label Resi)</span>
    <button onclick="window.print()">Cetak Sekarang (Print)</button>
  </div>
  <div class="sheets-container">
    ${pagesHtml}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=520,height=760');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
    } else {
      window.print();
    }
  }

  private buildSingleThermalHtml(ord: ShopifyOrder): string {
    const destCode = (ord.shippingAddress?.city || 'JKT').slice(0, 3).toUpperCase();
    const barsHtml = this.buildBarcodeBarsWidths(ord.trackingNumber || ord.orderNumber)
      .map((w, idx) => `<span style="display:inline-block;height:100%;width:${w}px;background:${idx % 2 === 0 ? '#000' : 'transparent'}"></span>`)
      .join('');

    const itemsHtml = (ord.items || [])
      .map(
        (it) => `<div class="th-item-row">
          <span>• ${this.escapeHtml(it.title)} (${this.escapeHtml(it.variantName)})</span>
          <strong>x${it.quantity}</strong>
        </div>`
      )
      .join('');

    return `<div class="thermal-sheet">
      <div class="th-head">
        <div>
          <div class="th-courier">${this.escapeHtml(ord.courier)}</div>
          <div class="th-service">${this.escapeHtml(ord.serviceName)}</div>
        </div>
        <div class="th-route">
          <div>SUB &rarr; ${this.escapeHtml(destCode)}</div>
          <div style="font-size:7pt;">DC-${this.escapeHtml(ord.shippingAddress?.postalCode || '10000')}</div>
        </div>
      </div>
      <div class="th-barcode-box">
        <div class="th-bars">${barsHtml}</div>
        <div class="th-awb-code">${this.escapeHtml(ord.trackingNumber)}</div>
      </div>
      <div class="th-addr-grid">
        <div class="th-addr-col sender">
          <span class="th-role">Pengirim (Sender):</span>
          <span class="th-name">SYBofficial Store (Pusat)</span>
          <span>Kawasan Rungkut Industri Blok C-12, Surabaya 60293</span>
          <span>Telp: 0812-3333-6909</span>
        </div>
        <div class="th-addr-col">
          <span class="th-role">Penerima (Receiver):</span>
          <span class="th-name">${this.escapeHtml(ord.customerName)}</span>
          <span>${this.escapeHtml(ord.shippingAddress?.street || '')}, ${this.escapeHtml(ord.shippingAddress?.city || '')}, ${this.escapeHtml(ord.shippingAddress?.province || '')}</span>
          <strong>KODE POS: ${this.escapeHtml(ord.shippingAddress?.postalCode || '')}</strong>
          <span>Telp: ${this.escapeHtml(ord.customerPhone || '')}</span>
        </div>
      </div>
      <div class="th-specs">
        <div><span>Berat:</span><br/><strong>${ord.weightGrams || 500} gr</strong></div>
        <div><span>Pembayaran:</span><br/><strong>${this.escapeHtml(ord.paymentStatus)}</strong></div>
        <div><span>No. Order:</span><br/><strong>${this.escapeHtml(ord.orderNumber)}</strong></div>
      </div>
      <div class="th-items">
        <div class="th-items-title">Daftar Isi Paket (${ord.items.length} SKU):</div>
        ${itemsHtml}
      </div>
      <div class="th-foot">
        <span>PT SYB INOVASI NUSANTARA</span>
        <span>THERMAL 100x150MM</span>
      </div>
    </div>`;
  }

  /**
   * Generate raw PDF 1.4 binary Uint8Array with 1 page per order (100mm x 150mm).
   */
  generatePdfBytes(orders: ShopifyOrder[]): Uint8Array {
    const safeOrders = orders.length > 0 ? orders : [];
    const objects: string[] = [];

    // Object 1: Catalog
    // Object 2: Pages
    // Object 3: Font Helvetica (F1)
    // Object 4: Font Helvetica-Bold (F2)
    // Then for each page i:
    //   Object (5 + i * 2): Page dictionary
    //   Object (6 + i * 2): Page content stream

    const pageObjIds: number[] = [];
    for (let i = 0; i < safeOrders.length; i++) {
      pageObjIds.push(5 + i * 2);
    }

    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
    objects.push(
      `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${safeOrders.length} >>\nendobj`
    );
    objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj');
    objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj');

    for (let i = 0; i < safeOrders.length; i++) {
      const pageObjId = 5 + i * 2;
      const contentObjId = 6 + i * 2;
      const stream = this.buildPageContentStream(safeOrders[i], i + 1, safeOrders.length);

      objects.push(
        `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.PAGE_W.toFixed(2)} ${this.PAGE_H.toFixed(2)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj`
      );
      objects.push(
        `${contentObjId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`
      );
    }

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [0];

    for (const obj of objects) {
      offsets.push(pdf.length);
      pdf += obj + '\n';
    }

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i < offsets.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i++) {
      bytes[i] = pdf.charCodeAt(i) & 0xff;
    }
    return bytes;
  }

  private buildPageContentStream(ord: ShopifyOrder, pageNum: number, totalPages: number): string {
    const ops: string[] = [];
    const M = 12; // 12pt (~4.2mm) margin
    const W = this.PAGE_W - M * 2;
    const H = this.PAGE_H - M * 2;

    // Outer thick border
    ops.push('1.5 w');
    ops.push('0 0 0 RG');
    ops.push(`${M} ${M} ${W.toFixed(2)} ${H.toFixed(2)} re S`);

    // 1. Header Section (top y = 413.2 down to 366)
    const yHeadBottom = 366;
    ops.push(`1.2 w ${M} ${yHeadBottom} m ${(M + W).toFixed(2)} ${yHeadBottom} l S`);

    // Courier Name (Huge Bold)
    ops.push(this.textOp('F2', 20, M + 8, 392, ord.courier || 'JNE'));
    ops.push(this.textOp('F2', 8.5, M + 8, 376, (ord.serviceName || 'REGULER').slice(0, 28)));

    // Routing Box on Top Right
    const dest3 = (ord.shippingAddress?.city || 'JKT').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'JKT';
    const zip = (ord.shippingAddress?.postalCode || '10000').slice(0, 6);
    ops.push(`1 w ${(M + W - 92).toFixed(2)} 373 84 33 re S`);
    ops.push(this.textOp('F2', 11, M + W - 86, 392, `SUB -> ${dest3}`));
    ops.push(this.textOp('F1', 8, M + W - 86, 379, `DC-${zip}`));

    // 2. Barcode Section (y = 366 down to 298)
    const yBarcodeBottom = 298;
    ops.push(`1.2 w ${M} ${yBarcodeBottom} m ${(M + W).toFixed(2)} ${yBarcodeBottom} l S`);

    // Draw Barcode Bars
    const awb = ord.trackingNumber || ord.orderNumber;
    const barWidths = this.buildBarcodeBarsWidths(awb);
    const totalBarW = barWidths.reduce((a, b) => a + b, 0);
    let curX = M + (W - totalBarW) / 2;
    ops.push('0 0 0 rg');
    for (let i = 0; i < barWidths.length; i++) {
      const bw = barWidths[i];
      if (i % 2 === 0) {
        ops.push(`${curX.toFixed(2)} 322 ${bw.toFixed(2)} 36 re f`);
      }
      curX += bw;
    }

    // Center AWB Text under barcode
    const awbTextX = M + Math.max(20, (W - awb.length * 7.2) / 2);
    ops.push(this.textOp('F2', 12, awbTextX, 306, awb));

    // 3. Sender & Receiver Address Section (y = 298 down to 192)
    const yAddrBottom = 192;
    const midX = M + W * 0.44;
    ops.push(`1.2 w ${M} ${yAddrBottom} m ${(M + W).toFixed(2)} ${yAddrBottom} l S`);
    ops.push(`0.8 w ${midX.toFixed(2)} ${yAddrBottom} m ${midX.toFixed(2)} ${yBarcodeBottom} l S`);

    // Sender Column (Left)
    ops.push(this.textOp('F2', 7, M + 6, 286, 'PENGIRIM (SENDER):'));
    ops.push(this.textOp('F2', 8.5, M + 6, 274, 'SYBofficial Store'));
    ops.push(this.textOp('F1', 7.2, M + 6, 263, 'Rungkut Industri Blok C-12'));
    ops.push(this.textOp('F1', 7.2, M + 6, 253, 'Surabaya, Jawa Timur'));
    ops.push(this.textOp('F2', 7.5, M + 6, 242, 'KODE POS: 60293'));
    ops.push(this.textOp('F1', 7.2, M + 6, 231, 'Telp: 0812-3333-6909'));
    if (ord.hasPreOrder) {
      ops.push(this.textOp('F2', 7.2, M + 6, 202, `PRE-ORDER (${ord.maxPreOrderDays || 7} HARI)`));
    }

    // Receiver Column (Right)
    const rx = midX + 6;
    ops.push(this.textOp('F2', 7, rx, 286, 'PENERIMA (RECEIVER):'));
    ops.push(this.textOp('F2', 9, rx, 274, (ord.customerName || 'Pelanggan').slice(0, 24)));

    const streetLines = this.wrapText(ord.shippingAddress?.street || '-', 26);
    let ry = 263;
    for (const line of streetLines.slice(0, 2)) {
      ops.push(this.textOp('F1', 7.5, rx, ry, line));
      ry -= 10;
    }
    const cityProv = `${ord.shippingAddress?.city || ''}, ${ord.shippingAddress?.province || ''}`;
    for (const line of this.wrapText(cityProv, 26).slice(0, 2)) {
      ops.push(this.textOp('F1', 7.5, rx, ry, line));
      ry -= 10;
    }
    ops.push(this.textOp('F2', 8, rx, Math.max(212, ry), `KODE POS: ${ord.shippingAddress?.postalCode || '-'}`));
    ops.push(this.textOp('F2', 7.5, rx, Math.max(200, ry - 11), `Telp: ${ord.customerPhone || '-'}`));

    // 4. Package Specs Row (y = 192 down to 162)
    const ySpecsBottom = 162;
    ops.push(`1.2 w ${M} ${ySpecsBottom} m ${(M + W).toFixed(2)} ${ySpecsBottom} l S`);
    const col1 = M + W * 0.33;
    const col2 = M + W * 0.66;
    ops.push(`0.8 w ${col1.toFixed(2)} ${ySpecsBottom} m ${col1.toFixed(2)} ${yAddrBottom} l S`);
    ops.push(`0.8 w ${col2.toFixed(2)} ${ySpecsBottom} m ${col2.toFixed(2)} ${yAddrBottom} l S`);

    ops.push(this.textOp('F1', 6.8, M + 6, 181, 'Berat Paket:'));
    ops.push(this.textOp('F2', 8.5, M + 6, 169, `${ord.weightGrams || 500} gr`));

    ops.push(this.textOp('F1', 6.8, col1 + 6, 181, 'Status Bayar:'));
    ops.push(this.textOp('F2', 8.5, col1 + 6, 169, `${ord.paymentStatus || 'Paid'} (NON-COD)`));

    ops.push(this.textOp('F1', 6.8, col2 + 6, 181, 'No. Referensi:'));
    ops.push(this.textOp('F2', 8.5, col2 + 6, 169, ord.orderNumber));

    // 5. Goods / Items List Section (y = 162 down to 34)
    const yItemsBottom = 34;
    ops.push(`1.2 w ${M} ${yItemsBottom} m ${(M + W).toFixed(2)} ${yItemsBottom} l S`);
    ops.push(this.textOp('F2', 7.8, M + 6, 150, `DAFTAR ISI PAKET (${(ord.items || []).length} SKU):`));

    let iy = 137;
    for (const item of (ord.items || []).slice(0, 6)) {
      const titleLine = `- ${item.title} (${item.variantName})`.slice(0, 42);
      ops.push(this.textOp('F1', 7.5, M + 6, iy, titleLine));
      ops.push(this.textOp('F2', 7.8, M + W - 40, iy, `Qty: ${item.quantity}`));
      iy -= 13;
    }

    // 6. Footer Section (y = 34 down to 12)
    ops.push(this.textOp('F2', 6.8, M + 6, 21, 'PT SYB INOVASI NUSANTARA - OFFICIAL WAYBILL'));
    ops.push(this.textOp('F2', 6.8, M + W - 72, 21, `HAL ${pageNum} / ${totalPages} (10x15cm)`));

    return ops.join('\n');
  }

  private textOp(font: 'F1' | 'F2', size: number, x: number, y: number, text: string): string {
    const clean = this.escapePdfText(text);
    return `BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${clean}) Tj ET`;
  }

  private escapePdfText(str: string): string {
    return (str || '')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  private escapeHtml(str: string): string {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private wrapText(text: string, maxChars: number): string[] {
    const words = (text || '').split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      if ((current + ' ' + w).trim().length <= maxChars) {
        current = (current + ' ' + w).trim();
      } else {
        if (current) lines.push(current);
        current = w.slice(0, maxChars);
      }
    }
    if (current) lines.push(current);
    return lines.length > 0 ? lines : ['-'];
  }

  private buildBarcodeBarsWidths(code: string): number[] {
    const clean = (code || 'SYB10821').toUpperCase();
    const widths: number[] = [2.2, 1.2, 1.8, 1.2];
    for (let i = 0; i < clean.length; i++) {
      const c = clean.charCodeAt(i);
      widths.push((c % 3) + 1.1);
      widths.push(((c >> 1) % 2) + 1.0);
      widths.push(((c >> 2) % 3) + 1.1);
      widths.push(1.2);
    }
    widths.push(2.2, 1.2, 1.8);
    return widths;
  }
}
