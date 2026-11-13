<?php
/**
 * SYB Official Store - Products & Catalog Controller
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

class ProductController {
    private const MAX_GALLERY_IMAGES = 10;

    private static function normalizeGallery($rawGallery, ?string $primaryImage = null): array {
        $list = [];
        if (is_array($rawGallery)) {
            $list = $rawGallery;
        } elseif (is_string($rawGallery)) {
            $trimmed = trim($rawGallery);
            if ($trimmed !== '' && $trimmed !== '[]') {
                $decoded = json_decode($trimmed, true);
                $list = is_array($decoded) ? $decoded : [$trimmed];
            }
        }

        $result = [];
        $seen = [];
        foreach ($list as $item) {
            if (!is_string($item)) continue;
            $val = trim($item);
            if ($val === '' || isset($seen[$val])) continue;
            $seen[$val] = true;
            $result[] = $val;
            if (count($result) >= self::MAX_GALLERY_IMAGES) break;
        }

        $primary = $primaryImage !== null ? trim($primaryImage) : '';
        if ($primary !== '' && !isset($seen[$primary])) {
            array_unshift($result, $primary);
            $result = array_slice($result, 0, self::MAX_GALLERY_IMAGES);
        }

        return $result;
    }

    public static function index(): void {
        $pdo = getDbConnection();

        // Auto-seed initial catalog into SQL if database is fresh/empty
        try {
            $cnt = (int)$pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
            if ($cnt === 0) {
                require_once __DIR__ . '/../seed.php';
                runSeeder();
            }
        } catch (Exception $e) {
            // Ignore error if schema is creating
        }

        $cat = $_GET['category'] ?? 'Semua';
        $q = trim($_GET['q'] ?? '');
        $sort = $_GET['sort'] ?? 'featured';
        $status = $_GET['status'] ?? 'Active'; // 'all' for admin

        $params = [];
        $where = [];

        if ($status !== 'all') {
            $where[] = "status = ?";
            $params[] = $status;
        }

        if ($cat !== 'Semua' && !empty($cat)) {
            $where[] = "(category_label = ? OR category = ?)";
            $params[] = $cat;
            $params[] = $cat;
        }

        if (!empty($q)) {
            $where[] = "(LOWER(title) LIKE ? OR LOWER(subtitle) LIKE ? OR LOWER(description) LIKE ?)";
            $wildcard = '%' . strtolower($q) . '%';
            $params[] = $wildcard;
            $params[] = $wildcard;
            $params[] = $wildcard;
        }

        $sql = "SELECT * FROM products";
        if (!empty($where)) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        switch ($sort) {
            case 'price-asc':
                $sql .= " ORDER BY price ASC";
                break;
            case 'price-desc':
                $sql .= " ORDER BY price DESC";
                break;
            case 'discount':
                $sql .= " ORDER BY ((original_price - price) / original_price) DESC";
                break;
            case 'rating':
            case 'featured':
            default:
                $sql .= " ORDER BY is_featured DESC, created_at DESC";
                break;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $products = $stmt->fetchAll();

        // Decode JSON fields and attach variants
        $variantStmt = $pdo->prepare("SELECT * FROM product_variants WHERE product_id = ?");
        foreach ($products as &$p) {
            $p['price'] = (float)$p['price'];
            $p['originalPrice'] = (float)$p['original_price'];
            $p['categoryLabel'] = $p['category_label'];
            $p['productType'] = $p['product_type'];
            $p['isFeatured'] = (bool)$p['is_featured'];
            $p['isFlashSale'] = (bool)$p['is_flash_sale'];
            $p['isPreOrder'] = !empty($p['is_pre_order']);
            $p['preOrderDays'] = isset($p['pre_order_days']) ? (int)$p['pre_order_days'] : 7;
            $p['preOrderNote'] = $p['pre_order_note'] ?? null;
            $p['gallery'] = self::normalizeGallery($p['gallery'] ?? [], $p['image'] ?? null);
            $p['keyBenefits'] = json_decode($p['key_benefits'] ?: '[]', true);
            $p['keyIngredients'] = json_decode($p['key_ingredients'] ?: '[]', true);
            $p['howToUse'] = json_decode($p['how_to_use'] ?: '[]', true);
            $p['benefits'] = $p['keyBenefits'];
            $p['heroTagline'] = $p['hero_tagline'] ?? $p['subtitle'];
            $p['bpomNumber'] = $p['bpom_number'] ?? 'NA18210103429';
            $p['accentColor'] = $p['accent_color'] ?? '#ff2a7a';
            $p['rating'] = (float)($p['rating'] ?? 4.9);
            $p['reviewsCount'] = (int)($p['reviews_count'] ?? 1420);
            $p['channels'] = 4;
            $p['catalogs'] = 2;

            $variantStmt->execute([$p['id']]);
            $variants = $variantStmt->fetchAll();
            foreach ($variants as &$v) {
                $v['price'] = (float)$v['price'];
            }
            $p['variants'] = $variants;
            $p['variantsCount'] = count($variants);
        }

        sendSuccess($products);
    }

    public static function show(string $id): void {
        $pdo = getDbConnection();

        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ? OR handle = ? LIMIT 1");
        $stmt->execute([$id, $id]);
        $p = $stmt->fetch();

        if (!$p) {
            sendError('Produk tidak ditemukan.', 404);
        }

        $p['price'] = (float)$p['price'];
        $p['originalPrice'] = (float)$p['original_price'];
        $p['categoryLabel'] = $p['category_label'];
        $p['productType'] = $p['product_type'];
        $p['isFeatured'] = (bool)$p['is_featured'];
        $p['isFlashSale'] = (bool)$p['is_flash_sale'];
        $p['isPreOrder'] = !empty($p['is_pre_order']);
        $p['preOrderDays'] = isset($p['pre_order_days']) ? (int)$p['pre_order_days'] : 7;
        $p['preOrderNote'] = $p['pre_order_note'] ?? null;
        $p['gallery'] = self::normalizeGallery($p['gallery'] ?? [], $p['image'] ?? null);
        $p['keyBenefits'] = json_decode($p['key_benefits'] ?: '[]', true);
        $p['keyIngredients'] = json_decode($p['key_ingredients'] ?: '[]', true);
        $p['howToUse'] = json_decode($p['how_to_use'] ?: '[]', true);
        $p['benefits'] = $p['keyBenefits'];
        $p['heroTagline'] = $p['hero_tagline'] ?? $p['subtitle'];
        $p['bpomNumber'] = $p['bpom_number'] ?? 'NA18210103429';
        $p['accentColor'] = $p['accent_color'] ?? '#ff2a7a';
        $p['rating'] = (float)($p['rating'] ?? 4.9);
        $p['reviewsCount'] = (int)($p['reviews_count'] ?? 1420);
        $p['channels'] = 4;
        $p['catalogs'] = 2;

        // Fetch variants
        $variantStmt = $pdo->prepare("SELECT * FROM product_variants WHERE product_id = ?");
        $variantStmt->execute([$p['id']]);
        $variants = $variantStmt->fetchAll();
        foreach ($variants as &$v) {
            $v['price'] = (float)$v['price'];
        }
        $p['variants'] = $variants;
        $p['variantsCount'] = count($variants);

        // Fetch reviews
        $reviewStmt = $pdo->prepare("SELECT * FROM product_reviews WHERE product_id = ? ORDER BY created_at DESC");
        $reviewStmt->execute([$p['id']]);
        $p['reviews'] = $reviewStmt->fetchAll();

        sendSuccess($p);
    }

    public static function store(): void {
        requireAdmin();
        $input = getJsonInput();

        $id = trim($input['id'] ?? '');
        if (empty($id)) {
            $id = 'prd-' . bin2hex(random_bytes(5));
        }

        $title = trim($input['title'] ?? '');
        $subtitle = trim($input['subtitle'] ?? '');
        $handle = trim($input['handle'] ?? '');
        if (empty($handle)) {
            $handle = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $title)) . '-' . substr(uniqid(), -4);
        }

        $category = trim($input['category'] ?? 'Kecantikan/Perawatan Wajah');
        $categoryLabel = trim($input['categoryLabel'] ?? ($input['category_label'] ?? 'Wajah'));
        $productType = trim($input['productType'] ?? ($input['product_type'] ?? 'Serum'));
        $price = (float)($input['price'] ?? 0);
        $originalPrice = (float)($input['originalPrice'] ?? ($input['original_price'] ?? $price));
        $status = $input['status'] ?? 'Active';
        $inventory = (int)($input['inventory'] ?? 100);
        $badge = $input['badge'] ?? null;
        $rawImage = trim((string)($input['image'] ?? ''));
        $galleryArr = self::normalizeGallery($input['gallery'] ?? [], $rawImage ?: null);
        $image = $rawImage ?: ($galleryArr[0] ?? 'products/red-jelly-serum.jpg');
        if (empty($galleryArr)) {
            $galleryArr = [$image];
        }
        $gallery = json_encode($galleryArr);
        $desc = $input['description'] ?? '';
        $benefits = json_encode($input['keyBenefits'] ?? ($input['key_benefits'] ?? []));
        $ingredients = json_encode($input['keyIngredients'] ?? ($input['key_ingredients'] ?? []));
        $howTo = json_encode($input['howToUse'] ?? ($input['how_to_use'] ?? []));
        $isFeatured = !empty($input['isFeatured'] || !empty($input['is_featured'])) ? 1 : 0;
        $isFlash = !empty($input['isFlashSale'] || !empty($input['is_flash_sale'])) ? 1 : 0;
        $isPreOrder = (!empty($input['isPreOrder']) || !empty($input['is_pre_order'])) ? 1 : 0;
        $preOrderDays = min(30, max(1, (int)($input['preOrderDays'] ?? ($input['pre_order_days'] ?? 7))));
        $preOrderNote = isset($input['preOrderNote']) ? trim((string)$input['preOrderNote']) : ($input['pre_order_note'] ?? null);

        $pdo = getDbConnection();
        $stmt = $pdo->prepare("INSERT INTO products 
            (id, title, subtitle, handle, category, category_label, product_type, price, original_price, status, inventory, badge, image, gallery, description, key_benefits, key_ingredients, how_to_use, is_featured, is_flash_sale, is_pre_order, pre_order_days, pre_order_note) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $title, $subtitle, $handle, $category, $categoryLabel, $productType, $price, $originalPrice, $status, $inventory, $badge, $image, $gallery, $desc, $benefits, $ingredients, $howTo, $isFeatured, $isFlash, $isPreOrder, $preOrderDays, $preOrderNote]);

        // Save variants if provided
        if (!empty($input['variants']) && is_array($input['variants'])) {
            $vStmt = $pdo->prepare("INSERT INTO product_variants (id, product_id, name, price, sku, stock) VALUES (?, ?, ?, ?, ?, ?)");
            foreach ($input['variants'] as $v) {
                $vid = $v['id'] ?? ('var-' . bin2hex(random_bytes(4)));
                $vStmt->execute([$vid, $id, $v['name'] ?? 'Default', (float)($v['price'] ?? $price), $v['sku'] ?? null, (int)($v['stock'] ?? 50)]);
            }
        }

        sendSuccess(['id' => $id, 'handle' => $handle], 'Produk berhasil ditambahkan.', 201);
    }

    public static function update(string $id): void {
        requireAdmin();
        $input = getJsonInput();
        $pdo = getDbConnection();

        $chk = $pdo->prepare("SELECT id FROM products WHERE id = ?");
        $chk->execute([$id]);
        if (!$chk->fetch()) {
            sendError('Produk tidak ditemukan.', 404);
        }

        $fields = [];
        $params = [];

        $map = [
            'title'               => 'title',
            'subtitle'            => 'subtitle',
            'handle'              => 'handle',
            'category'            => 'category',
            'category_label'      => 'category_label',
            'categoryLabel'       => 'category_label',
            'product_type'        => 'product_type',
            'productType'         => 'product_type',
            'price'               => 'price',
            'original_price'      => 'original_price',
            'originalPrice'       => 'original_price',
            'status'              => 'status',
            'inventory'           => 'inventory',
            'badge'               => 'badge',
            'image'               => 'image',
            'description'         => 'description',
            'is_featured'         => 'is_featured',
            'isFeatured'          => 'is_featured',
            'is_flash_sale'       => 'is_flash_sale',
            'isFlashSale'         => 'is_flash_sale',
            'flash_sale_price'    => 'flash_sale_price',
            'flashSalePrice'      => 'flash_sale_price',
            'flash_sale_discount' => 'flash_sale_discount',
            'flashSaleDiscount'   => 'flash_sale_discount',
            'flash_sale_quota'    => 'flash_sale_quota',
            'flashSaleQuota'      => 'flash_sale_quota',
            'is_pre_order'        => 'is_pre_order',
            'isPreOrder'          => 'is_pre_order',
            'pre_order_days'      => 'pre_order_days',
            'preOrderDays'        => 'pre_order_days',
            'pre_order_note'      => 'pre_order_note',
            'preOrderNote'        => 'pre_order_note',
        ];

        foreach ($map as $key => $column) {
            if (isset($input[$key])) {
                $val = $input[$key];
                if (is_bool($val)) $val = $val ? 1 : 0;
                $fields[$column] = "`{$column}` = ?";
                $params[$column] = $val;
            }
        }

        if (isset($input['gallery'])) {
            $galleryArr = self::normalizeGallery($input['gallery'], null);
            $fields['gallery'] = "`gallery` = ?";
            $params['gallery'] = json_encode($galleryArr);
            if (!isset($input['image']) && !empty($galleryArr)) {
                $fields['image'] = "`image` = ?";
                $params['image'] = $galleryArr[0];
            }
        }
        if (isset($input['keyBenefits']) || isset($input['key_benefits'])) {
            $fields['key_benefits'] = "`key_benefits` = ?";
            $params['key_benefits'] = json_encode($input['keyBenefits'] ?? $input['key_benefits']);
        }
        if (isset($input['keyIngredients']) || isset($input['key_ingredients'])) {
            $fields['key_ingredients'] = "`key_ingredients` = ?";
            $params['key_ingredients'] = json_encode($input['keyIngredients'] ?? $input['key_ingredients']);
        }
        if (isset($input['howToUse']) || isset($input['how_to_use'])) {
            $fields['how_to_use'] = "`how_to_use` = ?";
            $params['how_to_use'] = json_encode($input['howToUse'] ?? $input['how_to_use']);
        }

        if (!empty($fields)) {
            $sql = "UPDATE products SET " . implode(', ', array_values($fields)) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
            $paramsList = array_values($params);
            $paramsList[] = $id;
            $stmt = $pdo->prepare($sql);
            $stmt->execute($paramsList);
        }

        // Update variants if passed
        if (isset($input['variants']) && is_array($input['variants'])) {
            $pdo->prepare("DELETE FROM product_variants WHERE product_id = ?")->execute([$id]);
            $vStmt = $pdo->prepare("INSERT INTO product_variants (id, product_id, name, price, sku, stock) VALUES (?, ?, ?, ?, ?, ?)");
            foreach ($input['variants'] as $v) {
                $vid = $v['id'] ?? ('var-' . bin2hex(random_bytes(4)));
                $vStmt->execute([$vid, $id, $v['name'] ?? 'Default', (float)($v['price'] ?? 0), $v['sku'] ?? null, (int)($v['stock'] ?? 50)]);
            }
        }

        sendSuccess(['id' => $id], 'Produk berhasil diperbarui.');
    }

    public static function destroy(string $id): void {
        requireAdmin();
        $pdo = getDbConnection();
        $pdo->prepare("DELETE FROM product_variants WHERE product_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM product_reviews WHERE product_id = ?")->execute([$id]);
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);
        sendSuccess(null, 'Produk berhasil dihapus.');
    }

    public static function addReview(string $productId): void {
        $input = getJsonInput();
        $author = trim($input['author'] ?? '');
        $rating = (int)($input['rating'] ?? 5);
        $comment = trim($input['comment'] ?? '');
        $city = trim($input['city'] ?? '');
        $skinType = trim($input['skinType'] ?? ($input['skin_type'] ?? ''));

        if (empty($author) || empty($comment)) {
            sendError('Nama dan ulasan wajib diisi.');
        }

        $id = 'rev-' . bin2hex(random_bytes(5));
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("INSERT INTO product_reviews (id, product_id, author, city, rating, comment, verified, skin_type) VALUES (?, ?, ?, ?, ?, ?, 1, ?)");
        $stmt->execute([$id, $productId, $author, $city, $rating, $comment, $skinType]);

        sendSuccess(['id' => $id], 'Ulasan Anda berhasil dikirimkan.', 201);
    }

    public static function categories(): void {
        $pdo = getDbConnection();
        $stmt = $pdo->query("SELECT * FROM categories ORDER BY display_order ASC");
        sendSuccess($stmt->fetchAll());
    }
}

