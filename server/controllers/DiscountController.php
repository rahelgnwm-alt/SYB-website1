<?php
/**
 * SYB Official Store - Discount & Voucher Controller
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

class DiscountController {
    public static function validateCode(): void {
        $input = getJsonInput();
        $code = strtoupper(trim($input['code'] ?? ''));
        $subtotal = (float)($input['subtotal'] ?? 0);

        if (empty($code)) {
            sendError('Kode voucher tidak boleh kosong.');
        }

        $pdo = getDbConnection();
        $stmt = $pdo->prepare("SELECT * FROM discounts WHERE UPPER(code) = ? AND is_active = 1 LIMIT 1");
        $stmt->execute([$code]);
        $disc = $stmt->fetch();

        if (!$disc) {
            sendError('Kode voucher tidak valid atau sudah tidak aktif.');
        }

        $minSpend = (float)$disc['min_spend'];
        if ($subtotal < $minSpend) {
            sendError('Minimal belanja untuk voucher ini adalah Rp' . number_format($minSpend, 0, ',', '.'));
        }

        if ($disc['usage_limit'] > 0 && $disc['used_count'] >= $disc['usage_limit']) {
            sendError('Kuota penggunaan voucher ini sudah habis.');
        }

        $today = date('Y-m-d');
        if (!empty($disc['start_date']) && $today < $disc['start_date']) {
            sendError('Voucher belum dapat digunakan.');
        }
        if (!empty($disc['end_date']) && $today > $disc['end_date']) {
            sendError('Voucher telah kedaluwarsa.');
        }

        $discountAmount = 0;
        if ($disc['discount_type'] === 'percentage') {
            $discountAmount = round($subtotal * ((float)$disc['discount_value'] / 100));
            if (!empty($disc['max_discount']) && $discountAmount > (float)$disc['max_discount']) {
                $discountAmount = (float)$disc['max_discount'];
            }
        } else {
            $discountAmount = min($subtotal, (float)$disc['discount_value']);
        }

        sendSuccess([
            'valid'          => true,
            'code'           => $disc['code'],
            'discountType'   => $disc['discount_type'],
            'discountValue'  => (float)$disc['discount_value'],
            'discountAmount' => $discountAmount,
            'description'    => $disc['description'],
        ], 'Voucher berhasil digunakan!');
    }

    public static function index(): void {
        requireAdmin();
        $pdo = getDbConnection();
        $stmt = $pdo->query("SELECT * FROM discounts ORDER BY created_at DESC");
        sendSuccess($stmt->fetchAll());
    }

    public static function store(): void {
        requireAdmin();
        $input = getJsonInput();

        $id = $input['id'] ?? ('disc-' . bin2hex(random_bytes(5)));
        $code = strtoupper(trim($input['code'] ?? ''));
        $desc = trim($input['description'] ?? '');
        $type = in_array($input['discountType'] ?? ($input['discount_type'] ?? ''), ['percentage', 'fixed']) ? ($input['discountType'] ?? $input['discount_type']) : 'percentage';
        $val = (float)($input['discountValue'] ?? ($input['discount_value'] ?? 10));
        $minSpend = (float)($input['minSpend'] ?? ($input['min_spend'] ?? 0));
        $maxDiscount = !empty($input['maxDiscount']) ? (float)$input['maxDiscount'] : (!empty($input['max_discount']) ? (float)$input['max_discount'] : null);
        $usageLimit = (int)($input['usageLimit'] ?? ($input['usage_limit'] ?? 100));
        $startDate = $input['startDate'] ?? ($input['start_date'] ?? null);
        $endDate = $input['endDate'] ?? ($input['end_date'] ?? null);
        $isActive = isset($input['isActive']) ? ($input['isActive'] ? 1 : 0) : (isset($input['is_active']) ? ($input['is_active'] ? 1 : 0) : 1);

        if (empty($code)) {
            sendError('Kode kupon wajib diisi.');
        }

        $pdo = getDbConnection();
        $stmt = $pdo->prepare("REPLACE INTO discounts 
            (id, code, description, discount_type, discount_value, min_spend, max_discount, usage_limit, start_date, end_date, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $code, $desc, $type, $val, $minSpend, $maxDiscount, $usageLimit, $startDate, $endDate, $isActive]);

        sendSuccess(['id' => $id, 'code' => $code], 'Voucher diskon berhasil disimpan.', 201);
    }

    public static function destroy(string $id): void {
        requireAdmin();
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("DELETE FROM discounts WHERE id = ?");
        $stmt->execute([$id]);
        sendSuccess(null, 'Voucher berhasil dihapus.');
    }
}

