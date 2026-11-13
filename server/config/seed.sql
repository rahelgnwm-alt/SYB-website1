-- ============================================================
-- SYB OFFICIAL STORE - INITIAL DATABASE SEED DATA
-- PT Sheva Jordan Bersama
-- Compatible with MySQL 8.x / MariaDB 10.x & phpMyAdmin Import
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. USERS (Admin, Super Admin, Customers)
-- Default passwords:
-- admin / superadmin : sybadmin2026
-- customer           : customer123
-- ------------------------------------------------------------
REPLACE INTO `users` (`id`, `username`, `email`, `password`, `full_name`, `phone`, `role`, `avatar`, `is_active`, `created_at`, `updated_at`) VALUES
('usr-admin', 'admin', 'admin@shevajordanbersama.com', '$2y$10$w8Bq/8Y/0e1kHQkE0q9.3eEOm.Vb9m1U.F/U.yQ3uE6/1V.Vb9m1U', 'Admin Toko SYB Official', '081333369909', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', 1, NOW(), NOW()),
('usr-superadmin', 'superadmin', 'superadmin@shevajordanbersama.com', '$2y$10$w8Bq/8Y/0e1kHQkE0q9.3eEOm.Vb9m1U.F/U.yQ3uE6/1V.Vb9m1U', 'Super Administrator PT Sheva Jordan Bersama', '081216801809', 'admin', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80', 1, NOW(), NOW()),
('usr-cust-1', 'aulia', 'aulia.r@gmail.com', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'Aulia Rahmawati', '081234567890', 'customer', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80', 1, NOW(), NOW()),
('usr-cust-2', 'budi', 'budi.santoso@gmail.com', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'Budi Santoso', '081398765432', 'customer', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80', 1, NOW(), NOW());

-- ------------------------------------------------------------
-- 2. USER ADDRESSES
-- ------------------------------------------------------------
REPLACE INTO `user_addresses` (`id`, `user_id`, `label`, `recipient_name`, `phone`, `street`, `subdistrict`, `city`, `province`, `postal_code`, `is_default`, `created_at`) VALUES
('addr-1', 'usr-cust-1', 'Rumah', 'Aulia Rahmawati', '081234567890', 'Jl. Kemang Raya No. 45 RT 02/RW 05', 'Mampang Prapatan', 'Jakarta Selatan', 'DKI Jakarta', '12730', 1, NOW()),
('addr-2', 'usr-cust-2', 'Kantor', 'Budi Santoso', '081398765432', 'Jl. HR Muhammad No. 88, Ruko Golden Palace Blok B-2', 'Sukomanunggal', 'Surabaya', 'Jawa Timur', '60189', 1, NOW());

-- ------------------------------------------------------------
-- 3. CATEGORIES
-- ------------------------------------------------------------
REPLACE INTO `categories` (`id`, `name`, `note`, `category_label`, `image`, `display_order`) VALUES
('cat-1', 'Semua Produk', 'Lihat koleksi lengkap produk SYB', 'Semua', 'products/red-jelly-serum.jpg', 1),
('cat-2', 'Perawatan Wajah', 'Serum, toner & masker glowing', 'Wajah', 'products/red-jelly-serum.jpg', 2),
('cat-3', 'Perawatan Tubuh', 'Body toner & booster pemutih lipatan', 'Tubuh', 'products/body-serum-booster.jpg', 3),
('cat-4', 'Make Up & Bibir', 'Lip cream transferproof & lippy oil', 'Makeup', 'products/lip-cream-matte.jpg', 4),
('cat-5', 'Paket Ritual Bundling', 'Hemat diskon s/d 80% paket lengkap', 'Paket Ritual', 'products/glow-fresh-bundle.jpg', 5);

-- ------------------------------------------------------------
-- 4. PRODUCTS (10 Authentic Official SYB Products)
-- ------------------------------------------------------------
REPLACE INTO `products` (`id`, `title`, `subtitle`, `handle`, `category`, `category_label`, `product_type`, `price`, `original_price`, `status`, `inventory`, `badge`, `image`, `gallery`, `description`, `key_benefits`, `key_ingredients`, `how_to_use`, `is_featured`, `is_flash_sale`, `flash_sale_price`, `flash_sale_discount`, `flash_sale_quota`, `is_pre_order`, `pre_order_days`, `pre_order_note`, `created_at`, `updated_at`) VALUES
('red-jelly-serum', 'FORTE Red Jelly Serum', 'Niacinamide 10% · 20ml formula intensif pencerah & anti-kusam.', 'best-seller-new-syb-forte-red-jelly-serum-20ml-with-niacinamide-10-untuk-mencerahkan-kulit-wajah-mengurangi-kusam-1-redjellyserum', 'Kecantikan/Perawatan Wajah', 'Wajah', 'Serum', 22325.00, 47500.00, 'Active', 45000, 'Best Seller', 'products/red-jelly-serum.jpg', '["products/red-jelly-serum.jpg"]', 'Serum legendaris SYB dengan kandungan Niacinamide konsentrasi tinggi 10% dipadu Red Algae untuk memperbaiki tekstur kulit, memudarkan noda hitam, dan memberikan efek glowing merona.', '["Mencerahkan wajah secara merata dalam 14 hari","Menyamarkan pori-pori dan bekas jerawat","Formula ringan cepat meresap tanpa rasa lengket","Menjaga elastisitas kulit tetap kenyal & halus"]', '["Niacinamide 10%","Red Algae Extract","Hyaluronic Acid 4D","Allantoin"]', '["Teteskan 2-3 tetes ke seluruh wajah yang telah bersih","Tepuk-tepuk perlahan hingga meresap sempurna","Gunakan pagi dan malam hari sebelum pelembap"]', 1, 0, NULL, NULL, NULL, 0, 7, NULL, NOW(), NOW()),

('aha-body-toner', 'AHA Skinboost Body Toner', 'Glycolic Acid · 250ml formula eksfoliasi lembut daki lipatan.', 'best-seller-new-netto-250ml-10ml-extra-new-syb-aha-skinboost-body-toner-melembabkan-mencerahkan-kulit-1pcs-new-syb-aha-skinboost-body-toner-250-ml', 'Perawatan Tubuh/Perawatan Kulit', 'Tubuh', 'Body Toner', 46060.00, 98000.00, 'Active', 38900, 'Best Seller', 'products/aha-body-toner.jpg', '["products/aha-body-toner.jpg"]', 'Body toner eksfoliasi lembut dengan kandungan Glycolic Acid (AHA) murni yang efektif mengangkat sel kulit mati pada leher, ketiak, siku, dan lutut.', '["Mencerahkan area lipatan yang gelap secara signifikan","Menghilangkan daki dan sel kulit mati seketika","Aroma segar mewah tahan lama"]', '["Glycolic Acid (AHA)","Niacinamide","Aloe Vera Extract","Centella Asiatica"]', '["Tuang toner secukupnya pada kapas bersih","Usap lembut pada bagian tubuh yang diinginkan","Gunakan rutin setiap sehabis mandi"]', 1, 0, NULL, NULL, NULL, 0, 7, NULL, NOW(), NOW()),

('golden-egg-mask', 'Bright Glow Jelly Mask Golden Egg', 'DNA Salmon · Sodium PCA masker malam mewah.', 'new-syb-bright-glow-jelly-mask-golden-egg-salmon-dna-3-in-1-with-egg-golden-egg-mask', 'Kecantikan/Perawatan Wajah', 'Wajah', 'Masker Wajah', 72380.00, 154000.00, 'Active', 12500, 'New', 'products/golden-egg-mask.jpg', '["products/golden-egg-mask.jpg"]', 'Sleeping mask premium berbentuk telur emas dengan ekstrak DNA Salmon berkualitas tinggi untuk peremajaan sel kulit saat tidur.', '["Meremajakan kulit saat tidur dan memperbaiki skin barrier","Meningkatkan kelembapan instan hingga 300%","Mengurangi tanda penuaan dini dan garis halus"]', '["Salmon DNA Extract","Egg Yolk Extract","Sodium PCA","Gold Peptide"]', '["Campurkan gel dan ekstrak telur dalam wadah masker","Oleskan secara merata ke seluruh wajah dan leher","Biarkan semalaman dan bilas di pagi hari"]', 1, 0, NULL, NULL, NULL, 0, 7, NULL, NOW(), NOW()),

('lip-cream-matte', 'Velvet Lip Cream Matte 8 Shades', 'Transferproof · Ringan di bibir seharian.', 'syb-velvet-lip-cream-matte-8-shades-transferproof-lipcream', 'Kecantikan/Bibir', 'Makeup', 'Lip Cream', 22748.00, 48400.00, 'Active', 19500, NULL, 'products/lip-cream-matte.jpg', '["products/lip-cream-matte.jpg"]', 'Lip cream velvet matte dengan pigmentasi intens dalam sekali pulas, tidak membuat bibir kering berkat kandungan Vitamin E.', '["Formula transferproof tahan hingga 16 jam","Tekstur seringan awan (airy velvet)","Dilengkapi Vitamin E untuk merawat bibir"]', '["Vitamin E","Dimethicone Crosspolymer","Isododecane","Natural Pigments"]', '["Aplikasikan mulai dari bagian tengah bibir ke arah luar, tunggu 60 detik hingga set"]', 0, 0, NULL, NULL, NULL, 0, 7, NULL, NOW(), NOW()),

('lippy-oil-serum', 'Vitamin Lippy Oil Serum', 'Jojoba Oil · Serum bibir plump & lembap alami.', '1-000-dapat-2pcs-new-syb-vitamin-lippy-oil-serum-serum-bibir-with-jojoba-oil-1pc-lippyserum', 'Kecantikan/Bibir', 'Makeup', 'Lip Serum', 46060.00, 98000.00, 'Active', 31000, NULL, 'products/lippy-oil-serum.jpg', '["products/lippy-oil-serum.jpg"]', 'Serum bibir intensif yang berubah warna mengikuti pH bibir untuk rona pink natural yang merawat bibir kering dan hitam.', '["Mencerahkan bibir gelap menjadi pink alami","Mengatasi bibir pecah-pecah seketika","Memberikan kilau juicy tahan lama"]', '["Jojoba Seed Oil","Sweet Almond Oil","Tocopheryl Acetate (Vit E)","Rosehip Oil"]', '["Oleskan tipis-tipis pada bibir setiap sebelum tidur atau sebagai lip topper"]', 0, 0, NULL, NULL, NULL, 0, 7, NULL, NOW(), NOW()),

('jelly-mask', 'SYB Soothing Jelly Mask 5 Varian', '5 varian ekstrak alami · Menenangkan kulit lelah.', 'syb-jelly-mask-5-varian-calming-refreshing-hydrating-jellymask', 'Kecantikan/Perawatan Wajah', 'Wajah', 'Masker Wajah', 27965.00, 59500.00, 'Active', 18000, NULL, 'products/jelly-mask.jpg', '["products/jelly-mask.jpg"]', 'Masker jeli dingin menyegarkan dengan 5 pilihan ekstrak alami: Centella, Tea Tree, Watermelon, Honey, dan Rose.', '["Meredakan iritasi dan kemerahan akibat terbakar matahari","Memberikan sensasi cooling seketika","Menghidrasi kulit kering secara mendalam"]', '["Centella Asiatica","Tea Tree Leaf Oil","Watermelon Extract","Cucumber Juice"]', '["Simpan di kulkas sebelum dipakai, aplikasikan tebal pada wajah selama 15 menit"]', 0, 0, NULL, NULL, NULL, 0, 7, NULL, NOW(), NOW()),

('peeling-serum', 'SYB Daily Peeling Serum', 'AHA BHA PHA · 20ml eksfoliasi komedo & pori-pori.', 'new-syb-daily-peeling-serum-aha-bha-pha-20ml-peelingserum', 'Kecantikan/Perawatan Wajah', 'Wajah', 'Peeling Serum', 35895.00, 76372.00, 'Active', 22000, NULL, 'products/peeling-serum.jpg', '["products/peeling-serum.jpg"]', 'Serum eksfoliasi harian dengan kombinasi Triple Acid (AHA 3%, BHA 1%, PHA 2%) yang lembut untuk membersihkan komedo.', '["Membersihkan pori tersumbat dan komedo","Memperhalus tekstur kulit bruntusan","Mencegah timbulnya jerawat baru"]', '["Lactic Acid","Salicylic Acid","Lactobionic Acid","Chamomile Extract"]', '["Oleskan pada wajah bersih di malam hari 2-3 kali seminggu","Diamkan selama 10 menit lalu bilas bersih dengan air hangat"]', 0, 0, NULL, NULL, NULL, 0, 7, NULL, NOW(), NOW()),

('body-serum-booster', 'Bright & White Body Serum Booster', 'Glutathione 2% · 180ml body serum tone up seketika.', 'syb-bright-white-body-serum-booster-glutathione-tone-up-bodyserum', 'Perawatan Tubuh/Perawatan Kulit', 'Tubuh', 'Body Serum', 40903.00, 87028.00, 'Active', 27000, 'New', 'products/body-serum-booster.jpg', '["products/body-serum-booster.jpg"]', 'Serum tubuh dengan konsentrasi tinggi Glutathione dan Vitamin C untuk mencerahkan kulit tubuh secara merata.', '["Efek tone up alami tanpa meninggalkan residu abu-abu","Melindungi dari sinar UV berbahaya","Wangi tahan hingga 12 jam"]', '["Glutathione 2%","Niacinamide","UV Filter Titanium Dioxide","Shea Butter"]', '["Oleskan merata pada seluruh tangan dan kaki setiap pagi sebelum beraktivitas"]', 0, 0, NULL, NULL, NULL, 0, 7, NULL, NOW(), NOW()),

('powder-mask', 'SYB Powder Mask Masker Bubuk 5 Varian', 'Niacinamide & Glycolic Acid · Sensasi spa di rumah.', 'new-syb-powder-mask-5-varian', 'Kecantikan/Perawatan Wajah', 'Wajah', 'Masker Bubuk', 24938.00, 53060.00, 'Active', 35000, NULL, 'products/powder-mask.jpg', '["products/powder-mask.jpg"]', 'Masker bubuk alami dengan sensasi dingin mint dan kandungan Niacinamide untuk detox pori dan relaksasi kulit wajah.', '["Menyerap minyak berlebih dan detox komedo","Sensasi dingin relaksasi kulit lelah","Wajah terasa halus dan segar seketika"]', '["Kaolin Clay","Peppermint Extract","Niacinamide","Tea Tree Leaf Oil"]', '["Campur bubuk masker dengan air mawar secukupnya, oleskan dan diamkan 15 menit"]', 0, 0, NULL, NULL, NULL, 0, 7, NULL, NOW(), NOW()),

('glow-fresh-bundle', 'Paket Bundling Glow & Fresh', 'AHA Toner + Red Jelly + Peeling Serum ritual glowing 3-in-1.', 'syb-paket-bundling-glow-fresh-aha-toner-peeling-gel-milk-snail-brightening-glow-serum-aha-toner-peeling-snail-brightening-glow-serum', 'Paket Ritual Bundling', 'Paket Ritual', 'Bundle', 88042.00, 187324.00, 'Active', 8500, 'Bundling', 'products/glow-fresh-bundle.jpg', '["products/glow-fresh-bundle.jpg"]', 'Paket ritual kecantikan lengkap 3-in-1 favorit para beauty enthusiast untuk wajah cerah dan tubuh mulus bebas daki.', '["Hemat hingga 50% dibanding membeli satuan","Kombinasi bahan aktif yang saling bersinergi","Bonus box packaging eksklusif SYB"]', '["Niacinamide 10%","Glycolic Acid","Vitamin C","Collagen Peptides"]', '["Pagi: Bersihkan badan dengan AHA Toner, lalu gunakan Red Jelly pada wajah","Malam: Gunakan Peeling Serum 2x seminggu, lalu kunci kelembapan dengan Red Jelly"]', 1, 0, NULL, NULL, NULL, 0, 7, NULL, NOW(), NOW());

-- ------------------------------------------------------------
-- 5. PRODUCT VARIANTS
-- ------------------------------------------------------------
REPLACE INTO `product_variants` (`id`, `product_id`, `name`, `price`, `sku`, `stock`) VALUES
('var-rj-1', 'red-jelly-serum', '20ml Regular Glass Bottle', 22325.00, 'SYB-RJ-20', 32000),
('var-rj-2', 'red-jelly-serum', '50ml Jumbo Refill Pack', 49000.00, 'SYB-RJ-50', 15200),
('var-rj-3', 'red-jelly-serum', '2x 20ml Twin Value Pack', 39900.00, 'SYB-RJ-TWIN', 7000),
('var-toner-1', 'aha-body-toner', '250ml Full Bottle', 46060.00, 'SYB-AHA-250', 25000),
('var-toner-2', 'aha-body-toner', 'Bundling 2x 250ml Hemat', 85000.00, 'SYB-AHA-TWIN', 12000),
('var-lip-1', 'lip-cream-matte', 'Shade 01 Nude Velvet', 22748.00, 'SYB-LIP-01', 5000),
('var-lip-2', 'lip-cream-matte', 'Shade 06 Terrable (Best Seller)', 22748.00, 'SYB-LIP-06', 8500),
('var-lip-3', 'lip-cream-matte', 'Shade 08 Berry Rose', 22748.00, 'SYB-LIP-08', 6000),
('var-powder-1', 'powder-mask', 'Peppermint Cooling Spa', 24938.00, 'SYB-PWM-MINT', 12000),
('var-powder-2', 'powder-mask', 'Strawberry Glow Up', 24938.00, 'SYB-PWM-STR', 11000),
('var-powder-3', 'powder-mask', 'Charcoal Deep Detox', 24938.00, 'SYB-PWM-CHR', 12000);

-- ------------------------------------------------------------
-- 6. PRODUCT REVIEWS
-- ------------------------------------------------------------
REPLACE INTO `product_reviews` (`id`, `product_id`, `author`, `avatar`, `city`, `rating`, `comment`, `verified`, `skin_type`, `created_at`) VALUES
('rev-1', 'red-jelly-serum', 'Clara Anindya', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', 'Jakarta Selatan', 5, 'Udah botol ke-3! Tekstur jellynya beneran melting di kulit. Pori-pori aku yang tadinya kelihatan gede sekarang jadi samar banget!', 1, 'Kombinasi & Kusam', NOW()),
('rev-2', 'aha-body-toner', 'Nabila Putri S.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80', 'Surabaya', 5, 'Daki di leher dan siku langsung rontok di kapas pas pertama coba! Wanginya seger bgt kaya parfum mewah, wajib repurchase!', 1, 'Kulit Tubuh Belang', NOW()),
('rev-3', 'glow-fresh-bundle', 'Tiara Maulida', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80', 'Bandung', 5, 'Worth it parah buat harga segini dapet 3 produk kualitas juara! Packingnya super cute dapet pouch pink lagi!', 1, 'Normal to Dry', NOW()),
('rev-4', 'lip-cream-matte', 'Felicia Tan', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80', 'Medan', 5, 'Shade 06 Terrable beneran MLBB terbaik buat undertone hangat. Ga bikin bibir kering ngelupas seharian dipakai makan!', 1, 'Bibir Kering', NOW()),
('rev-5', 'golden-egg-mask', 'Siti Nurhaliza', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80', 'Semarang', 5, 'Sleeping mask golden egg ini penyelamat kalau besoknya mau kondangan. Bangun tidur muka auto glowing licin!', 1, 'Kering & Mengelupas', NOW()),
('rev-6', 'lippy-oil-serum', 'Amalia Kusuma', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80', 'Yogyakarta', 5, 'Warnanya natural banget ngikutin warna bibir jadi pink sehat merona. Bibir pecah-pecah langsung sembuh!', 1, 'Bibir Hitam & Pecah', NOW());

-- ------------------------------------------------------------
-- 7. FLASH SALE SETTINGS
-- ------------------------------------------------------------
REPLACE INTO `flash_sale_settings` (`id`, `is_master_active`, `end_hour`, `end_minute`, `title`, `subtitle`, `updated_at`) VALUES
(1, 1, 24, 0, '⚡ FLASH SALE GLOWING SPESIAL ⚡', 'Penawaran Terbatas Hari Ini — Diskon Eksklusif Hingga 50%', NOW());

-- ------------------------------------------------------------
-- 8. FLASH SALE SESSIONS
-- ------------------------------------------------------------
REPLACE INTO `flash_sale_sessions` (`id`, `title`, `subtitle`, `start_date`, `start_time`, `end_date`, `end_time`, `is_active`, `created_at`) VALUES
('sess-morning', 'Flash Sale Sesi Pagi', 'Awali hari dengan kulit glowing segar', '2026-01-01', '00:00', '2026-12-31', '12:00', 1, NOW()),
('sess-evening', 'Flash Sale Sesi Malam', 'Perawatan intensif malam hari harga heboh', '2026-01-01', '12:00', '2026-12-31', '24:00', 1, NOW());

-- ------------------------------------------------------------
-- 9. FLASH SALE ITEMS
-- ------------------------------------------------------------
REPLACE INTO `flash_sale_items` (`id`, `session_id`, `product_id`, `discount_percent`, `flash_sale_price`, `quota`, `sold`) VALUES
(1, 'sess-morning', 'red-jelly-serum', 53, 22325.00, 100, 42),
(2, 'sess-morning', 'aha-body-toner', 53, 46060.00, 80, 27),
(3, 'sess-evening', 'golden-egg-mask', 53, 72380.00, 50, 19),
(4, 'sess-evening', 'peeling-serum', 53, 35895.00, 60, 31);

-- ------------------------------------------------------------
-- 10. RESELLER PRODUCTS (Wholesale Packages)
-- ------------------------------------------------------------
REPLACE INTO `reseller_products` (`id`, `name`, `category`, `badge`, `image`, `min_order_qty`, `wholesale_price`, `retail_price`, `profit_margin`, `description`, `features`, `created_at`) VALUES
('res-starter-1', 'Paket Reseller Pemula (Starter Kit)', 'Starter Kit', 'Paling Populer', 'products/glow-fresh-bundle.jpg', 12, 15000.00, 25000.00, 40, 'Paket awal untuk memulai bisnis skincare modal minim dengan margin keuntungan hingga 40%.', '["Minimal order hanya 12 pcs bebas campur varian","Gratis materi promosi foto & video HD siap posting","Bimbingan cara jualan online via grup telegram resmi","100% Terdaftar BPOM RI & Halal"]', NOW()),
('res-silver-2', 'Paket Agen Silver (Grosir Menengah)', 'Kartonan', 'Best Value', 'products/aha-body-toner.jpg', 50, 12500.00, 25000.00, 50, 'Paket grosir untuk toko kosmetik atau reseller aktif dengan harga tangan pertama langsung pabrik.', '["Minimal order 50 pcs","Harga modal jauh lebih murah (Margin 50%)","Prioritas pengiriman cepat dari gudang pusat","Spanduk / Banner promosi toko gratis"]', NOW()),
('res-distributor-3', 'Paket Distributor Wilayah (Exclusive)', 'Paket Wajah', 'Exclusive', 'products/red-jelly-serum.jpg', 250, 10000.00, 25000.00, 60, 'Tingkat kemitraan distributor tertinggi dengan proteksi area penjualan dan subsidi ongkir se-Indonesia.', '["Minimal order 250 pcs","Harga terendah langsung pabrik PT Sheva Jordan Bersama","Subsidi ongkos kirim cargo ke seluruh Indonesia","Sertifikat kemitraan resmi bertandatangan direksi"]', NOW());

-- ------------------------------------------------------------
-- 11. DISCOUNT COUPONS & VOUCHERS
-- ------------------------------------------------------------
REPLACE INTO `discounts` (`id`, `code`, `description`, `discount_type`, `discount_value`, `min_spend`, `max_discount`, `usage_limit`, `used_count`, `start_date`, `end_date`, `is_active`, `created_at`) VALUES
('disc-glow10', 'GLOWUP10', 'Diskon 10% Spesial Pelanggan Baru', 'percentage', 10.00, 50000.00, 20000.00, 500, 0, '2026-01-01', '2026-12-31', 1, NOW()),
('disc-cantik20', 'CANTIK20', 'Diskon 20% Pembelian Minimal 100rb', 'percentage', 20.00, 100000.00, 50000.00, 300, 0, '2026-01-01', '2026-12-31', 1, NOW()),
('disc-freeongkir', 'ONGKIRFREE', 'Potongan Ongkir Rp15.000', 'fixed', 15000.00, 75000.00, 15000.00, 200, 0, '2026-01-01', '2026-12-31', 1, NOW());

-- ------------------------------------------------------------
-- 12. SAMPLE ORDERS & ORDER ITEMS (For Admin Dashboard & Thermal Shipping)
-- ------------------------------------------------------------
REPLACE INTO `orders` (`id`, `order_number`, `user_id`, `customer_name`, `customer_email`, `customer_phone`, `shipping_address`, `shipping_courier`, `shipping_service`, `shipping_cost`, `shipping_etd`, `subtotal`, `discount_code`, `discount_amount`, `grand_total`, `payment_method`, `payment_status`, `order_status`, `awb_number`, `notes`, `created_at`, `updated_at`) VALUES
('ord-1001', 'ORD-20261113-001', 'usr-cust-1', 'Aulia Rahmawati', 'aulia.r@gmail.com', '081234567890', 'Jl. Kemang Raya No. 45 RT 02/RW 05, Mampang Prapatan, Jakarta Selatan, DKI Jakarta 12730', 'JNE', 'JNE Reguler (REG)', 11000.00, '2-3 Hari', 68385.00, 'GLOWUP10', 6838.00, 72547.00, 'BCA Virtual Account', 'paid', 'processing', 'JNE-PENDING', 'Mohon dipacking dengan bubble wrap tebal', NOW(), NOW()),

('ord-1002', 'ORD-20261113-002', 'usr-cust-2', 'Budi Santoso', 'budi.santoso@gmail.com', '081398765432', 'Jl. HR Muhammad No. 88, Ruko Golden Palace Blok B-2, Sukomanunggal, Surabaya, Jawa Timur 60189', 'J&T', 'J&T Express (EZ)', 12000.00, '1-2 Hari', 92120.00, NULL, 0.00, 104120.00, 'Mandiri Virtual Account', 'paid', 'processing', 'JT-PENDING', 'Kirim saat jam kantor buka', NOW(), NOW()),

('ord-1003', 'ORD-20261113-003', 'usr-cust-1', 'Siti Nurhaliza', 'siti.nur@gmail.com', '081567890123', 'Jl. Pahlawan No. 12, Semarang Tengah, Semarang, Jawa Tengah 50134', 'JNE', 'JNE YES (Yakin Esok Sampai)', 22000.00, '1 Hari', 118440.00, 'CANTIK20', 23688.00, 116752.00, 'QRIS', 'paid', 'processing', 'JNE-PENDING', 'Urgent kado ulang tahun sahabat', NOW(), NOW());

REPLACE INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `variant_name`, `image`, `price`, `quantity`, `total`, `is_pre_order`, `pre_order_days`) VALUES
(1, 'ord-1001', 'red-jelly-serum', 'FORTE Red Jelly Serum', '20ml Regular Glass Bottle', 'products/red-jelly-serum.jpg', 22325.00, 1, 22325.00, 0, NULL),
(2, 'ord-1001', 'aha-body-toner', 'AHA Skinboost Body Toner', '250ml Full Bottle', 'products/aha-body-toner.jpg', 46060.00, 1, 46060.00, 0, NULL),
(3, 'ord-1002', 'aha-body-toner', 'AHA Skinboost Body Toner', 'Bundling 2x 250ml Hemat', 'products/aha-body-toner.jpg', 46060.00, 2, 92120.00, 0, NULL),
(4, 'ord-1003', 'golden-egg-mask', 'Bright Glow Jelly Mask Golden Egg', 'DNA Salmon Deluxe', 'products/golden-egg-mask.jpg', 72380.00, 1, 72380.00, 0, NULL),
(5, 'ord-1003', 'lippy-oil-serum', 'Vitamin Lippy Oil Serum', 'Standard Unit', 'products/lippy-oil-serum.jpg', 46060.00, 1, 46060.00, 0, NULL);

SET FOREIGN_KEY_CHECKS = 1;

