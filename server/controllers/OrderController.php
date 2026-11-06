<?php
/**
 * SYB Official Store - Order & Checkout Controller
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

class OrderController {
    public static function create(): void {
        $input = getJsonInput();
        $pdo = getDbConnection();

        $items = $input['items'] ?? [];
        if (empty($items) || !is_array($items)) {
            sendError('Keranjang belanja kosong. Silakan pilih produk terlebih dahulu.');
        }

        $cust = (array)($input['customer'] ?? []);
        $customerName = trim($input['customerName'] ?? ($input['customer_name'] ?? ($cust['name'] ?? '')));
        $customerEmail = trim($input['customerEmail'] ?? ($input['customer_email'] ?? ($cust['email'] ?? '')));
        $customerPhone = trim($input['customerPhone'] ?? ($input['customer_phone'] ?? ($cust['phone'] ?? '')));
        $shippingAddress = $input['shippingAddress'] ?? ($input['shipping_address'] ?? (!empty($cust['address']) ? $cust : []));

        if (empty($customerName) || empty($customerEmail) || empty($customerPhone)) {
            sendError('Data penerima (nama, email, no HP) wajib diisi.');
        }

        // Authenticated user (if logged in)
        $user = getAuthUser();
        $userId = $user ? $user['id'] : null;

        // Calculate verified subtotal from database
        $subtotal = 0;
        $verifiedItems = [];

        $pStmt = $pdo->prepare("SELECT id, title, price, original_price, is_flash_sale, flash_sale_price, inventory, image FROM products WHERE id = ?");

        foreach ($items as $it) {
            $pid = $it['productId'] ?? ($it['product_id'] ?? ($it['id'] ?? ''));
            $qty = max(1, (int)($it['quantity'] ?? ($it['qty'] ?? 1)));
            $variantName = $it['variantName'] ?? ($it['variant_name'] ?? null);

            $pStmt->execute([$pid]);
            $p = $pStmt->fetch();

            if (!$p) {
                continue;
            }

            // Determine item price (check flash sale or variant)
            $unitPrice = (float)$p['price'];
            if (!empty($p['is_flash_sale']) && !empty($p['flash_sale_price'])) {
                $unitPrice = (float)$p['flash_sale_price'];
            }

            $lineTotal = $unitPrice * $qty;
            $subtotal += $lineTotal;

            $verifiedItems[] = [
                'productId'   => $p['id'],
                'productName' => $p['title'],
                'variantName' => $variantName,
                'image'       => $p['image'],
                'price'       => $unitPrice,
                'quantity'    => $qty,
                'total'       => $lineTotal,
            ];
        }

        if (empty($verifiedItems)) {
            sendError('Produk dalam keranjang tidak valid.');
        }

        // Validate discount voucher if applied
        $discountCode = trim($input['discountCode'] ?? ($input['discount_code'] ?? ''));
        $discountAmount = 0;

        if (!empty($discountCode)) {
            $dStmt = $pdo->prepare("SELECT * FROM discounts WHERE UPPER(code) = UPPER(?) AND is_active = 1 LIMIT 1");
            $dStmt->execute([$discountCode]);
            $disc = $dStmt->fetch();

            if ($disc) {
                $minSpend = (float)$disc['min_spend'];
                if ($subtotal >= $minSpend) {
                    if ($disc['discount_type'] === 'percentage') {
                        $discountAmount = round($subtotal * ((float)$disc['discount_value'] / 100));
                        if (!empty($disc['max_discount']) && $discountAmount > (float)$disc['max_discount']) {
                            $discountAmount = (float)$disc['max_discount'];
                        }
                    } else {
                        $discountAmount = (float)$disc['discount_value'];
                    }

                    // Increment used count
                    $pdo->prepare("UPDATE discounts SET used_count = used_count + 1 WHERE id = ?")->execute([$disc['id']]);
                }
            }
        }

        $shippingCourier = $input['shippingCourier'] ?? ($input['shipping_courier'] ?? 'JNE');
        $shippingService = $input['shippingService'] ?? ($input['shipping_service'] ?? 'REG');
        $shippingCost = (float)($input['shippingCost'] ?? ($input['shipping_cost'] ?? 0));
        $shippingEtd = $input['shippingEtd'] ?? ($input['shipping_etd'] ?? '2-3 Hari');
        $paymentMethod = $input['paymentMethod'] ?? ($input['payment_method'] ?? 'BCA Virtual Account');
        $notes = $input['notes'] ?? '';

        $grandTotal = max(0, $subtotal - $discountAmount + $shippingCost);

        // Generate Order ID & Order Number
        $orderId = 'ord-' . bin2hex(random_bytes(6));
        $orderNumber = 'SYB-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));

        $stmt = $pdo->prepare("INSERT INTO orders 
            (id, order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, shipping_courier, shipping_service, shipping_cost, shipping_etd, subtotal, discount_code, discount_amount, grand_total, payment_method, payment_status, order_status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'pending', ?)");

        $stmt->execute([
            $orderId,
            $orderNumber,
            $userId,
            $customerName,
            $customerEmail,
            $customerPhone,
            is_string($shippingAddress) ? $shippingAddress : json_encode($shippingAddress),
            $shippingCourier,
            $shippingService,
            $shippingCost,
            $shippingEtd,
            $subtotal,
            $discountCode ?: null,
            $discountAmount,
            $grandTotal,
            $paymentMethod,
            $notes
        ]);

        // Insert order items & reduce stock
        $itemIns = $pdo->prepare("INSERT INTO order_items (order_id, product_id, product_name, variant_name, image, price, quantity, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stockDec = $pdo->prepare("UPDATE products SET inventory = GREATEST(0, inventory - ?) WHERE id = ?");

        foreach ($verifiedItems as $vit) {
            $itemIns->execute([
                $orderId,
                $vit['productId'],
                $vit['productName'],
                $vit['variantName'],
                $vit['image'],
                $vit['price'],
                $vit['quantity'],
                $vit['total']
            ]);
            $stockDec->execute([$vit['quantity'], $vit['productId']]);
        }

        sendSuccess([
            'orderId'     => $orderId,
            'orderNumber' => $orderNumber,
            'subtotal'    => $subtotal,
            'discount'    => $discountAmount,
            'shipping'    => $shippingCost,
            'grandTotal'  => $grandTotal,
            'items'       => $verifiedItems,
            'status'      => 'pending'
        ], 'Pesanan berhasil dibuat!', 201);
    }

    public static function show(string $id): void {
        $pdo = getDbConnection();

        $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1");
        $stmt->execute([$id, $id]);
        $order = $stmt->fetch();

        if (!$order) {
            sendError('Pesanan tidak ditemukan.', 404);
        }

        $order['shipping_address'] = json_decode($order['shipping_address'] ?: '{}', true);

        $itemStmt = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
        $itemStmt->execute([$order['id']]);
        $order['items'] = $itemStmt->fetchAll();

        sendSuccess($order);
    }

    public static function myOrders(): void {
        $user = requireAuth();
        $pdo = getDbConnection();

        $stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = ? OR customer_email = ? ORDER BY created_at DESC");
        $stmt->execute([$user['id'], $user['email']]);
        $orders = $stmt->fetchAll();

        $itemStmt = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
        foreach ($orders as &$o) {
            $o['shipping_address'] = json_decode($o['shipping_address'] ?: '{}', true);
            $itemStmt->execute([$o['id']]);
            $o['items'] = $itemStmt->fetchAll();
        }

        sendSuccess($orders);
    }

    public static function index(): void {
        requireAdmin();
        $pdo = getDbConnection();

        $status = $_GET['status'] ?? 'all';
        $q = trim($_GET['q'] ?? '');

        $sql = "SELECT * FROM orders";
        $where = [];
        $params = [];

        if ($status !== 'all' && !empty($status)) {
            $where[] = "order_status = ?";
            $params[] = $status;
        }

        if (!empty($q)) {
            $where[] = "(order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR customer_phone LIKE ? OR awb_number LIKE ?)";
            $wildcard = '%' . $q . '%';
            $params = array_merge($params, [$wildcard, $wildcard, $wildcard, $wildcard, $wildcard]);
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $sql .= " ORDER BY created_at DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $orders = $stmt->fetchAll();

        $itemStmt = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
        foreach ($orders as &$o) {
            $o['shipping_address'] = json_decode($o['shipping_address'] ?: '{}', true);
            $itemStmt->execute([$o['id']]);
            $o['items'] = $itemStmt->fetchAll();
        }

        sendSuccess($orders);
    }

    public static function updateStatus(string $id): void {
        requireAdmin();
        $input = getJsonInput();
        $pdo = getDbConnection();

        $orderStatus = $input['orderStatus'] ?? ($input['order_status'] ?? null);
        $paymentStatus = $input['paymentStatus'] ?? ($input['payment_status'] ?? null);
        $awbNumber = $input['awbNumber'] ?? ($input['awb_number'] ?? null);

        $fields = [];
        $params = [];

        if ($orderStatus !== null) {
            $fields[] = "order_status = ?";
            $params[] = $orderStatus;
        }
        if ($paymentStatus !== null) {
            $fields[] = "payment_status = ?";
            $params[] = $paymentStatus;
        }
        if ($awbNumber !== null) {
            $fields[] = "awb_number = ?";
            $params[] = $awbNumber;
        }

        if (empty($fields)) {
            sendError('Tidak ada perubahan status.');
        }

        $fields[] = "updated_at = CURRENT_TIMESTAMP";
        $params[] = $id;

        $sql = "UPDATE orders SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        sendSuccess(['id' => $id], 'Status pesanan berhasil diperbarui.');
    }
}
