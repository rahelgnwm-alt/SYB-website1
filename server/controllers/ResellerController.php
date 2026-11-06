<?php
/**
 * SYB Official Store - Reseller & Wholesale Controller
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

class ResellerController {
    public static function index(): void {
        $pdo = getDbConnection();
        $stmt = $pdo->query("SELECT * FROM reseller_products ORDER BY min_order_qty ASC");
        $products = $stmt->fetchAll();

        foreach ($products as &$p) {
            $p['minOrderQty'] = (int)$p['min_order_qty'];
            $p['wholesalePrice'] = (float)$p['wholesale_price'];
            $p['retailPrice'] = (float)$p['retail_price'];
            $p['profitMargin'] = (int)$p['profit_margin'];
            $p['features'] = json_decode($p['features'] ?: '[]', true);
        }

        sendSuccess($products);
    }

    public static function store(): void {
        requireAdmin();
        $input = getJsonInput();

        $id = $input['id'] ?? ('res-' . bin2hex(random_bytes(5)));
        $name = trim($input['name'] ?? '');
        $category = trim($input['category'] ?? 'Paket Kemitraan');
        $badge = $input['badge'] ?? null;
        $image = $input['image'] ?? 'products/glow-fresh-bundle.jpg';
        $minQty = (int)($input['minOrderQty'] ?? ($input['min_order_qty'] ?? 12));
        $wholesale = (float)($input['wholesalePrice'] ?? ($input['wholesale_price'] ?? 0));
        $retail = (float)($input['retailPrice'] ?? ($input['retail_price'] ?? 0));
        $profit = (int)($input['profitMargin'] ?? ($input['profit_margin'] ?? 35));
        $desc = $input['description'] ?? '';
        $features = json_encode($input['features'] ?? []);

        if (empty($name)) {
            sendError('Nama paket reseller wajib diisi.');
        }

        $pdo = getDbConnection();
        $stmt = $pdo->prepare("REPLACE INTO reseller_products 
            (id, name, category, badge, image, min_order_qty, wholesale_price, retail_price, profit_margin, description, features) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $name, $category, $badge, $image, $minQty, $wholesale, $retail, $profit, $desc, $features]);

        sendSuccess(['id' => $id], 'Paket reseller berhasil disimpan.', 201);
    }

    public static function destroy(string $id): void {
        requireAdmin();
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("DELETE FROM reseller_products WHERE id = ?");
        $stmt->execute([$id]);
        sendSuccess(null, 'Paket reseller berhasil dihapus.');
    }

    public static function register(): void {
        $input = getJsonInput();

        $fullName = trim($input['fullName'] ?? ($input['full_name'] ?? ''));
        $email = strtolower(trim($input['email'] ?? ''));
        $phone = trim($input['phone'] ?? '');
        $city = trim($input['city'] ?? '');
        $province = trim($input['province'] ?? '');
        $businessType = trim($input['businessType'] ?? ($input['business_type'] ?? 'Toko Online'));
        $experience = trim($input['experience'] ?? '');
        $socialMedia = trim($input['socialMedia'] ?? ($input['social_media'] ?? ''));

        if (empty($fullName) || empty($phone) || empty($city)) {
            sendError('Nama lengkap, nomor WhatsApp, dan kota wajib diisi.');
        }

        $id = 'app-' . date('Ymd') . '-' . substr(uniqid(), -4);
        $pdo = getDbConnection();

        $stmt = $pdo->prepare("INSERT INTO reseller_applications 
            (id, full_name, email, phone, city, province, business_type, experience, social_media, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')");
        $stmt->execute([$id, $fullName, $email, $phone, $city, $province, $businessType, $experience, $socialMedia]);

        sendSuccess([
            'id' => $id,
            'message' => 'Pendaftaran program reseller SYB berhasil diterima. Tim kemitraan kami akan menghubungi Anda via WhatsApp!'
        ], 'Pendaftaran reseller berhasil dikirim.', 201);
    }

    public static function applications(): void {
        requireAdmin();
        $pdo = getDbConnection();
        $stmt = $pdo->query("SELECT * FROM reseller_applications ORDER BY created_at DESC");
        sendSuccess($stmt->fetchAll());
    }
}

