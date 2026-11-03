<?php
/**
 * JNE Express API - Generate Airway Bill (Cnote)
 * Implementation for PT SYB Official Store (Sheva Jordan Bersama)
 * 
 * Supports both:
 * 1. HTTP API Endpoint (CORS-enabled JSON response for Angular / Web Frontend)
 * 2. Standalone CLI Script execution (php generatecnote.php)
 */

// Enable CORS for web clients
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');

// Preflight request handling
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit(0);
}

$isCli = (php_sapi_name() === 'cli');

// Parse request payload from JSON or Form URL-encoded
$input = [];
if (!$isCli) {
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        $json = json_decode($rawInput, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($json)) {
            $input = $json;
        } else {
            parse_str($rawInput, $input);
        }
    }
    if (empty($input) && !empty($_POST)) {
        $input = $_POST;
    }
}

// Credentials (Sandbox defaults if not supplied)
$username = $input['username'] ?? 'TESTAPI';
$apiKey   = $input['api_key'] ?? '25c898a9faea1a100859ecd9ef674548';

// Target Endpoint URL:
// Sandbox: https://apiv2.jne.co.id:10202/tracing/api/generatecnote
// Live:    https://apiv2.jne.co.id:10206/tracing/api/generatecnote
$targetUrl = 'https://apiv2.jne.co.id:10202/tracing/api/generatecnote';
if (strtoupper($username) !== 'TESTAPI') {
    $targetUrl = 'https://apiv2.jne.co.id:10206/tracing/api/generatecnote';
}
if (!empty($input['endpoint_url'])) {
    $targetUrl = $input['endpoint_url'];
}

// Resolve destination code from postal code or city if not explicitly provided
$destCode = $input['OLSHOP_DEST'] ?? null;
if (empty($destCode)) {
    $zip = trim($input['OLSHOP_RECEIVER_ZIP'] ?? '');
    if (!empty($zip) && file_exists(__DIR__ . '/data/jne-zip-destinations.json')) {
        $zipMap = json_decode(file_get_contents(__DIR__ . '/data/jne-zip-destinations.json'), true);
        if (!empty($zipMap[$zip])) {
            $destCode = $zipMap[$zip];
        }
    }
    if (empty($destCode) && !empty($input['OLSHOP_RECEIVER_CITY']) && file_exists(__DIR__ . '/data/jne-city-destinations.json')) {
        $cityMap = json_decode(file_get_contents(__DIR__ . '/data/jne-city-destinations.json'), true);
        $normCity = strtoupper(trim($input['OLSHOP_RECEIVER_CITY']));
        if (!empty($cityMap[$normCity])) {
            $destCode = $cityMap[$normCity];
        }
    }
}
$resolvedDest = $destCode ?: 'CGK10000';

// Prepare parameters required by JNE Cnote API
$postFields = [
    'username'              => $username,
    'api_key'               => $apiKey,
    'OLSHOP_BRANCH'         => $input['OLSHOP_BRANCH'] ?? 'CGK000',
    'OLSHOP_CUST'           => $input['OLSHOP_CUST'] ?? '10915700',
    'OLSHOP_ORDERID'        => $input['OLSHOP_ORDERID'] ?? ('SYB-' . time()),
    'OLSHOP_SHIPPER_NAME'   => $input['OLSHOP_SHIPPER_NAME'] ?? 'PT SYB Official Store',
    'OLSHOP_SHIPPER_ADDR1'  => $input['OLSHOP_SHIPPER_ADDR1'] ?? 'Kawasan Rungkut Industri C-12',
    'OLSHOP_SHIPPER_ADDR2'  => $input['OLSHOP_SHIPPER_ADDR2'] ?? 'Kec. Rungkut',
    'OLSHOP_SHIPPER_CITY'   => $input['OLSHOP_SHIPPER_CITY'] ?? 'SURABAYA',
    'OLSHOP_SHIPPER_ZIP'    => $input['OLSHOP_SHIPPER_ZIP'] ?? '60293',
    'OLSHOP_SHIPPER_PHONE'  => $input['OLSHOP_SHIPPER_PHONE'] ?? '081233336909',
    'OLSHOP_RECEIVER_NAME'  => $input['OLSHOP_RECEIVER_NAME'] ?? 'Pelanggan SYB',
    'OLSHOP_RECEIVER_ADDR1' => $input['OLSHOP_RECEIVER_ADDR1'] ?? 'Jl. Melati No. 15',
    'OLSHOP_RECEIVER_ADDR2' => $input['OLSHOP_RECEIVER_ADDR2'] ?? 'Kecamatan Kebayoran Baru',
    'OLSHOP_RECEIVER_CITY'  => $input['OLSHOP_RECEIVER_CITY'] ?? 'JAKARTA',
    'OLSHOP_RECEIVER_ZIP'   => $input['OLSHOP_RECEIVER_ZIP'] ?? '12190',
    'OLSHOP_RECEIVER_PHONE' => $input['OLSHOP_RECEIVER_PHONE'] ?? '081234567890',
    'OLSHOP_QTY'            => (string)($input['OLSHOP_QTY'] ?? '1'),
    'OLSHOP_WEIGHT'         => (string)($input['OLSHOP_WEIGHT'] ?? '1'),
    'OLSHOP_GOODSDESC'      => $input['OLSHOP_GOODSDESC'] ?? 'Kosmetik & Skincare SYB Resmi',
    'OLSHOP_GOODSVALUE'     => (string)($input['OLSHOP_GOODSVALUE'] ?? '50000'),
    'OLSHOP_GOODSTYPE'      => (string)($input['OLSHOP_GOODSTYPE'] ?? '1'),
    'OLSHOP_INS_FLAG'       => $input['OLSHOP_INS_FLAG'] ?? 'N',
    'OLSHOP_ORIG'           => $input['OLSHOP_ORIG'] ?? 'SUB10000',
    'OLSHOP_DEST'           => $resolvedDest,
    'OLSHOP_SERVICE'        => $input['OLSHOP_SERVICE'] ?? 'REG',
    'OLSHOP_COD_FLAG'       => $input['OLSHOP_COD_FLAG'] ?? 'N',
    'OLSHOP_COD_AMOUNT'     => (string)($input['OLSHOP_COD_AMOUNT'] ?? '0'),
];

// Optional parameters
if (!empty($input['OLSHOP_SHIPPER_ADDR3'])) {
    $postFields['OLSHOP_SHIPPER_ADDR3'] = $input['OLSHOP_SHIPPER_ADDR3'];
}
if (!empty($input['OLSHOP_SHIPPER_REGION'])) {
    $postFields['OLSHOP_SHIPPER_REGION'] = $input['OLSHOP_SHIPPER_REGION'];
}
if (!empty($input['OLSHOP_RECEIVER_ADDR3'])) {
    $postFields['OLSHOP_RECEIVER_ADDR3'] = $input['OLSHOP_RECEIVER_ADDR3'];
}
if (!empty($input['OLSHOP_RECEIVER_REGION'])) {
    $postFields['OLSHOP_RECEIVER_REGION'] = $input['OLSHOP_RECEIVER_REGION'];
}
if (!empty($input['OLSHOP_INST'])) {
    $postFields['OLSHOP_INST'] = $input['OLSHOP_INST'];
}

// Execute cURL request to JNE API
$ch = curl_init($targetUrl);

curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST  => 'POST',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/x-www-form-urlencoded',
        'Accept: application/json',
        'User-Agent: php-request',
    ],
    CURLOPT_POSTFIELDS     => http_build_query($postFields),
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_TIMEOUT        => 30,
]);

$response = curl_exec($ch);
$curlErr  = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Format and return output
if ($isCli) {
    if ($curlErr) {
        echo "cURL Error: " . $curlErr . PHP_EOL;
    } else {
        print_r(json_decode($response, true));
    }
} else {
    header('Content-Type: application/json; charset=utf-8');
    if ($curlErr) {
        http_response_code(500);
        echo json_encode([
            'status' => false,
            'error'  => 'Gagal menghubungi server JNE: ' . $curlErr
        ]);
    } else {
        http_response_code($httpCode ?: 200);
        echo $response;
    }
}

