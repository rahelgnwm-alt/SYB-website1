export interface Product {
  id: string;
  name: string;
  tagline: string;
  image: string;
  price: number;
  compareAt: number;
  badge?: 'Best Seller' | 'New' | 'Bundling';
  handle: string;
  /** soft background tint behind the product photo */
  tint: string;
}

export const SHOP_URL = 'https://sybindonesia.com/id';
export const productUrl = (handle: string) => `${SHOP_URL}/products/${handle}`;

export const PRODUCTS: Product[] = [
  {
    id: 'red-jelly-serum',
    name: 'FORTE Red Jelly Serum',
    tagline: 'Niacinamide 10% · 20ml',
    image: 'products/red-jelly-serum.jpg',
    price: 22325,
    compareAt: 47500,
    badge: 'Best Seller',
    handle:
      'best-seller-new-syb-forte-red-jelly-serum-20ml-with-niacinamide-10-untuk-mencerahkan-kulit-wajah-mengurangi-kusam-1-redjellyserum',
    tint: '#ffe1ef',
  },
  {
    id: 'aha-body-toner',
    name: 'AHA Skinboost Body Toner',
    tagline: 'Glycolic Acid · 250ml',
    image: 'products/aha-body-toner.jpg',
    price: 46060,
    compareAt: 98000,
    badge: 'Best Seller',
    handle:
      'best-seller-new-netto-250ml-10ml-extra-new-syb-aha-skinboost-body-toner-melembabkan-mencerahkan-kulit-1pcs-new-syb-aha-skinboost-body-toner-250-ml',
    tint: '#ece0fc',
  },
  {
    id: 'golden-egg-mask',
    name: 'Bright Glow Jelly Mask Golden Egg',
    tagline: 'DNA Salmon · Sodium PCA',
    image: 'products/golden-egg-mask.jpg',
    price: 72380,
    compareAt: 154000,
    badge: 'New',
    handle: 'new-syb-bright-glow-jelly-mask-golden-egg-with-sodium-pca-dan-dna-salmon-masker-wajah-golden-egg',
    tint: '#fff0dc',
  },
  {
    id: 'lip-cream-matte',
    name: 'Lip Cream Matte',
    tagline: '8 shade · Transferproof',
    image: 'products/lip-cream-matte.jpg',
    price: 22748,
    compareAt: 48400,
    handle:
      'new-syb-lip-cream-matte-8-varian-transferproof-lipstick-dengan-vitamin-e-untuk-kelembapan-bibir-bpom-original-06-terrable',
    tint: '#ffe1ef',
  },
  {
    id: 'lippy-oil-serum',
    name: 'Vitamin Lippy Oil Serum',
    tagline: 'Jojoba Oil · Serum Bibir',
    image: 'products/lippy-oil-serum.jpg',
    price: 46060,
    compareAt: 98000,
    handle: '1-000-dapat-2pcs-new-syb-vitamin-lippy-oil-serum-serum-bibir-with-jojoba-oil-1pc-lippyserum',
    tint: '#ece0fc',
  },
  {
    id: 'jelly-mask',
    name: 'Jelly Mask',
    tagline: '5 varian · Menenangkan',
    image: 'products/jelly-mask.jpg',
    price: 27965,
    compareAt: 59500,
    handle: 'new-syb-jelly-mask-available-in-5-varian-menenangkan-tanpa-sakit-netto-10gr-5-mix',
    tint: '#ffe1ef',
  },
  {
    id: 'peeling-serum',
    name: 'Peeling Serum Vitamin C',
    tagline: 'Vitamin C + Collagen',
    image: 'products/peeling-serum.jpg',
    price: 35895,
    compareAt: 76372,
    handle: 'new-syb-peeling-serum-with-vitamin-c-collagen-for-all-skin-types-1pc-peelingserum',
    tint: '#fff0dc',
  },
  {
    id: 'body-serum-booster',
    name: 'Original Body Serum Booster',
    tagline: '4 varian · 30ml',
    image: 'products/body-serum-booster.jpg',
    price: 40903,
    compareAt: 87028,
    handle:
      'new-syb-original-body-serum-booster-30ml-tersedia-4-macam-varian-serum-badan-mencerahkan-melembapkan-brightening',
    tint: '#ece0fc',
  },
  {
    id: 'powder-mask',
    name: 'Powder Mask',
    tagline: 'Niacinamide · Glycolic Acid',
    image: 'products/powder-mask.jpg',
    price: 24938,
    compareAt: 53060,
    handle:
      'new-syb-powder-mask-masker-bubuk-dengan-5-macam-varian-untuk-semua-jenis-kulit-dengan-niacinamide-dan-glycolic-acid-3-pcs-peppermint',
    tint: '#ffe1ef',
  },
  {
    id: 'glow-fresh-bundle',
    name: 'Paket Glow & Fresh',
    tagline: 'Toner + Peeling + Serum',
    image: 'products/glow-fresh-bundle.jpg',
    price: 88042,
    compareAt: 187324,
    badge: 'Bundling',
    handle:
      'syb-paket-bundling-glow-fresh-aha-toner-peeling-gel-milk-snail-brightening-glow-serum-aha-toner-peeling-snail-brightening-glow-serum',
    tint: '#ece0fc',
  },
];

export const byId = (id: string) => PRODUCTS.find((p) => p.id === id)!;

export interface Ritual {
  key: 'am' | 'pm';
  label: string;
  time: string;
  title: string;
  image: string;
  hour: number;
  steps: { step: string; product: Product }[];
}

export const RITUALS: Ritual[] = [
  {
    key: 'am',
    label: 'Ritual Pagi',
    time: '07:00',
    title: 'Fresh & Glowing',
    image: 'images/ritual-morning.jpg',
    hour: 7,
    steps: [
      { step: 'Prep', product: byId('aha-body-toner') },
      { step: 'Treat', product: byId('red-jelly-serum') },
      { step: 'Pop of color', product: byId('lip-cream-matte') },
    ],
  },
  {
    key: 'pm',
    label: 'Ritual Malam',
    time: '22:00',
    title: 'Calm & Recharge',
    image: 'images/ritual-night.jpg',
    hour: 22,
    steps: [
      { step: 'Exfoliate', product: byId('peeling-serum') },
      { step: 'Mask', product: byId('golden-egg-mask') },
      { step: 'Lip care', product: byId('lippy-oil-serum') },
    ],
  },
];

export const CATEGORIES = [
  { name: 'Skin Care', note: 'Serum, toner & mask', image: 'products/red-jelly-serum.jpg', href: `${SHOP_URL}/collections/skincare` },
  { name: 'Make Up', note: 'Lip cream & blush', image: 'products/lip-cream-matte.jpg', href: `${SHOP_URL}/collections/cosmetic` },
  { name: 'Body Care', note: 'Body toner & serum', image: 'products/body-serum-booster.jpg', href: `${SHOP_URL}/collections/body-care` },
  { name: 'Bundling', note: 'Hemat sampai 80%', image: 'products/glow-fresh-bundle.jpg', href: `${SHOP_URL}/collections/bundling` },
];

export const PLACES = [
  'di kampus?',
  'di kantor?',
  'saat first date?',
  'di konser?',
  'di Bali?',
  'di nikahan bestie?',
  'di kafe?',
  'saat OOTD?',
];

export const INGREDIENTS = [
  'Niacinamide 10%',
  'DNA Salmon',
  'Glycolic Acid',
  'Vitamin C',
  'Jojoba Oil',
  'Collagen',
  'Sodium PCA',
  'Licorice Extract',
];
