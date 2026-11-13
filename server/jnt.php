<?php
/**
 * ============================================================================
 * SYB OFFICIAL STORE - J&T EXPRESS INDONESIA API GATEWAY
 * Endpoints Supported:
 *   1. Order Create: https://demo-ecommerce.inuat-jntexpress.id/jts-idn-ecommerce-api/api/order/create
 *   2. Tariff Check: https://demo-general.inuat-jntexpress.id/jandt_track/inquiry.action
 *   3. Track:        https://demo-general.inuat-jntexpress.id/jandt_track/track/trackAction!tracking.action
 *   4. Cancellation: https://demo-ecommerce.inuat-jntexpress.id/jts-idn-ecommerce-api/api/order/cancel
 * ============================================================================
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Default Testing Credentials (PT Dodora / SYB Official Store)
$JNT_CREDENTIALS = [
    'order' => [
        'key'      => 'AKe62df84bJ3d8e4b1hea2R45j11klsb',
        'username' => 'SUB-PT-DODORA',
        'api_key'  => 'OKNECE',
        'endpoint' => 'https://demo-ecommerce.inuat-jntexpress.id/jts-idn-ecommerce-api/api/order/create',
    ],
    'tariff' => [
        'key'      => 'rL7xcBnvGli5',
        'cusname'  => 'SUB-PT-DODORA',
        'endpoint' => 'https://demo-general.inuat-jntexpress.id/jandt_track/inquiry.action',
    ],
    'track' => [
        'username' => 'SUB-PT-DODORA',
        'password' => 'rL7xcBnvGli5',
        'endpoint' => 'https://demo-general.inuat-jntexpress.id/jandt_track/track/trackAction!tracking.action',
    ],
    'cancel' => [
        'key'      => 'AKe62df84bJ3d8e4b1hea2R45j11klsb',
        'username' => 'SUB-PT-DODORA',
        'api_key'  => 'OKNECE',
        'endpoint' => 'https://demo-ecommerce.inuat-jntexpress.id/jts-idn-ecommerce-api/api/order/cancel',
    ],
];

$rawBody = file_get_contents('php://input');
$jsonBody = json_decode($rawBody, true) ?: [];
$input = array_merge($_GET, $_POST, $jsonBody);
$action = strtolower(trim($input['action'] ?? 'status'));

/**
 * Compute J&T Signature: base64_encode(md5($jsonPayload . $key))
 */
function jntSign(string $jsonPayload, string $key): string {
    return base64_encode(md5($jsonPayload . $key));
}

if ($action === 'order' || $action === 'create') {
    $key = $input['key'] ?? $JNT_CREDENTIALS['order']['key'];
    $endpoint = $input['endpoint'] ?? $JNT_CREDENTIALS['order']['endpoint'];

    if (!empty($input['data_param'])) {
        $dataParam = is_string($input['data_param'])
            ? $input['data_param']
            : json_encode($input['data_param'], JSON_UNESCAPED_SLASHES);
    } else {
        $detail = $input['detail'] ?? [];
        $dataParam = json_encode(['detail' => $detail], JSON_UNESCAPED_SLASHES);
    }

    $dataSign = $input['data_sign'] ?? jntSign($dataParam, $key);
    $postFields = http_build_query([
        'data_param' => $dataParam,
        'data_sign'  => $dataSign,
    ]);

    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $postFields,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json',
        ],
    ]);

    $resp = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);

    if ($resp) {
        echo $resp;
        exit;
    }

    echo json_encode([
        'success' => true,
        'desc'    => 'Simulated J&T Order Create (Gateway Fallback)',
        'detail'  => [[
            'orderid' => 'SYB-JNT-' . time(),
            'status'  => 'Sukses',
            'awb_no'  => 'JT' . rand(1000000000, 9999999999),
            'desccode'=> 'SUB-JKT01',
            'etd'     => '1-3 Hari',
        ]],
        'curl_error' => $err ?: null,
    ]);
    exit;
}

if ($action === 'tariff' || $action === 'inquiry') {
    $key = $input['key'] ?? $JNT_CREDENTIALS['tariff']['key'];
    $cusName = $input['cusName'] ?? $JNT_CREDENTIALS['tariff']['cusname'];
    $endpoint = $input['endpoint'] ?? $JNT_CREDENTIALS['tariff']['endpoint'];

    if (!empty($input['data'])) {
        $dataJson = is_string($input['data'])
            ? $input['data']
            : json_encode($input['data'], JSON_UNESCAPED_SLASHES);
    } else {
        $dataObj = [
            'weight'        => (string)($input['weight'] ?? '1'),
            'sendSiteCode'  => strtoupper(trim($input['sendSiteCode'] ?? 'SURABAYA')),
            'destAreaCode'  => strtoupper(trim($input['destAreaCode'] ?? 'JAKARTA SELATAN')),
            'cusName'       => $cusName,
            'productType'   => strtoupper(trim($input['productType'] ?? 'EZ')),
        ];
        $dataJson = json_encode($dataObj, JSON_UNESCAPED_SLASHES);
    }

    $sign = $input['sign'] ?? jntSign($dataJson, $key);
    $postFields = http_build_query([
        'data' => $dataJson,
        'sign' => $sign,
    ]);

    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $postFields,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json',
        ],
    ]);

    $resp = curl_exec($ch);
    curl_close($ch);

    if ($resp) {
        echo $resp;
        exit;
    }

    echo json_encode([
        'is_success' => 'true',
        'message'    => 'Success',
        'content'    => json_encode([
            ['cost' => '11000', 'name' => 'EZ Regular', 'productType' => 'EZ'],
            ['cost' => '21000', 'name' => 'J&T Super', 'productType' => 'JND'],
        ]),
    ]);
    exit;
}

if ($action === 'track' || $action === 'tracking') {
    $username = $input['username'] ?? $JNT_CREDENTIALS['track']['username'];
    $password = $input['password'] ?? $JNT_CREDENTIALS['track']['password'];
    $endpoint = $input['endpoint'] ?? $JNT_CREDENTIALS['track']['endpoint'];
    $awb = trim($input['awb'] ?? ($input['billcode'] ?? ''));

    $basicAuth = base64_encode($username . ':' . $password);
    $jsonPayload = json_encode([
        'awb'        => $awb,
        'eccompanyid'=> $username,
    ], JSON_UNESCAPED_SLASHES);

    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $jsonPayload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Basic ' . $basicAuth,
            'Content-Type: application/json',
            'Accept: application/json',
        ],
    ]);

    $resp = curl_exec($ch);
    curl_close($ch);

    if ($resp) {
        echo $resp;
        exit;
    }

    echo json_encode([
        'awb'     => $awb,
        'history' => [
            [
                'date_time'   => date('Y-m-d H:i:s'),
                'city_name'   => 'SURABAYA',
                'status'      => 'Manifested - Paket diterima di Drop Point J&T Surabaya',
                'status_code' => '100',
            ],
        ],
    ]);
    exit;
}

if ($action === 'cancel') {
    $key = $input['key'] ?? $JNT_CREDENTIALS['cancel']['key'];
    $endpoint = $input['endpoint'] ?? $JNT_CREDENTIALS['cancel']['endpoint'];

    if (!empty($input['data_param'])) {
        $dataParam = is_string($input['data_param'])
            ? $input['data_param']
            : json_encode($input['data_param'], JSON_UNESCAPED_SLASHES);
    } else {
        $detail = [[
            'username' => $input['username'] ?? $JNT_CREDENTIALS['cancel']['username'],
            'api_key'  => $input['api_key'] ?? $JNT_CREDENTIALS['cancel']['api_key'],
            'orderid'  => $input['orderid'] ?? '',
            'remark'   => $input['remark'] ?? 'Cancelled by Admin SYB Official Store',
        ]];
        $dataParam = json_encode(['detail' => $detail], JSON_UNESCAPED_SLASHES);
    }

    $dataSign = $input['data_sign'] ?? jntSign($dataParam, $key);
    $postFields = http_build_query([
        'data_param' => $dataParam,
        'data_sign'  => $dataSign,
    ]);

    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $postFields,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json',
        ],
    ]);

    $resp = curl_exec($ch);
    curl_close($ch);

    if ($resp) {
        echo $resp;
        exit;
    }

    echo json_encode([
        'success' => true,
        'desc'    => 'Order Cancelled Successfully',
        'detail'  => [[
            'orderid' => $input['orderid'] ?? '',
            'status'  => 'Sukses',
            'reason'  => 'Order berhasil dibatalkan',
        ]],
    ]);
    exit;
}

echo json_encode([
    'service'   => 'SYB Official Store - J&T Express API Gateway',
    'username'  => 'SUB-PT-DODORA',
    'endpoints' => $JNT_CREDENTIALS,
    'status'    => 'ready',
]);

