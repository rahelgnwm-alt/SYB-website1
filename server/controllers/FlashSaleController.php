<?php
/**
 * SYB Official Store - Flash Sale Controller
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

class FlashSaleController {
    /**
     * Public endpoint: Get currently live active Flash Sale session
     */
    public static function live(): void {
        $pdo = getDbConnection();

        // 1. Check master switch
        $settings = $pdo->query("SELECT * FROM flash_sale_settings WHERE id = 1")->fetch();
        if (!$settings || empty($settings['is_master_active'])) {
            self::syncFlashSaleStateToProducts($pdo, []);
            sendSuccess([
                'live'     => false,
                'settings' => $settings,
                'session'  => null,
                'items'    => []
            ]);
        }

        // 2. Find sessions that are currently ongoing
        $today = date('Y-m-d');
        $nowTime = date('H:i:s');

        $stmt = $pdo->prepare("SELECT * FROM flash_sale_sessions 
            WHERE is_active = 1 
              AND (
                (start_date < ? AND end_date > ?)
                OR (start_date = ? AND end_date = ? AND start_time <= ? AND end_time >= ?)
                OR (start_date = ? AND end_date > ? AND start_time <= ?)
                OR (start_date < ? AND end_date = ? AND end_time >= ?)
              )
            ORDER BY created_at DESC LIMIT 1");

        $stmt->execute([
            $today, $today,
            $today, $today, $nowTime, $nowTime,
            $today, $today, $nowTime,
            $today, $today, $nowTime
        ]);
        $session = $stmt->fetch();

        if (!$session) {
            self::syncFlashSaleStateToProducts($pdo, []);
            sendSuccess([
                'live'     => false,
                'settings' => $settings,
                'session'  => null,
                'items'    => []
            ]);
        }

        // 3. Fetch products in this session
        $itemStmt = $pdo->prepare("SELECT fi.*, p.title as product_name, p.image, p.price as regular_price, p.original_price
            FROM flash_sale_items fi
            JOIN products p ON p.id = fi.product_id
            WHERE fi.session_id = ?");
        $itemStmt->execute([$session['id']]);
        $items = $itemStmt->fetchAll();

        // If session has 0 items, it is considered empty/inactive
        if (empty($items)) {
            self::syncFlashSaleStateToProducts($pdo, []);
            sendSuccess([
                'live'     => false,
                'settings' => $settings,
                'session'  => $session,
                'items'    => []
            ]);
        }

        // Convert numeric values
        $activeProductIds = [];
        foreach ($items as &$it) {
            $it['discountPercent'] = (int)$it['discount_percent'];
            $it['flashSalePrice'] = (float)$it['flash_sale_price'];
            $it['quota'] = (int)$it['quota'];
            $it['sold'] = (int)$it['sold'];
            $it['regularPrice'] = (float)$it['regular_price'];
            $activeProductIds[] = $it['product_id'];
        }

        // Synchronize products table: set is_flash_sale = 1 for enrolled items, 0 for others
        self::syncFlashSaleStateToProducts($pdo, $items);

        sendSuccess([
            'live'     => true,
            'settings' => $settings,
            'session'  => $session,
            'items'    => $items
        ]);
    }

    private static function syncFlashSaleStateToProducts(PDO $pdo, array $activeItems): void {
        if (empty($activeItems)) {
            $pdo->exec("UPDATE products SET is_flash_sale = 0, flash_sale_price = NULL, flash_sale_discount = NULL, flash_sale_quota = NULL WHERE is_flash_sale = 1");
            return;
        }

        $activeMap = [];
        foreach ($activeItems as $it) {
            $activeMap[$it['product_id'] ?? $it['productId']] = $it;
        }

        // Reset products not in the active session
        $ids = array_keys($activeMap);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $resetStmt = $pdo->prepare("UPDATE products SET is_flash_sale = 0 WHERE id NOT IN ($placeholders) AND is_flash_sale = 1");
        $resetStmt->execute($ids);

        // Update active ones
        $upd = $pdo->prepare("UPDATE products SET is_flash_sale = 1, flash_sale_price = ?, flash_sale_discount = ?, flash_sale_quota = ? WHERE id = ?");
        foreach ($activeMap as $pid => $it) {
            $upd->execute([
                $it['flashSalePrice'] ?? ($it['flash_sale_price'] ?? 0),
                $it['discountPercent'] ?? ($it['discount_percent'] ?? 50),
                $it['quota'] ?? 50,
                $pid
            ]);
        }
    }

    public static function getSessions(): void {
        requireAdmin();
        $pdo = getDbConnection();

        $stmt = $pdo->query("SELECT * FROM flash_sale_sessions ORDER BY created_at DESC");
        $sessions = $stmt->fetchAll();

        $itemStmt = $pdo->prepare("SELECT fi.*, p.title as product_name, p.image, p.price as regular_price, p.original_price
            FROM flash_sale_items fi
            LEFT JOIN products p ON p.id = fi.product_id
            WHERE fi.session_id = ?");

        foreach ($sessions as &$s) {
            $itemStmt->execute([$s['id']]);
            $items = $itemStmt->fetchAll();
            foreach ($items as &$it) {
                $it['discountPercent'] = (int)$it['discount_percent'];
                $it['flashSalePrice'] = (float)$it['flash_sale_price'];
                $it['quota'] = (int)$it['quota'];
                $it['sold'] = (int)$it['sold'];
            }
            $s['items'] = $items;
            $s['isActive'] = (bool)$s['is_active'];
        }

        $settings = $pdo->query("SELECT * FROM flash_sale_settings WHERE id = 1")->fetch();

        sendSuccess([
            'settings' => $settings,
            'sessions' => $sessions
        ]);
    }

    public static function saveSession(): void {
        requireAdmin();
        $input = getJsonInput();
        $pdo = getDbConnection();

        $id = trim($input['id'] ?? '');
        if (empty($id)) {
            $id = 'fs-' . date('Ymd') . '-' . substr(uniqid(), -4);
        }

        $title = trim($input['title'] ?? 'Sesi Flash Sale');
        $subtitle = trim($input['subtitle'] ?? 'Diskon Spesial Terbatas');
        $startDate = trim($input['startDate'] ?? ($input['start_date'] ?? date('Y-m-d')));
        $startTime = trim($input['startTime'] ?? ($input['start_time'] ?? '00:00:00'));
        $endDate = trim($input['endDate'] ?? ($input['end_date'] ?? date('Y-m-d')));
        $endTime = trim($input['endTime'] ?? ($input['end_time'] ?? '23:59:59'));
        $isActive = isset($input['isActive']) ? ($input['isActive'] ? 1 : 0) : (isset($input['is_active']) ? ($input['is_active'] ? 1 : 0) : 1);

        $stmt = $pdo->prepare("REPLACE INTO flash_sale_sessions (id, title, subtitle, start_date, start_time, end_date, end_time, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $title, $subtitle, $startDate, $startTime, $endDate, $endTime, $isActive]);

        // Replace session items
        $pdo->prepare("DELETE FROM flash_sale_items WHERE session_id = ?")->execute([$id]);

        $items = $input['items'] ?? [];
        if (!empty($items) && is_array($items)) {
            $ins = $pdo->prepare("INSERT INTO flash_sale_items (session_id, product_id, discount_percent, flash_sale_price, quota, sold) VALUES (?, ?, ?, ?, ?, ?)");
            foreach ($items as $it) {
                $pid = $it['productId'] ?? ($it['product_id'] ?? '');
                if (!$pid) continue;
                $disc = (int)($it['discountPercent'] ?? ($it['discount_percent'] ?? 50));
                $price = (float)($it['flashSalePrice'] ?? ($it['flash_sale_price'] ?? 0));
                $quota = (int)($it['quota'] ?? 50);
                $sold = (int)($it['sold'] ?? 0);
                $ins->execute([$id, $pid, $disc, $price, $quota, $sold]);
            }
        }

        sendSuccess(['id' => $id], 'Sesi flash sale berhasil disimpan.');
    }

    public static function deleteSession(string $id): void {
        requireAdmin();
        $pdo = getDbConnection();
        $pdo->prepare("DELETE FROM flash_sale_items WHERE session_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM flash_sale_sessions WHERE id = ?")->execute([$id]);
        sendSuccess(null, 'Sesi flash sale berhasil dihapus.');
    }

    public static function toggleMaster(): void {
        requireAdmin();
        $input = getJsonInput();
        $pdo = getDbConnection();

        $active = isset($input['active']) ? ($input['active'] ? 1 : 0) : null;
        if ($active === null) {
            $curr = $pdo->query("SELECT is_master_active FROM flash_sale_settings WHERE id = 1")->fetchColumn();
            $active = $curr ? 0 : 1;
        }

        $pdo->prepare("UPDATE flash_sale_settings SET is_master_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1")->execute([$active]);

        if (!$active) {
            self::syncFlashSaleStateToProducts($pdo, []);
        }

        sendSuccess(['is_master_active' => (bool)$active], 'Master flash sale switch berhasil diperbarui.');
    }
}
