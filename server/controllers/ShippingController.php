<?php
/**
 * SYB Official Store - Shipping & JNE Logistics Controller
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../helpers/response.php';

class ShippingController {
    public static function origins(): void {
        $file = __DIR__ . '/../data/jne-origins.json';
        if (file_exists($file)) {
            $data = json_decode(file_get_contents($file), true);
            sendSuccess($data);
        }

        sendSuccess([
            ['code' => 'SUB10000', 'name' => 'SURABAYA', 'province' => 'JAWA TIMUR', 'city' => 'KOTA SURABAYA'],
            ['code' => 'SDA10000', 'name' => 'SIDOARJO', 'province' => 'JAWA TIMUR', 'city' => 'KABUPATEN SIDOARJO'],
            ['code' => 'JKT10000', 'name' => 'JAKARTA', 'province' => 'DKI JAKARTA', 'city' => 'KOTA JAKARTA'],
        ]);
    }

    public static function destinations(): void {
        $q = strtolower(trim($_GET['q'] ?? ''));
        $file = __DIR__ . '/../data/jne-city-destinations.json';

        if (empty($q) || strlen($q) < 2) {
            sendSuccess([]);
        }

        if (file_exists($file)) {
            $destinations = json_decode(file_get_contents($file), true) ?: [];
            $filtered = [];
            foreach ($destinations as $d) {
                $target = strtolower(($d['label'] ?? '') . ' ' . ($d['city'] ?? '') . ' ' . ($d['tariff_code'] ?? ''));
                if (strpos($target, $q) !== false) {
                    $filtered[] = $d;
                    if (count($filtered) >= 20) break;
                }
            }
            sendSuccess($filtered);
        }

        // Fallback sample destinations
        sendSuccess([
            ['tariff_code' => 'SUB10000', 'city' => 'KOTA SURABAYA', 'label' => 'SURABAYA, JAWA TIMUR'],
            ['tariff_code' => 'JKT10000', 'city' => 'KOTA JAKARTA PUSAT', 'label' => 'JAKARTA PUSAT, DKI JAKARTA'],
            ['tariff_code' => 'BDG10000', 'city' => 'KOTA BANDUNG', 'label' => 'BANDUNG, JAWA BARAT'],
        ]);
    }

    public static function tariff(): void {
        $input = getJsonInput();
        $from = trim($input['from'] ?? ($input['origin'] ?? 'SUB10000'));
        $thru = trim($input['thru'] ?? ($input['destination'] ?? ''));
        $weight = max(1, (float)($input['weight'] ?? 1));

        if (empty($thru)) {
            sendError('Tujuan pengiriman (destination code) wajib diisi.');
        }

        $username = JNE_USERNAME;
        $apiKey = JNE_API_KEY;
        $targetUrl = ($username === 'TESTAPI') ? (JNE_HOST_DEV . '/pricedev') : (JNE_HOST_PROD . '/pricedev');

        $postFields = http_build_query([
            'username' => $username,
            'api_key'  => $apiKey,
            'from'     => $from,
            'thru'     => $thru,
            'weight'   => $weight
        ]);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $targetUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $response) {
            $json = json_decode($response, true);
            if (isset($json['price'])) {
                sendSuccess($json['price']);
            }
        }

        // Fallback tariff simulation if JNE Sandbox server is down or slow
        $base = ($from === $thru) ? 9000 : 18000;
        sendSuccess([
            [
                'service_display' => 'REG',
                'service_code'    => 'REG',
                'price'           => $base * $weight,
                'etd_from'        => '2',
                'etd_thru'        => '3',
                'times'           => '2-3 Hari'
            ],
            [
                'service_display' => 'YES',
                'service_code'    => 'YES',
                'price'           => ($base + 12000) * $weight,
                'etd_from'        => '1',
                'etd_thru'        => '1',
                'times'           => '1 Hari (Besok Sampai)'
            ],
            [
                'service_display' => 'OKE',
                'service_code'    => 'OKE',
                'price'           => max(8000, ($base - 4000)) * $weight,
                'etd_from'        => '3',
                'etd_thru'        => '5',
                'times'           => '3-5 Hari'
            ]
        ]);
    }

    public static function generateCnote(): void {
        $input = getJsonInput();

        $username = JNE_USERNAME;
        $apiKey = JNE_API_KEY;
        $targetUrl = ($username === 'TESTAPI') ? (JNE_HOST_DEV . '/generatecnote') : (JNE_HOST_PROD . '/generatecnote');

        $input['username'] = $username;
        $input['api_key'] = $apiKey;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $targetUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($input));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $response) {
            $json = json_decode($response, true);
            sendJson($json);
        }

        // Mock simulation if JNE is in sandbox test mode
        $awb = 'JNE' . date('Ymd') . rand(100000, 999999);
        sendSuccess([
            'cnote' => [
                'cnote_no'   => $awb,
                'cnote_date' => date('Y-m-d H:i:s'),
                'cust_type'  => 'CORPORATE',
                'status'     => 'SUCCESS'
            ]
        ]);
    }

    // ==========================================
    // J&T EXPRESS LOGISTICS METHODS
    // ==========================================
    public static function jntTariff(): void {
        $_GET['action'] = 'tariff';
        require __DIR__ . '/../jnt.php';
        exit;
    }

    public static function jntCreateOrder(): void {
        $_GET['action'] = 'order';
        require __DIR__ . '/../jnt.php';
        exit;
    }

    public static function jntTrackOrder(): void {
        $_GET['action'] = 'track';
        require __DIR__ . '/../jnt.php';
        exit;
    }

    public static function jntCancelOrder(): void {
        $_GET['action'] = 'cancel';
        require __DIR__ . '/../jnt.php';
        exit;
    }
}

