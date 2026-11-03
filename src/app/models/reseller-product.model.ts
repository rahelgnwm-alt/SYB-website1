export interface ResellerProduct {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  categoryLabel: 'Paket Wajah' | 'Paket Tubuh' | 'Paket Kosmetik' | 'Kartonan' | 'Starter Kit';
  image: string;
  wholesalePrice: number; // Harga Grosir / Reseller per paket/karton
  retailPrice: number;    // Harga Coret / Nilai Pasar Eceran
  minOrder: number;       // Jumlah minimum order
  minOrderUnit: 'pcs' | 'lusin' | 'karton' | 'paket';
  packageContents: string;// Deskripsi isi kemasan grosir
  inventory: number;      // Stok paket di gudang grosir
  status: 'Active' | 'Draft';
  sku: string;
  badge?: string;
  bpomNumber: string;
  accentColor: string;
  benefits: string[];
}

