<?php
/**
 * SYB Official Store - Database Seeder
 * Populates tables with default SYB products, reseller packages, discounts, categories, and admin account.
 */

require_once __DIR__ . '/config/database.php';

function runSeeder(): array {
    $pdo = getDbConnection();
    $report = [];

    // 1. Seed Categories
    $categories = [
        ['cat-1', 'Semua Produk', 'Lihat koleksi lengkap', 'Semua', 'products/red-jelly-serum.jpg', 1],
        ['cat-2', 'Perawatan Wajah', 'Serum, toner & masker', 'Wajah', 'products/red-jelly-serum.jpg', 2],
        ['cat-3', 'Perawatan Tubuh', 'Body toner & booster', 'Tubuh', 'products/body-serum-booster.jpg', 3],
        ['cat-4', 'Make Up & Bibir', 'Lip cream & lippy oil', 'Makeup', 'products/lip-cream-matte.jpg', 4],
        ['cat-5', 'Paket Ritual Bundling', 'Hemat diskon s/d 80%', 'Paket Ritual', 'products/glow-fresh-bundle.jpg', 5]
    ];
    $catStmt = $pdo->prepare("REPLACE INTO categories (id, name, note, category_label, image, display_order) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($categories as $c) {
        $catStmt->execute($c);
    }
    $report['categories'] = count($categories);

    // 2. Seed Default Admin User
    $adminHash = password_hash('admin123', PASSWORD_DEFAULT);
    $userStmt = $pdo->prepare("REPLACE INTO users (id, username, email, password, full_name, phone, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)");
    $userStmt->execute(['usr-admin', 'admin', 'admin@syb.co.id', $adminHash, 'Administrator SYB Official', '081234567890', 'admin']);
    $userStmt->execute(['usr-superadmin', 'superadmin', 'superadmin@syb.co.id', $adminHash, 'Super Administrator PT Sheva Jordan Bersama', '081234567891', 'admin']);
    $report['admin_users'] = 2;

    // 3. Seed Products
    $products = [
        [
            'id' => 'red-jelly-serum',
            'title' => 'FORTE Red Jelly Serum',
            'subtitle' => 'Niacinamide 10% · 20ml serum pencerah & peremajaan kulit wajah.',
            'handle' => 'best-seller-new-syb-forte-red-jelly-serum-20ml-with-niacinamide-10-untuk-mencerahkan-kulit-wajah-mengurangi-kusam-1-redjellyserum',
            'category' => 'Kecantikan/Perawatan Wajah',
            'category_label' => 'Wajah',
            'product_type' => 'Serum',
            'price' => 23750,
            'original_price' => 47500,
            'status' => 'Active',
            'inventory' => 45000,
            'badge' => 'Best Seller',
            'image' => 'products/red-jelly-serum.jpg',
            'gallery' => json_encode(['products/red-jelly-serum.jpg']),
            'description' => 'Serum wajah inovatif dengan tekstur gel merah merona yang kaya akan Niacinamide 10% dan Red Algae Extract.',
            'key_benefits' => json_encode([
                'Mencerahkan wajah kusam dan memudarkan flek hitam',
                'Formula ringan cepat meresap tanpa rasa lengket',
                'Menjaga elastisitas kulit tetap kenyal & halus'
            ]),
            'key_ingredients' => json_encode(['Niacinamide 10%', 'Red Algae Extract', 'Hyaluronic Acid 4D', 'Allantoin']),
            'how_to_use' => json_encode([
                'Teteskan 2-3 tetes ke seluruh wajah yang telah bersih',
                'Tepuk-tepuk perlahan hingga meresap sempurna',
                'Gunakan pagi dan malam hari sebelum pelembap'
            ]),
            'is_featured' => 1,
            'is_flash_sale' => 0
        ],
        [
            'id' => 'aha-body-toner',
            'title' => 'AHA Skinboost Body Toner',
            'subtitle' => 'Glycolic Acid · 250ml booster pencerah area lipatan tubuh.',
            'handle' => 'best-seller-new-netto-250ml-10ml-extra-new-syb-aha-skinboost-body-toner-melembabkan-mencerahkan-kulit-1pcs-new-syb-aha-skinboost-body-toner-250-ml',
            'category' => 'Perawatan Tubuh/Perawatan Kulit',
            'category_label' => 'Tubuh',
            'product_type' => 'Body Toner',
            'price' => 49000,
            'original_price' => 98000,
            'status' => 'Active',
            'inventory' => 38900,
            'badge' => 'Best Seller',
            'image' => 'products/aha-body-toner.jpg',
            'gallery' => json_encode(['products/aha-body-toner.jpg']),
            'description' => 'Body toner eksfoliasi lembut dengan kandungan Glycolic Acid (AHA) murni yang efektif mengangkat sel kulit mati pada leher, ketiak, siku, dan lutut.',
            'key_benefits' => json_encode([
                'Mencerahkan area lipatan yang gelap secara signifikan',
                'Menghilangkan daki dan sel kulit mati seketika',
                'Aroma segar mewah tahan lama'
            ]),
            'key_ingredients' => json_encode(['Glycolic Acid (AHA)', 'Niacinamide', 'Aloe Vera Extract', 'Centella Asiatica']),
            'how_to_use' => json_encode([
                'Tuang toner secukupnya pada kapas bersih',
                'Usap lembut pada bagian tubuh yang diinginkan',
                'Gunakan rutin setiap sehabis mandi'
            ]),
            'is_featured' => 1,
            'is_flash_sale' => 0
        ],
        [
            'id' => 'golden-egg-mask',
            'title' => 'Bright Glow Jelly Mask Golden Egg',
            'subtitle' => 'DNA Salmon · Sodium PCA masker malam mewah.',
            'handle' => 'new-syb-bright-glow-jelly-mask-golden-egg-salmon-dna-3-in-1-with-egg-golden-egg-mask',
            'category' => 'Kecantikan/Perawatan Wajah',
            'category_label' => 'Wajah',
            'product_type' => 'Masker Wajah',
            'price' => 72380,
            'original_price' => 98000,
            'status' => 'Active',
            'inventory' => 12500,
            'badge' => 'New',
            'image' => 'products/golden-egg-mask.jpg',
            'gallery' => json_encode(['products/golden-egg-mask.jpg']),
            'description' => 'Sleeping mask premium berbentuk telur emas dengan ekstrak DNA Salmon berkualitas tinggi.',
            'key_benefits' => json_encode([
                'Meremajakan kulit saat tidur dan memperbaiki skin barrier',
                'Meningkatkan kelembapan instan hingga 300%',
                'Mengurangi tanda penuaan dini dan garis halus'
            ]),
            'key_ingredients' => json_encode(['Salmon DNA Extract', 'Egg Yolk Extract', 'Sodium PCA', 'Gold Peptide']),
            'how_to_use' => json_encode([
                'Campurkan gel dan ekstrak telur dalam wadah masker',
                'Oleskan secara merata ke seluruh wajah dan leher',
                'Biarkan semalaman dan bilas di pagi hari'
            ]),
            'is_featured' => 1,
            'is_flash_sale' => 0
        ],
        [
            'id' => 'peeling-serum',
            'title' => 'SYB Daily Peeling Serum',
            'subtitle' => 'AHA BHA PHA · 20ml eksfoliasi pori-pori.',
            'handle' => 'new-syb-daily-peeling-serum-aha-bha-pha-20ml-peelingserum',
            'category' => 'Kecantikan/Perawatan Wajah',
            'category_label' => 'Wajah',
            'product_type' => 'Peeling Serum',
            'price' => 26345,
            'original_price' => 55000,
            'status' => 'Active',
            'inventory' => 22000,
            'badge' => null,
            'image' => 'products/peeling-serum.jpg',
            'gallery' => json_encode(['products/peeling-serum.jpg']),
            'description' => 'Serum eksfoliasi harian dengan kombinasi Triple Acid (AHA 3%, BHA 1%, PHA 2%) yang lembut untuk membersihkan komedo.',
            'key_benefits' => json_encode([
                'Membersihkan pori tersumbat dan komedo',
                'Memperhalus tekstur kulit bruntusan',
                'Mencegah timbulnya jerawat baru'
            ]),
            'key_ingredients' => json_encode(['Lactic Acid', 'Salicylic Acid', 'Lactobionic Acid', 'Chamomile Extract']),
            'how_to_use' => json_encode([
                'Oleskan pada wajah bersih di malam hari 2-3 kali seminggu',
                'Diamkan selama 10 menit lalu bilas bersih dengan air hangat'
            ]),
            'is_featured' => 0,
            'is_flash_sale' => 0
        ],
        [
            'id' => 'lippy-oil-serum',
            'title' => 'Vitamin Lippy Oil Serum',
            'subtitle' => 'Jojoba Oil · Serum bibir plump & lembap alami.',
            'handle' => '1-000-dapat-2pcs-new-syb-vitamin-lippy-oil-serum-serum-bibir-with-jojoba-oil-1pc-lippyserum',
            'category' => 'Kecantikan/Bibir',
            'category_label' => 'Makeup',
            'product_type' => 'Lip Serum',
            'price' => 46060,
            'original_price' => 98000,
            'status' => 'Active',
            'inventory' => 31000,
            'badge' => null,
            'image' => 'products/lippy-oil-serum.jpg',
            'gallery' => json_encode(['products/lippy-oil-serum.jpg']),
            'description' => 'Serum bibir intensif yang berubah warna mengikuti pH bibir (color-changing pink alami).',
            'key_benefits' => json_encode([
                'Mencerahkan bibir gelap menjadi pink alami',
                'Mengatasi bibir pecah-pecah seketika',
                'Memberikan kilau juicy tahan lama'
            ]),
            'key_ingredients' => json_encode(['Jojoba Seed Oil', 'Sweet Almond Oil', 'Tocopheryl Acetate (Vit E)', 'Rosehip Oil']),
            'how_to_use' => json_encode(['Oleskan tipis-tipis pada bibir setiap sebelum tidur atau sebagai lip topper']),
            'is_featured' => 0,
            'is_flash_sale' => 0
        ],
        [
            'id' => 'jelly-mask',
            'title' => 'SYB Soothing Jelly Mask 5 Varian',
            'subtitle' => '5 varian ekstrak alami · Menenangkan kulit lelah.',
            'handle' => 'syb-jelly-mask-5-varian-calming-refreshing-hydrating-jellymask',
            'category' => 'Kecantikan/Perawatan Wajah',
            'category_label' => 'Wajah',
            'product_type' => 'Masker Wajah',
            'price' => 27965,
            'original_price' => 59500,
            'status' => 'Active',
            'inventory' => 18000,
            'badge' => null,
            'image' => 'products/jelly-mask.jpg',
            'gallery' => json_encode(['products/jelly-mask.jpg']),
            'description' => 'Masker jeli dingin menyegarkan dengan 5 pilihan ekstrak alami: Centella, Tea Tree, Watermelon, Honey, dan Rose.',
            'key_benefits' => json_encode([
                'Meredakan iritasi dan kemerahan akibat terbakar matahari',
                'Memberikan sensasi cooling seketika',
                'Menghidrasi kulit kering secara mendalam'
            ]),
            'key_ingredients' => json_encode(['Centella Asiatica', 'Tea Tree Leaf Oil', 'Watermelon Extract', 'Cucumber Juice']),
            'how_to_use' => json_encode(['Simpan di kulkas sebelum dipakai, aplikasikan tebal pada wajah selama 15 menit']),
            'is_featured' => 0,
            'is_flash_sale' => 0
        ],
        [
            'id' => 'body-serum-booster',
            'title' => 'Bright & White Body Serum Booster',
            'subtitle' => 'Glutathione 2% · 180ml body serum tone up.',
            'handle' => 'syb-bright-white-body-serum-booster-glutathione-tone-up-bodyserum',
            'category' => 'Perawatan Tubuh/Perawatan Kulit',
            'category_label' => 'Tubuh',
            'product_type' => 'Body Serum',
            'price' => 42500,
            'original_price' => 85000,
            'status' => 'Active',
            'inventory' => 27000,
            'badge' => 'New',
            'image' => 'products/body-serum-booster.jpg',
            'gallery' => json_encode(['products/body-serum-booster.jpg']),
            'description' => 'Serum tubuh dengan konsentrasi tinggi Glutathione dan Vitamin C untuk mencerahkan kulit tubuh.',
            'key_benefits' => json_encode([
                'Efek tone up alami tanpa meninggalkan residu abu-abu',
                'Melindungi dari sinar UV berbahaya',
                'Wangi tahan hingga 12 jam'
            ]),
            'key_ingredients' => json_encode(['Glutathione 2%', 'Niacinamide', 'UV Filter Titanium Dioxide', 'Shea Butter']),
            'how_to_use' => json_encode(['Oleskan merata pada seluruh tangan dan kaki setiap pagi sebelum beraktivitas']),
            'is_featured' => 0,
            'is_flash_sale' => 0
        ],
        [
            'id' => 'lip-cream-matte',
            'title' => 'Velvet Lip Cream Matte 8 Shades',
            'subtitle' => 'Transferproof · Ringan di bibir.',
            'handle' => 'syb-velvet-lip-cream-matte-8-shades-transferproof-lipcream',
            'category' => 'Kecantikan/Bibir',
            'category_label' => 'Makeup',
            'product_type' => 'Lip Cream',
            'price' => 31200,
            'original_price' => 65000,
            'status' => 'Active',
            'inventory' => 19500,
            'badge' => null,
            'image' => 'products/lip-cream-matte.jpg',
            'gallery' => json_encode(['products/lip-cream-matte.jpg']),
            'description' => 'Lip cream velvet matte dengan pigmentasi intens dalam sekali pulas, tidak membuat bibir kering.',
            'key_benefits' => json_encode([
                'Formula transferproof tahan hingga 16 jam',
                'Tekstur seringan awan (airy velvet)',
                'Dilengkapi Vitamin E untuk merawat bibir'
            ]),
            'key_ingredients' => json_encode(['Vitamin E', 'Dimethicone Crosspolymer', 'Isododecane', 'Natural Pigments']),
            'how_to_use' => json_encode(['Aplikasikan mulai dari bagian tengah bibir ke arah luar, tunggu 60 detik hingga set']),
            'is_featured' => 0,
            'is_flash_sale' => 0
        ],
        [
            'id' => 'glow-fresh-bundle',
            'title' => 'Paket Bundling Glow & Fresh',
            'subtitle' => 'AHA Toner + Red Jelly + Peeling Serum ritual glowing lengkap.',
            'handle' => 'syb-paket-bundling-glow-fresh-aha-toner-peeling-gel-milk-snail-brightening-glow-serum-aha-toner-peeling-snail-brightening-glow-serum',
            'category' => 'Paket Ritual Bundling',
            'category_label' => 'Paket Ritual',
            'product_type' => 'Bundle',
            'price' => 93662,
            'original_price' => 187324,
            'status' => 'Active',
            'inventory' => 8500,
            'badge' => 'Bundling',
            'image' => 'products/glow-fresh-bundle.jpg',
            'gallery' => json_encode(['products/glow-fresh-bundle.jpg']),
            'description' => 'Paket ritual kecantikan lengkap 3-in-1 favorit para beauty enthusiast untuk wajah cerah dan mulus bebas daki.',
            'key_benefits' => json_encode([
                'Hemat hingga 50% dibanding membeli satuan',
                'Kombinasi bahan aktif yang saling bersinergi',
                'Bonus box packaging eksklusif SYB'
            ]),
            'key_ingredients' => json_encode(['Niacinamide 10%', 'Glycolic Acid', 'Vitamin C', 'Collagen Peptides']),
            'how_to_use' => json_encode([
                'Pagi: Bersihkan badan dengan AHA Toner, lalu gunakan Red Jelly pada wajah',
                'Malam: Gunakan Peeling Serum 2x seminggu, lalu kunci kelembapan dengan Red Jelly'
            ]),
            'is_featured' => 1,
            'is_flash_sale' => 0
        ]
    ];

    $prodStmt = $pdo->prepare("REPLACE INTO products 
        (id, title, subtitle, handle, category, category_label, product_type, price, original_price, status, inventory, badge, image, gallery, description, key_benefits, key_ingredients, how_to_use, is_featured, is_flash_sale)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    foreach ($products as $p) {
        $prodStmt->execute([
            $p['id'], $p['title'], $p['subtitle'], $p['handle'], $p['category'], $p['category_label'], $p['product_type'],
            $p['price'], $p['original_price'], $p['status'], $p['inventory'], $p['badge'], $p['image'], $p['gallery'],
            $p['description'], $p['key_benefits'], $p['key_ingredients'], $p['how_to_use'], $p['is_featured'], $p['is_flash_sale']
        ]);
    }
    $report['products'] = count($products);

    // 4. Seed Reseller Packages
    $resellerPackages = [
        [
            'id' => 'res-starter-1',
            'name' => 'Paket Reseller Pemula (Starter)',
            'category' => 'Paket Kemitraan',
            'badge' => 'Paling Populer',
            'image' => 'products/glow-fresh-bundle.jpg',
            'min_order_qty' => 12,
            'wholesale_price' => 15000,
            'retail_price' => 25000,
            'profit_margin' => 40,
            'description' => 'Paket awal untuk memulai bisnis skincare modal minim dengan margin keuntungan hingga 40%.',
            'features' => json_encode([
                'Minimal order hanya 12 pcs bebas campur varian',
                'Gratis materi promosi foto & video HD siap posting',
                'Bimbingan cara jualan online via grup telegram resmi',
                '100% Terdaftar BPOM RI & Halal'
            ])
        ],
        [
            'id' => 'res-silver-2',
            'name' => 'Paket Agen Silver (Grosir Menengah)',
            'category' => 'Paket Kemitraan',
            'badge' => 'Best Value',
            'image' => 'products/aha-body-toner.jpg',
            'min_order_qty' => 50,
            'wholesale_price' => 12500,
            'retail_price' => 25000,
            'profit_margin' => 50,
            'description' => 'Paket grosir untuk toko kosmetik atau reseller aktif dengan harga tangan pertama langsung pabrik.',
            'features' => json_encode([
                'Minimal order 50 pcs',
                'Harga modal jauh lebih murah (Margin 50%)',
                'Prioritas pengiriman cepat dari gudang pusat',
                'Spanduk / Banner promosi toko gratis'
            ])
        ],
        [
            'id' => 'res-distributor-3',
            'name' => 'Paket Distributor Wilayah (Exclusive)',
            'category' => 'Paket Kemitraan',
            'badge' => 'Exclusive',
            'image' => 'products/red-jelly-serum.jpg',
            'min_order_qty' => 250,
            'wholesale_price' => 10000,
            'retail_price' => 25000,
            'profit_margin' => 60,
            'description' => 'Tingkat kemitraan distributor tertinggi dengan proteksi area penjualan dan subsidi ongkir se-Indonesia.',
            'features' => json_encode([
                'Minimal order 250 pcs',
                'Harga terendah langsung pabrik PT Sheva Jordan Bersama',
                'Subsidi ongkos kirim cargo ke seluruh Indonesia',
                'Sertifikat kemitraan resmi bertandatangan direksi'
            ])
        ]
    ];

    $resStmt = $pdo->prepare("REPLACE INTO reseller_products 
        (id, name, category, badge, image, min_order_qty, wholesale_price, retail_price, profit_margin, description, features)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($resellerPackages as $rp) {
        $resStmt->execute([
            $rp['id'], $rp['name'], $rp['category'], $rp['badge'], $rp['image'],
            $rp['min_order_qty'], $rp['wholesale_price'], $rp['retail_price'], $rp['profit_margin'],
            $rp['description'], $rp['features']
        ]);
    }
    $report['reseller_packages'] = count($resellerPackages);

    // 5. Seed Discount Vouchers
    $discounts = [
        ['disc-glow10', 'GLOWUP10', 'Diskon 10% Spesial Pelanggan Baru', 'percentage', 10, 50000, 20000, 500, 0, '2026-01-01', '2026-12-31', 1],
        ['disc-cantik20', 'CANTIK20', 'Diskon 20% Pembelian Minimal 100rb', 'percentage', 20, 100000, 50000, 300, 0, '2026-01-01', '2026-12-31', 1],
        ['disc-freeongkir', 'ONGKIRFREE', 'Potongan Ongkir Rp15.000', 'fixed', 15000, 75000, 15000, 200, 0, '2026-01-01', '2026-12-31', 1],
    ];

    $dStmt = $pdo->prepare("REPLACE INTO discounts 
        (id, code, description, discount_type, discount_value, min_spend, max_discount, usage_limit, used_count, start_date, end_date, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($discounts as $d) {
        $dStmt->execute($d);
    }
    $report['discounts'] = count($discounts);

    // 6. Flash Sale Settings
    $pdo->exec("REPLACE INTO flash_sale_settings (id, is_master_active, end_hour, end_minute, title, subtitle) 
        VALUES (1, 1, 24, 0, 'Flash Sale Glowing Spesial', 'Penawaran Terbatas Hari Ini')");

    $report['flash_sale_settings'] = 'Initialized';
    return $report;
}

if (php_sapi_name() === 'cli' || isset($_GET['run'])) {
    header('Content-Type: application/json');
    $result = runSeeder();
    echo json_encode(['status' => 'success', 'seeded' => $result], JSON_PRETTY_PRINT);
}

