<?php
/**
 * SYB Official Store - JNE API Gateway Router (PHP)
 */

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);

if (str_contains($uri, 'generatecnote')) {
    require __DIR__ . '/generatecnote.php';
} elseif (str_contains($uri, 'pricedev')) {
    require __DIR__ . '/pricedev.php';
} else {
    header('Content-Type: application/json');
    echo json_encode([
        'service' => 'SYB JNE API Gateway',
        'endpoints' => [
            'generatecnote' => '/generatecnote.php',
            'pricedev'      => '/pricedev.php'
        ]
    ]);
}

