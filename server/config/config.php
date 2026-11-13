<?php
/**
 * SYB Official Store - Central Configuration
 * Supports DomaiNesia Live Hosting, Laragon/XAMPP, and PHP Built-in Server.
 */

// Production vs Local detection
$isLive = file_exists('/home/shevajor') || (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'shevajordanbersama.com') !== false);

// Database configuration
if ($isLive) {
    define('DB_TYPE', 'mysql');
    define('DB_HOST', 'localhost');
    define('DB_PORT', '3306');
    define('DB_NAME', 'shevajor_syb_store');
    define('DB_USER', 'shevajor_bpom');
    define('DB_PASS', '9Ubq3bSVpQUyJRM');
} else {
    // Local development configuration:
    // Tries MySQL first (root / empty password), falls back automatically to SQLite if MySQL is offline.
    define('DB_TYPE', getenv('DB_TYPE') ?: 'mysql');
    define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
    define('DB_PORT', getenv('DB_PORT') ?: '3306');
    define('DB_NAME', getenv('DB_NAME') ?: 'syb-website');
    define('DB_USER', getenv('DB_USER') ?: 'root');
    define('DB_PASS', getenv('DB_PASS') ?: '');
    define('SQLITE_PATH', __DIR__ . '/../data/syb_store.sqlite');
}

// Security / JWT Secret (256-bit key)
define('JWT_SECRET', 'SYB_SECRET_KEY_@2026_PT_SHEVA_JORDAN_BERSAMA_SECURE_TOKEN_#778899');
define('JWT_EXPIRY_SECONDS', 86400 * 7); // 7 days token validity

// JNE API Credentials
define('JNE_USERNAME', 'TESTAPI');
define('JNE_API_KEY', '2597087147ced36a0d5409c5a1bc8182');
define('JNE_HOST_PROD', 'https://apiv2.jne.co.id:10206/tracing/api');
define('JNE_HOST_DEV', 'https://apiv2.jne.co.id:10202/tracing/api');

// J&T Express API Credentials (Testing / UAT Environment)
define('JNT_USERNAME', 'SUB-PT-DODORA');
define('JNT_ORDER_KEY', 'AKe62df84bJ3d8e4b1hea2R45j11klsb');
define('JNT_ORDER_API_KEY', 'OKNECE');
define('JNT_ORDER_CREATE_URL', 'https://demo-ecommerce.inuat-jntexpress.id/jts-idn-ecommerce-api/api/order/create');
define('JNT_ORDER_CANCEL_URL', 'https://demo-ecommerce.inuat-jntexpress.id/jts-idn-ecommerce-api/api/order/cancel');
define('JNT_TARIFF_KEY', 'rL7xcBnvGli5');
define('JNT_TARIFF_CUSTOMER_NAME', 'SUB-PT-DODORA');
define('JNT_TARIFF_URL', 'https://demo-general.inuat-jntexpress.id/jandt_track/inquiry.action');
define('JNT_TRACK_USERNAME', 'SUB-PT-DODORA');
define('JNT_TRACK_PASSWORD', 'rL7xcBnvGli5');
define('JNT_TRACK_URL', 'https://demo-general.inuat-jntexpress.id/jandt_track/track/trackAction!tracking.action');

// Timezone
date_default_timezone_set('Asia/Jakarta');

