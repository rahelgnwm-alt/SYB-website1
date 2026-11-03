<?php
/**
 * JNE Express API - Check Shipping Tariff (Pricedev)
 * Implementation for PT SYB Official Store (Sheva Jordan Bersama)
 * 
 * Supports both:
 * 1. HTTP API Endpoint (CORS-enabled JSON response for Angular / Web Checkout)
 * 2. Standalone CLI Script execution (php pricedev.php)
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit(0);
}

$isCli = (php_sapi_name() === 'cli');

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

$username = $input['username'] ?? 'TESTAPI';
$apiKey   = $input['api_key'] ?? '25c898a9faea1a100859ecd9ef674548';

$targetUrl = 'https://apiv2.jne.co.id:10202/tracing/api/pricedev';
if (strtoupper($username) !== 'TESTAPI') {
    $targetUrl = 'https://apiv2.jne.co.id:10206/tracing/api/pricedev';
}
if (!empty($input['endpoint_url'])) {
    $targetUrl = $input['endpoint_url'];
}

// Resolve destination code from postal code or city if not directly passed in thru
$thru = $input['thru'] ?? null;
if (empty($thru)) {
    $zip = trim($input['zip'] ?? $input['postal_code'] ?? '');
    if (!empty($zip) && file_exists(__DIR__ . '/data/jne-zip-destinations.json')) {
        $zipMap = json_decode(file_get_contents(__DIR__ . '/data/jne-zip-destinations.json'), true);
        if (!empty($zipMap[$zip])) {
            $thru = $zipMap[$zip];
        }
    }
    if (empty($thru) && !empty($input['city']) && file_exists(__DIR__ . '/data/jne-city-destinations.json')) {
        $cityMap = json_decode(file_get_contents(__DIR__ . '/data/jne-city-destinations.json'), true);
        $normCity = strtoupper(trim($input['city']));
        if (!empty($cityMap[$normCity])) {
            $thru = $cityMap[$normCity];
        }
    }
}
$resolvedThru = $thru ?: 'CGK10000';

$postFields = [
    'username' => $username,
    'api_key'  => $apiKey,
    'from'     => $input['from'] ?? 'SUB10000',
    'thru'     => $resolvedThru,
    'weight'   => (string)($input['weight'] ?? '1'),
];

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
            'error'  => 'Gagal mengecek ongkos kirim JNE: ' . $curlErr
        ]);
    } else {
        http_response_code($httpCode ?: 200);
        echo $response;
    }
}

