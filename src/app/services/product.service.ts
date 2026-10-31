import { Injectable, signal, computed } from '@angular/core';
import { Product, ReviewItem, Ritual, CategoryItem } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly initialProducts: Product[] = [
    {
      id: 'red-jelly-serum',
      title: 'FORTE Red Jelly Serum',
      subtitle: 'Niacinamide 10% · 20ml formula intensif pencerah & anti-kusam.',
      category: 'Kecantikan/Perawatan Wajah',
      categoryLabel: 'Wajah',
      productType: 'Serum Wajah',
      status: 'Active',
      inventory: 54200,
      variantsCount: 3,
      variants: [
        { id: 'v1', name: '20ml Regular Glass Bottle', stock: 32000, price: 22325, sku: 'SYB-RJ-20' },
        { id: 'v2', name: '50ml Jumbo Refill Pack', stock: 15200, price: 49000, sku: 'SYB-RJ-50' },
        { id: 'v3', name: '2x 20ml Twin Value Pack', stock: 7000, price: 39900, sku: 'SYB-RJ-TWIN' }
      ],
      channels: 4,
      catalogs: 2,
      price: 22325,
      originalPrice: 47500,
      rating: 4.9,
      reviewsCount: 4210,
      badge: 'Best Seller ✦',
      bpomNumber: 'NA18210103429',
      accentColor: '#ff2a7a',
      image: 'products/red-jelly-serum.jpg',
      handle: 'best-seller-new-syb-forte-red-jelly-serum-20ml',
      heroTagline: 'Mencerahkan flek & glowing kenyal seketika!',
      description: 'Serum legendaris SYB dengan kandungan Niacinamide konsentrasi tinggi 10% dipadu Red Algae untuk memperbaiki tekstur kulit, memudarkan noda hitam, dan memberikan efek glowing merona.',
      benefits: [
        'Mencerahkan wajah secara merata dalam 14 hari',
        'Menyamarkan pori-pori dan bekas jerawat',
        'Formula ringan cepat meresap tanpa rasa lengket',
        'Menjaga elastisitas kulit tetap kenyal & halus'
      ],
      keyIngredients: ['Niacinamide 10%', 'Red Algae Extract', 'Hyaluronic Acid 4D', 'Allantoin'],
      howToUse: [
        'Teteskan 2-3 tetes ke seluruh wajah yang telah bersih',
        'Tepuk-tepuk perlahan hingga meresap sempurna',
        'Gunakan pagi dan malam hari sebelum pelembap'
      ],
      isFeatured: true,
      isFlashSale: true
    },
    {
      id: 'aha-body-toner',
      title: 'AHA Skinboost Body Toner',
      subtitle: 'Glycolic Acid · 250ml booster pencerah area lipatan tubuh.',
      category: 'Perawatan Tubuh/Perawatan Kulit',
      categoryLabel: 'Tubuh',
      productType: 'Body Toner',
      status: 'Active',
      inventory: 38900,
      variantsCount: 2,
      variants: [
        { id: 'v1', name: 'Standard 250ml + 10ml Extra', stock: 25000, price: 46060, sku: 'SYB-AHA-250' },
        { id: 'v2', name: 'Travel Bottle 100ml', stock: 13900, price: 25000, sku: 'SYB-AHA-100' }
      ],
      channels: 4,
      catalogs: 2,
      price: 46060,
      originalPrice: 98000,
      rating: 4.9,
      reviewsCount: 3120,
      badge: 'Best Seller ✦',
      bpomNumber: 'NA18200108392',
      accentColor: '#c098f4',
      image: 'products/aha-body-toner.jpg',
      handle: 'best-seller-aha-skinboost-body-toner-250ml',
      heroTagline: 'Bersihkan daki membandel, leher & ketiak auto cerah!',
      description: 'Body toner dengan Glycolic Acid (AHA) murni yang efektif mengangkat sel kulit mati, membersihkan daki di siku, leher, dan lipatan, serta melembapkan kulit secara mendalam.',
      benefits: [
        'Mengangkat daki dan sel kulit mati membandel',
        'Mencerahkan area gelap: ketiak, selangkangan, siku & lutut',
        'Wangi segar tahan lama sepanjang hari',
        'Aman dipakai setiap hari setelah mandi'
      ],
      keyIngredients: ['Glycolic Acid (AHA)', 'Niacinamide', 'Aloe Vera Leaf Water', 'Castor Oil'],
      howToUse: [
        'Tuangkan body toner secukupnya ke kapas',
        'Usapkan secara merata ke seluruh tubuh atau area lipatan',
        'Gunakan teratur sehabis mandi tanpa perlu dibilas'
      ],
      isFeatured: true,
      isFlashSale: true
    },
    {
      id: 'golden-egg-mask',
      title: 'Bright Glow Jelly Mask Golden Egg',
      subtitle: 'DNA Salmon · Sodium PCA masker mewah pengencang kulit wajah.',
      category: 'Kecantikan/Perawatan Wajah',
      categoryLabel: 'Wajah',
      productType: 'Masker Wajah',
      status: 'Active',
      inventory: 18450,
      variantsCount: 2,
      variants: [
        { id: 'v1', name: 'Golden Egg Jar 50gr', stock: 12000, price: 72380, sku: 'SYB-GE-50' },
        { id: 'v2', name: 'Golden Egg Jar 100gr Jumbo', stock: 6450, price: 129000, sku: 'SYB-GE-100' }
      ],
      channels: 4,
      catalogs: 2,
      price: 72380,
      originalPrice: 154000,
      rating: 4.8,
      reviewsCount: 1890,
      badge: 'New ♥',
      bpomNumber: 'NA18220200194',
      accentColor: '#f59e0b',
      image: 'products/golden-egg-mask.jpg',
      handle: 'new-syb-bright-glow-jelly-mask-golden-egg',
      heroTagline: 'Sensasi masker jelly emas dengan ekstrak DNA Salmon!',
      description: 'Masker gel keemasan dengan nutrisi DNA Salmon & Sodium PCA untuk meremajakan sel kulit, mengunci kelembapan instan, serta membuat wajah tampak glowing berkilau.',
      benefits: [
        'Menutrisi kulit dengan DNA Salmon premium',
        'Mengencangkan pori-pori dan garis halus',
        'Sensasi dingin menenangkan kulit yang lelah',
        'Efek glowing seketika dalam 15 menit pemakaian'
      ],
      keyIngredients: ['DNA Salmon', 'Sodium PCA', 'Gold Peptide 24K', 'Hydrolyzed Collagen'],
      howToUse: [
        'Oleskan masker merata pada wajah yang bersih',
        'Diamkan selama 15-20 menit hingga sedikit mengering',
        'Bilas bersih dengan air hangat, gunakan 2-3x seminggu'
      ],
      isFeatured: true,
      isFlashSale: false
    },
    {
      id: 'lip-cream-matte',
      title: 'SYB Lip Cream Matte 8 Shade',
      subtitle: '8 Shade Transferproof · Vitamin E lembut di bibir.',
      category: 'Kecantikan/Make up Wajah',
      categoryLabel: 'Makeup',
      productType: 'Pewarna Bibir',
      status: 'Active',
      inventory: 45000,
      variantsCount: 4,
      variants: [
        { id: 'v1', name: 'Shade 01 Nude Velvet', stock: 12000, price: 22748, sku: 'SYB-LIP-01' },
        { id: 'v2', name: 'Shade 02 Rose Petal', stock: 14000, price: 22748, sku: 'SYB-LIP-02' },
        { id: 'v3', name: 'Shade 06 Terrable Brick', stock: 11000, price: 22748, sku: 'SYB-LIP-06' },
        { id: 'v4', name: 'Shade 08 Berry Kiss', stock: 8000, price: 22748, sku: 'SYB-LIP-08' }
      ],
      channels: 4,
      catalogs: 2,
      price: 22748,
      originalPrice: 48400,
      rating: 4.9,
      reviewsCount: 5120,
      badge: 'Best Seller ✦',
      bpomNumber: 'NA18201300982',
      accentColor: '#ff4d6d',
      image: 'products/lip-cream-matte.jpg',
      handle: 'new-syb-lip-cream-matte-8-varian',
      heroTagline: 'Transferproof, ringan seperti awan, warna tahan 16 jam!',
      description: 'Lip cream matte dengan pigmentasi intens dalam sekali ulas. Diformulasikan dengan Vitamin E agar bibir tetap lembap dan tidak pecah-pecah sepanjang hari.',
      benefits: [
        'Transferproof & smudge-proof hingga 16 jam',
        'Tekstur airy-matte yang super ringan tanpa crack',
        'Kaya Vitamin E menjaga bibir tetap lembap',
        '8 pilihan warna cantik cocok untuk kulit Indonesia'
      ],
      keyIngredients: ['Vitamin E Acetate', 'Avocado Oil', 'Silica Silylate', 'Beeswax'],
      howToUse: [
        'Aplikasikan pada bibir mulai dari bagian tengah ke arah luar',
        'Biarkan mengering selama 30 detik untuk hasil transferproof maksimal'
      ],
      isFeatured: true,
      isFlashSale: false
    },
    {
      id: 'lippy-oil-serum',
      title: 'Vitamin Lippy Oil Serum',
      subtitle: 'Jojoba Oil · Serum bibir plumpy merah alami.',
      category: 'Kecantikan/Perawatan Wajah',
      categoryLabel: 'Makeup',
      productType: 'Lip Care',
      status: 'Active',
      inventory: 21300,
      variantsCount: 2,
      variants: [
        { id: 'v1', name: 'Single 5ml Tube', stock: 14500, price: 46060, sku: 'SYB-LIPPY-1' },
        { id: 'v2', name: 'Bundle 2pcs Double Glow', stock: 6800, price: 80000, sku: 'SYB-LIPPY-2' }
      ],
      channels: 4,
      catalogs: 2,
      price: 46060,
      originalPrice: 98000,
      rating: 4.8,
      reviewsCount: 1640,
      bpomNumber: 'NA18211301102',
      accentColor: '#ec4899',
      image: 'products/lippy-oil-serum.jpg',
      handle: 'new-syb-vitamin-lippy-oil-serum',
      heroTagline: 'Bibir sehat merah alami, bebas pecah-pecah & gelap!',
      description: 'Serum minyak bibir kaya antioksidan dengan Jojoba Oil dan Vitamin C/E murni. Memberikan efek plumping bercahaya sekaligus mencerahkan warna bibir alami.',
      benefits: [
        'Mengembalikan rona merah alami bibir gelap',
        'Melembapkan bibir pecah-pecah seketika',
        'Memberikan glossy finish tanpa rasa berminyak',
        'Kaya nutrisi essential oil alami'
      ],
      keyIngredients: ['Jojoba Seed Oil', 'Sweet Almond Oil', 'Tocopheryl Acetate (Vit E)', 'Rosehip Oil'],
      howToUse: [
        'Oleskan tipis-tipis pada bibir setiap sebelum tidur atau sebagai lip topper'
      ],
      isFeatured: false,
      isFlashSale: true
    },
    {
      id: 'jelly-mask',
      title: 'SYB Soothing Jelly Mask 5 Varian',
      subtitle: '5 varian ekstrak alami · Menenangkan kulit lelah.',
      category: 'Kecantikan/Perawatan Wajah',
      categoryLabel: 'Wajah',
      productType: 'Masker Wajah',
      status: 'Active',
      inventory: 31000,
      variantsCount: 3,
      variants: [
        { id: 'v1', name: 'Watermelon Soothing 10gr', stock: 11000, price: 27965, sku: 'SYB-JM-WM' },
        { id: 'v2', name: 'Centella Calming 10gr', stock: 12000, price: 27965, sku: 'SYB-JM-CA' },
        { id: 'v3', name: 'Tea Tree Acne 10gr', stock: 8000, price: 27965, sku: 'SYB-JM-TT' }
      ],
      channels: 4,
      catalogs: 2,
      price: 27965,
      originalPrice: 59500,
      rating: 4.7,
      reviewsCount: 1230,
      bpomNumber: 'NA18210200841',
      accentColor: '#10b981',
      image: 'products/jelly-mask.jpg',
      handle: 'new-syb-jelly-mask-5-varian',
      heroTagline: 'Sensasi jelly segar yang menyejukkan kulit seketika!',
      description: 'Masker bertekstur jelly lembut yang kaya akan sari buah segar untuk meredakan kemerahan, melembutkan tekstur, dan menenangkan kulit iritasi.',
      benefits: [
        'Meredakan kemerahan dan inflamasi jerawat',
        'Memberikan hidrasi instan menyejukkan',
        'Mengecilkan penampakan pori wajah',
        'Kemasan praktis travel-friendly'
      ],
      keyIngredients: ['Centella Asiatica', 'Watermelon Extract', 'Cucumber Fruit Extract', 'Niacinamide'],
      howToUse: [
        'Buka kemasan sachet jelly mask',
        'Aplikasikan merata ke wajah, diamkan 15 menit',
        'Bilas dengan air sejuk'
      ],
      isFeatured: false,
      isFlashSale: false
    },
    {
      id: 'peeling-serum',
      title: 'Peeling Serum Vitamin C + Collagen',
      subtitle: 'Vitamin C + Collagen formula eksfoliasi lembut.',
      category: 'Kecantikan/Perawatan Wajah',
      categoryLabel: 'Wajah',
      productType: 'Serum Wajah',
      status: 'Active',
      inventory: 19500,
      variantsCount: 2,
      variants: [
        { id: 'v1', name: 'Botol Pipet 20ml', stock: 13000, price: 35895, sku: 'SYB-PS-20' },
        { id: 'v2', name: 'Botol Pipet 35ml', stock: 6500, price: 55000, sku: 'SYB-PS-35' }
      ],
      channels: 4,
      catalogs: 2,
      price: 35895,
      originalPrice: 76372,
      rating: 4.8,
      reviewsCount: 1540,
      bpomNumber: 'NA18210108920',
      accentColor: '#f97316',
      image: 'products/peeling-serum.jpg',
      handle: 'new-syb-peeling-serum-vitamin-c-collagen',
      heroTagline: 'Eksfoliasi lembut untuk kulit bebas komedo & bercahaya!',
      description: 'Serum eksfoliasi lembut berkombinasi Vitamin C aktif dan Kolagen hidrolisis. Meremajakan tekstur kulit, merontokkan komedo, serta mencerahkan wajah kusam.',
      benefits: [
        'Mengangkat komedo putih dan hitam',
        'Mempercepat regenerasi sel kulit baru',
        'Meratakan warna kulit yang belang',
        'Meningkatkan produksi kolagen alami'
      ],
      keyIngredients: ['Ethyl Ascorbic Acid (Vit C)', 'Hydrolyzed Marine Collagen', 'Lactic Acid', 'Chamomile Extract'],
      howToUse: [
        'Gunakan 2-3 tetes di malam hari setelah mencuci muka',
        'Gunakan 2 kali dalam seminggu untuk hasil optimal'
      ],
      isFeatured: false,
      isFlashSale: false
    },
    {
      id: 'body-serum-booster',
      title: 'Original Body Serum Booster 4 Varian',
      subtitle: '4 varian wangi mewah · Niacinamide pencerah badan.',
      category: 'Perawatan Tubuh/Perawatan Kulit',
      categoryLabel: 'Tubuh',
      productType: 'Body Serum',
      status: 'Active',
      inventory: 42000,
      variantsCount: 4,
      variants: [
        { id: 'v1', name: 'Brightening Diamond 30ml', stock: 12000, price: 40903, sku: 'SYB-BS-DM' },
        { id: 'v2', name: 'Pink Sakura 30ml', stock: 11000, price: 40903, sku: 'SYB-BS-SK' },
        { id: 'v3', name: 'Vanilla Dream 30ml', stock: 10000, price: 40903, sku: 'SYB-BS-VN' },
        { id: 'v4', name: 'Fresh Berries 30ml', stock: 9000, price: 40903, sku: 'SYB-BS-BR' }
      ],
      channels: 4,
      catalogs: 2,
      price: 40903,
      originalPrice: 87028,
      rating: 4.9,
      reviewsCount: 2890,
      bpomNumber: 'NA18210104712',
      accentColor: '#8b5cf6',
      image: 'products/body-serum-booster.jpg',
      handle: 'new-syb-original-body-serum-booster-30ml',
      heroTagline: 'Booster pencerah badan konsentrat tinggi dengan wangi parfum mewah!',
      description: 'Serum badan konsentrat tinggi yang dapat dicampurkan ke body lotion harian atau dipakai langsung. Melembapkan, memudarkan bekas luka, dan mencerahkan kulit tubuh 5x lebih cepat.',
      benefits: [
        'Mencerahkan kulit tubuh 5x lebih cepat',
        'Dapat dicampur ke body lotion favorit',
        'Aroma parfum mewah tahan hingga 8 jam',
        'Menyamarkan bekas gigitan nyamuk & luka'
      ],
      keyIngredients: ['Glutathione', 'Niacinamide Booster', 'Alpha Arbutin', 'Vitamin E Pearls'],
      howToUse: [
        'Teteskan 2-3 tetes ke telapak tangan bersama body lotion',
        'Usapkan merata ke seluruh tubuh setiap pagi dan malam'
      ],
      isFeatured: false,
      isFlashSale: false
    },
    {
      id: 'powder-mask',
      title: 'SYB Powder Mask Masker Bubuk 5 Varian',
      subtitle: 'Niacinamide & Glycolic Acid · Sensasi spa di rumah.',
      category: 'Kecantikan/Perawatan Wajah',
      categoryLabel: 'Wajah',
      productType: 'Masker Bubuk',
      status: 'Active',
      inventory: 35000,
      variantsCount: 3,
      variants: [
        { id: 'v1', name: 'Peppermint Fresh 50gr', stock: 12000, price: 24938, sku: 'SYB-PM-PM' },
        { id: 'v2', name: 'Chocolate Belgian 50gr', stock: 11500, price: 24938, sku: 'SYB-PM-CH' },
        { id: 'v3', name: 'Green Tea Matcha 50gr', stock: 11500, price: 24938, sku: 'SYB-PM-GT' }
      ],
      channels: 4,
      catalogs: 2,
      price: 24938,
      originalPrice: 53060,
      rating: 4.8,
      reviewsCount: 1980,
      bpomNumber: 'NA18200200481',
      accentColor: '#06b6d4',
      image: 'products/powder-mask.jpg',
      handle: 'new-syb-powder-mask-5-varian',
      heroTagline: 'Masker bubuk organik untuk detox pori & wajah segar!',
      description: 'Masker bubuk alami dengan sensasi dingin mint dan kandungan Niacinamide. Menyerap kelebihan minyak, mengecilkan pori-pori, dan mendetoks kulit wajah dari polusi perkotaan.',
      benefits: [
        'Menyerap minyak berlebih dan detox komedo',
        'Sensasi dingin relaksasi kulit lelah',
        'Mengeringkan jerawat meradang dengan cepat',
        'Wajah terasa halus dan segar seketika'
      ],
      keyIngredients: ['Kaolin Clay', 'Peppermint Extract', 'Niacinamide', 'Tea Tree Leaf Oil'],
      howToUse: [
        'Campur 1 sendok bubuk masker dengan air mawar secukupnya',
        'Aduk rata hingga bertekstur pasta',
        'Oleskan ke wajah, tunggu 15 menit, lalu bilas bersih'
      ],
      isFeatured: false,
      isFlashSale: false
    },
    {
      id: 'glow-fresh-bundle',
      title: 'Paket Bundling Glow & Fresh 3in1',
      subtitle: 'Toner + Peeling + Serum hemat hingga 80% diskon spesial.',
      category: 'Kecantikan/Perawatan Wajah',
      categoryLabel: 'Paket Ritual',
      productType: 'Paket Hemat',
      status: 'Active',
      inventory: 8500,
      variantsCount: 2,
      variants: [
        { id: 'v1', name: 'Paket Lengkap Glowing 3in1', stock: 5500, price: 88042, sku: 'SYB-BND-GLOW' },
        { id: 'v2', name: 'Paket + Pouch Lucu Exclusive', stock: 3000, price: 99000, sku: 'SYB-BND-POUCH' }
      ],
      channels: 4,
      catalogs: 2,
      price: 88042,
      originalPrice: 187324,
      rating: 5.0,
      reviewsCount: 6420,
      badge: 'Bundling ♥',
      bpomNumber: 'BPOM Paket Resmi RI',
      accentColor: '#ec4899',
      image: 'products/glow-fresh-bundle.jpg',
      handle: 'syb-paket-bundling-glow-fresh',
      heroTagline: 'Solusi lengkap kulit glowing bersih merona dengan harga super hemat!',
      description: 'Paket bundling paling favorit SYB! Berisi 3 produk unggulan: AHA Body Toner, Peeling Serum, dan Red Jelly Serum untuk perawatan menyeluruh dari ujung rambut sampai kaki.',
      benefits: [
        'Hemat lebih dari 50% dibanding beli satuan',
        'Hasil glowing sinergis lebih cepat terlihat',
        'Perawatan lengkap wajah & badan dalam 1 paket',
        'Bonus box packaging eksklusif SYB'
      ],
      keyIngredients: ['Niacinamide 10%', 'Glycolic Acid', 'Vitamin C', 'Collagen Peptides'],
      howToUse: [
        'Pagi: Bersihkan badan dengan AHA Toner, lalu gunakan Red Jelly pada wajah',
        'Malam: Gunakan Peeling Serum 2x seminggu, lalu kunci kelembapan dengan Red Jelly'
      ],
      isFeatured: true,
      isFlashSale: true
    }
  ];

  // Reviews Data
  private readonly initialReviews: ReviewItem[] = [
    {
      id: 'rev-1',
      author: 'Clara Anindya',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      city: 'Jakarta Selatan',
      rating: 5,
      productName: 'FORTE Red Jelly Serum',
      comment: 'Udah botol ke-3! Tekstur jellynya beneran melting di kulit. Pori-pori aku yang tadinya kelihatan gede sekarang jadi samar banget!',
      verified: true,
      timeAgo: '2 hari lalu',
      skinType: 'Kombinasi & Kusam'
    },
    {
      id: 'rev-2',
      author: 'Nabila Putri S.',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
      city: 'Surabaya',
      rating: 5,
      productName: 'AHA Skinboost Body Toner',
      comment: 'Daki di leher dan siku langsung rontok di kapas pas pertama coba! Wanginya seger bgt kaya parfum mewah, wajib repurchase!',
      verified: true,
      timeAgo: '3 hari lalu',
      skinType: 'Kulit Tubuh Belang'
    },
    {
      id: 'rev-3',
      author: 'Tiara Maulida',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80',
      city: 'Bandung',
      rating: 5,
      productName: 'Paket Bundling Glow & Fresh',
      comment: 'Worth it parah buat harga segini dapet 3 produk kualitas juara! Packingnya super cute dapet pouch pink lagi!',
      verified: true,
      timeAgo: '5 hari lalu',
      skinType: 'Normal to Dry'
    },
    {
      id: 'rev-4',
      author: 'Felicia Tan',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
      city: 'Medan',
      rating: 5,
      productName: 'SYB Lip Cream Matte',
      comment: 'Shade 06 Terrable beneran MLBB terbaik buat undertone hangat. Ga bikin bibir kering ngelupas seharian dipakai makan!',
      verified: true,
      timeAgo: '1 minggu lalu',
      skinType: 'Bibir Kering'
    }
  ];

  // State Signals
  readonly products = signal<Product[]>(this.initialProducts);
  readonly reviews = signal<ReviewItem[]>(this.initialReviews);
  readonly selectedCategory = signal<string>('Semua');
  readonly searchQuery = signal<string>('');
  readonly sortOption = signal<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');

  // Modal Signals
  readonly selectedQuickViewProduct = signal<Product | null>(null);
  readonly isQuizOpen = signal<boolean>(false);

  // Category list
  readonly categories: CategoryItem[] = [
    { name: 'Semua Produk', note: 'Lihat koleksi lengkap', image: 'products/red-jelly-serum.jpg', categoryLabel: 'Semua' },
    { name: 'Perawatan Wajah', note: 'Serum, toner & masker', image: 'products/red-jelly-serum.jpg', categoryLabel: 'Wajah' },
    { name: 'Perawatan Tubuh', note: 'Body toner & booster', image: 'products/body-serum-booster.jpg', categoryLabel: 'Tubuh' },
    { name: 'Make Up & Bibir', note: 'Lip cream & lippy oil', image: 'products/lip-cream-matte.jpg', categoryLabel: 'Makeup' },
    { name: 'Paket Ritual Bundling', note: 'Hemat diskon s/d 80%', image: 'products/glow-fresh-bundle.jpg', categoryLabel: 'Paket Ritual' }
  ];

  // Rituals computed
  readonly rituals = computed<Ritual[]>(() => {
    const list = this.products();
    const find = (id: string) => list.find((p) => p.id === id) || list[0];
    return [
      {
        key: 'am',
        label: 'Ritual Pagi',
        time: '07:00 WIB',
        title: 'Fresh & Glowing',
        image: 'images/ritual-morning.jpg',
        hour: 7,
        steps: [
          { step: 'Prep Kulit', product: find('aha-body-toner') },
          { step: 'Glow Serum', product: find('red-jelly-serum') },
          { step: 'Warna Bibir', product: find('lip-cream-matte') }
        ]
      },
      {
        key: 'pm',
        label: 'Ritual Malam',
        time: '22:00 WIB',
        title: 'Calm & Recharge',
        image: 'images/ritual-night.jpg',
        hour: 22,
        steps: [
          { step: 'Eksfoliasi Lembut', product: find('peeling-serum') },
          { step: 'Masker Jelly Emas', product: find('golden-egg-mask') },
          { step: 'Nutrisi Bibir', product: find('lippy-oil-serum') }
        ]
      }
    ];
  });

  // Filtered Products Computed
  readonly filteredProducts = computed(() => {
    const list = this.products();
    const cat = this.selectedCategory();
    const query = this.searchQuery().toLowerCase().trim();
    const sort = this.sortOption();

    let result = list.filter((p) => {
      const matchCat = cat === 'Semua' || p.categoryLabel === cat;
      const matchQuery =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.subtitle.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });

    if (sort === 'price-asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      result = [...result].sort((a, b) => b.rating - a.rating);
    }

    return result;
  });

  readonly flashSaleProducts = computed(() => {
    return this.products().filter((p) => p.isFlashSale);
  });

  readonly featuredProducts = computed(() => {
    return this.products().filter((p) => p.isFeatured);
  });

  // Modal Handlers
  openQuickView(product: Product): void {
    this.selectedQuickViewProduct.set(product);
  }

  closeQuickView(): void {
    this.selectedQuickViewProduct.set(null);
  }

  openQuiz(): void {
    this.isQuizOpen.set(true);
  }

  closeQuiz(): void {
    this.isQuizOpen.set(false);
  }

  constructor() {
    this.restoreProducts();
  }

  private restoreProducts(): void {
    try {
      const saved = localStorage.getItem('syb_admin_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.products.set(parsed);
        }
      }
    } catch {}
  }

  private persist(): void {
    try {
      localStorage.setItem('syb_admin_products', JSON.stringify(this.products()));
    } catch {}
  }

  // Admin CRUD Methods
  addProduct(newProduct: Product): void {
    this.products.update((current) => [newProduct, ...current]);
    this.persist();
  }

  updateProduct(updated: Product): void {
    this.products.update((current) =>
      current.map((p) => (p.id === updated.id ? updated : p))
    );
    this.persist();
  }

  deleteProduct(id: string): void {
    this.products.update((current) => current.filter((p) => p.id !== id));
    this.persist();
  }

  resetProductsToDefault(): void {
    this.products.set(this.initialProducts);
    this.persist();
  }
}
